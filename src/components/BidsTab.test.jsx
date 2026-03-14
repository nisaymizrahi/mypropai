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
});
