import { useState, useEffect } from "react";
import { getAtsRuleChecklist } from "../lib/api";
import { CheckCircleIcon, AlertIcon, CloseIcon, SparkleIcon, WandIcon } from "./icons";

export default function AtsRuleChecklistCard({ resume, jobDescription, onApplyFix, currentScore = 80 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appliedFixes, setAppliedFixes] = useState({});
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'fail' | 'warn' | 'pass'

  async function fetchChecklist() {
    if (!resume) return;
    setLoading(true);
    setError("");
    try {
      const res = await getAtsRuleChecklist(resume, jobDescription || "Software Engineer");
      if (res?.success) {
        setData(res);
      }
    } catch (err) {
      setError("Could not run rule checklist: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChecklist();
  }, [resume, jobDescription]);

  function handleFix(rule) {
    if (onApplyFix && rule.autoFixPayload) {
      onApplyFix(rule);
      setAppliedFixes((prev) => ({ ...prev, [rule.id]: true }));
    }
  }

  function handleFixAll() {
    if (!data?.checklist) return;
    const fixableRules = data.checklist.filter((r) => r.status !== "pass" && r.autoFixPayload);
    fixableRules.forEach((rule) => {
      if (onApplyFix) onApplyFix(rule);
      setAppliedFixes((prev) => ({ ...prev, [rule.id]: true }));
    });
  }

  const checklist = data?.checklist || [];
  const filteredList = checklist.filter((item) => {
    if (activeFilter === "all") return true;
    return item.status === activeFilter;
  });

  const readinessPercent = data?.readinessPercent ?? Math.min(100, Math.round(currentScore * 0.95));
  const passCount = data?.passedCount ?? checklist.filter((c) => c.status === "pass").length;
  const warnCount = data?.warnedCount ?? checklist.filter((c) => c.status === "warn").length;
  const failCount = data?.failedCount ?? checklist.filter((c) => c.status === "fail").length;

  return (
    <div
      className="card"
      style={{
        background: "var(--bg-surface, #111420)",
        border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
      }}
    >
      {/* Header & Overall Readiness Score */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "18px",
          marginBottom: "18px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <CheckCircleIcon width={18} height={18} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>
                ATS 10-Point Readiness & Audit Checklist
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "var(--text-muted)" }}>
                Strict corporate ATS rule simulation with interactive 1-click automated remedies
              </p>
            </div>
          </div>
        </div>

        {/* Readiness progress badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)" }}>
              Readiness Score
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: readinessPercent >= 80 ? "#34d399" : readinessPercent >= 60 ? "#fbbf24" : "#f87171",
              }}
            >
              {readinessPercent}%
            </div>
          </div>

          <button
            onClick={handleFixAll}
            type="button"
            className="btn btn--primary"
            style={{
              padding: "8px 16px",
              fontSize: "12.5px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <WandIcon width={14} height={14} />
            <span>Auto-Fix All Gaps</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Filter Pills */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            height: "6px",
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "9999px",
            overflow: "hidden",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${readinessPercent}%`,
              background: readinessPercent >= 80
                ? "linear-gradient(90deg, #10b981, #34d399)"
                : readinessPercent >= 60
                ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                : "linear-gradient(90deg, #ef4444, #f87171)",
              borderRadius: "9999px",
              transition: "width 0.4s ease",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", marginRight: "4px" }}>Filter:</span>
          {[
            { id: "all", label: `All Rules (${checklist.length || 10})` },
            { id: "fail", label: `Critical Fails (${failCount})`, color: "#f87171" },
            { id: "warn", label: `Warnings (${warnCount})`, color: "#fbbf24" },
            { id: "pass", label: `Passed (${passCount})`, color: "#34d399" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: activeFilter === f.id ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.08)",
                background: activeFilter === f.id ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.2)",
                color: f.color || "var(--text-secondary)",
                fontSize: "11.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
          <SparkleIcon width={20} height={20} style={{ animation: "spin 2s linear infinite" }} />
          <p style={{ margin: "8px 0 0", fontSize: "13px" }}>Auditing resume against 10 strict ATS rules...</p>
        </div>
      )}

      {error && <div style={{ color: "#f87171", fontSize: "13px", padding: "10px" }}>{error}</div>}

      {/* Checklist items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredList.map((item) => {
          const isFixed = appliedFixes[item.id];
          const currentStatus = isFixed ? "pass" : item.status;

          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "14px",
                padding: "14px 16px",
                borderRadius: "10px",
                background: isFixed
                  ? "rgba(16, 185, 129, 0.08)"
                  : currentStatus === "pass"
                  ? "rgba(255, 255, 255, 0.02)"
                  : currentStatus === "warn"
                  ? "rgba(245, 158, 11, 0.05)"
                  : "rgba(239, 68, 68, 0.06)",
                border: "1px solid",
                borderColor: isFixed
                  ? "rgba(16, 185, 129, 0.3)"
                  : currentStatus === "pass"
                  ? "rgba(255, 255, 255, 0.06)"
                  : currentStatus === "warn"
                  ? "rgba(245, 158, 11, 0.25)"
                  : "rgba(239, 68, 68, 0.25)",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: 0 }}>
                {/* Status Icon */}
                <div style={{ marginTop: "2px", flexShrink: 0 }}>
                  {currentStatus === "pass" ? (
                    <span style={{ color: "#10b981", display: "flex" }}>
                      <CheckCircleIcon width={18} height={18} />
                    </span>
                  ) : currentStatus === "warn" ? (
                    <span style={{ color: "#f59e0b", display: "flex" }}>
                      <AlertIcon width={18} height={18} />
                    </span>
                  ) : (
                    <span style={{ color: "#ef4444", display: "flex" }}>
                      <CloseIcon width={18} height={18} />
                    </span>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontFamily: "var(--font-mono, monospace)",
                        color: "var(--text-muted)",
                        background: "rgba(255, 255, 255, 0.06)",
                        padding: "1px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      RULE {item.number}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "9999px",
                        textTransform: "uppercase",
                        background:
                          currentStatus === "pass"
                            ? "rgba(16, 185, 129, 0.2)"
                            : currentStatus === "warn"
                            ? "rgba(245, 158, 11, 0.2)"
                            : "rgba(239, 68, 68, 0.2)",
                        color:
                          currentStatus === "pass"
                            ? "#34d399"
                            : currentStatus === "warn"
                            ? "#fbbf24"
                            : "#f87171",
                      }}
                    >
                      {isFixed ? "FIX APPLIED" : currentStatus}
                    </span>
                  </div>

                  <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--text-secondary)" }}>
                    {item.details}
                  </p>

                  {currentStatus !== "pass" && !isFixed && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "#93c5fd",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <strong>Remedy:</strong> {item.fixAdvice}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {currentStatus !== "pass" && !isFixed && item.autoFixPayload && (
                <button
                  type="button"
                  onClick={() => handleFix(item)}
                  style={{
                    padding: "6px 12px",
                    background: "rgba(59, 130, 246, 0.15)",
                    border: "1px solid rgba(59, 130, 246, 0.35)",
                    color: "#93c5fd",
                    borderRadius: "7px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                  title="Apply suggested fix automatically"
                >
                  <WandIcon width={12} height={12} />
                  <span>Apply Fix</span>
                </button>
              )}

              {isFixed && (
                <span
                  style={{
                    fontSize: "11.5px",
                    color: "#34d399",
                    fontWeight: 700,
                    padding: "6px 10px",
                    flexShrink: 0,
                  }}
                >
                  ✓ Optimized
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
