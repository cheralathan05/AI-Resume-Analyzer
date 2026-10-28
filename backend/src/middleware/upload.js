const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const env = require("../config/env");
const ApiError = require("./ApiError");

// Ensure the upload directory exists before multer tries to write to it.
fs.mkdirSync(env.uploadDir, { recursive: true });

// Accepted resume format: PDF only (the parser service supports PDF only).
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf"]);

// Store files on local disk with a collision-free, sanitized name.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60);
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

// Reject anything that is not a PDF before it is written to disk.
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.has(ext);

  if (mimeOk && extOk) {
    return cb(null, true);
  }

  return cb(new ApiError(400, "Only PDF files are allowed"));
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxUploadSize,
    files: 1,
  },
});

// Exposes a single-file middleware expecting the form field "resume".
module.exports = upload.single("resume");
