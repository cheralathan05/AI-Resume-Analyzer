import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/AuthModal.css";
import { SparkleIcon, CloseIcon, UserIcon, LockIcon, LogOutIcon, CheckCircleIcon } from "./icons";

const ROLES = [
  "Senior Full-Stack Engineer",
  "Backend / Distributed Systems Engineer",
  "Frontend / UI Architect",
  "AI / Machine Learning Engineer",
  "Cloud Platform / DevOps Engineer",
  "Technical Product Manager",
  "Engineering Manager / Director",
];

export default function AuthModal() {
  const {
    user,
    isAuthenticated,
    isAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    closeAuthModal,
    login,
    register,
    loginAsDemo,
    logout,
    updateProfile,
    isLoading,
  } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState(ROLES[0]);

  // Profile editing state
  const [profileName, setProfileName] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [profileSalary, setProfileSalary] = useState("");
  const [profileBio, setProfileBio] = useState("");

  // Error & success messages
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileTitle(user.targetTitle || user.role || "");
      setProfileLocation(user.targetLocation || "Remote");
      setProfileSalary(user.targetSalary || "$140,000 - $180,000");
      setProfileBio(user.bio || "");
    }
  }, [user]);

  // Clear messages on tab switch
  useEffect(() => {
    setErrorMessage("");
    setSuccessMessage("");
  }, [authModalTab]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isAuthModalOpen) {
        closeAuthModal();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    const res = await login(loginEmail, loginPassword);
    if (!res.success) {
      setErrorMessage(res.error);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    const res = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      targetTitle: regRole,
    });
    if (!res.success) {
      setErrorMessage(res.error);
    }
  }

  async function handleDemoSelect(persona) {
    setErrorMessage("");
    const res = await loginAsDemo(persona);
    if (!res.success) {
      setErrorMessage(res.error);
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    const res = await updateProfile({
      name: profileName,
      targetTitle: profileTitle,
      targetLocation: profileLocation,
      targetSalary: profileSalary,
      bio: profileBio,
    });
    if (res.success) {
      setSuccessMessage("Profile saved successfully!");
      setTimeout(() => setSuccessMessage(""), 2500);
    } else {
      setErrorMessage(res.error);
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-brand">
            <span className="auth-modal-brand-icon">
              <SparkleIcon width={18} height={18} />
            </span>
            <div>
              <h3 className="auth-modal-title">
                {isAuthenticated ? "My Account & Target Profile" : "ResumeAI Career Cockpit"}
              </h3>
              <p className="auth-modal-subtitle">
                {isAuthenticated
                  ? "Manage your career goals & preferences"
                  : "Connect your resume workspace and vault"}
              </p>
            </div>
          </div>
          <button className="auth-modal-close" onClick={closeAuthModal} title="Close (Esc)">
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        {/* Navigation Tabs (if not authenticated) */}
        {!isAuthenticated && (
          <div className="auth-modal-tabs">
            <button
              className={`auth-modal-tab ${authModalTab === "login" ? "active" : ""}`}
              onClick={() => setAuthModalTab("login")}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`auth-modal-tab ${authModalTab === "register" ? "active" : ""}`}
              onClick={() => setAuthModalTab("register")}
              type="button"
            >
              Create Account
            </button>
            <button
              className={`auth-modal-tab ${authModalTab === "demo" ? "active" : ""}`}
              onClick={() => setAuthModalTab("demo")}
              type="button"
            >
              ⚡ 1-Click Demo
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="auth-modal-body">
          {errorMessage && <div className="auth-error-banner">{errorMessage}</div>}
          {successMessage && (
            <div
              className="auth-error-banner"
              style={{
                background: "rgba(34, 197, 94, 0.15)",
                borderColor: "rgba(34, 197, 94, 0.4)",
                color: "#86efac",
              }}
            >
              <CheckCircleIcon width={14} height={14} />
              {successMessage}
            </div>
          )}

          {/* TAB 1: LOG IN */}
          {!isAuthenticated && authModalTab === "login" && (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="auth-field">
                <label>Email Address</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@domain.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button className="auth-submit-btn" type="submit" disabled={isLoading}>
                <LockIcon width={15} height={15} />
                {isLoading ? "Signing in..." : "Sign In to ResumeAI"}
              </button>

              <div style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                Want to test immediately without typing?{" "}
                <button
                  type="button"
                  onClick={() => setAuthModalTab("demo")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#60a5fa",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Use 1-Click Demo Account
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {!isAuthenticated && authModalTab === "register" && (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <div className="auth-field">
                <label>Full Name</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Alex Rivera"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="auth-field">
                <label>Email Address</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label>Target Engineering Role</label>
                <select
                  className="auth-input"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <label>Create Password (min. 6 characters)</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <button className="auth-submit-btn" type="submit" disabled={isLoading}>
                <SparkleIcon width={15} height={15} />
                {isLoading ? "Creating account..." : "Create My Account"}
              </button>
            </form>
          )}

          {/* TAB 3: 1-CLICK INSTANT DEMO */}
          {!isAuthenticated && authModalTab === "demo" && (
            <div className="auth-demo-grid">
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: "0 0 4px" }}>
                Select a pre-configured professional profile to immediately experience all features:
              </p>

              <button
                type="button"
                className="auth-demo-card"
                onClick={() => handleDemoSelect("cheralathan")}
                disabled={isLoading}
              >
                <img
                  className="auth-demo-avatar"
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=Cheralathan"
                  alt="Cheralathan B.N"
                />
                <div className="auth-demo-info">
                  <div className="auth-demo-name">
                    Cheralathan B.N
                    <span
                      className="auth-demo-badge"
                      style={{ background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.35)" }}
                    >
                      Creator & Lead AI Engineer
                    </span>
                  </div>
                  <div className="auth-demo-role">Full-Stack & Generative AI Architect (React, Node, LLMs)</div>
                  <div className="auth-demo-stats">Target: $150k-$185k • Remote • 98% ATS Match</div>
                </div>
                <div className="auth-demo-cta">Launch →</div>
              </button>

              <button
                type="button"
                className="auth-demo-card"
                onClick={() => handleDemoSelect("alex")}
                disabled={isLoading}
              >
                <img
                  className="auth-demo-avatar"
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=AlexRivera"
                  alt="Alex Rivera"
                />
                <div className="auth-demo-info">
                  <div className="auth-demo-name">
                    Alex Rivera
                    <span className="auth-demo-badge">Recommended</span>
                  </div>
                  <div className="auth-demo-role">Senior Full-Stack Architect (React & Node.js)</div>
                  <div className="auth-demo-stats">Target: $165k-$195k • Remote (US) • 92% ATS Match</div>
                </div>
                <div className="auth-demo-cta">Launch →</div>
              </button>

              <button
                type="button"
                className="auth-demo-card"
                onClick={() => handleDemoSelect("jordan")}
                disabled={isLoading}
              >
                <img
                  className="auth-demo-avatar"
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=JordanVance"
                  alt="Jordan Vance"
                />
                <div className="auth-demo-info">
                  <div className="auth-demo-name">
                    Jordan Vance
                    <span
                      className="auth-demo-badge"
                      style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", borderColor: "rgba(168, 85, 247, 0.3)" }}
                    >
                      Staff Tier
                    </span>
                  </div>
                  <div className="auth-demo-role">Staff Platform & SRE Architect (Kubernetes & Go)</div>
                  <div className="auth-demo-stats">Target: $190k-$240k • San Francisco • 96% ATS Match</div>
                </div>
                <div className="auth-demo-cta">Launch →</div>
              </button>
            </div>
          )}

          {/* VIEW 4: AUTHENTICATED USER PROFILE & SETTINGS */}
          {isAuthenticated && user && (
            <form className="auth-form" onSubmit={handleProfileSave}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <img
                  src={user.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=AlexRivera"}
                  alt={user.name}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    background: "#1e293b",
                  }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: "15px", color: "var(--text-primary)" }}>{user.name}</h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>{user.email}</p>
                </div>
              </div>

              <div className="auth-field">
                <label>Display Name</label>
                <input
                  type="text"
                  className="auth-input"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label>Target Job Title</label>
                <input
                  type="text"
                  className="auth-input"
                  value={profileTitle}
                  onChange={(e) => setProfileTitle(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="auth-field">
                  <label>Target Location</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={profileLocation}
                    onChange={(e) => setProfileLocation(e.target.value)}
                    placeholder="Remote / San Francisco"
                  />
                </div>
                <div className="auth-field">
                  <label>Target Salary</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={profileSalary}
                    onChange={(e) => setProfileSalary(e.target.value)}
                    placeholder="$160,000 - $190,000"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Professional Bio</label>
                <textarea
                  className="auth-input"
                  rows={2}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Short summary of technical strengths..."
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button className="auth-submit-btn" type="submit" style={{ flex: 1 }}>
                  Save Profile Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeAuthModal();
                  }}
                  style={{
                    padding: "11px 16px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    color: "#fca5a5",
                    borderRadius: "9px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <LogOutIcon width={14} height={14} />
                  Sign Out
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
