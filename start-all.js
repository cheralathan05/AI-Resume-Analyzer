const { spawn, execSync } = require("child_process");
const path = require("path");

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

console.log("\x1b[36m%s\x1b[0m", "============================================================");
console.log("\x1b[36m%s\x1b[0m", "      AI RESUME ANALYZER & CAREER INTELLIGENCE STUDIO       ");
console.log("\x1b[36m%s\x1b[0m", "============================================================");
console.log("\x1b[32m%s\x1b[0m", " -> Frontend Web App : http://localhost:5174");
console.log("\x1b[34m%s\x1b[0m", " -> Backend API      : http://localhost:5001");
console.log("\x1b[35m%s\x1b[0m", " -> Ollama Local AI  : http://127.0.0.1:11434 (Active)");
console.log("\x1b[36m%s\x1b[0m", "============================================================\n");

// 1. Start Backend on port 5001
const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.resolve(__dirname, "backend"),
  shell: true,
  stdio: "pipe",
  env: { ...process.env, PORT: "5001" },
});

backend.stdout.on("data", (data) => {
  process.stdout.write(`\x1b[34m[backend]\x1b[0m ${data.toString()}`);
});

backend.stderr.on("data", (data) => {
  process.stderr.write(`\x1b[31m[backend-err]\x1b[0m ${data.toString()}`);
});

// 2. Start Frontend on port 5174
const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.resolve(__dirname, "frontend"),
  shell: true,
  stdio: "pipe",
});

frontend.stdout.on("data", (data) => {
  process.stdout.write(`\x1b[32m[frontend]\x1b[0m ${data.toString()}`);
});

frontend.stderr.on("data", (data) => {
  process.stderr.write(`\x1b[33m[frontend-err]\x1b[0m ${data.toString()}`);
});

function cleanup() {
  console.log("\nShutting down AI Resume Analyzer processes...");
  try {
    if (backend && !backend.killed) {
      if (isWin) {
        spawn("taskkill", ["/pid", backend.pid, "/f", "/t"]);
      } else {
        backend.kill("SIGINT");
      }
    }
  } catch {}

  try {
    if (frontend && !frontend.killed) {
      if (isWin) {
        spawn("taskkill", ["/pid", frontend.pid, "/f", "/t"]);
      } else {
        frontend.kill("SIGINT");
      }
    }
  } catch {}

  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
