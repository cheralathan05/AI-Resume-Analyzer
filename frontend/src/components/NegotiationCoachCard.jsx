import { useState, useEffect } from "react";
import { getNegotiationCoach } from "../lib/api";
import { DollarIcon, CopyIcon, SparkleIcon, ShieldCheckIcon, CheckCircleIcon } from "./icons";

export default function NegotiationCoachCard({ defaultRole = "Senior Full-Stack Engineer", defaultLocation = "Remote / US" }) {
  const [role, setRole] = useState(defaultRole);
  const [location, setLocation] = useState(defaultLocation);
  const [currentOffer, setCurrentOffer] = useState("145000");
  const [targetSalary, setTargetSalary] = useState("175000");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeScriptTab, setActiveScriptTab] = useState("base_bump");
  const [copiedId, setCopiedId] = useState(null);

  async function handleGenerate(e) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await getNegotiationCoach({
        role,
        location,
        currentOffer,
        targetSalary,
      });
      if (res?.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Negotiation coach error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleGenerate();
  }, []);

  function handleCopy(id, text) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const activeScript = data?.scripts?.find((s) => s.id === activeScriptTab) || data?.scripts?.[0];

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
      {/* Header */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
            }}
          >
            <DollarIcon width={20} height={20} />
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>
              AI Salary & Offer Negotiation Coach
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "var(--text-muted)" }}>
              Data-backed counter-offer strategies, word-for-word email scripts & telephone defense
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: "6px",
            background: "rgba(245, 158, 11, 0.15)",
            color: "#fbbf24",
            border: "1px solid rgba(245, 158, 11, 0.3)",
          }}
        >
          High-Leverage Strategy
        </span>
      </div>

      {/* Input controls */}
      <form
        onSubmit={handleGenerate}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) 120px",
          gap: "12px",
          alignItems: "end",
          background: "rgba(0, 0, 0, 0.25)",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          marginBottom: "20px",
        }}
      >
        <div>
          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
            Target Role Title
          </label>
          <input
            type="text"
            className="auth-input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
          />
        </div>

        <div>
          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
            Job Location
          </label>
          <input
            type="text"
            className="auth-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Remote / San Francisco"
          />
        </div>

        <div>
          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
            Current Offer ($/yr)
          </label>
          <input
            type="number"
            className="auth-input"
            value={currentOffer}
            onChange={(e) => setCurrentOffer(e.target.value)}
            placeholder="145000"
          />
        </div>

        <div>
          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
            Desired Target ($/yr)
          </label>
          <input
            type="number"
            className="auth-input"
            value={targetSalary}
            onChange={(e) => setTargetSalary(e.target.value)}
            placeholder="175000"
          />
        </div>

        <button
          type="submit"
          className="btn btn--primary"
          disabled={loading}
          style={{
            height: "40px",
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "12.5px",
          }}
        >
          {loading ? "Calculating..." : "Analyze"}
        </button>
      </form>

      {/* Percentiles & Counter Delta Cards */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>25th Percentile</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
              {data.percentiles?.p25}
            </div>
          </div>

          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>50th (Median)</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#60a5fa", marginTop: "2px" }}>
              {data.percentiles?.p50}
            </div>
          </div>

          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 700 }}>75th (Counter Target)</div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "#fbbf24", marginTop: "2px" }}>
              {data.percentiles?.p75}
            </div>
          </div>

          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>90th Percentile</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#a855f7", marginTop: "2px" }}>
              {data.percentiles?.p90}
            </div>
          </div>

          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "11px", color: "#6ee7b7", fontWeight: 700 }}>Recommended Counter</div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "#34d399", marginTop: "2px" }}>
              +${data.counterDelta?.toLocaleString()} (+{data.counterPercent}%)
            </div>
          </div>
        </div>
      )}

      {/* Word-for-Word Negotiation Scripts */}
      {data?.scripts && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
            {data.scripts.map((script) => (
              <button
                key={script.id}
                type="button"
                onClick={() => setActiveScriptTab(script.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: activeScriptTab === script.id ? "#3b82f6" : "rgba(255, 255, 255, 0.08)",
                  background: activeScriptTab === script.id ? "rgba(59, 130, 246, 0.15)" : "rgba(0, 0, 0, 0.2)",
                  color: activeScriptTab === script.id ? "#ffffff" : "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {script.title.split("(")[0]}
              </button>
            ))}
          </div>

          {activeScript && (
            <div
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {activeScript.title}
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    {activeScript.scenario}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(activeScript.id, activeScript.script)}
                  style={{
                    padding: "6px 12px",
                    background: copiedId === activeScript.id ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.08)",
                    border: "1px solid",
                    borderColor: copiedId === activeScript.id ? "#10b981" : "rgba(255, 255, 255, 0.18)",
                    color: copiedId === activeScript.id ? "#6ee7b7" : "#ffffff",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CopyIcon width={13} height={13} />
                  <span>{copiedId === activeScript.id ? "Copied Script!" : "Copy Script"}</span>
                </button>
              </div>

              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  color: "var(--text-primary)",
                  background: "rgba(255, 255, 255, 0.02)",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                {activeScript.script}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Golden Rules & Traps */}
      {data?.goldenRules && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.04)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            <h4
              style={{
                margin: "0 0 12px",
                fontSize: "13.5px",
                fontWeight: 700,
                color: "#34d399",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <CheckCircleIcon width={16} height={16} /> 5 Golden Rules of Negotiation
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {data.goldenRules.map((gr, idx) => (
                <div key={idx} style={{ fontSize: "12.5px" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{gr.rule}: </span>
                  <span style={{ color: "var(--text-muted)" }}>{gr.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.04)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <h4
              style={{
                margin: "0 0 12px",
                fontSize: "13.5px",
                fontWeight: 700,
                color: "#f87171",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <ShieldCheckIcon width={16} height={16} /> Traps to Avoid
            </h4>
            <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.trapsToAvoid?.map((trap, idx) => (
                <li key={idx} style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                  {trap}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
