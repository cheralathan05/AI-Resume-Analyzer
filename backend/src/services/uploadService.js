const mongoose = require("mongoose");
const Upload = require("../models/Upload");
const db = require("../database/db");

/**
 * Persists metadata and parsed resume data for an uploaded file.
 * Automatically saves to the local embedded database (always available).
 * Also mirrors to MongoDB if connected.
 *
 * @param {Express.Multer.File} file - The file object provided by multer.
 * @param {object} [parsedResume] - Optional parsed resume JSON structure.
 * @returns {Promise<object>}
 */
async function saveUploadMetadata(file, parsedResume = null, userId = null) {
  // Always persist to local own database
  const localRecord = db.resumes.insert({
    userId: userId || null,
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    parsedData: parsedResume,
  });

  // Mirror to MongoDB if available
  const isMongoConnected = mongoose.connection.readyState === 1;
  if (isMongoConnected) {
    try {
      await Upload.create({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      });
    } catch (err) {
      console.warn("[uploadService] MongoDB mirror failed (non-fatal):", err.message);
    }
  }

  return localRecord;
}

module.exports = { saveUploadMetadata };
