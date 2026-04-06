import React, { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhotoIcon,
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

const RESULT_VIEW_OPTIONS = [
  { value: "listing", label: "Listing view", icon: PhotoIcon },
  { value: "compact", label: "Compact", icon: ListBulletIcon },
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

const buildGalleryPhotos = (listing) => {
  const seen = new Set();

  return [listing?.photoUrl, ...(Array.isArray(listing?.photos) ? listing.photos : [])]
    .map((photo) => String(photo || "").trim())
    .filter((photo) => {
      if (!photo || seen.has(photo)) {
        return false;
      }

      seen.add(photo);
      return true;
    });
};

const buildListingLocationLine = (listing) => {
  const cityState = [listing?.city, listing?.state].filter(Boolean).join(", ");
  if (cityState && listing?.zipCode) {
    return `${cityState} ${listing.zipCode}`;
  }

  return cityState || listing?.zipCode || "";
};

const buildListingHighlights = (listing) =>
  [
    listing.propertyType || null,
    listing.yearBuilt ? `Built ${listing.yearBuilt}` : null,
    listing.lotSize ? `Lot ${formatInteger(listing.lotSize)} sqft` : null,
    listing.mlsNumber ? `MLS ${listing.mlsNumber}` : null,
  ].filter(Boolean);

const buildListingTimeline = (listing) => {
  const photoCount = Math.max(listing?.photoCount || 0, buildGalleryPhotos(listing).length);

  return [
    listing.listedDate ? `Listed ${formatMarketDate(listing.listedDate)}` : null,
    listing.daysOnMarket ? `${listing.daysOnMarket} DOM` : null,
    photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
};

const getListingStatusLabel = (listing) =>
  listing?.existingLeadId ? "In Potential" : listing?.status || "For Sale";

const buildListingDetailRows = (listing) => [
  { label: "Address", value: listing?.address || "—" },
  { label: "City / State", value: buildListingLocationLine(listing) || "—" },
  { label: "Price", value: formatCurrency(listing?.price) },
  { label: "Status", value: getListingStatusLabel(listing) },
  {
    label: "Beds / Baths",
    value:
      [
        listing?.bedrooms ? `${listing.bedrooms} bd` : null,
        listing?.bathrooms ? `${listing.bathrooms} ba` : null,
      ].filter(Boolean).join(" • ") || "—",
  },
  {
    label: "Interior",
    value: listing?.squareFootage ? `${formatInteger(listing.squareFootage)} sqft` : "—",
  },
  {
    label: "Lot size",
    value: listing?.lotSize ? `${formatInteger(listing.lotSize)} sqft` : "—",
  },
  { label: "Year built", value: listing?.yearBuilt || "—" },
  { label: "Property type", value: listing?.propertyType || "—" },
  { label: "Listed", value: formatMarketDate(listing?.listedDate) },
  {
    label: "Days on market",
    value: listing?.daysOnMarket ? `${listing.daysOnMarket} days` : "—",
  },
  {
    label: "MLS",
    value: [listing?.mlsNumber, listing?.mlsName].filter(Boolean).join(" • ") || "—",
  },
  {
    label: "HOA",
    value: listing?.hoaFee ? formatCurrency(listing.hoaFee) : "—",
  },
];

const mergeImportedListingState = (listing, response) => ({
  ...listing,
  existingLeadId: response.leadId || listing.existingLeadId || "",
  existingLeadStatus: response?.lead?.status || listing.existingLeadStatus || "Potential",
});

const ListingStatusBadge = ({ listing, onImage = false }) => {
  const classes = listing?.existingLeadId
    ? onImage
      ? "bg-verdigris-600/92 text-white shadow-[0_12px_24px_rgba(67,95,89,0.24)]"
      : "bg-verdigris-50 text-verdigris-700 ring-1 ring-verdigris-100"
    : onImage
      ? "bg-white/92 text-ink-900 shadow-[0_12px_24px_rgba(28,23,19,0.14)]"
      : "bg-sand-100 text-ink-700 ring-1 ring-sand-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${classes}`}
    >
      {getListingStatusLabel(listing)}
    </span>
  );
};

const ListingImage = ({ listing, tall = false, overlay = true }) => {
  const photoCount = Math.max(listing?.photoCount || 0, buildGalleryPhotos(listing).length);

  if (listing.photoUrl) {
    return (
      <div className={`relative h-full w-full overflow-hidden ${tall ? "" : "rounded-[22px]"}`}>
        <img
          src={listing.photoUrl}
          alt={listing.address || "Property listing"}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {overlay ? (
          <>
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
              <ListingStatusBadge listing={listing} onImage />
              {photoCount > 1 ? (
                <span className="inline-flex items-center rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                  {photoCount} photos
                </span>
              ) : null}
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 py-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
                {listing.propertyType || "For sale"}
              </p>
              <p className="mt-1 text-sm font-medium text-white/92">
                {buildListingLocationLine(listing) || listing.address || "Market listing"}
              </p>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-end justify-between overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(168,115,91,0.32),_transparent_42%),linear-gradient(145deg,_rgba(67,95,89,0.96),_rgba(28,23,19,0.92))] px-4 py-4 text-white ${tall ? "" : "rounded-[22px]"}`}
    >
      {overlay ? (
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          <ListingStatusBadge listing={listing} onImage />
        </div>
      ) : null}

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

const ListingGallery = ({ listing, showAllThumbnails = false, tall = false }) => {
  const galleryPhotos = buildGalleryPhotos(listing);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [listing?.id]);

  if (!galleryPhotos.length) {
    return (
      <div className={`relative overflow-hidden ${tall ? "h-72 sm:h-[24rem]" : "h-64 sm:h-72"}`}>
        <ListingImage listing={listing} tall />
      </div>
    );
  }

  const thumbnailPhotos = showAllThumbnails ? galleryPhotos : galleryPhotos.slice(0, 4);
  const activePhoto = galleryPhotos[activePhotoIndex] || galleryPhotos[0];

  return (
    <div className="space-y-3">
      <div className={`relative overflow-hidden ${tall ? "h-72 sm:h-[24rem]" : "h-64 sm:h-72"}`}>
        <img
          src={activePhoto}
          alt={listing.address || "Property listing"}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <ListingStatusBadge listing={listing} onImage />
          <span className="inline-flex items-center rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
            {galleryPhotos.length} photo{galleryPhotos.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-5 py-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
            Selected listing
          </p>
          <p className="mt-2 text-sm font-medium text-white/92">
            {buildListingLocationLine(listing) || listing.address || "Market listing"}
          </p>
        </div>
      </div>

      {galleryPhotos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto px-4 pb-4">
          {thumbnailPhotos.map((photo, index) => (
            <button
              key={`${listing.id}-thumb-${index}`}
              type="button"
              onClick={() => setActivePhotoIndex(index)}
              className={`relative w-20 flex-none overflow-hidden rounded-[14px] transition ${
                index === activePhotoIndex
                  ? "ring-2 ring-verdigris-500 ring-offset-2 ring-offset-white"
                  : "opacity-85 hover:opacity-100"
              }`}
            >
              <img
                src={photo}
                alt={`${listing.address || "Property listing"} photo ${index + 1}`}
                className="h-16 w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
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
  variant = "listing",
}) => {
  const factLine = buildListingFacts(listing);
  const metaLine = buildListingHighlights(listing);
  const timelineLine = buildListingTimeline(listing);

  if (variant === "compact") {
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
            <ListingImage listing={listing} overlay={false} />
          </div>

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold tracking-tight text-ink-900">
                  {formatCurrency(listing.price)}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-900">{listing.address}</p>
              </div>

              <ListingStatusBadge listing={listing} />
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
  }

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
      <div className="space-y-0">
        <div className="h-52 overflow-hidden">
          <ListingImage listing={listing} />
        </div>

        <div className="min-w-0 space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[1.9rem] font-semibold leading-none tracking-tight text-ink-900">
                {formatCurrency(listing.price)}
              </p>
              <p className="mt-2 text-base font-semibold text-ink-900">{listing.address}</p>
              {buildListingLocationLine(listing) ? (
                <p className="mt-1 text-sm text-ink-500">{buildListingLocationLine(listing)}</p>
              ) : null}
            </div>

            <ListingStatusBadge listing={listing} />
          </div>

          <div className="flex flex-wrap gap-2">
            {factLine.length ? (
              factLine.map((fact) => (
                <span
                  key={fact}
                  className="rounded-full bg-ink-900 px-3 py-1.5 text-sm font-semibold text-white"
                >
                  {fact}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-sand-100 px-3 py-1.5 text-sm font-medium text-ink-600">
                Property details pending
              </span>
            )}
          </div>

          {metaLine.length ? (
            <div className="flex flex-wrap gap-2">
              {metaLine.map((detail) => (
                <span
                  key={detail}
                  className="rounded-full bg-sand-50 px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-ink-100"
                >
                  {detail}
                </span>
              ))}
            </div>
          ) : null}

          <p className="text-sm text-ink-500">
            {timelineLine.length ? timelineLine.join(" • ") : "RentCast market listing"}
          </p>

          <div className="flex flex-wrap items-center gap-2">
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

const ListingQuickViewModal = ({
  listing,
  saving,
  onClose,
  onImport,
  onOpenLead,
}) => {
  useEffect(() => {
    if (!listing) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [listing, onClose]);

  if (!listing) {
    return null;
  }

  const primaryFacts = buildListingFacts(listing);
  const secondaryFacts = buildListingHighlights(listing);
  const timelineFacts = buildListingTimeline(listing);
  const hasSavedLead = Boolean(listing.existingLeadId);
  const detailRows = buildListingDetailRows(listing);
  const galleryPhotoCount = Math.max(buildGalleryPhotos(listing).length, listing.photoCount || 0, listing.photoUrl ? 1 : 0);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-ink-900/55 px-3 py-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-[30px] border border-white/40 bg-[#fcfaf7] shadow-[0_32px_90px_rgba(15,23,42,0.32)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 bg-white/80 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              Listing quick view
            </p>
            <p className="mt-2 truncate text-lg font-semibold text-ink-900">{listing.address}</p>
            {buildListingLocationLine(listing) ? (
              <p className="mt-1 text-sm text-ink-500">{buildListingLocationLine(listing)}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-600 transition hover:bg-sand-50"
            aria-label="Close listing quick view"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(100vh-7rem)] overflow-y-auto xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <div className="border-b border-ink-100 xl:border-b-0 xl:border-r">
            <ListingGallery listing={listing} showAllThumbnails tall />

            <div className="space-y-6 px-5 pb-6 sm:px-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <ListingStatusBadge listing={listing} />
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500 ring-1 ring-ink-100">
                    {galleryPhotoCount} photo{galleryPhotoCount === 1 ? "" : "s"}
                  </span>
                </div>

                <p className="mt-4 text-[2.35rem] font-semibold leading-none tracking-tight text-ink-900">
                  {formatCurrency(listing.price)}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {primaryFacts.length ? (
                    primaryFacts.map((fact) => (
                      <span
                        key={fact}
                        className="rounded-full bg-ink-900 px-3 py-1.5 text-sm font-semibold text-white"
                      >
                        {fact}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-sand-100 px-3 py-1.5 text-sm font-medium text-ink-600">
                      Property details pending
                    </span>
                  )}
                </div>

                {secondaryFacts.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {secondaryFacts.map((fact) => (
                      <span
                        key={fact}
                        className="rounded-full bg-sand-50 px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-ink-100"
                      >
                        {fact}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="mt-3 text-sm text-ink-500">
                  {timelineFacts.length ? timelineFacts.join(" • ") : "RentCast for-sale inventory"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
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
                    MLS
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    {listing.mlsNumber || "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Property details
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {detailRows.map((row) => (
                    <div key={row.label} className="rounded-[18px] border border-ink-100 bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                        {row.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-5 bg-white/72 px-5 py-5 sm:px-6">
            <div className="rounded-[22px] border border-ink-100 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(28,23,19,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Acquisition workflow
              </p>
              <p className="mt-3 text-lg font-semibold text-ink-900">
                Save the listing or move straight into the lead workspace.
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                This keeps the search feeling like a real listings browser while still letting your acquisitions team act fast.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                {hasSavedLead ? (
                  <button type="button" onClick={onOpenLead} className="primary-action justify-center">
                    <ArrowTopRightOnSquareIcon className="mr-2 h-4 w-4" />
                    Open saved lead
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onImport}
                    disabled={saving}
                    className="primary-action justify-center disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <BuildingOffice2Icon className="mr-2 h-4 w-4" />
                    )}
                    Add to Potential Properties
                  </button>
                )}

                <button type="button" onClick={onClose} className="secondary-action justify-center">
                  Keep browsing
                </button>

                {hasSavedLead ? (
                  <button type="button" onClick={onOpenLead} className="ghost-action justify-center">
                    <ArrowTopRightOnSquareIcon className="mr-2 h-4 w-4" />
                    Open lead workspace
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-[22px] border border-ink-100 bg-white px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Market snapshot
              </p>
              <div className="mt-4 space-y-3">
                {timelineFacts.length ? (
                  timelineFacts.map((fact) => (
                    <div
                      key={fact}
                      className="rounded-[16px] bg-sand-50 px-4 py-3 text-sm font-medium text-ink-700"
                    >
                      {fact}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[16px] bg-sand-50 px-4 py-3 text-sm font-medium text-ink-700">
                    Listing details are still loading.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
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
  const [quickViewListingId, setQuickViewListingId] = useState("");
  const [fitBoundsToken, setFitBoundsToken] = useState(0);
  const [focusSelectedToken, setFocusSelectedToken] = useState(0);
  const [pendingViewport, setPendingViewport] = useState(null);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savingListingId, setSavingListingId] = useState("");
  const [error, setError] = useState("");
  const [resultsView, setResultsView] = useState("listing");
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
  const quickViewListing =
    listings.find((listing) => listing.id === quickViewListingId) || null;

  const searchCenter =
    searchMeta?.searchCenter ||
    (activeLocation?.latitude !== null &&
    activeLocation?.latitude !== undefined &&
    activeLocation?.longitude !== null &&
    activeLocation?.longitude !== undefined
      ? activeLocation
      : DEFAULT_MAP_CENTER);

  const resultCountLabel = buildResultCountLabel(listings.length);

  useEffect(() => {
    if (!quickViewListingId) {
      return;
    }

    if (!listings.some((listing) => listing.id === quickViewListingId)) {
      setQuickViewListingId("");
    }
  }, [listings, quickViewListingId]);

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
    setQuickViewListingId(listingId);

    if (source !== "map") {
      setFocusSelectedToken((current) => current + 1);
    }

    if (!isDesktop) {
      setIsMobileDrawerOpen(true);
    }
  };

  const handleCloseQuickView = () => {
    setQuickViewListingId("");
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
            {listings.length ? (
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Click any listing card or map marker to open the full photo-and-details quick view.
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {listings.length ? (
              <div className="flex flex-wrap items-center gap-2">
                {RESULT_VIEW_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = resultsView === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setResultsView(option.value)}
                      className={`inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-ink-900 text-white shadow-[0_12px_24px_rgba(28,23,19,0.16)]"
                          : "bg-white text-ink-600 ring-1 ring-ink-100 hover:bg-sand-50"
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {selectedListing ? (
              <button
                type="button"
                onClick={() => setQuickViewListingId(selectedListing.id)}
                className="secondary-action whitespace-nowrap"
              >
                Open selected
              </button>
            ) : null}

            {isLoading ? <ArrowPathIcon className="h-5 w-5 animate-spin text-ink-400" /> : null}
          </div>
        </div>

        {listings.length ? (
          <div className="space-y-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                selected={listing.id === selectedListing?.id}
                saving={savingListingId === listing.id}
                variant={resultsView}
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

  return (
    <>
      {isDesktop ? renderDesktopLayout() : renderMobileLayout()}
      <ListingQuickViewModal
        listing={quickViewListing}
        saving={savingListingId === quickViewListing?.id}
        onClose={handleCloseQuickView}
        onImport={() => handleImportListing(quickViewListing)}
        onOpenLead={() => handleOpenLead(quickViewListing?.existingLeadId)}
      />
    </>
  );
};

export default MarketSearchPage;
