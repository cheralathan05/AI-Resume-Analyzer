import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CommandPalette.css";
import {
  SearchIcon,
  TerminalIcon,
  SparkleIcon,
  UploadIcon,
  GaugeIcon,
  LayersIcon,
  MicIcon,
  DocumentIcon,
  SunIcon,
  MoonIcon,
  DownloadIcon,
  ShieldCheckIcon,
  BrainIcon,
  PrinterIcon,
  BriefcaseIcon,
  CodeIcon,
  MailIcon,
  ZapIcon,
  CheckIcon,
  GitCompareIcon,
  DollarIcon,
} from "./icons";
import { getAiStatus, getSampleResumesAndJobs, seedSampleDatabaseHistory, exportDatabaseBackup } from "../lib/api";
import { playKeyClick, playEnterSound } from "../lib/soundFx";

export default function CommandPalette({ isOpen, onClose, onOpenTerminal }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keyboard shortcuts: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          window.dispatchEvent(new CustomEvent("open-command-palette"));
        }
      }
      if (isOpen && e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Command registry
  const commands = [
    // Terminal & Developer Tools
    {
      id: "term-open",
      title: "Open Interactive Developer Terminal",
      subtitle: "Launch interactive CLI shell (~ / resume-cli $)",
      category: "Developer Tools",
      shortcut: "Ctrl + `",
      icon: <TerminalIcon width={16} height={16} />,
      action: () => {
        onClose();
        if (onOpenTerminal) onOpenTerminal();
      },
    },
    {
      id: "term-page",
      title: "Dedicated Terminal Studio (/terminal)",
      subtitle: "Open full-screen developer terminal with live metrics",
      category: "Developer Tools",
      shortcut: "G T",
      icon: <TerminalIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/terminal");
      },
    },
    {
      id: "builder-page",
      title: "ATS Resume Builder & PDF Exporter (/builder)",
      subtitle: "Live visual resume editor with Modern, Executive & Tech PDF export",
      category: "Developer Tools",
      shortcut: "G B",
      icon: <PrinterIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/builder");
      },
    },
    {
      id: "ollama-probe",
      title: "Probe Ollama AI & Model Status",
      subtitle: "Ping local LLM engine for connectivity and response latency",
      category: "Developer Tools",
      shortcut: "AI",
      icon: <BrainIcon width={16} height={16} />,
      action: async () => {
        onClose();
        try {
          const status = await getAiStatus();
          alert(`Ollama Connection: ${status.connected ? "CONNECTED (Online)" : "OFFLINE"}\nHost: ${status.host}\nActive Model: ${status.activeModel || "None"}\nAvailable: ${(status.models || []).join(", ") || "None"}`);
        } catch (e) {
          alert(`Failed to reach Ollama backend: ${e.message}`);
        }
      },
    },

    // Navigation
    {
      id: "nav-jobs",
      title: "Live Opportunity Radar & Smart Matcher (/jobs)",
      subtitle: "Verified Staff, Lead & Senior openings with live ATS gap matching",
      category: "Navigation",
      shortcut: "G J",
      icon: <BriefcaseIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/jobs");
      },
    },
    {
      id: "nav-portfolio",
      title: "AI Personal Portfolio Site Generator (/portfolio)",
      subtitle: "Build responsive personal developer site with 1-click HTML export",
      category: "Navigation",
      shortcut: "G P",
      icon: <CodeIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/portfolio");
      },
    },
    {
      id: "nav-cover-letter",
      title: "AI Cover Letter & Outreach Studio (/cover-letter)",
      subtitle: "Generate tailored executive cover letters, cold DMs & follow-ups",
      category: "Navigation",
      shortcut: "G C",
      icon: <MailIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/cover-letter");
      },
    },
    {
      id: "nav-enhancer",
      title: "Google XYZ & STAR Bullet Rewriter (/enhancer)",
      subtitle: "Transform weak bullets into measurable impact statements",
      category: "Navigation",
      shortcut: "G E",
      icon: <ZapIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/enhancer");
      },
    },
    {
      id: "nav-diff",
      title: "Side-by-Side Resume Diff & Score Optimizer (/diff)",
      subtitle: "Inspect keywords injected, weak verbs upgraded, and ATS score delta",
      category: "Navigation",
      shortcut: "G D",
      icon: <GitCompareIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/diff");
      },
    },
    {
      id: "nav-linkedin",
      title: "LinkedIn & GitHub Profile Architect Studio (/linkedin)",
      subtitle: "Generate viral headline hooks, executive story summary, and GitHub README",
      category: "Navigation",
      shortcut: "G L",
      icon: <SparkleIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/linkedin");
      },
    },
    {
      id: "nav-salary",
      title: "Salary Benchmark & Offer Negotiation Coach (/salary)",
      subtitle: "Explore market percentiles and generate counter-offer email scripts",
      category: "Navigation",
      shortcut: "G $",
      icon: <DollarIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/salary");
      },
    },
    {
      id: "nav-checklist",
      title: "System Architecture & 21-Point Checklist (/checklist)",
      subtitle: "Live end-to-end telemetry and automated health test suite",
      category: "Navigation",
      shortcut: "G S",
      icon: <CheckIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/checklist");
      },
    },
    {
      id: "nav-interview",
      title: "Launch Voice AI Mock Interviewer",
      subtitle: "Live audio simulation with microphone speech input and STAR grading",
      category: "Navigation",
      shortcut: "G I",
      icon: <MicIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/interview");
      },
    },
    {
      id: "nav-upload",
      title: "Upload New Resume",
      subtitle: "Parse PDF or paste raw resume text for algorithmic ATS scan",
      category: "Navigation",
      shortcut: "G U",
      icon: <UploadIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/upload");
      },
    },
    {
      id: "nav-dashboard",
      title: "Results & ATS Analytics Dashboard",
      subtitle: "View keyword match, STAR studio, cover letters & market fit",
      category: "Navigation",
      shortcut: "G D",
      icon: <GaugeIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/dashboard");
      },
    },
    {
      id: "nav-history",
      title: "Saved Database Vault & Scan History",
      subtitle: "Browse all saved analyses, tailored resumes and mock interviews",
      category: "Navigation",
      shortcut: "G H",
      icon: <LayersIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/history");
      },
    },
    {
      id: "nav-home",
      title: "Return to Home Page",
      subtitle: "Back to overview and feature index",
      category: "Navigation",
      shortcut: "G /",
      icon: <SparkleIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/");
      },
    },

    // Quick Actions & Demos
    {
      id: "sample-cheralathan",
      title: "Load Demo Candidate: Cheralathan B.N",
      subtitle: "Full-Stack & GenAI Engineer (React, Node.js, Spring Boot, Python)",
      category: "1-Click Demos",
      shortcut: "DEMO 1",
      icon: <DocumentIcon width={16} height={16} />,
      action: async () => {
        onClose();
        try {
          const res = await getSampleResumesAndJobs();
          const sample = res?.resumes?.find((r) => r.id === "demo-cheralathan") || res?.resumes?.[0];
          const job = res?.jobs?.[0];
          if (sample) {
            navigate("/dashboard", {
              state: {
                resume: sample.data,
                jobDescription: job?.description || "Senior Full Stack Engineer with React, Node.js and AI APIs",
                fileName: "Cheralathan_BN_Resume.pdf",
              },
            });
          }
        } catch (e) {
          navigate("/dashboard");
        }
      },
    },
    {
      id: "sample-jane",
      title: "Load Demo Candidate: Jane Doe",
      subtitle: "Senior Python Backend Engineer (FastAPI, PostgreSQL, Docker, AWS)",
      category: "1-Click Demos",
      shortcut: "DEMO 2",
      icon: <DocumentIcon width={16} height={16} />,
      action: async () => {
        onClose();
        try {
          const res = await getSampleResumesAndJobs();
          const sample = res?.resumes?.find((r) => r.id === "demo-jane") || res?.resumes?.[1];
          const job = res?.jobs?.[1] || res?.jobs?.[0];
          if (sample) {
            navigate("/dashboard", {
              state: {
                resume: sample.data,
                jobDescription: job?.description || "Senior Backend Engineer with Python, FastAPI, and Kubernetes",
                fileName: "Jane_Doe_Backend_Resume.pdf",
              },
            });
          }
        } catch (e) {
          navigate("/dashboard");
        }
      },
    },
    {
      id: "seed-db",
      title: "Seed Sample Database History",
      subtitle: "Populate embedded database with realistic scans & interview prep",
      category: "System Actions",
      shortcut: "SEED",
      icon: <ShieldCheckIcon width={16} height={16} />,
      action: async () => {
        onClose();
        try {
          await seedSampleDatabaseHistory();
          navigate("/history");
        } catch (e) {
          alert(`Failed to seed database: ${e.message}`);
        }
      },
    },
    {
      id: "export-db",
      title: "Export Database Backup JSON",
      subtitle: "Download entire embedded database vault to a JSON file",
      category: "System Actions",
      shortcut: "EXPORT",
      icon: <DownloadIcon width={16} height={16} />,
      action: async () => {
        onClose();
        try {
          const backup = await exportDatabaseBackup();
          const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `resume-analyzer-backup-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (e) {
          alert(`Backup failed: ${e.message}`);
        }
      },
    },

    // Career Intelligence Studio
    {
      id: "ai-trajectory",
      title: "AI Career Trajectory & Promotion Velocity Forecaster",
      subtitle: "Predict 1, 3, 5-year milestones, salary trajectory, and promotion unlocks",
      category: "Career Intelligence",
      shortcut: "TRAJECTORY",
      icon: <SparkleIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/dashboard", { state: { targetTab: "trajectory" } });
      },
    },
    {
      id: "ai-star",
      title: "AI STAR Behavioral Story Bank & Conflict Matrix",
      subtitle: "Synthesize 5 FAANG-grade STAR stories for architecture conflicts & outages",
      category: "Career Intelligence",
      shortcut: "STAR",
      icon: <BrainIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/dashboard", { state: { targetTab: "starstories" } });
      },
    },
    {
      id: "ai-debias",
      title: "AI Resume De-Biasing & Blind Screening Audit",
      subtitle: "Scan for postal code, ageism, and linguistic bias markers",
      category: "Career Intelligence",
      shortcut: "DEBIAS",
      icon: <ShieldCheckIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/dashboard", { state: { targetTab: "debias" } });
      },
    },
    {
      id: "ai-bios",
      title: "AI Executive Persona & Multi-Channel Bio Studio",
      subtitle: "Generate phone elevator pitch, LinkedIn narrative, and investor pitch",
      category: "Career Intelligence",
      shortcut: "BIOS",
      icon: <DocumentIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/dashboard", { state: { targetTab: "bios" } });
      },
    },
    {
      id: "ai-sprint",
      title: "AI 7-Day High-Stakes Interview Bootcamp Sprint",
      subtitle: "Day-by-day technical drills and reverse questions for hiring managers",
      category: "Career Intelligence",
      shortcut: "SPRINT",
      icon: <SparkleIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/dashboard", { state: { targetTab: "sprint" } });
      },
    },
    {
      id: "ai-localize",
      title: "AI Resume Localization & Global Market Adapter",
      subtitle: "Adapt resume for US, UK/EU, UAE, and APAC recruitment standards",
      category: "Career Intelligence",
      shortcut: "LOCALIZE",
      icon: <DocumentIcon width={16} height={16} />,
      action: () => {
        onClose();
        navigate("/dashboard", { state: { targetTab: "localization" } });
      },
    },

    {
      id: "theme-toggle",
      title: "Toggle Obsidian / Charcoal Theme",
      subtitle: "Switch luminance profile between dark and charcoal",
      category: "Preferences",
      shortcut: "THEME",
      icon: <SunIcon width={16} height={16} />,
      action: () => {
        onClose();
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const next = current === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
      },
    },
  ];


  // Fuzzy filter
  const filteredCommands = commands.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.subtitle.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.shortcut && c.shortcut.toLowerCase().includes(q))
    );
  });

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands.length, selectedIndex]);

  // Handle keydown navigation within modal
  function handleInputKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      playKeyClick();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      playKeyClick();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      playEnterSound();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        selected.action();
      }
    }
  }

  // Scroll active item into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const activeEl = listEl.querySelector(".cmd-item.active");
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group items by category
  const categories = [];
  filteredCommands.forEach((cmd) => {
    if (!categories.includes(cmd.category)) {
      categories.push(cmd.category);
    }
  });

  let flatCounter = 0;

  return (
    <div className="cmd-palette-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cmd-palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-palette-header">
          <SearchIcon className="cmd-palette-search-icon" width={18} height={18} />
          <input
            ref={inputRef}
            className="cmd-palette-input"
            placeholder="Type a command, tool, or press ↑↓ to navigate..."
            value={query}
            onChange={(e) => {
              playKeyClick();
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
          />
          <span className="cmd-palette-esc-badge" onClick={onClose}>
            ESC
          </span>
        </div>

        <div className="cmd-palette-list" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="cmd-palette-empty">No commands or tools matching &ldquo;{query}&rdquo;</div>
          ) : (
            categories.map((cat) => {
              const items = filteredCommands.filter((c) => c.category === cat);
              if (items.length === 0) return null;

              return (
                <div key={cat} className="cmd-group">
                  <div className="cmd-group-label">{cat}</div>
                  {items.map((item) => {
                    const currentIndex = flatCounter++;
                    const isActive = currentIndex === selectedIndex;

                    return (
                      <div
                        key={item.id}
                        className={`cmd-item ${isActive ? "active" : ""}`}
                        onClick={() => {
                          playEnterSound();
                          item.action();
                        }}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <div className="cmd-item-left">
                          <div className="cmd-item-icon">{item.icon}</div>
                          <div className="cmd-item-content">
                            <span className="cmd-item-title">{item.title}</span>
                            <span className="cmd-item-subtitle">{item.subtitle}</span>
                          </div>
                        </div>
                        {item.shortcut && <span className="cmd-item-shortcut">{item.shortcut}</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="cmd-palette-footer">
          <div className="cmd-footer-keys">
            <span className="cmd-key-hint">
              <kbd>↑</kbd> <kbd>↓</kbd> navigate
            </span>
            <span className="cmd-key-hint">
              <kbd>↵</kbd> select
            </span>
            <span className="cmd-key-hint">
              <kbd>esc</kbd> close
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>ResumeAI Developer Palette</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ fontFamily: "var(--font-mono, monospace)" }}>v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
