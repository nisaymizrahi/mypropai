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
import LeaseDetailPage from "./pages/LeaseDetailPage";
import InvitePage from "./pages/InvitePage";
import TenantLoginPage from "./pages/TenantLoginPage";
import TenantDashboard from "./pages/TenantDashboard";
import TenantProtectedRoute from "./components/TenantProtectedRoute";
import Homepage from "./pages/Homepage";
import SignupPage from "./pages/SignupPage";
// 1. IMPORT THE NEW ACCOUNT CENTER PAGE
import AccountCenter from "./pages/AccountCenter";


function App() {
  useEffect(() => {
    setTokenCookieFromURL();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login-continue" element={<LoginContinuePage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/tenant-login" element={<TenantLoginPage />} />
          <Route path="/signup" element={<SignupPage />} />


          {/* --- Protected Tenant Route --- */}
          <Route
            path="/tenant-dashboard"
            element={
              <TenantProtectedRoute>
                <TenantDashboard />
              </TenantProtectedRoute>
            }
          />

          {/* --- Protected Manager Routes --- */}
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
          
          {/* 2. ADD THE NEW ACCOUNT CENTER ROUTE */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AccountCenter />
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
