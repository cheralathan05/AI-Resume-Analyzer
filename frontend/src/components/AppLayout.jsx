import { useState, useEffect } from "react";
import AppSidebar from "./AppSidebar";
import AppTopNavbar from "./AppTopNavbar";
import "../styles/MonolithLayout.css";

export default function AppLayout({ children, fluid = false }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("resume_ai_sidebar_collapsed") === "true";
  });

  function handleToggleCollapse() {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("resume_ai_sidebar_collapsed", String(next));
      return next;
    });
  }

  function handleToggleMobile() {
    setIsMobileOpen((prev) => !prev);
  }

  // Close mobile drawer on route change or ESC
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  return (
    <div className="monolith-shell">
      <div className="monolith-ambient" />

      {/* Persistent Monolithic Sidebar */}
      <AppSidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area with Top Navbar */}
      <div className="monolith-content-wrapper">
        <AppTopNavbar
          onToggleMobile={handleToggleMobile}
          onToggleCollapse={handleToggleCollapse}
          isCollapsed={isCollapsed}
        />

        <main className={`monolith-main-body ${fluid ? "monolith-main-body--fluid" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
