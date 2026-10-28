"""Resume parsing logic for the Python Resume Parser service.

This module is intentionally framework-agnostic: it knows nothing about FastAPI
and can be imported and unit-tested on its own. The public entry point is
:func:`parse_resume`, which takes raw PDF bytes and returns a structured
``dict`` matching the ``ParsedResume`` schema in ``models.py``.

Design notes
------------
* **PDF text extraction** is done with PyMuPDF (``fitz``).
* **Contact details** (email / phone) use plain regular expressions, which are
  far more reliable than NLP for these well-structured patterns.
* **Name detection** uses spaCy's ``PERSON`` named-entity recognition combined
  with positional and lexical heuristics that explicitly reject cities,
  universities, employers and job titles (so "Surat" or "Example University"
  never win over the real candidate name).
* **Sections** (skills / education / experience / projects) are detected by
  scanning for common heading keywords (with synonym + prefix matching) and
  slicing the text between headings. Non-extracted headings still act as
  boundaries so one section's text never bleeds into another.
* **Entries** inside education / experience / projects are *grouped*: a single
  real-world entry that spans several physical lines (e.g. degree + GPA, or a
  job title followed by bullet points) is merged into one list item instead of
  being split into many.

No external LLM APIs (OpenAI, Gemini, etc.) are used anywhere.
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional, Tuple

import fitz  # PyMuPDF

logger = logging.getLogger("resume_parser")

# ---------------------------------------------------------------------------
# spaCy model loading (lazy + cached)
# ---------------------------------------------------------------------------
# Loading the model is relatively expensive, so we load it once and reuse it.
# We do it lazily so that importing this module never crashes even if the model
# has not been downloaded yet (the error surfaces only when parsing is needed).

_NLP = None


def _get_nlp():
    """Return a cached spaCy pipeline, loading it on first use."""

    global _NLP
    if _NLP is None:
        try:
            import spacy

            _NLP = spacy.load("en_core_web_sm")
            logger.info("Loaded spaCy model 'en_core_web_sm'.")
        except Exception as exc:  # pragma: no cover - environment dependent
            raise RuntimeError(
                "spaCy model 'en_core_web_sm' is not available. Install it with:\n"
                "    python -m spacy download en_core_web_sm"
            ) from exc
    return _NLP


def warmup() -> None:
    """Load spaCy once at startup so the first /parse isn't slow."""
    _get_nlp()


# ---------------------------------------------------------------------------
# Regex patterns and keyword dictionaries
# ---------------------------------------------------------------------------

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

# Matches common international / local phone formats, e.g.:
#   +1 (555) 123-4567, +91-98765-43210, 9876543210, (044) 2345 6789
PHONE_RE = re.compile(
    r"(?:(?:\+|00)\d{1,3}[\s.\-]?)?"      # optional country code
    r"(?:\(\d{1,4}\)[\s.\-]?)?"            # optional area code in parens
    r"\d{2,4}(?:[\s.\-]?\d{2,4}){1,4}"     # the main number groups
)

# Extracted sections we build structured output for. Each canonical key maps to
# a list of heading synonyms. Matching is done as a *whole-word prefix* (so
# "Work Experience (5 yrs)" still matches "work experience"), and when several
# keywords match a heading the most specific (longest) one wins.
SECTION_KEYWORDS: Dict[str, List[str]] = {
    "skills": [
        "skills", "technical skills", "core competencies", "technologies",
        "technical proficiencies", "areas of expertise", "key skills",
        "skill set", "tools and technologies", "technical skill",
    ],
    "education": [
        "education", "academics", "academic", "qualification", "qualifications",
        "educational qualifications", "academic background", "education details",
    ],
    "experience": [
        "experience", "work experience", "professional experience",
        "employment", "work history", "professional background",
        "industry experience", "internship", "internships",
    ],
    "projects": [
        "projects", "personal projects", "academic projects", "project work",
        "key projects", "notable projects", "major projects", "project",
    ],
}

# Headings we do NOT extract but must still recognise so they terminate the
# previous section (prevents e.g. "Certifications" text bleeding into projects).
BOUNDARY_HEADINGS: List[str] = [
    "summary", "objective", "career objective", "profile", "about", "about me",
    "professional summary", "certifications", "certification", "courses",
    "awards", "award", "achievements", "accomplishments", "honors", "honours",
    "publications", "interests", "hobbies", "languages", "references",
    "reference", "activities", "extracurricular", "volunteer", "volunteering",
    "contact", "personal details", "personal information", "declaration",
    "strengths", "coursework",
]

