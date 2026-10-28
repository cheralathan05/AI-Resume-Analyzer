import { Link, useLocation } from "react-router-dom";
import "../styles/ui.css";
import useTheme from "../hooks/useTheme";
import ThemeToggle from "./ThemeToggle";
import Button from "./Button";
import OllamaBadge from "./OllamaBadge";
import UserProfileButton from "./UserProfileButton";
import {
  SparkleIcon,
  HomeIcon,
  LayersIcon,
  UploadIcon,
  MicIcon,
  TerminalIcon,
  SearchIcon,
  PrinterIcon,
  GaugeIcon,
  CheckIcon,
  BriefcaseIcon,
  CodeIcon,
  MenuIcon,
} from "./icons";

/*
 * Shared monolithic navigation header for all app pages.
 */
function AppHeader({ showHome = true }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const currentPath = location.pathname;

  function triggerCmdPalette() {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }

  function triggerChecklist() {
    window.dispatchEvent(new CustomEvent("open-checklist-modal"));
  }

  function triggerSidebar() {
    window.dispatchEvent(new CustomEvent("open-sidebar-drawer"));
  }

  function isActive(path) {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  }

  return (
    <header className="app-header">
      <div className="app-header__inner container">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Sidebar drawer toggle button */}
          <button
            type="button"
            onClick={triggerSidebar}
            className="btn btn--secondary"
            style={{ padding: "6px 9px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px" }}
            title="Toggle Monolithic Navigation Sidebar"
          >
            <MenuIcon width={15} height={15} />
          </button>

          <Link className="app-header__brand" to="/">
            <span className="app-header__logo">
              <SparkleIcon width={18} height={18} />
            </span>
            ResumeAI
          </Link>
          <OllamaBadge />

          {/* Quick Command Palette trigger in brand area */}
          <button
            onClick={triggerCmdPalette}
            className="cmd-palette-trigger-btn"
            title="Search commands, tools, and actions (Cmd+K / Ctrl+K)"
          >
            <SearchIcon width={13} height={13} />
            <span>Search</span>
            <span className="cmd-palette-trigger-badge">⌘K</span>
          </button>
        </div>

        <nav className="app-header__actions" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Main Studio Dashboard Link */}
          <Button
            as={Link}
            to="/dashboard"
            variant={isActive("/dashboard") ? "primary" : "secondary"}
            icon={<GaugeIcon width={14} height={14} />}
            style={{
              fontSize: "12.5px",
              padding: "6px 11px",
              boxShadow: isActive("/dashboard") ? "0 0 12px rgba(255, 255, 255, 0.25)" : "none",
            }}
          >
            Dashboard
          </Button>

          <Button
            as={Link}
            to="/upload"
            variant={isActive("/upload") ? "primary" : "secondary"}
            icon={<UploadIcon width={14} height={14} />}
            style={{ fontSize: "12.5px", padding: "6px 11px" }}
          >
            Upload
          </Button>

          <Button
            as={Link}
            to="/jobs"
            variant={isActive("/jobs") ? "primary" : "secondary"}
            icon={<BriefcaseIcon width={14} height={14} />}
            style={{
              fontSize: "12.5px",
              padding: "6px 11px",
              borderColor: isActive("/jobs") ? "#38bdf8" : "rgba(56, 189, 248, 0.3)",
            }}
          >
            Job Radar
          </Button>

          <Button
            as={Link}
            to="/portfolio"
            variant={isActive("/portfolio") ? "primary" : "secondary"}
            icon={<CodeIcon width={14} height={14} />}
            style={{
              fontSize: "12.5px",
              padding: "6px 11px",
              borderColor: isActive("/portfolio") ? "#c084fc" : "rgba(168, 85, 247, 0.3)",
            }}
          >
            Portfolio
          </Button>

          <Button
            as={Link}
            to="/builder"
            variant={isActive("/builder") ? "primary" : "secondary"}
            icon={<PrinterIcon width={14} height={14} />}
            style={{ fontSize: "12.5px", padding: "6px 11px" }}
          >
            PDF Builder
          </Button>

          <Button
            as={Link}
            to="/interview"
            variant={isActive("/interview") ? "primary" : "secondary"}
            icon={<MicIcon width={14} height={14} />}
            style={{
              fontSize: "12.5px",
              padding: "6px 11px",
              border: isActive("/interview") ? "none" : "1px solid rgba(255, 255, 255, 0.25)",
            }}
          >
            Voice Interview
          </Button>

          <Button
            as={Link}
            to="/history"
            variant={isActive("/history") ? "primary" : "secondary"}
            icon={<LayersIcon width={14} height={14} />}
            style={{ fontSize: "12.5px", padding: "6px 11px" }}
          >
            Vault
          </Button>

          <Button
            as={Link}
            to="/terminal"
            variant={isActive("/terminal") ? "primary" : "secondary"}
            icon={<TerminalIcon width={14} height={14} />}
            style={{ fontSize: "12.5px", padding: "6px 11px" }}
          >
            CLI
          </Button>

          {/* Interactive Feature Checklist Trigger */}
          <button
            type="button"
            onClick={triggerChecklist}
            className="btn btn--secondary"
            style={{
              fontSize: "11.5px",
              padding: "6px 9px",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              borderColor: "rgba(34, 197, 94, 0.4)",
              background: "rgba(34, 197, 94, 0.08)",
              color: "#4ade80",
              fontWeight: 700,
            }}
            title="Open Live System Checklist & Diagnostics"
          >
            <CheckIcon width={13} height={13} />
            <span>Checklist</span>
          </button>

          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          {/* User Account / Profile Button */}
          <UserProfileButton />

          {showHome && (
            <Button
              as={Link}
              to="/"
              variant="secondary"
              icon={<HomeIcon width={16} height={16} />}
              style={{ padding: "6px 9px" }}
              title="Home"
            >
              <span className="app-header__home-label">Home</span>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default AppHeader;

