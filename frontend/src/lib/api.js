import axios from "axios";

/*
 * Base URL for the Node/Express backend.
 * Checks VITE_API_URL, otherwise connects to local backend on port 5001 or through Vite proxy.
 */
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

// In production (Render, Vercel, Railway), default to relative origin "" so API calls route seamlessly.
const resolvedBaseUrl = configuredApiUrl || (isLocalhost ? "http://localhost:5001" : "");

const api = axios.create({
  baseURL: resolvedBaseUrl,
});

// Automatically attach Authorization header if token exists in localStorage
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("resume_ai_auth_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("resume_ai_auth_token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("resume_ai_auth_token");
    delete api.defaults.headers.common["Authorization"];
  }
}

export function getStoredAuthToken() {
  return typeof window !== "undefined" ? localStorage.getItem("resume_ai_auth_token") : null;
}


/** Allow enough time for warm up */
const WARMUP_TIMEOUT_MS = 15000;

/**
 * Warm up backend on load
 */
export function warmUpBackend() {
  api.get("/api/warmup", { timeout: WARMUP_TIMEOUT_MS }).catch(() => {});
}

/**
 * Upload a resume PDF
 */
export async function uploadResume(file, onProgress) {
  const formData = new FormData();
  formData.append("resume", file);

  const { data } = await api.post("/api/upload", formData, {
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return;
      onProgress(Math.round((event.loaded * 100) / event.total));
    },
  });

  return data;
}

/**
 * Upload raw resume text pasted by user
 */
export async function uploadResumeText(text, fileName = "Pasted_Resume.txt") {
  const { data } = await api.post("/api/upload/text", { text, fileName });
  return data;
}

/**
 * Standard ATS analysis (instant algorithmic scoring)
 */
export async function analyzeAts(resume, jobDescription, fileName) {
  const { data } = await api.post("/api/ats/analyze", {
    resume,
    jobDescription,
    fileName,
  });
  return data;
}

/**
 * ATS Formatting and Red-Flags Audit
 */
export async function auditResumeFormat(resume) {
  const { data } = await api.post("/api/ats/audit", { resume });
  return data;
}

/**
 * Multi-Job Description Battle (Match Matrix)
 */
export async function multiMatchJobsWithAts(resume, jobDescriptions) {
  const { data } = await api.post("/api/ats/multi-match", {
    resume,
    jobDescriptions,
  });
  return data;
}

/**
 * Built-in Sample Resumes and Target Job Descriptions for 1-Click Instant Demo
 */
export async function getSampleResumesAndJobs() {
  const { data } = await api.get("/api/ats/samples");
  return data;
}

/**
 * Ollama AI status probe
 */
export async function getAiStatus() {
  const { data } = await api.get("/api/ai/status");
  return data;
}

/**
 * Deep Ollama / AI resume review against job description
 */
export async function analyzeWithAi(resume, jobDescription, analysisId = null, model = null) {
  const { data } = await api.post("/api/ai/analyze", {
    resume,
    jobDescription,
    analysisId,
    model,
  }, {
    timeout: 120000,
  });
  return data;
}

/**
 * AI Resume Tailor Studio (STAR bullet rewriting & tailored summary)
 */
export async function tailorResumeWithAi({ resume, jobDescription, targetRole, model }) {
  const { data } = await api.post("/api/ai/tailor-resume", {
    resume,
    jobDescription,
    targetRole,
    model,
  }, {
    timeout: 120000,
  });
  return data;
}

/**
 * AI Cover Letter Generator
 */
export async function generateCoverLetterWithAi({ resume, jobDescription, companyName, tone, targetRole, model }) {
  const { data } = await api.post("/api/ai/cover-letter", {
    resume,
    jobDescription,
    companyName,
    tone,
    targetRole,
    model,
  }, {
    timeout: 90000,
  });
  return data;
}

/**
 * AI Interview Preparation Generator
 */
