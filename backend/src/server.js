const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/db");

let server;

function start() {
  // Start the HTTP server first so health checks and uploads are immediately
  // available, then connect to MongoDB in the background. If the DB is
  // unavailable the API still runs (metadata persistence is simply skipped).
  server = app.listen(env.port, async () => {
    console.log(`[server] Listening on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`[server] Embedded Local Database: backend/data/db.json (Active & Ready)`);
    try {
      const { getOllamaStatus } = require("./services/ollamaService");
      const status = await getOllamaStatus();
      if (status.connected) {
        console.log(`[server] Ollama AI: Connected on ${status.host} (Active model: ${status.activeModel})`);
      } else {
        console.warn(`[server] Ollama AI: Offline at ${status.host} (Start with 'ollama serve')`);
      }
    } catch (e) {
      console.warn("[server] Ollama AI check skipped:", e.message);
    }
  });

  connectDB().catch((err) => {
    console.log("[startup] MongoDB not found on port 27017 (Using embedded local database for full persistence).");
  });
}

// Graceful shutdown on termination signals.
function shutdown(signal) {
  console.log(`\n[server] ${signal} received, shutting down...`);
  if (server) {
    server.close(() => {
      console.log("[server] Closed remaining connections. Bye!");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Surface unexpected failures instead of dying silently.
process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[server] Uncaught exception:", err);
});

start();
