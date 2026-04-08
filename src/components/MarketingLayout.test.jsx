import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import MarketingLayout from "./MarketingLayout";

const trackMarketingEvent = vi.fn();

vi.mock("./BrandLogo", () => ({
  default: () => <div>Fliprop</div>,
}));

vi.mock("./PublicLegalLinks", () => ({
  default: () => <div>Legal links</div>,
}));

vi.mock("../utils/analytics", () => ({
  trackMarketingEvent: (...args) => trackMarketingEvent(...args),
}));

const renderLayout = () =>
  render(
    <MemoryRouter>
      <MarketingLayout>
        <div>Child content</div>
      </MarketingLayout>
    </MemoryRouter>
  );

describe("MarketingLayout", () => {
  it("renders the streamlined primary nav and calmer footer links", () => {
    renderLayout();

    const primaryNav = screen.getByRole("navigation", { name: "Primary" });

    expect(within(primaryNav).getByRole("link", { name: "Product" })).toBeInTheDocument();
    expect(within(primaryNav).getByRole("link", { name: "Pricing" })).toBeInTheDocument();
    expect(within(primaryNav).getByRole("link", { name: "Resources" })).toBeInTheDocument();

    const footer = screen.getByRole("contentinfo");

    expect(within(footer).getByRole("link", { name: "Compare" })).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "See pricing" })).toBeInTheDocument();
  });

  it("opens the mobile menu with primary and secondary navigation", () => {
    renderLayout();

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    const mobileNav = screen.getByLabelText("Mobile navigation");

    expect(within(mobileNav).getByRole("link", { name: "Resources" })).toBeInTheDocument();
    expect(within(mobileNav).getByRole("link", { name: "Compare" })).toBeInTheDocument();
    expect(within(mobileNav).getByRole("link", { name: "About" })).toBeInTheDocument();
  });
});
