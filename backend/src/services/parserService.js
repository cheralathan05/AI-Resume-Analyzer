const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const env = require("../config/env");
const ApiError = require("../middleware/ApiError");
const { parseResumeBuffer } = require("./nativeParser");

/**
 * Delays before each cold-start /parse retry (ms).
 *
 * Kept short and few: every request uses a long timeout so Render can HOLD the
 * connection during the free-tier cold boot and return the real result in one
 * shot (like a browser visiting /health). Firing many quick requests instead
 * trips Render's edge rate limiter (HTTP 429), which delays the boot.
 */
const COLD_START_PARSE_DELAYS_MS = [20000];

/** Max /parse attempts when Render returns transient cold-start errors. */
const MAX_PARSE_ATTEMPTS = COLD_START_PARSE_DELAYS_MS.length + 1;

/** Timeout for parser liveness probes (long enough for Render to hold a cold-boot connection). */
const PARSER_HEALTH_TIMEOUT_MS = 60000;

/**
 * Total time budget for waking the parser with GET /health BEFORE sending the
 * (large) multipart /parse body. A GET is exactly what "opening the parser link
 * in the browser" does — it reliably triggers Render's free-tier cold boot, and
 * Render holds the connection open while the service starts. We keep polling
 * until the parser reports healthy or this budget is exhausted.
 */
const PARSER_WAKE_BUDGET_MS = 150000;

/**
 * Delay between wake (health) attempts when the parser is not ready yet. Kept
 * moderate so we don't hammer Render's edge (which returns HTTP 429 and slows
 * the boot); each health attempt itself can hold for up to
 * {@link PARSER_HEALTH_TIMEOUT_MS} during a cold boot.
 */
const PARSER_WAKE_POLL_INTERVAL_MS = 5000;

/**
 * Timeout for every /parse request. Long enough that Render holds the
 * connection through a free-tier cold boot (~50–60s) plus the spaCy model load
 * on the first parse, rather than axios giving up early.
 */
const PARSER_COLD_PARSE_TIMEOUT_MS = 120000;

