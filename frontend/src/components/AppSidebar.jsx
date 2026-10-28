import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  SparkleIcon,
  GaugeIcon,
  UploadIcon,
  BriefcaseIcon,
  CodeIcon,
  PrinterIcon,
  MicIcon,
  LayersIcon,
  TerminalIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  MailIcon,
  ZapIcon,
  GitCompareIcon,
  DollarIcon,
} from "./icons";
import "../styles/MonolithLayout.css";

export default function AppSidebar({ isMobileOpen, onCloseMobile, isCollapsed, onToggleCollapse }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, isAuthenticated, loginAsDemo, openAuthModal, logout } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  function isActive(path) {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  }

  function handleOpenChecklist() {
    window.dispatchEvent(new CustomEvent("open-checklist-modal"));
    if (onCloseMobile) onCloseMobile();
  }

  return (
    <>
      {isMobileOpen && (
        <div className="monolith-backdrop" onClick={onCloseMobile} />
      )}

      <aside
        className={`monolith-sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}
      >
        {/* Brand Header */}
        <div className="sidebar-brand-box">
          <Link to="/" className="sidebar-brand-link" title="ResumeAI Monolith Home">
            <span className="sidebar-logo-icon">
              <SparkleIcon width={18} height={18} />
            </span>
            {!isCollapsed && (
              <div className="sidebar-brand-info">
                <span className="sidebar-brand-title">
                  ResumeAI
                  <span className="sidebar-pro-badge">PRO</span>
                </span>
                <span className="sidebar-brand-sub">Career Studio v2.5</span>
              </div>
            )}
          </Link>
        </div>

        {/* User Persona & Profile Card */}
        <div style={{ position: "relative" }}>
          <div
            className="sidebar-user-card"
            onClick={() => setShowPersonaMenu((prev) => !prev)}
            title={isCollapsed ? (user?.name || "Cheralathan B.N") : "Click to switch profile persona"}
          >
            <div className="sidebar-user-info">
              <div className="sidebar-user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
              </div>
              {!isCollapsed && (
                <div className="sidebar-user-details">
                  <span className="sidebar-user-name">
                    {user?.name || "Cheralathan B.N"}
                  </span>
                  <span className="sidebar-user-role">
                    {user?.targetTitle || user?.role || "Lead Architect"}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <span style={{ fontSize: "10px", color: "#71717a" }}>▼</span>
            )}
          </div>

          {/* Quick Persona Switcher Popover */}
          {showPersonaMenu && !isCollapsed && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "10px",
                right: "10px",
                background: "#141419",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "10px",
                padding: "8px",
                zIndex: 150,
                boxShadow: "0 14px 32px rgba(0, 0, 0, 0.6)",
              }}
            >
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#71717a", padding: "4px 8px", textTransform: "uppercase" }}>
                Switch Active Persona
              </div>
              <button
                type="button"
                onClick={() => {
                  loginAsDemo("cheralathan");
                  setShowPersonaMenu(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>Cheralathan B.N</span>
                <span style={{ fontSize: "10px", color: "#4ade80" }}>Lead</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  loginAsDemo("jordan");
                  setShowPersonaMenu(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  color: "#d4d4d8",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>Jordan Vance</span>
                <span style={{ fontSize: "10px", color: "#60a5fa" }}>Staff AI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  loginAsDemo("alex");
                  setShowPersonaMenu(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  color: "#d4d4d8",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>Alex Rivera</span>
                <span style={{ fontSize: "10px", color: "#c084fc" }}>Full Stack</span>
              </button>

              <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "4px 0" }} />

              <button
                type="button"
                onClick={() => {
                  setShowPersonaMenu(false);
                  openAuthModal("login");
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  background: "transparent",
                  border: "none",
                  color: "#a1a1aa",
                  fontSize: "11.5px",
                  cursor: "pointer",
                }}
              >
                Sign In / Custom Account
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className="sidebar-nav-scroll">
          {/* Section: Core Workspace */}
          {!isCollapsed && <div className="sidebar-section-label">Core Studio</div>}

          <Link
            to="/dashboard"
            className={`sidebar-nav-item ${isActive("/dashboard") ? "active" : ""}`}
            title="Overview & Diagnostics"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><GaugeIcon width={17} height={17} /></span>
            {!isCollapsed && <span>Dashboard</span>}
          </Link>

          <Link
            to="/upload"
            className={`sidebar-nav-item ${isActive("/upload") ? "active" : ""}`}
            title="Upload & Parse Resume"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><UploadIcon width={17} height={17} /></span>
            {!isCollapsed && <span>ATS Scanner</span>}
          </Link>

          <Link
            to="/jobs"
            className={`sidebar-nav-item ${isActive("/jobs") ? "active" : ""}`}
            title="Real-Time Job Opportunities Radar"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><BriefcaseIcon width={17} height={17} /></span>
            {!isCollapsed && (
              <>
                <span>Job Radar</span>
                <span className="sidebar-nav-badge new">8 Live</span>
              </>
            )}
          </Link>

          <Link
            to="/cover-letter"
            className={`sidebar-nav-item ${isActive("/cover-letter") ? "active" : ""}`}
            title="AI Tailored Cover Letter & Cold Outreach Studio"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><MailIcon width={17} height={17} /></span>
            {!isCollapsed && (
              <>
                <span>Cover Letter</span>
                <span className="sidebar-nav-badge new">AI</span>
              </>
            )}
          </Link>

          <Link
            to="/enhancer"
            className={`sidebar-nav-item ${isActive("/enhancer") ? "active" : ""}`}
            title="Google XYZ & STAR Bullet Point Rewriter"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><ZapIcon width={17} height={17} /></span>
            {!isCollapsed && (
              <>
                <span>STAR Rewriter</span>
                <span className="sidebar-nav-badge new">Pro</span>
              </>
            )}
          </Link>

          <Link
            to="/portfolio"
            className={`sidebar-nav-item ${isActive("/portfolio") ? "active" : ""}`}
            title="AI Personal Website Generator"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><CodeIcon width={17} height={17} /></span>
            {!isCollapsed && (
              <>
                <span>Portfolio Site</span>
                <span className="sidebar-nav-badge new">AI</span>
              </>
            )}
          </Link>

          {/* Section: Creation & Coaching */}
          {!isCollapsed && <div className="sidebar-section-label">Creation & Coaching</div>}

          <Link
            to="/diff"
            className={`sidebar-nav-item ${isActive("/diff") ? "active" : ""}`}
            title="Side-by-Side Resume Diff & Score Optimizer"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><GitCompareIcon width={17} height={17} /></span>
            {!isCollapsed && (
              <>
                <span>Resume Diff</span>
                <span className="sidebar-nav-badge new">Diff</span>
              </>
            )}
          </Link>

          <Link
            to="/linkedin"
            className={`sidebar-nav-item ${isActive("/linkedin") ? "active" : ""}`}
            title="LinkedIn & GitHub Profile Architect Studio"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><SparkleIcon width={17} height={17} /></span>
            {!isCollapsed && (
              <>
                <span>LinkedIn & Git</span>
                <span className="sidebar-nav-badge new">Pro</span>
              </>
            )}
          </Link>

          <Link
            to="/salary"
            className={`sidebar-nav-item ${isActive("/salary") ? "active" : ""}`}
            title="Salary Benchmark & Offer Negotiation Coach"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><DollarIcon width={17} height={17} /></span>
            {!isCollapsed && (
              <>
                <span>Salary Coach</span>
                <span className="sidebar-nav-badge new">Offer</span>
              </>
            )}
          </Link>

          <Link
            to="/builder"
            className={`sidebar-nav-item ${isActive("/builder") ? "active" : ""}`}
            title="ATS Resume Visual Builder"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><PrinterIcon width={17} height={17} /></span>
            {!isCollapsed && <span>PDF Builder</span>}
          </Link>

          <Link
            to="/interview"
            className={`sidebar-nav-item ${isActive("/interview") ? "active" : ""}`}
            title="Voice AI Mock Interview Studio"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><MicIcon width={17} height={17} /></span>
            {!isCollapsed && <span>Voice Studio</span>}
          </Link>

          {/* Section: Data & Developer */}
          {!isCollapsed && <div className="sidebar-section-label">Data & Diagnostics</div>}

          <Link
            to="/history"
            className={`sidebar-nav-item ${isActive("/history") ? "active" : ""}`}
            title="Database Vault & Scan History"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><LayersIcon width={17} height={17} /></span>
            {!isCollapsed && <span>Database Vault</span>}
          </Link>

          <Link
            to="/terminal"
            className={`sidebar-nav-item ${isActive("/terminal") ? "active" : ""}`}
            title="Developer CLI Diagnostic Terminal"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><TerminalIcon width={17} height={17} /></span>
            {!isCollapsed && <span>Developer CLI</span>}
          </Link>

          {/* Checklist Button in Nav */}
          <Link
            to="/checklist"
            className={`sidebar-nav-item ${isActive("/checklist") ? "active" : ""}`}
            style={{ width: "100%", background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)", color: "#4ade80", cursor: "pointer", marginTop: "8px" }}
            title="Open 18-Point System Health Checklist"
            onClick={onCloseMobile}
          >
            <span className="sidebar-nav-icon"><CheckIcon width={16} height={16} /></span>
            {!isCollapsed && (
              <>
                <span style={{ fontWeight: 700 }}>System Health</span>
                <span className="sidebar-nav-badge">18/18 OK</span>
              </>
            )}
          </Link>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="sidebar-status-row">
              <span className="sidebar-status-pill">
                <span className="sidebar-status-dot" />
                <span>DB: Connected</span>
              </span>
              <span style={{ fontSize: "10.5px", color: "#a1a1aa" }}>db.json</span>
            </div>
          )}

          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRightIcon width={14} height={14} />
            ) : (
              <>
                <ChevronLeftIcon width={14} height={14} />
                <span>Collapse Dock</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
