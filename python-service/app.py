"""FastAPI application exposing the Resume Parser service.

Run locally with:

    uvicorn app:app --reload --port 8000

Endpoints
---------
* ``GET  /``       -> tiny health/info payload
* ``GET  /health`` -> liveness probe
* ``POST /parse``  -> accept a PDF (multipart form field ``file``) and return
                      structured resume JSON.

This service is fully self-contained and does NOT call any external LLM APIs.
It is meant to run alongside the existing Express backend, not replace it.
"""

from __future__ import annotations

import json
import logging
import os
import threading
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import ErrorResponse, ParseResponse
from parser import parse_resume, warmup

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resume_parser.app")

# Directory where parsed JSON results are persisted for inspection/debugging.
EXTRACTED_DIR = os.path.join(os.path.dirname(__file__), "extracted")
os.makedirs(EXTRACTED_DIR, exist_ok=True)

MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB upload cap


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load spaCy in the background so /health can respond during cold start.
    def _background_warmup() -> None:
        try:
            warmup()
            logger.info("spaCy model preloaded.")
        except Exception as exc:
            logger.warning("Model preload failed, will load on first parse: %s", exc)

    threading.Thread(target=_background_warmup, name="spacy-warmup", daemon=True).start()
    yield


app = FastAPI(
    title="AI Resume Analyzer - Python Parser Service",
    description="Extracts structured data from resume PDFs using PyMuPDF + spaCy.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the React frontend / Express backend to call this service in dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict:
    """Basic service metadata."""

    return {
        "service": "python-resume-parser",
        "status": "ok",
        "endpoints": ["GET /health", "POST /parse"],
    }


@app.get("/health")
def health() -> dict:
    """Liveness probe used by orchestrators / uptime checks."""

    return {"status": "healthy"}


@app.post(
    "/parse",
    response_model=ParseResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def parse(file: UploadFile = File(...)) -> JSONResponse:
    """Accept a single PDF upload and return structured resume data."""

    # --- Validate content type / extension -------------------------------
    filename = file.filename or "resume.pdf"
    is_pdf = (file.content_type == "application/pdf") or filename.lower().endswith(
        ".pdf"
    )
    if not is_pdf:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Only PDF files are supported."},
        )

    # --- Read + size-guard the upload ------------------------------------
    try:
        contents = await file.read()
    except Exception as exc:  # pragma: no cover - I/O edge case
        logger.exception("Failed reading upload")
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": f"Could not read upload: {exc}"},
        )
    finally:
        await file.close()

    if not contents:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Uploaded file is empty."},
        )
    if len(contents) > MAX_FILE_BYTES:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": f"File too large (max {MAX_FILE_BYTES // (1024 * 1024)} MB).",
            },
        )

    # --- Parse ------------------------------------------------------------
    try:
        parsed = parse_resume(contents)
    except ValueError as exc:
        # Expected, user-facing problems (bad PDF, no text, etc.)
        return JSONResponse(
            status_code=400, content={"success": False, "error": str(exc)}
        )
    except RuntimeError as exc:
        # Server misconfiguration (e.g. spaCy model missing).
        logger.exception("Parser runtime error")
        return JSONResponse(
            status_code=500, content={"success": False, "error": str(exc)}
        )
    except Exception as exc:  # pragma: no cover - unexpected
        logger.exception("Unexpected parsing error")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Unexpected error: {exc}"},
        )

    # --- Persist a copy of the result for debugging ----------------------
    try:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        safe_name = os.path.splitext(os.path.basename(filename))[0]
        out_path = os.path.join(EXTRACTED_DIR, f"{safe_name}_{stamp}.json")
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump(parsed, fh, ensure_ascii=False, indent=2)
    except Exception as exc:  # non-fatal: persistence is best-effort
        logger.warning("Could not write extracted JSON: %s", exc)

    return JSONResponse(
        status_code=200,
        content={"success": True, "filename": filename, "data": parsed},
    )
