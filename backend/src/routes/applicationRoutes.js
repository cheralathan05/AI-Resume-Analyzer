const express = require("express");
const {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  seedApplications,
} = require("../controllers/applicationController");
const { optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/applications
router.get("/", optionalAuth, listApplications);

// POST /api/applications/seed (Must precede /:id)
router.post("/seed", optionalAuth, seedApplications);

// POST /api/applications
router.post("/", optionalAuth, createApplication);

// GET /api/applications/:id
router.get("/:id", getApplication);

// PUT /api/applications/:id
router.put("/:id", updateApplication);

// DELETE /api/applications/:id
router.delete("/:id", deleteApplication);

module.exports = router;
