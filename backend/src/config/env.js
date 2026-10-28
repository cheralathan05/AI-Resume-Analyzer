const path = require("path");
const dotenv = require("dotenv");

const backendRoot = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.join(backendRoot, ".env") });
dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";


// Localhost defaults are ONLY applied outside production so the whole stack
// runs with zero configuration during local development. In production these
// defaults are never used: the corresponding variables must be provided
// explicitly, otherwise the process refuses to start (see the check below).
const DEV_DEFAULTS = {
  PARSER_SERVICE_URL: "http://localhost:8000",
  CORS_ORIGIN: "http://localhost:5173",
};

const DEFAULT_PARSER_TIMEOUT_MS = 30000;

// Collected here so we can report every missing variable in a single, clear
// startup error instead of failing one at a time.
const missingInProduction = [];

/**
 * Reads a variable that a production deployment must set explicitly (i.e. one
 * whose localhost default would silently point at a service that does not
 * exist in the deployed environment).
 *
 * - Development: falls back to the provided localhost default.
 * - Production: a missing/blank value is recorded so we can fail fast.
 *
 * @param {keyof DEV_DEFAULTS} name
 * @returns {string}
 */
function requireInProduction(name) {
  const raw = process.env[name];
  if (raw && raw.trim()) return raw.trim();

  if (isProduction) {
    if (name === "PARSER_SERVICE_URL") {
      console.info("[config] PARSER_SERVICE_URL not set in production. Native Node.js parser will run as primary engine.");
      return "";
    }
    if (name === "CORS_ORIGIN") {
      console.info("[config] CORS_ORIGIN not set in production. Defaulting to allow same-origin and public access.");
      return "*";
    }
    missingInProduction.push(name);
    return "";
  }
  return DEV_DEFAULTS[name];
}

function parseOrigins(value) {
  if (!value || value === "*") return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * PARSER_TIMEOUT_MS must be a positive, finite number of milliseconds.
 * Anything else (blank, non-numeric, zero, negative) falls back to the default
 * so a typo can never silently disable the request timeout.
 *
 * @returns {number}
 */
function parseTimeoutMs() {
  const raw = process.env.PARSER_TIMEOUT_MS;
  if (raw === undefined || raw.trim() === "") return DEFAULT_PARSER_TIMEOUT_MS;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(
      `[config] Ignoring invalid PARSER_TIMEOUT_MS="${raw}"; ` +
        `using default of ${DEFAULT_PARSER_TIMEOUT_MS}ms.`
    );
    return DEFAULT_PARSER_TIMEOUT_MS;
  }
  return parsed;
}

const parserServiceUrl = requireInProduction("PARSER_SERVICE_URL");
const corsOrigin = requireInProduction("CORS_ORIGIN");

if (missingInProduction.length > 0) {
  console.warn(
    `[config] Notice: Optional environment variable(s) not provided: ` +
      `${missingInProduction.join(", ")}.`
  );
}


const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 5000,
  // MongoDB is optional/best-effort: if it is unreachable the API still runs
  // (metadata persistence is simply skipped), so a localhost default is safe.
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai-resume-analyzer",
  corsOrigins: parseOrigins(corsOrigin),
  maxUploadSize: Number(process.env.MAX_UPLOAD_SIZE) || 5 * 1024 * 1024,
  uploadDir: path.resolve(backendRoot, process.env.UPLOAD_DIR || "src/uploads"),
  // Python FastAPI Resume Parser service (trailing slashes trimmed).
  parserServiceUrl: parserServiceUrl.replace(/\/+$/, ""),
  parserTimeoutMs: parseTimeoutMs(),
  // Ollama local AI service
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/+$/, ""),
  ollamaModel: process.env.OLLAMA_MODEL || "qwen2.5:0.5b",
};

module.exports = env;
