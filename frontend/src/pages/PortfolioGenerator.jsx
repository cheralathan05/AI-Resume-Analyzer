import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useResume } from "../context/ResumeContext";
import { generatePortfolioWebsite } from "../lib/api";
import {
  CodeIcon,
  SparkleIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  WandIcon,
  ExternalLinkIcon,
  PrinterIcon,
} from "../components/icons";

export default function PortfolioGenerator() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { activeResume } = useResume();

  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("obsidian"); // 'obsidian' | 'cyber' | 'executive' | 'emerald'
  const [deviceFrame, setDeviceFrame] = useState("desktop"); // 'desktop' | 'tablet' | 'mobile'
  const [portfolioData, setPortfolioData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    generatePortfolioWebsite({ resume: activeResume, theme })
      .then((res) => {
        if (isMounted && res?.success) {
          setPortfolioData(res);
        }
      })
      .catch((err) => {
        console.error("Failed to generate portfolio:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [theme, activeResume]);

  function handleDownloadHtml() {
    if (!portfolioData?.generatedHtml) return;
    const blob = new Blob([portfolioData.generatedHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(portfolioData.candidateName || "portfolio").toLowerCase().replace(/\s+/g, "-")}-portfolio.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      title: "Portfolio Downloaded",
      message: "Standalone single-file HTML generated. Ready to host on GitHub Pages or Vercel!",
      type: "success",
    });
  }

  async function handleCopyHtml() {
    if (!portfolioData?.generatedHtml) return;
    try {
      await navigator.clipboard.writeText(portfolioData.generatedHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast({
        title: "HTML Copied to Clipboard",
        message: "Clean, self-contained HTML & CSS copied. Paste directly into your project or code editor.",
        type: "success",
      });
    } catch {
      showToast({
        title: "Copy Failed",
        message: "Could not access clipboard.",
        type: "error",
      });
    }
  }

  function handleOpenFullscreen() {
    if (!portfolioData?.generatedHtml) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(portfolioData.generatedHtml);
      win.document.close();
    }
  }

  const frameWidth =
    deviceFrame === "mobile" ? "390px" : deviceFrame === "tablet" ? "768px" : "100%";

  return (
    <AppLayout>
      <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "60px" }}>
        {/* Header Hero */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "9999px",
              background: "rgba(168, 85, 247, 0.12)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              color: "#c084fc",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            <SparkleIcon width={14} height={14} />
            <span>AI Developer Portfolio & Personal Brand Studio</span>
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
            Instant Developer & Executive Portfolio Generator
          </h1>
          <p
            style={{
              fontSize: "14.5px",
              color: "var(--text-muted)",
              maxWidth: "800px",
              lineHeight: 1.6,
            }}
          >
            Synthesizes your analyzed resume, technical mastery, and career highlights into an ultra-modern, responsive personal website. 1-click download as a standalone single-file HTML page ready to deploy anywhere with zero dependencies.
          </p>
        </div>

        {/* Toolbar: Theme Switcher, Device Frame & Export Actions */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          {/* Theme Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Theme Style:</span>
            {[
              { id: "obsidian", label: "Obsidian Titanium", color: "#ffffff" },
              { id: "cyber", label: "Cyber Matrix", color: "#38bdf8" },
              { id: "executive", label: "Executive Slate", color: "#818cf8" },
              { id: "emerald", label: "Emerald Modern", color: "#34d399" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                style={{
                  fontSize: "11.5px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: theme === t.id ? t.color : "rgba(255, 255, 255, 0.1)",
                  background: theme === t.id ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  color: theme === t.id ? "#ffffff" : "#a1a1aa",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.color }} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Device Responsive Frame Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Device View:</span>
            {[
              { id: "desktop", label: "Desktop" },
              { id: "tablet", label: "Tablet" },
              { id: "mobile", label: "Mobile" },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDeviceFrame(d.id)}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: deviceFrame === d.id ? "#ffffff" : "rgba(255, 255, 255, 0.08)",
                  background: deviceFrame === d.id ? "#ffffff" : "rgba(255, 255, 255, 0.02)",
                  color: deviceFrame === d.id ? "#000000" : "#a1a1aa",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Export Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleCopyHtml}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                padding: "8px 14px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                color: "#ffffff",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {copied ? <CheckIcon width={14} height={14} style={{ color: "#4ade80" }} /> : <CopyIcon width={14} height={14} />}
              <span>{copied ? "Copied!" : "Copy HTML"}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenFullscreen}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                padding: "8px 14px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                color: "#ffffff",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>Live Preview ↗</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "8px 16px",
                borderRadius: "8px",
                background: "#ffffff",
                border: "none",
                color: "#000000",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 16px rgba(255, 255, 255, 0.2)",
              }}
            >
              <DownloadIcon width={14} height={14} />
              <span>Download index.html</span>
            </button>
          </div>
        </div>

        {/* Live Preview Container */}
        <div
          style={{
            background: "#090a0f",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.8)",
          }}
        >
          {/* Simulated Browser Frame Bar */}
          <div
            style={{
              width: "100%",
              height: "40px",
              background: "#12131a",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                padding: "3px 18px",
                fontSize: "11px",
                color: "#9ca3af",
                fontFamily: "monospace",
              }}
            >
              https://{(portfolioData?.candidateName || "cheralathan").toLowerCase().replace(/\s+/g, "")}.dev
            </div>

            <div style={{ fontSize: "11px", color: "#4ade80", fontWeight: 600 }}>
              ● Live Sandbox
            </div>
          </div>

          {/* Simulated Screen Body */}
          <div
            style={{
              width: "100%",
              minHeight: "780px",
              display: "flex",
              justifyContent: "center",
              background: "#000000",
              padding: deviceFrame === "desktop" ? "0" : "24px 0",
              transition: "all 0.3s ease",
            }}
          >
            {loading ? (
              <div style={{ padding: "120px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>Synthesizing personal portfolio site from parsed resume...</div>
              </div>
            ) : portfolioData?.generatedHtml ? (
              <div
                style={{
                  width: frameWidth,
                  height: "780px",
                  borderRadius: deviceFrame === "desktop" ? "0" : "16px",
                  border: deviceFrame === "desktop" ? "none" : "2px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: deviceFrame === "desktop" ? "none" : "0 20px 50px rgba(0,0,0,0.9)",
                  overflow: "hidden",
                  transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <iframe
                  title="Portfolio Live Preview"
                  srcDoc={portfolioData.generatedHtml}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    background: "#090a0f",
                  }}
                  sandbox="allow-scripts"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
