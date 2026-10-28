const mongoose = require("mongoose");
const env = require("./env");

/**
 * Establishes a connection to MongoDB using mongoose.
 * Throws on failure so the caller (server.js) can decide how to handle it.
 */
async function connectDB() {
  mongoose.set("strictQuery", true);

  // Fail fast if the database can't be reached instead of hanging ~30s.
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });

  console.log("[db] Connected to MongoDB");

  mongoose.connection.on("error", (err) => {
    console.error("[db] MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected");
  });

  return mongoose.connection;
}

module.exports = connectDB;
