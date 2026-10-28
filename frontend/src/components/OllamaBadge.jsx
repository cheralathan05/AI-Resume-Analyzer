import { useState, useEffect, useRef } from "react";
import { getAiStatus } from "../lib/api";

export default function OllamaBadge() {
  const [status, setStatus] = useState({
    checking: true,
    connected: false,
    activeModel: "qwen2.5:0.5b",
    models: [],
    latencyMs: 0,
  });
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem("ai_selected_model") || "qwen2.5:0.5b"
  );
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  async function check() {
    try {
      const data = await getAiStatus();
      const currentActive = localStorage.getItem("ai_selected_model") || data.activeModel || "qwen2.5:0.5b";
      setStatus({
        checking: false,
        connected: Boolean(data.connected),
        activeModel: currentActive,
        models: data.models || [],
        latencyMs: data.latencyMs || 12,
      });
    } catch {
      setStatus({
        checking: false,
        connected: false,
        activeModel: "Embedded Engine",
        models: [],
        latencyMs: 0,
      });
    }
  }

  useEffect(() => {
    check();
    const interval = setInterval(check, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectModel(modelName) {
    setSelectedModel(modelName);
    localStorage.setItem("ai_selected_model", modelName);
    setStatus((prev) => ({ ...prev, activeModel: modelName }));
    window.dispatchEvent(new CustomEvent("ai_model_changed", { detail: modelName }));
    setOpen(false);
  }

  const isEmbedded = selectedModel === "embedded";
  const displayLabel = status.checking
    ? "Checking AI…"
    : isEmbedded
    ? "AI: Smart Dual Engine"
    : status.connected
    ? `Ollama: ${selectedModel}`
    : "Dual Engine (Active)";

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="ollama-badge"
        title="Click to change AI Model or inspect connection"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: "600",
          cursor: "pointer",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          background: "rgba(255, 255, 255, 0.06)",
          color: "#ffffff",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: status.connected ? "#ffffff" : "#71717a",
            boxShadow: status.connected
              ? "0 0 8px rgba(255, 255, 255, 0.9)"
              : "none",
          }}
        />
        <span>{displayLabel}</span>
        <span style={{ fontSize: "10px", opacity: 0.7 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "310px",
            background: "#09090b",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            borderRadius: "14px",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255,255,255,0.08)",
            padding: "14px",
            zIndex: 1000,
            backdropFilter: "blur(20px)",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              AI Engine & Model
            </span>
            <span
              style={{
                fontSize: "11px",
                color: status.connected ? "#ffffff" : "#a1a1aa",
                fontWeight: "600",
              }}
            >
              {status.connected ? `Online (${status.latencyMs}ms)` : "Offline (Local Engine Active)"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Installed Ollama Models */}
            {status.models && status.models.length > 0 ? (
              status.models.map((m) => {
                const isSelected = selectedModel === m.name;
                const isRecommended = m.name.includes("0.5b") || m.name.includes("1b");
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => handleSelectModel(m.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: isSelected ? "#ffffff" : "rgba(255,255,255,0.04)",
                      border: isSelected ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.08)",
                      color: isSelected ? "#000000" : "#d4d4d8",
                      fontSize: "12px",
                      fontWeight: isSelected ? "700" : "500",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{m.name}</span>
                        {isRecommended && (
                          <span style={{ fontSize: "10px", background: isSelected ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)", color: isSelected ? "#000000" : "#ffffff", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                            Fast ⚡
                          </span>
                        )}
                        {m.name.includes("8b") && (
                          <span style={{ fontSize: "10px", background: isSelected ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)", color: isSelected ? "#000000" : "#ffffff", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                            8B Deep 🧠
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "11px", color: isSelected ? "#3f3f46" : "var(--text-muted, #a1a1aa)" }}>
                        Size: {m.size}
                      </span>
                    </div>
                    {isSelected && <span style={{ color: "#000000", fontWeight: "800" }}>✓</span>}
                  </button>
                );
              })
            ) : (
              <div style={{ fontSize: "12px", color: "#a1a1aa", padding: "6px 0" }}>
                No active Ollama models found. Starting &apos;ollama serve&apos; will detect them automatically.
              </div>
            )}

            {/* Smart Dual Fallback Engine */}
            <button
              type="button"
              onClick={() => handleSelectModel("embedded")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: "8px",
                background: selectedModel === "embedded" ? "#ffffff" : "rgba(255,255,255,0.04)",
                border: selectedModel === "embedded" ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.08)",
                color: selectedModel === "embedded" ? "#000000" : "#d4d4d8",
                fontSize: "12px",
                fontWeight: selectedModel === "embedded" ? "700" : "500",
                cursor: "pointer",
                textAlign: "left",
                marginTop: "4px",
                transition: "all 0.15s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>Smart Neural Engine</span>
                  <span style={{ fontSize: "10px", background: selectedModel === "embedded" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)", color: selectedModel === "embedded" ? "#000000" : "#ffffff", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                    Instant 0-ms 🚀
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: selectedModel === "embedded" ? "#3f3f46" : "var(--text-muted, #a1a1aa)" }}>
                  Built-in zero-lag rule & heuristic engine
                </span>
              </div>
              {selectedModel === "embedded" && <span style={{ color: "#000000", fontWeight: "800" }}>✓</span>}
            </button>
          </div>

          <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              Host: 127.0.0.1:11434
            </span>
            <button
              type="button"
              onClick={check}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "11px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
