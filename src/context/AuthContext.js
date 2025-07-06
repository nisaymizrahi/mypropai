import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // ✅ Handle ?token=... from Google OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      setToken(tokenFromUrl);

      // Remove token param from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ✅ Fetch user session using token
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
          setAuthenticated(false);
          localStorage.removeItem("token");
          setToken(null);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setAuthenticated(false);
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
