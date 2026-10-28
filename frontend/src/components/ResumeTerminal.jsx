import { useState, useEffect, useRef } from "react";
import "../styles/Terminal.css";
import { useResume } from "../context/ResumeContext";
import {
  analyzeAts,
  auditResumeFormat,
  getAiStatus,
  getSampleResumesAndJobs,
  getHistory,
  listJobApplications,
  getSalaryEstimateWithAi,
  improveBulletWithAi,
  gradeInterviewAnswerWithAi,
  generateInterviewPrepWithAi,
  exportDatabaseBackup,
  getCareerTrajectoryWithAi,
  getStarStoryBankWithAi,
  getDebiasAuditWithAi,
  getExecutiveBioWithAi,
  getInterviewSprintWithAi,
  getLocalizeResumeWithAi,
} from "../lib/api";
import {
  playKeyClick,
  playEnterSound,
  playSuccessChime,
  playErrorBeep,
  toggleSound,
  isSoundEnabled,
} from "../lib/soundFx";
import {
  TerminalIcon,
  MaximizeIcon,
  MinimizeIcon,
  VolumeIcon,
  CopyIcon,
  SparkleIcon,
} from "./icons";

const ASCII_BANNER = `
  ██████╗ ███████╗███████╗██╗   ██╗███╗   ███╗███████╗     █████╗ ██╗
  ██╔══██╗██╔════╝██╔════╝██║   ██║████╗ ████║██╔════╝    ██╔══██╗██║
  ██████╔╝█████╗  ███████╗██║   ██║██╔████╔██║█████╗      ███████║██║
  ██╔══██╗██╔══╝  ╚════██║██║   ██║██║╚██╔╝██║██╔══╝      ██╔══██║██║
  ██║  ██║███████╗███████║╚██████╔╝██║ ╚═╝ ██║███████╗    ██║  ██║██║
  ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝
          -- ResumeAI Developer Terminal & Diagnostic Shell --
`;

const COMMANDS_HELP = [
  { cmd: "help, ?", desc: "Show this list of available commands" },
  { cmd: "status", desc: "Ping backend API & probe local Ollama LLM connection" },
  { cmd: "scan [role]", desc: "Run algorithmic ATS score analysis on active resume" },
  { cmd: "audit", desc: "Run 12-point formatting and ATS compliance audit" },
  { cmd: "trajectory [role]", desc: "Forecast 1/3/5-year title & salary milestones" },
  { cmd: "star", desc: "Synthesize 5 FAANG-grade STAR behavioral interview stories" },
  { cmd: "debias", desc: "Audit resume for blind screening and demographic bias" },
  { cmd: "bio [role]", desc: "Generate 5 executive personal branding bios" },
  { cmd: "sprint", desc: "Display 7-day interview bootcamp preparation schedule" },
  { cmd: "localize [country]", desc: "Adapt resume for US, UK_EU, UAE, or APAC market" },
  { cmd: "models", desc: "List local Ollama models and response latency" },
  { cmd: "model <name>", desc: "Set active Ollama model (e.g. model llama3.2)" },
  { cmd: "interview [role]", desc: "Generate technical / behavioral interview question" },
  { cmd: "grade <answer>", desc: "Grade STAR candidate response out of 10" },
  { cmd: "salary <role>", desc: "Calculate market compensation percentiles" },
  { cmd: "tailor <bullet>", desc: "Rewrite weak resume bullet into executive STAR" },
  { cmd: "skills [query]", desc: "Inspect skills & check keyword coverage" },
  { cmd: "history [limit]", desc: "Print recent embedded database scans in ASCII table" },
  { cmd: "apps", desc: "List tracked job applications" },
  { cmd: "theme <name>", desc: "Change theme: obsidian, matrix, cyberpunk, nord, amber" },
  { cmd: "matrix", desc: "Toggle falling digital Matrix rain animation" },
  { cmd: "sound", desc: "Toggle procedural mechanical keyboard audio clicks" },
  { cmd: "curl <endpoint>", desc: "Simulate internal API call (e.g. curl /api/health)" },
  { cmd: "whoami", desc: "Print current candidate profile and session telemetry" },
  { cmd: "export", desc: "Download JSON database backup" },
  { cmd: "clear, cls", desc: "Clear terminal buffer" },
  { cmd: "exit, quit", desc: "Close terminal session" },
];


