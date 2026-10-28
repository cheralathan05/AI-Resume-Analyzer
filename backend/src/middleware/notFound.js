const ApiError = require("./ApiError");

/**
 * Catch-all for unmatched routes. Forwards a 404 ApiError to the
 * central error handler so all error responses share one shape.
 */
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