export async function generateInterviewPrepWithAi({
  resume,
  jobDescription,
  targetRole,
  interviewType = "mixed",
  difficulty = "senior",
  interviewerPersona = "alex",
  model,
}) {
  const { data } = await api.post("/api/ai/interview-prep", {
    resume,
    jobDescription,
    targetRole,
    interviewType,
    difficulty,
    interviewerPersona,
    model,
  }, {
    timeout: 90000,
  });
  return data;
}

/**
 * AI Interview Answer Grading Simulator
 */
export async function gradeInterviewAnswerWithAi({
  question,
  userAnswer,
  resume,
  jobDescription,
  interviewType = "mixed",
  interviewerPersona = "alex",
  model,
}) {
  const { data } = await api.post("/api/ai/grade-answer", {
    question,
    userAnswer,
    resume,
    jobDescription,
    interviewType,
    interviewerPersona,
    model,
  }, {
    timeout: 60000,
  });
  return data;
}

/**
 * AI Dynamic Follow-Up Question Generator
 */
export async function generateFollowUpQuestionWithAi({
  question,
  userAnswer,
  targetRole,
  interviewerPersona = "alex",
  model,
}) {
  const { data } = await api.post("/api/ai/follow-up-question", {
    question,
    userAnswer,
    targetRole,
    interviewerPersona,
    model,
  }, {
    timeout: 45000,
  });
  return data;
}

/**
 * Salary & Market Fit Estimator
 */
export async function getSalaryEstimateWithAi({ resume, jobDescription, location }) {
  const { data } = await api.post("/api/ai/salary-estimate", {
    resume,
    jobDescription,
    location,
  });
  return data;
}

/**
 * Interactive career coach chat with Ollama
 */
export async function chatWithAi(resume, jobDescription, message, history = [], model = null) {
  const { data } = await api.post("/api/ai/chat", {
    resume,
    jobDescription,
    message,
    history,
    model,
  }, {
    timeout: 90000,
  });
  return data;
}

/**
 * Rewrite single bullet point using STAR framework
 */
export async function improveBulletWithAi(bulletText, targetRole = "Software Engineer", model = null) {
  const { data } = await api.post("/api/ai/improve-bullet", {
    bulletText,
    targetRole,
    model,
  }, {
    timeout: 30000,
  });
  return data;
}

/**
 * Fetch analysis history from embedded database
 */
export async function getHistory(limit = 50) {
  const { data } = await api.get(`/api/history?limit=${limit}`);
  return data;
}

/**
 * Fetch database collection statistics
 */
export async function getDatabaseStats() {
  const { data } = await api.get("/api/history/stats");
  return data;
}

/**
 * Fetch single analysis item from database
 */
export async function getHistoryItem(id) {
  const { data } = await api.get(`/api/history/${id}`);
  return data;
}

/**
 * Delete single analysis item from database
 */
export async function deleteHistoryItem(id) {
  const { data } = await api.delete(`/api/history/${id}`);
  return data;
}

/**
 * Fetch all database collections for history page
 */
export async function getAllHistoryCollections() {
  const { data } = await api.get("/api/history/all");
  return data;
}

/**
 * Delete single tailored resume record
 */
export async function deleteTailoredRecord(id) {
  const { data } = await api.delete(`/api/history/tailored/${id}`);
  return data;
}

/**
 * Delete single cover letter record
 */
export async function deleteCoverLetterRecord(id) {
  const { data } = await api.delete(`/api/history/cover-letter/${id}`);
  return data;
}

/**
 * Delete single interview prep record
 */
export async function deleteInterviewRecord(id) {
  const { data } = await api.delete(`/api/history/interview/${id}`);
  return data;
}

/**
 * Delete single multi-match record
 */
export async function deleteMultiRecord(id) {
  const { data } = await api.delete(`/api/history/multi/${id}`);
  return data;
}

/**
 * Delete single saved resume record from database
 */
