import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardLayout from "./DashboardLayout";

const getProperties = vi.fn();
const loadSidebarPreference = vi.fn();
const persistSidebarPreference = vi.fn();
const getSidebarOption = vi.fn();

vi.mock("./BrandLogo", () => ({
  default: ({ caption, compact }) => (
    <div>{compact ? "Fliprop compact" : `Fliprop ${caption || ""}`.trim()}</div>
  ),
}));

vi.mock("./CommandPalette", () => ({
  default: ({ isOpen }) => (isOpen ? <div>Command palette open</div> : null),
}));

vi.mock("./UserInfoBanner", () => ({
  default: () => <div data-testid="user-info-banner">User info</div>,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    stopImpersonation: vi.fn(),
    user: {
      name: "Nisa Mizrahi",
      email: "nisa@example.com",
      isPlatformManager: true,
    },
  }),
}));

vi.mock("../utils/api", () => ({
  getProperties: (...args) => getProperties(...args),
}));

vi.mock("../utils/sidebarPreferences", () => ({
  SIDEBAR_PREFERENCE_EVENT: "fliprop:sidebar-preference-change",
  getSidebarOption: (...args) => getSidebarOption(...args),
  loadSidebarPreference: (...args) => loadSidebarPreference(...args),
  persistSidebarPreference: (...args) => persistSidebarPreference(...args),
}));

const renderLayout = (path = "/leads") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <DashboardLayout>
              <div>Workspace body</div>
            </DashboardLayout>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe("DashboardLayout", () => {
  beforeEach(() => {
    loadSidebarPreference.mockReset();
    persistSidebarPreference.mockReset();
    getSidebarOption.mockReset();
    getProperties.mockReset();

    loadSidebarPreference.mockReturnValue("expanded");
    persistSidebarPreference.mockImplementation((value) => ({ value }));
    getSidebarOption.mockImplementation((value) => ({
      value: value === "collapsed" ? "collapsed" : "expanded",
    }));

    getProperties.mockResolvedValue([
      {
        propertyKey: "maple",
        title: "1248 Maple St",
        updatedAt: "2026-04-05T10:00:00.000Z",
        sharedProfile: { propertyType: "Single Family" },
        workspaces: { pipeline: { status: "Under Contract" } },
      },
      {
        propertyKey: "oak",
        title: "89 Oak Ave",
        updatedAt: "2026-04-06T10:00:00.000Z",
        sharedProfile: { propertyType: "Duplex" },
        workspaces: { pipeline: { status: "Potential" } },
      },
      {
        propertyKey: "pine",
        title: "442 Pine Ct",
        updatedAt: "2026-04-04T10:00:00.000Z",
        sharedProfile: { propertyType: "Triplex" },
        workspaces: { pipeline: { status: "Analyzing" } },
      },
      {
        propertyKey: "cedar",
        title: "80 Cedar Ln",
        updatedAt: "2026-04-03T10:00:00.000Z",
        sharedProfile: { propertyType: "Townhome" },
        workspaces: { pipeline: { status: "Offer Made" } },
      },
      {
        propertyKey: "elm",
        title: "15 Elm Way",
        updatedAt: "2026-04-02T10:00:00.000Z",
        sharedProfile: { propertyType: "Single Family" },
        workspaces: { pipeline: { status: "Closed - Won" } },
      },
      {
        propertyKey: "birch",
        title: "11 Birch Blvd",
        updatedAt: "2026-04-01T10:00:00.000Z",
        sharedProfile: { propertyType: "Condo" },
        workspaces: { pipeline: { status: "Closed - Lost" } },
      },
    ]);
  });

  it("highlights the projects nav item for nested property workspace routes", async () => {
    renderLayout("/properties/maple/overview");

    await waitFor(() => expect(getProperties).toHaveBeenCalled());

    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pipeline" })).not.toHaveAttribute("aria-current");
  });

  it("opens the mounted command palette from the sidebar search trigger", async () => {
    renderLayout("/leads");

    fireEvent.click(screen.getByRole("button", { name: /jump to property, deal, or task/i }));

    expect(await screen.findByText("Command palette open")).toBeInTheDocument();
  });

  it("shows the five most recent deals in descending freshness order", async () => {
    renderLayout("/leads");

    const recentDealsSection = await screen.findByLabelText("Recent deals");
    const links = within(recentDealsSection).getAllByRole("link");

    expect(links).toHaveLength(5);
    expect(links.map((link) => link.textContent.replace(/\s+/g, " ").trim())).toEqual([
      "89 Oak AvePotential • Duplex",
      "1248 Maple StUnder Contract • Single Family",
      "442 Pine CtAnalyzing • Triplex",
      "80 Cedar LnOffer Made • Townhome",
      "15 Elm WayClosed - Won • Single Family",
    ]);
  });

  it("hides recent deals when the shell starts collapsed", async () => {
    loadSidebarPreference.mockReturnValueOnce("collapsed");

    renderLayout("/leads");

    await waitFor(() => expect(getProperties).toHaveBeenCalled());

    expect(screen.queryByLabelText("Recent deals")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pipeline" })).toHaveAttribute("aria-current", "page");
  });
});
