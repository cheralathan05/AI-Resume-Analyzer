const mongoose = require("mongoose");

/**
 * Stores metadata about each uploaded resume file.
 * The actual file lives on disk; only its metadata is persisted here.
 */
const uploadSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Upload", uploadSchema);
