import React from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import MarketSearchPage from "./MarketSearchPage";

vi.mock("../components/MarketSearchMap", () => ({
  default: () => <div data-testid="market-search-map">Map</div>,
}));

const searchMarketDealMatches = vi.fn();
const importMarketSaleListing = vi.fn();

vi.mock("../utils/api", () => ({
  searchMarketDealMatches: (...args) => searchMarketDealMatches(...args),
  importMarketSaleListing: (...args) => importMarketSaleListing(...args),
}));

const searchLocationSuggestions = vi.fn();
const geocodeAddress = vi.fn();

vi.mock("../utils/locationSearch", () => ({
  getLocationProviderName: () => "Mapbox",
  searchLocationSuggestions: (...args) => searchLocationSuggestions(...args),
  geocodeAddress: (...args) => geocodeAddress(...args),
}));

const phoenixFeature = {
  id: "phoenix",
  place_name: "Phoenix, Arizona, United States",
  text: "Phoenix",
  place_type: ["place"],
  center: [-112.074, 33.448],
  context: [
    { id: "region.1", short_code: "US-AZ", text: "Arizona" },
    { id: "country.1", text: "United States" },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <MarketSearchPage />
    </MemoryRouter>
  );

describe("MarketSearchPage", () => {
  beforeEach(() => {
    searchMarketDealMatches.mockReset();
    importMarketSaleListing.mockReset();
    searchLocationSuggestions.mockReset();
    geocodeAddress.mockReset();

    geocodeAddress.mockResolvedValue({
      features: [phoenixFeature],
    });

    searchLocationSuggestions.mockResolvedValue([]);
    searchMarketDealMatches.mockResolvedValue({
      results: [],
      meta: {
        searchedLocations: [{ id: "phoenix", label: "Phoenix, Arizona, United States", type: "city" }],
        candidateCount: 0,
        matchedCount: 0,
        hiddenWeakFitCount: 0,
      },
    });

    importMarketSaleListing.mockResolvedValue({
      created: true,
      leadId: "lead-1",
      lead: { status: "Potential" },
    });

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("min-width"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("adds and removes a market chip", async () => {
    renderPage();

    fireEvent.change(
      screen.getByPlaceholderText("Try Phoenix, 85016, Maricopa County, or Buckhead"),
      {
        target: { value: "Phoenix" },
      }
    );

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(await screen.findByText("Phoenix")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remove phoenix/i }));

    await waitFor(() => {
      expect(screen.queryByText("Phoenix")).not.toBeInTheDocument();
    });
  });

  it("builds the AI market search payload from the investor brief", async () => {
    renderPage();

    fireEvent.change(
      screen.getByPlaceholderText("Try Phoenix, 85016, Maricopa County, or Buckhead"),
      {
        target: { value: "Phoenix" },
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    await screen.findByText("Phoenix");

    fireEvent.change(screen.getByDisplayValue("Flip"), {
      target: { name: "strategy", value: "fix_and_rent" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        /find flip candidates with room for a meaningful value spread/i
      ),
      {
        target: { name: "objective", value: "Prioritize light rehab holds with healthy rent coverage." },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("No minimum"), {
      target: { name: "minPrice", value: "200000" },
    });
    fireEvent.change(screen.getByPlaceholderText("No maximum"), {
      target: { name: "maxPrice", value: "450000" },
    });

    fireEvent.click(screen.getByRole("button", { name: /single family/i }));
    fireEvent.click(screen.getByRole("button", { name: /run ai market search/i }));

    await waitFor(() => expect(searchMarketDealMatches).toHaveBeenCalledTimes(1));

    expect(searchMarketDealMatches).toHaveBeenCalledWith(
      expect.objectContaining({
        brief: expect.objectContaining({
          strategy: "fix_and_rent",
          objective: "Prioritize light rehab holds with healthy rent coverage.",
          minPrice: 200000,
          maxPrice: 450000,
          assetTypes: ["single-family"],
        }),
        locations: [
          expect.objectContaining({
            label: "Phoenix",
            city: "Phoenix",
            state: "AZ",
          }),
        ],
      })
    );
  });

  it("renders source-link labels and imports from quick view with market search assessment", async () => {
    searchMarketDealMatches.mockResolvedValueOnce({
      results: [
        {
          id: "listing-1",
          provider: "rentcast",
          listingId: "listing-1",
          address: "123 Main St",
          city: "Phoenix",
          state: "AZ",
          zipCode: "85016",
          price: 280000,
          propertyType: "Single Family",
          bedrooms: 3,
          bathrooms: 2,
          squareFootage: 1540,
          listedDate: "2026-04-01",
          photoUrl: "https://images.example.com/house.jpg",
          sourceUrl: "https://mls.example.com/listing-1",
          sourceLinkType: "mls",
          match: {
            score: 82,
            verdict: "strong",
            strategyFit: "Aligned with fix-and-rent criteria",
            renovationFit: "Closer to cosmetic scope",
            summary: "Rent coverage and pricing both look favorable.",
            reasons: ["Estimated rent looks strong relative to the asking price."],
            riskFlags: ["Condition still needs verification from the source listing."],
            nextStep: "Verify scope and save it to Deals for hold underwriting.",
            rentEstimate: { rent: 2500 },
            valueEstimate: { price: 305000 },
          },
        },
      ],
      meta: {
        searchedLocations: [{ id: "phoenix", label: "Phoenix, Arizona, United States", type: "city" }],
        candidateCount: 1,
        matchedCount: 1,
        hiddenWeakFitCount: 0,
      },
    });

    renderPage();

    fireEvent.change(
      screen.getByPlaceholderText("Try Phoenix, 85016, Maricopa County, or Buckhead"),
      {
        target: { value: "Phoenix" },
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    await screen.findByText("Phoenix");

    fireEvent.click(screen.getByRole("button", { name: /run ai market search/i }));

    expect(await screen.findByText("Open MLS Source")).toBeInTheDocument();

    fireEvent.click(screen.getByText("123 Main St"));

    const quickViewPanel = screen.getByText("Acquisition workflow").closest("aside");

    expect(quickViewPanel).not.toBeNull();

    fireEvent.click(within(quickViewPanel).getByRole("button", { name: /save to deals/i }));

    await waitFor(() => expect(importMarketSaleListing).toHaveBeenCalledTimes(1));

    expect(importMarketSaleListing).toHaveBeenCalledWith(
      expect.objectContaining({
        listingId: "listing-1",
        marketSearchAssessment: expect.objectContaining({
          brief: expect.objectContaining({
            strategy: "flip",
          }),
          match: expect.objectContaining({
            score: 82,
            verdict: "strong",
          }),
        }),
      })
    );
  });
});
