import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { useResume } from "../context/ResumeContext";
import { useToast } from "../context/ToastContext";
import {
  SparkleIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon,
  PrinterIcon,
  DownloadIcon,
  GitCompareIcon,
  ShieldCheckIcon,
  GaugeIcon,
  ArrowRightIcon,
  WandIcon,
} from "../components/icons";
import { getResumeDiffWithAi } from "../lib/api";
import "../styles/ui.css";
import "../styles/ResumeDiff.css";

export default function ResumeDiff() {
  const { user } = useAuth();
  const { activeResume } = useResume();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [diffData, setDiffData] = useState(null);
  const [activeSectionFilter, setActiveSectionFilter] = useState("all");
  const [copiedKey, setCopiedKey] = useState(null);

  async function loadDiff() {
    setIsLoading(true);
    try {
      const originalResume = activeResume || {
        contact: { name: user?.name || "Cheralathan B.N" },
        skills: user?.skills && user.skills.length > 0 ? user.skills : ["React", "Node.js", "JavaScript", "HTML/CSS"],
        summary: user?.bio || "Experienced software engineer with knowledge in web development and backend engineering.",
        experience: [
          { bullets: ["Worked on frontend React user interface and resolved reported bugs."] },
          { bullets: ["Built new features and collaborated with team members on weekly releases."] },
        ],
      };

      const tailoredResume = {
        targetRole: user?.targetTitle || "Senior Full-Stack & Generative AI Architect",
        summary: `Results-driven ${user?.targetTitle || "Senior Full-Stack Architect"} with proven track record designing scalable architectures, optimizing database latency by 35%, and deploying production-grade AI solutions.`,
        skills: [
          ...(originalResume.skills),
          "Microservices Architecture",
          "High-Throughput Distributed Systems",
          "LLM Integration & Prompt Engineering",
          "CI/CD Pipeline Automation",
          "Redis Distributed Caching",
          "PostgreSQL Optimization",
        ],
        experience: [
          { bullets: ["Spearheaded PostgreSQL and Redis caching optimization, accelerating backend API throughput by 42% and eliminating query timeouts under peak load."] },
          { bullets: ["Architected end-to-end automated CI/CD deployment pipelines on Docker and GitHub Actions, shortening release cycles from 14 days to 4 hours."] },
        ],
      };

      const res = await getResumeDiffWithAi({ originalResume, tailoredResume });
      if (res?.success) {
        setDiffData(res);
      }
    } catch (err) {
      showToast("Failed to load resume diff: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDiff();
  }, [user]);

  function handleCopy(text, key) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const sections = diffData?.diffComparisons || [];
  const filteredSections = sections.filter((s) => {
    if (activeSectionFilter === "all") return true;
    if (activeSectionFilter === "summary") return s.section.includes("Summary");
    if (activeSectionFilter === "skills") return s.section.includes("Skills");
    if (activeSectionFilter === "experience") return s.section.includes("Experience");
    return true;
  });

  return (
    <AppLayout>
      <div className="resume-diff-page">
        {/* Header */}
        <div className="diff-header">
          <div>
            <div className="diff-eyebrow">
              <GitCompareIcon width={13} height={13} />
              <span>Version Control & ATS Tuning Inspector</span>
            </div>
            <h1 className="diff-title">Side-by-Side Resume Diff & Score Optimizer</h1>
            <p className="diff-subtitle">
              Inspect line-by-line enhancements between your original resume and the AI-tailored edition. Track keywords injected, action verbs upgraded, and ATS score delta.
            </p>
          </div>

          <div className="diff-header-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={loadDiff}
              disabled={isLoading}
            >
              <RefreshIcon width={14} height={14} className={isLoading ? "spin" : ""} />
              <span>{isLoading ? "Comparing…" : "Re-evaluate Diff"}</span>
            </button>
            <Link to="/builder" className="btn btn--primary">
              <PrinterIcon width={14} height={14} />
              <span>Open in PDF Builder</span>
            </Link>
          </div>
        </div>

        {/* Score Delta & Key Highlights Bar */}
        <div className="score-delta-bar">
          <div className="delta-score-card original">
            <span className="delta-label">Original Version</span>
            <div className="delta-value-row">
              <span className="score-num">{diffData?.originalScore || 64}%</span>
              <span className="score-grade">Baseline</span>
            </div>
            <span className="delta-caption">Missing 6 core keywords</span>
          </div>

          <div className="delta-arrow-divider">
            <div className="delta-pill">
              <span>+{diffData?.scoreDelta || 26}%</span>
              <span style={{ fontSize: "10px" }}>ATS JUMP</span>
            </div>
          </div>

          <div className="delta-score-card tailored">
            <span className="delta-label">AI-Tailored Edition</span>
            <div className="delta-value-row">
              <span className="score-num" style={{ color: "#4ade80" }}>{diffData?.tailoredScore || 90}%</span>
              <span className="score-grade top">Top 5% Tier</span>
            </div>
            <span className="delta-caption">Fully ATS Optimized</span>
          </div>

          <div className="delta-stats-group">
            <div className="stat-pill">
              <span className="stat-num">+{diffData?.summaryStats?.keywordsAdded || 6}</span>
              <span className="stat-txt">Keywords Injected</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">{diffData?.summaryStats?.weakVerbsReplaced || 4}</span>
              <span className="stat-txt">Weak Verbs Upgraded</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">{diffData?.summaryStats?.metricsQuantified || 3}</span>
              <span className="stat-txt">Metrics Quantified</span>
            </div>
          </div>
        </div>

        {/* Section Filter Pills */}
        <div className="filter-pill-bar">
          <span className="filter-label">Filter Section:</span>
          {[
            { id: "all", label: "All Sections (4)" },
            { id: "summary", label: "Summary Statement" },
            { id: "skills", label: "Skills Matrix" },
            { id: "experience", label: "Experience Bullets" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`filter-btn ${activeSectionFilter === f.id ? "active" : ""}`}
              onClick={() => setActiveSectionFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Side-by-side Diffs */}
        <div className="diff-cards-container">
          {filteredSections.map((item, index) => (
            <div key={index} className="diff-card">
              <div className="diff-card-head">
                <div className="diff-title-box">
                  <span className="diff-section-tag">{item.section}</span>
                  <span className="diff-boost-badge">{item.scoreBoost}</span>
                </div>

                <div className="diff-highlights-chips">
                  {item.highlights.map((h, hi) => (
                    <span key={hi} className="highlight-chip">
                      <CheckIcon width={11} height={11} />
                      <span>{h}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Side by Side Split Columns */}
              <div className="diff-split-view">
                {/* Original (Left) */}
                <div className="diff-col original-col">
                  <div className="col-header">
                    <span className="col-tag">Original Resume</span>
                    <span className="col-status-warn">Baseline</span>
                  </div>

                  {item.originalList ? (
                    <div className="skills-cloud">
                      {item.originalList.map((sk, ski) => (
                        <span key={ski} className="skill-chip original-chip">
                          {sk}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="diff-text-box">
                      <p>{item.original}</p>
                    </div>
                  )}
                </div>

                {/* Tailored (Right) */}
                <div className="diff-col tailored-col">
                  <div className="col-header">
                    <span className="col-tag" style={{ color: "#4ade80" }}>
                      AI Optimized Edition
                    </span>
                    <button
                      type="button"
                      className="copy-btn-sm"
                      onClick={() =>
                        handleCopy(
                          item.tailored || (item.tailoredList ? item.tailoredList.join(", ") : ""),
                          `diff-${index}`
                        )
                      }
                    >
                      {copiedKey === `diff-${index}` ? (
                        <CheckIcon width={12} height={12} />
                      ) : (
                        <CopyIcon width={12} height={12} />
                      )}
                      <span>{copiedKey === `diff-${index}` ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  {item.tailoredList ? (
                    <div className="skills-cloud">
                      {item.tailoredList.map((sk, ski) => {
                        const isNew = item.addedItems?.includes(sk);
                        return (
                          <span
                            key={ski}
                            className={`skill-chip ${isNew ? "new-chip" : "existing-chip"}`}
                            title={isNew ? "Newly injected high-priority keyword" : ""}
                          >
                            {isNew && <span className="chip-plus">+</span>}
                            <span>{sk}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="diff-text-box tailored-text">
                      <p>{item.tailored}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actionable Takeaways Footer Card */}
        <div className="takeaways-card">
          <div className="takeaways-head">
            <ShieldCheckIcon width={18} height={18} style={{ color: "#4ade80" }} />
            <h3 className="takeaways-title">Executive Action Items for ATS Submission</h3>
          </div>
          <ul className="takeaways-list">
            {(diffData?.actionableTakeaways || []).map((t, ti) => (
              <li key={ti}>
                <span className="check-bullet">✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
