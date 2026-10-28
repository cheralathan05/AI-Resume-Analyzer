const db = require("../database/db");
const ApiError = require("../middleware/ApiError");

/**
 * POST /api/auth/register
 * Body: { email, password, name, role, targetTitle, targetLocation, targetSalary, bio, skills }
 */
async function register(req, res, next) {
  try {
    const { email, password, name, role, targetTitle, targetLocation, targetSalary, bio, skills } = req.body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new ApiError(400, "A valid email address is required.");
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long.");
    }

    const user = db.users.insert({
      email,
      password,
      name: name?.trim() || email.split("@")[0],
      role: role || "Software Engineer",
      targetTitle: targetTitle || role || "Software Engineer",
      targetLocation: targetLocation || "Remote",
      targetSalary: targetSalary || "$130,000 - $170,000",
      bio: bio || "",
      skills: Array.isArray(skills) ? skills : ["React", "Node.js", "TypeScript"],
    });

    const token = db.users.generateToken(user);
    res.status(201).json({
      success: true,
      token,
      user,
      message: "Account created successfully.",
    });
  } catch (err) {
    if (err.message && err.message.includes("already exists")) {
      return next(new ApiError(409, err.message));
    }
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw new ApiError(400, "Both email and password are required.");
    }

    const user = db.users.verifyPassword(email, password);
    if (!user) {
      throw new ApiError(401, "Invalid email or password. Please try again.");
    }

    const token = db.users.generateToken(user);
    res.status(200).json({
      success: true,
      token,
      user,
      message: `Welcome back, ${user.name}!`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/demo-login
 * Body: { persona: "alex" | "jordan" }
 * Instant 1-click demo login without credentials
 */
async function demoLogin(req, res, next) {
  try {
    const { persona = "alex" } = req.body || {};
    let targetEmail = "demo@resumeai.io";
    if (persona === "cheralathan") {
      targetEmail = "cheralathannandha9098@gmail.com";
    } else if (persona === "jordan") {
      targetEmail = "jordan.vance@techcorp.io";
    }

    let user = db.users.findByEmail(targetEmail);
    if (!user) {
      db.users.seedDefaultUsers();
      user = db.users.findByEmail(targetEmail);
    }

    const safeUser = db.users.sanitize(user);
    const token = db.users.generateToken(safeUser);

    res.status(200).json({
      success: true,
      token,
      user: safeUser,
      isDemo: true,
      message: `Signed in as demo professional (${safeUser.name}).`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Requires Authorization: Bearer <token>
 */
async function me(req, res, next) {
  try {
    if (!req.user) {
      return res.status(200).json({ success: true, user: null, isAuthenticated: false });
    }
    res.status(200).json({
      success: true,
      user: req.user,
      isAuthenticated: true,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/profile
 * Requires Authorization: Bearer <token>
 */
async function updateProfile(req, res, next) {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required to update profile.");
    }

    const updated = db.users.update(req.user.id, req.body || {});
    if (!updated) {
      throw new ApiError(404, "User profile not found.");
    }

    res.status(200).json({
      success: true,
      user: updated,
      message: "Profile updated successfully.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
}

/**
 * GET /api/auth/users (Directory / Demo list)
 */
async function listUsers(req, res, next) {
  try {
    const users = db.users.findAll(20);
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  demoLogin,
  me,
  updateProfile,
  logout,
  listUsers,
};
