const express = require("express");
const upload = require("../middleware/upload");
const { optionalAuth } = require("../middleware/authMiddleware");
const { uploadResume, uploadResumeText, getLatestResume, listUserResumes } = require("../controllers/uploadController");

const router = express.Router();

// GET /api/upload/latest (Active / latest uploaded resume)
router.get("/latest", optionalAuth, getLatestResume);

// GET /api/upload/resumes (All uploaded resumes)
router.get("/resumes", optionalAuth, listUserResumes);

// POST /api/upload  (multipart/form-data, field name: "resume")
router.post("/", optionalAuth, upload, uploadResume);

// POST /api/upload/text  (raw pasted text parser)
router.post("/text", optionalAuth, uploadResumeText);

module.exports = router;

