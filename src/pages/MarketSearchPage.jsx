import React, { useMemo, useState } from "react";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { importMarketSaleListing, searchMarketSaleListings } from "../utils/api";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const normalizeListings = (payload) => {
  const rawItems = Array.isArray(payload)
    ? payload
    : payload?.listings || payload?.results || payload?.items || payload?.saleListings || [];

  return rawItems.map((item, index) => ({
    ...item,
    id:
      item.id ||
      item.listingId ||
      item.mlsNumber ||
      item.externalId ||
      `${item.address || item.formattedAddress || "listing"}-${index}`,
    photo:
      item.primaryPhoto ||
      item.coverPhoto ||
      item.imageUrl ||
      (Array.isArray(item.photos) ? item.photos[0] : null) ||
      "",
  }));
};

const buildAddress = (listing) =>
  listing.formattedAddress ||
  [listing.address, listing.city, listing.state, listing.zipCode].filter(Boolean).join(", ") ||
  "Address unavailable";

const formatPrice = (value) =>
  Number.isFinite(Number(value)) ? currencyFormatter.format(Number(value)) : "Price unavailable";

const MarketSearchPage = () => {
  const [searchForm, setSearchForm] = useState({
    location: "",
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
  });
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [importingId, setImportingId] = useState("");

  const resultCountLabel = useMemo(
    () => `${results.length} result${results.length === 1 ? "" : "s"}`,
    [results.length]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSearchForm((current) => ({ ...current, [name]: value }));
  };

  const handleSearch = async (event) => {
    event.preventDefault();

    if (!searchForm.location.trim()) {
      toast.error("Enter a city, ZIP code, or neighborhood to search.");
      return;
    }

    try {
      setIsSearching(true);
      const payload = await searchMarketSaleListings({
        location: searchForm.location.trim(),
        minPrice: searchForm.minPrice ? Number(searchForm.minPrice) : undefined,
        maxPrice: searchForm.maxPrice ? Number(searchForm.maxPrice) : undefined,
        bedrooms: searchForm.bedrooms ? Number(searchForm.bedrooms) : undefined,
      });

      setResults(normalizeListings(payload));
      setSearched(true);
    } catch (error) {
      console.error("Failed to search market listings", error);
      toast.error(error.message || "Could not load market listings.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (listing) => {
    try {
      setImportingId(listing.id);
      await importMarketSaleListing(listing);
      toast.success("Added to Potential Properties.");
    } catch (error) {
      console.error("Failed to import listing", error);
      toast.error(error.message || "Could not add the listing to Potential Properties.");
    } finally {
      setImportingId("");
    }
  };

  return (
    <div className="space-y-5">
      <section className="surface-panel-strong overflow-hidden px-5 py-6 sm:px-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <span className="eyebrow">Market search</span>
            <h2 className="page-hero-title">Browse live inventory and push the right listings into the deal grid.</h2>
            <p className="page-hero-copy">
              Search for-sale homes, scan the basics quickly, and send promising opportunities into
              Potential Properties for deeper AI-driven underwriting.
            </p>

            <form onSubmit={handleSearch} className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-ink-700">Location</span>
                <input
                  name="location"
                  value={searchForm.location}
                  onChange={handleChange}
                  placeholder="Nashville, TN or 37206"
                  className="auth-input"
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-ink-700">Min price</span>
                <input
                  name="minPrice"
                  value={searchForm.minPrice}
                  onChange={handleChange}
                  inputMode="numeric"
                  placeholder="250000"
                  className="auth-input"
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-ink-700">Max price</span>
                <input
                  name="maxPrice"
                  value={searchForm.maxPrice}
                  onChange={handleChange}
                  inputMode="numeric"
                  placeholder="550000"
                  className="auth-input"
                />
              </label>
              <label className="md:max-w-[180px]">
                <span className="mb-2 block text-sm font-medium text-ink-700">Beds</span>
                <input
                  name="bedrooms"
                  value={searchForm.bedrooms}
                  onChange={handleChange}
                  inputMode="numeric"
                  placeholder="3"
                  className="auth-input"
                />
              </label>
              <div className="flex items-end">
                <button type="submit" disabled={isSearching} className="primary-action w-full justify-center disabled:opacity-60">
                  {isSearching ? (
                    <>
                      <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                      Search market
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="section-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              What happens next
            </p>
            <div className="soft-list mt-4">
              {[
                "Search a city, ZIP code, or neighborhood to pull live sale inventory.",
                "Import the most promising listing into Potential Properties.",
                "Run the new deal grid, AI summary cards, and comps workflow from there.",
              ].map((step) => (
                <div key={step} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm leading-6 text-ink-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-card p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Results
            </p>
            <h3 className="mt-3 text-xl font-semibold text-ink-900">Live market listings</h3>
          </div>
          <div className="rounded-full border border-ink-100 bg-white px-4 py-2 text-sm font-medium text-ink-600">
            {searched ? resultCountLabel : "Search to load inventory"}
          </div>
        </div>

        {results.length > 0 ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {results.map((listing) => (
              <article
                key={listing.id}
                className="overflow-hidden rounded-[28px] border border-ink-100 bg-white shadow-[0_18px_40px_rgba(28,23,19,0.05)]"
              >
                <div className="h-48 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(56,189,248,0.12))]">
                  {listing.photo ? (
                    <img src={listing.photo} alt={buildAddress(listing)} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-medium text-ink-500">
                      Listing photo unavailable
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-ink-900">{buildAddress(listing)}</p>
                      <p className="mt-2 text-sm leading-6 text-ink-500">
                        {[
                          listing.propertyType,
                          listing.bedrooms ? `${listing.bedrooms} bd` : null,
                          listing.bathrooms ? `${listing.bathrooms} ba` : null,
                          listing.squareFootage ? `${Number(listing.squareFootage).toLocaleString()} sqft` : null,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "Property details still limited"}
                      </p>
                    </div>
                    <div className="rounded-full bg-sand-50 px-3 py-1 text-sm font-semibold text-ink-700">
                      {formatPrice(listing.price)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Status</p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">{listing.status || "For sale"}</p>
                    </div>
                    <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Days on market</p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">{listing.daysOnMarket ?? "N/A"}</p>
                    </div>
                    <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">List source</p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">{listing.listingType || "MLS"}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex items-center gap-2 text-sm text-ink-500">
                      <MapPinIcon className="h-4 w-4" />
                      <span>{listing.city || listing.state || "Market result"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleImport(listing)}
                      disabled={importingId === listing.id}
                      className="primary-action justify-center disabled:opacity-60"
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      {importingId === listing.id ? "Adding..." : "Add to Potential Properties"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[22px] border border-dashed border-ink-200 bg-sand-50 px-5 py-12 text-center">
            <p className="text-lg font-semibold text-ink-900">
              {searched ? "No market listings matched that search" : "Search the market to start"}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {searched
                ? "Try widening the location or relaxing the price filters."
                : "Once you search, the results will land here and you can import the best opportunities into the deal grid."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MarketSearchPage;
