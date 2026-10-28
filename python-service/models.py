"""Pydantic data models for the Resume Parser service.

These schemas define the shape of the JSON returned by ``POST /parse`` and
give FastAPI everything it needs to auto-generate request/response docs at
``/docs``. Keeping them in a dedicated module makes the contract explicit and
decoupled from the extraction logic in ``parser.py``.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    """Personal / contact details extracted from the resume."""

    name: Optional[str] = Field(
        default=None, description="Candidate's full name (best-effort)."
    )
    email: Optional[str] = Field(default=None, description="First email found.")
    phone: Optional[str] = Field(
        default=None, description="First phone number found (normalized)."
    )


class ParsedResume(BaseModel):
    """Complete structured result for a single parsed resume."""

    contact: ContactInfo
    skills: List[str] = Field(default_factory=list)
    education: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    full_text: str = Field(description="Raw text extracted from the PDF.")


class ParseResponse(BaseModel):
    """Top-level API envelope returned by ``POST /parse``."""

    success: bool = True
    filename: str
    data: ParsedResume


class ErrorResponse(BaseModel):
    """Standard error envelope for failed requests."""

    success: bool = False
    error: str
