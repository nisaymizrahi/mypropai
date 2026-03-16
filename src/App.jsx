import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AppShellErrorBoundary from "./components/AppShellErrorBoundary";
import BrandLogo from "./components/BrandLogo";
import PlatformManagerRoute from "./components/PlatformManagerRoute";
import ProtectedRoute from "./components/ProtectedRoute";

import { AuthProvider } from "./context/AuthContext";
import { getInvestment } from "./utils/api";
import { buildPropertyWorkspacePath } from "./utils/propertyWorkspaceNavigation";

const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const Homepage = lazy(() => import("./pages/Homepage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const LoginContinuePage = lazy(() => import("./pages/LoginContinuePage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const CompsReportPage = lazy(() => import("./pages/CompsReportPage"));
const LeadsPage = lazy(() => import("./pages/LeadsPage"));
const LeadDetailPage = lazy(() => import("./pages/LeadDetailPage"));
const CreatePropertyPage = lazy(() => import("./pages/CreatePropertyPage"));
const PropertiesPage = lazy(() => import("./pages/PropertiesPage"));
const PropertyWorkspacePage = lazy(() => import("./pages/PropertyWorkspacePage"));
const MasterCalendarPage = lazy(() => import("./pages/MasterCalendarPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const VendorsPage = lazy(() => import("./pages/VendorsPage"));
const AccountCenter = lazy(() => import("./pages/AccountCenter"));
const PlatformManagerPage = lazy(() => import("./pages/PlatformManagerPage"));

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

const RouteLoadingShell = ({ message = "Loading workspace..." }) => (
  <div className="public-shell flex min-h-screen items-center justify-center px-4 py-8 text-ink-900">
    <div className="surface-panel flex w-full max-w-md flex-col items-center px-7 py-8 text-center">
      <BrandLogo imageClassName="h-12 max-w-[120px]" />
      <div className="loading-ring mt-5 h-10 w-10 animate-spin rounded-full" />
      <h1 className="mt-5 font-display text-[2rem] leading-none text-ink-900">Just a moment</h1>
      <p className="mt-3 text-sm leading-6 text-ink-600">{message}</p>
    </div>
  </div>
);

const PublicRoute = ({ children }) => (
  <Suspense fallback={<RouteLoadingShell message="Loading this page..." />}>{children}</Suspense>
);

const ProtectedLayoutRoute = ({ children }) => (
  <ProtectedRoute>
    <Suspense fallback={<RouteLoadingShell message="Opening your workspace..." />}>
      <DashboardLayout>{children}</DashboardLayout>
    </Suspense>
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
              ? buildPropertyWorkspacePath(propertyWorkspaceId)
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

        <AppShellErrorBoundary>
          <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Homepage />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/login-continue"
              element={
                <PublicRoute>
                  <LoginContinuePage />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignupPage />
                </PublicRoute>
              }
            />
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
              path="/master-calendar"
              element={
                <ProtectedLayoutRoute>
                  <MasterCalendarPage />
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

            <Route path="/project-management" element={<LeadsRedirectRoute />} />

            <Route
              path="/project-management/new"
              element={
                <ProtectedRoute>
                  <Navigate to="/properties/new" replace />
                </ProtectedRoute>
              }
            />

            <Route path="/project-management/:id" element={<LegacyProjectWorkspaceRedirect />} />

            <Route
              path="/project-management/:id/edit"
              element={<LegacyProjectWorkspaceRedirect />}
            />

            <Route path="/investments" element={<LeadsRedirectRoute />} />

            <Route
              path="/investments/new"
              element={
                <ProtectedRoute>
                  <Navigate to="/properties/new" replace />
                </ProtectedRoute>
              }
            />

            <Route path="/investments/:id" element={<LegacyProjectWorkspaceRedirect />} />

            <Route path="/investments/:id/edit" element={<LegacyProjectWorkspaceRedirect />} />

            <Route
              path="/properties/:propertyKey"
              element={
                <ProtectedLayoutRoute>
                  <PropertyWorkspacePage />
                </ProtectedLayoutRoute>
              }
            />

            <Route
              path="/properties/:propertyKey/:category/:section"
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
                  <Suspense fallback={<RouteLoadingShell message="Opening platform manager..." />}>
                    <DashboardLayout>
                      <PlatformManagerPage />
                    </DashboardLayout>
                  </Suspense>
                </PlatformManagerRoute>
              }
            />

            {parkedProtectedPaths.map((path) => (
              <Route key={path} path={path} element={<LeadsRedirectRoute />} />
            ))}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShellErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;