# A curated skill dictionary used as a fallback / supplement to the free-text
# "Skills" section. This keeps results meaningful even for resumes that bury
# their skills inside prose instead of a dedicated section.
KNOWN_SKILLS: List[str] = [
    "python", "java", "javascript", "typescript", "c", "c++", "c#", "go", "rust",
    "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "sql", "nosql",
    "html", "css", "sass", "react", "redux", "next.js", "vue", "angular", "svelte",
    "node.js", "express", "fastapi", "flask", "django", "spring", "spring boot",
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "spacy",
    "nltk", "opencv", "matplotlib", "mongodb", "postgresql", "mysql", "sqlite",
    "redis", "elasticsearch", "kafka", "rabbitmq", "docker", "kubernetes", "aws",
    "azure", "gcp", "git", "github", "gitlab", "ci/cd", "jenkins", "terraform",
    "linux", "bash", "graphql", "rest", "grpc", "machine learning", "deep learning",
    "nlp", "computer vision", "data science", "data analysis", "tableau", "power bi",
]

# --- Lexicons used to keep a name from being a place / employer / job title ---

# Common cities / regions (with an emphasis on ones spaCy frequently mislabels
# as PERSON). This is a safety net *in addition to* spaCy's GPE/LOC detection.
_LOCATION_WORDS = {
    "surat", "ahmedabad", "mumbai", "delhi", "pune", "bangalore", "bengaluru",
    "hyderabad", "chennai", "kolkata", "jaipur", "lucknow", "kanpur", "nagpur",
    "indore", "bhopal", "patna", "vadodara", "rajkot", "gurgaon", "gurugram",
    "noida", "kochi", "coimbatore", "visakhapatnam", "nashik", "gujarat",
    "maharashtra", "karnataka", "kerala", "punjab", "rajasthan", "india",
    "usa", "uk", "city", "state", "district", "road", "street", "nagar",
    "sector", "colony", "near", "town", "village",
}

# Words that mark an organisation / educational institution.
_ORG_EDU_WORDS = {
    "university", "college", "institute", "institution", "school", "academy",
    "polytechnic", "vidyalaya", "technologies", "technology", "ltd", "limited",
    "inc", "incorporated", "pvt", "private", "corp", "corporation", "company",
    "systems", "solutions", "labs", "laboratory", "department", "faculty",
    "gmail", "yahoo", "hotmail", "outlook", "linkedin", "github",
}

# Words that mark a job title / role line (name is almost never one of these).
_TITLE_WORDS = {
    "engineer", "developer", "manager", "analyst", "consultant", "designer",
    "intern", "student", "administrator", "architect", "scientist", "specialist",
    "officer", "lead", "senior", "junior", "freelancer", "programmer",
    "executive", "associate", "trainee", "professional",
}

# Lowercase name particles that are allowed even though they are not capitalised
# (e.g. "van der Berg", "de Souza").
_NAME_CONNECTORS = {
    "van", "von", "der", "den", "de", "da", "di", "del", "della", "la", "le",
    "bin", "al", "ibn", "e",
}

# All heading words, used to stop a heading line from being read as a name.
_ALL_HEADING_WORDS = set()
for _kws in SECTION_KEYWORDS.values():
    for _kw in _kws:
        _ALL_HEADING_WORDS.update(_kw.split())
for _kw in BOUNDARY_HEADINGS:
    _ALL_HEADING_WORDS.update(_kw.split())

_NAME_BLOCKLIST = (
    _LOCATION_WORDS | _ORG_EDU_WORDS | _TITLE_WORDS | _ALL_HEADING_WORDS
)

# Year / date signals reused by the entry-grouping heuristics.
_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")
_PRESENT_RE = re.compile(r"\b(present|current|till date|ongoing|now)\b", re.IGNORECASE)
_DEGREE_RE = re.compile(
    r"\b("
    r"b\.?\s?sc|m\.?\s?sc|b\.?\s?tech|m\.?\s?tech|b\.?\s?e|m\.?\s?e|"
    r"b\.?\s?a|m\.?\s?a|b\.?\s?com|m\.?\s?com|bachelor|master|masters|"
    r"ph\.?\s?d|mba|bba|bca|mca|b\.?\s?ed|diploma|"
    r"h\.?s\.?c|s\.?s\.?c|higher secondary|senior secondary|secondary"
    r")\b",
    re.IGNORECASE,
)
_TITLE_SEPARATOR_RE = re.compile(r"\s[-\u2013\u2014|]\s")  # " - ", " – ", " — ", " | "
_BULLET_CHARS = "-•*·●▪◦‣"
_BULLET_RE = re.compile(r"^[\s" + re.escape(_BULLET_CHARS) + r"]+")


