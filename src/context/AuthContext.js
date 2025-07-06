import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // ✅ Handle token from URL (Google login)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      setToken(tokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ✅ Check token on load or token change
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("https://mypropai-server.onrender.com/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setAuthenticated(true);
        } else {
          throw new Error("Unauthorized");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setAuthenticated(false);
        localStorage.removeItem("token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        loading,
        user,
        token,
        setToken,
        setUser,
        setAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
