const fs = require("fs");
const { PDFParse } = require("pdf-parse");

/**
 * Native Node.js Resume Parser.
 * Uses `pdf-parse` for text extraction and robust regex/rule-based heuristics
 * for structured data extraction. Guarantees resume analysis works 100% out of
 * the box without requiring external Python environments.
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

function extractPhone(text) {
  if (!text) return null;
  const matches = text.match(/(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{3,5}(?:[\s.-]?\d{1,5})?/g);
  if (!matches) return null;
  for (const m of matches) {
    const digits = m.replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 15) {
      return m.trim();
    }
  }
  return null;
}const PHONE_RE = /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(\d{1,4}\)[\s.-]?)?\d{2,4}(?:[\s.-]?\d{2,4}){1,4}/;

const DEGREE_RE = /\b(b\.?\s?sc|m\.?\s?sc|b\.?\s?tech|m\.?\s?tech|b\.?\s?e|m\.?\s?e|b\.?\s?a|m\.?\s?a|b\.?\s?com|m\.?\s?com|bachelor|master|masters|ph\.?\s?d|mba|bba|bca|mca|b\.?\s?ed|diploma|h\.?s\.?c|s\.?s\.?c|higher secondary|secondary)\b/i;
const YEAR_RE = /\b(19|20)\d{2}\b/;
const PRESENT_RE = /\b(present|current|till date|ongoing|now)\b/i;


const SECTION_KEYWORDS = {
  skills: [
    "skills", "technical skills", "core competencies", "technologies",
    "technical proficiencies", "areas of expertise", "key skills",
    "skill set", "tools and technologies", "technical skill",
  ],
  education: [
    "education", "academics", "academic", "qualification", "qualifications",
    "educational qualifications", "academic background", "education details",
  ],
  experience: [
    "experience", "work experience", "employment history", "work history",
    "professional experience", "internships", "internship experience",
    "career history", "relevant experience",
  ],
  projects: [
    "projects", "academic projects", "key projects", "personal projects",
    "technical projects", "featured projects", "major projects",
  ],
};

const BOUNDARY_HEADINGS = [
  "certifications", "certificates", "licenses", "awards", "honors",
  "publications", "volunteer", "volunteering", "achievements", "interests",
  "hobbies", "languages", "references", "summary", "profile",
  "professional summary", "about me",
];

const KNOWN_SKILLS = [
  // Programming Languages
  "javascript", "typescript", "python", "java", "c++", "c#", "ruby", "php",
  "go", "golang", "rust", "swift", "kotlin", "scala", "dart", "sql", "r",
  "html", "html5", "css", "css3", "sass", "scss", "bash", "shell",
  // Frameworks & Libraries
  "react", "react.js", "reactjs", "next.js", "nextjs", "vue", "vue.js",
  "angular", "svelte", "express", "express.js", "nestjs", "node.js", "nodejs",
  "django", "flask", "fastapi", "spring", "spring boot", "asp.net", "laravel",
  "tailwind", "tailwindcss", "bootstrap", "material-ui", "mui", "redux",
  // Databases & Storage
  "mongodb", "postgresql", "postgres", "mysql", "sqlite", "redis",
  "elasticsearch", "cassandra", "dynamodb", "mariadb", "firebase", "supabase",
  // Cloud & DevOps
  "aws", "amazon web services", "azure", "google cloud", "gcp", "docker",
  "kubernetes", "k8s", "terraform", "ansible", "ci/cd", "jenkins", "github actions",
  "gitlab", "nginx", "apache", "linux", "git", "rest", "restful", "graphql",
  // AI, ML & Data
  "machine learning", "deep learning", "nlp", "computer vision", "pandas",
  "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "opencv",
  "spacy", "hugging face", "llm", "ollama", "langchain", "prompt engineering",
  // Tools & Others
  "jira", "postman", "figma", "jest", "cypress", "webpack", "vite", "agile", "scrum"
];

const TITLE_WORDS = new Set([
  "engineer", "developer", "manager", "analyst", "consultant", "designer",
  "intern", "student", "architect", "scientist", "specialist", "officer",
  "lead", "senior", "junior", "programmer", "associate", "trainee"
]);

const ORG_WORDS = new Set([
  "university", "college", "institute", "school", "technologies", "ltd",
  "inc", "pvt", "corp", "company", "systems", "solutions", "labs"
]);

/**
 * Extracts plain text from PDF buffer.
 */