export async function deleteResumeRecord(id) {
  const { data } = await api.delete(`/api/history/resume/${id}`);
  return data;
}

/**
 * Export full embedded database as JSON
 */
export async function exportDatabaseBackup() {
  const { data } = await api.get("/api/history/export");
  return data;
}

/**
 * Import and restore database from JSON backup
 */
export async function importDatabaseBackup(payload) {
  const { data } = await api.post("/api/history/import", payload);
  return data;
}

/**
 * Clear history collections in embedded database
 */
export async function clearDatabaseHistory() {
  const { data } = await api.post("/api/history/clear");
  return data;
}

/**
 * Seed realistic default history items
 */
export async function seedSampleDatabaseHistory() {
  const { data } = await api.post("/api/history/seed");
  return data;
}

/**
 * Head-to-Head Candidate Resume Comparison
 */
export async function compareCandidatesWithAi(resumeA, resumeB, jobDescription, model = null) {
  const { data } = await api.post("/api/ai/compare-candidates", {
    resumeA,
    resumeB,
    jobDescription,
    model,
  });
  return data;
}

/**
 * AI LinkedIn & Cold Outreach Pitches
 */
export async function generateOutreachPitchWithAi({ resume, jobDescription, companyName, managerName, model = null }) {
  const { data } = await api.post("/api/ai/outreach-pitch", {
    resume,
    jobDescription,
    companyName,
    managerName,
    model,
  });
  return data;
}

/**
 * 30-Day Skill Gap Acceleration Roadmap
 */
export async function getLearningRoadmapWithAi({ resume, jobDescription, missingSkills, model = null }) {
  const { data } = await api.post("/api/ai/learning-roadmap", {
    resume,
    jobDescription,
    missingSkills,
    model,
  });
  return data;
}

/**
 * LinkedIn Profile Optimizer & Personal Branding Suite
 */
export async function getLinkedInProfileWithAi({ resume, targetRole, model = null }) {
  const { data } = await api.post("/api/ai/linkedin-optimize", {
    resume,
    targetRole,
    model,
  });
  return data;
}

/**
 * AI Resume Bullet Point Power-Booster (Google XYZ Formula)
 */
export async function getPowerBulletsWithAi({ bullet, role, context, skill, model = null }) {
  const { data } = await api.post("/api/ai/power-bullet", {
    bullet,
    role,
    context,
    skill,
    model,
  });
  return data;
}

/**
 * AI Technical Skills Screening Quiz Generator
 */
export async function getSkillsQuizWithAi({ skills, role, model = null }) {
  const { data } = await api.post("/api/ai/skills-quiz", {
    skills,
    role,
    model,
  });
  return data;
}

/**
 * Job Application Pipeline Tracker (CRM / Kanban)
 */
export async function listJobApplications(limit = 100) {
  const { data } = await api.get(`/api/applications?limit=${limit}`);
  return data;
}

export async function createJobApplication(payload) {
  const { data } = await api.post("/api/applications", payload);
  return data;
}

export async function updateJobApplication(id, updates) {
  const { data } = await api.put(`/api/applications/${id}`, updates);
  return data;
}

export async function deleteJobApplication(id) {
  const { data } = await api.delete(`/api/applications/${id}`);
  return data;
}

export async function seedJobApplications() {
  const { data } = await api.post("/api/applications/seed");
  return data;
}

/**
 * AI Career Trajectory & Seniority Velocity Forecaster
 */
export async function getCareerTrajectoryWithAi({ resume, jobDescription, targetRole, model = null }) {
  const { data } = await api.post("/api/ai/career-trajectory", {
    resume,
    jobDescription,
    targetRole,
    model,
  });
  return data;
}

/**
 * AI STAR Behavioral Story Bank & Conflict Matrix
 */
export async function getStarStoryBankWithAi({ resume, jobDescription, targetRole, model = null }) {
  const { data } = await api.post("/api/ai/star-stories", {
    resume,
    jobDescription,
    targetRole,
    model,
  });
  return data;
}

