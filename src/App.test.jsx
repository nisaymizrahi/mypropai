import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import App from "./App";

vi.mock(
  "react-router-dom",
  () => {
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

    const useParams = () => {
      const currentParts = normalizePath(globalThis.location.pathname)
        .split("/")
        .filter(Boolean);

      if (currentParts[0] === "management" && currentParts[1] && currentParts[1] !== "leases" && currentParts[1] !== "units") {
        return { propertyId: currentParts[1] };
      }

      if ((currentParts[0] === "project-management" || currentParts[0] === "investments") && currentParts[1]) {
        return { id: currentParts[1] };
      }

      return {};
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
      useLocation: () => ({
        pathname: globalThis.location.pathname,
        search: globalThis.location.search,
        hash: globalThis.location.hash,
      }),
      useParams,
    };
  },
);

vi.mock("react-hot-toast", () => ({
  Toaster: () => null,
}));

vi.mock("./context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
}));

vi.mock("./components/DashboardLayout", () => ({
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));
vi.mock("./components/ProtectedRoute", () => ({
  default: ({ children }) => children,
}));
vi.mock("./components/PlatformManagerRoute", () => ({
  default: ({ children }) => children,
}));

vi.mock("./pages/Homepage", () => ({ default: () => <div>Homepage screen</div> }));
vi.mock("./pages/LoginPage", () => ({ default: () => <div>Workspace login screen</div> }));
vi.mock("./pages/LoginContinuePage", () => ({ default: () => <div>Login continue screen</div> }));
vi.mock("./pages/SignupPage", () => ({ default: () => <div>Signup screen</div> }));
vi.mock("./pages/CompsReportPage", () => ({ default: () => <div>Comps report screen</div> }));
vi.mock("./pages/LeadsPage", () => ({ default: () => <div>Leads screen</div> }));
vi.mock("./pages/LeadDetailPage", () => ({ default: () => <div>Lead detail screen</div> }));
vi.mock("./pages/TasksPage", () => ({ default: () => <div>Tasks screen</div> }));
vi.mock("./pages/MasterCalendarPage", () => ({ default: () => <div>Master calendar screen</div> }));
vi.mock("./pages/VendorsPage", () => ({ default: () => <div>Vendors screen</div> }));
vi.mock("./pages/CreatePropertyPage", () => ({ default: () => <div>Create property screen</div> }));
vi.mock("./pages/PropertyWorkspacePage", () => ({ default: () => <div>Property workspace screen</div> }));
vi.mock("./pages/AccountCenter", () => ({ default: () => <div>Account center screen</div> }));
vi.mock("./pages/PlatformManagerPage", () => ({ default: () => <div>Platform manager screen</div> }));

describe("App routes", () => {
  const renderAtPath = (path) => {
    window.history.pushState({}, "", path);
    return render(<App />);
  };

  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  test("renders the homepage at the root route", async () => {
    renderAtPath("/");

    expect(await screen.findByText("Homepage screen")).toBeInTheDocument();
  });

  test("renders the workspace login route", async () => {
    renderAtPath("/login");

    expect(await screen.findByText("Workspace login screen")).toBeInTheDocument();
  });

  test("redirects dashboard traffic into leads", () => {
    renderAtPath("/dashboard");

    expect(screen.getByText("Navigate:/leads")).toBeInTheDocument();
  });

  test("renders the leads workspace inside the dashboard layout", async () => {
    renderAtPath("/leads");

    expect(await screen.findByTestId("dashboard-layout")).toBeInTheDocument();
    expect(await screen.findByText("Leads screen")).toBeInTheDocument();
  });

  test("renders the tasks workspace inside the dashboard layout", async () => {
    renderAtPath("/tasks");

    expect(await screen.findByTestId("dashboard-layout")).toBeInTheDocument();
    expect(await screen.findByText("Tasks screen")).toBeInTheDocument();
  });

  test("renders the master calendar inside the dashboard layout", async () => {
    renderAtPath("/master-calendar");

    expect(await screen.findByTestId("dashboard-layout")).toBeInTheDocument();
    expect(await screen.findByText("Master calendar screen")).toBeInTheDocument();
  });

  test("renders the comps report workspace inside the dashboard layout", async () => {
    renderAtPath("/comps-report");

    expect(await screen.findByTestId("dashboard-layout")).toBeInTheDocument();
    expect(await screen.findByText("Comps report screen")).toBeInTheDocument();
  });

  test("renders the vendors workspace inside the dashboard layout", async () => {
    renderAtPath("/vendors");

    expect(await screen.findByTestId("dashboard-layout")).toBeInTheDocument();
    expect(await screen.findByText("Vendors screen")).toBeInTheDocument();
  });

  test("renders the add property route inside the dashboard layout", async () => {
    renderAtPath("/properties/new");

    expect(await screen.findByTestId("dashboard-layout")).toBeInTheDocument();
    expect(await screen.findByText("Create property screen")).toBeInTheDocument();
  });

  test("redirects retired project workspace routes away from the old hub", () => {
    renderAtPath("/project-management");

    expect(screen.getByText("Navigate:/leads")).toBeInTheDocument();
  });

  test("redirects retired project creation routes into add property", () => {
    renderAtPath("/project-management/new");

    expect(screen.getByText("Navigate:/properties/new")).toBeInTheDocument();
  });

  test("redirects retired management routes into the property hub", () => {
    renderAtPath("/management");

    expect(screen.getByText("Navigate:/properties")).toBeInTheDocument();
  });

  test("redirects retired management property routes into the matching property workspace", () => {
    renderAtPath("/management/property-123");

    expect(screen.getByText("Navigate:/properties/property-123")).toBeInTheDocument();
  });

  test("renders property workspace routes when opened directly", async () => {
    renderAtPath("/properties/property-123");

    expect(await screen.findByText("Property workspace screen")).toBeInTheDocument();
  });

  test("resets scroll position when the route changes", async () => {
    renderAtPath("/properties/property-123/home");

    expect(await screen.findByText("Property workspace screen")).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
  });

  test("redirects unknown routes back to the homepage", () => {
    renderAtPath("/unknown");

    expect(screen.getByText("Navigate:/")).toBeInTheDocument();
  });
});
