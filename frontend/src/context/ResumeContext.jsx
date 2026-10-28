import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { getStoredAuthToken } from "../lib/api";

const ResumeContext = createContext(null);

const STORAGE_RESUME_KEY = "resume_ai_active_resume";
const STORAGE_FILENAME_KEY = "resume_ai_active_filename";
const STORAGE_ANALYSIS_KEY = "resume_ai_active_analysis";

export function ResumeProvider({ children }) {
  const [activeResume, setActiveResumeState] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_RESUME_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeFileName, setActiveFileNameState] = useState(() => {
    if (typeof window === "undefined") return "Active_Resume.pdf";
    return localStorage.getItem(STORAGE_FILENAME_KEY) || "Active_Resume.pdf";
  });

  const [activeAnalysis, setActiveAnalysisState] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_ANALYSIS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoadingResume, setIsLoadingResume] = useState(false);

  // Core function to set active resume and broadcast across app
  const setActiveResume = useCallback((resumeData, fileName = "Resume.pdf", analysis = null) => {
    if (!resumeData) return;
    setActiveResumeState(resumeData);
    const resolvedName = fileName || "Resume.pdf";
    setActiveFileNameState(resolvedName);

    if (analysis) {
      setActiveAnalysisState(analysis);
    }

    try {
      localStorage.setItem(STORAGE_RESUME_KEY, JSON.stringify(resumeData));
      localStorage.setItem(STORAGE_FILENAME_KEY, resolvedName);
      if (analysis) {
        localStorage.setItem(STORAGE_ANALYSIS_KEY, JSON.stringify(analysis));
      }
      // Keep legacy key for backwards compatibility
      localStorage.setItem("resume_ai_last_resume", JSON.stringify(resumeData));
    } catch (e) {
      console.warn("[ResumeContext] Failed writing to localStorage:", e);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("resume_ai_active_resume_updated", {
          detail: { resume: resumeData, fileName: resolvedName, analysis },
        })
      );
    }
  }, []);

  const updateActiveResume = useCallback((updater) => {
    setActiveResumeState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (next) {
        try {
          localStorage.setItem(STORAGE_RESUME_KEY, JSON.stringify(next));
          localStorage.setItem("resume_ai_last_resume", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, []);

  const clearActiveResume = useCallback(() => {
    setActiveResumeState(null);
    setActiveFileNameState("Resume.pdf");
    setActiveAnalysisState(null);
    try {
      localStorage.removeItem(STORAGE_RESUME_KEY);
      localStorage.removeItem(STORAGE_FILENAME_KEY);
      localStorage.removeItem(STORAGE_ANALYSIS_KEY);
      localStorage.removeItem("resume_ai_last_resume");
    } catch {}
  }, []);

  // Sync with backend database on mount or login
  const syncWithDatabase = useCallback(async () => {
    setIsLoadingResume(true);
    try {
      const token = getStoredAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await api.get("/api/upload/latest", { headers });

      if (data?.success && data?.resume) {
        setActiveResume(data.resume, data.filename || "Uploaded_Resume.pdf");
        return data.resume;
      }
    } catch (err) {
      console.warn("[ResumeContext] Backend resume sync note:", err.message);
    } finally {
      setIsLoadingResume(false);
    }
    return null;
  }, [setActiveResume]);

  // Initial hydrate from backend if local resume is not present
  useEffect(() => {
    if (!activeResume) {
      syncWithDatabase();
    }
  }, []);

  // Listen to cross-window or inter-component resume updates
  useEffect(() => {
    function handleSync(e) {
      if (e.detail?.resume) {
        setActiveResumeState(e.detail.resume);
        if (e.detail.fileName) setActiveFileNameState(e.detail.fileName);
        if (e.detail.analysis) setActiveAnalysisState(e.detail.analysis);
      }
    }
    window.addEventListener("resume_ai_active_resume_updated", handleSync);
    return () => window.removeEventListener("resume_ai_active_resume_updated", handleSync);
  }, []);

  const value = {
    activeResume,
    activeFileName,
    activeAnalysis,
    hasActiveResume: Boolean(activeResume && (activeResume.skills?.length > 0 || activeResume.contact?.name)),
    isLoadingResume,
    setActiveResume,
    updateActiveResume,
    setActiveAnalysis: setActiveAnalysisState,
    clearActiveResume,
    syncWithDatabase,
  };

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

export function useResume() {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error("useResume must be used within a ResumeProvider");
  }
  return context;
}

export default ResumeContext;
