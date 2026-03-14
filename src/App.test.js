import { render, screen } from "@testing-library/react";

import App from "./App";

jest.mock(
  "react-router-dom",
  () => {
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

        return routeParts.every(
          (part, index) => part.startsWith(":") || part === currentParts[index]
        );
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
  },
  { virtual: true }
);

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
jest.mock("./components/PlatformManagerRoute", () => ({ children }) => children);

jest.mock("./pages/Homepage", () => () => <div>Homepage screen</div>);
jest.mock("./pages/LoginPage", () => () => <div>Workspace login screen</div>);
jest.mock("./pages/LoginContinuePage", () => () => <div>Login continue screen</div>);
jest.mock("./pages/SignupPage", () => () => <div>Signup screen</div>);
jest.mock("./pages/LeadsPage", () => () => <div>Leads screen</div>);
jest.mock("./pages/LeadDetailPage", () => () => <div>Lead detail screen</div>);
jest.mock("./pages/TasksPage", () => () => <div>Tasks screen</div>);
jest.mock("./pages/CreatePropertyPage", () => () => <div>Create property screen</div>);
jest.mock("./pages/PropertyWorkspacePage", () => () => <div>Property workspace screen</div>);
jest.mock("./pages/AccountCenter", () => () => <div>Account center screen</div>);
jest.mock("./pages/PlatformManagerPage", () => () => <div>Platform manager screen</div>);

describe("App routes", () => {
  const renderAtPath = (path) => {
    window.history.pushState({}, "", path);
    return render(<App />);
  };

  test("renders the homepage at the root route", () => {
    renderAtPath("/");

    expect(screen.getByText("Homepage screen")).toBeInTheDocument();
  });

  test("renders the workspace login route", () => {
    renderAtPath("/login");

    expect(screen.getByText("Workspace login screen")).toBeInTheDocument();
  });

  test("redirects dashboard traffic into leads", () => {
    renderAtPath("/dashboard");

    expect(screen.getByText("Navigate:/leads")).toBeInTheDocument();
  });

  test("renders the leads workspace inside the dashboard layout", () => {
    renderAtPath("/leads");

    expect(screen.getByTestId("dashboard-layout")).toBeInTheDocument();
    expect(screen.getByText("Leads screen")).toBeInTheDocument();
  });

  test("renders the tasks workspace inside the dashboard layout", () => {
    renderAtPath("/tasks");

    expect(screen.getByTestId("dashboard-layout")).toBeInTheDocument();
    expect(screen.getByText("Tasks screen")).toBeInTheDocument();
  });

  test("renders the add property route inside the dashboard layout", () => {
    renderAtPath("/properties/new");

    expect(screen.getByTestId("dashboard-layout")).toBeInTheDocument();
    expect(screen.getByText("Create property screen")).toBeInTheDocument();
  });

  test("redirects parked protected feature routes into leads", () => {
    renderAtPath("/management");

    expect(screen.getByText("Navigate:/leads")).toBeInTheDocument();
  });

  test("renders property workspace routes when opened directly", () => {
    renderAtPath("/properties/property-123");

    expect(screen.getByText("Property workspace screen")).toBeInTheDocument();
  });

  test("redirects unknown routes back to the homepage", () => {
    renderAtPath("/unknown");

    expect(screen.getByText("Navigate:/")).toBeInTheDocument();
  });
});
