import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Homepage from "./Homepage";

vi.mock("../components/MarketingLayout", () => ({
  default: ({ children }) => <div data-testid="marketing-layout">{children}</div>,
}));

vi.mock("../components/Seo", () => ({
  default: () => null,
}));

vi.mock("../components/AISummaryCard", () => ({
  default: ({ headline }) => <div>{headline}</div>,
}));

vi.mock("../components/DealScoreCard", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock("../utils/dealIntelligence", () => ({
  DEAL_ASSET_PATHS: { marketing: { hero: "/hero.png" } },
  formatDealCompactCurrency: () => "$74K",
  formatDealPercent: () => "18%",
  marketingDealShowcase: [
    {
      score: 82,
      verdict: "Strong",
      address: "1248 Maple St",
      roi: 0.18,
      profit: 74000,
      tone: { label: "Strong investor fit" },
      aiSummary: {
        headline: "Margin stays intact through a moderate rehab scope.",
        detail: "Detail",
        recommendation: "Proceed",
        confidenceLabel: "High",
        bullets: ["One", "Two"],
      },
      assetPaths: {
        score: "/score.png",
        verdict: "/verdict.png",
      },
    },
  ],
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <Homepage />
    </MemoryRouter>
  );

describe("Homepage", () => {
  it("renders the launch-focused hero, workflow, and final CTA", () => {
    renderPage();

    expect(
      screen.getByRole("heading", {
        name: /Fliprop keeps every deal moving from first look to active project/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See sample report" })).toHaveAttribute(
      "href",
      "/product#sample-report"
    );
    expect(screen.getAllByText("Free to start").length).toBeGreaterThan(0);
    expect(screen.getByText("Capture the lead")).toBeInTheDocument();
    expect(screen.getAllByText("Decision-ready analysis").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Bring your first lead into Fliprop/i })).toBeInTheDocument();
  });

  it("keeps pricing lightweight and points users to the full pricing page", () => {
    renderPage();

    expect(screen.getByText("Pricing preview")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See full pricing" })).toHaveAttribute(
      "href",
      "/pricing"
    );
    expect(screen.getByText("A few quick answers before you start.")).toBeInTheDocument();
  });
});
