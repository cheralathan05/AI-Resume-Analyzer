/**
 * ATS (Applicant Tracking System) Engine.
 *
 * Pure, dependency-free scoring logic that compares a *parsed resume* (the
 * structured JSON produced by the Python FastAPI parser) against a free-text
 * *job description* and reports how well the resume would perform against a
 * keyword-driven ATS.
 *
 * The module is intentionally side-effect free: every helper is a small, pure
 * function so the pieces can be unit-tested in isolation and recombined. The
 * single public entry point is {@link analyzeResume}.
 *
 * Parsed resume shape (from the parser service):
 *   {
 *     contact:    { name, email, phone },
 *     skills:     string[],
 *     education:  string[],
 *     experience: string[],
 *     projects:   string[],
 *     full_text:  string
 *   }
 */

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

/**
 * Relative contribution of each signal to the final ATS score. Must sum to 1.
 * - keywordMatch: how many JD keywords appear anywhere in the resume.
 * - skillMatch:   how many JD keywords are backed by an explicit resume skill.
 * - completeness: whether the resume has all the sections ATS parsers expect.
 */
const SCORE_WEIGHTS = {
  keywordMatch: 0.45,
  skillMatch: 0.35,
  completeness: 0.2,
};

/**
 * Very common English words (plus generic job-posting filler) that carry no
 * signal as ATS keywords.
 *
 * NOTE: {@link stem} runs BEFORE this set is consulted, so only the *canonical*
 * (singular / base) form of a filler word needs to be listed here — e.g.
 * "applications" is folded to "application" and "developers" to "developer"
 * before the lookup, so listing the singular alone is enough.
 */
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "else", "for", "of",
  "to", "in", "on", "at", "by", "with", "from", "as", "is", "are", "was",
  "were", "be", "been", "being", "this", "that", "these", "those", "it",
  "its", "we", "you", "your", "our", "they", "their", "he", "she", "his",
  "her", "i", "me", "my", "us", "will", "shall", "can", "could", "would",
  "should", "may", "might", "must", "do", "does", "did", "have", "has",
  "had", "not", "no", "yes", "so", "than", "too", "very", "just", "into",
  "over", "under", "about", "more", "most", "some", "any", "all", "each",
  "who", "whom", "which", "what", "when", "where", "why", "how", "up",
  "down", "out", "off", "again", "once", "here", "there", "such", "only",
  "own", "same", "other", "while", "during", "per", "via", "across", "within",
  // Generic job-posting filler that would otherwise dominate keyword lists.
  "experience", "work", "role", "responsibility", "requirement", "required",
  "require", "preferred", "prefer", "preference", "ability", "able", "team",
  "company", "candidate", "job", "position", "looking", "look", "join",
  "including", "include", "etc", "year", "strong", "good", "excellent",
  "knowledge", "skill", "plus", "seeking", "seek", "hire", "hiring",
  "understand", "understanding", "expertise", "expert", "proficient",
  "proficiency", "familiar", "familiarity", "passionate", "motivated",
  "self", "hand", "handson", "responsible", "someone", "somebody",
  "something", "anyone", "anybody", "anything", "everyone", "everybody",
  "everything", "nobody", "nothing", "one", "many", "much", "several",
  // Common English/verb filler + the specific words called out in the brief.
  // (Plurals/verb inflections are folded to these base forms by `stem`.)
  "use", "using", "build", "building", "built", "develop", "developed",
  "developing", "development", "developer", "design", "designed", "designing",
  "code", "coding", "coded", "data", "backend", "back-end", "frontend",
  "front-end", "fullstack", "full", "stack", "need", "application", "app",
  "software", "solution", "system", "platform", "product", "service",
  "environment", "tool", "technology", "feature", "feature-rich", "based",
  "help", "make", "made", "get", "got", "new", "existing", "various",
  "well", "high", "quality", "scalable", "efficient", "robust", "modern",
  // Generic *technical* nouns/verbs that are too broad to be ATS keywords.
  // (Plurals/inflections fold to these base forms via `stem`/`LEMMA_MAP`:
  //  algorithms->algorithm, problems->problem, structures->structure,
  //  integration/integrated->integrate.)
  "algorithm", "problem", "responsive", "database", "structure", "integrate",
  "maintainable", "maintain", "maintainability", "performance", "performant",
  "optimize", "optimization", "optimized", "optimizing", "web", "write",
  "writing", "wrote", "written", "clean", "cleaner", "logic", "concept",
  "fundamental", "practice", "pattern", "architecture", "architect",
  "scalability", "reliability", "reliable", "reusable",
  // Soft-skills, generic actions and other low-value English that describe
  // *what you do* rather than a concrete technology. (Inflections that `stem`
  // does not fold, e.g. -ing/-ion forms, are listed explicitly.)
  "authentication", "authorization", "authenticate", "collaborate",
  "collaboration", "collaborative", "collaborating", "communicate",
  "communication", "communicating", "solve", "solving", "solved", "implement",
  "implementation", "implementing", "implemented", "schema", "create",
  "creating", "created", "creative", "creativity", "working", "worked",
  "maintenance", "manage", "management", "managing", "deliver", "delivery",
  "deliverable", "responsibilities", "detail", "oriented", "fast", "paced",
  "cross", "functional", "mindset", "passion", "eager", "learn", "learning",
  "great", "leadership", "mentor", "ownership", "deadline", "agile", "scrum",
  "pipeline", "set", "setup", "paced", "driven", "end",
  // Generic role/actor nouns and broad IT verbs/nouns that describe activity
  // rather than a concrete technology. (Plurals fold to these singular base
  // forms via `stem`: users->user, engineers->engineer, interfaces->interface,
  // configurations->configuration; deployment->deploy via LEMMA_MAP.)
  "user", "engineer", "engineering", "cloud", "configure", "configured",
  "configuring", "configuration", "deploy", "interface", "administrator",
  "admin", "operation", "support", "maintainer", "provision", "provisioning",
  // Stray CI/CD fragments (the joined "CI/CD" is canonicalized to `cicd`; these
  // guard against a lone "ci"/"cd" surviving as noise).
  "ci", "cd",
]);

