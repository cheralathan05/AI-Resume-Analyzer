# Python Resume Parser Service

A standalone **FastAPI** microservice that extracts structured data from resume
PDFs. It is part of the larger **AI Resume Analyzer** project and runs
**independently** alongside the existing React frontend and Express backend —
it does **not** modify or depend on them.

> No external LLM APIs are used. Parsing is done entirely on-device with
> **PyMuPDF** (PDF text extraction), **spaCy** (NLP / name detection) and
> **regular expressions** (emails, phones, section headings).

---

## What it extracts

`POST /parse` accepts a single PDF and returns JSON containing:

| Field        | How it's extracted                                            |
| ------------ | ------------------------------------------------------------- |
| `full_text`  | Raw text via PyMuPDF (`fitz`)                                 |
| `name`       | spaCy `PERSON` entity near the top, with a heuristic fallback |
| `email`      | Regex                                                         |
| `phone`      | Regex (8–15 digit validation)                                 |
| `skills`     | Dedicated "Skills" section **+** known-skills dictionary scan |
| `education`  | Text under an "Education" heading                             |
| `experience` | Text under an "Experience"/"Work History" heading             |
| `projects`   | Text under a "Projects" heading                               |

---

## Project structure

```
python-service/
│
├── app.py             # FastAPI app + POST /parse route (HTTP layer)
├── parser.py          # Core, framework-agnostic extraction logic
├── models.py          # Pydantic request/response schemas
├── requirements.txt   # Pinned Python dependencies
├── README.md          # This file
├── sample_resume.pdf  # A generated sample resume for quick testing
└── extracted/         # Parsed JSON output is written here per request
```

### File-by-file explanation

- **`app.py`** — The web layer. Defines the FastAPI app, CORS, the `GET /` and
  `GET /health` probes, and the main `POST /parse` endpoint. It validates the
  upload (PDF only, size cap), calls `parser.parse_resume`, maps errors to
  proper HTTP status codes (400 for bad input, 500 for server issues), persists
  a copy of the result into `extracted/`, and returns the JSON envelope.
- **`parser.py`** — All the actual parsing. Pure Python with no FastAPI imports,
  so it's easy to unit-test. Contains `extract_text`, `extract_email`,
  `extract_phone`, `extract_name`, section splitting, skills extraction, and the
  public `parse_resume(pdf_bytes)` entry point. The spaCy model is loaded lazily
  and cached.
- **`models.py`** — Pydantic models (`ContactInfo`, `ParsedResume`,
  `ParseResponse`, `ErrorResponse`) that define the API contract and power the
  auto-generated docs at `/docs`.
- **`requirements.txt`** — Pinned dependency versions for reproducible installs.
- **`sample_resume.pdf`** — A small sample resume so you can test `/parse`
  immediately.
- **`extracted/`** — Runtime output directory. Each successful parse writes a
  timestamped `*.json` file here for inspection/debugging.

---

## Setup

Requires **Python 3.9+**.

```bash
cd python-service

# 1. Create & activate a virtual environment
python -m venv venv

# Windows (PowerShell)
venv\Scripts\Activate.ps1
# macOS / Linux
# source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download the spaCy English model (one-time)
python -m spacy download en_core_web_sm
```

---

## Run

```bash
uvicorn app:app --reload --port 8000
```

- Interactive API docs (Swagger UI): http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## Usage

### cURL

```bash
curl -X POST http://localhost:8000/parse \
  -F "file=@sample_resume.pdf"
```

### Example response

```json
{
  "success": true,
  "filename": "sample_resume.pdf",
  "data": {
    "contact": {
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "phone": "+1 (555) 123-4567"
    },
    "skills": ["Python", "FastAPI", "spaCy", "Docker"],
    "education": ["B.Sc. Computer Science, Example University (2018-2022)"],
    "experience": ["Software Engineer, Acme Corp (2022-Present)"],
    "projects": ["AI Resume Analyzer - parsing microservice"],
    "full_text": "Jane Doe\njane.doe@example.com\n..."
  }
}
```

### Error responses

```json
{ "success": false, "error": "Only PDF files are supported." }
```

| Status | Meaning                                                          |
| ------ | ---------------------------------------------------------------- |
| 400    | Bad input (not a PDF, empty file, too large, no extractable text)|
| 500    | Server-side issue (e.g. spaCy model not installed)               |

---

## How it fits the bigger project

The existing **Express backend** handles resume **uploads** (`POST /api/upload`)
and intentionally does **not** parse the file. This Python service is the
component that turns an uploaded PDF into structured data. You can wire the
backend to forward stored PDFs to `POST /parse` later — but per the project
constraints, **no frontend or backend code is modified here.**

---

## Notes & limitations

- Scanned/image-only PDFs are **not** OCR'd; they will return a 400 with a clear
  message.
- Name/section detection is heuristic and works best on conventionally formatted
  resumes. The known-skills dictionary in `parser.py` can be extended freely.
```
