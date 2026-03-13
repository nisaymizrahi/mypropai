import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import PlatformShell from "./components/PlatformShell";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import LoginContinuePage from "./pages/LoginContinuePage";
import SignupPage from "./pages/SignupPage";
import PlatformLandingPage from "./pages/PlatformLandingPage";
import PlatformWorkspacePage from "./pages/PlatformWorkspacePage";

import { AuthProvider } from "./context/AuthContext";

const parkedPublicPaths = [
  "/invite/:token",
  "/tenant-login",
  "/apply",
  "/apply/:unitId",
  "/apply/success",
];

const parkedProtectedPaths = [
  "/tenant-dashboard",
  "/account",
  "/platform-manager",
  "/tools",
  "/comps",
  "/comps-tool",
  "/properties",
  "/properties/new",
  "/properties/:propertyKey",
  "/leads",
  "/leads/:id",
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

const WorkspaceRoute = () => (
  <ProtectedRoute>
    <PlatformShell>
      <PlatformWorkspacePage />
    </PlatformShell>
  </ProtectedRoute>
);

const ParkedFeatureRoute = () => (
  <ProtectedRoute>
    <Navigate to="/dashboard" replace />
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
              borderRadius: "999px",
              border: "1px solid rgba(76, 60, 45, 0.08)",
              background: "rgba(255, 251, 245, 0.92)",
              color: "#2f251d",
              padding: "14px 18px",
              boxShadow: "0 18px 36px rgba(62, 44, 30, 0.12)",
            },
          }}
        />

        <Routes>
          <Route path="/" element={<PlatformLandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login-continue" element={<LoginContinuePage />} />
          <Route path="/signup" element={<SignupPage />} />
          {parkedPublicPaths.map((path) => (
            <Route key={path} path={path} element={<Navigate to="/" replace />} />
          ))}

          <Route path="/dashboard" element={<WorkspaceRoute />} />

          {parkedProtectedPaths.map((path) => (
            <Route key={path} path={path} element={<ParkedFeatureRoute />} />
          ))}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
