import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useToast } from "../context/ToastContext";
import { useResume } from "../context/ResumeContext";
import { getPowerBulletsWithAi, getErrorMessage } from "../lib/api";
import {
  ZapIcon,
  SparkleIcon,
  CopyIcon,
  CheckIcon,
  PrinterIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  TargetIcon,
  StarIcon,
} from "../components/icons";
import "../styles/ui.css";
import "../styles/BulletEnhancer.css";

const PRESET_BULLETS = [
  {
    role: "Senior Full Stack Engineer",
    text: "Worked on React frontend components and fixed bugs in our web app.",
  },
  {
    role: "Backend & Systems Architect",
    text: "Responsible for database queries and maintaining Node.js microservices.",
  },
  {
    role: "Frontend Architect",
    text: "Helped improve performance and speed of our customer facing website.",
  },
  {
    role: "DevOps & Cloud Engineer",
    text: "Set up Docker containers and handled deployment pipelines on AWS.",
  },
];

const ROLES = [
  "Senior Full Stack Engineer",
  "Frontend Architect",
  "Backend & Distributed Systems",
  "AI & Generative AI Engineer",
  "Staff Platform / DevOps",
];

export default function BulletEnhancer() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { activeResume, updateActiveResume } = useResume();

  // Extract candidate's real uploaded resume bullets
  const candidateBullets = [];
  if (Array.isArray(activeResume?.experience)) {
    activeResume.experience.forEach((exp) => {
      if (typeof exp === "string") {
        candidateBullets.push(exp.slice(0, 160));
      } else if (exp?.bullets && Array.isArray(exp.bullets)) {
        exp.bullets.forEach((b) => candidateBullets.push(b));
      }
    });
  }

  const initialBullet = candidateBullets.length > 0 ? candidateBullets[0] : PRESET_BULLETS[0].text;
  const [inputBullet, setInputBullet] = useState(initialBullet);
  const [selectedRole, setSelectedRole] = useState(PRESET_BULLETS[0].role);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  async function handleEnhance(bulletToUse = inputBullet, roleToUse = selectedRole) {
    if (!bulletToUse.trim()) {
      showToast("Please enter a bullet point to enhance.", "warning");
      return;
    }

    setLoading(true);
    try {
      const data = await getPowerBulletsWithAi({
        bullet: bulletToUse.trim(),
        role: roleToUse,
        context: context.trim() || undefined,
      });

      if (data?.success) {
        setResult(data);
        showToast("Synthesized 4 high-impact STAR bullet variations!", "success");
      } else {
        throw new Error(data?.message || "Failed to enhance bullet point.");
      }
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPreset(preset) {
    setInputBullet(preset.text);
    setSelectedRole(preset.role);
    handleEnhance(preset.text, preset.role);
  }

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Copied enhanced STAR bullet to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleUseInBuilder(text) {
    // Navigate to ResumeBuilder with bullet passed in state
    navigate("/builder", { state: { suggestedBullet: text } });
    showToast("Transferred to ATS Resume Builder!", "success");
  }

  // Pre-load initial enhancement on mount
  useEffect(() => {
    handleEnhance(PRESET_BULLETS[0].text, PRESET_BULLETS[0].role);
  }, []);

  return (
    <AppLayout>
      <div className="bullet-enhancer-studio">
        {/* Header */}
        <div className="enhancer-head">
          <div className="enhancer-head-info">
            <span className="enhancer-eyebrow">
              <ZapIcon width={14} height={14} /> Google XYZ & STAR Impact Engine
            </span>
            <h1 className="enhancer-title">AI Resume Bullet Point Enhancer</h1>
            <p className="enhancer-subtitle">
              Transform passive, duty-focused bullets into quantifiable Google XYZ formula statements (Accomplished [X] as measured by [Y] by doing [Z]).
            </p>
          </div>

          <div className="enhancer-stats-bar">
            <div className="enhancer-stat-pill">
              <span className="pill-dot" />
              <span>ATS Impact: +38% Callback Rate</span>
            </div>
            <div className="enhancer-stat-pill secondary">
              <span>Google XYZ Rubric Active</span>
            </div>
          </div>
        </div>

        {/* Input & Config Section */}
        <div className="enhancer-input-card">
          <div className="enhancer-preset-row">
            <span className="preset-label">Test 1-Click Examples:</span>
            <div className="preset-buttons">
              {PRESET_BULLETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`preset-btn ${inputBullet === p.text ? "active" : ""}`}
                  onClick={() => handleSelectPreset(p)}
                >
                  <BriefcaseIcon width={12} height={12} />
                  <span>{p.role.split(" ")[0]} Example</span>
                </button>
              ))}
            </div>
          </div>

          <div className="enhancer-form-row">
            <div className="enhancer-field" style={{ flex: 1 }}>
              <label className="enhancer-label">Target Role Level</label>
              <select
                className="enhancer-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="enhancer-field" style={{ flex: 1.5 }}>
              <label className="enhancer-label">Optional Context / Metric hints (e.g. latency, team size)</label>
              <input
                type="text"
                className="enhancer-input"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Scaled to 2M users, cut AWS bill by 25%"
              />
            </div>
          </div>

          <div className="enhancer-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="enhancer-label">Raw / Weak Resume Bullet Point</label>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {inputBullet.length} characters
              </span>
            </div>
            <textarea
              className="enhancer-textarea"
              rows={3}
              value={inputBullet}
              onChange={(e) => setInputBullet(e.target.value)}
              placeholder="Paste any bullet point from your resume here (e.g. Worked on payment microservices and fixed bugs)..."
            />
          </div>

          <div className="enhancer-action-bar">
            <button
              type="button"
              className="enhancer-submit-btn"
              onClick={() => handleEnhance()}
              disabled={loading || !inputBullet.trim()}
            >
              {loading ? (
                <>
                  <span className="enhancer-spinner" />
                  <span>Synthesizing STAR Impact Statements…</span>
                </>
              ) : (
                <>
                  <SparkleIcon width={16} height={16} />
                  <span>Transform into Google XYZ Formula</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diagnostics & Weak Word Auditing */}
        {result && (
          <div className="enhancer-audit-bar">
            <div className="audit-item">
              <span className="audit-title">Weak / Passive Words Detected:</span>
              <div className="audit-tags">
                {result.weakWordsFound && result.weakWordsFound.length > 0 ? (
                  result.weakWordsFound.map((w, idx) => (
                    <span key={idx} className="audit-tag weak">
                      <s>{w}</s>
                    </span>
                  ))
                ) : (
                  <span className="audit-tag clean">None detected (Strong base)</span>
                )}
              </div>
            </div>

            <div className="audit-item">
              <span className="audit-title">High-Power Verbs Suggested:</span>
              <div className="audit-tags">
                {(result.actionVerbsSuggested || ["Architected", "Spearheaded", "Engineered", "Orchestrated"]).map((v, idx) => (
                  <span key={idx} className="audit-tag power">
                    +{v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4 Generated Transformation Variants */}
        {result && result.variants && (
          <div className="enhancer-variants-grid">
            {result.variants.map((v) => (
              <div key={v.id} className="variant-card">
                <div className="variant-card-head">
                  <div className="variant-title-box">
                    <span className="variant-tag">{v.badge}</span>
                    <h3 className="variant-title">{v.title}</h3>
                  </div>

                  <div className="variant-actions">
                    <button
                      type="button"
                      className="variant-tool-btn"
                      onClick={() => handleCopy(v.text, v.id)}
                      title="Copy bullet"
                    >
                      {copiedId === v.id ? (
                        <>
                          <CheckIcon width={13} height={13} style={{ color: "#4ade80" }} />
                          <span style={{ color: "#4ade80" }}>Copied</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon width={13} height={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="variant-tool-btn highlight"
                      onClick={() => handleUseInBuilder(v.text)}
                      title="Send to ATS Resume Builder"
                    >
                      <PrinterIcon width={13} height={13} />
                      <span>Use in Builder</span>
                    </button>
                  </div>
                </div>

                <div className="variant-body">
                  <p className="variant-text">“{v.text}”</p>
                </div>

                {v.critique && (
                  <div className="variant-foot">
                    <span className="critique-icon">💡</span>
                    <span className="critique-text">{v.critique}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