async function extractPdfText(pdfBuffer) {
  const parser = new PDFParse({ data: pdfBuffer });
  try {
    const result = await parser.getText();
    const text = result?.text || (result?.pages ? result.pages.map(p => p.text).join("\n") : "");
    if (!text || !text.trim()) {
      throw new Error("No extractable text found in PDF. Scanned images are not supported without OCR.");
    }
    return text.trim();
  } finally {
    await parser.destroy();
  }
}

/**
 * Identifies if a line is a section heading.
 */
function matchHeading(line) {
  if (!line) return null;
  const cleaned = line.replace(/^[\s\d.)\-•*·●▪◦]+/, "").trim().replace(/:$/, "").trim();
  const low = cleaned.toLowerCase().replace(/[^a-z ]/g, " ");
  const words = low.split(/\s+/).filter(Boolean);
  if (!words.length || words.length > 5) return null;

  let best = null;
  let bestLen = 0;

  for (const [canonical, kws] of Object.entries(SECTION_KEYWORDS)) {
    for (const kw of kws) {
      const kwWords = kw.split(/\s+/);
      const n = kwWords.length;
      if (words.slice(0, n).join(" ") === kw && words.length - n <= 2 && n > bestLen) {
        best = canonical;
        bestLen = n;
      }
    }
  }

  for (const b of BOUNDARY_HEADINGS) {
    const bWords = b.split(/\s+/);
    const n = bWords.length;
    if (words.slice(0, n).join(" ") === b && words.length - n <= 2 && n > bestLen) {
      best = "_boundary";
      bestLen = n;
    }
  }

  return best;
}

/**
 * Slices resume text into sections.
 */
function splitIntoSections(text) {
  const sections = {};
  let current = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = matchHeading(line);
    if (heading !== null) {
      if (heading === "_boundary") {
        current = null;
      } else {
        current = heading;
        if (!sections[current]) sections[current] = [];
      }
      continue;
    }

    if (current) {
      sections[current].push(line);
    }
  }

  const out = {};
  for (const [k, v] of Object.entries(sections)) {
    out[k] = v.join("\n").trim();
  }
  return out;
}

/**
 * Extracts candidate name from header lines.
 */
function extractName(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    // Skip lines with email or phone or URLs
    if (EMAIL_RE.test(line) || PHONE_RE.test(line) || /https?:\/\/|www\./i.test(line)) continue;
    if (line.length < 3 || line.length > 40) continue;

    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4) {
      const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z]/g, ""));
      const isJobTitle = lowerWords.some(w => TITLE_WORDS.has(w));
      const isOrg = lowerWords.some(w => ORG_WORDS.has(w));
      if (!isJobTitle && !isOrg && words.every(w => /^[A-Z]/.test(w) || /^(van|von|der|de|di|al)$/i.test(w))) {
        return line.replace(/[^a-zA-Z\s'-]/g, "").trim();
      }
    }
  }
  // Fallback to first line with alpha chars
  for (const line of lines.slice(0, 5)) {
    if (!EMAIL_RE.test(line) && !PHONE_RE.test(line) && /^[A-Za-z\s'-]{3,35}$/.test(line)) {
      return line.trim();
    }
  }
  return "Candidate";
}

/**
 * Extracts skills from the skills section + known vocabulary.
 */
