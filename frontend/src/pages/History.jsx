import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/ui.css";
import "../styles/Dashboard.css";
import AppLayout from "../components/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import {
  DocumentIcon,
  StarIcon,
  TrashIcon,
  ArrowRightIcon,
  LayersIcon,
  UploadIcon,
  SparkleIcon,
  CheckIcon,
  CloseIcon,
  WandIcon,
  MicIcon,
  GitCompareIcon,
  CopyIcon,
  DownloadIcon,
} from "../components/icons";
import {
  getAllHistoryCollections,
  deleteHistoryItem,
  deleteTailoredRecord,
  deleteCoverLetterRecord,
  deleteInterviewRecord,
  deleteMultiRecord,
  deleteResumeRecord,
  exportDatabaseBackup,
  importDatabaseBackup,
  clearDatabaseHistory,
  seedSampleDatabaseHistory,
  getErrorMessage,
} from "../lib/api";
import { useResume } from "../context/ResumeContext";

export default function History() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { activeFileName, setActiveResume } = useResume();

  const [data, setData] = useState({
    analyses: [],
    tailoredResumes: [],
    coverLetters: [],
    interviewPreps: [],
    multiMatches: [],
    resumes: [],
    stats: {},
  });
  const [activeTab, setActiveTab] = useState("resumes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [vaultMessage, setVaultMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await getAllHistoryCollections();
      setData({
        analyses: res.analyses || [],
        tailoredResumes: res.tailoredResumes || [],
        coverLetters: res.coverLetters || [],
        interviewPreps: res.interviewPreps || [],
        multiMatches: res.multiMatches || [],
        resumes: res.resumes || [],
        stats: res.stats || {},
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function showMessage(msg, isError = false) {
    setVaultMessage({ text: msg, isError });
    setTimeout(() => setVaultMessage(null), 5000);
  }

  // Export full database JSON file
  async function handleExportDatabase() {
    try {
      const backup = await exportDatabaseBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resumeai_database_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage("Database backup downloaded successfully!");
    } catch (err) {
      showMessage(`Export error: ${getErrorMessage(err)}`, true);
    }
  }

  // Import database JSON file
  function handleSelectImportFile() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importDatabaseBackup(parsed);
      showMessage("Database backup restored successfully!");
      loadData();
    } catch (err) {
      showMessage(`Failed to import backup: ${err.message}`, true);
    } finally {
      e.target.value = "";
    }
  }

  // Seed sample data
  async function handleSeedData() {
    try {
      await seedSampleDatabaseHistory();
      showMessage("Sample analysis record seeded into database!");
      loadData();
    } catch (err) {
      showMessage(`Seed error: ${getErrorMessage(err)}`, true);
    }
  }

  // Clear all history
  async function handleClearDatabase() {
    if (!window.confirm("Are you sure you want to clear all history records? This cannot be undone.")) return;
    try {
      await clearDatabaseHistory();
      showMessage("Database records cleared successfully.");
      loadData();
    } catch (err) {
      showMessage(`Clear error: ${getErrorMessage(err)}`, true);
    }
  }

  // Delete Analysis
  async function handleDeleteAnalysis(id, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this analysis record from embedded database?")) return;
    try {
      await deleteHistoryItem(id);
      setData((prev) => ({
        ...prev,
        analyses: prev.analyses.filter((item) => item.id !== id),
      }));
      showMessage("Analysis record deleted.");
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  // Delete Tailored Resume
  async function handleDeleteTailored(id, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this tailored resume record?")) return;
    try {
      await deleteTailoredRecord(id);
      setData((prev) => ({
        ...prev,
        tailoredResumes: prev.tailoredResumes.filter((item) => item.id !== id),
      }));
      showMessage("Tailored resume deleted.");
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  // Delete Cover Letter
  async function handleDeleteCover(id, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this cover letter?")) return;
    try {
      await deleteCoverLetterRecord(id);
      setData((prev) => ({
        ...prev,
        coverLetters: prev.coverLetters.filter((item) => item.id !== id),
      }));
      showMessage("Cover letter deleted.");
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  // Delete Interview
  async function handleDeleteInterview(id, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this interview prep session?")) return;
    try {
      await deleteInterviewRecord(id);
      setData((prev) => ({
        ...prev,
        interviewPreps: prev.interviewPreps.filter((item) => item.id !== id),
      }));
      showMessage("Interview prep session deleted.");
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  // Delete Multi-Job
  async function handleDeleteMulti(id, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this multi-job battle?")) return;
    try {
      await deleteMultiRecord(id);
      setData((prev) => ({
        ...prev,
        multiMatches: prev.multiMatches.filter((item) => item.id !== id),
      }));
      showMessage("Multi-job battle deleted.");
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  // Delete Resume
  async function handleDeleteResume(id, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this resume from the embedded database?")) return;
    try {
      await deleteResumeRecord(id);
      setData((prev) => ({
        ...prev,
        resumes: prev.resumes.filter((item) => item.id !== id),
      }));
      showMessage("Resume record deleted.");
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  // Activate Resume in Studio Context
  function handleActivateResume(r) {
    const candidateProfile = {
      name: r.candidateName || r.name,
      email: r.email,
      phone: r.phone,
      skills: r.skills || [],
      experience: r.experience || [],
      education: r.education || [],
    };
    setActiveResume(r.resumeText || r.rawText || "", r.filename, candidateProfile);
    showMessage(`Active Studio resume set to "${r.filename || r.candidateName}"!`);
  }

  function handleOpenAnalysis(item) {
    navigate("/dashboard", {
      state: {
        resume: item.resume,
        fileName: item.filename,
        savedAnalysis: item,
      },
    });
  }

  function handleCopyText(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleDownloadMarkdown(content, filename) {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const [scoreFilter, setScoreFilter] = useState("all");

  const filteredAnalyses = data.analyses.filter((item) => {
    const q = searchTerm.toLowerCase();
    const name = (item.candidateName || "").toLowerCase();
    const file = (item.filename || "").toLowerCase();
    const jd = (item.jobDescription || "").toLowerCase();
    const matchesSearch = name.includes(q) || file.includes(q) || jd.includes(q);
    if (!matchesSearch) return false;
    if (scoreFilter === "high") return (item.atsScore || 0) >= 75;
    if (scoreFilter === "mid") return (item.atsScore || 0) >= 50 && (item.atsScore || 0) < 75;
    if (scoreFilter === "low") return (item.atsScore || 0) < 50;
    return true;
  });

  return (
    <AppLayout>
      <div className="history-page-shell">
        <section className="dashboard container">
          {/* Header */}
          <div className="dashboard__head">
            <div>
              <span className="dashboard__eyebrow">
                <LayersIcon width={14} height={14} /> Embedded Local Storage
              </span>
              <h1 className="dashboard__title">Database & History Vault</h1>
              <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "14px" }}>
                Fully persistent JSON store at <code style={{ color: "#ffffff", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "4px" }}>backend/data/db.json</code>
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".json,application/json"
                onChange={handleFileChange}
              />
              <Button onClick={handleExportDatabase} variant="secondary" icon={<DownloadIcon width={16} height={16} />}>
                Export Backup (.json)
              </Button>
              <Button onClick={handleSelectImportFile} variant="secondary" icon={<UploadIcon width={16} height={16} />}>
                Import Backup
              </Button>
              <Button onClick={handleSeedData} variant="secondary" icon={<SparkleIcon width={16} height={16} />}>
                Seed Sample
              </Button>
              <Button as={Link} to="/upload" icon={<UploadIcon width={18} height={18} />}>
                New Analysis
              </Button>
            </div>
          </div>

          {/* Vault Notification Banner */}
          {vaultMessage && (
            <div
              style={{
                padding: "12px 18px",
                borderRadius: "10px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: vaultMessage.isError ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)",
                border: vaultMessage.isError ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.3)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              <SparkleIcon width={16} height={16} style={{ color: "#ffffff" }} />
              <span>{vaultMessage.text}</span>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="dashboard__stats">
            <div className="stat-card">
              <div className="stat-card__top">
                <span className="stat-card__icon"><StarIcon width={20} height={20} /></span>
                <span className="stat-card__delta stat-card__delta--up">Active</span>
              </div>
              <div className="stat-card__value">{data.analyses.length}</div>
              <div className="stat-card__label">Total ATS Scans</div>
            </div>

            <div className="stat-card">
              <div className="stat-card__top">
                <span className="stat-card__icon"><WandIcon width={20} height={20} /></span>
                <span className="stat-card__delta stat-card__delta--up">AI Generated</span>
              </div>
              <div className="stat-card__value">{data.tailoredResumes.length}</div>
              <div className="stat-card__label">Tailored Resumes</div>
            </div>

            <div className="stat-card">
              <div className="stat-card__top">
                <span className="stat-card__icon"><DocumentIcon width={20} height={20} /></span>
                <span className="stat-card__delta stat-card__delta--up">Generated</span>
              </div>
              <div className="stat-card__value">{data.coverLetters.length}</div>
              <div className="stat-card__label">Cover Letters</div>
            </div>

            <div className="stat-card">
              <div className="stat-card__top">
                <span className="stat-card__icon"><LayersIcon width={20} height={20} /></span>
                <span className="stat-card__delta stat-card__delta--up">Avg Score</span>
              </div>
              <div className="stat-card__value">{data.stats.avgAtsScore || 78}%</div>
              <div className="stat-card__label">Average ATS Match</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="dashboard-tabs">
            <button
              className={`dashboard-tab ${activeTab === "resumes" ? "dashboard-tab--active" : ""}`}
              onClick={() => setActiveTab("resumes")}
              type="button"
            >
              <DocumentIcon width={16} height={16} /> Saved Resumes ({data.resumes.length})
            </button>
            <button
              className={`dashboard-tab ${activeTab === "analyses" ? "dashboard-tab--active" : ""}`}
              onClick={() => setActiveTab("analyses")}
              type="button"
            >
              <StarIcon width={16} height={16} /> ATS Scans ({data.analyses.length})
            </button>
            <button
              className={`dashboard-tab ${activeTab === "tailored" ? "dashboard-tab--active" : ""}`}
              onClick={() => setActiveTab("tailored")}
              type="button"
            >
              <WandIcon width={16} height={16} /> Tailored Resumes ({data.tailoredResumes.length})
            </button>
            <button
              className={`dashboard-tab ${activeTab === "coverletters" ? "dashboard-tab--active" : ""}`}
              onClick={() => setActiveTab("coverletters")}
              type="button"
            >
              <DocumentIcon width={16} height={16} /> Cover Letters ({data.coverLetters.length})
            </button>
            <button
              className={`dashboard-tab ${activeTab === "interview" ? "dashboard-tab--active" : ""}`}
              onClick={() => setActiveTab("interview")}
              type="button"
            >
              <MicIcon width={16} height={16} /> Interview Sessions ({data.interviewPreps.length})
            </button>
            <button
              className={`dashboard-tab ${activeTab === "multi" ? "dashboard-tab--active" : ""}`}
              onClick={() => setActiveTab("multi")}
              type="button"
            >
              <GitCompareIcon width={16} height={16} /> Multi-Job Battles ({data.multiMatches.length})
            </button>
          </div>

          {/* Tab 0: Saved Resumes in Vault */}
          {activeTab === "resumes" && (
            <Card className="col-12" title="Candidate Resumes in Embedded Database" icon={<DocumentIcon width={20} height={20} />}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Filter resumes by candidate name or file…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: "260px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "rgba(7, 8, 12, 0.6)",
                    border: "1px solid var(--border-strong)",
                    color: "#ffffff",
                    fontSize: "14px",
                  }}
                />
                <Button as={Link} to="/upload" icon={<UploadIcon width={16} height={16} />}>
                  Upload New Resume
                </Button>
              </div>

              {data.resumes.filter(r => {
                const q = searchTerm.toLowerCase();
                return (r.candidateName || "").toLowerCase().includes(q) || (r.filename || "").toLowerCase().includes(q);
              }).length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
                  <p>No resumes stored in local database matching your search.</p>
                  <Button as={Link} to="/upload" style={{ marginTop: "12px" }}>
                    Upload Resume
                  </Button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {data.resumes
                    .filter(r => {
                      const q = searchTerm.toLowerCase();
                      return (r.candidateName || "").toLowerCase().includes(q) || (r.filename || "").toLowerCase().includes(q);
                    })
                    .map((r) => {
                      const isActive = activeFileName === r.filename;
                      return (
                        <div
                          key={r.id}
                          style={{
                            padding: "18px 22px",
                            borderRadius: "12px",
                            background: isActive ? "rgba(255, 255, 255, 0.05)" : "rgba(18, 21, 33, 0.7)",
                            border: isActive ? "1px solid rgba(255, 255, 255, 0.4)" : "1px solid var(--border)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <h4 style={{ color: "#ffffff", margin: 0, fontSize: "16px", fontWeight: "700" }}>
                                  {r.candidateName || "Candidate Resume"}
                                </h4>
                                {isActive && (
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: "700",
                                      padding: "3px 8px",
                                      borderRadius: "999px",
                                      background: "#ffffff",
                                      color: "#000000",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em",
                                    }}
                                  >
                                    Active Studio Resume
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                                <DocumentIcon width={14} height={14} />
                                <span>{r.filename}</span>
                                <span>•</span>
                                <span>Uploaded {new Date(r.createdAt).toLocaleDateString()}</span>
                                {r.email && (
                                  <>
                                    <span>•</span>
                                    <span>{r.email}</span>
                                  </>
                                )}
                              </p>
                            </div>

                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                              <button
                                type="button"
                                onClick={() => handleActivateResume(r)}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  border: "1px solid rgba(255, 255, 255, 0.3)",
                                  background: isActive ? "rgba(255, 255, 255, 0.15)" : "#ffffff",
                                  color: isActive ? "#ffffff" : "#000000",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <CheckIcon width={13} height={13} />
                                {isActive ? "Currently Active" : "Activate in Studio"}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleActivateResume(r);
                                  navigate("/dashboard", {
                                    state: {
                                      resume: r.resumeText || r.rawText,
                                      fileName: r.filename,
                                    },
                                  });
                                }}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  border: "1px solid rgba(255, 255, 255, 0.15)",
                                  background: "rgba(255, 255, 255, 0.06)",
                                  color: "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <SparkleIcon width={13} height={13} />
                                Scan in Dashboard
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleDeleteResume(r.id, e)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(255, 255, 255, 0.15)",
                                  background: "rgba(255, 255, 255, 0.04)",
                                  color: "#ffffff",
                                  cursor: "pointer",
                                }}
                                title="Delete resume from database"
                              >
                                <TrashIcon width={14} height={14} />
                              </button>
                            </div>
                          </div>

                          {Array.isArray(r.skills) && r.skills.length > 0 && (
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                              {r.skills.slice(0, 10).map((sk, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: "11px",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {sk}
                                </span>
                              ))}
                              {r.skills.length > 10 && (
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", alignSelf: "center" }}>
                                  +{r.skills.length - 10} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>
          )}

          {/* Tab 1: ATS Scans */}
          {activeTab === "analyses" && (
            <Card className="col-12" title="Saved ATS Match Scans" icon={<StarIcon width={20} height={20} />}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Filter by candidate, file name, or job keywords…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: "260px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "rgba(7, 8, 12, 0.6)",
                    border: "1px solid var(--border-strong)",
                    color: "#ffffff",
                    fontSize: "14px",
                  }}
                />
                {data.analyses.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearDatabase}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "#ffffff",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Clear All Scans
                  </button>
                )}
              </div>

              {/* Score Filter Pills */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                {[
                  { id: "all", label: `All Scans (${data.analyses.length})` },
                  { id: "high", label: `Top Matches ≥75% (${data.analyses.filter(a => (a.atsScore || 0) >= 75).length})` },
                  { id: "mid", label: `Moderate 50-74% (${data.analyses.filter(a => (a.atsScore || 0) >= 50 && (a.atsScore || 0) < 75).length})` },
                  { id: "low", label: `Needs Tuning <50% (${data.analyses.filter(a => (a.atsScore || 0) < 50).length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setScoreFilter(tab.id)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      border: scoreFilter === tab.id ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.14)",
                      background: scoreFilter === tab.id ? "#ffffff" : "rgba(255,255,255,0.04)",
                      color: scoreFilter === tab.id ? "#000000" : "#d4d4d8",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredAnalyses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
                  <p>No saved scans match your current filter or search query.</p>
                  <Button onClick={handleSeedData} variant="secondary" icon={<SparkleIcon width={16} height={16} />} style={{ marginTop: "12px" }}>
                    Load Sample Profile
                  </Button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {filteredAnalyses.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenAnalysis(item)}
                      style={{
                        padding: "16px 20px",
                        borderRadius: "12px",
                        background: "rgba(18, 21, 33, 0.7)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "14px",
                            display: "grid",
                            placeItems: "center",
                            background: item.atsScore >= 75 ? "#ffffff" : "rgba(255,255,255,0.08)",
                            border: item.atsScore >= 75 ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.2)",
                            color: item.atsScore >= 75 ? "#000000" : "#ffffff",
                            fontWeight: "800",
                            fontSize: "18px",
                          }}
                        >
                          {item.atsScore}%
                        </div>

                        <div>
                          <h4 style={{ margin: 0, fontSize: "16px", color: "#ffffff" }}>
                            {item.candidateName}
                          </h4>
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                            {item.filename} • {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--mono-300)" }}>
                            JD: {item.jobDescription.slice(0, 90)}…
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12px", color: "#ffffff", fontWeight: "700", marginRight: "6px" }}>
                          Open in Dashboard →
                        </span>
                        <button
                          onClick={(e) => handleDeleteAnalysis(item.id, e)}
                          title="Delete from database"
                          style={{
                            padding: "8px",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            borderRadius: "8px",
                            color: "#ffffff",
                            cursor: "pointer",
                          }}
                        >
                          <TrashIcon width={16} height={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Tab 2: Tailored Resumes */}
          {activeTab === "tailored" && (
            <Card className="col-12" title="Saved AI Tailored Resumes" icon={<WandIcon width={20} height={20} />}>
              {data.tailoredResumes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
                  <p>No tailored resumes generated yet. Go to the <strong>AI Resume Tailor Studio</strong> tab in the Dashboard to create one!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {data.tailoredResumes.map((t) => (
                    <div key={t.id} style={{ padding: "18px 22px", borderRadius: "12px", background: "rgba(18, 21, 33, 0.7)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase" }}>{t.targetRole}</span>
                          <h4 style={{ margin: "2px 0 0", color: "#ffffff", fontSize: "1.05rem" }}>{t.candidateName}</h4>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(t.fullTailoredResumeMarkdown || t.tailoredSummary, t.id)}
                            style={{
                              padding: "6px 12px",
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid var(--border)",
                              borderRadius: "6px",
                              color: "#ffffff",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            {copiedId === t.id ? "Copied!" : "Copy"}
                          </button>
                          {t.fullTailoredResumeMarkdown && (
                            <button
                              type="button"
                              onClick={() => handleDownloadMarkdown(t.fullTailoredResumeMarkdown, `${t.candidateName.replace(/\s+/g, "_")}_Tailored.md`)}
                              style={{
                                padding: "6px 12px",
                                background: "rgba(255,255,255,0.1)",
                                border: "1px solid rgba(255,255,255,0.25)",
                                borderRadius: "6px",
                                color: "#ffffff",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              Download .md
                            </button>
                          )}
                          <button onClick={(e) => handleDeleteTailored(t.id, e)} style={{ padding: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "6px", color: "#ffffff", cursor: "pointer" }}>
                            <TrashIcon width={14} height={14} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.9rem", color: "var(--mono-200)", lineHeight: "1.6" }}>
                        {t.tailoredSummary}
                      </p>
                      <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {t.bulletRewrites?.length || 0} STAR bullets tailored
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Tab 3: Cover Letters */}
          {activeTab === "coverletters" && (
            <Card className="col-12" title="Saved Executive Cover Letters" icon={<DocumentIcon width={20} height={20} />}>
              {data.coverLetters.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
                  <p>No cover letters saved yet. Generate one in the <strong>Executive Cover Letter</strong> tab!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {data.coverLetters.map((c) => (
                    <div key={c.id} style={{ padding: "18px 22px", borderRadius: "12px", background: "rgba(18, 21, 33, 0.7)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase" }}>{c.targetRole} @ {c.companyName}</span>
                          <h4 style={{ margin: "2px 0 0", color: "#ffffff", fontSize: "1rem" }}>{c.candidateName} • Tone: {c.tone}</h4>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleCopyText(c.content, c.id)}
                            style={{
                              padding: "6px 12px",
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid var(--border)",
                              borderRadius: "6px",
                              color: "#ffffff",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            {copiedId === c.id ? "Copied!" : "Copy"}
                          </button>
                          {c.content && (
                            <button
                              type="button"
                              onClick={() => handleDownloadMarkdown(c.content, `${c.candidateName.replace(/\s+/g, "_")}_Cover_Letter.txt`)}
                              style={{
                                padding: "6px 12px",
                                background: "rgba(255,255,255,0.1)",
                                border: "1px solid rgba(255,255,255,0.25)",
                                borderRadius: "6px",
                                color: "#ffffff",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              Download .txt
                            </button>
                          )}
                          <button onClick={(e) => handleDeleteCover(c.id, e)} style={{ padding: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "6px", color: "#ffffff", cursor: "pointer" }}>
                            <TrashIcon width={14} height={14} />
                          </button>
                        </div>
                      </div>
                      <pre style={{ maxHeight: "160px", overflowY: "auto", fontSize: "12px", color: "var(--mono-300)", whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)", lineHeight: "1.6" }}>
                        {c.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Tab 4: Interview Sessions */}
          {activeTab === "interview" && (
            <Card className="col-12" title="Saved Interview Prep Sessions" icon={<MicIcon width={20} height={20} />}>
              {data.interviewPreps.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
                  <p>No interview prep sessions saved yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {data.interviewPreps.map((p) => (
                    <div key={p.id} style={{ padding: "16px 20px", borderRadius: "12px", background: "rgba(18,21,33,0.7)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase" }}>{p.targetRole}</span>
                        <h4 style={{ color: "#ffffff", margin: "4px 0" }}>{p.candidateName} — {p.questions?.length || 0} Questions Prepared</h4>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={(e) => handleDeleteInterview(p.id, e)} style={{ padding: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "6px", color: "#ffffff", cursor: "pointer" }}>
                        <TrashIcon width={14} height={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Tab 5: Multi-Job Battles */}
          {activeTab === "multi" && (
            <Card className="col-12" title="Saved Multi-Job Battles" icon={<GitCompareIcon width={20} height={20} />}>
              {data.multiMatches.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
                  <p>No multi-job comparisons yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {data.multiMatches.map((m) => (
                    <div key={m.id} style={{ padding: "16px 20px", borderRadius: "12px", background: "rgba(18,21,33,0.7)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase" }}>Recommended: {m.recommendedRole}</span>
                        <h4 style={{ color: "#ffffff", margin: "4px 0" }}>{m.candidateName} — {m.comparisons?.length || 0} Jobs Ranked</h4>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{new Date(m.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={(e) => handleDeleteMulti(m.id, e)} style={{ padding: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "6px", color: "#ffffff", cursor: "pointer" }}>
                        <TrashIcon width={14} height={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
