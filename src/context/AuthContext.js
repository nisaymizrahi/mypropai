import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

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
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setAuthenticated(false);
      } finally {
        console.log('[AUTH] Auth check finished.');
        setLoading(false);
      }
    };

    checkAuth();
  }, [refreshUser, token]);

  const login = (newToken) => {
    console.log('%c[AUTH] Login function called. Setting new token.', 'color: purple');
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    console.log('%c[AUTH] Logout function called. Clearing token.', 'color: orange');
    localStorage.removeItem('token');
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
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
