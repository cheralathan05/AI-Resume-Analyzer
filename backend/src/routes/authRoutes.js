const express = require("express");
const {
  register,
  login,
  demoLogin,
  me,
  updateProfile,
  logout,
  listUsers,
} = require("../controllers/authController");
const { optionalAuth, requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Mounted under /api/auth
router.post("/register", register);
router.post("/login", login);
router.post("/demo-login", demoLogin);
router.get("/me", optionalAuth, me);
router.put("/profile", requireAuth, updateProfile);
router.post("/logout", logout);
router.get("/users", listUsers);

module.exports = router;