// ---------------------------------------------------------------------------
// Text utilities
// ---------------------------------------------------------------------------

/**
 * Lowercase + strip surrounding punctuation/whitespace from a token-ish string.
 * Keeps internal characters that are meaningful to tech terms (`.`, `+`, `#`,
 * `-`) so things like `node.js`, `c++`, `c#` and `ci-cd` survive.
 *
 * @param {string} value
 * @returns {string}
 */
function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    // Drop any leading/trailing chars that aren't alphanumeric or a tech symbol.
    .replace(/^[^a-z0-9.+#-]+|[^a-z0-9.+#-]+$/g, "")
    // Then strip leading/trailing sentence punctuation (`.` / `-`) that would
    // otherwise survive (e.g. "experience." -> "experience"), while keeping
    // meaningful trailing symbols like in "c++" and "c#" and mid-token dots
    // like "node.js".
    .replace(/^[.-]+|[.-]+$/g, "");
}

// ---------------------------------------------------------------------------
// Synonym / canonicalization layer
// ---------------------------------------------------------------------------

/**
 * Ordered canonicalization rules. Each rule rewrites a family of equivalent
 * skill spellings — differing only by case, punctuation, spacing, a common
 * abbreviation, or an "s" plural — into ONE canonical token consisting solely
 * of `[a-z0-9]`. Downstream, tokenization and {@link containsKeyword} then
 * treat every variant as the same term, without any change to the scoring.
 *
 * Order matters: multi-word and dotted-suffix forms are collapsed BEFORE the
 * bare abbreviations, so e.g. "node.js" is resolved before a standalone "js"
 * rule could ever see it.
 *
 * False positives are avoided in two ways:
 * 1. Word boundaries (`\b`) and explicit look-arounds keep a rule from firing
 *    inside an unrelated word (e.g. the standalone "js"/"ts" rules never touch
 *    the ".js" of "vue.js", and never match inside "artifacts").
 * 2. No blanket transformations are applied: only the enumerated variants are
 *    rewritten. In particular nothing maps "java", so "java" and "javascript"
 *    stay distinct tokens and never match each other.
 */
const CANONICAL_RULES = [
  // --- Stack acronyms expanded to their constituent technologies FIRST, so the
  //     individual names then flow through the rest of the pipeline normally.
  [/\bmern\b/gi, " mongodb express react node "], // MERN -> MongoDB Express React Node

  // --- "Continuous Integration/Delivery/Deployment" phrasing IS CI/CD.
  //     Each occurrence folds to `cicd`; a paired phrase ("... and ...")
  //     simply yields `cicd` twice and de-dupes during keyword counting.
  [/\bcontinuous\s+(?:integration|delivery|deployment)\b/gi, " cicd "],

  // --- Common CI/CD tools collapse to a single canonical token each (so their
  //     multi-word names never split), and each IMPLIES `cicd` on the resume
  //     side (see IMPLIED_TOKENS) so listing the tool satisfies a CI/CD need.
  //     These run BEFORE the generic CI/CD rule so "GitLab CI/CD" is captured
  //     whole rather than leaving a stray "cd".
  [/\btravis\s*ci\b/gi, " travisci "], //             Travis CI / TravisCI
  [/\bcircle\s*ci\b/gi, " circleci "], //             Circle CI / CircleCI
  [/\bgithub\s*actions?\b/gi, " githubactions "], //  GitHub Action(s)
  [/\bgitlab\s*ci(?:\s*[\/\-]\s*cd)?\b/gi, " gitlabci "], // GitLab CI / GitLab CI/CD
  [/\bazure\s*pipelines?\b/gi, " azurepipelines "], // Azure Pipelines

  // --- CI/CD is ONE technology. Collapse "CI/CD", "CI-CD", "CI / CD" (and the
  //     already-joined "cicd") into a single token so it is never split into
  //     the meaningless fragments "ci" and "cd".
  [/\bci\s*[\/\-]\s*cd\b/gi, " cicd "],

  // --- Multi-word terms -> single canonical token (also folds the "s" plural).
  [/\brest(?:ful)?\s*api(?:s)?\b/gi, " restapi "], // REST API / REST APIs / RESTful API
  [/\bmongo\s*db\b/gi, " mongodb "], //              Mongo DB / MongoDB
  [/\bmachine\s*learning\b/gi, " ml "], //           Machine Learning / ML
  [/\bartificial\s*intelligence\b/gi, " ai "], //    Artificial Intelligence / AI
  [/\bc\s*sharp\b/gi, " csharp "], //                C Sharp / CSharp

  // --- Punctuation-bearing language names.
  [/\bc\s*\+\+/gi, " cpp "], //                      C++ / CPP (bare "cpp" already canonical)
  [/\bc#/gi, " csharp "], //                         C#

  // --- ".js"/"js" framework suffixes -> the bare framework name.
  [/\breact(?:\.js|js)\b/gi, " react "], //          React.js / Reactjs -> react
  [/\bnode(?:\.js|js)\b/gi, " node "], //            Node.js / Nodejs   -> node
  [/\bexpress(?:\.js|js)\b/gi, " express "], //      Express.js / Expressjs -> express

  // --- Standalone abbreviations ONLY (never the ".js" suffix of another word).
  [/(?<![a-z0-9.#+])js(?![a-z0-9.#+])/gi, " javascript "], // JS -> javascript
  [/(?<![a-z0-9.#+])ts(?![a-z0-9.#+])/gi, " typescript "], // TS -> typescript

  // --- Versioned front-end tokens -> their base language (HTML5 -> html, CSS3 -> css).
  [/\bhtml\s*\d+\b/gi, " html "],
  [/\bcss\s*\d+\b/gi, " css "],

  // --- ECMAScript spec versions (ES6, ES6+, ES2015, ESNext) are not skills of
  //     their own — drop them entirely so they never surface as ATS keywords.
  [/\bes(?:20)?\d+\+?/gi, " "],
  [/\besnext\b/gi, " "],
];

/**
 * Apply the {@link CANONICAL_RULES} to a text blob. Lower-cases the input
 * (case-insensitive matching) and returns a string in which every recognised
 * skill variant has been replaced by its canonical, punctuation-free token.
 *
 * This is the single "synonym layer" applied to BOTH sides of every comparison
 * (job-description keywords and resume text/skills), which is what makes the
 * matching case-, punctuation- and (where appropriate) plural-insensitive.
 *
 * @param {string} text
 * @returns {string}
 */
function canonicalize(text) {
  let out = String(text || "").toLowerCase();
  for (const [pattern, replacement] of CANONICAL_RULES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Stemming / plural normalization
// ---------------------------------------------------------------------------

/**
 * Canonical technical tokens that must NEVER be altered by {@link stem}. Many
 * genuinely end in "s" (`aws`, `kubernetes`, `redis`, `pandas`, `keras`) or
 * would otherwise be mangled by a naive suffix strip, so they are protected
 * outright. All values are the lowercase canonical token form.
 */
const PROTECTED_TERMS = new Set([
  "react", "node", "express", "mongodb", "javascript", "typescript", "python",
  "fastapi", "docker", "redis", "aws", "kubernetes", "git", "github", "gitlab",
  "restapi", "graphql", "jwt", "oauth", "sql", "mysql", "postgresql", "sqlite",
  "html", "css", "sass", "scss", "tailwind", "bootstrap", "ml", "ai", "nlp",
  "tensorflow", "pytorch", "keras", "numpy", "pandas", "scikit-learn", "spacy",
  "nltk", "opencv", "cpp", "csharp", "redux", "angular", "vue", "svelte",
  "django", "flask", "spring", "kafka", "rabbitmq", "elasticsearch", "grpc",
  "terraform", "jenkins", "azure", "gcp", "linux", "bash", "matlab", "kotlin",
  "scala", "swift", "php", "ruby", "rust", "golang", "devops", "cicd",
  "travisci", "circleci", "githubactions", "gitlabci", "azurepipelines",
]);

/**
 * Explicit lemma folding for verb/noun families that a simple suffix strip
 * cannot collapse (e.g. "integration" -> "integrate"). Kept intentionally
 * small and exact so it can never corrupt an unrelated technical term.
 */
const LEMMA_MAP = new Map([
  // "apis"/"uris" end in "-is", which the general plural rule intentionally
  // skips (to protect analysis/axis/redis), so fold them explicitly.
  ["apis", "api"],
  ["uris", "uri"],
  ["integration", "integrate"],
  ["integrations", "integrate"],
  ["integrated", "integrate"],
  ["integrating", "integrate"],
  ["deployment", "deploy"],
  ["deployments", "deploy"],
  ["deployed", "deploy"],
  ["deploying", "deploy"],
  ["testing", "test"],
  ["tested", "test"],
  ["tests", "test"],
]);

/**
 * Reduce a token to a canonical singular/base form so that plural and simple
 * verb variants collapse to ONE keyword (api/apis -> api,
 * project/projects -> project, integration/integrated -> integrate).
 *
 * Safety rules that prevent damaging real technical keywords:
 * - protected terms are returned untouched (`aws`, `kubernetes`, ...);
 * - tokens containing a digit (`html5`, `oauth2`, `s3`, `es6`) or a tech symbol
 *   (`node.js`, `c++`, `c#`, `ci-cd`) are never stemmed;
 * - the "-s" strip is skipped for `ss`/`us`/`is`/`os` endings (so `css`, `ios`,
 *   `axis`, `status` survive) and only applies when the result stays >= 3 chars.
 *
 * @param {string} token - already normalized/lowercased
 * @returns {string}
 */
function stem(token) {
  if (!token) return token;
  if (PROTECTED_TERMS.has(token)) return token;
  if (/[0-9]/.test(token)) return token;
  if (/[.+#-]/.test(token)) return token;

  if (LEMMA_MAP.has(token)) return LEMMA_MAP.get(token);

  // Plural: "-ies" -> "-y" (libraries -> library, dependencies -> dependency).
  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }
  // Plural: trailing "-s" (apis -> api, projects -> project), but never for
  // ss/us/is/os endings which are usually part of the word itself.
  if (
    token.endsWith("s") &&
    !token.endsWith("ss") &&
    !token.endsWith("us") &&
    !token.endsWith("is") &&
    !token.endsWith("os")
  ) {
    const singular = token.slice(0, -1);
    if (singular.length >= 3) return singular;
  }
  return token;
}

/**
 * Canonical tokens that *imply* one or more broader/generic tokens on the
 * RESUME side. A résumé that demonstrates the specific skill should therefore
 * also satisfy a job-description keyword for the broader term.
 *
 * e.g. a résumé listing "REST API"/"REST APIs" (canonical `restapi`) also
 * satisfies a JD keyword `api`, so `api` never lands in Missing Keywords.
 *
 * This is applied ONLY when building the résumé/skills text (never to JD
 * keyword extraction), so it can only ever *add* matches — it does not
 * introduce a generic `api` keyword of its own.
 */
const IMPLIED_TOKENS = new Map([
  ["restapi", ["api"]],
  // A resume that lists any mainstream CI/CD tool demonstrates CI/CD, so it
  // satisfies a JD "CI/CD" keyword and CI/CD never lands in Missing.
  ["jenkins", ["cicd"]],
  ["travisci", ["cicd"]],
  ["circleci", ["cicd"]],
  ["githubactions", ["cicd"]],
  ["gitlabci", ["cicd"]],
  ["azurepipelines", ["cicd"]],
]);

/**
 * Given a list of résumé/skill tokens, append any tokens they imply
 * (see {@link IMPLIED_TOKENS}). Order is preserved and originals are kept.
 *
 * @param {string[]} tokens
 * @returns {string[]}
 */
function expandImplied(tokens) {
  const out = [...tokens];
  for (const token of tokens) {
    const implied = IMPLIED_TOKENS.get(token);
    if (implied) out.push(...implied);
  }
  return out;
}

/**
 * Split arbitrary text into a list of normalized, meaningful tokens.
 * Drops stopwords, pure numbers and very short noise tokens.
 *
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  // Canonicalize variants (React.js -> react, REST APIs -> restapi, JS ->
  // javascript, ...) BEFORE splitting so keyword extraction/matching operates
  // on canonical tokens. `canonicalize` also lower-cases the text.
  return canonicalize(text)
    // Split on anything that isn't a "word" character or a tech-term symbol.
    .split(/[^a-z0-9.+#-]+/)
    .map(normalize)
    // Fold plural/verb variants to a canonical base BEFORE stopword filtering,
    // so only the base form of each filler word needs to live in STOPWORDS.
    .map(stem)
    .filter((token) => {
      if (token.length < 2) return false; // drop single chars / empties
      if (STOPWORDS.has(token)) return false;
      if (/^\d+$/.test(token)) return false; // drop bare numbers
      // Hyphenated filler compounds ("cross-functional", "problem-solving",
      // "fast-paced") whose every part is itself a stopword carry no signal.
      // A real hyphenated tech term (e.g. "scikit-learn") keeps at least one
      // non-stopword part and therefore survives.
      if (token.includes("-")) {
        const parts = token.split("-").filter(Boolean);
        if (parts.length > 1 && parts.every((p) => STOPWORDS.has(p) || p.length < 2)) {
          return false;
        }
      }
      return true;
    });
}

/**
 * Flatten the parsed resume into one normalized text blob used for "does this
 * keyword appear anywhere in the resume" checks. Falls back to `full_text` and
 * also folds in every structured section so matching works even when the
 * parser did not provide raw text.
 *
 * @param {object} resume
 * @returns {string}
 */
function buildResumeText(resume) {
  const { contact = {}, skills = [], education = [], experience = [], projects = [], full_text = "" } = resume || {};

  const parts = [
    full_text,
    contact.name,
    contact.email,
    contact.phone,
    ...arr(skills),
    ...arr(education),
    ...arr(experience),
    ...arr(projects),
  ];

  // Run the resume through the SAME pipeline as the JD keywords (canonicalize
  // -> stem -> stopword filter) and rejoin as space-separated canonical tokens.
  // Using the identical normalization on both sides is what lets a resume's
  // "APIs"/"projects"/"React.js" satisfy a JD keyword "api"/"project"/"react".
  // `expandImplied` additionally lets "REST API" satisfy a JD "api" keyword.
  return expandImplied(tokenize(parts.filter(Boolean).join(" "))).join(" ");
}

/** Coerce a value into an array of strings (defensive against bad input). */
function arr(value) {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (value == null) return [];
  return [String(value)];
}

// ---------------------------------------------------------------------------
// Keyword extraction & matching
// ---------------------------------------------------------------------------

/**
 * Extract a ranked, de-duplicated list of keywords from a job description.
 * Keywords are ordered by frequency (most-emphasized terms first) so callers
 * can surface the most important misses, then trimmed to `limit`.
 *
 * @param {string} jobDescription
 * @param {number} [limit=40]
 * @returns {string[]}
 */
function extractKeywords(jobDescription, limit = 40) {
  const counts = new Map();
  for (const token of tokenize(jobDescription)) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
}

/**
 * Determine whether a keyword is present in a text blob, tolerating word
 * boundaries so `java` does not match inside `javascript`. Regex special
 * characters in the keyword are escaped first.
 *
 * @param {string} keyword - already normalized
 * @param {string} haystack - lowercased text
 * @returns {boolean}
 */
function containsKeyword(keyword, haystack) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // \b is unreliable around symbols like + or #, so anchor on non-word chars
  // (or string boundaries) ourselves.
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return pattern.test(haystack);
}

/**
 * Partition JD keywords into those found in the resume vs. those missing.
 *
 * @param {string[]} keywords
 * @param {string} resumeText
 * @returns {{ matched: string[], missing: string[] }}
 */
function matchKeywords(keywords, resumeText) {
  const matched = [];
  const missing = [];
  for (const keyword of keywords) {
    if (containsKeyword(keyword, resumeText)) matched.push(keyword);
    else missing.push(keyword);
  }
  return { matched, missing };
}

/**
 * Compute the skill-match percentage: of the JD keywords, how many are backed
 * by an *explicit* entry in the resume's `skills` array (a stronger signal than
 * appearing somewhere in prose).
 *
 * @param {string[]} resumeSkills
 * @param {string[]} keywords
 * @returns {{ percent: number, matched: string[], missing: string[] }}
 */
function computeSkillMatch(resumeSkills, keywords) {
  // Normalize the explicit skills through the same pipeline (canonicalize ->
  // stem -> stopword filter) so, e.g., a resume skill "React.js"/"REST APIs"
  // satisfies a JD keyword "react"/"restapi". `expandImplied` also lets a
  // "REST API" skill satisfy a JD "api" keyword.
  const skillBlob = expandImplied(tokenize(arr(resumeSkills).join(" "))).join(" ");
  const matched = [];
  const missing = [];

  for (const keyword of keywords) {
    if (skillBlob && containsKeyword(keyword, skillBlob)) matched.push(keyword);
    else missing.push(keyword);
  }

  const percent = keywords.length
    ? Math.round((matched.length / keywords.length) * 100)
    : 0;

  return { percent, matched, missing };
}

// ---------------------------------------------------------------------------
// Completeness
// ---------------------------------------------------------------------------

/**
 * Score how "complete" the resume is from an ATS standpoint. Each expected
 * section contributes equally; ATS parsers reward resumes that clearly expose
 * contact details and standard sections.
 *
 * @param {object} resume
 * @returns {{ percent: number, sections: Record<string, boolean>, missing: string[] }}
 */
function computeResumeCompleteness(resume) {
  const { contact = {}, skills = [], education = [], experience = [], projects = [] } = resume || {};

  const sections = {
    name: Boolean(contact.name && String(contact.name).trim()),
    email: Boolean(contact.email && String(contact.email).trim()),
    phone: Boolean(contact.phone && String(contact.phone).trim()),
    skills: arr(skills).length > 0,
    education: arr(education).length > 0,
    experience: arr(experience).length > 0,
    projects: arr(projects).length > 0,
  };

  const keys = Object.keys(sections);
  const present = keys.filter((k) => sections[k]).length;
  const percent = Math.round((present / keys.length) * 100);
  const missing = keys.filter((k) => !sections[k]);

  return { percent, sections, missing };
}

// ---------------------------------------------------------------------------
// Scoring & suggestions
// ---------------------------------------------------------------------------

/**
 * Blend the individual signals into a single 0-100 ATS score using
 * {@link SCORE_WEIGHTS}.
 *
 * @param {object} parts
 * @param {number} parts.keywordMatchPercent
 * @param {number} parts.skillMatchPercent
 * @param {number} parts.completenessPercent
 * @returns {number} Integer 0-100.
 */
function computeAtsScore({ keywordMatchPercent, skillMatchPercent, completenessPercent }) {
  const raw =
    keywordMatchPercent * SCORE_WEIGHTS.keywordMatch +
    skillMatchPercent * SCORE_WEIGHTS.skillMatch +
    completenessPercent * SCORE_WEIGHTS.completeness;

  return clamp(Math.round(raw), 0, 100);
}

/** Clamp a number into the inclusive [min, max] range. */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Produce human-readable, actionable suggestions based on the computed gaps.
 *
 * @param {object} ctx
 * @param {number} ctx.atsScore
 * @param {number} ctx.skillMatchPercent
 * @param {string[]} ctx.missingKeywords
 * @param {{ missing: string[] }} ctx.completeness
 * @returns {string[]}
 */
function generateSuggestions({ atsScore, skillMatchPercent, missingKeywords, completeness }) {
  const suggestions = [];

  // Section completeness gaps map to specific, friendly advice.
  const sectionAdvice = {
    name: "Add your full name to the contact section so the ATS can identify you.",
    email: "Include a professional email address in your contact details.",
    phone: "Add a phone number so recruiters can reach you.",
    skills: "Add a dedicated Skills section listing your core technologies.",
    education: "Include an Education section with your degree(s) and institution(s).",
    experience: "Add a Work Experience section detailing your roles and impact.",
    projects: "Showcase relevant projects to strengthen your profile.",
  };
  for (const section of completeness.missing) {
    if (sectionAdvice[section]) suggestions.push(sectionAdvice[section]);
  }

  // Missing keywords: surface the highest-priority ones (already frequency-sorted).
  if (missingKeywords.length) {
    const top = missingKeywords.slice(0, 8).join(", ");
    suggestions.push(
      `Incorporate these job-description keywords where you genuinely have the experience: ${top}.`
    );
  }

  if (skillMatchPercent < 50) {
    suggestions.push(
      "Your explicit skills cover less than half of the role's keywords. Align your Skills section with the job description's required technologies."
    );
  }

  if (atsScore >= 80) {
    suggestions.push("Strong match. Tailor the summary to the role for an extra edge.");
  } else if (atsScore >= 60) {
    suggestions.push("Decent match. Closing the keyword gaps above should push your score higher.");
  } else {
    suggestions.push("Significant gaps detected. Prioritize the missing keywords and sections above before applying.");
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze a parsed resume against a job description and return ATS metrics.
 *
 * @param {object} resume - Parsed resume JSON (see module header for shape).
 * @param {string} jobDescription - Raw job description text.
 * @returns {{
 *   atsScore: number,
 *   skillMatch: number,
 *   matchedKeywords: string[],
 *   missingKeywords: string[],
 *   resumeCompleteness: number,
 *   suggestions: string[]
 * }}
 */
function analyzeResume(resume, jobDescription) {
  const safeResume = resume && typeof resume === "object" ? resume : {};

  // 1. Pull the keywords that define the role.
  const keywords = extractKeywords(jobDescription);

  // 2. Keyword presence anywhere in the resume.
  const resumeText = buildResumeText(safeResume);
  const { matched: matchedKeywords, missing: missingKeywords } = matchKeywords(keywords, resumeText);
  const keywordMatchPercent = keywords.length
    ? Math.round((matchedKeywords.length / keywords.length) * 100)
    : 0;

  // 3. Stronger signal: keywords explicitly listed as skills.
  const skill = computeSkillMatch(safeResume.skills, keywords);

  // 4. Structural completeness of the resume.
  const completeness = computeResumeCompleteness(safeResume);

  // 5. Blend into a single score.
  const atsScore = computeAtsScore({
    keywordMatchPercent,
    skillMatchPercent: skill.percent,
    completenessPercent: completeness.percent,
  });

  // 6. Turn gaps into advice.
  const suggestions = generateSuggestions({
    atsScore,
    skillMatchPercent: skill.percent,
    missingKeywords,
    completeness,
  });

  return {
    atsScore,
    skillMatch: skill.percent,
    matchedKeywords,
    missingKeywords,
    resumeCompleteness: completeness.percent,
    suggestions,
  };
}

module.exports = {
  analyzeResume,
  // Exposed for unit testing / reuse; not required by callers.
  extractKeywords,
  matchKeywords,
  computeSkillMatch,
  computeResumeCompleteness,
  computeAtsScore,
  generateSuggestions,
  tokenize,
  normalize,
  canonicalize,
};
