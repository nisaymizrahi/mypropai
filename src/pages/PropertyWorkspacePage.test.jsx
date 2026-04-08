import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";

import PropertyWorkspacePage from "./PropertyWorkspacePage";

const apiMocks = vi.hoisted(() => ({
  analyzeFullPropertyReport: vi.fn(),
  analyzeLeadComps: vi.fn(),
  createBudgetItem: vi.fn(),
  createOneTimeCheckout: vi.fn(),
  createProjectUpdate: vi.fn(),
  createPropertyWorkspace: vi.fn(),
  deleteProjectUpdate: vi.fn(),
  getBidsForLead: vi.fn(),
  getBidsForProject: vi.fn(),
  getBudgetItems: vi.fn(),
  getBillingAccess: vi.fn(),
  getExpenses: vi.fn(),
  getInvestment: vi.fn(),
  getLeadDetails: vi.fn(),
  getProjectDocuments: vi.fn(),
  getPropertyReports: vi.fn(),
  getProjectReceipts: vi.fn(),
  getProjectUpdates: vi.fn(),
  getPropertyWorkspace: vi.fn(),
  getTaskList: vi.fn(),
  getVendors: vi.fn(),
  previewLeadProperty: vi.fn(),
  saveCompsReport: vi.fn(),
  updateLead: vi.fn(),
  updateProjectUpdate: vi.fn(),
  updatePropertyWorkspace: vi.fn(),
}));

vi.mock("../utils/api", () => apiMocks);

vi.mock("../utils/locationSearch", () => ({
  getLocationProviderName: vi.fn(() => "Mapbox"),
  searchAddressSuggestions: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../hooks/useSubscriptionCheckoutConsent", () => ({
  default: () => ({
    openSubscriptionConsent: vi.fn(),
    isStartingSubscription: false,
    subscriptionConsentDialog: null,
  }),
}));

vi.mock("../components/AddBudgetItemModal", () => ({
  default: () => null,
}));
vi.mock("../components/AddExpenseModal", () => ({
  default: () => null,
}));
vi.mock("../components/AddVendorModal", () => ({
  default: () => null,
}));
vi.mock("../components/LeadRenovationTab", () => ({
  buildRenovationForm: () => ({ items: [] }),
}));
vi.mock("../components/ProjectUpdateComposerModal", () => ({
  default: () => null,
}));
vi.mock("../components/PropertyDetailsDrawer", () => ({
  default: () => null,
}));
vi.mock("../components/PropertyCopilotPanel", () => ({
  default: () => null,
}));
vi.mock("../components/PropertyFinancePanel", () => ({
  __esModule: true,
  default: () => <div>Property finance panel</div>,
  EmptyAcquisitionState: () => <div>Acquisition setup state</div>,
}));
vi.mock("../components/PropertyWorkspaceSettingsPanel", () => ({
  default: () => <div>Workspace settings</div>,
}));
vi.mock("../components/TaskFormModal", () => ({
  default: () => null,
}));
vi.mock("../components/WorkspaceQuickAddMenu", () => ({
  default: () => null,
}));
vi.mock("../components/propertyWorkspace/WorkspacePagePrimitives", () => ({
  LoadingStateCard: ({ label }) => <div>{label}</div>,
  SetupStateCard: ({ title, description }) => (
    <div>
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));
vi.mock("../components/propertyWorkspace/PropertyWorkspaceHomePage", () => ({
  default: () => <div>Mock Home Page</div>,
}));
vi.mock("../components/propertyWorkspace/PropertyWorkspaceBudgetPage", () => ({
  default: () => <div>Mock Budget Page</div>,
}));
vi.mock("../components/propertyWorkspace/PropertyWorkspaceExecutionPage", () => ({
  default: () => <div>Mock Execution Page</div>,
}));
vi.mock("../components/propertyWorkspace/PropertyWorkspaceBidsPage", () => ({
  default: () => <div>Mock Bids Page</div>,
}));
vi.mock("../components/propertyWorkspace/PropertyWorkspaceFilesPage", () => ({
  default: () => <div>Mock Files Page</div>,
}));
vi.mock("../components/propertyWorkspace/PropertyWorkspaceDealPage", () => ({
  default: () => <div>Mock Deal Page</div>,
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const propertyFixture = {
  propertyKey: "project-alpha",
  title: "123 Main St",
  createdAt: "2026-04-01T12:00:00.000Z",
  updatedAt: "2026-04-02T12:00:00.000Z",
  sharedProfile: {
    addressLine1: "123 Main St",
    city: "Dallas",
    state: "TX",
    zipCode: "75001",
    latitude: null,
    longitude: null,
    propertyType: "single-family",
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1450,
    lotSize: null,
    yearBuilt: 1988,
    unitCount: null,
    listingStatus: "For Sale",
    sellerAskingPrice: 245000,
  },
  workspaces: {},
};

describe("PropertyWorkspacePage", () => {
  beforeEach(() => {
    apiMocks.getPropertyWorkspace.mockResolvedValue(propertyFixture);
    apiMocks.getTaskList.mockResolvedValue([]);
    apiMocks.getProjectUpdates.mockRejectedValue(new Error("Failed to load project updates"));
    apiMocks.getBillingAccess.mockResolvedValue(null);
  });

  it("renders the workspace after loading without triggering the hook-order crash", async () => {
    render(
      <MemoryRouter initialEntries={["/properties/project-alpha/overview/summary"]}>
        <Routes>
          <Route
            path="/properties/:propertyKey/:tab/:view"
            element={<PropertyWorkspacePage />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Loading project workspace...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Mock Home Page")).toBeInTheDocument();
    });

    expect(screen.queryByText("Failed to load project updates")).not.toBeInTheDocument();
  });
});
