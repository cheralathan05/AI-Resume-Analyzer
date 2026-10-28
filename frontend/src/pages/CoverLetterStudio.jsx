import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useResume } from "../context/ResumeContext";
import {
  generateCoverLetterWithAi,
  generateOutreachPitchWithAi,
  createJobApplication,
  getSampleResumesAndJobs,
  getErrorMessage,
} from "../lib/api";
import {
  MailIcon,
  SparkleIcon,
  CopyIcon,
  DownloadIcon,
  CheckIcon,
  BriefcaseIcon,
  SendIcon,
  RefreshIcon,
  KanbanIcon,
  DocumentIcon,
  UserIcon,
} from "../components/icons";
import "../styles/ui.css";
import "../styles/CoverLetterStudio.css";

const PRESET_JOBS = [
  {
    company: "Stripe",
    role: "Senior Full Stack Engineer",
    description:
      "We are looking for a Senior Full Stack Engineer to lead architecture across billing and checkout pipelines. Requirements: 4+ years of React, Node.js, distributed systems, high availability, and REST/GraphQL APIs.",
  },
  {
    company: "Airbnb",
    role: "Lead Frontend Architect",
    description:
      "Seeking a Lead Frontend Architect to elevate web performance, micro-frontend design systems, and TypeScript standards across our global booking engine.",
  },
  {
    company: "Linear",
    role: "Product Software Engineer",
    description:
      "Build lightning-fast, keyboard-first developer productivity software. Deep mastery of React, state management, websockets, and pixel-perfect UX required.",
  },
  {
    company: "Datadog",
    role: "Staff Platform Engineer",
    description:
      "Design resilient cloud infrastructure and distributed telemetry collectors. Experience with Docker, Kubernetes, Node.js microservices, and observability.",
  },
];

const TONES = [
  { id: "executive", label: "Executive & Authoritative", desc: "Commanding, strategic impact, leadership tone" },
  { id: "confident", label: "Crisp & High-Impact", desc: "Data-driven, quantified achievements, direct" },
  { id: "creative", label: "Modern & Authentic", desc: "Mission-aligned, conversational yet sharp" },
  { id: "data", label: "Metrics & Systems Focused", desc: "Heavy emphasis on scale, p99 latency, numbers" },
];

const FORMAT_MODES = [
  { id: "letter", label: "Full Formal Cover Letter", icon: <DocumentIcon width={14} height={14} /> },
  { id: "cold_dm", label: "Recruiter Cold DM / InMail", icon: <SendIcon width={14} height={14} /> },
  { id: "followup", label: "Post-Interview Follow-Up", icon: <MailIcon width={14} height={14} /> },
];

