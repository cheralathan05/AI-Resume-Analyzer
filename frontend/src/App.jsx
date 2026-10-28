import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ResumeProvider } from "./context/ResumeContext";
import { ToastProvider } from "./context/ToastContext";
import AuthModal from "./components/AuthModal";
import FeatureChecklistModal from "./components/FeatureChecklistModal";
import LandingPage from "./pages/LandingPage";
import UploadResume from "./pages/UploadResume";
import LoadingAnalysis from "./pages/LoadingAnalysis";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import MockInterview from "./pages/MockInterview";
import DeveloperTerminal from "./pages/DeveloperTerminal";
import ResumeBuilder from "./pages/ResumeBuilder";
import JobsBoard from "./pages/JobsBoard";
import PortfolioGenerator from "./pages/PortfolioGenerator";
import CoverLetterStudio from "./pages/CoverLetterStudio";
import BulletEnhancer from "./pages/BulletEnhancer";
import SystemChecklist from "./pages/SystemChecklist";
import LinkedInStudio from "./pages/LinkedInStudio";
import SalaryCoach from "./pages/SalaryCoach";
import ResumeDiff from "./pages/ResumeDiff";
import CommandPalette from "./components/CommandPalette";
import ResumeTerminal from "./components/ResumeTerminal";
import AppSidebar from "./components/AppSidebar";
import { TerminalIcon, CheckIcon, MenuIcon } from "./components/icons";

/*
 * Application route map.
 *  /          → Landing page
 *  /upload    → Resume upload flow (uploads to POST /api/upload)
 *  /dashboard → Results dashboard (renders parsed resume, ATS score & Ollama review)
 *  /jobs      → Real-Time Opportunity Radar & Smart ATS Matcher (NEW)
 *  /portfolio → AI Developer & Executive Portfolio Generator (NEW)
 *  /interview → Live Voice AI Mock Interviewer Studio
 *  /terminal  → Dedicated Developer Terminal & Diagnostic Shell
 *  /builder   → ATS Resume Visual Builder & PDF Exporter
 *  /history   → Embedded database scan history
 *  /loading   → Standalone analysis animation
 */
function App() {
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isTerminalDrawerOpen, setIsTerminalDrawerOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    function handleOpenCmd() {
      setIsCmdOpen(true);
    }
    function handleOpenTerm() {
      setIsTerminalDrawerOpen(true);
    }
    function handleOpenChecklist() {
      setIsChecklistOpen(true);
    }
    function handleOpenSidebar() {
      setIsSidebarOpen((prev) => !prev);
    }

    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    }

    window.addEventListener("open-command-palette", handleOpenCmd);
    window.addEventListener("open-terminal-drawer", handleOpenTerm);
    window.addEventListener("open-checklist-modal", handleOpenChecklist);
    window.addEventListener("open-sidebar-drawer", handleOpenSidebar);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-command-palette", handleOpenCmd);
      window.removeEventListener("open-terminal-drawer", handleOpenTerm);
      window.removeEventListener("open-checklist-modal", handleOpenChecklist);
      window.removeEventListener("open-sidebar-drawer", handleOpenSidebar);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <ResumeProvider>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadResume />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<JobsBoard />} />
          <Route path="/cover-letter" element={<CoverLetterStudio />} />
          <Route path="/enhancer" element={<BulletEnhancer />} />
          <Route path="/checklist" element={<SystemChecklist />} />
          <Route path="/portfolio" element={<PortfolioGenerator />} />
          <Route path="/linkedin" element={<LinkedInStudio />} />
          <Route path="/salary" element={<SalaryCoach />} />
          <Route path="/diff" element={<ResumeDiff />} />
          <Route path="/interview" element={<MockInterview />} />
          <Route path="/terminal" element={<DeveloperTerminal />} />
          <Route path="/builder" element={<ResumeBuilder />} />
          <Route path="/history" element={<History />} />
          <Route path="/loading" element={<LoadingAnalysis />} />
        </Routes>

        {/* Global Slide-Over Monolithic Navigation Sidebar Drawer */}
        {isSidebarOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100040, display: "flex" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(6px)",
              }}
              onClick={() => setIsSidebarOpen(false)}
            />
            <div style={{ position: "relative", zIndex: 10, height: "100%" }}>
              <AppSidebar
                isMobileOpen={true}
                onCloseMobile={() => setIsSidebarOpen(false)}
                isCollapsed={false}
                onToggleCollapse={() => {}}
              />
            </div>
          </div>
        )}

        {/* Global Quick Command Palette (Cmd+K / Ctrl+K) */}
        <CommandPalette
          isOpen={isCmdOpen}
          onClose={() => setIsCmdOpen(false)}
          onOpenTerminal={() => setIsTerminalDrawerOpen(true)}
        />

        {/* Global Slide-up Terminal Drawer (Ctrl + `) */}
        <ResumeTerminal
          isDrawer={true}
          isOpen={isTerminalDrawerOpen}
          onClose={() => setIsTerminalDrawerOpen(false)}
        />

        {/* Global Authentication & Profile Modal */}
        <AuthModal />

        {/* Global Feature & System Health Checklist Modal */}
        <FeatureChecklistModal
          isOpen={isChecklistOpen}
          onClose={() => setIsChecklistOpen(false)}
        />

        {/* Floating System Checklist FAB */}
        <button
          className="term-launcher-fab"
          style={{ right: "120px", background: "rgba(34, 197, 94, 0.15)", borderColor: "rgba(34, 197, 94, 0.4)", color: "#4ade80" }}
          onClick={() => setIsChecklistOpen((prev) => !prev)}
          title="Open System Checklist"
        >
          <CheckIcon width={13} height={13} />
          <span>Checklist</span>
        </button>

        {/* Floating CLI Terminal Trigger Button */}
          <button
            className="term-launcher-fab"
            onClick={() => setIsTerminalDrawerOpen((prev) => !prev)}
            title="Open Terminal (Ctrl + `)"
          >
            <TerminalIcon width={14} height={14} />
            <span>CLI</span>
            <span className="term-launcher-keyhint">Ctrl+`</span>
          </button>
        </ResumeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

