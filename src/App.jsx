import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
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
import { AuthProvider } from "./context/AuthContext";
import ApplicationsPage from "./pages/ApplicationsPage";
import SendApplicationPage from "./pages/SendApplicationPage";
import ApplicationSuccessPage from "./pages/ApplicationSuccessPage";

import ManagementDashboard from "./pages/ManagementDashboard";
import ManagedPropertyDetail from "./pages/ManagedPropertyDetail";
import LeaseDetailPage from "./pages/LeaseDetailPage";
import InvitePage from "./pages/InvitePage";
import TenantLoginPage from "./pages/TenantLoginPage";
import TenantDashboard from "./pages/TenantDashboard";
import TenantProtectedRoute from "./components/TenantProtectedRoute";
import Homepage from "./pages/Homepage";
import SignupPage from "./pages/SignupPage";
import AccountCenter from "./pages/AccountCenter";
import FinancialToolsPage from "./pages/FinancialToolsPage";
import UnitListingPage from "./pages/UnitListingPage";
import LeadsPage from "./pages/LeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import ApplicationFormPage from "./pages/ApplicationFormPage";
// 1. IMPORT THE NEW APPLICATION DETAIL PAGE
import ApplicationDetailPage from "./pages/ApplicationDetailPage";


function App() {
  useEffect(() => {
    setTokenCookieFromURL();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" reverseOrder={false} />

        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login-continue" element={<LoginContinuePage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/tenant-login" element={<TenantLoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/apply/:unitId" element={<ApplicationFormPage />} />


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
            path="/tools"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <FinancialToolsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LeadsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/leads/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LeadDetailPage />
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
            path="/management/units/:unitId/listing"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <UnitListingPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 2. ADD THE NEW APPLICATION DETAIL ROUTE */}
          <Route
            path="/applications/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ApplicationDetailPage />
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
  path="/applications/send"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <SendApplicationPage />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
          <Route path="/apply/success" element={<ApplicationSuccessPage />} />


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
          <Route
  path="/applications"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <ApplicationsPage />
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