/**
 * AI Resume De-Biasing & Blind Screening Audit
 */
export async function getDebiasAuditWithAi({ resume, model = null }) {
  const { data } = await api.post("/api/ai/debias-audit", {
    resume,
    model,
  });
  return data;
}

/**
 * AI Executive Bio & Multi-Channel Persona Studio
 */
export async function getExecutiveBioWithAi({ resume, targetRole, model = null }) {
  const { data } = await api.post("/api/ai/executive-bio", {
    resume,
    targetRole,
    model,
  });
  return data;
}

/**
 * AI 7-Day High-Stakes Interview Bootcamp Sprint
 */
export async function getInterviewSprintWithAi({ resume, jobDescription, targetRole, model = null }) {
  const { data } = await api.post("/api/ai/interview-sprint", {
    resume,
    jobDescription,
    targetRole,
    model,
  });
  return data;
}

/**
 * AI Resume Localization & Global Market Adapter
 */
export async function getLocalizeResumeWithAi({ resume, targetCountry, targetRole, model = null }) {
  const { data } = await api.post("/api/ai/localize-resume", {
    resume,
    targetCountry,
    targetRole,
    model,
  });
  return data;
}

/**
 * Authentication Endpoints
 */
export async function loginUser(email, password) {
  const { data } = await api.post("/api/auth/login", { email, password });
  if (data?.token) setAuthToken(data.token);
  return data;
}

export async function registerUser(payload) {
  const { data } = await api.post("/api/auth/register", payload);
  if (data?.token) setAuthToken(data.token);
  return data;
}

export async function demoLoginUser(persona = "alex") {
  const { data } = await api.post("/api/auth/demo-login", { persona });
  if (data?.token) setAuthToken(data.token);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get("/api/auth/me");
  return data;
}

export async function updateUserProfile(updates) {
  const { data } = await api.put("/api/auth/profile", updates);
  return data;
}

export async function logoutUser() {
  try {
    await api.post("/api/auth/logout");
  } catch {}
  setAuthToken(null);
}

/**
 * 10-Point ATS Rule Checklist with Instant Auto-Fixes
 */
export async function getAtsRuleChecklist(resume, jobDescription) {
  const { data } = await api.post("/api/ats/rule-checklist", { resume, jobDescription });
  return data;
}

export const evaluateAtsRules = getAtsRuleChecklist;

/**
 * AI Salary & Counter-Offer Negotiation Coach
 */
export async function getNegotiationCoach({ role, location, targetSalary, currentOffer, companyType }) {
  const { data } = await api.post("/api/ai/negotiation-coach", {
    role,
    location,
    targetSalary,
    currentOffer,
    companyType,
  });
  return data;
}

/**
 * Live Recommended Jobs & Smart ATS Matcher
 */
export async function getRecommendedJobs(resume) {
  const { data } = await api.post("/api/ats/recommended-jobs", { resume });
  return data;
}

/**
 * AI Personal Developer & Executive Portfolio Generator
 */
export async function generatePortfolioWebsite({ resume, theme = "obsidian", model } = {}) {
  const { data } = await api.post("/api/ai/portfolio", { resume, theme, model });
  return data;
}

/**
 * AI Resume Version Comparison & Diff Inspector
 */
export async function getResumeDiffWithAi({ originalResume, tailoredResume, targetJob } = {}) {
  const { data } = await api.post("/api/ai/resume-diff", { originalResume, tailoredResume, targetJob });
  return data;
}


/**
 * Human-readable error extractor
 */
export function getErrorMessage(err) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data && (data.message || data.error)) {
      return data.message || data.error;
    }
    if (err.code === "ERR_NETWORK") {
      return "Could not reach backend on http://localhost:5001. Please ensure the backend server is running.";
    }
    return err.message || "Something went wrong while processing your request.";
  }
  return err?.message || "An unexpected error occurred.";
}

export default api;

