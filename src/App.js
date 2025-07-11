import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import CompsTool from "./pages/CompsTool";
import NewInvestment from "./pages/NewInvestment";
import MyInvestments from "./pages/MyInvestments";
import InvestmentDetail from "./pages/InvestmentDetail";
import EditInvestment from "./pages/EditInvestment";
import LoginPage from "./pages/LoginPage";
import LoginContinuePage from "./pages/LoginContinuePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { setTokenCookieFromURL } from "./utils/setTokenFromURL";
import { AuthProvider } from "./context/AuthContext.js";

import ManagementDashboard from "./pages/ManagementDashboard";
import ManagedPropertyDetail from "./pages/ManagedPropertyDetail";
import LeaseDetailPage from "./pages/LeaseDetailPage"; // Lease Detail Page

function App() {
  useEffect(() => {
    setTokenCookieFromURL();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login-continue" element={<LoginContinuePage />} />

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
            path="/management"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ManagementDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/management/:propertyId"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ManagedPropertyDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ✅ FIXED: Lease detail route now correctly under /management/leases/:leaseId */}
          <Route
            path="/management/leases/:leaseId"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LeaseDetailPage />
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

          <Route
            path="/investments/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <InvestmentDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/investments/:id/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <EditInvestment />
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
