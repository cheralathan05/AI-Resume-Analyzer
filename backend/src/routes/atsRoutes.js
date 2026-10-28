const express = require("express");
const { analyze, audit, ruleChecklist, multiMatch, samples, recommendedJobs } = require("../controllers/atsController");
const { optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/ats/analyze
router.post("/analyze", optionalAuth, analyze);

// POST /api/ats/audit
router.post("/audit", audit);

// POST /api/ats/rule-checklist
router.post("/rule-checklist", ruleChecklist);

// POST /api/ats/multi-match
router.post("/multi-match", multiMatch);

// GET /api/ats/samples
router.get("/samples", samples);

// GET & POST /api/ats/recommended-jobs
router.get("/recommended-jobs", recommendedJobs);
router.post("/recommended-jobs", recommendedJobs);

module.exports = router;
