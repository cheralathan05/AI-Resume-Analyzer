import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserIcon, SparkleIcon, LogOutIcon, KanbanIcon, LayersIcon, MicIcon } from "./icons";
import "../styles/AuthModal.css";

export default function UserProfileButton() {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <button
        className="user-profile-trigger"
        onClick={() => openAuthModal("login")}
        title="Sign in or use 1-Click Demo account"
        style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
          borderColor: "rgba(59, 130, 246, 0.35)",
        }}
      >
        <span
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
          }}
        >
          <UserIcon width={12} height={12} />
        </span>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>Sign In</span>
        <span
          style={{
            fontSize: "9px",
            padding: "1px 5px",
            borderRadius: "4px",
            background: "#3b82f6",
            color: "#ffffff",
            fontWeight: 800,
          }}
        >
          DEMO
        </span>
      </button>
    );
  }

  return (
    <div className="user-profile-menu" ref={menuRef}>
      <button
        className="user-profile-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Account & Career Profile"
      >
        <img
          className="user-avatar-mini"
          src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
          alt={user.name}
        />
        <span className="user-name-mini">{user.name.split(" ")[0]}</span>
        <span className="user-role-badge-mini">{user.role?.includes("Staff") ? "STAFF" : "PRO"}</span>
      </button>

      {isOpen && (
        <div className="user-dropdown-panel">
          <div className="user-dropdown-header">
            <p className="user-dropdown-header-name">{user.name}</p>
            <p className="user-dropdown-header-email">{user.email}</p>
          </div>

          <button
            className="user-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              openAuthModal("profile");
            }}
          >
            <UserIcon width={14} height={14} />
            <span>Profile & Career Goals</span>
          </button>

          <Link
            className="user-dropdown-item"
            to="/dashboard"
            state={{ targetTab: "pipeline" }}
            onClick={() => setIsOpen(false)}
          >
            <KanbanIcon width={14} height={14} />
            <span>Job Tracker Pipeline</span>
          </Link>

          <Link
            className="user-dropdown-item"
            to="/interview"
            onClick={() => setIsOpen(false)}
          >
            <MicIcon width={14} height={14} />
            <span>Mock Interview Studio</span>
          </Link>

          <Link
            className="user-dropdown-item"
            to="/history"
            onClick={() => setIsOpen(false)}
          >
            <LayersIcon width={14} height={14} />
            <span>Saved Resume Vault</span>
          </Link>

          <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "4px 0" }} />

          <button
            className="user-dropdown-item danger"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
          >
            <LogOutIcon width={14} height={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
