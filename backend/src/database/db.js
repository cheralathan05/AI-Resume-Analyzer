const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Self-contained Embedded JSON Document Database.
 * Runs with zero external setup, no MongoDB daemon required.
 * Safely persists data to `backend/data/db.json` with atomic writes.
 */

const DATA_DIR = path.resolve(__dirname, "..", "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// In-memory cache
let state = {
  users: [],
  resumes: [],
  analyses: [],
  tailoredResumes: [],
  coverLetters: [],
  interviewPreps: [],
  multiMatches: [],
  applications: [],
  settings: {
    ollamaModel: "qwen3:8b",
    ollamaHost: "http://127.0.0.1:11434",
    autoAiAnalyze: false,
  },
};

// Cryptographic helpers for password hashing and tamper-proof session tokens
const AUTH_SECRET = process.env.JWT_SECRET || "resume-ai-studio-secure-auth-secret-key-2026";

function hashPassword(password, salt = null) {
  const userSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, userSalt, 1000, 64, "sha512").toString("hex");
  return { hash, salt: userSalt };
}

function verifyPasswordHash(password, hash, salt) {
  try {
    const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
  } catch {
    return false;
  }
}

function createToken(userId) {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30-day session
  const payload = `${userId}:${expiresAt}`;
  const hmac = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${hmac}`;
}

function verifyTokenPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [b64Payload, hmac] = parts;
  try {
    const payload = Buffer.from(b64Payload, "base64url").toString("utf8");
    const expectedHmac = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
    if (hmac !== expectedHmac) return null;
    const [userId, expiresAtStr] = payload.split(":");
    const expiresAt = parseInt(expiresAtStr, 10);
    if (Date.now() > expiresAt) return null;
    return userId;
  } catch {
    return null;
  }
}

// Ensure data directory exists
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load database from disk
function load() {
  try {
    ensureDir();
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw);
      state = {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        resumes: Array.isArray(parsed.resumes) ? parsed.resumes : [],
        analyses: Array.isArray(parsed.analyses) ? parsed.analyses : [],
        tailoredResumes: Array.isArray(parsed.tailoredResumes) ? parsed.tailoredResumes : [],
        coverLetters: Array.isArray(parsed.coverLetters) ? parsed.coverLetters : [],
        interviewPreps: Array.isArray(parsed.interviewPreps) ? parsed.interviewPreps : [],
        multiMatches: Array.isArray(parsed.multiMatches) ? parsed.multiMatches : [],
        applications: Array.isArray(parsed.applications) ? parsed.applications : [],
        settings: { ...state.settings, ...(parsed.settings || {}) },
      };
      if (state.users.length === 0) {
        seedUsersInternal();
      }
      console.log(`[database] Loaded ${state.users.length} users, ${state.resumes.length} resumes, ${state.analyses.length} analyses.`);
    } else {
      seedUsersInternal();
      saveSync();
      console.log("[database] Initialized new local database file at:", DB_FILE);
    }
  } catch (err) {
    console.error("[database] Failed to load local database, initializing fresh:", err.message);
    state = {
      users: [],
      resumes: [],
      analyses: [],
      tailoredResumes: [],
      coverLetters: [],
      interviewPreps: [],
      multiMatches: [],
      applications: [],
      settings: state.settings,
    };
    seedUsersInternal();
  }
}

function seedUsersInternal() {
  state.users = state.users || [];
  const defaults = [
    {
      id: "usr_cheralathan",
      email: "cheralathannandha9098@gmail.com",
      password: "password123",
      name: "Cheralathan B.N",
      role: "Full-Stack & Generative AI Engineer",
      targetTitle: "Senior Full-Stack & Generative AI Architect",
      targetLocation: "Tamil Nadu, India / Remote",
      targetSalary: "$150,000 - $185,000",
      bio: "High-impact Full-Stack and Generative AI Engineer with expertise in React, Node.js, Spring Boot, MySQL, and LLM integrations. Proven track record optimizing backend response latencies by 35% through Redis caching.",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Cheralathan",
      skills: ["React", "Next.js", "Node.js", "TypeScript", "Python", "Spring Boot", "MySQL", "PostgreSQL", "Redis", "Docker", "LLMs"],
    },
    {
      id: "usr_demo_1",
      email: "demo@resumeai.io",
      password: "demo123456",
      name: "Alex Rivera",
      role: "Senior Full Stack Engineer",
      targetTitle: "Senior Full-Stack Architect",
      targetLocation: "San Francisco, CA / Remote",
      targetSalary: "$165,000 - $195,000",
      bio: "Senior Full-Stack Engineer with 6+ years designing microservices in Node.js, React, and cloud distributed infrastructure.",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=AlexRivera",
      skills: ["React", "Node.js", "TypeScript", "Docker", "AWS", "PostgreSQL", "REST APIs", "GraphQL"],
    },
    {
      id: "usr_pro_2",
      email: "jordan.vance@techcorp.io",
      password: "pro123456",
      name: "Jordan Vance",
      role: "Staff Platform Architect",
      targetTitle: "Staff / Principal Cloud Systems Engineer",
      targetLocation: "New York, NY / Hybrid",
      targetSalary: "$190,000 - $240,000",
      bio: "10+ years engineering resilient cloud platforms, Zero Trust security networks, and high-throughput backend systems.",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=JordanVance",
      skills: ["Kubernetes", "Terraform", "AWS", "Go", "Distributed Systems", "gRPC", "Prometheus", "Kafka"],
    },
  ];
  for (const du of defaults) {
    if (!state.users.some((u) => u.email === du.email)) {
      const { hash, salt } = hashPassword(du.password);
      state.users.push({
        id: du.id,
        email: du.email,
        passwordHash: hash,
        passwordSalt: salt,
        name: du.name,
        role: du.role,
        targetTitle: du.targetTitle,
        targetLocation: du.targetLocation,
        targetSalary: du.targetSalary,
        bio: du.bio,
        avatarUrl: du.avatarUrl,
        skills: du.skills,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

// Write to disk atomically using temporary file + rename
let saveTimeout = null;
function save() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveSync();
  }, 100);
}

function saveSync() {
  try {
    ensureDir();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), "utf8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("[database] Failed saving to disk:", err.message);
  }
}

// Initialize on require
load();

function generateId() {
  return crypto.randomBytes(8).toString("hex");
}

const db = {
  users: {
    insert(doc) {
      if (!doc.email || !doc.password) {
        throw new Error("Email and password are required.");
      }
      state.users = state.users || [];
      const cleanEmail = doc.email.trim().toLowerCase();
      const existing = state.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        throw new Error("An account with this email address already exists.");
      }
      const { hash, salt } = hashPassword(doc.password);
      const record = {
        id: doc.id || generateId(),
        email: cleanEmail,
        passwordHash: hash,
        passwordSalt: salt,
        name: doc.name || cleanEmail.split("@")[0],
        role: doc.role || "Software Engineer",
        targetTitle: doc.targetTitle || doc.role || "Software Engineer",
        targetLocation: doc.targetLocation || "Remote",
        targetSalary: doc.targetSalary || "$130,000 - $170,000",
        bio: doc.bio || "",
        avatarUrl: doc.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(doc.name || cleanEmail)}`,
        skills: Array.isArray(doc.skills) ? doc.skills : ["React", "Node.js", "TypeScript"],
        createdAt: doc.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.users.unshift(record);
      save();
      return this.sanitize(record);
    },
    sanitize(user) {
      if (!user) return null;
      const { passwordHash, passwordSalt, ...safe } = user;
      return safe;
    },
    findByEmail(email) {
      if (!email) return null;
      state.users = state.users || [];
      const clean = email.trim().toLowerCase();
      return state.users.find((u) => u.email.toLowerCase() === clean) || null;
    },
    findById(id) {
      state.users = state.users || [];
      return state.users.find((u) => u.id === id) || null;
    },
    verifyPassword(email, password) {
      const user = this.findByEmail(email);
      if (!user) return null;
      if (!verifyPasswordHash(password, user.passwordHash, user.passwordSalt)) {
        return null;
      }
      return this.sanitize(user);
    },
    update(id, updates) {
      state.users = state.users || [];
      const user = state.users.find((u) => u.id === id);
      if (!user) return null;
      const allowed = ["name", "role", "targetTitle", "targetLocation", "targetSalary", "bio", "avatarUrl", "skills"];
      allowed.forEach((field) => {
        if (updates[field] !== undefined) {
          user[field] = updates[field];
        }
      });
      if (updates.password) {
        const { hash, salt } = hashPassword(updates.password);
        user.passwordHash = hash;
        user.passwordSalt = salt;
      }
      user.updatedAt = new Date().toISOString();
      save();
      return this.sanitize(user);
    },
    findAll(limit = 50) {
      state.users = state.users || [];
      return state.users.slice(0, limit).map((u) => this.sanitize(u));
    },
    deleteById(id) {
      state.users = state.users || [];
      const idx = state.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        const removed = state.users.splice(idx, 1)[0];
        save();
        return this.sanitize(removed);
      }
      return null;
    },
    generateToken(user) {
      return createToken(user.id);
    },
    verifyToken(token) {
      const userId = verifyTokenPayload(token);
      if (!userId) return null;
      const user = this.findById(userId);
      return user ? this.sanitize(user) : null;
    },
    seedDefaultUsers() {
      seedUsersInternal();
      saveSync();
      return state.users.map((u) => this.sanitize(u));
    },
  },

  resumes: {
    insert(doc) {
      const record = {
        id: doc.id || generateId(),
        userId: doc.userId || null,
        filename: doc.filename || "resume.pdf",
        originalName: doc.originalName || doc.filename || "resume.pdf",
        mimetype: doc.mimetype || "application/pdf",
        size: doc.size || 0,
        parsedData: doc.parsedData || doc.resume || null,
        createdAt: doc.createdAt || new Date().toISOString(),
      };
      state.resumes.unshift(record);
      // Keep recent 100
      if (state.resumes.length > 100) {
        state.resumes = state.resumes.slice(0, 100);
      }
      save();
      return record;
    },
    findById(id) {
      return state.resumes.find((r) => r.id === id) || null;
    },
    findAll(limit = 50, userId = null) {
      state.resumes = state.resumes || [];
      if (userId) {
        const userSpecific = state.resumes.filter((r) => r.userId === userId);
        const general = state.resumes.filter((r) => !r.userId);
        return [...userSpecific, ...general].slice(0, limit);
      }
      return state.resumes.slice(0, limit);
    },
    deleteById(id) {
      const idx = state.resumes.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const removed = state.resumes.splice(idx, 1)[0];
        save();
        return removed;
      }
      return null;
    },
  },

  analyses: {
    insert(doc) {
      const record = {
        id: doc.id || generateId(),
        userId: doc.userId || null,
        resumeId: doc.resumeId || null,
        filename: doc.filename || "Resume",
        candidateName: doc.candidateName || doc.resume?.contact?.name || "Candidate",
        jobDescription: doc.jobDescription || "",
        atsScore: doc.atsScore ?? 0,
        skillMatch: doc.skillMatch ?? 0,
        completeness: doc.resumeCompleteness ?? doc.completeness ?? 0,
        matchedKeywords: doc.matchedKeywords || [],
        missingKeywords: doc.missingKeywords || [],
        suggestions: doc.suggestions || [],
        aiAnalysis: doc.aiAnalysis || null,
        resume: doc.resume || null,
        createdAt: doc.createdAt || new Date().toISOString(),
      };
      state.analyses.unshift(record);
      // Keep recent 100
      if (state.analyses.length > 100) {
        state.analyses = state.analyses.slice(0, 100);
      }
      save();
      return record;
    },
    findById(id) {
      return state.analyses.find((a) => a.id === id) || null;
    },
    updateAiAnalysis(id, aiAnalysis) {
      const item = state.analyses.find((a) => a.id === id);
      if (item) {
        item.aiAnalysis = aiAnalysis;
        save();
        return item;
      }
      return null;
    },
    findAll(limit = 50, userId = null) {
      state.analyses = state.analyses || [];
      if (userId) {
        const userSpecific = state.analyses.filter((a) => a.userId === userId);
        const general = state.analyses.filter((a) => !a.userId);
        return [...userSpecific, ...general].slice(0, limit);
      }
      return state.analyses.slice(0, limit);
    },
    deleteById(id) {
      const idx = state.analyses.findIndex((a) => a.id === id);
      if (idx !== -1) {
        const removed = state.analyses.splice(idx, 1)[0];
        save();
        return removed;
      }
      return null;
    },
  },

  tailoredResumes: {
    insert(doc) {
      const record = {
        id: doc.id || generateId(),
        userId: doc.userId || null,
        resumeId: doc.resumeId || null,
        targetRole: doc.targetRole || "Software Engineer",
        candidateName: doc.candidateName || "Candidate",
        jobDescription: doc.jobDescription || "",
        tailoredSummary: doc.tailoredSummary || "",
        bulletRewrites: doc.bulletRewrites || [],
        recommendedSkills: doc.recommendedSkills || [],
        fullTailoredResume: doc.fullTailoredResume || null,
        createdAt: doc.createdAt || new Date().toISOString(),
      };
      state.tailoredResumes.unshift(record);
      if (state.tailoredResumes.length > 50) state.tailoredResumes = state.tailoredResumes.slice(0, 50);
      save();
      return record;
    },
    findAll(limit = 50, userId = null) {
      state.tailoredResumes = state.tailoredResumes || [];
      if (userId) {
        const userSpecific = state.tailoredResumes.filter((t) => t.userId === userId);
        const general = state.tailoredResumes.filter((t) => !t.userId);
        return [...userSpecific, ...general].slice(0, limit);
      }
      return state.tailoredResumes.slice(0, limit);
    },
    findById(id) {
      return state.tailoredResumes.find((t) => t.id === id) || null;
    },
    deleteById(id) {
      const idx = state.tailoredResumes.findIndex((t) => t.id === id);
      if (idx !== -1) {
        const removed = state.tailoredResumes.splice(idx, 1)[0];
        save();
        return removed;
      }
      return null;
    },
  },

  coverLetters: {
    insert(doc) {
      const record = {
        id: doc.id || generateId(),
        userId: doc.userId || null,
        candidateName: doc.candidateName || "Candidate",
        targetRole: doc.targetRole || "Position",
        companyName: doc.companyName || "Hiring Team",
        tone: doc.tone || "Professional",
        content: doc.content || "",
        hook: doc.hook || "",
        createdAt: doc.createdAt || new Date().toISOString(),
      };
      state.coverLetters.unshift(record);
      if (state.coverLetters.length > 50) state.coverLetters = state.coverLetters.slice(0, 50);
      save();
      return record;
    },
    findAll(limit = 50, userId = null) {
      state.coverLetters = state.coverLetters || [];
      if (userId) {
        const userSpecific = state.coverLetters.filter((c) => c.userId === userId);
        const general = state.coverLetters.filter((c) => !c.userId);
        return [...userSpecific, ...general].slice(0, limit);
      }
      return state.coverLetters.slice(0, limit);
    },
    findById(id) {
      return state.coverLetters.find((c) => c.id === id) || null;
    },
    deleteById(id) {
      const idx = state.coverLetters.findIndex((c) => c.id === id);
      if (idx !== -1) {
        const removed = state.coverLetters.splice(idx, 1)[0];
        save();
        return removed;
      }
      return null;
    },
  },

  interviewPreps: {
    insert(doc) {
      const record = {
        id: doc.id || generateId(),
        userId: doc.userId || null,
        candidateName: doc.candidateName || "Candidate",
        targetRole: doc.targetRole || "Target Role",
        questions: doc.questions || [],
        evaluations: doc.evaluations || [],
        createdAt: doc.createdAt || new Date().toISOString(),
      };
      state.interviewPreps.unshift(record);
      if (state.interviewPreps.length > 50) state.interviewPreps = state.interviewPreps.slice(0, 50);
      save();
      return record;
    },
    findAll(limit = 50, userId = null) {
      state.interviewPreps = state.interviewPreps || [];
      if (userId) {
        const userSpecific = state.interviewPreps.filter((p) => p.userId === userId);
        const general = state.interviewPreps.filter((p) => !p.userId);
        return [...userSpecific, ...general].slice(0, limit);
      }
      return state.interviewPreps.slice(0, limit);
    },
    findById(id) {
      return state.interviewPreps.find((p) => p.id === id) || null;
    },
    deleteById(id) {
      const idx = state.interviewPreps.findIndex((p) => p.id === id);
      if (idx !== -1) {
        const removed = state.interviewPreps.splice(idx, 1)[0];
        save();
        return removed;
      }
      return null;
    },
    saveEvaluation(prepId, evaluation) {
      const item = state.interviewPreps.find((p) => p.id === prepId);
      if (item) {
        item.evaluations = item.evaluations || [];
        item.evaluations.push({ id: generateId(), ...evaluation, timestamp: new Date().toISOString() });
        save();
        return item;
      }
      return null;
    },
  },

  multiMatches: {
    insert(doc) {
      const record = {
        id: doc.id || generateId(),
        userId: doc.userId || null,
        candidateName: doc.candidateName || "Candidate",
        comparisons: doc.comparisons || [],
        recommendedRole: doc.recommendedRole || "",
        createdAt: doc.createdAt || new Date().toISOString(),
      };
      state.multiMatches.unshift(record);
      if (state.multiMatches.length > 50) state.multiMatches = state.multiMatches.slice(0, 50);
      save();
      return record;
    },
    findAll(limit = 50, userId = null) {
      state.multiMatches = state.multiMatches || [];
      if (userId) {
        const userSpecific = state.multiMatches.filter((m) => m.userId === userId);
        const general = state.multiMatches.filter((m) => !m.userId);
        return [...userSpecific, ...general].slice(0, limit);
      }
      return state.multiMatches.slice(0, limit);
    },
    findById(id) {
      return state.multiMatches.find((m) => m.id === id) || null;
    },
    deleteById(id) {
      const idx = state.multiMatches.findIndex((m) => m.id === id);
      if (idx !== -1) {
        const removed = state.multiMatches.splice(idx, 1)[0];
        save();
        return removed;
      }
      return null;
    },
  },

  applications: {
    insert(doc) {
      const record = {
        id: doc.id || generateId(),
        userId: doc.userId || null,
        candidateName: doc.candidateName || "Candidate",
        company: doc.company || "Target Company",
        role: doc.role || "Software Engineer",
        status: doc.status || "Applied",
        salaryEstimate: doc.salaryEstimate || "$130,000 - $170,000",
        atsScore: typeof doc.atsScore === "number" ? doc.atsScore : 85,
        location: doc.location || "Remote / Hybrid",
        appliedDate: doc.appliedDate || new Date().toISOString().split("T")[0],
        jobUrl: doc.jobUrl || "",
        notes: doc.notes || "",
        interviewRounds: Array.isArray(doc.interviewRounds) ? doc.interviewRounds : ["Application Submitted"],
        createdAt: doc.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.applications = state.applications || [];
      state.applications.unshift(record);
      if (state.applications.length > 200) state.applications = state.applications.slice(0, 200);
      save();
      return record;
    },
    findAll(limit = 100, userId = null) {
      state.applications = state.applications || [];
      if (userId) {
        const userSpecific = state.applications.filter((a) => a.userId === userId);
        const general = state.applications.filter((a) => !a.userId);
        return [...userSpecific, ...general].slice(0, limit);
      }
      return state.applications.slice(0, limit);
    },
    findById(id) {
      return (state.applications || []).find((a) => a.id === id) || null;
    },
    update(id, updates) {
      state.applications = state.applications || [];
      const item = state.applications.find((a) => a.id === id);
      if (item) {
        Object.assign(item, updates, { updatedAt: new Date().toISOString() });
        save();
        return item;
      }
      return null;
    },
    deleteById(id) {
      state.applications = state.applications || [];
      const idx = state.applications.findIndex((a) => a.id === id);
      if (idx !== -1) {
        const removed = state.applications.splice(idx, 1)[0];
        save();
        return removed;
      }
      return null;
    },
    seedDefaults() {
      state.applications = state.applications || [];
      const defaults = [
        {
          id: generateId(),
          company: "Stripe",
          role: "Senior Full Stack Engineer",
          candidateName: "Jordan Vance",
          status: "Interviewing",
          salaryEstimate: "$175,000 - $215,000",
          atsScore: 94,
          location: "Remote (US)",
          appliedDate: new Date(Date.now() - 432000000).toISOString().split("T")[0],
          notes: "Passed tech screen. System design interview scheduled next Tuesday.",
          interviewRounds: ["Recruiter Screen: Completed", "Tech Screen: Passed", "System Design: Upcoming"],
        },
        {
          id: generateId(),
          company: "Datadog",
          role: "Staff Platform Engineer",
          candidateName: "Jordan Vance",
          status: "Applied",
          salaryEstimate: "$190,000 - $230,000",
          atsScore: 88,
          location: "New York, NY / Hybrid",
          appliedDate: new Date(Date.now() - 864000000).toISOString().split("T")[0],
          notes: "Referred by Senior Architect. Resume tailored with Kubernetes & distributed tracing.",
          interviewRounds: ["Application Submitted"],
        },
        {
          id: generateId(),
          company: "Airbnb",
          role: "Lead Frontend Architect",
          candidateName: "Jordan Vance",
          status: "Offered",
          salaryEstimate: "$185,000 - $220,000",
          atsScore: 96,
          location: "San Francisco, CA / Remote",
          appliedDate: new Date(Date.now() - 1728000000).toISOString().split("T")[0],
          notes: "Received written offer! 4-year equity vesting with $25k signing bonus.",
          interviewRounds: ["Recruiter Screen", "Coding Challenge", "Virtual Onsite", "Hiring Committee Approved"],
        },
        {
          id: generateId(),
          company: "Linear",
          role: "Product Software Engineer",
          candidateName: "Jordan Vance",
          status: "Wishlist",
          salaryEstimate: "$160,000 - $190,000",
          atsScore: 82,
          location: "Remote",
          appliedDate: new Date().toISOString().split("T")[0],
          notes: "Targeting engineering team. Preparing 30-day skill gap roadmap.",
          interviewRounds: ["Drafting cold outreach pitch"],
        },
      ];
      defaults.forEach((d) => state.applications.unshift(d));
      saveSync();
      return defaults;
    },
  },

  settings: {
    get() {
      return { ...state.settings };
    },
    set(newSettings) {
      state.settings = { ...state.settings, ...newSettings };
      save();
      return state.settings;
    },
  },

  exportFull() {
    return {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      database: {
        users: (state.users || []).map((u) => db.users.sanitize(u)),
        resumes: state.resumes,
        analyses: state.analyses,
        tailoredResumes: state.tailoredResumes,
        coverLetters: state.coverLetters,
        interviewPreps: state.interviewPreps,
        multiMatches: state.multiMatches,
        applications: state.applications || [],
        settings: state.settings,
      },
    };
  },

  importFull(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid import payload: expected an object.");
    }
    const incoming = data.database || data;
    state = {
      users: Array.isArray(incoming.users) ? incoming.users : state.users,
      resumes: Array.isArray(incoming.resumes) ? incoming.resumes : state.resumes,
      analyses: Array.isArray(incoming.analyses) ? incoming.analyses : state.analyses,
      tailoredResumes: Array.isArray(incoming.tailoredResumes) ? incoming.tailoredResumes : state.tailoredResumes,
      coverLetters: Array.isArray(incoming.coverLetters) ? incoming.coverLetters : state.coverLetters,
      interviewPreps: Array.isArray(incoming.interviewPreps) ? incoming.interviewPreps : state.interviewPreps,
      multiMatches: Array.isArray(incoming.multiMatches) ? incoming.multiMatches : state.multiMatches,
      applications: Array.isArray(incoming.applications) ? incoming.applications : (state.applications || []),
      settings: { ...state.settings, ...(incoming.settings || {}) },
    };
    saveSync();
    return db.stats();
  },

  clearAll() {
    state.analyses = [];
    state.tailoredResumes = [];
    state.coverLetters = [];
    state.interviewPreps = [];
    state.multiMatches = [];
    state.applications = [];
    saveSync();
    return db.stats();
  },

  seedDefaults() {
    const samples = [
      {
        id: generateId(),
        filename: "Maya_Lin_ML_Engineer.pdf",
        candidateName: "Maya Lin",
        jobDescription: "Staff AI/ML Engineer specializing in PyTorch, Large Language Models, LangChain, RAG architectures, model fine-tuning, and scalable vector search pipelines.",
        atsScore: 94,
        skillMatch: 96,
        completeness: 100,
        matchedKeywords: ["Python", "PyTorch", "LLM", "RAG", "LangChain", "Vector Databases", "Docker"],
        missingKeywords: ["Triton Inference Server", "CUDA Optimization"],
        suggestions: [
          "Highlight model latency reduction (tokens/second) on edge device deployments.",
          "Add CUDA or Triton inference benchmarks to reinforce senior technical leadership."
        ],
        aiAnalysis: {
          strengths: ["Exceptional domain depth in modern Generative AI and production LLM orchestration", "Strong academic grounding and published contributions"],
          weaknesses: ["Could specify hardware acceleration stack details"],
          actionPlan: ["Showcase benchmark comparison between baseline models and fine-tuned domain models"]
        },
        resume: {
          contact: { name: "Maya Lin", email: "maya.lin@ai-research.org", phone: "+1 (555) 321-9988" },
          skills: ["Python", "PyTorch", "LLM", "LangChain", "Vector Databases", "Docker", "FastAPI", "Kubernetes", "AWS"],
          experience: [
            "Staff AI Engineer at NeuroFlow Labs (2022-Present): Architected enterprise RAG system querying 10M+ domain documents with sub-200ms latency.",
            "Machine Learning Scientist at CognitiveScale (2019-2022): Trained and evaluated transformer models resulting in a 34% accuracy boost over baseline.",
          ],
          education: ["M.S. in Computer Science — Stanford University (2019)"],
          projects: ["OpenEmbed — High-throughput vector search and caching framework with 2k+ GitHub stars."],
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        filename: "Alex_Rivera_FullStack.pdf",
        candidateName: "Alex Rivera",
        jobDescription: "Senior Full Stack Engineer with React, Node.js, TypeScript, Docker, and AWS experience building scalable microservices and APIs.",
        atsScore: 88,
        skillMatch: 92,
        completeness: 100,
        matchedKeywords: ["React", "Node.js", "TypeScript", "Docker", "AWS", "REST", "API"],
        missingKeywords: ["Kubernetes", "GraphQL", "CI/CD"],
        suggestions: [
          "Include production metrics for AWS deployments (e.g. latency reduction, cost savings).",
          "Add explicit mention of Kubernetes or container orchestration to surpass 90% ATS match.",
        ],
        aiAnalysis: {
          strengths: ["Strong modern JavaScript & TypeScript ecosystem coverage", "Clear full-stack progression with cloud infrastructure"],
          weaknesses: ["Missing container orchestration (Kubernetes) mentioned in senior specs"],
          actionPlan: ["Quantify API performance gains and add CI/CD pipeline experience to work history"],
        },
        resume: {
          contact: { name: "Alex Rivera", email: "alex.rivera@example.com", phone: "+1 (555) 019-2834" },
          skills: ["React", "Node.js", "TypeScript", "Docker", "AWS", "PostgreSQL", "Express", "REST APIs", "Tailwind CSS"],
          experience: [
            "Senior Software Engineer at Horizon Cloud (2021-Present): Architected scalable Node.js microservices processing 4.2M daily transactions with 99.98% uptime.",
            "Full Stack Developer at SparkLabs (2018-2021): Engineered React single-page applications improving user retention by 28% and reducing page load times by 400ms.",
          ],
          education: ["B.S. in Computer Science — University of Washington (2018)"],
          projects: ["CloudOps CLI — Open source developer tooling built with Go and Docker for rapid deployment of containerized apps."],
        },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: generateId(),
        filename: "Marcus_Vance_DevOps_SRE.pdf",
        candidateName: "Marcus Vance",
        jobDescription: "Lead Site Reliability Engineer & DevOps Architect with deep expertise in Kubernetes, Terraform, AWS, Prometheus, GitOps, and Zero Trust security.",
        atsScore: 82,
        skillMatch: 86,
        completeness: 95,
        matchedKeywords: ["Kubernetes", "Terraform", "AWS", "Docker", "Linux", "CI/CD"],
        missingKeywords: ["Service Mesh", "Istio", "Chaos Engineering"],
        suggestions: [
          "Detail MTTR (Mean Time to Resolution) reductions achieved through automated incident response.",
          "Incorporate Istio or service mesh architectures to target the staff-level band."
        ],
        aiAnalysis: {
          strengths: ["Robust infrastructure-as-code and cloud platform automation track record", "Strong observability practices"],
          weaknesses: ["Lacks mention of specific Chaos Engineering experiments"],
          actionPlan: ["Quantify cloud infrastructure cost savings from rightsizing and spot-instance utilization"]
        },
        resume: {
          contact: { name: "Marcus Vance", email: "marcus.vance@infra-ops.io", phone: "+1 (555) 443-8877" },
          skills: ["Kubernetes", "Terraform", "AWS", "Docker", "Prometheus", "Grafana", "Helm", "Go", "Python", "Linux"],
          experience: [
            "Lead DevOps Engineer at Vanguard Distributed (2020-Present): Managed multi-region EKS clusters sustaining 99.999% availability during peak traffic events.",
            "Cloud Infrastructure Engineer at DataSphere (2017-2020): Automated Terraform staging deployments across 14 enterprise environments.",
          ],
          education: ["B.S. in Information Systems — Georgia Tech (2017)"],
          projects: ["KubeGuard — Lightweight admission controller for enforcing least-privilege security policies in Kubernetes."],
        },
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: generateId(),
        filename: "Priya_Sharma_ProductLead.pdf",
        candidateName: "Priya Sharma",
        jobDescription: "Technical Product Manager & Engineering Lead with experience driving agile sprints, API platform strategy, user research, and cross-functional engineering execution.",
        atsScore: 76,
        skillMatch: 78,
        completeness: 95,
        matchedKeywords: ["Agile", "Scrum", "API Strategy", "Product Roadmaps", "Data Analysis", "SQL"],
        missingKeywords: ["OKRs", "A/B Testing Platform", "Product-Led Growth"],
        suggestions: [
          "Specify the business revenue impact of product launches.",
          "Add mention of experimentation frameworks and statistical significance testing."
        ],
        aiAnalysis: {
          strengths: ["Excellent balance between technical architecture and business roadmap execution"],
          weaknesses: ["Needs deeper quantification of North Star metric uplifts"],
          actionPlan: ["Highlight feature adoption rates and customer retention gains"]
        },
        resume: {
          contact: { name: "Priya Sharma", email: "priya.sharma@productinnovate.com", phone: "+1 (555) 776-1122" },
          skills: ["Product Strategy", "API Design", "Agile / Scrum", "SQL", "User Analytics", "Jira", "Figma", "System Architecture"],
          experience: [
            "Lead Technical Product Manager at Nexus Fintech (2021-Present): Directed roadmap for developer API platform used by 500+ institutional partners.",
            "Product Owner at SprintWorks (2018-2021): Led cross-functional squad of 9 engineers delivering core billing overhaul.",
          ],
          education: ["B.S. in Computer Science & Minor in Economics — UC Berkeley (2018)"],
          projects: ["DevMetrics — Dashboard for engineering team cycle times and deployment frequency tracking."],
        },
        createdAt: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        id: generateId(),
        filename: "Liam_Chen_Junior_Frontend.pdf",
        candidateName: "Liam Chen",
        jobDescription: "Junior Web Developer skilled in HTML, CSS, JavaScript, React basics, Git, and RESTful web services.",
        atsScore: 48,
        skillMatch: 42,
        completeness: 80,
        matchedKeywords: ["JavaScript", "HTML", "CSS", "React", "Git"],
        missingKeywords: ["TypeScript", "State Management", "Automated Testing", "CI/CD", "Node.js"],
        suggestions: [
          "Add TypeScript and automated testing (Jest or Vitest) to jump into the mid-level applicant tier.",
          "Expand project descriptions with real-world users and deployment URLs."
        ],
        aiAnalysis: {
          strengths: ["Solid fundamental understanding of modern web standards and React component architecture"],
          weaknesses: ["Missing TypeScript and end-to-end testing coverage", "Needs more commercial project depth"],
          actionPlan: ["Refactor personal projects to TypeScript and add GitHub Actions continuous integration"]
        },
        resume: {
          contact: { name: "Liam Chen", email: "liam.chen.dev@gmail.com", phone: "+1 (555) 998-3344" },
          skills: ["JavaScript", "HTML5", "CSS3", "React", "Git", "Tailwind CSS"],
          experience: [
            "Junior Web Developer Intern at ByteWave Media (2023-2024): Built responsive landing pages and integrated REST APIs.",
          ],
          education: ["Associate Degree in Computer Science — Portland Community College (2023)"],
          projects: ["TaskMaster — Client-side Kanban board built with React and LocalStorage."],
        },
        createdAt: new Date(Date.now() - 14400000).toISOString(),
      }
    ];

    samples.forEach(s => state.analyses.unshift(s));
    saveSync();
    return samples;
  },

  stats() {
    const avgAts = state.analyses.length
      ? Math.round(state.analyses.reduce((sum, a) => sum + (a.atsScore || 0), 0) / state.analyses.length)
      : 0;
    const avgSkillMatch = state.analyses.length
      ? Math.round(state.analyses.reduce((sum, a) => sum + (a.skillMatch || 0), 0) / state.analyses.length)
      : 0;

    return {
      type: "embedded-json",
      location: DB_FILE,
      usersCount: (state.users || []).length,
      resumesCount: state.resumes.length,
      analysesCount: state.analyses.length,
      tailoredCount: state.tailoredResumes.length,
      coverLettersCount: state.coverLetters.length,
      interviewPrepsCount: state.interviewPreps.length,
      multiMatchesCount: state.multiMatches.length,
      applicationsCount: (state.applications || []).length,
      avgAtsScore: avgAts,
      avgSkillMatch,
      connected: true,
    };
  },
};

module.exports = db;
