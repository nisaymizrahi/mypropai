import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // ✅ Handle ?loggedin=true param from Google OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("loggedin") === "true") {
      // Remove the query param from the URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
      // Force a reload to trigger cookie-based session detection
      window.location.reload();
    }
  }, []);

  // ✅ Normal session check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("https://mypropai-server.onrender.com/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, loading, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
