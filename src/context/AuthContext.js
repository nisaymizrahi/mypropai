import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from '../config';
import { logoutUser } from "../utils/api";

const AuthContext = createContext();
const TOKEN_KEY = "token";
const PLATFORM_MANAGER_TOKEN_KEY = "platformManagerToken";
const LAST_ACTIVITY_KEY = "authLastActivityAt";
const IDLE_TIMEOUT_MINUTES = Number.parseInt(process.env.REACT_APP_AUTH_IDLE_TIMEOUT_MINUTES || "30", 10);
const IDLE_TIMEOUT_MS = (Number.isFinite(IDLE_TIMEOUT_MINUTES) ? IDLE_TIMEOUT_MINUTES : 30) * 60 * 1000;
const ACTIVITY_WRITE_INTERVAL_MS = 15 * 1000;

const decodeJwtPayload = (token) => {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const lastActivityWriteRef = useRef(0);
  const logoutInFlightRef = useRef(false);

  const clearStoredAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PLATFORM_MANAGER_TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }, []);

  const finishLogout = useCallback(() => {
    clearStoredAuth();
    setAuthenticated(false);
    setUser(null);
    setToken(null);
  }, [clearStoredAuth]);

  const recordActivity = useCallback((force = false) => {
    const activeToken = localStorage.getItem(TOKEN_KEY);
    if (!activeToken) {
      return;
    }

    const now = Date.now();
    if (!force && now - lastActivityWriteRef.current < ACTIVITY_WRITE_INTERVAL_MS) {
      return;
    }

    lastActivityWriteRef.current = now;
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  }, []);

  const refreshUser = useCallback(async (activeToken = token) => {
    if (!activeToken) {
      setAuthenticated(false);
      setUser(null);
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    });

    if (!res.ok) {
      throw new Error("Invalid token");
    }

    const userData = await res.json();
    setUser(userData);
    setAuthenticated(true);
    return userData;
  }, [token]);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);

      if (!token) {
        setAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        await refreshUser(token);
      } catch (err) {
        const platformManagerToken = localStorage.getItem(PLATFORM_MANAGER_TOKEN_KEY);

        if (platformManagerToken && platformManagerToken !== token) {
          localStorage.setItem(TOKEN_KEY, platformManagerToken);
          localStorage.removeItem(PLATFORM_MANAGER_TOKEN_KEY);
          setToken(platformManagerToken);
        } else {
          finishLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [finishLogout, refreshUser, token]);

  const login = useCallback((newToken) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.removeItem(PLATFORM_MANAGER_TOKEN_KEY);
    setToken(newToken);
    recordActivity(true);
  }, [recordActivity]);

  const startImpersonation = useCallback((impersonationToken) => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      localStorage.setItem(PLATFORM_MANAGER_TOKEN_KEY, currentToken);
    }

    localStorage.setItem(TOKEN_KEY, impersonationToken);
    setToken(impersonationToken);
    recordActivity(true);
  }, [recordActivity]);

  const stopImpersonation = useCallback(() => {
    const platformManagerToken = localStorage.getItem(PLATFORM_MANAGER_TOKEN_KEY);
    localStorage.removeItem(PLATFORM_MANAGER_TOKEN_KEY);

    if (platformManagerToken) {
      localStorage.setItem(TOKEN_KEY, platformManagerToken);
      setToken(platformManagerToken);
      recordActivity(true);
      return;
    }

    finishLogout();
  }, [finishLogout, recordActivity]);

  const logout = useCallback(async ({ remote = true } = {}) => {
    if (logoutInFlightRef.current) {
      return;
    }

    logoutInFlightRef.current = true;

    try {
      if (remote && localStorage.getItem(TOKEN_KEY)) {
        await logoutUser();
      }
    } catch (error) {
      console.error("Logout API call failed, proceeding with local sign out.", error);
    } finally {
      finishLogout();
      logoutInFlightRef.current = false;
    }
  }, [finishLogout]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll", "focus"];
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        recordActivity();
      }
    };

    const handleActivity = () => {
      recordActivity();
    };

    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, true));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity, true)
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [recordActivity, token]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === TOKEN_KEY) {
        const nextToken = event.newValue;
        if (!nextToken) {
          setAuthenticated(false);
          setUser(null);
          setToken(null);
          return;
        }

        setToken(nextToken);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const checkSessionExpiry = async () => {
      const activeToken = localStorage.getItem(TOKEN_KEY);
      if (!activeToken) {
        return;
      }

      const payload = decodeJwtPayload(activeToken);
      const absoluteExpiryMs = payload?.exp ? payload.exp * 1000 : null;
      const lastActivityMs = Number.parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "", 10);
      const safeLastActivityMs = Number.isFinite(lastActivityMs) ? lastActivityMs : Date.now();
      const idleExpired = Date.now() - safeLastActivityMs >= IDLE_TIMEOUT_MS;
      const absoluteExpired = absoluteExpiryMs ? Date.now() >= absoluteExpiryMs : false;

      if (idleExpired || absoluteExpired) {
        await logout({ remote: true });
      }
    };

    const intervalId = window.setInterval(() => {
      checkSessionExpiry();
    }, 15 * 1000);

    checkSessionExpiry();

    return () => window.clearInterval(intervalId);
  }, [logout, token]);

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        loading,
        user,
        login,
        logout,
        startImpersonation,
        stopImpersonation,
        refreshUser,
        isImpersonating: Boolean(user?.impersonation?.active),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
