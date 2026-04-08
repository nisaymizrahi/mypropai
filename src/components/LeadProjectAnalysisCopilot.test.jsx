import React from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import LeadProjectAnalysisCopilot from "./LeadProjectAnalysisCopilot";

const askLeadProjectAnalysisCopilot = vi.fn();

vi.mock("../utils/api", () => ({
  askLeadProjectAnalysisCopilot: (...args) => askLeadProjectAnalysisCopilot(...args),
}));

describe("LeadProjectAnalysisCopilot", () => {
  beforeEach(() => {
    askLeadProjectAnalysisCopilot.mockReset();
  });

  it("shows a local planning fallback when the backend route is unavailable", async () => {
    const error = new Error(
      "Project analysis assistant is not available on the server yet. Redeploy the backend and refresh the app."
    );
    error.status = 404;
    askLeadProjectAnalysisCopilot.mockRejectedValueOnce(error);

    render(
      <LeadProjectAnalysisCopilot
        leadId="lead-1"
        leadAddress="123 Main St"
        leadSnapshot={{
          sellerAskingPrice: 300000,
          targetOffer: 275000,
        }}
        scenarios={[
          {
            scenarioId: "scenario-1",
            label: "Moderate",
            rehabEstimate: 55000,
            arv: 420000,
            holdingMonths: 6,
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /what scenario looks safest right now/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/The live project analysis assistant is temporarily unavailable/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Best current draft: Moderate\./i)).toBeInTheDocument();
    expect(screen.getByText(/Refresh after the backend deploy completes/i)).toBeInTheDocument();
  });
});
