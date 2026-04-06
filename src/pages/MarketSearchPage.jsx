import React, { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import MarketSearchMap from "../components/MarketSearchMap";
import { importMarketSaleListing, searchMarketSaleListings } from "../utils/api";
import { formatCurrency, propertyTypeOptions, toOptionalNumber } from "../utils/compsReport";
import {
  geocodeAddress,
  getLocationProviderName,
  searchLocationSuggestions,
} from "../utils/locationSearch";

const DEFAULT_FILTERS = {
  radius: "8",
  minPrice: "",
  maxPrice: "",
  minBedrooms: "",
  minBathrooms: "",
  propertyType: "",
  minSquareFootage: "",
  maxSquareFootage: "",
  minLotSize: "",
  maxLotSize: "",
  minYearBuilt: "",
  maxYearBuilt: "",
  maxDaysOnMarket: "",
};

const RADIUS_OPTIONS = [
  { value: "3", label: "3 mi" },
  { value: "5", label: "5 mi" },
  { value: "8", label: "8 mi" },
  { value: "12", label: "12 mi" },
  { value: "20", label: "20 mi" },
  { value: "30", label: "30 mi" },
];

const BEDROOM_OPTIONS = [
  { value: "", label: "Any beds" },
  { value: "1", label: "1+ beds" },
  { value: "2", label: "2+ beds" },
  { value: "3", label: "3+ beds" },
  { value: "4", label: "4+ beds" },
  { value: "5", label: "5+ beds" },
];

const BATHROOM_OPTIONS = [
  { value: "", label: "Any baths" },
  { value: "1", label: "1+ baths" },
  { value: "2", label: "2+ baths" },
  { value: "3", label: "3+ baths" },
  { value: "4", label: "4+ baths" },
];

const DAY_ON_MARKET_OPTIONS = [
  { value: "", label: "Any age" },
  { value: "7", label: "7 days or newer" },
  { value: "14", label: "14 days or newer" },
  { value: "30", label: "30 days or newer" },
  { value: "60", label: "60 days or newer" },
  { value: "90", label: "90 days or newer" },
];

const propertyFilterOptions = [
  { value: "", label: "Any property type" },
  ...propertyTypeOptions.filter((option) => option.value),
];

const DEFAULT_MAP_CENTER = {
  latitude: 39.8283,
  longitude: -98.5795,
  zoom: 3.5,
};

const formatInteger = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return parsed.toLocaleString("en-US");
};

const formatMarketDate = (value) => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const buildListingFacts = (listing) =>
  [
    listing.bedrooms ? `${listing.bedrooms} bd` : null,
    listing.bathrooms ? `${listing.bathrooms} ba` : null,
    listing.squareFootage ? `${formatInteger(listing.squareFootage)} sqft` : null,
  ].filter(Boolean);

const buildListingMeta = (listing) =>
  [
    listing.propertyType || null,
    listing.status || null,
    listing.daysOnMarket ? `${listing.daysOnMarket} DOM` : null,
  ].filter(Boolean);

const getPropertyTypeLabel = (value) =>
  propertyFilterOptions.find((option) => option.value === value)?.label || value || "Property";

const getViewportSearchLabel = (meta) => {
  if (!meta?.searchStrategy) {
    return "Radius search";
  }

  if (meta.searchStrategy === "viewport_radius") {
    return "Map area search";
  }

  if (meta.searchStrategy === "address_lookup") {
    return "Address lookup";
  }

  return "Radius search";
};

