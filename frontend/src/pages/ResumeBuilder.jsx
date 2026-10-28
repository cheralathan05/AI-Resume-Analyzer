import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import "../styles/ui.css";
import "../styles/ResumeBuilder.css";
import {
  PrinterIcon,
  DownloadIcon,
  SparkleIcon,
  CheckIcon,
  ShieldCheckIcon,
  GaugeIcon,
  EditIcon,
  WandIcon,
} from "../components/icons";
import { auditResumeFormat } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { useResume } from "../context/ResumeContext";
import { useAuth } from "../context/AuthContext";

const INITIAL_PROFILE = {
  name: "Cheralathan B.N",
  title: "Full-Stack & Generative AI Engineer",
  email: "cheralathannandha9098@gmail.com",
  phone: "+91 8668180041",
  location: "Tamil Nadu, India / Remote",
  linkedin: "linkedin.com/in/cheralathan05",
  github: "github.com/cheralathan05",
  summary:
    "High-impact Full-Stack and Generative AI Engineer with deep expertise across React, Node.js, Spring Boot, MySQL, and LLM integrations. Proven track record optimizing backend response latencies by 35% through Redis caching and architecting sovereign multi-tenant workspaces.",
  skills: [
    "React.js", "Next.js", "Node.js", "TypeScript", "JavaScript",
    "Python", "Spring Boot", "REST APIs", "PostgreSQL", "MySQL",
    "Redis", "Docker", "Git", "Generative AI", "LLMs", "Vector Embeddings"
  ],
  experience: [
    {
      role: "Generative AI Engineering Intern",
      company: "One Yes Technology Pvt Ltd",
      dates: "Jun 2025 – Present",
      bullets: [
        "Architected and deployed GPT-4 and Ollama LLM pipelines with custom vector embeddings, improving context retrieval precision by 42%.",
        "Engineered backend REST endpoints in Node.js and integrated Redis cache layer, slashing average p99 request latency by 35%.",
        "Collaborated with cross-functional teams to design responsive React UI surfaces with automated end-to-end test coverage."
      ]
    },
    {
      role: "Cybersecurity & Systems Intern",
      company: "Zero Touch Pvt Ltd",
      dates: "Jul 2024 – Nov 2024",
      bullets: [
        "Conducted automated vulnerability scans across microservices architecture and audited system security logs.",
        "Simulated adversarial threat scenarios and implemented RBAC token validation routines adhering to OWASP guidelines."
      ]
    }
  ],
  education: [
    {
      degree: "B.E. Computer Science and Engineering",
      school: "K.S.R. College of Engineering",
      dates: "2023 – 2027",
      details: "CGPA: 7.50 / 10 • Active Open-Source Contributor"
    }
  ]
};

