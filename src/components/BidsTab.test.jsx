import React from "react";
import { render, screen } from "@testing-library/react";

import BidsTab from "./BidsTab";

jest.mock("../utils/api", () => ({
  deleteBid: jest.fn(),
  importBid: jest.fn(),
}));

describe("BidsTab", () => {
  it("renders safely with empty or malformed bid data", () => {
    render(
      <BidsTab
        leadId="lead-1"
        bids={[null, { _id: "bid-1", contractorName: "ACME", renovationAssignments: [null] }]}
        renovationItems={null}
      />
    );

    expect(screen.getByText("Bid management")).toBeInTheDocument();
    expect(screen.getByText("No renovation items yet")).toBeInTheDocument();
  });

  it("renders safely when nested legacy bid fields are objects", () => {
    render(
      <BidsTab
        leadId="lead-1"
        bids={[
          {
            _id: "bid-legacy",
            contractorName: { company: "ACME" },
            totalAmount: "15000",
            sourceFileName: { name: "quote.pdf" },
            items: [
              {
                description: { text: "Kitchen" },
                category: { name: "Interior" },
                cost: "8000",
              },
            ],
            renovationAssignments: [
              {
                renovationItemId: "kitchen",
                renovationItemName: { label: "Kitchen" },
                amount: "8000",
                scopeSummary: { summary: "Remodel" },
                matchedLineItems: [{ label: "Cabinets" }, "Counters"],
              },
            ],
          },
        ]}
        renovationItems={[
          {
            itemId: "kitchen",
            name: { title: "Kitchen" },
            category: { value: "kitchen" },
            budget: "10000",
            scopeDescription: { summary: "Update kitchen" },
          },
        ]}
      />
    );

    expect(screen.getByText("Bid management")).toBeInTheDocument();
    expect(screen.getByText("Untitled item")).toBeInTheDocument();
    expect(screen.queryByText("Bid management needs a refresh")).not.toBeInTheDocument();
  });

  it("renders renovation items without crashing when no quotes are matched yet", () => {
    render(
      <BidsTab
        leadId="lead-1"
        bids={[]}
        renovationItems={[
          {
            itemId: "kitchen",
            name: "Kitchen",
            category: "kitchen",
            budget: 10000,
            status: "planning",
            scopeDescription: "New cabinets and counters.",
          },
        ]}
      />
    );

    expect(screen.getByText("Kitchen")).toBeInTheDocument();
    expect(screen.getByText("No contractor quote is matched to this item yet.")).toBeInTheDocument();
    expect(screen.queryByText("Bid management needs a refresh")).not.toBeInTheDocument();
  });
});