const buildActiveFilterChips = (filters) => {
  const chips = [];

  if (filters.minPrice || filters.maxPrice) {
    chips.push(
      `Price ${filters.minPrice ? formatCurrency(filters.minPrice) : "Any"} to ${
        filters.maxPrice ? formatCurrency(filters.maxPrice) : "Any"
      }`
    );
  }

  if (filters.minBedrooms) {
    chips.push(`${filters.minBedrooms}+ beds`);
  }

  if (filters.minBathrooms) {
    chips.push(`${filters.minBathrooms}+ baths`);
  }

  if (filters.propertyType) {
    chips.push(getPropertyTypeLabel(filters.propertyType));
  }

  if (filters.minSquareFootage || filters.maxSquareFootage) {
    chips.push(
      `Sqft ${filters.minSquareFootage ? formatInteger(filters.minSquareFootage) : "Any"} to ${
        filters.maxSquareFootage ? formatInteger(filters.maxSquareFootage) : "Any"
      }`
    );
  }

  if (filters.minLotSize || filters.maxLotSize) {
    chips.push(
      `Lot ${filters.minLotSize ? formatInteger(filters.minLotSize) : "Any"} to ${
        filters.maxLotSize ? formatInteger(filters.maxLotSize) : "Any"
      }`
    );
  }

  if (filters.minYearBuilt || filters.maxYearBuilt) {
    chips.push(
      `Year ${filters.minYearBuilt || "Any"} to ${filters.maxYearBuilt || "Any"}`
    );
  }

  if (filters.maxDaysOnMarket) {
    chips.push(`${filters.maxDaysOnMarket} days or newer`);
  }

  if (filters.radius) {
    chips.push(`${filters.radius} mile radius`);
  }

  return chips;
};

const getContextEntry = (feature, prefix) =>
  (feature?.context || []).find((entry) => entry?.id?.startsWith(`${prefix}.`)) || null;

const extractLocationFromFeature = (feature, label) => {
  const center = Array.isArray(feature?.center) ? feature.center : [];
  const regionContext = getContextEntry(feature, "region");
  const placeContext = getContextEntry(feature, "place");
  const postcodeContext = getContextEntry(feature, "postcode");
  const directRegion =
    feature?.place_type?.includes?.("region") && feature?.properties?.short_code
      ? feature.properties.short_code
      : "";

  return {
    label: label || feature?.place_name || feature?.text || "",
    address: feature?.place_name || label || feature?.text || "",
    city:
      feature?.place_type?.includes?.("place")
        ? feature?.text || ""
        : placeContext?.text || "",
    state:
      String(directRegion || regionContext?.short_code || "")
        .replace(/^us-/, "")
        .toUpperCase(),
    zipCode:
      feature?.place_type?.includes?.("postcode")
        ? feature?.text || ""
        : postcodeContext?.text || "",
    latitude: Number.isFinite(Number(center[1])) ? Number(center[1]) : null,
    longitude: Number.isFinite(Number(center[0])) ? Number(center[0]) : null,
  };
};

const buildSearchPayload = ({ location, filters, viewport }) => ({
  location: location
    ? {
        label: location.label,
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
        latitude: location.latitude,
        longitude: location.longitude,
      }
    : undefined,
  radius: toOptionalNumber(filters.radius) || 8,
  viewport: viewport || undefined,
  filters: {
    minPrice: toOptionalNumber(filters.minPrice),
    maxPrice: toOptionalNumber(filters.maxPrice),
    minBedrooms: toOptionalNumber(filters.minBedrooms),
    minBathrooms: toOptionalNumber(filters.minBathrooms),
    propertyType: filters.propertyType || undefined,
    minSquareFootage: toOptionalNumber(filters.minSquareFootage),
    maxSquareFootage: toOptionalNumber(filters.maxSquareFootage),
    minLotSize: toOptionalNumber(filters.minLotSize),
    maxLotSize: toOptionalNumber(filters.maxLotSize),
    minYearBuilt: toOptionalNumber(filters.minYearBuilt),
    maxYearBuilt: toOptionalNumber(filters.maxYearBuilt),
    maxDaysOnMarket: toOptionalNumber(filters.maxDaysOnMarket),
    limit: 120,
  },
});

const buildResultCountLabel = (count) =>
  `${count.toLocaleString("en-US")} listing${count === 1 ? "" : "s"}`;

const buildImageInitials = (listing) =>
  String(listing?.address || listing?.propertyType || "FP")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join("");

const mergeImportedListingState = (listing, response) => ({
  ...listing,
  existingLeadId: response.leadId || listing.existingLeadId || "",
  existingLeadStatus: response?.lead?.status || listing.existingLeadStatus || "Potential",
});

