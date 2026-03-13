import { render, screen } from "@testing-library/react";

import App from "./App";

jest.mock("react-router-dom", () => {
  const React = require("react");

  const BrowserRouter = ({ children }) => <>{children}</>;
  const Route = () => null;
  const Navigate = ({ to }) => <div>Navigate:{to}</div>;
  const normalizePath = (path) => path.replace(/\/+$/, "") || "/";
  const matchesPath = (routePath, currentPath) => {
    if (routePath === "*") {
      return true;
    }

    if (routePath.includes(":")) {
      const routeParts = normalizePath(routePath).split("/");
      const currentParts = normalizePath(currentPath).split("/");

      if (routeParts.length !== currentParts.length) {
        return false;
      }

      return routeParts.every((part, index) => part.startsWith(":") || part === currentParts[index]);
    }

    return normalizePath(routePath) === normalizePath(currentPath);
  };

  const Routes = ({ children }) => {
    const currentPath = globalThis.location.pathname;
    const routeChildren = React.Children.toArray(children);
    const match =
      routeChildren.find((child) => matchesPath(child.props.path, currentPath)) ||
      routeChildren.find((child) => child.props.path === "*");

    return match ? match.props.element : null;
  };

  return {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
  };
}, { virtual: true });

jest.mock("react-hot-toast", () => ({
  Toaster: () => null,
}));

jest.mock("./context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
}));

jest.mock("./components/DashboardLayout", () => ({ children }) => (
  <div data-testid="dashboard-layout">{children}</div>
));
jest.mock("./components/ProtectedRoute", () => ({ children }) => children);
jest.mock("./components/TenantProtectedRoute", () => ({ children }) => children);
jest.mock("./components/PlatformManagerRoute", () => ({ children }) => children);

jest.mock("./pages/Homepage", () => () => <div>Homepage screen</div>);
jest.mock("./pages/LoginPage", () => () => <div>Manager login screen</div>);
jest.mock("./pages/LoginContinuePage", () => () => <div>Login continue screen</div>);
jest.mock("./pages/SignupPage", () => () => <div>Signup screen</div>);
jest.mock("./pages/InvitePage", () => () => <div>Invite screen</div>);
jest.mock("./pages/TenantLoginPage", () => () => <div>Tenant login screen</div>);
jest.mock("./pages/ApplicationFormPage", () => () => <div>Application form screen</div>);
jest.mock("./pages/ApplicationSuccessPage", () => () => <div>Application success screen</div>);
jest.mock("./pages/TenantDashboard", () => () => <div>Tenant dashboard screen</div>);
jest.mock("./pages/DashboardPage", () => () => <div>Dashboard screen</div>);
jest.mock("./pages/AccountCenter", () => () => <div>Account screen</div>);
jest.mock("./pages/PlatformManagerPage", () => () => <div>Platform manager screen</div>);
jest.mock("./pages/FinancialToolsPage", () => () => <div>Financial tools screen</div>);
jest.mock("./pages/CompsPage", () => () => <div>Comps screen</div>);
jest.mock("./pages/CompsTool", () => () => <div>Comps tool screen</div>);
jest.mock("./pages/PropertiesPage", () => () => <div>Properties screen</div>);
jest.mock("./pages/PropertyWorkspacePage", () => () => <div>Property workspace screen</div>);
jest.mock("./pages/LeadsPage", () => () => <div>Leads screen</div>);
jest.mock("./pages/LeadDetailPage", () => () => <div>Lead detail screen</div>);
jest.mock("./pages/ManagementDashboard", () => () => <div>Management screen</div>);
jest.mock("./pages/ManagedPropertyDetail", () => () => <div>Managed property detail screen</div>);
jest.mock("./pages/LeaseDetailPage", () => () => <div>Lease detail screen</div>);
jest.mock("./pages/UnitListingPage", () => () => <div>Unit listing screen</div>);
jest.mock("./pages/ApplicationsPage", () => () => <div>Applications screen</div>);
jest.mock("./pages/SendApplicationPage", () => () => <div>Send application screen</div>);
jest.mock("./pages/ApplicationDetailPage", () => () => <div>Application detail screen</div>);
jest.mock("./pages/MyInvestments", () => () => <div>Investments screen</div>);
jest.mock("./pages/NewInvestment", () => () => <div>New investment screen</div>);
jest.mock("./pages/InvestmentDetail", () => () => <div>Investment detail screen</div>);
jest.mock("./pages/EditInvestment", () => () => <div>Edit investment screen</div>);

describe("App routes", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  test("renders the public homepage at the root route", () => {
    render(<App />);

    expect(screen.getByText("Homepage screen")).toBeInTheDocument();
  });

  test("renders the manager login route", () => {
    window.history.pushState({}, "", "/login");

    render(<App />);

    expect(screen.getByText("Manager login screen")).toBeInTheDocument();
  });
});
