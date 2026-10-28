const express = require("express");
const {
  listHistory,
  getHistoryItem,
  deleteHistoryItem,
  getDatabaseStats,
  getAllCollections,
  deleteTailored,
  deleteCoverLetter,
  deleteInterview,
  deleteMulti,
  deleteResume,
  exportDatabase,
  importDatabase,
  clearDatabase,
  seedDatabase,
} = require("../controllers/historyController");
const { optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/history
router.get("/", optionalAuth, listHistory);

// GET /api/history/stats
router.get("/stats", getDatabaseStats);

// GET /api/history/all
router.get("/all", optionalAuth, getAllCollections);

// GET /api/history/export
router.get("/export", exportDatabase);

// POST /api/history/import
router.post("/import", importDatabase);

// POST /api/history/clear
router.post("/clear", clearDatabase);

// POST /api/history/seed
router.post("/seed", seedDatabase);

// GET /api/history/samples (alias to built-in presets)
router.get("/samples", (req, res, next) => {
  try {
    const { getSampleData } = require("../services/aiIntelligenceService");
    res.status(200).json({ success: true, ...getSampleData() });
  } catch (err) {
    next(err);
  }
});

// GET /api/history/:id
router.get("/:id", getHistoryItem);

// DELETE /api/history/:id
router.delete("/:id", deleteHistoryItem);

// DELETE /api/history/tailored/:id
router.delete("/tailored/:id", deleteTailored);

// DELETE /api/history/cover-letter/:id
router.delete("/cover-letter/:id", deleteCoverLetter);

// DELETE /api/history/interview/:id
router.delete("/interview/:id", deleteInterview);

// DELETE /api/history/resume/:id
router.delete("/resume/:id", deleteResume);

// DELETE /api/history/multi/:id
router.delete("/multi/:id", deleteMulti);

module.exports = router;
