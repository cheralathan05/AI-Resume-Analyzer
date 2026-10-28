import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ui.css";
import "../styles/Upload.css";
import AppLayout from "../components/AppLayout";
import FileDropzone from "../components/FileDropzone";
import SelectedFileCard from "../components/SelectedFileCard";
import Button from "../components/Button";
import { ArrowRightIcon, AlertIcon, SparkleIcon, DocumentIcon, CheckIcon, RefreshIcon } from "../components/icons";
import { uploadResume, uploadResumeText, warmUpBackend, getErrorMessage, getSampleResumesAndJobs } from "../lib/api";
import { useResume } from "../context/ResumeContext";
import { useAuth } from "../context/AuthContext";

function UploadResume() {
  const navigate = useNavigate();
  const { activeResume, activeFileName, setActiveResume, syncWithDatabase } = useResume();
  const { user, isAuthenticated } = useAuth();

  const [mode, setMode] = useState("file"); // 'file' | 'text'
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [samples, setSamples] = useState(null);
  const [loadingVaultResume, setLoadingVaultResume] = useState(false);

  useEffect(() => {
    warmUpBackend();
    getSampleResumesAndJobs()
      .then((data) => setSamples(data))
      .catch(() => {});
  }, []);

  async function handleLoadFromVault() {
    setLoadingVaultResume(true);
    try {
      const res = await syncWithDatabase();
      if (res) {
        navigate("/dashboard", {
          state: {
            resume: res,
            fileName: activeFileName || "Vault_Resume.pdf",
          },
        });
      }
    } finally {
      setLoadingVaultResume(false);
    }
  }

  function handleSelect(selected) {
    setFile(selected);
    setError("");
    setProgress(0);
    warmUpBackend();
  }

  function handleRemove() {
    setFile(null);
    setError("");
    setProgress(0);
  }

  async function handleAnalyze() {
    if (mode === "file") {
      if (!file || uploading) return;

      setUploading(true);
      setError("");
      setProgress(0);

      try {
        const payload = await uploadResume(file, setProgress);
        const resolvedResume = payload.resume;
        const resolvedName = payload.filename || file.name;

        // Persist globally across all 16 modules
        setActiveResume(resolvedResume, resolvedName);

        navigate("/dashboard", {
          state: {
            resume: resolvedResume,
            fileName: resolvedName,
          },
          replace: true,
        });
      } catch (err) {
        setError(getErrorMessage(err));
        setUploading(false);
        setProgress(0);
      }
    } else {
      if (!pastedText.trim() || uploading) return;

      setUploading(true);
      setError("");
      setProgress(50);

      try {
        const payload = await uploadResumeText(pastedText);
        const resolvedResume = payload.resume;
        const resolvedName = payload.filename || "Pasted_Resume.txt";

        // Persist globally across all 16 modules
        setActiveResume(resolvedResume, resolvedName);

        setProgress(100);
        navigate("/dashboard", {
          state: {
            resume: resolvedResume,
            fileName: resolvedName,
          },
          replace: true,
        });
      } catch (err) {
        setError(getErrorMessage(err));
        setUploading(false);
        setProgress(0);
      }
    }
  }

  function handleLoadSample(sample) {
    setActiveResume(sample.data, `${sample.name.replace(/\s+/g, "_")}.pdf`);
    navigate("/dashboard", {
      state: {
        resume: sample.data,
        fileName: `${sample.name.replace(/\s+/g, "_")}.pdf`,
      },
    });
  }

  function handleLoadSampleText() {
    const sample = `Cheralathan B.N
Senior Full-Stack & AI Engineer
Email: cheralathan.dev@example.com | Phone: +91 9876543210 | Location: Remote / Bangalore
LinkedIn: linkedin.com/in/cheralathan | GitHub: github.com/cheralathan

SUMMARY
High-impact Full-Stack Engineer with 3+ years architecting web applications, distributed systems, and Generative AI workflows. Proven track record optimizing API latency by 45% and building resilient React & Node.js architectures.

SKILLS
React, Next.js, TypeScript, JavaScript, Node.js, Express, Python, FastAPI, Docker, Kubernetes, AWS, PostgreSQL, MongoDB, Redis, GraphQL, Git, CI/CD, Microservices, System Design, REST APIs, TailwindCSS

EXPERIENCE
Senior Software Engineer | Tech Innovators (2022 - Present)
- Architected high-throughput microservices using Node.js, Express, and PostgreSQL handling 2M+ daily requests.
- Integrated LLM pipelines using Ollama and OpenAI embeddings, accelerating search relevance by 40%.
- Streamlined frontend rendering using Next.js and React server components, cutting load times by 35%.

Full-Stack Developer | CloudMatrix Solutions (2020 - 2022)
- Built interactive analytics dashboards using React, TypeScript, and Redis caching.
- Automated CI/CD pipelines via GitHub Actions and Docker, reducing deployment cycle times by 50%.

EDUCATION
B.E. Computer Science and Engineering | K.S.R. College of Engineering (2016 - 2020) - GPA: 8.4/10

PROJECTS
- Obsidian Resume Intelligence Engine: AI-powered resume parsing and ATS auditing application.
- Real-Time Distributed Task Queue: Redis-backed pub/sub system with automated worker scaling.`;

    setPastedText(sample);
  }

  return (
    <AppLayout>
      <div className="upload-page-shell">
        <section className="upload container">
          <div className="upload__head">
            <span className="upload__eyebrow">Obsidian Intelligence Engine</span>
            <h1 className="upload__title">Upload or test your resume</h1>
            <p className="upload__subtitle">
              Upload your PDF resume, paste text directly, or test immediately with a built-in profile.
              Our dual-engine AI will score ATS readiness, rewrite STAR bullets, generate cover letters, and simulate interviews.
            </p>
          </div>

          {/* Quick Demo Resumes */}
          {samples && samples.resumes && (
            <div className="upload__demo-bar">
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                1-Click Instant Demo:
              </span>
              {samples.resumes.map((sample) => (
                <button
                  key={sample.id}
                  className="upload__demo-btn"
                  onClick={() => handleLoadSample(sample)}
                  type="button"
                >
                  <SparkleIcon width={13} height={13} style={{ color: "#ffffff" }} />
                  {sample.name}
                </button>
              ))}
            </div>
          )}

          <div className="upload__panel">
            {/* Active Resume Notification Banner */}
            {activeResume && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "16px 20px",
                  background: "linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%)",
                  border: "1px solid rgba(34, 197, 94, 0.35)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "rgba(34, 197, 94, 0.2)",
                      display: "grid",
                      placeItems: "center",
                      color: "#4ade80",
                    }}
                  >
                    <CheckIcon width={18} height={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
                      Active Candidate: {activeResume.contact?.name || user?.name || "Active Resume"}
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}>
                      File: <strong>{activeFileName}</strong> • {activeResume.skills?.length || 0} skills detected • Synchronized across all 16 Studio tools
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button
                    variant="primary"
                    onClick={() => navigate("/dashboard", { state: { resume: activeResume, fileName: activeFileName } })}
                    icon={<SparkleIcon width={14} height={14} />}
                    style={{ padding: "6px 14px", fontSize: "12px" }}
                  >
                    Open in Dashboard
                  </Button>
                </div>
              </div>
            )}

            {/* Mode Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "20px",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => setMode("file")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: mode === "file" ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent",
                  background: mode === "file" ? "rgba(255,255,255,0.1)" : "transparent",
                  color: mode === "file" ? "#ffffff" : "var(--text-muted)",
                  transition: "all 0.15s ease",
                }}
              >
                <DocumentIcon width={15} height={15} />
                Upload Resume (PDF, DOCX)
              </button>

              <button
                type="button"
                onClick={() => setMode("text")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: mode === "text" ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent",
                  background: mode === "text" ? "rgba(255,255,255,0.1)" : "transparent",
                  color: mode === "text" ? "#ffffff" : "var(--text-muted)",
                  transition: "all 0.15s ease",
                }}
              >
                <SparkleIcon width={15} height={15} />
                Paste Resume Text Directly
              </button>
            </div>

            {mode === "file" ? (
              file ? (
                <SelectedFileCard
                  file={file}
                  onRemove={uploading ? undefined : handleRemove}
                />
              ) : (
                <FileDropzone onSelect={handleSelect} />
              )
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
                    Paste your plain text resume or Markdown below:
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSampleText}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#e2e8f0",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Load Sample Resume Text
                  </button>
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste candidate resume here... Include contact info, skills, experience, and education."
                  rows={10}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    background: "rgba(10, 11, 16, 0.8)",
                    border: "1px solid var(--border-strong)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontFamily: "var(--font-mono, monospace)",
                    lineHeight: "1.6",
                    resize: "vertical",
                  }}
                />
              </div>
            )}

            {/* Loading state: real upload/parse progress. */}
            {uploading && (
              <div className="upload__progress" role="status" aria-live="polite">
                <div className="upload__progress-head">
                  <span className="upload__spinner" aria-hidden="true" />
                  <span>
                    {progress < 100
                      ? `Uploading… ${progress}%`
                      : "Parsing resume with native Node engine…"}
                  </span>
                </div>
                <div
                  className="upload__progress-track"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="upload__progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !uploading && (
              <p className="upload__error" role="alert">
                <AlertIcon width={18} height={18} />
                {error}
              </p>
            )}

            <div className="upload__actions">
              <Button
                onClick={handleAnalyze}
                disabled={(mode === "file" && !file) || (mode === "text" && !pastedText.trim()) || uploading}
                icon={<ArrowRightIcon width={19} height={19} />}
                style={
                  ((mode === "file" && !file) || (mode === "text" && !pastedText.trim()) || uploading)
                    ? { opacity: 0.45, cursor: "not-allowed" }
                    : undefined
                }
              >
                {uploading
                  ? "Analyzing Resume…"
                  : error
                  ? "Try Again"
                  : "Analyze Resume"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

export default UploadResume;
