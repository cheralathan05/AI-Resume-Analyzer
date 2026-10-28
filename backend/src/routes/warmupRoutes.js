const express = require("express");
const { warmUp } = require("../controllers/warmupController");

const router = express.Router();

// GET /api/warmup
router.get("/", warmUp);

module.exports = router;
