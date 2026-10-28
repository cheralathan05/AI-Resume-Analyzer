const express = require("express");
const healthRoutes = require("./healthRoutes");
const warmupRoutes = require("./warmupRoutes");
const uploadRoutes = require("./uploadRoutes");
const atsRoutes = require("./atsRoutes");
const aiRoutes = require("./aiRoutes");
const historyRoutes = require("./historyRoutes");
const applicationRoutes = require("./applicationRoutes");
const authRoutes = require("./authRoutes");

const router = express.Router();

// Mounted under /api in app.js
router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/warmup", warmupRoutes);
router.use("/upload", uploadRoutes);
router.use("/ats", atsRoutes);
router.use("/ai", aiRoutes);
router.use("/history", historyRoutes);
router.use("/applications", applicationRoutes);

module.exports = router;
