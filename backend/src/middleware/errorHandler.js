const multer = require("multer");
const env = require("../config/env");
const ApiError = require("./ApiError");

/**
 * Centralized Express error handler. Normalizes multer errors, ApiErrors
 * and unexpected errors into a single JSON response shape.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = "Internal server error";

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large"
        : `Upload error: ${err.message}`;
  } else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err && err.message) {
    message = err.message;
  }

  if (statusCode >= 500) {
    console.error("[error]", err);
  }

  const body = {
    success: false,
    message,
  };

  // Include the stack only outside production to aid debugging.
  if (env.nodeEnv !== "production" && err && err.stack) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

module.exports = errorHandler;
