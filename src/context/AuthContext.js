import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from '../config';

const AuthContext = createContext();
const TOKEN_KEY = "token";
const PLATFORM_MANAGER_TOKEN_KEY = "platformManagerToken";

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const clearStoredAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PLATFORM_MANAGER_TOKEN_KEY);
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
      console.log('%c[AUTH] Starting auth check...', 'color: blue');
      setLoading(true);

      if (!token) {
        console.log('[AUTH] No token found. Setting as logged out.');
        setAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('[AUTH] Token found, verifying with server...');
      try {
        const userData = await refreshUser(token);
        console.log('%c[AUTH] Token verification SUCCESSFUL.', 'color: green', { user: userData });
      } catch (err) {
        console.error('%c[AUTH] Token verification FAILED.', 'color: red', err);
        const platformManagerToken = localStorage.getItem(PLATFORM_MANAGER_TOKEN_KEY);

        if (platformManagerToken && platformManagerToken !== token) {
          localStorage.setItem(TOKEN_KEY, platformManagerToken);
          localStorage.removeItem(PLATFORM_MANAGER_TOKEN_KEY);
          setToken(platformManagerToken);
        } else {
          clearStoredAuth();
          setToken(null);
          setUser(null);
          setAuthenticated(false);
        }
      } finally {
        console.log('[AUTH] Auth check finished.');
        setLoading(false);
      }
    };

    checkAuth();
  }, [clearStoredAuth, refreshUser, token]);

  const login = (newToken) => {
    console.log('%c[AUTH] Login function called. Setting new token.', 'color: purple');
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.removeItem(PLATFORM_MANAGER_TOKEN_KEY);
    setToken(newToken);
  };

  const startImpersonation = (impersonationToken) => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      localStorage.setItem(PLATFORM_MANAGER_TOKEN_KEY, currentToken);
    }

    localStorage.setItem(TOKEN_KEY, impersonationToken);
    setToken(impersonationToken);
  };

  const stopImpersonation = () => {
    const platformManagerToken = localStorage.getItem(PLATFORM_MANAGER_TOKEN_KEY);
    localStorage.removeItem(PLATFORM_MANAGER_TOKEN_KEY);

    if (platformManagerToken) {
      localStorage.setItem(TOKEN_KEY, platformManagerToken);
      setToken(platformManagerToken);
      return;
    }

    clearStoredAuth();
    setAuthenticated(false);
    setUser(null);
    setToken(null);
  };

  const logout = () => {
    console.log('%c[AUTH] Logout function called. Clearing token.', 'color: orange');
    clearStoredAuth();
    setAuthenticated(false);
    setUser(null);
    setToken(null);
  };

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