function extractSkills(text, sections) {
  const found = new Set();
  const list = [];

  function addSkill(s) {
    const trimmed = s.trim();
    if (!trimmed || trimmed.length > 35 || trimmed.length < 2) return;
    const lower = trimmed.toLowerCase();
    if (!found.has(lower)) {
      found.add(lower);
      list.push(trimmed);
    }
  }

  // 1. From dedicated skills section
  const skillsText = sections.skills || "";
  if (skillsText) {
    for (const rawLine of skillsText.split("\n")) {
      let line = rawLine.replace(/^[\s\-•*·●▪◦]+/, "").trim();
      // Drop prefix like "Languages:" or "Frameworks:"
      line = line.replace(/^[A-Za-z/&+ ]{1,25}:\s*/, "");
      const tokens = line.split(/[,;|•·]/).map(t => t.trim()).filter(Boolean);
      for (const tok of tokens) {
        if (tok.length <= 35 && !tok.endsWith(".")) {
          addSkill(tok);
        }
      }
    }
  }

  // 2. Scan entire resume text for known technologies
  const lowerText = text.toLowerCase();
  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?<![a-zA-Z0-9+#.])${escaped}(?![a-zA-Z0-9+#.])`, "i");
    if (regex.test(lowerText)) {
      addSkill(skill);
    }
  }

  return list;
}

/**
 * Groups education lines.
 */
function extractEducation(sections) {
  const text = sections.education || "";
  if (!text) return [];

  const lines = text.split("\n").map(l => l.replace(/^[\s\-•*·●▪◦]+/, "").trim()).filter(Boolean);
  const entries = [];
  let current = [];
  let currentHasDegree = false;

  for (const line of lines) {
    const isDegree = DEGREE_RE.test(line);
    if (current.length && isDegree && currentHasDegree) {
      entries.push(current.join(" - "));
      current = [line];
      currentHasDegree = true;
    } else {
      current.push(line);
      if (isDegree) currentHasDegree = true;
    }
  }
  if (current.length) entries.push(current.join(" - "));
  return entries.slice(0, 10);
}

/**
 * Groups experience lines.
 */
function extractExperience(sections) {
  const text = sections.experience || "";
  if (!text) return [];

  const lines = text.split("\n").map(l => l.replace(/^[\s\-•*·●▪◦]+/, "").trim()).filter(Boolean);
  const entries = [];
  let current = [];
  let currentHasDate = false;

  for (const line of lines) {
    const hasDate = YEAR_RE.test(line) || PRESENT_RE.test(line);
    if (current.length && hasDate && currentHasDate) {
      entries.push(current.join(" | "));
      current = [line];
      currentHasDate = true;
    } else {
      current.push(line);
      if (hasDate) currentHasDate = true;
    }
  }
  if (current.length) entries.push(current.join(" | "));
  return entries.slice(0, 15);
}

/**
 * Groups project lines.
 */
function extractProjects(sections) {
  const text = sections.projects || "";
  if (!text) return [];

  const lines = text.split("\n").map(l => l.replace(/^[\s\-•*·●▪◦]+/, "").trim()).filter(Boolean);
  const entries = [];
  let current = [];

  for (const line of lines) {
    if (current.length >= 3) {
      entries.push(current.join(" - "));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) entries.push(current.join(" - "));
  return entries.slice(0, 10);
}

/**
 * Parses raw plain text resume.
 * @param {string} fullText
 * @returns {object} Structured parsed resume
 */
function parseResumeText(fullText) {
  const cleanText = (fullText || "").trim();
  const sections = splitIntoSections(cleanText);

  const emailMatch = cleanText.match(EMAIL_RE);
  const phone = extractPhone(cleanText);
  const name = extractName(cleanText);

  const contact = {
    name: name || "Candidate",
    email: emailMatch ? emailMatch[0] : null,
    phone: phone || null,
  };

  const skills = extractSkills(cleanText, sections);
  const education = extractEducation(sections);
  const experience = extractExperience(sections);
  const projects = extractProjects(sections);

  return {
    contact,
    skills,
    education,
    experience,
    projects,
    full_text: cleanText,
  };
}

/**
 * Primary parse function for binary PDF buffers.
 * @param {Buffer} pdfBuffer
 * @returns {Promise<object>} Structured parsed resume
 */
async function parseResumeBuffer(pdfBuffer) {
  const fullText = await extractPdfText(pdfBuffer);
  return parseResumeText(fullText);
}

module.exports = {
  parseResumeBuffer,
  parseResumeText,
  extractPdfText,
};
