import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import ResumeTerminal from "../components/ResumeTerminal";
import "../styles/ui.css";
import "../styles/Terminal.css";
import {
  TerminalIcon,
  SparkleIcon,
  KeyboardIcon,
  BrainIcon,
  ShieldCheckIcon,
  GaugeIcon,
} from "../components/icons";
import { getAiStatus } from "../lib/api";

export default function DeveloperTerminal() {
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    getAiStatus()
      .then(setAiStatus)
      .catch(() => {});
  }, []);

  return (
    <AppLayout>
      <div className="term-page-wrapper">
        {/* Terminal Studio Header Banner */}
        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                }}
              >
                <TerminalIcon width={16} height={16} style={{ color: "#ffffff" }} />
              </span>
              <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                ResumeAI Developer Terminal & Diagnostic Shell
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
              Direct algorithmic command center for live ATS auditing, STAR rewrites, salary forecasting, and Ollama probe.
            </p>
          </div>

          {/* Status Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "12px",
                color: "#e4e4e7",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: aiStatus?.connected ? "#4ade80" : "#fbbf24",
                  boxShadow: aiStatus?.connected ? "0 0 10px #4ade80" : "none",
                }}
              />
              <span>{aiStatus?.connected ? "Ollama Online" : "Heuristic Active"}</span>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "12px",
                color: "#a1a1aa",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              <KeyboardIcon width={13} height={13} />
              <span>⌘K / Ctrl+K Palette</span>
            </div>
          </div>
        </div>

        {/* Embedded Terminal Container */}
        <div className="term-page-container">
          <ResumeTerminal isDrawer={false} />
        </div>

        {/* Quick Reference Grid Below */}
        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            marginTop: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "14px",
          }}
        >
          <div
            style={{
              padding: "16px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", color: "#ffffff", fontSize: "13px", fontWeight: 600 }}>
              <GaugeIcon width={16} height={16} />
              <span>ATS & Audit Commands</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "var(--font-mono, monospace)" }}>
              • <code>scan [role]</code> — Test score<br />
              • <code>audit</code> — 12-point health check<br />
              • <code>skills [query]</code> — Coverage test
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", color: "#ffffff", fontSize: "13px", fontWeight: 600 }}>
              <BrainIcon width={16} height={16} />
              <span>AI & Interview Commands</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "var(--font-mono, monospace)" }}>
              • <code>interview [role]</code> — Drill question<br />
              • <code>grade &lt;answer&gt;</code> — Rubric grade<br />
              • <code>tailor &lt;bullet&gt;</code> — STAR rewrite
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", color: "#ffffff", fontSize: "13px", fontWeight: 600 }}>
              <ShieldCheckIcon width={16} height={16} />
              <span>System & Diagnostics</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "var(--font-mono, monospace)" }}>
              • <code>status</code> — Ping server & LLM<br />
              • <code>models</code> — Check registry<br />
              • <code>theme &lt;matrix&gt;</code> — Visual mode
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