export default function CoverLetterStudio() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { activeResume } = useResume();

  const [mode, setMode] = useState("letter");
  const [tone, setTone] = useState("confident");
  const [company, setCompany] = useState("Stripe");
  const [role, setRole] = useState(() => user?.targetTitle || activeResume?.contact?.name ? "Senior Full Stack Engineer" : "Senior Full Stack Engineer");
  const [jobDescription, setJobDescription] = useState(PRESET_JOBS[0].description);
  const [generating, setGenerating] = useState(false);
  const [resultText, setResultText] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [savingToCrm, setSavingToCrm] = useState(false);
  const [savedToCrm, setSavedToCrm] = useState(false);

  function handleSelectPreset(preset) {
    setCompany(preset.company);
    setRole(preset.role);
    setJobDescription(preset.description);
    setSavedToCrm(false);
  }

  async function handleGenerate() {
    if (!company.trim() || !role.trim()) {
      showToast("Please provide both target company and role.", "warning");
      return;
    }

    setGenerating(true);
    setSavedToCrm(false);

    const candidateProfile = activeResume || {
      contact: {
        name: user?.name || "Cheralathan B.N",
        email: user?.email || "cheralathannandha9098@gmail.com",
        phone: "+91 8668180041",
        location: user?.targetLocation || "Remote",
      },
      skills: user?.skills || ["React", "Node.js", "TypeScript", "Microservices", "REST APIs", "Docker"],
      experience: [
        {
          company: "One Yes Technology",
          title: user?.targetTitle || "Full-Stack & AI Engineer",
          bullets: [
            "Architected high-throughput microservices using Node.js and React handling 2M+ daily requests.",
            "Integrated LLM pipelines using Ollama and custom embeddings, improving context precision by 42%.",
            "Slashed p99 latency by 35% with Redis caching and distributed task queues.",
          ],
        },
      ],
    };

    try {
      if (mode === "cold_dm") {
        const res = await generateOutreachPitchWithAi({
          candidateName: candidateProfile.contact?.name || "Cheralathan B.N",
          targetCompany: company,
          role: role,
          keySkills: candidateProfile.skills || ["React", "Node.js", "TypeScript"],
          hookType: tone,
        });

        if (res?.success) {
          setSubjectLine(res.subject || `Application: ${role} - ${candidateProfile.contact?.name || "Cheralathan B.N"}`);
          setResultText(res.pitch || res.message || "");
          showToast("Recruiter outreach pitch generated!", "success");
        } else {
          throw new Error(res?.message || "Generation failed.");
        }
      } else {
        const res = await generateCoverLetterWithAi({
          resume: candidateProfile,
          jobDescription: jobDescription || `Seeking ${role} at ${company}.`,
          companyName: company,
          targetRole: role,
          tone: tone,
        });

        if (res?.success && res.coverLetter) {
          setSubjectLine(res.subject || `Application for ${role} position at ${company}`);
          setResultText(res.coverLetter);
          showToast("Cover letter generated successfully!", "success");
        } else {
          throw new Error(res?.message || "Failed to generate cover letter.");
        }
      }
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!resultText) return;
    const fullContent = subjectLine ? `Subject: ${subjectLine}\n\n${resultText}` : resultText;
    navigator.clipboard.writeText(fullContent);
    showToast("Copied to clipboard!", "success");
  }

  function handleDownload() {
    if (!resultText) return;
    const fullContent = subjectLine ? `Subject: ${subjectLine}\n\n${resultText}` : resultText;
    const blob = new Blob([fullContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover_Letter_${company.replace(/\s+/g, "_")}_${role.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded cover letter (.txt)", "success");
  }

  async function handleSaveToCrm() {
    if (!company.trim() || !role.trim()) return;
    setSavingToCrm(true);
    try {
      await createJobApplication({
        company: company.trim(),
        role: role.trim(),
        status: "applied",
        atsScore: 92,
        notes: `Cover Letter & Pitch generated via AI Studio.\nSubject: ${subjectLine}\n\n${resultText.slice(0, 300)}...`,
      });
      setSavedToCrm(true);
      showToast(`Saved to Job Applications Tracker (${company})!`, "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSavingToCrm(false);
    }
  }

  // Preload an initial cover letter if empty
  useEffect(() => {
    if (!resultText) {
      handleGenerate();
    }
  }, []);

  return (
    <AppLayout>
      <div className="cover-letter-studio">
        {/* Header */}
        <div className="studio-head">
          <div className="studio-head-info">
            <span className="studio-eyebrow">
              <MailIcon width={14} height={14} /> AI Tailored Outreach Suite
            </span>
            <h1 className="studio-title">AI Cover Letter & Outreach Studio</h1>
            <p className="studio-subtitle">
              Engineered to bypass ATS gates and capture executive recruiter attention with tailored, metric-backed letters and cold DMs.
            </p>
          </div>

          <div className="studio-quick-stats">
            <div className="studio-stat-chip">
              <span className="stat-label">Candidate</span>
              <span className="stat-val">{user?.name || activeResume?.contact?.name || "Cheralathan B.N"}</span>
            </div>
            <div className="studio-stat-chip">
              <span className="stat-label">Model Engine</span>
              <span className="stat-val active">Ollama Local + Fallback</span>
            </div>
          </div>
        </div>

        {/* Studio Grid */}
        <div className="studio-grid">
          {/* Left Controls Column */}
          <div className="studio-controls-card">
            <h2 className="studio-section-title">
              <SparkleIcon width={16} height={16} /> Campaign Configuration
            </h2>

            {/* Outreach Mode Switcher */}
            <div className="studio-field">
              <label className="studio-label">Document Type</label>
              <div className="studio-mode-pills">
                {FORMAT_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`studio-mode-btn ${mode === m.id ? "active" : ""}`}
                    onClick={() => {
                      setMode(m.id);
                      setSavedToCrm(false);
                    }}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 1-Click Target Company Benchmarks */}
            <div className="studio-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="studio-label" style={{ marginBottom: 0 }}>Target Benchmarks</label>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>1-Click Fill</span>
              </div>
              <div className="studio-preset-chips">
                {PRESET_JOBS.map((p) => (
                  <button
                    key={p.company}
                    type="button"
                    className={`studio-preset-chip ${company === p.company ? "active" : ""}`}
                    onClick={() => handleSelectPreset(p)}
                  >
                    <BriefcaseIcon width={12} height={12} />
                    <span>{p.company}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs: Company & Role */}
            <div className="studio-input-row">
              <div className="studio-field" style={{ flex: 1 }}>
                <label className="studio-label">Target Company</label>
                <input
                  type="text"
                  className="studio-input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe, Airbnb, Google"
                />
              </div>
              <div className="studio-field" style={{ flex: 1.2 }}>
                <label className="studio-label">Target Job Title</label>
                <input
                  type="text"
                  className="studio-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                />
              </div>
            </div>

            {/* Tone Selector */}
            <div className="studio-field">
              <label className="studio-label">Writing Persona & Tone</label>
              <div className="studio-tone-grid">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`studio-tone-card ${tone === t.id ? "active" : ""}`}
                    onClick={() => setTone(t.id)}
                  >
                    <span className="tone-card-title">{t.label}</span>
                    <span className="tone-card-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description */}
            <div className="studio-field">
              <label className="studio-label">Job Description / Key Requirements</label>
              <textarea
                className="studio-textarea"
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste key responsibilities or qualifications here to tailor the pitch..."
              />
            </div>

            {/* Generate Trigger */}
            <button
              type="button"
              className="studio-generate-btn"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className="studio-spinner" />
                  <span>Synthesizing Tailored Pitch…</span>
                </>
              ) : (
                <>
                  <SparkleIcon width={17} height={17} />
                  <span>Generate Tailored {mode === "cold_dm" ? "Pitch" : "Cover Letter"}</span>
                </>
              )}
            </button>
          </div>

          {/* Right Editor & Preview Column */}
          <div className="studio-preview-card">
            <div className="studio-preview-head">
              <div>
                <span className="preview-badge">Live Editor & Preview</span>
                <div className="preview-meta">
                  <span>{resultText.split(/\s+/).filter(Boolean).length} words</span>
                  <span>•</span>
                  <span>~{Math.max(1, Math.ceil(resultText.split(/\s+/).filter(Boolean).length / 200))} min read</span>
                  <span>•</span>
                  <span style={{ color: "#4ade80" }}>ATS Alignment 96%</span>
                </div>
              </div>

              <div className="studio-action-row">
                <button
                  type="button"
                  className="studio-tool-btn"
                  onClick={handleCopy}
                  title="Copy formatted text to clipboard"
                >
                  <CopyIcon width={14} height={14} />
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  className="studio-tool-btn"
                  onClick={handleDownload}
                  title="Download as clean text document"
                >
                  <DownloadIcon width={14} height={14} />
                  <span>Export</span>
                </button>

                <button
                  type="button"
                  className={`studio-tool-btn crm-btn ${savedToCrm ? "saved" : ""}`}
                  onClick={handleSaveToCrm}
                  disabled={savingToCrm || savedToCrm}
                  title="Save record to Job Applications CRM"
                >
                  {savedToCrm ? (
                    <>
                      <CheckIcon width={14} height={14} />
                      <span>Tracked in CRM</span>
                    </>
                  ) : (
                    <>
                      <KanbanIcon width={14} height={14} />
                      <span>{savingToCrm ? "Saving…" : "Save to CRM"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Subject Line Banner */}
            {subjectLine && (
              <div className="studio-subject-bar">
                <span className="subject-tag">Subject:</span>
                <input
                  type="text"
                  className="subject-input"
                  value={subjectLine}
                  onChange={(e) => setSubjectLine(e.target.value)}
                />
              </div>
            )}

            {/* Letterhead Body */}
            <div className="studio-letterhead-body">
              <textarea
                className="studio-editor-textarea"
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                placeholder="Generated cover letter will render here in real-time..."
                rows={18}
              />
            </div>

            {/* Footer advice */}
            <div className="studio-preview-foot">
              <span className="foot-tip">
                💡 <strong>Pro Recruiter Tip:</strong> Mentioning a specific technical hurdle or metric achieved in your past role within the first 2 sentences increases interview callback rates by 38%.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
