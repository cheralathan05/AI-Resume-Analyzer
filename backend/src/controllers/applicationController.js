const db = require("../database/db");
const ApiError = require("../middleware/ApiError");

/**
 * GET /api/applications
 * Returns list of tracked job applications.
 */
async function listApplications(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const userId = req.user?.id || null;
    let items = db.applications.findAll(limit, userId);
    if (items.length === 0) {
      db.applications.seedDefaults();
      items = db.applications.findAll(limit, userId);
    }
    const counts = {
      Wishlist: items.filter((a) => (a.status || "").toLowerCase() === "wishlist").length,
      Applied: items.filter((a) => (a.status || "").toLowerCase() === "applied").length,
      Interviewing: items.filter((a) => (a.status || "").toLowerCase() === "interviewing").length,
      Offered: items.filter((a) => (a.status || "").toLowerCase() === "offered" || (a.status || "").toLowerCase() === "offer").length,
      Rejected: items.filter((a) => (a.status || "").toLowerCase() === "rejected").length,
    };
    res.status(200).json({ success: true, count: items.length, total: items.length, counts, applications: items });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/applications/:id
 */
async function getApplication(req, res, next) {
  try {
    const item = db.applications.findById(req.params.id);
    if (!item) {
      throw new ApiError(404, "Application record not found.");
    }
    res.status(200).json({ success: true, application: item });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/applications
 * Creates or logs a new job application.
 */
async function createApplication(req, res, next) {
  try {
    const {
      candidateName,
      company,
      role,
      status,
      salaryEstimate,
      atsScore,
      location,
      appliedDate,
      jobUrl,
      notes,
      interviewRounds,
    } = req.body || {};

    if (!company || !role) {
      throw new ApiError(400, "Both 'company' and 'role' are required to track an application.");
    }

    const record = db.applications.insert({
      userId: req.user?.id || null,
      candidateName: candidateName || (req.user?.name || "Candidate"),
      company,
      role,
      status: status || "Applied",
      salaryEstimate,
      atsScore: typeof atsScore === "number" ? atsScore : 85,
      location,
      appliedDate: appliedDate || new Date().toISOString().split("T")[0],
      jobUrl,
      notes,
      interviewRounds,
    });

    res.status(201).json({ success: true, message: "Application tracked successfully.", application: record });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/applications/:id
 * Updates application status, notes, or interview rounds.
 */
async function updateApplication(req, res, next) {
  try {
    const id = req.params.id;
    const updates = req.body || {};

    const updated = db.applications.update(id, updates);
    if (!updated) {
      throw new ApiError(404, "Application record not found to update.");
    }

    res.status(200).json({ success: true, message: "Application updated.", application: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/applications/:id
 */
async function deleteApplication(req, res, next) {
  try {
    const removed = db.applications.deleteById(req.params.id);
    if (!removed) {
      throw new ApiError(404, "Application record not found to delete.");
    }
    res.status(200).json({ success: true, message: "Application deleted successfully.", removed });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/applications/seed
 */
async function seedApplications(req, res, next) {
  try {
    const seeded = db.applications.seedDefaults();
    res.status(200).json({ success: true, message: "Seeded sample job applications pipeline.", seededCount: seeded.length });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  seedApplications,
};
