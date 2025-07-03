import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import CompsTool from "./pages/CompsTool";
import NewInvestment from "./pages/NewInvestment";
import MyInvestments from "./pages/MyInvestments";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { setTokenCookieFromURL } from "./utils/setTokenFromURL";
import { AuthProvider } from "./context/AuthContext"; // ✅ NEW

function App() {
  useEffect(() => {
    setTokenCookieFromURL();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/comps"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CompsTool />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/investments"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MyInvestments />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/investments/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <NewInvestment />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