# ---------------------------------------------------------------------------
# Step 1: PDF -> text
# ---------------------------------------------------------------------------

def extract_text(pdf_bytes: bytes) -> str:
    """Extract the full plain text from a PDF given as raw bytes.

    Raises ``ValueError`` if the bytes do not represent a readable PDF.
    """

    if not pdf_bytes:
        raise ValueError("Empty file: no PDF bytes received.")

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:
        raise ValueError(f"Could not open file as PDF: {exc}") from exc

    try:
        pages_text = [page.get_text("text") for page in doc]
    finally:
        doc.close()

    text = "\n".join(pages_text).strip()
    if not text:
        raise ValueError(
            "No extractable text found. The PDF may be scanned/image-only "
            "(OCR is not supported by this service)."
        )
    return text


# ---------------------------------------------------------------------------
# Step 2: contact details (regex + spaCy)
# ---------------------------------------------------------------------------

def extract_email(text: str) -> Optional[str]:
    """Return the first email address found, or ``None``."""

    match = EMAIL_RE.search(text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    """Return the first plausible phone number found, or ``None``.

    We require at least 8 digits in the matched span to avoid picking up
    things like years, zip codes or short numeric IDs.
    """

    for candidate in PHONE_RE.finditer(text):
        raw = candidate.group(0).strip()
        digits = re.sub(r"\D", "", raw)
        if 8 <= len(digits) <= 15:
            return re.sub(r"\s{2,}", " ", raw)
    return None


def _looks_like_name_line(line: str) -> bool:
    """Heuristic test for "is this line plausibly a person's full name?".

    Rejects lines that contain digits/emails, are too long, are the wrong
    length in words, or whose words hit the location / organisation / job-title
    / heading blocklists (this is what stops "Surat" or "Example University"
    from being treated as a name).
    """

    if not line or "@" in line or any(ch.isdigit() for ch in line):
        return False
    if len(line) > 40:
        return False

    tokens = line.split()
    if not (2 <= len(tokens) <= 4):
        return False

    low_tokens = [t.lower().strip(".,") for t in tokens]
    for lt in low_tokens:
        if lt in _NAME_BLOCKLIST:
            return False

    for token, lt in zip(tokens, low_tokens):
        if lt in _NAME_CONNECTORS:
            continue
        # Each real name word must be capitalised (Titlecase or ALLCAPS) and
        # contain only letters plus a few name punctuation marks.
        if not re.match(r"^[A-Z][A-Za-z.\-']*$", token):
            return False
    return True


def _clean_name(line: str) -> str:
    """Normalise whitespace in a detected name line."""

    return re.sub(r"\s{2,}", " ", line).strip()


def extract_name(text: str) -> Optional[str]:
    """Best-effort full-name extraction that resists common false positives.

    Strategy (in priority order):
    1. Run spaCy over the header to learn which spans are ``GPE``/``LOC``/``ORG``
       (locations, employers, universities) and which are ``PERSON``.
    2. Return the first top-of-document line that *looks* like a name **and**
       spaCy also recognises as a ``PERSON`` (strongest signal).
    3. Otherwise return the first top-of-document line that looks like a name
       and is not flagged as a location/organisation (names sit at the very
       top; this positional bias avoids picking a city mentioned lower down).
    4. As a last resort, return the first spaCy ``PERSON`` entity that passes
       the name heuristics and is not also a location/organisation.
    """

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    header = lines[:12]
    if not header:
        return None

    gpe_org: set = set()
    person_ents: List[str] = []
    try:
        nlp = _get_nlp()
        doc = nlp("\n".join(header))
        for ent in doc.ents:
            first_line = ent.text.split("\n", 1)[0].strip()
            if ent.label_ in ("GPE", "LOC", "ORG", "FAC"):
                gpe_org.add(first_line.lower())
            elif ent.label_ == "PERSON":
                person_ents.append(first_line)
    except Exception as exc:  # pragma: no cover - model issues
        logger.warning("spaCy name detection failed, using fallback: %s", exc)

    person_lower = {p.lower() for p in person_ents}

    def acceptable(line: str) -> bool:
        return _looks_like_name_line(line) and line.lower() not in gpe_org

    # 2. Header line confirmed as a PERSON by spaCy.
    for line in header:
        if acceptable(line) and line.lower() in person_lower:
            return _clean_name(line)

    # 3. First acceptable header line (positional bias: names are at the top).
    for line in header:
        if acceptable(line):
            return _clean_name(line)

    # 4. Any spaCy PERSON entity that is not a location/org and looks like a name.
    for person in person_ents:
        if _looks_like_name_line(person) and person.lower() not in gpe_org:
            return _clean_name(person)

    return None


# ---------------------------------------------------------------------------
# Step 3: section detection
# ---------------------------------------------------------------------------

def _match_heading(line: str) -> Optional[str]:
    """Classify a line as a section heading.

    Returns the canonical section name for an extracted section, the sentinel
    ``"_boundary"`` for a recognised-but-not-extracted heading, or ``None`` if
    the line is not a heading.

    Robustness features:
    * leading bullets / numbering and trailing colons are stripped;
    * matching is a whole-word *prefix* match, so decorated headings such as
      "WORK EXPERIENCE:" or "Experience (2019-2023)" are still recognised;
    * when multiple keywords match, the most specific (longest) one wins, so
      "Academic Projects" resolves to *projects*, not *education*.
    """

    raw = line.strip()
    if not raw:
        return None

    # Strip leading bullets / numbering (e.g. "1.", "-", "•") and trailing colon.
    cleaned = re.sub(r"^[\s\d\.\)\-•*·●▪◦]+", "", raw).strip().rstrip(":").strip()
    low = re.sub(r"[^a-z ]", " ", cleaned.lower())
    words = low.split()
    if not words or len(words) > 5:
        return None

    best_canonical: Optional[str] = None
    best_len = 0

    def consider(canonical: str, keyword: str) -> None:
        nonlocal best_canonical, best_len
        kw_words = keyword.split()
        n = len(kw_words)
        if words[:n] == kw_words and (len(words) - n) <= 2 and n > best_len:
            best_canonical, best_len = canonical, n

    for canonical, keywords in SECTION_KEYWORDS.items():
        for keyword in keywords:
            consider(canonical, keyword)
    for keyword in BOUNDARY_HEADINGS:
        consider("_boundary", keyword)

    return best_canonical


def _split_into_sections(text: str) -> Dict[str, str]:
    """Slice the resume text into sections keyed by canonical section name.

    Everything between two headings is the body of the first heading's section.
    Recognised-but-not-extracted headings (see :data:`BOUNDARY_HEADINGS`) reset
    the "current section" to ``None`` so their content is never absorbed into
    the preceding extracted section (this is what prevents section bleed).
    """

    sections: Dict[str, List[str]] = {}
    current: Optional[str] = None

    for line in text.splitlines():
        heading = _match_heading(line)
        if heading is not None:
            if heading == "_boundary":
                current = None  # stop capturing; do not bleed into prev section
            else:
                current = heading
                sections.setdefault(current, [])
            continue
        if current is not None and line.strip():
            sections[current].append(line.strip())

    return {key: "\n".join(value).strip() for key, value in sections.items()}


# ---------------------------------------------------------------------------
# Step 4: line helpers + entry grouping
# ---------------------------------------------------------------------------

def _iter_clean_lines(block: str) -> List[Tuple[str, bool]]:
    """Return ``(text, was_bullet)`` for each non-empty line of a section block.

    ``text`` has any leading bullet / dash markers stripped; ``was_bullet``
    records whether the original line started with such a marker (used by the
    grouping heuristics to decide entry boundaries).
    """

    out: List[Tuple[str, bool]] = []
    for raw in block.splitlines():
        stripped = raw.strip()
        if not stripped:
            continue
        was_bullet = bool(_BULLET_RE.match(stripped)) and stripped[0] in _BULLET_CHARS
        clean = _BULLET_RE.sub("", stripped).strip()
        if clean:
            out.append((clean, was_bullet))
    return out


def _finalize(entries: List[str]) -> List[str]:
    """Collapse whitespace and drop empties for a list of grouped entries."""

    result = []
    for entry in entries:
        collapsed = re.sub(r"\s{2,}", " ", entry).strip(" \t-–—:").strip()
        if collapsed:
            result.append(collapsed)
    return result


def _clean_items(block: str) -> List[str]:
    """Turn a free-text section block into a list of clean line items.

    Retained for backward compatibility; the section extractors below use the
    smarter grouping helpers instead.
    """

    return [clean for clean, _ in _iter_clean_lines(block)]


def extract_education(sections: Dict[str, str]) -> List[str]:
    """Group the education block into one item per qualification.

    A degree keyword (B.Sc, B.Tech, Bachelor, MBA, Diploma, …) anchors an
    entry. Institute / year / GPA / coursework lines attach to the current
    entry rather than becoming separate items. A new entry begins on a degree
    line only once the current entry already contains a degree — so a
    degree-line + institute-line pair for the *same* qualification is not split.
    """

    lines = _iter_clean_lines(sections.get("education", ""))
    entries: List[str] = []
    current: List[str] = []
    current_has_degree = False

    for clean, _bullet in lines:
        is_degree = bool(_DEGREE_RE.search(clean))
        if current and is_degree and current_has_degree:
            entries.append(" ".join(current))
            current = [clean]
            current_has_degree = True
        else:
            current.append(clean)
            current_has_degree = current_has_degree or is_degree

    if current:
        entries.append(" ".join(current))
    return _finalize(entries)


def extract_experience(sections: Dict[str, str]) -> List[str]:
    """Group the experience block into one item per role.

    A non-bullet line carrying a date/year or "Present" anchors a role. Bullet
    points and description lines attach to the current role. A new role starts
    on another dated header only once the current entry already has a date — so
    a role-line, company-line and date-line describing the *same* job stay
    together.
    """

    lines = _iter_clean_lines(sections.get("experience", ""))
    entries: List[str] = []
    current: List[str] = []
    current_has_date = False

    for clean, was_bullet in lines:
        has_date = bool(_YEAR_RE.search(clean) or _PRESENT_RE.search(clean))
        is_header = has_date and not was_bullet
        if current and is_header and current_has_date:
            entries.append(" ".join(current))
            current = [clean]
            current_has_date = True
        else:
            current.append(clean)
            current_has_date = current_has_date or has_date

    if current:
        entries.append(" ".join(current))
    return _finalize(entries)


def _ends_sentence(text: str) -> bool:
    return text.rstrip().endswith((".", "!", "?"))


# Lines that start with an action verb are descriptions, not project titles
# ("Built a parser" must never become its own project).
_PROJECT_VERB_RE = re.compile(
    r"^(built|build|implemented|developed|created|designed|deployed|added|"
    r"integrated|worked|used|led|managed|improved|optimized|configured|"
    r"wrote|handled|enabled|automated|refactored|engineered|"
    r"architected|delivered|launched|maintained|tested|fixed|resolved|"
    r"collaborated|contributed|achieved|increased|reduced|migrated|"
    r"tracked|parsed|scored|extracted)\b",
    re.IGNORECASE,
)


def _looks_like_tech_stack(text: str) -> bool:
    """True for a comma-separated skill list sitting under a project title.

    ``Title | React, Node`` is a header (has a title separator), not a stack
    row. Only a bare comma list such as ``React, Express, FastAPI`` counts.
    """

    if _TITLE_SEPARATOR_RE.search(text):
        return False
    chunks = [c.strip() for c in text.split(",") if c.strip()]
    if len(chunks) < 2:
        return False
    return all(1 <= len(chunk.split()) <= 3 for chunk in chunks)


def _is_project_header(clean: str, was_bullet: bool) -> bool:
    """Decide whether a line starts a *new* project rather than describing one.

    Real resumes almost always look like::

        Title | stack
        • description bullet
        • another bullet

    Treating every bullet as a new project is what produced 7–9 fake entries
    from 2 real ones. Description bullets therefore attach to the current
    project. A new project starts only on a title-like line.
    """

    if _looks_like_tech_stack(clean) or _PROJECT_VERB_RE.match(clean):
        return False

    has_separator = bool(_TITLE_SEPARATOR_RE.search(clean))
    starts_upper = clean[:1].isupper()
    words = clean.split()
    short_title = (
        starts_upper
        and not _ends_sentence(clean)
        and 1 <= len(words) <= 8
    )

    if was_bullet:
        # "• PlaceTrack — placement tracker" is a titled project.
        # "• Built the upload pipeline" is a description of the current one.
        return has_separator and starts_upper and len(words) <= 16

    return has_separator or short_title


def extract_projects(sections: Dict[str, str]) -> List[str]:
    """Group the projects block into one item per real project.

    A new project starts only on a title signal — ``Title | stack``,
    ``Title - description``, or a short Title-Case header. Bullet points and
    wrapped description / tech-stack lines attach to the current project.
    """

    lines = _iter_clean_lines(sections.get("projects", ""))
    entries: List[str] = []
    current: List[str] = []

    for clean, was_bullet in lines:
        if current and _is_project_header(clean, was_bullet):
            entries.append(" ".join(current))
            current = [clean]
        else:
            current.append(clean)

    if current:
        entries.append(" ".join(current))
    return _finalize(entries)


# ---------------------------------------------------------------------------
# Step 5: skills extraction
# ---------------------------------------------------------------------------

def _tokenize_skills_block(block: str) -> List[str]:
    """Split a free-text "Skills" block into candidate skill tokens.

    Handles category-prefixed lines ("Languages: Python, Java" -> Python, Java)
    and splits each line on commas / semicolons / pipes / bullets. Slashes are
    deliberately *not* split on so "CI/CD" survives.
    """

    tokens: List[str] = []
    for raw in block.splitlines():
        line = raw.strip().lstrip(_BULLET_CHARS).strip()
        if not line:
            continue
        # Drop a leading "Category:" label but keep the listed skills after it.
        label = re.match(r"^[A-Za-z/&+ ]{1,30}:\s*(.+)$", line)
        if label:
            line = label.group(1)
        for chunk in re.split(r"[,;|•·]", line):
            token = chunk.strip(" \t-:·•").strip()
            if token:
                tokens.append(token)
    return tokens


def _is_valid_skill(token: str) -> bool:
    """Reject prose / sentences that leak into a Skills section."""

    if not token or len(token) > 40:
        return False
    words = token.split()
    if len(words) > 4:  # real skills are short ("machine learning", "power bi")
        return False
    if token.endswith(".") and len(words) > 2:  # trailing period => a sentence
        return False
    if not re.search(r"[A-Za-z]", token):
        return False
    return True


def extract_skills(text: str, sections: Dict[str, str]) -> List[str]:
    """Extract skills from the dedicated section plus a known-skills scan.

    Improvements over naive splitting: category labels are stripped, prose
    sentences are filtered out, and the result is de-duplicated
    case-insensitively (so "React" and "react" never both appear).
    """

    found: List[str] = []

    # 1. Parse the dedicated "Skills" section if present.
    skills_block = sections.get("skills", "")
    if skills_block:
        for token in _tokenize_skills_block(skills_block):
            if _is_valid_skill(token):
                found.append(token)

    # 2. Supplement with dictionary matches anywhere in the document (catches
    #    skills that only appear in prose). These are known, real skills.
    lowered = text.lower()
    for skill in KNOWN_SKILLS:
        pattern = r"(?<![a-zA-Z0-9+#.])" + re.escape(skill) + r"(?![a-zA-Z0-9+#.])"
        if re.search(pattern, lowered):
            found.append(skill)

    # Deduplicate case-insensitively while preserving order (section entries,
    # which keep their original casing, take precedence over dictionary hits).
    seen = set()
    unique: List[str] = []
    for skill in found:
        key = skill.lower()
        if key not in seen:
            seen.add(key)
            unique.append(skill)
    return unique


def extract_section_items(sections: Dict[str, str], name: str) -> List[str]:
    """Return cleaned line items for a given canonical section name.

    Retained for backward compatibility. New code should prefer the grouping
    extractors (:func:`extract_education`, :func:`extract_experience`,
    :func:`extract_projects`).
    """

    return _clean_items(sections.get(name, ""))


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def parse_resume(pdf_bytes: bytes) -> dict:
    """Parse a resume PDF (as bytes) into a structured dictionary.

    The returned dict matches the ``ParsedResume`` Pydantic model.
    """

    text = extract_text(pdf_bytes)
    sections = _split_into_sections(text)

    return {
        "contact": {
            "name": extract_name(text),
            "email": extract_email(text),
            "phone": extract_phone(text),
        },
        "skills": extract_skills(text, sections),
        "education": extract_education(sections),
        "experience": extract_experience(sections),
        "projects": extract_projects(sections),
        "full_text": text,
    }
