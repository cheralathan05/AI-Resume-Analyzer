const db = require("../database/db");
const ApiError = require("./ApiError");

/**
 * Extracts Bearer token from Authorization header.
 */
function extractToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== "string") return null;
  const parts = header.trim().split(" ");
  if (parts.length === 2 && /^bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return null;
}

/**
 * Optional authentication: attaches req.user if a valid token is provided,
 * otherwise lets the request proceed as guest / unauthenticated.
 */
function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const user = db.users.verifyToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

/**
 * Mandatory authentication: enforces that a valid user token is present.
 */
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return next(new ApiError(401, "Authentication required. Please sign in to access this feature."));
  }

  const user = db.users.verifyToken(token);
  if (!user) {
    return next(new ApiError(401, "Session expired or invalid. Please sign in again."));
  }

  req.user = user;
  next();
}

module.exports = {
  extractToken,
  optionalAuth,
  requireAuth,
};
