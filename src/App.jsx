import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import DashboardLayout from "./components/DashboardLayout";
import PlatformManagerRoute from "./components/PlatformManagerRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import LoginContinuePage from "./pages/LoginContinuePage";
import SignupPage from "./pages/SignupPage";
import Homepage from "./pages/Homepage";
import CompsReportPage from "./pages/CompsReportPage";
import LeadsPage from "./pages/LeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import CreatePropertyPage from "./pages/CreatePropertyPage";
import EditInvestment from "./pages/EditInvestment";
import InvestmentDetail from "./pages/InvestmentDetail";
import MyInvestments from "./pages/MyInvestments";
import NewInvestment from "./pages/NewInvestment";
import PropertyWorkspacePage from "./pages/PropertyWorkspacePage";
import TasksPage from "./pages/TasksPage";
import VendorsPage from "./pages/VendorsPage";
import AccountCenter from "./pages/AccountCenter";
import PlatformManagerPage from "./pages/PlatformManagerPage";

import { AuthProvider } from "./context/AuthContext";

const parkedPublicPaths = [
  "/invite/:token",
  "/apply",
  "/apply/:unitId",
  "/apply/success",
];

const parkedProtectedPaths = [
  "/tenant-dashboard",
  "/tools",
  "/properties",
  "/management",
  "/management/:propertyId",
  "/management/leases/:leaseId",
  "/management/units/:unitId/listing",
  "/applications",
  "/applications/send",
  "/applications/:id",
];

const ProtectedLayoutRoute = ({ children }) => (
  <ProtectedRoute>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

const LeadsRedirectRoute = () => (
  <ProtectedRoute>
    <Navigate to="/leads" replace />
  </ProtectedRoute>
);

const LegacyInvestmentDetailRedirect = () => {
  const { id } = useParams();

  return (
    <ProtectedRoute>
      <Navigate to={`/project-management/${encodeURIComponent(id)}`} replace />
    </ProtectedRoute>
  );
};

const LegacyInvestmentEditRedirect = () => {
  const { id } = useParams();

  return (
    <ProtectedRoute>
      <Navigate to={`/project-management/${encodeURIComponent(id)}/edit`} replace />
    </ProtectedRoute>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            style: {
              borderRadius: "16px",
              border: "1px solid rgba(76, 60, 45, 0.08)",
              background: "rgba(255, 255, 255, 0.94)",
              color: "#2f251d",
              padding: "12px 14px",
              boxShadow: "0 10px 24px rgba(62, 44, 30, 0.08)",
            },
          }}
        />

        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login-continue" element={<LoginContinuePage />} />
          <Route path="/signup" element={<SignupPage />} />
          {parkedPublicPaths.map((path) => (
            <Route key={path} path={path} element={<Navigate to="/" replace />} />
          ))}

          <Route path="/dashboard" element={<LeadsRedirectRoute />} />

          <Route
            path="/leads"
            element={
              <ProtectedLayoutRoute>
                <LeadsPage />
              </ProtectedLayoutRoute>
            }
          />

          <Route
            path="/leads/:id"
            element={
              <ProtectedLayoutRoute>
                <LeadDetailPage />
              </ProtectedLayoutRoute>
            }
          />

          <Route
            path="/comps-report"
            element={
              <ProtectedLayoutRoute>
                <CompsReportPage />
              </ProtectedLayoutRoute>
            }
          />

          <Route
            path="/comps"
            element={
              <ProtectedRoute>
                <Navigate to="/comps-report" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/comps-tool"
            element={
              <ProtectedRoute>
                <Navigate to="/comps-report" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks"
            element={
              <ProtectedLayoutRoute>
                <TasksPage />
              </ProtectedLayoutRoute>
            }
          />

          <Route
            path="/vendors"
            element={
              <ProtectedLayoutRoute>
                <VendorsPage />
              </ProtectedLayoutRoute>
            }
          />

          <Route
            path="/properties/new"
            element={
              <ProtectedLayoutRoute>
                <CreatePropertyPage />
              </ProtectedLayoutRoute>
            }
          />

          <Route
            path="/project-management"
            element={
              <ProtectedLayoutRoute>
                <MyInvestments />
              </ProtectedLayoutRoute>
            }
          />

          <Route
            path="/project-management/new"
            element={
              <ProtectedLayoutRoute>
                <NewInvestment />
              </ProtectedLayoutRoute>
            }
          />

          <Route
            path="/project-management/:id"
            element={
              <ProtectedLayoutRoute>
                <InvestmentDetail />
              </ProtectedLayoutRoute>
            }
          />

          <Route
            path="/project-management/:id/edit"
            element={
              <ProtectedLayoutRoute>
                <EditInvestment />
              </ProtectedLayoutRoute>
            }
          />

          <Route
            path="/investments"
            element={
              <ProtectedRoute>
                <Navigate to="/project-management" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/investments/new"
            element={
              <ProtectedRoute>
                <Navigate to="/project-management/new" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/investments/:id"
            element={<LegacyInvestmentDetailRedirect />}
          />

          <Route
            path="/investments/:id/edit"
            element={<LegacyInvestmentEditRedirect />}
          />

          <Route
            path="/properties/:propertyKey"
            element={
              <ProtectedLayoutRoute>
                <PropertyWorkspacePage />
              </ProtectedLayoutRoute>
            }
          />

          <Route
            path="/account"
            element={
              <ProtectedLayoutRoute>
                <AccountCenter />
              </ProtectedLayoutRoute>
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

          {parkedProtectedPaths.map((path) => (
            <Route key={path} path={path} element={<LeadsRedirectRoute />} />
          ))}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
