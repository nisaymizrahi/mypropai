import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import DashboardLayout from "./components/DashboardLayout";
import PlatformManagerRoute from "./components/PlatformManagerRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import TenantProtectedRoute from "./components/TenantProtectedRoute";

import DashboardPage from "./pages/DashboardPage";
import CompsTool from "./pages/CompsTool";
import MyInvestments from "./pages/MyInvestments";
import InvestmentDetail from "./pages/InvestmentDetail";
import EditInvestment from "./pages/EditInvestment";
import LoginPage from "./pages/LoginPage";
import LoginContinuePage from "./pages/LoginContinuePage";
import ApplicationsPage from "./pages/ApplicationsPage";
import SendApplicationPage from "./pages/SendApplicationPage";
import ApplicationSuccessPage from "./pages/ApplicationSuccessPage";
import CompsPage from "./pages/CompsPage";

import ManagementDashboard from "./pages/ManagementDashboard";
import ManagedPropertyDetail from "./pages/ManagedPropertyDetail";
import LeaseDetailPage from "./pages/LeaseDetailPage";
import InvitePage from "./pages/InvitePage";
import TenantLoginPage from "./pages/TenantLoginPage";
import TenantDashboard from "./pages/TenantDashboard";
import Homepage from "./pages/Homepage";
import SignupPage from "./pages/SignupPage";
import AccountCenter from "./pages/AccountCenter";
import FinancialToolsPage from "./pages/FinancialToolsPage";
import UnitListingPage from "./pages/UnitListingPage";
import LeadsPage from "./pages/LeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import ApplicationFormPage from "./pages/ApplicationFormPage";
import ApplicationDetailPage from "./pages/ApplicationDetailPage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyWorkspacePage from "./pages/PropertyWorkspacePage";
import CreatePropertyPage from "./pages/CreatePropertyPage";
import PlatformManagerPage from "./pages/PlatformManagerPage";

import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            style: {
              borderRadius: "20px",
              border: "1px solid rgba(24, 38, 55, 0.08)",
              background: "rgba(255, 253, 248, 0.96)",
              color: "#182637",
              boxShadow: "0 18px 40px rgba(15, 23, 36, 0.12)",
            },
          }}
        />

        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login-continue" element={<LoginContinuePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/tenant-login" element={<TenantLoginPage />} />
          <Route path="/apply" element={<ApplicationFormPage />} />
          <Route path="/apply/:unitId" element={<ApplicationFormPage />} />
          <Route path="/apply/success" element={<ApplicationSuccessPage />} />

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
            path="/platform-manager"
            element={
              <PlatformManagerRoute>
                <DashboardLayout>
                  <PlatformManagerPage />
                </DashboardLayout>
              </PlatformManagerRoute>
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

          {/* Comps (main) */}
          <Route
            path="/comps"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CompsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Keep old comps tool without deleting it */}
          <Route
            path="/comps-tool"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CompsTool />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/properties"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PropertiesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/properties/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreatePropertyPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/properties/:propertyKey"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PropertyWorkspacePage />
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
                <Navigate to="/properties/new?workspace=acquisitions" replace />
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