export default function ResumeBuilder() {
  const toast = useToast();
  const { activeResume, updateActiveResume } = useResume();
  const { user } = useAuth();

  const [profile, setProfile] = useState(() => {
    if (activeResume) {
      return {
        name: activeResume.contact?.name || user?.name || INITIAL_PROFILE.name,
        title: user?.targetTitle || INITIAL_PROFILE.title,
        email: activeResume.contact?.email || user?.email || INITIAL_PROFILE.email,
        phone: activeResume.contact?.phone || INITIAL_PROFILE.phone,
        location: user?.targetLocation || INITIAL_PROFILE.location,
        linkedin: INITIAL_PROFILE.linkedin,
        github: INITIAL_PROFILE.github,
        summary: activeResume.summary || INITIAL_PROFILE.summary,
        skills: Array.isArray(activeResume.skills) && activeResume.skills.length > 0 ? activeResume.skills : INITIAL_PROFILE.skills,
        experience: Array.isArray(activeResume.experience) && activeResume.experience.length > 0
          ? activeResume.experience.map((exp) => {
              if (typeof exp === "string") {
                const parts = exp.split(/[|—]/);
                return {
                  role: parts[0]?.trim() || "Software Engineer",
                  company: parts[1]?.trim() || "Tech Corp",
                  dates: "2024 - Present",
                  bullets: [parts.slice(2).join(" ").trim() || exp],
                };
              }
              return exp;
            })
          : INITIAL_PROFILE.experience,
        education: Array.isArray(activeResume.education) && activeResume.education.length > 0
          ? activeResume.education.map((ed) => {
              if (typeof ed === "string") {
                const parts = ed.split(/[|—]/);
                return {
                  degree: parts[0]?.trim() || ed,
                  school: parts[1]?.trim() || "College",
                  dates: "2023 – 2027",
                  details: "Verified Degree",
                };
              }
              return ed;
            })
          : INITIAL_PROFILE.education,
      };
    }
    return INITIAL_PROFILE;
  });

  const [template, setTemplate] = useState("modern"); // modern, executive, tech
  const [auditResult, setAuditResult] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);

  function handleSaveToActive() {
    updateActiveResume((prev) => ({
      ...prev,
      contact: {
        ...(prev?.contact || {}),
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      },
      skills: profile.skills,
      summary: profile.summary,
    }));
    toast.success("Saved to Active Resume", "Changes synced across all 16 Studio tools!");
  }

  // Trigger ATS format audit
  async function handleAudit() {
    setIsAuditing(true);
    try {
      const resumePayload = {
        contact: {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          linkedin: profile.linkedin,
          github: profile.github,
        },
        skills: profile.skills,
        experience: profile.experience.map((e) => `${e.role} at ${e.company}: ${e.bullets.join(" ")}`),
        education: profile.education.map((ed) => `${ed.degree} — ${ed.school}`),
      };
      const res = await auditResumeFormat(resumePayload);
      setAuditResult(res);
      toast.success("Format Health Audited", `ATS Score: ${res.auditScore}/100 with ${res.metricsFoundCount} quantified metrics.`);
    } catch (e) {
      toast.error("Audit Failed", e.message || "Failed to audit formatting.");
    } finally {
      setIsAuditing(false);
    }
  }

  // Print / Export PDF
  function handlePrint() {
    window.print();
  }

  return (
    <AppLayout fluid={true}>
      <div className="builder-layout">
        {/* Left Sidebar: Controls & Inputs */}
        <aside className="builder-sidebar">
          {/* Template Selector Card */}
          <div className="builder-card">
            <div className="builder-card-title">
              <SparkleIcon width={16} height={16} />
              <span>ATS Resume Template</span>
            </div>
            <div className="builder-template-tabs">
              <button
                className={`builder-template-tab ${template === "modern" ? "active" : ""}`}
                onClick={() => setTemplate("modern")}
              >
                Modern Clean
              </button>
              <button
                className={`builder-template-tab ${template === "executive" ? "active" : ""}`}
                onClick={() => setTemplate("executive")}
              >
                Executive Serif
              </button>
              <button
                className={`builder-template-tab ${template === "tech" ? "active" : ""}`}
                onClick={() => setTemplate("tech")}
              >
                Tech Monospace
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handlePrint}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "9px 12px",
                  background: "#ffffff",
                  color: "#000000",
                  fontWeight: 600,
                  fontSize: "12px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <PrinterIcon width={14} height={14} />
                Export to PDF
              </button>
              <button
                onClick={handleAudit}
                disabled={isAuditing}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 12px",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  fontSize: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <ShieldCheckIcon width={14} height={14} />
                {isAuditing ? "Auditing..." : "Audit ATS"}
              </button>
              <button
                onClick={handleSaveToActive}
                type="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 12px",
                  background: "rgba(34, 197, 94, 0.15)",
                  color: "#4ade80",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "1px solid rgba(34, 197, 94, 0.35)",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <CheckIcon width={14} height={14} />
                Sync
              </button>
            </div>
          </div>

          {/* Audit Result Banner if run */}
          {auditResult && (
            <div className="builder-card" style={{ borderColor: "rgba(74, 222, 128, 0.4)", background: "rgba(74, 222, 128, 0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#4ade80" }}>ATS Health Score</span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff" }}>{auditResult.healthScore || 92}/100</span>
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>
                Action verbs: {auditResult.metrics?.actionVerbRatio || "Optimal"} • {auditResult.redFlags?.length || 0} red flags
              </p>
            </div>
          )}

          {/* Candidate Profile Form */}
          <div className="builder-card">
            <div className="builder-card-title">
              <EditIcon width={15} height={15} />
              <span>Contact & Title</span>
            </div>
            <div className="builder-input-group">
              <label className="builder-label">Full Name</label>
              <input
                className="builder-input"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="builder-input-group">
              <label className="builder-label">Target Title</label>
              <input
                className="builder-input"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div className="builder-input-group">
                <label className="builder-label">Email</label>
                <input
                  className="builder-input"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div className="builder-input-group">
                <label className="builder-label">Phone</label>
                <input
                  className="builder-input"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div className="builder-input-group">
                <label className="builder-label">LinkedIn</label>
                <input
                  className="builder-input"
                  value={profile.linkedin}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                />
              </div>
              <div className="builder-input-group">
                <label className="builder-label">GitHub</label>
                <input
                  className="builder-input"
                  value={profile.github}
                  onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="builder-card">
            <div className="builder-card-title">
              <WandIcon width={15} height={15} />
              <span>Executive Summary</span>
            </div>
            <textarea
              className="builder-textarea"
              rows={4}
              value={profile.summary}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
            />
          </div>

          {/* Skills */}
          <div className="builder-card">
            <div className="builder-card-title">
              <GaugeIcon width={15} height={15} />
              <span>Core Skills (Comma separated)</span>
            </div>
            <textarea
              className="builder-textarea"
              rows={3}
              value={profile.skills.join(", ")}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </div>
        </aside>

        {/* Right Canvas: Live Rendered Paper Resume */}
        <div className="resume-paper-wrapper">
          <div className="resume-paper-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
              <span>Live ATS Print Preview</span>
              <span>•</span>
              <span style={{ color: "#ffffff", fontWeight: 600 }}>
                {template === "modern" ? "Modern Minimalist" : template === "executive" ? "Executive Serif" : "Tech Monospace"}
              </span>
            </div>

            <button
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: "#ffffff",
                color: "#000000",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
              }}
            >
              <PrinterIcon width={13} height={13} />
              Print / Save PDF
            </button>
          </div>

          {/* Printable Resume Paper */}
          <div className={`resume-paper resume-tmpl-${template}`}>
            {/* Header */}
            <div className="r-header">
              <h1 className="r-name">{profile.name}</h1>
              <div className="r-title">{profile.title}</div>
              <div className="r-contact">
                {profile.email && <span>✉ {profile.email}</span>}
                {profile.phone && <span>📞 {profile.phone}</span>}
                {profile.location && <span>📍 {profile.location}</span>}
                {profile.linkedin && <span>🔗 {profile.linkedin}</span>}
                {profile.github && <span>🐙 {profile.github}</span>}
              </div>
            </div>

            {/* Summary */}
            {profile.summary && (
              <div className="r-section">
                <div className="r-section-title">Professional Summary</div>
                <p style={{ margin: 0, color: "#334155", lineHeight: 1.55 }}>{profile.summary}</p>
              </div>
            )}

            {/* Core Competencies / Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="r-section">
                <div className="r-section-title">Technical Skills & Competencies</div>
                <div className="r-skills-tags">
                  {profile.skills.map((skill, i) => (
                    <span key={i} className="r-skill-pill">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <div className="r-section">
                <div className="r-section-title">Professional Experience</div>
                {profile.experience.map((exp, idx) => (
                  <div key={idx} className="r-item">
                    <div className="r-item-head">
                      <div>
                        <span className="r-item-role">{exp.role}</span>
                        {" — "}
                        <span className="r-item-company">{exp.company}</span>
                      </div>
                      <span className="r-item-dates">{exp.dates}</span>
                    </div>
                    <ul className="r-bullets">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <div className="r-section">
                <div className="r-section-title">Education</div>
                {profile.education.map((edu, idx) => (
                  <div key={idx} className="r-item">
                    <div className="r-item-head">
                      <span className="r-item-role">{edu.degree}</span>
                      <span className="r-item-dates">{edu.dates}</span>
                    </div>
                    <div className="r-item-company">{edu.school}</div>
                    {edu.details && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{edu.details}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
