import React, { useEffect, useState } from "react";
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
import PropertiesPage from "./pages/PropertiesPage";
import PropertyWorkspacePage from "./pages/PropertyWorkspacePage";
import TasksPage from "./pages/TasksPage";
import VendorsPage from "./pages/VendorsPage";
import AccountCenter from "./pages/AccountCenter";
import PlatformManagerPage from "./pages/PlatformManagerPage";

import { AuthProvider } from "./context/AuthContext";
import { getInvestment } from "./utils/api";

const parkedPublicPaths = [
  "/invite/:token",
  "/apply",
  "/apply/:unitId",
  "/apply/success",
];

const parkedProtectedPaths = [
  "/tenant-dashboard",
  "/tools",
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

const LegacyProjectWorkspaceRedirect = () => {
  const { id } = useParams();
  const [target, setTarget] = useState("");

  useEffect(() => {
    let isMounted = true;

    const resolveTarget = async () => {
      if (!id) {
        if (isMounted) {
          setTarget("/leads");
        }
        return;
      }

      try {
        const investment = await getInvestment(id);
        const propertyWorkspaceId =
          typeof investment?.property === "object"
            ? investment.property?._id
            : investment?.property;

        if (isMounted) {
          setTarget(
            propertyWorkspaceId
              ? `/properties/${encodeURIComponent(propertyWorkspaceId)}`
              : "/leads"
          );
        }
      } catch (error) {
        if (isMounted) {
          setTarget("/leads");
        }
      }
    };

    resolveTarget();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <ProtectedRoute>
      {target ? <Navigate to={target} replace /> : null}
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
            path="/properties"
            element={
              <ProtectedLayoutRoute>
                <PropertiesPage />
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
            element={<LeadsRedirectRoute />}
          />

          <Route
            path="/project-management/new"
            element={
              <ProtectedRoute>
                <Navigate to="/properties/new" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/project-management/:id"
            element={<LegacyProjectWorkspaceRedirect />}
          />

          <Route
            path="/project-management/:id/edit"
            element={<LegacyProjectWorkspaceRedirect />}
          />

          <Route
            path="/investments"
            element={<LeadsRedirectRoute />}
          />

          <Route
            path="/investments/new"
            element={
              <ProtectedRoute>
                <Navigate to="/properties/new" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/investments/:id"
            element={<LegacyProjectWorkspaceRedirect />}
          />

          <Route
            path="/investments/:id/edit"
            element={<LegacyProjectWorkspaceRedirect />}
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