const ListingImage = ({ listing, tall = false }) => {
  if (listing.photoUrl) {
    return (
      <img
        src={listing.photoUrl}
        alt={listing.address || "Property listing"}
        className={`h-full w-full object-cover ${tall ? "" : "rounded-[18px]"}`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-end justify-between bg-[radial-gradient(circle_at_top_left,_rgba(168,115,91,0.32),_transparent_42%),linear-gradient(145deg,_rgba(67,95,89,0.96),_rgba(28,23,19,0.92))] px-4 py-4 text-white ${tall ? "" : "rounded-[18px]"}`}
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
          {listing.propertyType || "For sale"}
        </p>
        <p className="mt-2 text-2xl font-semibold">{buildImageInitials(listing)}</p>
      </div>
      <p className="text-xs font-medium text-white/80">
        {listing.status || "Active"}{listing.daysOnMarket ? ` • ${listing.daysOnMarket} DOM` : ""}
      </p>
    </div>
  );
};

const ListingCard = ({
  listing,
  selected,
  saving,
  onSelect,
  onImport,
  onOpenLead,
}) => {
  const factLine = buildListingFacts(listing);
  const metaLine = buildListingMeta(listing);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`section-card cursor-pointer overflow-hidden border transition ${
        selected
          ? "border-ink-900/20 bg-white shadow-[0_16px_36px_rgba(28,23,19,0.08)]"
          : "border-transparent bg-white/82 hover:border-ink-900/10 hover:bg-white"
      }`}
    >
      <div className="grid gap-4 p-4 sm:grid-cols-[124px_minmax(0,1fr)]">
        <div className="h-28 overflow-hidden rounded-[18px]">
          <ListingImage listing={listing} />
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold tracking-tight text-ink-900">
                {formatCurrency(listing.price)}
              </p>
              <p className="mt-1 text-sm font-semibold text-ink-900">{listing.address}</p>
            </div>

            {listing.existingLeadId ? (
              <span className="rounded-full bg-verdigris-50 px-2.5 py-1 text-[11px] font-semibold text-verdigris-700">
                In Potential
              </span>
            ) : listing.status ? (
              <span className="rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                {listing.status}
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm text-ink-500">
            {factLine.length ? factLine.join(" • ") : "Property details are still loading."}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            {metaLine.length ? metaLine.join(" • ") : "Sale listing"}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {listing.existingLeadId ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenLead();
                }}
                className="secondary-action px-4 py-2"
              >
                <ArrowTopRightOnSquareIcon className="mr-2 h-4 w-4" />
                Open lead
              </button>
            ) : (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onImport();
                }}
                disabled={saving}
                className="primary-action px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BuildingOffice2Icon className="mr-2 h-4 w-4" />
                )}
                Add to Potential
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SelectedListingDetails = ({
  listing,
  saving,
  onImport,
  onOpenLead,
}) => {
  if (!listing) {
    return (
      <section className="section-card border border-dashed border-ink-200 bg-white/72 px-5 py-6">
        <span className="eyebrow">Selected listing</span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink-900">
          Choose a listing to inspect it.
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          Click any card or marker to preview the property, review its quick facts, and send it to
          Potential Properties when it looks promising.
        </p>
      </section>
    );
  }

  const primaryFacts = buildListingFacts(listing);
  const secondaryFacts = buildListingMeta(listing);

  return (
    <section className="overflow-hidden rounded-[24px] border border-ink-900/10 bg-white shadow-[0_20px_44px_rgba(28,23,19,0.08)]">
      <div className="relative h-56 overflow-hidden">
        <ListingImage listing={listing} tall />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className="eyebrow bg-white/90">Selected listing</span>
          {listing.existingLeadId ? (
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-verdigris-700">
              Saved to potential
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div>
          <p className="text-[2rem] font-semibold leading-none tracking-tight text-ink-900">
            {formatCurrency(listing.price)}
          </p>
          <p className="mt-2 text-base font-semibold text-ink-900">{listing.address}</p>
          <p className="mt-2 text-sm text-ink-500">
            {primaryFacts.length ? primaryFacts.join(" • ") : "Property details pending"}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            {secondaryFacts.length ? secondaryFacts.join(" • ") : "For-sale inventory"}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="metric-tile p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
              Listed
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              {formatMarketDate(listing.listedDate)}
            </p>
          </div>
          <div className="metric-tile p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
              Days on market
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              {listing.daysOnMarket ? `${listing.daysOnMarket} days` : "—"}
            </p>
          </div>
          <div className="metric-tile p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
              Lot size
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              {listing.lotSize ? `${formatInteger(listing.lotSize)} sqft` : "—"}
            </p>
          </div>
          <div className="metric-tile p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
              Year built
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              {listing.yearBuilt || "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.existingLeadId ? (
            <button type="button" onClick={onOpenLead} className="primary-action">
              <ArrowTopRightOnSquareIcon className="mr-2 h-4 w-4" />
              Open saved lead
            </button>
          ) : (
            <button
              type="button"
              onClick={onImport}
              disabled={saving}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BuildingOffice2Icon className="mr-2 h-4 w-4" />
              )}
              Add to Potential Properties
            </button>
          )}

          <button type="button" onClick={onOpenLead} className="secondary-action" disabled={!listing.existingLeadId}>
            <ArrowTopRightOnSquareIcon className="mr-2 h-4 w-4" />
            Open lead
          </button>
        </div>
      </div>
    </section>
  );
};

const FilterField = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
      {label}
    </span>
    {children}
  </label>
);

const FiltersPanel = ({
  filters,
  activeFilterChips,
  onChange,
  onApply,
  onReset,
  isLoading,
  compact = false,
}) => (
  <section className={compact ? "space-y-4" : "space-y-5"}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <span className="eyebrow">Filters</span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink-900">
          Shape the inventory
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          Start simple, then tighten the radius, price band, and property specs as promising
          inventory appears on the map.
        </p>
      </div>
    </div>

    {activeFilterChips.length ? (
      <div className="flex flex-wrap gap-2">
        {activeFilterChips.map((chip) => (
          <span key={chip} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-ink-100">
            {chip}
          </span>
        ))}
      </div>
    ) : null}

    <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
      <FilterField label="Search radius">
        <select
          name="radius"
          value={filters.radius}
          onChange={onChange}
          className="auth-input"
        >
          {RADIUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField label="Property type">
        <select
          name="propertyType"
          value={filters.propertyType}
          onChange={onChange}
          className="auth-input"
        >
          {propertyFilterOptions.map((option) => (
            <option key={option.value || "any"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField label="Min price">
        <input
          type="number"
          inputMode="numeric"
          name="minPrice"
          value={filters.minPrice}
          onChange={onChange}
          className="auth-input"
          placeholder="No minimum"
        />
      </FilterField>

      <FilterField label="Max price">
        <input
          type="number"
          inputMode="numeric"
          name="maxPrice"
          value={filters.maxPrice}
          onChange={onChange}
          className="auth-input"
          placeholder="No maximum"
        />
      </FilterField>

      <FilterField label="Bedrooms">
        <select
          name="minBedrooms"
          value={filters.minBedrooms}
          onChange={onChange}
          className="auth-input"
        >
          {BEDROOM_OPTIONS.map((option) => (
            <option key={option.value || "any"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField label="Bathrooms">
        <select
          name="minBathrooms"
          value={filters.minBathrooms}
          onChange={onChange}
          className="auth-input"
        >
          {BATHROOM_OPTIONS.map((option) => (
            <option key={option.value || "any"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterField>
    </div>

    <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
      <FilterField label="Min sqft">
        <input
          type="number"
          inputMode="numeric"
          name="minSquareFootage"
          value={filters.minSquareFootage}
          onChange={onChange}
          className="auth-input"
          placeholder="Any"
        />
      </FilterField>

      <FilterField label="Max sqft">
        <input
          type="number"
          inputMode="numeric"
          name="maxSquareFootage"
          value={filters.maxSquareFootage}
          onChange={onChange}
          className="auth-input"
          placeholder="Any"
        />
      </FilterField>

      <FilterField label="Min lot size">
        <input
          type="number"
          inputMode="numeric"
          name="minLotSize"
          value={filters.minLotSize}
          onChange={onChange}
          className="auth-input"
          placeholder="Any"
        />
      </FilterField>

      <FilterField label="Max lot size">
        <input
          type="number"
          inputMode="numeric"
          name="maxLotSize"
          value={filters.maxLotSize}
          onChange={onChange}
          className="auth-input"
          placeholder="Any"
        />
      </FilterField>

      <FilterField label="Min year built">
        <input
          type="number"
          inputMode="numeric"
          name="minYearBuilt"
          value={filters.minYearBuilt}
          onChange={onChange}
          className="auth-input"
          placeholder="Any"
        />
      </FilterField>

      <FilterField label="Max year built">
        <input
          type="number"
          inputMode="numeric"
          name="maxYearBuilt"
          value={filters.maxYearBuilt}
          onChange={onChange}
          className="auth-input"
          placeholder="Any"
        />
      </FilterField>

      <FilterField label="Days on market">
        <select
          name="maxDaysOnMarket"
          value={filters.maxDaysOnMarket}
          onChange={onChange}
          className="auth-input"
        >
          {DAY_ON_MARKET_OPTIONS.map((option) => (
            <option key={option.value || "any"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterField>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onApply}
        disabled={isLoading}
        className="primary-action disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <AdjustmentsHorizontalIcon className="mr-2 h-4 w-4" />
        )}
        Apply filters
      </button>
      <button type="button" onClick={onReset} className="ghost-action">
        Reset filters
      </button>
    </div>
  </section>
);

const LocationSearchPanel = ({
  locationQuery,
  suggestions,
  activeLocation,
  providerName,
  isLoading,
  error,
  onChange,
  onSearch,
  onSelectSuggestion,
}) => (
  <section className="space-y-4">
    <div>
      <span className="eyebrow">Discovery</span>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900">
        Browse market inventory like an acquisitions desk.
      </h2>
      <p className="mt-2 text-sm leading-6 text-ink-500">
        Search a city, ZIP code, neighborhood, or exact address, then work the map visually to
        uncover promising for-sale properties.
      </p>
    </div>

    <form onSubmit={onSearch} className="space-y-3">
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          value={locationQuery}
          onChange={onChange}
          className="auth-input pr-32 pl-11"
          placeholder="Try Phoenix, 85016, Buckhead, or 123 Main St"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="primary-action absolute right-1.5 top-1.5 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : "Search"}
        </button>

        {suggestions.length ? (
          <div className="absolute inset-x-0 top-[calc(100%+0.55rem)] z-20 overflow-hidden rounded-[20px] border border-ink-100 bg-white shadow-[0_18px_40px_rgba(28,23,19,0.08)]">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelectSuggestion(suggestion);
                }}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-sand-50"
              >
                <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-400" />
                <span className="text-sm text-ink-700">{suggestion.place_name}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </form>

    <div className="rounded-[18px] bg-white/82 px-4 py-4 ring-1 ring-ink-100">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
        Market focus
      </p>
      <p className="mt-2 text-sm font-semibold text-ink-900">
        {activeLocation?.label || "Pick a market to start"}
      </p>
      <p className="mt-1 text-sm text-ink-500">
        Suggestions powered by {providerName}. Searches use RentCast sale listings under the hood.
      </p>
      {error ? <p className="mt-3 text-sm font-medium text-clay-700">{error}</p> : null}
    </div>
  </section>
);

const MarketSearchPage = () => {
  const navigate = useNavigate();
  const providerName = getLocationProviderName();
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia("(min-width: 1024px)").matches
  );
  const [locationQuery, setLocationQuery] = useState("");
  const deferredLocationQuery = useDeferredValue(locationQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeLocation, setActiveLocation] = useState(null);
  const [listings, setListings] = useState([]);
  const [searchMeta, setSearchMeta] = useState(null);
  const [selectedListingId, setSelectedListingId] = useState("");
  const [fitBoundsToken, setFitBoundsToken] = useState(0);
  const [focusSelectedToken, setFocusSelectedToken] = useState(0);
  const [pendingViewport, setPendingViewport] = useState(null);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savingListingId, setSavingListingId] = useState("");
  const [error, setError] = useState("");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const selectedQueryRef = useRef("");
  const suppressSuggestionsRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    const query = deferredLocationQuery.trim();
    if (!query || query.length < 2) {
      setSuggestions([]);
      return undefined;
    }

    if (suppressSuggestionsRef.current && query === selectedQueryRef.current) {
      setSuggestions([]);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchLocationSuggestions(query, controller.signal, { limit: 6 });
        setSuggestions(results);
      } catch (suggestionError) {
        if (suggestionError.name !== "AbortError") {
          console.error("Market search suggestion error", suggestionError);
        }
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [deferredLocationQuery]);

  const activeFilterChips = buildActiveFilterChips(filters);
  const selectedListing =
    listings.find((listing) => listing.id === selectedListingId) || listings[0] || null;

  const searchCenter =
    searchMeta?.searchCenter ||
    (activeLocation?.latitude !== null &&
    activeLocation?.latitude !== undefined &&
    activeLocation?.longitude !== null &&
    activeLocation?.longitude !== undefined
      ? activeLocation
      : DEFAULT_MAP_CENTER);

  const resultCountLabel = buildResultCountLabel(listings.length);

  const executeSearch = async ({
    location = activeLocation,
    viewport = null,
    nextFilters = filters,
    preserveLocationInput = false,
  } = {}) => {
    if (!location && !viewport) {
      setError("Enter a city, ZIP code, neighborhood, or address to begin.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await searchMarketSaleListings(
        buildSearchPayload({
          location,
          filters: nextFilters,
          viewport,
        })
      );

      const nextLocationLabel = location?.label || location?.address || "";
      if (nextLocationLabel) {
        selectedQueryRef.current = nextLocationLabel;
        suppressSuggestionsRef.current = true;
      }

      if (location) {
        setActiveLocation(location);
      }

      if (!preserveLocationInput && nextLocationLabel) {
        setLocationQuery(nextLocationLabel);
      }

      setSuggestions([]);
      setPendingViewport(null);
      setShowSearchAreaButton(false);

      startTransition(() => {
        setListings(response.listings || []);
        setSearchMeta(response.meta || null);
        setSelectedListingId((current) => {
          if (current && (response.listings || []).some((listing) => listing.id === current)) {
            return current;
          }

          return response.listings?.[0]?.id || "";
        });
        setFitBoundsToken((current) => current + 1);
      });

      if (!isDesktop) {
        setIsMobileDrawerOpen(true);
      }
    } catch (searchError) {
      console.error("Market search request failed", searchError);
      setError(searchError.message || "Failed to load market listings.");
      toast.error(searchError.message || "Failed to load market listings.");
    } finally {
      setIsLoading(false);
    }
  };

  const resolveLocation = async (query) => {
    const geocodeResult = await geocodeAddress(query);
    const feature = geocodeResult?.features?.[0];

    if (!feature) {
      throw new Error("We couldn't find that market. Try a more specific city, ZIP, or address.");
    }

    return extractLocationFromFeature(feature, query);
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();

    const query = locationQuery.trim();
    if (!query && !activeLocation) {
      setError("Enter a city, ZIP code, neighborhood, or address to begin.");
      return;
    }

    try {
      const resolvedLocation = query ? await resolveLocation(query) : activeLocation;
      await executeSearch({ location: resolvedLocation });
    } catch (searchError) {
      setError(searchError.message || "Failed to resolve that market.");
      toast.error(searchError.message || "Failed to resolve that market.");
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    const label = suggestion.place_name || "";
    selectedQueryRef.current = label;
    suppressSuggestionsRef.current = true;
    setLocationQuery(label);
    setSuggestions([]);

    try {
      const resolvedLocation = await resolveLocation(label);
      await executeSearch({
        location: resolvedLocation,
        preserveLocationInput: true,
      });
    } catch (searchError) {
      setError(searchError.message || "Failed to resolve that market.");
      toast.error(searchError.message || "Failed to resolve that market.");
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleApplyFilters = async () => {
    if (!activeLocation && !pendingViewport) {
      toast.error("Search a market first so we know where to apply the filters.");
      return;
    }

    await executeSearch({
      location: activeLocation,
      viewport: showSearchAreaButton ? pendingViewport : searchMeta?.viewport || null,
      nextFilters: filters,
      preserveLocationInput: true,
    });
  };

  const handleResetFilters = async () => {
    const nextFilters = { ...DEFAULT_FILTERS };
    setFilters(nextFilters);

    if (!activeLocation && !pendingViewport) {
      return;
    }

    await executeSearch({
      location: activeLocation,
      viewport: showSearchAreaButton ? pendingViewport : searchMeta?.viewport || null,
      nextFilters,
      preserveLocationInput: true,
    });
  };

  const handleViewportChange = (viewport) => {
    if (!activeLocation && !listings.length) {
      return;
    }

    setPendingViewport(viewport);
    setShowSearchAreaButton(true);
  };

  const handleSelectListing = (listingId, { source = "list" } = {}) => {
    setSelectedListingId(listingId);

    if (source !== "map") {
      setFocusSelectedToken((current) => current + 1);
    }

    if (!isDesktop) {
      setIsMobileDrawerOpen(true);
    }
  };

  const handleSearchArea = async () => {
    if (!pendingViewport) {
      return;
    }

    await executeSearch({
      location: activeLocation,
      viewport: pendingViewport,
      preserveLocationInput: true,
    });
  };

  const handleImportListing = async (listing) => {
    if (!listing?.listingId || savingListingId) {
      return;
    }

    setSavingListingId(listing.id);

    try {
      const response = await importMarketSaleListing({
        provider: listing.provider,
        listingId: listing.listingId,
        listing,
        leadSource: "rentcast_map_search",
      });

      startTransition(() => {
        setListings((current) =>
          current.map((item) => (item.id === listing.id ? mergeImportedListingState(item, response) : item))
        );
        setSelectedListingId(listing.id);
      });

      if (response.created) {
        toast.success("Added to Potential Properties.");
      } else {
        toast.success("That property is already in Potential Properties.");
      }
    } catch (importError) {
      console.error("Failed to import market listing", importError);
      toast.error(importError.message || "Failed to add this property.");
    } finally {
      setSavingListingId("");
    }
  };

  const handleOpenLead = (leadId) => {
    if (!leadId) {
      return;
    }

    navigate(`/leads/${leadId}`);
  };

  const renderResultsPanel = () => (
    <div className="space-y-5">
      <SelectedListingDetails
        listing={selectedListing}
        saving={savingListingId === selectedListing?.id}
        onImport={() => handleImportListing(selectedListing)}
        onOpenLead={() => handleOpenLead(selectedListing?.existingLeadId)}
      />

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="eyebrow">Results</span>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink-900">
              {listings.length
                ? `${resultCountLabel} ${searchMeta?.locationLabel ? `near ${searchMeta.locationLabel}` : ""}`
                : "No matching listings yet"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {listings.length
                ? `${getViewportSearchLabel(searchMeta)} • ${
                    searchMeta?.radiusMiles ? `${searchMeta.radiusMiles.toFixed(1)} mi radius` : "Market inventory"
                  }${searchMeta?.cached ? " • cached refresh" : ""}`
                : activeLocation
                  ? "Try widening the radius or relaxing a few filters."
                  : "Run a search to start filling the map and results panel."}
            </p>
          </div>

          {isLoading ? <ArrowPathIcon className="mt-1 h-5 w-5 animate-spin text-ink-400" /> : null}
        </div>

        {listings.length ? (
          <div className="space-y-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                selected={listing.id === selectedListing?.id}
                saving={savingListingId === listing.id}
                onSelect={() => handleSelectListing(listing.id)}
                onImport={() => handleImportListing(listing)}
                onOpenLead={() => handleOpenLead(listing.existingLeadId)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-ink-200 bg-white/72 px-5 py-8 text-center">
            <p className="text-lg font-semibold text-ink-900">No listings matched this search.</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {activeLocation
                ? "Expand the radius, raise the max price, or loosen the beds and baths filters."
                : "Search a market to start browsing for-sale inventory."}
            </p>
          </div>
        )}
      </section>
    </div>
  );

  const renderDesktopLayout = () => (
    <section className="surface-panel-strong overflow-hidden">
      <div className="grid min-h-[calc(100vh-10.5rem)] lg:grid-cols-[440px_minmax(0,1fr)]">
        <aside className="border-r border-ink-100 bg-[linear-gradient(180deg,_rgba(255,255,255,0.86),_rgba(250,246,241,0.92))]">
          <div className="flex h-[calc(100vh-10.5rem)] flex-col">
            <div className="border-b border-ink-100 px-5 py-5">
              <LocationSearchPanel
                locationQuery={locationQuery}
                suggestions={suggestions}
                activeLocation={activeLocation}
                providerName={providerName}
                isLoading={isLoading}
                error={error}
                onChange={(event) => {
                  suppressSuggestionsRef.current = false;
                  setError("");
                  setLocationQuery(event.target.value);
                }}
                onSearch={handleSearchSubmit}
                onSelectSuggestion={handleSelectSuggestion}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="space-y-5">
                <FiltersPanel
                  filters={filters}
                  activeFilterChips={activeFilterChips}
                  onChange={handleFilterChange}
                  onApply={handleApplyFilters}
                  onReset={handleResetFilters}
                  isLoading={isLoading}
                />
                {renderResultsPanel()}
              </div>
            </div>
          </div>
        </aside>

        <div className="relative h-[calc(100vh-10.5rem)] overflow-hidden">
          <MarketSearchMap
            listings={listings}
            selectedListingId={selectedListing?.id || ""}
            searchCenter={searchCenter}
            fitBoundsToken={fitBoundsToken}
            focusSelectedToken={focusSelectedToken}
            onSelectListing={handleSelectListing}
            onViewportChange={handleViewportChange}
          />

          <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3">
            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              <span className="glass-chip bg-white/92">{resultCountLabel}</span>
              <span className="glass-chip bg-white/92">
                {searchMeta?.locationLabel || activeLocation?.label || "Search a market"}
              </span>
              {searchMeta?.cached ? <span className="glass-chip bg-white/92">Cached</span> : null}
            </div>

            {showSearchAreaButton ? (
              <button type="button" onClick={handleSearchArea} className="secondary-action pointer-events-auto">
                Search this area
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );

  const renderMobileLayout = () => (
    <div className="space-y-4">
      <section className="surface-panel-strong overflow-hidden">
        <div className="border-b border-ink-100 px-4 py-4">
          <LocationSearchPanel
            locationQuery={locationQuery}
            suggestions={suggestions}
            activeLocation={activeLocation}
            providerName={providerName}
            isLoading={isLoading}
            error={error}
            onChange={(event) => {
              suppressSuggestionsRef.current = false;
              setError("");
              setLocationQuery(event.target.value);
            }}
            onSearch={handleSearchSubmit}
            onSelectSuggestion={handleSelectSuggestion}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="secondary-action"
            >
              <AdjustmentsHorizontalIcon className="mr-2 h-4 w-4" />
              Filters
            </button>

            <button type="button" onClick={handleApplyFilters} className="ghost-action">
              Refresh results
            </button>
          </div>
        </div>

        <div className="relative h-[calc(100vh-19rem)] min-h-[540px] overflow-hidden">
          <MarketSearchMap
            listings={listings}
            selectedListingId={selectedListing?.id || ""}
            searchCenter={searchCenter}
            fitBoundsToken={fitBoundsToken}
            focusSelectedToken={focusSelectedToken}
            onSelectListing={handleSelectListing}
            onViewportChange={handleViewportChange}
          />

          <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
            <div className="pointer-events-auto flex flex-wrap gap-2">
              <span className="glass-chip bg-white/92">{resultCountLabel}</span>
              {searchMeta?.cached ? <span className="glass-chip bg-white/92">Cached</span> : null}
            </div>

            {showSearchAreaButton ? (
              <button type="button" onClick={handleSearchArea} className="secondary-action pointer-events-auto px-4 py-2">
                Search area
              </button>
            ) : null}
          </div>

          <div
            className={`absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-ink-100 bg-white/96 shadow-[0_-20px_44px_rgba(28,23,19,0.12)] backdrop-blur-md transition-transform duration-300 ${
              isMobileDrawerOpen ? "translate-y-0" : "translate-y-[calc(100%-88px)]"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen((current) => !current)}
              className="flex w-full flex-col items-center gap-2 px-4 py-3"
            >
              <span className="h-1.5 w-12 rounded-full bg-ink-200" />
              <div className="flex w-full items-center justify-between text-left">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Results drawer
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">
                    {selectedListing?.address || resultCountLabel}
                  </p>
                </div>
                <p className="text-sm font-medium text-ink-500">
                  {isMobileDrawerOpen ? "Hide" : "Show"}
                </p>
              </div>
            </button>

            <div className="max-h-[56vh] overflow-y-auto px-4 pb-5">
              {renderResultsPanel()}
            </div>
          </div>
        </div>
      </section>

      {isMobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-ink-900/30 p-3">
          <div className="surface-panel-strong max-h-[88vh] w-full overflow-y-auto px-5 py-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <span className="eyebrow">Filters</span>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink-900">
                  Fine-tune the search
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-ink-100 bg-white text-ink-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <FiltersPanel
              filters={filters}
              activeFilterChips={activeFilterChips}
              onChange={handleFilterChange}
              onApply={async () => {
                await handleApplyFilters();
                setIsMobileFiltersOpen(false);
              }}
              onReset={handleResetFilters}
              isLoading={isLoading}
              compact
            />
          </div>
        </div>
      ) : null}
    </div>
  );

  return isDesktop ? renderDesktopLayout() : renderMobileLayout();
};

export default MarketSearchPage;
