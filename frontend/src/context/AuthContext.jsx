import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  loginUser,
  registerUser,
  demoLoginUser,
  getCurrentUser,
  updateUserProfile,
  logoutUser,
  getStoredAuthToken,
  setAuthToken,
} from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => getStoredAuthToken());
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("login"); // 'login' | 'register' | 'demo'

  // Hydrate user session on mount
  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      const stored = getStoredAuthToken();
      if (!stored) {
        if (isMounted) setIsLoading(false);
        return;
      }
      try {
        const res = await getCurrentUser();
        if (isMounted && res?.success && res.user) {
          setUser(res.user);
          setTokenState(stored);
        } else if (isMounted) {
          // Token expired or invalid
          setAuthToken(null);
          setUser(null);
          setTokenState(null);
        }
      } catch (err) {
        if (isMounted) {
          console.warn("[Auth] Session recovery skipped:", err.message);
          setAuthToken(null);
          setUser(null);
          setTokenState(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const res = await loginUser(email, password);
      if (res?.success && res.user) {
        setUser(res.user);
        setTokenState(res.token);
        setIsAuthModalOpen(false);
        return { success: true, user: res.user };
      }
      return { success: false, error: res?.message || "Failed to log in." };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message || "Failed to log in." };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setIsLoading(true);
    try {
      const res = await registerUser(payload);
      if (res?.success && res.user) {
        setUser(res.user);
        setTokenState(res.token);
        setIsAuthModalOpen(false);
        return { success: true, user: res.user };
      }
      return { success: false, error: res?.message || "Failed to create account." };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message || "Failed to create account." };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAsDemo = useCallback(async (persona = "alex") => {
    setIsLoading(true);
    try {
      const res = await demoLoginUser(persona);
      if (res?.success && res.user) {
        setUser(res.user);
        setTokenState(res.token);
        setIsAuthModalOpen(false);
        return { success: true, user: res.user };
      }
      return { success: false, error: "Demo sign in failed." };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setTokenState(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      const res = await updateUserProfile(updates);
      if (res?.success && res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: "Failed to update profile." };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  }, []);

  const openAuthModal = useCallback((tab = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isLoading,
    isAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    login,
    register,
    loginAsDemo,
    logout,
    updateProfile,
    openAuthModal,
    closeAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
