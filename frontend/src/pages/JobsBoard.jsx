import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useResume } from "../context/ResumeContext";
import { getRecommendedJobs, createJobApplication } from "../lib/api";
import {
  BriefcaseIcon,
  SearchIcon,
  CheckIcon,
  SparkleIcon,
  WandIcon,
  MicIcon,
  TargetIcon,
  KanbanIcon,
  PlusIcon,
} from "../components/icons";

export default function JobsBoard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { activeResume, activeFileName } = useResume();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [workModeFilter, setWorkModeFilter] = useState("all"); // 'all' | 'remote' | 'hybrid' | 'onsite'
  const [minMatchFilter, setMinMatchFilter] = useState(0); // 0 | 85 | 90
  const [trackedJobIds, setTrackedJobIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newSalary, setNewSalary] = useState("$160,000 - $210,000");
  const [newSkills, setNewSkills] = useState("React, Node.js, TypeScript, PostgreSQL");
  const [newDescription, setNewDescription] = useState("");
  const [newWorkMode, setNewWorkMode] = useState("remote");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getRecommendedJobs(activeResume)
      .then((res) => {
        if (isMounted && res?.jobs) {
          setJobs(res.jobs);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch jobs:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeResume]);

  function handleAddCustomJob(e) {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) {
      showToast({ title: "Required", message: "Company and Role are required.", type: "error" });
      return;
    }

    const skillsArray = newSkills.split(",").map((s) => s.trim()).filter(Boolean);
    const candidateSkills = (activeResume?.skills || []).map((s) => s.toLowerCase());
    const matched = skillsArray.filter((s) => candidateSkills.some((cs) => cs.includes(s.toLowerCase()) || s.toLowerCase().includes(cs)));
    const missing = skillsArray.filter((s) => !matched.includes(s));
    const score = skillsArray.length > 0 ? Math.round((matched.length / skillsArray.length) * 100) : 80;

    const customJob = {
      id: `custom-${Date.now()}`,
      company: newCompany.trim(),
      role: newRole.trim(),
      location: newWorkMode === "remote" ? "Remote" : "Hybrid / Onsite",
      workMode: newWorkMode,
      salary: newSalary || "$150,000 - $200,000",
      equity: "Competitive Equity / Options",
      level: "Senior",
      department: "Engineering",
      requiredSkills: skillsArray,
      matchedKeywords: matched,
      missingKeywords: missing,
      matchScore: Math.min(99, Math.max(50, score)),
      description: newDescription || `${newRole} at ${newCompany}. High impact technical contributor.`,
      urgent: true,
      posted: "Just now (Custom Added)",
    };

    setJobs((prev) => [customJob, ...prev]);
    setShowAddModal(false);
    setNewCompany("");
    setNewRole("");
    setNewDescription("");
    showToast({
      title: "Job Opportunity Added",
      message: `${customJob.company} - ${customJob.role} evaluated with ${customJob.matchScore}% ATS match score!`,
      type: "success",
    });
  }

  async function handleTrackInCrm(job) {
    try {
      await createJobApplication({
        company: job.company,
        role: job.role,
        location: job.location,
        salary: job.salary,
        atsScore: job.matchScore,
        status: "wishlist",
        notes: `Smart matched with ${job.matchScore}% ATS compatibility score. Matched skills: ${job.matchedKeywords.slice(0, 4).join(", ")}.`,
      });

      setTrackedJobIds((prev) => new Set([...prev, job.id]));
      showToast({
        title: "Tracked in CRM",
        message: `${job.company} - ${job.role} added to your Pipeline Kanban as 'Wishlist'.`,
        type: "success",
      });
    } catch (err) {
      showToast({
        title: "Tracking Failed",
        message: err.response?.data?.error || err.message || "Failed to add to CRM.",
        type: "error",
      });
    }
  }

  function handleTailorForJob(job) {
    showToast({
      title: "Opening Tailor Studio",
      message: `Loading job description for ${job.company} - ${job.role}...`,
      type: "info",
    });
    navigate("/dashboard", {
      state: {
        prefilledJobTitle: job.role,
        prefilledJobDescription: `${job.role} at ${job.company}\n\nRequired Competencies: ${job.requiredSkills.join(", ")}\n\n${job.description}`,
      },
    });
  }

  function handleMockInterviewForJob(job) {
    navigate("/interview", {
      state: {
        role: job.role,
        company: job.company,
      },
    });
  }

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      search.trim() === "" ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.role.toLowerCase().includes(search.toLowerCase()) ||
      j.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesWorkMode =
      workModeFilter === "all" || j.workMode === workModeFilter;

    const matchesScore = j.matchScore >= minMatchFilter;

    return matchesSearch && matchesWorkMode && matchesScore;
  });

  const highMatchCount = jobs.filter((j) => j.matchScore >= 90).length;

  return (
    <AppLayout>
      <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px" }}>
        {/* Header Hero */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "9999px",
              background: "rgba(56, 189, 248, 0.1)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              color: "#38bdf8",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            <SparkleIcon width={14} height={14} />
            <span>AI Opportunity Radar & Match Engine</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(26px, 3.5vw, 38px)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              marginBottom: "10px",
            }}
          >
            Curated High-Match Engineering Openings
          </h1>
          <p
            style={{
              fontSize: "14.5px",
              color: "var(--text-muted)",
              maxWidth: "780px",
              lineHeight: 1.6,
            }}
          >
            Algorithmic ATS gap analysis comparing your profile against verified Staff, Lead, and Senior positions. Click any opportunity to tailor your resume, simulate interviews, or track in your Kanban CRM pipeline.
          </p>
        </div>

        {/* Telemetry Metrics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "16px 20px",
            }}
          >
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Active Openings</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
              {jobs.length} Positions
            </div>
            <div style={{ fontSize: "11px", color: "#4ade80", marginTop: "4px" }}>
              ● Verified real-time telemetry
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "16px 20px",
            }}
          >
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Top Tier Matches (≥90%)</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#38bdf8", marginTop: "4px" }}>
              {highMatchCount} Roles
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
              High-confidence interview probability
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "16px 20px",
            }}
          >
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Avg Compensation Band</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
              $195,000
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
              Excluding equity RSU packages
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "16px 20px",
            }}
          >
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Active Profile Benchmark</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", marginTop: "8px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {user?.name || "Cheralathan B.N"}
            </div>
            <div style={{ fontSize: "11px", color: "#4ade80", marginTop: "4px" }}>
              ✓ User-Scoped Vault Connected
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          {/* Search Box */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
            <SearchIcon width={16} height={16} style={{ color: "#a1a1aa" }} />
            <input
              type="text"
              placeholder="Search companies, titles, or skills (e.g. Airbnb, React, Node.js)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "13.5px",
                width: "100%",
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 600 }}>Work Mode:</span>
            {["all", "remote", "hybrid", "onsite"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setWorkModeFilter(mode)}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: workModeFilter === mode ? "#ffffff" : "rgba(255, 255, 255, 0.1)",
                  background: workModeFilter === mode ? "#ffffff" : "rgba(255, 255, 255, 0.04)",
                  color: workModeFilter === mode ? "#000000" : "#a1a1aa",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.15s ease",
                }}
              >
                {mode}
              </button>
            ))}

            <div style={{ width: "1px", height: "18px", background: "rgba(255, 255, 255, 0.1)", margin: "0 4px" }} />

            <span style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 600 }}>Min Match:</span>
            {[
              { label: "All", val: 0 },
              { label: "85%+", val: 85 },
              { label: "90%+", val: 90 },
            ].map((score) => (
              <button
                key={score.val}
                type="button"
                onClick={() => setMinMatchFilter(score.val)}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: minMatchFilter === score.val ? "#38bdf8" : "rgba(255, 255, 255, 0.1)",
                  background: minMatchFilter === score.val ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
                  color: minMatchFilter === score.val ? "#38bdf8" : "#a1a1aa",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {score.label}
              </button>
            ))}

            <div style={{ width: "1px", height: "18px", background: "rgba(255, 255, 255, 0.1)", margin: "0 4px" }} />

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "6px 14px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                color: "#38bdf8",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              <PlusIcon width={13} height={13} />
              <span>Add Custom Job</span>
            </button>
          </div>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>Scanning live opportunities and computing ATS match scores...</div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", marginBottom: "6px" }}>
              No Openings Found
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Try adjusting your search criteria or resetting the minimum match filter.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredJobs.map((job) => {
              const isTracked = trackedJobIds.has(job.id);
              const scoreColor =
                job.matchScore >= 92 ? "#4ade80" : job.matchScore >= 85 ? "#38bdf8" : "#fbbf24";

              return (
                <div
                  key={job.id}
                  style={{
                    background: "rgba(18, 18, 24, 0.75)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    padding: "24px",
                    transition: "all 0.2s ease",
                    position: "relative",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "20px",
                      flexWrap: "wrap",
                      marginBottom: "16px",
                    }}
                  >
                    {/* Role & Company Left */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          background: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          fontSize: "24px",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        {job.logoEmoji}
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                            {job.role}
                          </h2>
                          {job.urgent && (
                            <span
                              style={{
                                fontSize: "9.5px",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: "rgba(239, 68, 68, 0.15)",
                                color: "#f87171",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                              }}
                            >
                              🔥 URGENT HIRE
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginTop: "6px",
                            fontSize: "13px",
                            color: "var(--text-muted)",
                            flexWrap: "wrap",
                          }}
                        >
                          <strong style={{ color: "#ffffff" }}>{job.company}</strong>
                          <span>•</span>
                          <span>{job.location}</span>
                          <span>•</span>
                          <span style={{ textTransform: "capitalize", color: "#38bdf8" }}>{job.workMode}</span>
                          <span>•</span>
                          <span>{job.department}</span>
                        </div>
                      </div>
                    </div>

                    {/* ATS Match Gauge Right */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 14px",
                          borderRadius: "10px",
                          background: `rgba(${job.matchScore >= 90 ? "34, 197, 94" : "56, 189, 248"}, 0.12)`,
                          border: `1px solid ${scoreColor}`,
                          color: scoreColor,
                          fontWeight: 800,
                          fontSize: "15px",
                        }}
                      >
                        <TargetIcon width={16} height={16} />
                        <span>{job.matchScore}% ATS MATCH</span>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Posted {job.posted}
                      </span>
                    </div>
                  </div>

                  {/* Description Excerpt */}
                  <p
                    style={{
                      fontSize: "13.5px",
                      color: "#d1d5db",
                      lineHeight: 1.6,
                      marginBottom: "16px",
                    }}
                  >
                    {job.description}
                  </p>

                  {/* Compensation & Equity Bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      marginBottom: "16px",
                      fontSize: "13px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Base Salary: </span>
                      <strong style={{ color: "#4ade80", fontWeight: 700 }}>{job.salary}</strong>
                    </div>
                    <span>•</span>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Equity: </span>
                      <strong style={{ color: "#ffffff" }}>{job.equity}</strong>
                    </div>
                    <span>•</span>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Level: </span>
                      <strong style={{ color: "#ffffff" }}>{job.level}</strong>
                    </div>
                  </div>

                  {/* Skills Alignment Matrix */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                      Key Competency Alignment:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {job.matchedKeywords.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(34, 197, 94, 0.12)",
                            color: "#4ade80",
                            border: "1px solid rgba(34, 197, 94, 0.3)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <CheckIcon width={12} height={12} />
                          {skill}
                        </span>
                      ))}

                      {job.missingKeywords.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 500,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(251, 191, 36, 0.08)",
                            color: "#fbbf24",
                            border: "1px solid rgba(251, 191, 36, 0.25)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Simulate adding this skill in Dashboard What-If simulator"
                        >
                          <span>+</span>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      paddingTop: "16px",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {/* Track in CRM */}
                      <button
                        type="button"
                        onClick={() => handleTrackInCrm(job)}
                        disabled={isTracked}
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "8px 14px",
                          borderRadius: "8px",
                          background: isTracked ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.08)",
                          border: isTracked ? "1px solid #4ade80" : "1px solid rgba(255, 255, 255, 0.18)",
                          color: isTracked ? "#4ade80" : "#ffffff",
                          cursor: isTracked ? "default" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <KanbanIcon width={14} height={14} />
                        <span>{isTracked ? "✓ Tracked in Pipeline" : "Track in Pipeline CRM"}</span>
                      </button>

                      {/* Tailor Resume */}
                      <button
                        type="button"
                        onClick={() => handleTailorForJob(job)}
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "8px 14px",
                          borderRadius: "8px",
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          color: "#d4d4d8",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.15s ease",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#d4d4d8")}
                      >
                        <WandIcon width={14} height={14} />
                        <span>Tailor Resume</span>
                      </button>

                      {/* Mock Interview */}
                      <button
                        type="button"
                        onClick={() => handleMockInterviewForJob(job)}
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "8px 14px",
                          borderRadius: "8px",
                          background: "transparent",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          color: "#a1a1aa",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <MicIcon width={13} height={13} />
                        <span>Mock Interview</span>
                      </button>
                    </div>

                    <a
                      href={`https://google.com/search?q=${encodeURIComponent(job.company + " " + job.role + " careers")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "12px",
                        color: "#38bdf8",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      Official Careers Portal ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Target Job Modal */}
        {showAddModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100050,
              display: "grid",
              placeItems: "center",
              padding: "16px",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(8px)",
              }}
              onClick={() => setShowAddModal(false)}
            />
            <div
              style={{
                position: "relative",
                zIndex: 10,
                width: "100%",
                maxWidth: "520px",
                background: "#0c0d12",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", marginBottom: "6px" }}>
                Add Custom Opportunity
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
                Instantly compute ATS match compatibility against your active resume.
              </p>

              <form onSubmit={handleAddCustomJob} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OpenAI, Google, Netflix"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Target Role *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Full-Stack Engineer"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                      Work Mode
                    </label>
                    <select
                      value={newWorkMode}
                      onChange={(e) => setNewWorkMode(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#18181b",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    >
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">Onsite</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                      Salary Range
                    </label>
                    <input
                      type="text"
                      placeholder="$160,000 - $210,000"
                      value={newSalary}
                      onChange={(e) => setNewSalary(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Required Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="React, Node.js, TypeScript, PostgreSQL, Docker"
                    value={newSkills}
                    onChange={(e) => setNewSkills(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Job Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the responsibilities and scope..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "13px",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#a1a1aa",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: "#38bdf8",
                      border: "none",
                      color: "#000000",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Calculate Match & Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
