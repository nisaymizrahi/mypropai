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

jest.mock("./components/PlatformShell", () => ({ children }) => (
  <div data-testid="platform-shell">{children}</div>
));
jest.mock("./components/ProtectedRoute", () => ({ children }) => children);

jest.mock("./pages/PlatformLandingPage", () => () => <div>Platform landing screen</div>);
jest.mock("./pages/PlatformWorkspacePage", () => () => <div>Platform workspace screen</div>);
jest.mock("./pages/LoginPage", () => () => <div>Workspace login screen</div>);
jest.mock("./pages/LoginContinuePage", () => () => <div>Login continue screen</div>);
jest.mock("./pages/SignupPage", () => () => <div>Signup screen</div>);

describe("App routes", () => {
  const renderAtPath = (path) => {
    window.history.pushState({}, "", path);
    return render(<App />);
  };

  test("renders the clean-slate landing page at the root route", () => {
    renderAtPath("/");

    expect(screen.getByText("Platform landing screen")).toBeInTheDocument();
  });

  test("renders the workspace login route", () => {
    renderAtPath("/login");

    expect(screen.getByText("Workspace login screen")).toBeInTheDocument();
  });

  test("renders the blank workspace route", () => {
    renderAtPath("/dashboard");

    expect(screen.getByTestId("platform-shell")).toBeInTheDocument();
    expect(screen.getByText("Platform workspace screen")).toBeInTheDocument();
  });

  test("redirects a parked public feature route back to the landing page", () => {
    renderAtPath("/apply");

    expect(screen.getByText("Navigate:/")).toBeInTheDocument();
  });

  test("redirects a parked protected feature route into the blank workspace", () => {
    renderAtPath("/management");

    expect(screen.getByText("Navigate:/dashboard")).toBeInTheDocument();
  });

  test("redirects old property workspace paths into the blank workspace", () => {
    renderAtPath("/properties/property-123");

    expect(screen.getByText("Navigate:/dashboard")).toBeInTheDocument();
  });

  test("redirects unknown routes back to the landing page", () => {
    renderAtPath("/unknown");

    expect(screen.getByText("Navigate:/")).toBeInTheDocument();
  });
});
