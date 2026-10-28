import { Link } from "react-router-dom";
import "../styles/Navbar.css";
import Button from "./Button";
import ThemeToggle from "./ThemeToggle";
import OllamaBadge from "./OllamaBadge";
import UserProfileButton from "./UserProfileButton";
import { SparkleIcon, UploadIcon, LayersIcon, MicIcon, TerminalIcon, SearchIcon, PrinterIcon } from "./icons";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#features" },
  { label: "About", href: "#footer" },
];

function Navbar({ theme, onToggleTheme }) {
  function triggerCmdPalette() {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }

  return (
    <header className="navbar">
      <nav className="navbar__inner container" aria-label="Primary">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a className="navbar__brand" href="#top">
            <span className="navbar__logo">
              <SparkleIcon width={18} height={18} />
            </span>
            ResumeAI
          </a>
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

        <ul className="navbar__links">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a className="navbar__link" href={link.href}>
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              className="navbar__link"
              to="/dashboard"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              className="navbar__link"
              to="/terminal"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <TerminalIcon width={14} height={14} />
              Developer CLI
              <span
                style={{
                  fontSize: "9px",
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: "4px",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                CLI
              </span>
            </Link>
          </li>
          <li>
            <Link
              className="navbar__link"
              to="/builder"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <PrinterIcon width={14} height={14} />
              PDF Builder
            </Link>
          </li>
          <li>
            <Link
              className="navbar__link"
              to="/interview"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <MicIcon width={14} height={14} />
              Voice Interview
              <span
                style={{
                  fontSize: "9px",
                  background: "#ffffff",
                  color: "#000000",
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: "9999px",
                  textTransform: "uppercase",
                }}
              >
                LIVE
              </span>
            </Link>
          </li>
          <li>
            <Link className="navbar__link" to="/history">
              Vault
            </Link>
          </li>
        </ul>

        <div className="navbar__actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-checklist-modal"))}
            className="btn btn--secondary"
            style={{
              fontSize: "11.5px",
              padding: "6px 10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              borderColor: "rgba(34, 197, 94, 0.4)",
              background: "rgba(34, 197, 94, 0.08)",
              color: "#4ade80",
              fontWeight: 700,
            }}
          >
            Checklist
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <UserProfileButton />
          <Button
            as={Link}
            to="/upload"
            className="navbar__cta"
            icon={<UploadIcon width={18} height={18} />}
          >
            Upload Resume
          </Button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

