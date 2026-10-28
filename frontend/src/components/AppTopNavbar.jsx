import { useLocation, Link } from "react-router-dom";
import useTheme from "../hooks/useTheme";
import ThemeToggle from "./ThemeToggle";
import OllamaBadge from "./OllamaBadge";
import UserProfileButton from "./UserProfileButton";
import {
  MenuIcon,
  SearchIcon,
  CheckIcon,
  TerminalIcon,
} from "./icons";
import "../styles/MonolithLayout.css";

const ROUTE_LABELS = {
  "/dashboard": "Executive Dashboard",
  "/upload": "ATS Resume Scanner",
  "/jobs": "Opportunity Radar & Matcher",
  "/cover-letter": "AI Cover Letter & Outreach Studio",
  "/enhancer": "STAR Bullet Point Rewriter",
  "/checklist": "System Architecture & Verification",
  "/portfolio": "AI Portfolio Site Generator",
  "/builder": "ATS Resume Visual Builder",
  "/interview": "Voice AI Mock Interview Studio",
  "/linkedin": "LinkedIn & GitHub Profile Studio",
  "/salary": "Salary Benchmark & Negotiation Coach",
  "/diff": "Resume Diff & Score Optimizer",
  "/history": "Database Vault & Records",
  "/terminal": "Developer Diagnostic Shell",
  "/loading": "Analysis Engine",
};

export default function AppTopNavbar({ onToggleMobile, onToggleCollapse, isCollapsed }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const path = location.pathname;
  const currentTitle = ROUTE_LABELS[path] || "Workspace";

  function handleOpenCmd() {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }

  function handleOpenChecklist() {
    window.dispatchEvent(new CustomEvent("open-checklist-modal"));
  }

  function handleOpenTerminal() {
    window.dispatchEvent(new CustomEvent("open-terminal-drawer"));
  }

  return (
    <header className="monolith-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onToggleMobile}
          title="Toggle Navigation Menu"
        >
          <MenuIcon width={16} height={16} />
        </button>

        <div className="topbar-breadcrumbs">
          <span className="topbar-crumb-root">ResumeAI</span>
          <span className="topbar-crumb-sep">/</span>
          <span className="topbar-crumb-active">{currentTitle}</span>
        </div>

        {/* Global Quick Search Button */}
        <button
          type="button"
          onClick={handleOpenCmd}
          className="cmd-palette-trigger-btn"
          style={{ marginLeft: "8px" }}
          title="Quick Action Command Palette (Cmd+K / Ctrl+K)"
        >
          <SearchIcon width={13} height={13} />
          <span>Quick Find</span>
          <span className="cmd-palette-trigger-badge">⌘K</span>
        </button>
      </div>

      <div className="topbar-right">
        {/* Ollama local status */}
        <OllamaBadge />

        {/* Live Backend & DB Telemetry */}
        <div className="topbar-telemetry-badge" title="Live Backend & Embedded Database Telemetry">
          <span className="sidebar-status-dot" />
          <span>Monolith 5001 ● DB Active</span>
        </div>

        {/* 1-Click Interactive Checklist Page Trigger */}
        <Link
          to="/checklist"
          className="topbar-action-btn checklist"
          title="Open System Architecture & 18-Point Feature Checklist"
        >
          <CheckIcon width={14} height={14} />
          <span>Checklist</span>
        </Link>

        {/* Quick CLI Trigger */}
        <button
          type="button"
          onClick={handleOpenTerminal}
          className="topbar-action-btn"
          title="Open Floating Developer Terminal (Ctrl + `)"
        >
          <TerminalIcon width={13} height={13} />
          <span>CLI</span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle theme={theme} onToggle={toggleTheme} />

        {/* User Account / Persona Dropdown */}
        <UserProfileButton />
      </div>
    </header>
  );
}
