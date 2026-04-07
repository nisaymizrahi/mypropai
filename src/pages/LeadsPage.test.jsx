import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LeadsPage from "./LeadsPage";

const getLeads = vi.fn();
const updateLead = vi.fn();

vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }) => <div>{children}</div>,
  Droppable: ({ children, droppableId }) =>
    children(
      {
        innerRef: vi.fn(),
        droppableProps: { "data-droppable-id": droppableId },
      },
      {}
    ),
  Draggable: ({ children, draggableId }) =>
    children(
      {
        innerRef: vi.fn(),
        draggableProps: { "data-draggable-id": draggableId },
        dragHandleProps: {},
      },
      {}
    ),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../components/AISummaryCard", () => ({
  default: () => <div>AI summary</div>,
}));

vi.mock("../components/DashboardStatCard", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock("../components/DealCard", () => ({
  default: ({ lead }) => <div>{lead.address || "Deal card"}</div>,
}));

vi.mock("../components/DealScoreCard", () => ({
  default: () => <div>Deal score</div>,
}));

vi.mock("../utils/api", () => ({
  getLeads: (...args) => getLeads(...args),
  updateLead: (...args) => updateLead(...args),
}));

vi.mock("../utils/dealIntelligence", () => ({
  formatDealCompactCurrency: () => "$0",
  formatDealPercent: () => "0%",
  summarizeLeadPortfolio: (leads) => ({
    count: leads.length,
    analyses: [],
    featured: null,
    verdictCounts: {
      good: 0,
      medium: 0,
      bad: 0,
    },
    profitPool: 0,
  }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <LeadsPage />
    </MemoryRouter>
  );

describe("LeadsPage launch progress", () => {
  beforeEach(() => {
    getLeads.mockReset();
    updateLead.mockReset();
  });

  it("shows the page-level pipeline setup module when the workflow is incomplete", async () => {
    getLeads.mockResolvedValue([]);

    renderPage();

    const setupHeading = await screen.findByText("Pipeline setup");
    const setupCard = setupHeading.closest(".section-card");

    expect(setupCard).not.toBeNull();
    expect(within(setupCard).getByRole("button", { name: "Add first deal" })).toBeInTheDocument();
  });

  it("hides the pipeline setup module once launch progress is complete", async () => {
    getLeads.mockResolvedValue([
      {
        _id: "deal-1",
        address: "123 Main St",
        status: "Closed - Won",
        compsAnalysis: { score: 82 },
        property: { _id: "property-1" },
        inPropertyWorkspace: true,
      },
    ]);

    renderPage();

    await waitFor(() => expect(screen.getByText("Deals")).toBeInTheDocument());

    expect(screen.queryByText("Pipeline setup")).not.toBeInTheDocument();
  });
});