const parserClient = axios.create({
  baseURL: env.parserServiceUrl,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Builds a multipart body for `POST /parse`.
 *
 * @param {Express.Multer.File} file
 * @returns {FormData}
 */
function buildParseForm(file) {
  const form = new FormData();
  form.append("file", fs.createReadStream(file.path), {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  return form;
}

/**
 * Coerces a response body to plain text for inspection.
 *
 * @param {unknown} data
 * @returns {string}
 */
function toHealthBodyText(data) {
  if (data === undefined || data === null) return "";
  if (Buffer.isBuffer(data)) return data.toString("utf8");
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

/**
 * @param {string} bodyText
 * @param {number} [maxLen=100]
 * @returns {string}
 */
function healthBodyPreview(bodyText, maxLen = 100) {
  if (!bodyText) return "(empty)";
  const oneLine = bodyText.replace(/\s+/g, " ").trim();
  return oneLine.length <= maxLen ? oneLine : `${oneLine.slice(0, maxLen)}…`;
}

/**
 * Returns true when Render (or another proxy) serves a temporary HTML boot page.
 *
 * @param {string} contentType
 * @param {string} bodyText
 * @returns {boolean}
 */
function isRenderBootPage(contentType, bodyText) {
  const normalizedType = contentType.toLowerCase();
  if (normalizedType.includes("text/html")) return true;

  const trimmed = bodyText.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

/**
 * HTTP statuses that indicate the parser is not ready yet (keep polling).
 *
 * @param {number} httpStatus
 * @returns {boolean}
 */
function isTransientHealthStatus(httpStatus) {
  return httpStatus === 429 || httpStatus === 502 || httpStatus === 503 || httpStatus === 504;
}

/**
 * Parses the parser health JSON body and reports whether JSON decoding succeeded.
 *
 * @param {unknown} data
 * @returns {{ body: { status?: string, message?: string } | null, jsonParseSucceeded: boolean }}
 */
function parseHealthBody(data) {
  if (data && typeof data === "object" && !Buffer.isBuffer(data) && !Array.isArray(data)) {
    return { body: data, jsonParseSucceeded: true };
  }

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return { body: null, jsonParseSucceeded: false };

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return { body: parsed, jsonParseSucceeded: true };
      }
      return { body: null, jsonParseSucceeded: false };
    } catch {
      return { body: null, jsonParseSucceeded: false };
    }
  }

  return { body: null, jsonParseSucceeded: false };
}

/**
 * Pings the parser `GET /health` endpoint. Never throws — callers use this for
 * orchestrator health checks and cold-start warm-up without failing the API.
 *
 * @returns {Promise<{ status: "healthy" | "unavailable", message?: string }>}
 */
async function checkParserHealth() {
  const healthUrl = `${env.parserServiceUrl}/health`;
  const method = "GET";
  const isLocal = env.parserServiceUrl.includes("localhost") || env.parserServiceUrl.includes("127.0.0.1");

  console.info("[parser][health] Request: method=%s url=%s", method, healthUrl);

  try {
    const response = await axios.request({
      method,
      url: healthUrl,
      timeout: isLocal ? 1200 : PARSER_HEALTH_TIMEOUT_MS,
      headers: { Accept: "application/json" },
      // Resolve every HTTP status here so status/body are always logged.
      validateStatus: () => true,
    });

    const httpStatus = response.status;
    const rawBody = response.data;
    const contentType = String(
      response.headers["content-type"] || response.headers["Content-Type"] || ""
    );
    const bodyText = toHealthBodyText(rawBody);
    const { body, jsonParseSucceeded } = parseHealthBody(rawBody);
    const bodyStatus = body?.status;
    const bodyService = body?.service;
    const renderBootPage = isRenderBootPage(contentType, bodyText);

    console.info(
      "[parser][health] Response: method=%s url=%s httpStatus=%s contentType=%s bodyPreview=%s jsonParseSucceeded=%s parsedStatus=%s",
      method,
      healthUrl,
      httpStatus,
      contentType || "(missing)",
      healthBodyPreview(bodyText),
      jsonParseSucceeded,
      bodyStatus ?? "(missing)"
    );

    if (
      httpStatus >= 200 &&
      httpStatus < 300 &&
      jsonParseSucceeded &&
      bodyStatus === "healthy" &&
      bodyService !== "AI Chatbot Backend"
    ) {
      return { status: "healthy" };
    }

    if (renderBootPage) {
      console.info(
        "[parser][health] Booting: Render HTML loading page detected; continuing poll."
      );
      return {
        status: "unavailable",
        message: "Parser service is still booting.",
      };
    }

    if (isTransientHealthStatus(httpStatus)) {
      const label =
        httpStatus === 429
          ? "Rate limited (HTTP 429)"
          : `Upstream unavailable (HTTP ${httpStatus})`;
      console.info("[parser][health] Booting: %s; continuing poll.", label);
      return {
        status: "unavailable",
        message:
          httpStatus === 429
            ? "Parser service is still booting (rate limited)."
            : "Parser service is still waking up.",
      };
    }

    let message;
    if (httpStatus >= 200 && httpStatus < 300) {
      message =
        body?.message ||
        `Unexpected health payload (expected JSON status "healthy", got ${JSON.stringify(bodyStatus)}).`;
    } else {
      message =
        body?.message ||
        body?.error ||
        `Parser health check returned HTTP ${httpStatus}.`;
    }

    console.warn("[parser][health] Unavailable: %s", message);

    return { status: "unavailable", message };
  } catch (err) {
    const httpStatus = err.response?.status ?? "—";
    const rawBody = err.response?.data;
    const contentType = String(
      err.response?.headers?.["content-type"] ||
        err.response?.headers?.["Content-Type"] ||
        ""
    );
    const bodyText = toHealthBodyText(rawBody);
    const { jsonParseSucceeded } = parseHealthBody(rawBody);
    const axiosCode = err.code ?? "—";
    const axiosMessage = err.message ?? "unknown error";

    console.warn(
      "[parser][health] Error: method=%s url=%s httpStatus=%s contentType=%s bodyPreview=%s jsonParseSucceeded=%s axiosCode=%s axiosMessage=%s",
      method,
      healthUrl,
      httpStatus,
      contentType || "(missing)",
      healthBodyPreview(bodyText),
      jsonParseSucceeded,
      axiosCode,
      axiosMessage
    );

    if (isRenderBootPage(contentType, bodyText)) {
      console.info(
        "[parser][health] Booting: Render HTML loading page detected; continuing poll."
      );
      return {
        status: "unavailable",
        message: "Parser service is still booting.",
      };
    }

    if (typeof httpStatus === "number" && isTransientHealthStatus(httpStatus)) {
      const label =
        httpStatus === 429
          ? "Rate limited (HTTP 429)"
          : `Upstream unavailable (HTTP ${httpStatus})`;
      console.info("[parser][health] Booting: %s; continuing poll.", label);
      return {
        status: "unavailable",
        message:
          httpStatus === 429
            ? "Parser service is still booting (rate limited)."
            : "Parser service is still waking up.",
      };
    }

    const message =
      axiosCode === "ECONNABORTED"
        ? "Parser health check timed out (service may still be waking up)."
        : "Parser service is not reachable yet.";

    console.warn("[parser][health] Unavailable: %s", message);

    return { status: "unavailable", message };
  }
}

/**
 * Returns true when a failed parser request is likely due to a Render free-tier
 * cold start rather than a client or permanent upstream error.
 *
 * @param {import('axios').AxiosError} err
 * @returns {boolean}
 */
function isColdStartError(err) {
  if (err.response) {
    const status = err.response.status;
    const contentType = String(
      err.response.headers?.["content-type"] ||
        err.response.headers?.["Content-Type"] ||
        ""
    );
    const bodyText = toHealthBodyText(err.response.data);
    if (isRenderBootPage(contentType, bodyText)) {
      return true;
    }
    return status === 429 || status === 502 || status === 503 || status === 504;
  }

  return err.code === "ECONNABORTED" || err.code === "ECONNRESET";
}

/**
 * Wakes the parser (and waits until it reports healthy) BEFORE the caller sends
 * the large multipart /parse body. This mirrors "opening the parser URL in the
 * browser": a lightweight GET /health triggers Render's cold boot, and Render
 * holds the connection open while the FastAPI process starts.
 *
 * Never throws — on timeout it resolves `false` and the caller still attempts
 * /parse (which has its own long timeout and retry) so a slow-but-alive parser
 * is never blocked from serving the request.
 *
 * @returns {Promise<boolean>} `true` if the parser reported healthy in time.
 */
async function waitForParserAwake() {
  const isLocal = env.parserServiceUrl.includes("localhost") || env.parserServiceUrl.includes("127.0.0.1");
  if (isLocal) {
    // In local development, services don't need Render free-tier wake up
    return false;
  }

  const deadline = Date.now() + PARSER_WAKE_BUDGET_MS;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt += 1;
    const health = await checkParserHealth();

    if (health.status === "healthy") {
      if (attempt > 1) {
        console.info("[parser] Parser awake after %d health attempt(s).", attempt);
      }
      return true;
    }

    if (Date.now() >= deadline) break;
    console.info(
      "[parser] Parser still waking (attempt %d); retrying health in %ds…",
      attempt,
      Math.round(PARSER_WAKE_POLL_INTERVAL_MS / 1000)
    );
    await delay(PARSER_WAKE_POLL_INTERVAL_MS);
  }

  console.warn(
    "[parser] Parser did not report healthy within wake budget; attempting /parse anyway."
  );
  return false;
}

/**
 * Forwards an uploaded resume to the Python FastAPI parser service
 * (`POST {PARSER_SERVICE_URL}/parse`) and returns the parsed JSON.
 *
 * If the Python parser is offline or returns an unexpected response, it
 * immediately and seamlessly falls back to our high-performance native
 * Node.js parser with zero delay.
 *
 * @param {Express.Multer.File} file - The file object provided by multer.
 * @returns {Promise<object>} The parser's JSON body, e.g.
 *   `{ success: true, filename, data: { ...structured resume... } }`.
 */
async function parseResume(file) {
  const isLocal = env.parserServiceUrl.includes("localhost") || env.parserServiceUrl.includes("127.0.0.1");

  try {
    let pythonHealthy = false;
    try {
      const probe = await parserClient.get("/health", { timeout: isLocal ? 800 : 2500 });
      if (probe.status === 200 && probe.data?.status === "healthy" && probe.data?.service !== "AI Chatbot Backend") {
        pythonHealthy = true;
      }
    } catch {
      pythonHealthy = false;
    }

    if (!pythonHealthy) {
      console.info("[parser] Python parser is offline or not running; parsing instantly with native Node engine.");
      const buffer = fs.readFileSync(file.path);
      const parsedData = await parseResumeBuffer(buffer);
      return {
        success: true,
        filename: file.originalname,
        data: parsedData,
      };
    }
  } catch (err) {
    console.warn("[parser] Fast check error, falling back to native Node parser:", err.message);
    const buffer = fs.readFileSync(file.path);
    const parsedData = await parseResumeBuffer(buffer);
    return {
      success: true,
      filename: file.originalname,
      data: parsedData,
    };
  }

  // 1) Make sure remote parser is awake before streaming the (large) PDF body (remote only).
  if (!isLocal) {
    await waitForParserAwake();
  }

  const parseTimeout = Math.max(env.parserTimeoutMs, PARSER_COLD_PARSE_TIMEOUT_MS);

  for (let attempt = 0; attempt < MAX_PARSE_ATTEMPTS; attempt++) {
    const form = buildParseForm(file);

    try {
      const { data } = await parserClient.post("/parse", form, {
        headers: form.getHeaders(),
        timeout: parseTimeout,
      });
      return data;
    } catch (err) {
      const isLastAttempt = attempt >= MAX_PARSE_ATTEMPTS - 1;
      if (!isLastAttempt && isColdStartError(err)) {
        const waitMs = COLD_START_PARSE_DELAYS_MS[attempt];
        console.info(
          "[parser] Cold start (attempt %d/%d); waiting %ds before /parse retry…",
          attempt + 1,
          MAX_PARSE_ATTEMPTS,
          Math.round(waitMs / 1000)
        );
        await delay(waitMs);
        continue;
      }

      // If remote service fails, fall back to native parser rather than crashing!
      try {
        console.warn("[parser] Python parser failed; falling back to native Node parser.");
        const buffer = fs.readFileSync(file.path);
        const parsedData = await parseResumeBuffer(buffer);
        return {
          success: true,
          filename: file.originalname,
          data: parsedData,
        };
      } catch (nativeErr) {
        console.error("[parser] Native fallback failed:", nativeErr.message);
      }

      throw normalizeParserError(err);
    }
  }
}

/**
 * Translates a low-level axios failure into a clean {@link ApiError} so the
 * frontend always receives a meaningful status code and message instead of a
 * raw stack trace or generic 500.
 *
 * @param {import('axios').AxiosError} err
 * @returns {ApiError}
 */
function normalizeParserError(err) {
  // 1. The parser responded, but with an error status (4xx/5xx).
  if (err.response) {
    const status = err.response.status;
    const contentType = String(
      err.response.headers?.["content-type"] ||
        err.response.headers?.["Content-Type"] ||
        ""
    );
    const bodyText = toHealthBodyText(err.response.data);
    if (isRenderBootPage(contentType, bodyText) || isTransientHealthStatus(status)) {
      return new ApiError(
        503,
        "Resume parser is still waking up. Please wait a minute and try again."
      );
    }

    const message =
      err.response.data?.error ||
      err.response.data?.message ||
      "Resume parser returned an error.";

    // Pass client errors (bad/empty/non-PDF) through unchanged; treat the
    // parser's own server errors as an upstream (502) failure.
    if (status === 429) {
      return new ApiError(
        503,
        "Resume parser is waking up and was temporarily rate limited. Please try again in a moment."
      );
    }
    if (status >= 400 && status < 500) {
      return new ApiError(status, message);
    }
    return new ApiError(502, `Resume parser failed: ${message}`);
  }

  // 2. The request was made but no response came back.
  if (err.code === "ECONNABORTED") {
    return new ApiError(
      504,
      "Resume parser timed out. Please try again with a smaller file."
    );
  }
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    return new ApiError(
      503,
      "Resume parser service is unavailable. Please try again later."
    );
  }

  // 3. Anything else (request setup error, unexpected network failure).
  return new ApiError(
    502,
    `Could not reach resume parser: ${err.message || "unknown error"}`
  );
}

module.exports = { parseResume, checkParserHealth, waitForParserAwake };
