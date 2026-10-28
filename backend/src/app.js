const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const env = require("./config/env");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Secure HTTP headers (relax CSP for inline styles, fonts, and SPA assets).
app.use(helmet({ contentSecurityPolicy: false }));

// Cross-origin access for the frontend. An empty origin list allows all.
app.use(
  cors({
    origin: env.corsOrigins.length ? env.corsOrigins : true,
  })
);

// Request logging (concise in dev, combined in production).
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// Body parsers for JSON and urlencoded payloads (uploads use multer).
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes.
app.use("/api", routes);

// Serve production frontend bundle if built (enables 1-click single service deploy on Render)
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  console.log(`[server] Serving production frontend build from ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// 404 for unmatched routes, then the centralized error handler.
app.use(notFound);
app.use(errorHandler);

module.exports = app;

