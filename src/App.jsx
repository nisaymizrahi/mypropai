import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import DashboardLayout from "./components/DashboardLayout";
import PlatformManagerRoute from "./components/PlatformManagerRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import LoginContinuePage from "./pages/LoginContinuePage";
import SignupPage from "./pages/SignupPage";
import Homepage from "./pages/Homepage";
import LeadsPage from "./pages/LeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import CreatePropertyPage from "./pages/CreatePropertyPage";
import PropertyWorkspacePage from "./pages/PropertyWorkspacePage";
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
  "/comps",
  "/comps-tool",
  "/properties",
  "/management",
  "/management/:propertyId",
  "/management/leases/:leaseId",
  "/management/units/:unitId/listing",
  "/applications",
  "/applications/send",
  "/applications/:id",
  "/investments",
  "/investments/new",
  "/investments/:id",
  "/investments/:id/edit",
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
            path="/properties/new"
            element={
              <ProtectedLayoutRoute>
                <CreatePropertyPage />
              </ProtectedLayoutRoute>
            }
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
