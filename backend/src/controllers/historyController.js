const ApiError = require("../middleware/ApiError");
const db = require("../database/db");

/**
 * Controller for History & Embedded Database operations.
 */

// GET /api/history
function listHistory(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const userId = req.user?.id || null;
    const items = db.analyses.findAll(limit, userId);
    res.status(200).json({ success: true, count: items.length, items });
  } catch (err) {
    next(err);
  }
}

// GET /api/history/:id
function getHistoryItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = db.analyses.findById(id);
    if (!item) {
      throw new ApiError(404, "Analysis record not found.");
    }
    res.status(200).json({ success: true, item, data: item });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/history/:id
function deleteHistoryItem(req, res, next) {
  try {
    const { id } = req.params;
    const removed = db.analyses.deleteById(id);
    if (!removed) {
      throw new ApiError(404, "Analysis record not found.");
    }
    res.status(200).json({ success: true, message: "Analysis record deleted." });
  } catch (err) {
    next(err);
  }
}

// GET /api/history/stats
function getDatabaseStats(req, res, next) {
  try {
    res.status(200).json({ success: true, database: db.stats() });
  } catch (err) {
    next(err);
  }
}

// GET /api/history/all
function getAllCollections(req, res, next) {
  try {
    const userId = req.user?.id || null;
    res.status(200).json({
      success: true,
      stats: db.stats(),
      resumes: db.resumes.findAll(50, userId),
      analyses: db.analyses.findAll(50, userId),
      tailoredResumes: db.tailoredResumes.findAll(50, userId),
      coverLetters: db.coverLetters.findAll(50, userId),
      interviewPreps: db.interviewPreps.findAll(50, userId),
      multiMatches: db.multiMatches.findAll(50, userId),
      applications: db.applications.findAll(50, userId),
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/history/resume/:id
function deleteResume(req, res, next) {
  try {
    const removed = db.resumes.deleteById(req.params.id);
    if (!removed) throw new ApiError(404, "Resume record not found.");
    res.status(200).json({ success: true, message: "Resume deleted." });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/history/tailored/:id
function deleteTailored(req, res, next) {
  try {
    const removed = db.tailoredResumes.deleteById(req.params.id);
    if (!removed) throw new ApiError(404, "Tailored record not found.");
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/history/cover-letter/:id
function deleteCoverLetter(req, res, next) {
  try {
    const removed = db.coverLetters.deleteById(req.params.id);
    if (!removed) throw new ApiError(404, "Cover letter not found.");
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/history/interview/:id
function deleteInterview(req, res, next) {
  try {
    const removed = db.interviewPreps.deleteById(req.params.id);
    if (!removed) throw new ApiError(404, "Interview record not found.");
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/history/multi/:id
function deleteMulti(req, res, next) {
  try {
    const removed = db.multiMatches.deleteById(req.params.id);
    if (!removed) throw new ApiError(404, "Multi-match record not found.");
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// GET /api/history/export
function exportDatabase(req, res, next) {
  try {
    const backup = db.exportFull();
    res.setHeader("Content-Disposition", `attachment; filename="resumeai_db_backup_${Date.now()}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(backup);
  } catch (err) {
    next(err);
  }
}

// POST /api/history/import
function importDatabase(req, res, next) {
  try {
    const payload = req.body;
    if (!payload) {
      throw new ApiError(400, "Missing JSON payload for database import.");
    }
    const newStats = db.importFull(payload);
    res.status(200).json({ success: true, message: "Database imported successfully.", stats: newStats });
  } catch (err) {
    next(err);
  }
}

// POST /api/history/clear
function clearDatabase(req, res, next) {
  try {
    const newStats = db.clearAll();
    res.status(200).json({ success: true, message: "History database cleared.", stats: newStats });
  } catch (err) {
    next(err);
  }
}

// POST /api/history/seed
function seedDatabase(req, res, next) {
  try {
    const sample = db.seedDefaults();
    res.status(200).json({ success: true, message: "Sample record seeded successfully.", sample });
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