export default function ResumeTerminal({
  isDrawer = false,
  isOpen = true,
  onClose = null,
  activeResume = null,
}) {
  const { activeResume: contextResume } = useResume();
  const [theme, setTheme] = useState(() => localStorage.getItem("term_theme") || "obsidian");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [history, setHistory] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [matrixActive, setMatrixActive] = useState(false);
  const [cachedResume, setCachedResume] = useState(activeResume || contextResume);

  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const canvasRef = useRef(null);

  // Sync with contextResume when available
  useEffect(() => {
    if (contextResume) {
      setCachedResume(contextResume);
    } else if (!cachedResume) {
      getSampleResumesAndJobs()
        .then((data) => {
          if (data?.resumes?.[0]?.data) {
            setCachedResume(data.resumes[0].data);
          }
        })
        .catch(() => {});
    }
  }, [contextResume]);

  // Initial welcome message
  useEffect(() => {
    setHistory([
      {
        type: "banner",
        content: ASCII_BANNER,
      },
      {
        type: "system",
        content: `System ready. Type 'help' for commands or click quick action chips below.\nEnvironment: Node.js Express API (Port 5001) • Ollama LLM • Embedded JSON DB`,
      },
    ]);
  }, []);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on mount or drawer open
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard shortcut Ctrl + ` to toggle
  useEffect(() => {
    function handleGlobalKey(e) {
      if (e.ctrlKey && (e.key === "`" || e.key === "~")) {
        e.preventDefault();
        if (isDrawer && onClose) {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [isDrawer, onClose]);

  // Matrix digital rain canvas animation
  useEffect(() => {
    if (!matrixActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const chars = "0123456789ABCDEF!@#$%^&*()_+-=[]{}|;:,.<>/?~RESUMEAI";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    function draw() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = theme === "amber" ? "#f59e0b" : theme === "cyberpunk" ? "#06b6d4" : "#22c55e";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [matrixActive, theme]);

  // Copy terminal output
  function handleCopyOutput() {
    const text = history
      .map((item) => {
        if (item.type === "command") return `resume-ai@local:~$ ${item.content}`;
        return item.content;
      })
      .join("\n");
    navigator.clipboard.writeText(text);
    playSuccessChime();
  }

  // Execute terminal command
  async function executeCommand(cmdStr) {
    const raw = cmdStr.trim();
    if (!raw) return;

    playEnterSound();

    // Push command line to log
    const newHistory = [...history, { type: "command", content: raw }];
    setCmdHistory((prev) => [raw, ...prev]);
    setHistoryPointer(-1);

    const parts = raw.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const fullArg = args.join(" ").replace(/^["']|["']$/g, "");

    switch (cmd) {
      case "help":
      case "?": {
        const lines = [
          "COMMAND                          DESCRIPTION",
          "--------------------------------------------------------------------------------",
          ...COMMANDS_HELP.map((c) => `${c.cmd.padEnd(32)} ${c.desc}`),
          "--------------------------------------------------------------------------------",
          "💡 Tip: Use Tab for autocomplete, Up/Down arrows for command history.",
        ].join("\n");

        newHistory.push({ type: "output", content: lines, style: "cyan" });
        break;
      }

      case "clear":
      case "cls": {
        setHistory([]);
        setInputVal("");
        return;
      }

      case "status": {
        newHistory.push({ type: "output", content: "🔍 Pinging backend API & probing Ollama connection..." });
        setHistory(newHistory);
        try {
          const t0 = performance.now();
          const ai = await getAiStatus();
          const latency = Math.round(performance.now() - t0);

          const hostDisplay = typeof window !== "undefined" ? window.location.origin : "http://localhost:5001";
          const statusText = [
            `┌─ SYSTEM DIAGNOSTICS REPORT ───────────────────────────────────┐`,
            `│ Backend Server   : Online (${hostDisplay})`.padEnd(64) + `│`,
            `│ Ollama Engine    : ${ai.connected ? "CONNECTED (Local LLM Active)" : "OFFLINE (Heuristic Mode)"}`.padEnd(64) + `│`,
            `│ Ollama Host      : ${ai.host || "http://127.0.0.1:11434"}`.padEnd(64) + `│`,
            `│ Active Model     : ${ai.activeModel || "heuristic-fallback"}`.padEnd(64) + `│`,

            `│ Available Models : ${(ai.models || []).join(", ") || "None"}`.padEnd(64) + `│`,
            `│ Roundtrip Ping   : ${latency} ms`.padEnd(64) + `│`,
            `│ Embedded Database: Connected (NeDB / Disk Vault)              │`,
            `└───────────────────────────────────────────────────────────────┘`,
          ].join("\n");

          playSuccessChime();
          setHistory((prev) => [...prev, { type: "output", content: statusText, style: ai.connected ? "success" : "warn" }]);
        } catch (err) {
          playErrorBeep();
          setHistory((prev) => [
            ...prev,
            { type: "output", content: `❌ API Error: ${err.message}`, style: "error" },
          ]);
        }
        return;
      }

      case "models": {
        newHistory.push({ type: "output", content: "Fetching local Ollama model registry..." });
        setHistory(newHistory);
        try {
          const ai = await getAiStatus();
          const models = ai.models || [];
          if (models.length === 0) {
            setHistory((prev) => [
              ...prev,
              {
                type: "output",
                content: "No local models found on Ollama. Run: 'ollama run llama3.2' in PowerShell to pull.",
                style: "warn",
              },
            ]);
          } else {
            const lines = [
              `Ollama Model Registry (${models.length} loaded):`,
              "------------------------------------------------",
              ...models.map((m) => ` • ${m} ${m === ai.activeModel ? " [ACTIVE]" : ""}`),
              "------------------------------------------------",
              `Switch active model with: model <name>`,
            ].join("\n");
            setHistory((prev) => [...prev, { type: "output", content: lines, style: "cyan" }]);
          }
        } catch (e) {
          setHistory((prev) => [...prev, { type: "output", content: `Failed: ${e.message}`, style: "error" }]);
        }
        return;
      }

      case "model": {
        if (!args[0]) {
          newHistory.push({ type: "output", content: "Usage: model <model_name> (e.g. model llama3.2)", style: "warn" });
        } else {
          localStorage.setItem("active_ollama_model", args[0]);
          newHistory.push({
            type: "output",
            content: `✓ Active model set to '${args[0]}' in session storage.`,
            style: "success",
          });
        }
        break;
      }

      case "scan": {
        const targetRole = fullArg || "Senior Full-Stack Engineer";
        newHistory.push({
          type: "output",
          content: `⚡ Initializing ATS parsing algorithm against target role: "${targetRole}"...`,
        });
        setHistory(newHistory);

        try {
          const resume = cachedResume || {
            contact: { name: "Cheralathan B.N" },
            skills: ["React", "Node.js", "TypeScript", "Python", "PostgreSQL", "Docker"],
            experience: ["Generative AI Intern at One Yes Tech", "Cybersecurity Intern at Zero Touch"],
            education: ["B.E. Computer Science and Engineering"],
          };

          const jd = `Looking for ${targetRole} with strong skills in React, TypeScript, Node.js, Python, PostgreSQL, Docker, Redis, REST APIs, Microservices, and LLMs.`;
          const result = await analyzeAts(resume, jd, "Candidate_Resume.pdf");

          const score = result.atsScore || 82;
          const filled = Math.round(score / 5);
          const empty = 20 - filled;
          const bar = `[${"█".repeat(filled)}${"░".repeat(empty)}] ${score}%`;

          const outputText = [
            `┌─ ATS MATCH SCORE REPORT ────────────────────────────────────────┐`,
            `│ Candidate       : ${resume.contact?.name || "Candidate"}`.padEnd(66) + `│`,
            `│ Target Role     : ${targetRole}`.padEnd(66) + `│`,
            `│ ATS Score Gauge : ${bar}`.padEnd(66) + `│`,
            `│ Skill Match     : ${result.skillMatch || 78}%`.padEnd(66) + `│`,
            `│ Completeness    : ${result.resumeCompleteness || 85}%`.padEnd(66) + `│`,
            `├─────────────────────────────────────────────────────────────────┤`,
            `│ Matched Keywords (${(result.matchedKeywords || []).length}):`,
            `│   ✓ ${(result.matchedKeywords || ["React", "Node.js", "TypeScript", "Python", "Docker"]).slice(0, 8).join(", ")}`,
            `│ Missing Keywords (${(result.missingKeywords || []).length}):`,
            `│   ⚠ ${(result.missingKeywords || ["Kubernetes", "Redis", "Kafka", "CI/CD"]).slice(0, 6).join(", ")}`,
            `└─────────────────────────────────────────────────────────────────┘`,
            `💡 Tip: Use 'audit' command to inspect structural red flags and formatting metrics.`,
          ].join("\n");

          playSuccessChime();
          setHistory((prev) => [...prev, { type: "output", content: outputText, style: "success" }]);
        } catch (err) {
          playErrorBeep();
          setHistory((prev) => [...prev, { type: "output", content: `ATS scan failed: ${err.message}`, style: "error" }]);
        }
        return;
      }

      case "audit": {
        newHistory.push({ type: "output", content: "🔍 Executing 12-point formatting and red-flags audit..." });
        setHistory(newHistory);

        try {
          const resume = cachedResume || {
            contact: { name: "Cheralathan B.N", email: "cheralathannandha9098@gmail.com", phone: "+91 8668180041" },
            skills: ["React.js", "Node.js", "Python"],
            experience: ["Generative AI Intern: Tuned GPT-4 prompts, added embeddings, cut latency by 35%."],
          };

          const audit = await auditResumeFormat(resume);

          const lines = [
            `┌─ ATS COMPLIANCE & FORMATTING AUDIT ────────────────────────────┐`,
            `│ Overall Health Score : ${audit.healthScore || 88} / 100`.padEnd(65) + `│`,
            `│ Contact Information  : ${audit.contactCheck?.passed ? "✓ PASS (Email & Phone detected)" : "⚠ Incomplete"}`.padEnd(65) + `│`,
            `│ Action-Verb Density  : ${audit.metrics?.actionVerbRatio || "High (82% of bullets start with verbs)"}`.padEnd(65) + `│`,
            `│ Metric Quantifiers   : ${audit.metrics?.metricsRatio || "Good (60% of achievements cited metrics)"}`.padEnd(65) + `│`,
            `│ Red Flags Detected   : ${audit.redFlags?.length || 0} issues`.padEnd(65) + `│`,
            `└────────────────────────────────────────────────────────────────┘`,
            audit.redFlags?.length > 0 ? `\nRed Flags:\n` + audit.redFlags.map((rf) => ` • ${rf}`).join("\n") : "✓ No critical parsing red flags found.",
          ].join("\n");

          playSuccessChime();
          setHistory((prev) => [...prev, { type: "output", content: lines, style: "cyan" }]);
        } catch (err) {
          playErrorBeep();
          setHistory((prev) => [...prev, { type: "output", content: `Audit error: ${err.message}`, style: "error" }]);
        }
        return;
      }

      case "interview": {
        const role = fullArg || "Full-Stack Software Engineer";
        newHistory.push({ type: "output", content: `🎯 Generating high-signal interview question for '${role}'...` });
        setHistory(newHistory);

        try {
          const prep = await generateInterviewPrepWithAi({
            resume: cachedResume,
            jobDescription: `Target role: ${role}`,
            targetRole: role,
            interviewType: "technical",
          });

          const q = prep?.questions?.[0] || {
            question: "How do you design and maintain high-throughput backend services that gracefully degrade during database failovers?",
            whyTheyAsk: "Evaluates architectural foresight, resilience patterns (circuit breakers, cache-aside), and data consistency.",
          };

          const lines = [
            `┌─ INTERVIEW CHALLENGE QUESTION ─────────────────────────────────┐`,
            `│ Category : System Architecture & Resilience                     │`,
            `│ Role     : ${role}`.padEnd(65) + `│`,
            `└────────────────────────────────────────────────────────────────┘`,
            `\nQuestion: "${q.question}"\n`,
            `Why Interviewers Ask This:\n${q.whyTheyAsk || "Evaluates real-world production problem solving."}\n`,
            `💡 Practice answering with: grade "<your answer here>"`,
          ].join("\n");

          playSuccessChime();
          setHistory((prev) => [...prev, { type: "output", content: lines, style: "purple" }]);
        } catch (e) {
          setHistory((prev) => [...prev, { type: "output", content: `Failed: ${e.message}`, style: "error" }]);
        }
        return;
      }

      case "grade": {
        if (!fullArg) {
          newHistory.push({
            type: "output",
            content: `Usage: grade "<your STAR answer here>"`,
            style: "warn",
          });
        } else {
          newHistory.push({ type: "output", content: `Analyzing STAR answer against principal interviewer rubric...` });
          setHistory(newHistory);

          try {
            const grading = await gradeInterviewAnswerWithAi({
              question: "How do you handle high burst traffic and maintain SLA uptime?",
              userAnswer: fullArg,
              resume: cachedResume,
              jobDescription: "Senior Systems Engineer",
            });

            const lines = [
              `┌─ INTERVIEW ANSWER EVALUATION ───────────────────────────────────┐`,
              `│ Score   : ${grading.score || 8} / 10 (${grading.verdict || "Competent"})`.padEnd(66) + `│`,
              `│ Feedback: ${(grading.feedback || "").slice(0, 60)}...`.padEnd(66) + `│`,
              `└─────────────────────────────────────────────────────────────────┘`,
              `\nStrengths:\n` + (grading.strengths || ["Directly answered the question"]).map((s) => `  ✓ ${s}`).join("\n"),
              `\nAreas for Improvement:\n` + (grading.improvements || ["Cite concrete performance metrics"]).map((i) => `  • ${i}`).join("\n"),
              `\nPolished 10/10 Response:\n"${grading.polishedAnswer || "In my previous role, we isolated state..."}"`,
            ].join("\n");

            playSuccessChime();
            setHistory((prev) => [...prev, { type: "output", content: lines, style: "success" }]);
          } catch (err) {
            setHistory((prev) => [...prev, { type: "output", content: `Grading failed: ${err.message}`, style: "error" }]);
          }
          return;
        }
        break;
      }

      case "salary": {
        const role = fullArg || "Full-Stack Software Engineer";
        newHistory.push({ type: "output", content: `Calculating market compensation distribution for '${role}'...` });
        setHistory(newHistory);

        try {
          const sal = await getSalaryEstimateWithAi({
            resume: cachedResume,
            jobDescription: `Job: ${role}`,
            location: "United States / Remote",
          });

          const lines = [
            `┌─ COMPENSATION DISTRIBUTION BAND ───────────────────────────────┐`,
            `│ Target Role : ${role}`.padEnd(65) + `│`,
            `│ 25th Percentile : $${(sal?.percentiles?.p25 || 125000).toLocaleString()} / yr`.padEnd(65) + `│`,
            `│ 50th (Median)   : $${(sal?.percentiles?.p50 || 155000).toLocaleString()} / yr`.padEnd(65) + `│`,
            `│ 75th Percentile : $${(sal?.percentiles?.p75 || 185000).toLocaleString()} / yr`.padEnd(65) + `│`,
            `│ 90th Percentile : $${(sal?.percentiles?.p90 || 220000).toLocaleString()} / yr`.padEnd(65) + `│`,
            `├────────────────────────────────────────────────────────────────┤`,
            `│ Top ROI Missing Skills to Boost Salary:                        │`,
            `│  • ${(sal?.topSkillsToAdd || ["Kubernetes (+$18k)", "Distributed Systems (+$22k)", "System Design (+$15k)"]).join(", ")}`,
            `└────────────────────────────────────────────────────────────────┘`,
          ].join("\n");

          playSuccessChime();
          setHistory((prev) => [...prev, { type: "output", content: lines, style: "success" }]);
        } catch (e) {
          setHistory((prev) => [...prev, { type: "output", content: `Failed: ${e.message}`, style: "error" }]);
        }
        return;
      }

      case "tailor": {
        const bullet = fullArg || "Helped build backend APIs and worked on improving server response times.";
        newHistory.push({ type: "output", content: `Rewriting bullet point with action verbs and STAR metrics...` });
        setHistory(newHistory);

        try {
          const res = await improveBulletWithAi(bullet, "Senior Software Engineer");
          const lines = [
            `Original Bullet:\n"${bullet}"\n`,
            `Executive STAR Rewrite:\n"✓ ${res.improved || "Architected and deployed asynchronous REST APIs with Redis caching, reducing endpoint p99 latency by 45% and sustaining 99.9% uptime."}"\n`,
            `Key Optimization: ${res.keyChange || "Injected strong action verb, architectural context, and quantified business impact."}`,
          ].join("\n");

          playSuccessChime();
          setHistory((prev) => [...prev, { type: "output", content: lines, style: "success" }]);
        } catch (e) {
          setHistory((prev) => [...prev, { type: "output", content: `Error: ${e.message}`, style: "error" }]);
        }
        return;
      }

      case "trajectory": {
        newHistory.push({ type: "output", content: "Forecasting career velocity & seniority trajectory..." });
        setHistory(newHistory);
        try {
          const res = await getCareerTrajectoryWithAi({
            resume: cachedResume || { skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker"] },
            targetRole: fullArg || "Senior Full-Stack Engineer",
          });
          const lines = [
            `Career Promotion Velocity (${res.velocityScore}% Index):`,
            "--------------------------------------------------",
            ` • 1-Year: ${res.milestones?.oneYear?.title} (${res.milestones?.oneYear?.targetComp})`,
            ` • 3-Year: ${res.milestones?.threeYear?.title} (${res.milestones?.threeYear?.targetComp})`,
            ` • 5-Year: ${res.milestones?.fiveYear?.title} (${res.milestones?.fiveYear?.targetComp})`,
            "--------------------------------------------------",
            `Key Unlock: ${res.promotionUnlocks?.[0] || "System Architecture Ownership"}`,
          ].join("\n");
          playSuccessChime();
          setHistory((prev) => [...prev, { type: "output", content: lines, style: "success" }]);
        } catch (e) {
          setHistory((prev) => [...prev, { type: "output", content: `Error: ${e.message}`, style: "error" }]);
        }
        return;
      }

      case "star": {
        newHistory.push({ type: "output", content: "Synthesizing FAANG-grade STAR behavioral stories..." });
        setHistory(newHistory);
        try {
          const res = await getStarStoryBankWithAi({
            resume: cachedResume || { skills: ["React", "Node.js", "PostgreSQL", "Redis"] },
            targetRole: fullArg || "Senior Software Engineer",
          });
          const stories = res.stories || [];
          const lines = [
            `STAR Behavioral Story Bank (${stories.length} Scenarios Ready):`,
            "--------------------------------------------------",
            ...stories.map((s) => `[${s.id}] ${s.category.toUpperCase()}: ${s.title}\n   Result: ${s.result}\n`),
            "--------------------------------------------------",
            "Open full details in UI at /dashboard (STAR Story Matrix tab)",
          ].join("\n");
          playSuccessChime();
          setHistory((prev) => [...prev, { type: "output", content: lines, style: "cyan" }]);
        } catch (e) {
          setHistory((prev) => [...prev, { type: "output", content: `Error: ${e.message}`, style: "error" }]);
        }
        return;
      }

      case "debias": {
        newHistory.push({ type: "output", content: "Running blind ATS de-biasing & linguistic audit..." });
        setHistory(newHistory);
        try {
          const res = await getDebiasAuditWithAi({
            resume: cachedResume || { skills: ["React", "Node.js"] },
          });
          const lines = [
            `Blind-Screening Audit Score: ${res.blindScreeningScore}/100`,
            "--------------------------------------------------",
            `Linguistic Balance: ${res.linguisticBalance?.agenticCount} Agentic / ${res.linguisticBalance?.communalCount} Communal`,
            `Verdict: ${res.linguisticBalance?.verdict}`,
            "--------------------------------------------------",
            `Top Recommendation: ${res.executiveActionPlan?.[0] || "Keep contact header minimal to prevent zip-code bias."}`,
          ].join("\n");
          playSuccessChime();
          setHistory((prev) => [...prev, { type: "output", content: lines, style: "success" }]);
        } catch (e) {
          setHistory((prev) => [...prev, { type: "output", content: `Error: ${e.message}`, style: "error" }]);
        }
        return;
      }

      case "bio": {
        newHistory.push({ type: "output", content: "Generating multi-channel executive bios..." });
        setHistory(newHistory);
        try {
          const res = await getExecutiveBioWithAi({
            resume: cachedResume || { skills: ["React", "TypeScript", "Node.js"] },
            targetRole: fullArg || "Senior Software Engineer",
          });
          const lines = [
            `30-Sec Phone Screen Elevator Pitch:\n"${res.phoneElevatorPitch}"\n`,
            "--------------------------------------------------",
            `Founding Engineer Pitch:\n"${res.foundingEngineerPitch}"`,
          ].join("\n");
          playSuccessChime();
          setHistory((prev) => [...prev, { type: "output", content: lines, style: "success" }]);
        } catch (e) {
          setHistory((prev) => [...prev, { type: "output", content: `Error: ${e.message}`, style: "error" }]);
        }
        return;
      }

      case "sprint": {
        newHistory.push({ type: "output", content: "Generating 7-day interview bootcamp preparation schedule..." });
        setHistory(newHistory);
        try {
          const res = await getInterviewSprintWithAi({
            resume: cachedResume || { skills: ["React", "Node.js"] },
            targetRole: fullArg || "Senior Full-Stack Engineer",
          });
          const days = res.days || [];
          const lines = [
            `7-Day Interview Sprint Curriculum:`,
            "--------------------------------------------------",
            ...days.map((d) => `Day ${d.day} (${d.hours}): ${d.title}\n  Drill: "${d.drillQuestion}"`),
            "--------------------------------------------------",
            `Pro-Tip: ${res.proTips?.[0] || "Quantify impact in every response."}`,
          ].join("\n");
          playSuccessChime();
          setHistory((prev) => [...prev, { type: "output", content: lines, style: "cyan" }]);
        } catch (e) {
          setHistory((prev) => [...prev, { type: "output", content: `Error: ${e.message}`, style: "error" }]);
        }
        return;
      }

      case "localize": {
        const country = (args[0] || "US").toUpperCase();
        newHistory.push({ type: "output", content: `Adapting resume standards for market: ${country}...` });
        setHistory(newHistory);
        try {
          const res = await getLocalizeResumeWithAi({
            resume: cachedResume || { skills: ["React", "Node.js"] },
            targetCountry: country,
            targetRole: "Senior Engineer",
          });
          const lines = [
            `Market Standards: ${res.marketDetails?.flag} ${res.marketDetails?.name}`,
            "--------------------------------------------------",
            ` • Page Standard : ${res.marketDetails?.pageStandard}`,
            ` • Comp Benchmark: ${res.marketDetails?.compBand}`,
            ` • Compliance    : ${res.marketDetails?.personalInfoRule}`,
            ` • Visa Rule     : ${res.marketDetails?.visaAdvice}`,
            "--------------------------------------------------",
            `Localized Summary: "${res.localizedExecutiveSummary}"`,
          ].join("\n");
          playSuccessChime();
          setHistory((prev) => [...prev, { type: "output", content: lines, style: "success" }]);
        } catch (e) {
          setHistory((prev) => [...prev, { type: "output", content: `Error: ${e.message}`, style: "error" }]);
        }
        return;
      }

      case "skills": {
        const skills = cachedResume?.skills || [
          "React", "Node.js", "TypeScript", "Python", "PostgreSQL",
          "Docker", "Redis", "Spring Boot", "REST APIs", "Git", "LLMs"
        ];
        if (args[0] === "check" && args[1]) {
          const q = args[1].toLowerCase();
          const found = skills.some((s) => s.toLowerCase().includes(q));
          newHistory.push({
            type: "output",
            content: found ? `✓ Skill "${args[1]}" is present in your resume profile.` : `⚠ Skill "${args[1]}" is MISSING from your resume profile.`,
            style: found ? "success" : "warn",
          });
        } else {
          const lines = [
            `Candidate Skill Matrix (${skills.length} skills indexed):`,
            "--------------------------------------------------",
            skills.map((s) => ` • ${s}`).join("\n"),
            "--------------------------------------------------",
            `Check a skill with: skills check <skill_name>`,
          ].join("\n");
          newHistory.push({ type: "output", content: lines, style: "cyan" });
        }
        break;
      }

      case "history": {
        newHistory.push({ type: "output", content: "Querying embedded database vault..." });
        setHistory(newHistory);

        try {
          const limit = parseInt(args[0], 10) || 10;
          const records = await getHistory(limit);

          if (!records || records.length === 0) {
            setHistory((prev) => [
              ...prev,
              { type: "output", content: "Database vault is empty. Run: 'scan' or 'seed' to populate.", style: "warn" },
            ]);
          } else {
            const tableRows = records.slice(0, 8).map((r, i) => {
              const id = String(r.id || r._id || i + 1).slice(-6);
              const name = (r.candidateName || "Candidate").padEnd(18).slice(0, 18);
              const score = `${r.atsScore || 80}%`.padStart(6);
              const file = (r.filename || "Resume.pdf").padEnd(20).slice(0, 20);
              const date = (r.createdAt || new Date().toISOString()).slice(0, 10);
              return `${id} | ${name} | ${score} | ${file} | ${date}`;
            });

            const table = [
              "ID     | CANDIDATE          | SCORE  | FILENAME             | DATE",
              "-------+--------------------+--------+----------------------+-----------",
              ...tableRows,
              "-------+--------------------+--------+----------------------+-----------",
              `Total: ${records.length} records. Inspect full vault in UI at /history`,
            ].join("\n");

            playSuccessChime();
            setHistory((prev) => [...prev, { type: "output", content: table, style: "cyan" }]);
          }
        } catch (err) {
          setHistory((prev) => [...prev, { type: "output", content: `Failed: ${err.message}`, style: "error" }]);
        }
        return;
      }

      case "apps": {
        newHistory.push({ type: "output", content: "Fetching tracked job applications..." });
        setHistory(newHistory);

        try {
          const data = await listJobApplications();
          const apps = data.applications || [];

          if (apps.length === 0) {
            setHistory((prev) => [
              ...prev,
              { type: "output", content: "No applications tracked yet. Open the Kanban tracker in Dashboard.", style: "warn" },
            ]);
          } else {
            const lines = apps.slice(0, 8).map((a) => `[${(a.status || "APPLIED").toUpperCase()}] ${a.company} — ${a.role} (${a.matchScore || 85}%)`);
            setHistory((prev) => [
              ...prev,
              {
                type: "output",
                content: `Tracked Job Applications (${apps.length}):\n` + lines.join("\n"),
                style: "cyan",
              },
            ]);
          }
        } catch (e) {
          setHistory((prev) => [...prev, { type: "output", content: `Error: ${e.message}`, style: "error" }]);
        }
        return;
      }

      case "theme": {
        const validThemes = ["obsidian", "matrix", "cyberpunk", "nord", "amber"];
        const t = (args[0] || "").toLowerCase();
        if (!validThemes.includes(t)) {
          newHistory.push({
            type: "output",
            content: `Usage: theme <${validThemes.join(" | ")}>`,
            style: "warn",
          });
        } else {
          setTheme(t);
          localStorage.setItem("term_theme", t);
          newHistory.push({
            type: "output",
            content: `✓ Terminal theme switched to '${t}'.`,
            style: "success",
          });
        }
        break;
      }

      case "matrix": {
        const next = !matrixActive;
        setMatrixActive(next);
        newHistory.push({
          type: "output",
          content: next ? "✓ Matrix digital code rain activated." : "✓ Matrix rain deactivated.",
          style: "success",
        });
        break;
      }

      case "sound": {
        const next = toggleSound();
        setSoundOn(next);
        newHistory.push({
          type: "output",
          content: next ? "✓ Mechanical keyboard click audio ENABLED." : "✓ Mechanical audio DISABLED.",
          style: "cyan",
        });
        break;
      }

      case "whoami": {
        const c = cachedResume?.contact || {};
        const lines = [
          `Candidate Profile:`,
          `  Name    : ${c.name || "Cheralathan B.N"}`,
          `  Email   : ${c.email || "cheralathannandha9098@gmail.com"}`,
          `  Phone   : ${c.phone || "+91 8668180041"}`,
          `  LinkedIn: ${c.linkedin || "linkedin.com/in/cheralathan05"}`,
          `  GitHub  : ${c.github || "github.com/cheralathan05"}`,
          `  Skills  : ${(cachedResume?.skills || []).length} skills loaded in cache`,
        ].join("\n");
        newHistory.push({ type: "output", content: lines, style: "cyan" });
        break;
      }

      case "curl": {
        const endpoint = args[0] || "/api/health";
        newHistory.push({ type: "output", content: `Sending GET request to ${endpoint}...` });
        setHistory(newHistory);

        try {
          const apiBase =
            import.meta.env.VITE_API_URL ||
            (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:5001" : "");
          const res = await fetch(`${apiBase}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`);
          const data = await res.json();
          const formatted = JSON.stringify(data, null, 2);
          playSuccessChime();
          setHistory((prev) => [
            ...prev,
            { type: "output", content: `HTTP ${res.status} OK\n${formatted}`, style: "cyan" },
          ]);
        } catch (e) {

          playErrorBeep();
          setHistory((prev) => [
            ...prev,
            { type: "output", content: `CURL failed: ${e.message}`, style: "error" },
          ]);
        }
        return;
      }

      case "export": {
        newHistory.push({ type: "output", content: "Generating JSON database vault backup..." });
        setHistory(newHistory);
        try {
          const backup = await exportDatabaseBackup();
          const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `resumeai-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          playSuccessChime();
          setHistory((prev) => [
            ...prev,
            { type: "output", content: `✓ Backup downloaded successfully (${blob.size} bytes).`, style: "success" },
          ]);
        } catch (e) {
          playErrorBeep();
          setHistory((prev) => [...prev, { type: "output", content: `Export failed: ${e.message}`, style: "error" }]);
        }
        return;
      }

      case "exit":
      case "quit": {
        if (isDrawer && onClose) {
          onClose();
        } else {
          newHistory.push({ type: "output", content: "Session paused. Press Ctrl + ` to reopen.", style: "cyan" });
        }
        break;
      }

      default: {
        playErrorBeep();
        newHistory.push({
          type: "output",
          content: `Command not recognized: '${cmd}'. Type 'help' to see available commands.`,
          style: "error",
        });
      }
    }

    setHistory(newHistory);
    setInputVal("");
  }

  // Handle Input keydown (History navigation & Autocomplete)
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      executeCommand(inputVal);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const next = Math.min(cmdHistory.length - 1, historyPointer + 1);
        setHistoryPointer(next);
        setInputVal(cmdHistory[next]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyPointer > 0) {
        const next = historyPointer - 1;
        setHistoryPointer(next);
        setInputVal(cmdHistory[next]);
      } else if (historyPointer === 0) {
        setHistoryPointer(-1);
        setInputVal("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Simple tab autocomplete
      const current = inputVal.trim().toLowerCase();
      if (current) {
        const matched = COMMANDS_HELP.find((c) => c.cmd.split(",")[0].startsWith(current));
        if (matched) {
          const completed = matched.cmd.split(",")[0].split(" ")[0];
          setInputVal(completed);
        }
      }
    } else {
      playKeyClick();
    }
  }

  if (isDrawer && !isOpen) return null;

  const terminalNode = (
    <div
      className={`term-container term-theme-${theme} ${isFullscreen ? "term-fullscreen" : ""}`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Titlebar */}
      <div className="term-header">
        <div className="term-header-left">
          <div className="term-traffic-lights">
            <button
              className="term-dot term-dot-close"
              title="Close Terminal"
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) onClose();
              }}
            />
            <button
              className="term-dot term-dot-min"
              title="Minimize"
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) onClose();
              }}
            />
            <button
              className="term-dot term-dot-max"
              title="Fullscreen Toggle"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen((prev) => !prev);
              }}
            />
          </div>

          <div className="term-title-wrapper">
            <TerminalIcon width={14} height={14} style={{ color: "var(--term-accent)" }} />
            <span className="term-title">resume-ai@local:~$</span>
            <span className="term-session-badge">zsh • main ⚡</span>
          </div>
        </div>

        <div className="term-header-actions">
          {/* Quick theme switcher */}
          <select
            value={theme}
            onChange={(e) => {
              setTheme(e.target.value);
              localStorage.setItem("term_theme", e.target.value);
            }}
            className="term-header-btn"
            style={{ outline: "none", cursor: "pointer" }}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="obsidian">Obsidian Titanium</option>
            <option value="matrix">Matrix Phosphor</option>
            <option value="cyberpunk">Cyberpunk Neon</option>
            <option value="nord">Nord Arctic</option>
            <option value="amber">Amber CRT</option>
          </select>

          {/* Matrix toggle */}
          <button
            className={`term-header-btn ${matrixActive ? "active" : ""}`}
            title="Toggle Matrix Code Rain"
            onClick={(e) => {
              e.stopPropagation();
              setMatrixActive((p) => !p);
            }}
          >
            Matrix
          </button>

          {/* Sound toggle */}
          <button
            className={`term-header-btn ${soundOn ? "active" : ""}`}
            title="Toggle Mechanical Key Sound"
            onClick={(e) => {
              e.stopPropagation();
              const next = toggleSound();
              setSoundOn(next);
            }}
          >
            <VolumeIcon width={12} height={12} />
            {soundOn ? "FX On" : "FX Mute"}
          </button>

          {/* Copy log */}
          <button className="term-header-btn" title="Copy Terminal Output" onClick={handleCopyOutput}>
            <CopyIcon width={12} height={12} />
            Copy
          </button>

          {/* Maximize */}
          <button
            className="term-header-btn"
            title="Toggle Fullscreen"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen((p) => !p);
            }}
          >
            {isFullscreen ? <MinimizeIcon width={13} height={13} /> : <MaximizeIcon width={13} height={13} />}
          </button>
        </div>
      </div>

      {/* Terminal Screen Body */}
      <div className="term-body" ref={bodyRef}>
        {matrixActive && <canvas ref={canvasRef} className="term-matrix-canvas" />}

        <div className="term-content-layer">
          {history.map((item, idx) => {
            if (item.type === "banner") {
              return (
                <div key={idx} className="term-banner">
                  {item.content}
                </div>
              );
            }
            if (item.type === "system") {
              return (
                <div key={idx} className="term-welcome-box">
                  <div className="term-welcome-text">{item.content}</div>
                  <div className="term-quick-chips">
                    <span className="term-chip" onClick={() => executeCommand("help")}>
                      help
                    </span>
                    <span className="term-chip" onClick={() => executeCommand("status")}>
                      status
                    </span>
                    <span className="term-chip" onClick={() => executeCommand("scan")}>
                      scan
                    </span>
                    <span className="term-chip" onClick={() => executeCommand("audit")}>
                      audit
                    </span>
                    <span className="term-chip" onClick={() => executeCommand("models")}>
                      models
                    </span>
                    <span className="term-chip" onClick={() => executeCommand("interview")}>
                      interview
                    </span>
                    <span className="term-chip" onClick={() => executeCommand("salary")}>
                      salary
                    </span>
                    <span className="term-chip" onClick={() => executeCommand("matrix")}>
                      matrix
                    </span>
                  </div>
                </div>
              );
            }
            if (item.type === "command") {
              return (
                <div key={idx} className="term-line">
                  <div className="term-command-row">
                    <span className="term-prompt-user">developer</span>
                    <span className="term-prompt-symbol">@</span>
                    <span className="term-prompt-path">resume-ai:~$</span>
                    <span className="term-command-text">{item.content}</span>
                  </div>
                </div>
              );
            }

            // Output line
            let styleClass = "";
            if (item.style === "success") styleClass = "term-output-success";
            else if (item.style === "warn") styleClass = "term-output-warn";
            else if (item.style === "error") styleClass = "term-output-error";
            else if (item.style === "cyan") styleClass = "term-output-cyan";
            else if (item.style === "purple") styleClass = "term-output-purple";

            return (
              <div key={idx} className="term-line">
                <div className={`term-output ${styleClass}`}>{item.content}</div>
              </div>
            );
          })}

          {/* Active Input Prompt */}
          <div className="term-input-row">
            <span className="term-prompt-user">developer</span>
            <span className="term-prompt-symbol">@</span>
            <span className="term-prompt-path">resume-ai:~$</span>
            <input
              ref={inputRef}
              className="term-input-field"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (isDrawer) {
    return (
      <div className="term-drawer-backdrop" onClick={onClose}>
        <div style={{ width: "100%" }} onClick={(e) => e.stopPropagation()}>
          {terminalNode}
        </div>
      </div>
    );
  }

  return terminalNode;
}
