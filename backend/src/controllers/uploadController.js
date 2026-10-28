const ApiError = require("../middleware/ApiError");
const { saveUploadMetadata } = require("../services/uploadService");
const { parseResume } = require("../services/parserService");

/**
 * POST /api/upload
 * Receives a single PDF file (already validated + stored by multer),
 * records its metadata, forwards the file to the Python FastAPI parser
 * service, and returns the structured resume JSON to the frontend.
 */
async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded. Use form field 'resume'.");
    }

    const { filename, size, mimetype } = req.file;

    // Forward the file to parser and await the structured result.
    const parsed = await parseResume(req.file);
    const resumeData = parsed.data ?? parsed;

    // Persist upload metadata and parsed resume into local embedded database
    await saveUploadMetadata(req.file, resumeData, req.user?.id || null);

    res.status(200).json({
      success: true,
      filename,
      size,
      mimetype,
      // The parser wraps the result in `{ success, filename, data }`; expose
      // the structured resume under `resume` (fall back to the raw payload).
      resume: parsed.data ?? parsed,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/upload/text
 * Receives raw resume text (pasted directly by the candidate), parses it
 * with the native structured extraction engine, persists metadata, and returns JSON.
 */
async function uploadResumeText(req, res, next) {
  try {
    const { text, fileName } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      throw new ApiError(400, "A non-empty 'text' string is required.");
    }

    const { parseResumeText } = require("../services/nativeParser");
    const resumeData = parseResumeText(text);
    const resolvedName = (fileName || `${(resumeData.contact?.name || "Pasted_Resume").replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`);

    const mockFile = {
      filename: resolvedName,
      originalname: resolvedName,
      size: Buffer.byteLength(text, "utf8"),
      mimetype: "text/plain",
      path: "",
    };

    await saveUploadMetadata(mockFile, resumeData, req.user?.id || null);

    res.status(200).json({
      success: true,
      filename: resolvedName,
      size: mockFile.size,
      mimetype: "text/plain",
      resume: resumeData,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/upload/latest
 * Retrieves the most recently uploaded active resume for the current user (or latest in db).
 */
async function getLatestResume(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const db = require("../database/db");
    const userResumes = db.resumes.findAll(10, userId);
    if (!userResumes || userResumes.length === 0) {
      return res.status(200).json({ success: false, resume: null, message: "No uploaded resume found." });
    }
    const latest = userResumes[0];
    res.status(200).json({
      success: true,
      resume: latest.parsedData || latest.resume,
      filename: latest.originalName || latest.filename,
      id: latest.id,
      uploadedAt: latest.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/upload/resumes
 * Lists all uploaded resumes.
 */
async function listUserResumes(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const db = require("../database/db");
    const items = db.resumes.findAll(50, userId);
    res.status(200).json({ success: true, count: items.length, resumes: items });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadResume, uploadResumeText, getLatestResume, listUserResumes };
