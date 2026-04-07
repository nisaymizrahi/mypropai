import React, { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhotoIcon,
  PlusIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import MarketSearchMap from "../components/MarketSearchMap";
import { importMarketSaleListing, searchMarketDealMatches } from "../utils/api";
import { formatCurrency } from "../utils/compsReport";
import {
  geocodeAddress,
  getLocationProviderName,
  searchLocationSuggestions,
} from "../utils/locationSearch";
import {
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  DAY_ON_MARKET_OPTIONS,
  DEAL_STRATEGY_OPTIONS,
  DEFAULT_DEAL_BRIEF,
  DEFAULT_DEAL_FILTERS,
  RADIUS_OPTIONS,
  RENOVATION_PRESET_OPTIONS,
  buildDealSearchPayload,
  buildGalleryPhotos,
  buildListingFacts,
  buildListingLocationLine,
  buildPriceContext,
  extractDealLocationFromFeature,
  formatInteger,
  formatMarketDate,
  getSourceLinkLabel,
  getVerdictLabel,
  getVerdictTone,
  mergeLocationChip,
  propertyFilterOptions,
} from "../utils/marketSearchDeal";

const DEFAULT_MAP_CENTER = {
  latitude: 39.8283,
  longitude: -98.5795,
  zoom: 3.5,
};

const RESULT_VIEW_OPTIONS = [
  { value: "detailed", label: "Detailed" },
  { value: "compact", label: "Compact" },
];

const normalizeString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const buildResultCountLabel = (count) =>
  `${count.toLocaleString("en-US")} matched deal${count === 1 ? "" : "s"}`;

const buildImageInitials = (listing) =>
  String(listing?.address || listing?.propertyType || "MP")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join("");

const buildMatchReasons = (listing) =>
  Array.isArray(listing?.match?.reasons) && listing.match.reasons.length
    ? listing.match.reasons
    : ["The AI screen sees enough alignment to justify a closer review."];

const buildRiskFlags = (listing) =>
  Array.isArray(listing?.match?.riskFlags) && listing.match.riskFlags.length
    ? listing.match.riskFlags
    : ["No major red flags surfaced in the first-pass screen."];

const buildListingTimeline = (listing) => {
  const photoCount = Math.max(listing?.photoCount || 0, buildGalleryPhotos(listing).length);

  return [
    listing.listedDate ? `Listed ${formatMarketDate(listing.listedDate)}` : null,
    listing.daysOnMarket ? `${listing.daysOnMarket} DOM` : null,
    photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
};

const buildListingHighlights = (listing) =>
  [
    listing.propertyType || null,
    listing.yearBuilt ? `Built ${listing.yearBuilt}` : null,
    listing.lotSize ? `Lot ${formatInteger(listing.lotSize)} sqft` : null,
    listing.mlsNumber ? `MLS ${listing.mlsNumber}` : null,
  ].filter(Boolean);

const buildListingDetailRows = (listing) => [
  { label: "Address", value: listing?.address || "—" },
  { label: "City / State", value: buildListingLocationLine(listing) || "—" },
  { label: "Price", value: formatCurrency(listing?.price) },
  {
    label: "Score",
    value: listing?.match?.score ? `${listing.match.score}/100` : "—",
  },
  {
    label: "Strategy fit",
    value: listing?.match?.strategyFit || "—",
  },
  {
    label: "Renovation fit",
    value: listing?.match?.renovationFit || "—",
  },
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
  {
    label: "Listed",
    value: formatMarketDate(listing?.listedDate),
  },
  {
    label: "Source link",
    value: getSourceLinkLabel(listing?.sourceLinkType),
  },
  {
    label: "MLS",
    value: [listing?.mlsNumber, listing?.mlsName].filter(Boolean).join(" • ") || "—",
  },
];

const mergeImportedListingState = (listing, response) => ({
  ...listing,
  existingLeadId: response.leadId || listing.existingLeadId || "",
  existingLeadStatus: response?.lead?.status || listing.existingLeadStatus || "Potential",
});

const LocationChip = ({ location, onRemove }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-ink-700 ring-1 ring-ink-100">
    <span className="rounded-full bg-sand-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">
      {location.type || "market"}
    </span>
    <span>{location.label}</span>
    <button
      type="button"
      onClick={() => onRemove(location.id)}
      className="flex h-5 w-5 items-center justify-center rounded-full text-ink-400 transition hover:bg-sand-50 hover:text-ink-700"
      aria-label={`Remove ${location.label}`}
    >
      <XMarkIcon className="h-4 w-4" />
    </button>
  </span>
);

const BriefMetric = ({ label, value, muted = false }) => (
  <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className={`mt-2 text-sm font-semibold ${muted ? "text-ink-500" : "text-ink-900"}`}>{value}</p>
  </div>
);

const ListingImage = ({ listing, tall = false, overlay = true }) => {
  const photoCount = Math.max(listing?.photoCount || 0, buildGalleryPhotos(listing).length);
  const tone = getVerdictTone(listing?.match?.verdict);

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
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone.badge}`}>
                {getVerdictLabel(listing?.match?.verdict)}
              </span>
              <span className="inline-flex items-center rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                {listing?.match?.score ? `${listing.match.score}/100` : "AI match"}
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 py-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
                {listing.propertyType || "For sale"}
              </p>
              <p className="mt-1 text-sm font-medium text-white/92">
                {buildListingLocationLine(listing) || listing.address || "Market listing"}
              </p>
              {photoCount ? (
                <p className="mt-1 text-xs font-medium text-white/72">
                  {photoCount} photo{photoCount === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-end justify-between overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(168,115,91,0.34),_transparent_42%),linear-gradient(145deg,_rgba(67,95,89,0.96),_rgba(28,23,19,0.92))] px-4 py-4 text-white ${tall ? "" : "rounded-[22px]"}`}
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/72">
          {listing.propertyType || "For sale"}
        </p>
        <p className="mt-2 text-2xl font-semibold">{buildImageInitials(listing)}</p>
      </div>
      <p className="text-xs font-medium text-white/82">
        {listing?.match?.score ? `${listing.match.score}/100 fit` : "AI screen"}
      </p>
    </div>
  );
};

const ListingGallery = ({ listing, tall = false }) => {
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
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getVerdictTone(listing?.match?.verdict).badge}`}>
            {getVerdictLabel(listing?.match?.verdict)}
          </span>
          <span className="inline-flex items-center rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
            {listing?.match?.score ? `${listing.match.score}/100` : "AI match"}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-5 py-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">Selected deal</p>
          <p className="mt-2 text-sm font-medium text-white/92">
            {buildListingLocationLine(listing) || listing.address || "Market listing"}
          </p>
        </div>
      </div>

      {galleryPhotos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto px-4 pb-4">
          {galleryPhotos.map((photo, index) => (
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

const SourceLinkButton = ({ listing, className = "secondary-action", compact = false }) =>
  listing?.sourceUrl ? (
    <a
      href={listing.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={(event) => event.stopPropagation()}
    >
      <ArrowTopRightOnSquareIcon className={`h-4 w-4 ${compact ? "" : "mr-2"}`} />
      {!compact ? getSourceLinkLabel(listing.sourceLinkType) : null}
    </a>
  ) : null;

const DealResultCard = ({
  listing,
  selected,
  saving,
  onSelect,
  onImport,
  onOpenLead,
  compact = false,
}) => {
  const tone = getVerdictTone(listing?.match?.verdict);
  const facts = buildListingFacts(listing);
  const highlights = buildListingHighlights(listing);
  const pricingContext = buildPriceContext(listing?.match);
  const reasons = buildMatchReasons(listing);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`cursor-pointer overflow-hidden rounded-[26px] border bg-white transition ${
        selected
          ? "border-ink-900/16 shadow-[0_24px_48px_rgba(28,23,19,0.1)]"
          : "border-ink-100 hover:border-ink-200 hover:shadow-[0_18px_38px_rgba(28,23,19,0.06)]"
      }`}
    >
      <div className={`grid gap-0 ${compact ? "sm:grid-cols-[168px_minmax(0,1fr)]" : ""}`}>
        <div className={compact ? "h-full min-h-[14rem]" : "h-52"}>
          <ListingImage listing={listing} />
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">AI match</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone.badge}`}>
                  {getVerdictLabel(listing?.match?.verdict)}
                </span>
                <span className={`text-xl font-semibold tracking-tight ${tone.score}`}>
                  {listing?.match?.score ? `${listing.match.score}/100` : "Unscored"}
                </span>
              </div>
            </div>

            <SourceLinkButton listing={listing} compact className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-600 transition hover:bg-sand-50" />
          </div>

          <div>
            <p className="text-[1.75rem] font-semibold leading-none tracking-tight text-ink-900">
              {formatCurrency(listing.price)}
            </p>
            <p className="mt-2 text-base font-semibold text-ink-900">{listing.address}</p>
            {buildListingLocationLine(listing) ? (
              <p className="mt-1 text-sm text-ink-500">{buildListingLocationLine(listing)}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {facts.length ? (
              facts.map((fact) => (
                <span key={fact} className="rounded-full bg-ink-900 px-3 py-1.5 text-sm font-semibold text-white">
                  {fact}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-sand-100 px-3 py-1.5 text-sm font-medium text-ink-600">
                Property details pending
              </span>
            )}
          </div>

          {highlights.length ? (
            <p className="text-sm text-ink-500">{highlights.join(" • ")}</p>
          ) : null}

          <div className="rounded-[20px] bg-sand-50/85 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                AI read
              </p>
              <p className="text-xs font-medium text-ink-500">{listing?.match?.strategyFit || "Strategy fit pending"}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-700">
              {listing?.match?.summary || "The AI screen is still shaping the investor fit for this listing."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-ink-100">
                {listing?.match?.renovationFit || "Renovation fit pending"}
              </span>
              {pricingContext.map((item) => (
                <span key={item} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-ink-100">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {reasons.slice(0, compact ? 1 : 2).map((reason) => (
                <p key={reason} className="text-sm text-ink-600">
                  {reason}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              Recommended next step
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              {listing?.match?.nextStep || "Open the listing and confirm the scope before saving."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {listing.existingLeadId ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenLead();
                }}
                className="primary-action px-4 py-2"
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

            <SourceLinkButton listing={listing} className="secondary-action px-4 py-2" />
          </div>
        </div>
      </div>
    </article>
  );
};

const QuickViewModal = ({ listing, saving, onClose, onImport, onOpenLead }) => {
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

  const detailRows = buildListingDetailRows(listing);
  const reasons = buildMatchReasons(listing);
  const riskFlags = buildRiskFlags(listing);
  const timeline = buildListingTimeline(listing);

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
              AI deal quick view
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
            aria-label="Close quick view"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(100vh-7rem)] overflow-y-auto xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <div className="border-b border-ink-100 xl:border-b-0 xl:border-r">
            <ListingGallery listing={listing} tall />

            <div className="space-y-6 px-5 pb-6 sm:px-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getVerdictTone(listing?.match?.verdict).badge}`}>
                    {getVerdictLabel(listing?.match?.verdict)}
                  </span>
                  <span className={`text-[1.4rem] font-semibold ${getVerdictTone(listing?.match?.verdict).score}`}>
                    {listing?.match?.score ? `${listing.match.score}/100` : "AI match"}
                  </span>
                </div>

                <p className="mt-4 text-[2.35rem] font-semibold leading-none tracking-tight text-ink-900">
                  {formatCurrency(listing.price)}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {buildListingFacts(listing).map((fact) => (
                    <span key={fact} className="rounded-full bg-ink-900 px-3 py-1.5 text-sm font-semibold text-white">
                      {fact}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-sand-50 px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-ink-100">
                    {listing?.match?.strategyFit || "Strategy fit pending"}
                  </span>
                  <span className="rounded-full bg-sand-50 px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-ink-100">
                    {listing?.match?.renovationFit || "Renovation fit pending"}
                  </span>
                  {buildPriceContext(listing?.match).map((item) => (
                    <span key={item} className="rounded-full bg-sand-50 px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-ink-100">
                      {item}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-7 text-ink-700">
                  {listing?.match?.summary || "The AI screen sees enough signal to keep this property in the active review set."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <BriefMetric label="Next step" value={listing?.match?.nextStep || "Open the source listing and verify condition."} />
                <BriefMetric label="Listed" value={formatMarketDate(listing?.listedDate)} muted={!listing?.listedDate} />
                <BriefMetric label="Timeline" value={timeline.length ? timeline.join(" • ") : "Market timeline pending"} muted={!timeline.length} />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Why it matches
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {reasons.map((reason) => (
                    <div key={reason} className="rounded-[18px] border border-ink-100 bg-white px-4 py-3">
                      <p className="text-sm leading-6 text-ink-700">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Risks to validate
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {riskFlags.map((risk) => (
                    <div key={risk} className="rounded-[18px] border border-ink-100 bg-white px-4 py-3">
                      <p className="text-sm leading-6 text-ink-700">{risk}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Listing details
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
                Save the deal or move straight into the lead workspace.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {listing.existingLeadId ? (
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

                <SourceLinkButton listing={listing} className="secondary-action justify-center" />

                <button type="button" onClick={onClose} className="ghost-action justify-center">
                  Keep browsing
                </button>
              </div>
            </div>

            <div className="rounded-[22px] border border-ink-100 bg-white px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Market snapshot
              </p>
              <div className="mt-4 space-y-3">
                {timeline.length ? (
                  timeline.map((item) => (
                    <div key={item} className="rounded-[16px] bg-sand-50 px-4 py-3 text-sm font-medium text-ink-700">
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[16px] bg-sand-50 px-4 py-3 text-sm font-medium text-ink-700">
                    Listing timeline is still limited on this source record.
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

const SearchBriefPanel = ({
  brief,
  filters,
  locations,
  locationQuery,
  suggestions,
  providerName,
  showAdvancedFilters,
  isLoading,
  error,
  onBriefChange,
  onLocationQueryChange,
  onAddLocation,
  onSelectSuggestion,
  onRemoveLocation,
  onFilterChange,
  onToggleAssetType,
  onToggleAdvancedFilters,
  onSearch,
}) => (
  <section className="space-y-5">
    <div>
      <span className="eyebrow">Search brief</span>
      <h1 className="mt-4 font-display text-[2.2rem] leading-[0.95] text-ink-900">
        Find live market deals that fit the way this investor actually buys.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-500">
        Build the brief like an acquisitions desk: choose the strategy, set the buy box, add multiple
        markets, and tell the AI how heavy or light the renovation should feel.
      </p>
    </div>

    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Strategy
          </span>
          <select
            name="strategy"
            value={brief.strategy}
            onChange={onBriefChange}
            className="auth-input"
          >
            {DEAL_STRATEGY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Renovation profile
          </span>
          <select
            name="renovationPreference"
            value={brief.renovationPreference}
            onChange={onBriefChange}
            className="auth-input"
          >
            {RENOVATION_PRESET_OPTIONS.map((option) => (
              <option key={option.value || "any"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Min price
          </span>
          <input
            type="number"
            inputMode="numeric"
            name="minPrice"
            value={brief.minPrice}
            onChange={onBriefChange}
            className="auth-input"
            placeholder="No minimum"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Max price
          </span>
          <input
            type="number"
            inputMode="numeric"
            name="maxPrice"
            value={brief.maxPrice}
            onChange={onBriefChange}
            className="auth-input"
            placeholder="No maximum"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
          Investor objective
        </span>
        <textarea
          name="objective"
          value={brief.objective}
          onChange={onBriefChange}
          rows={4}
          className="auth-input min-h-[7.5rem] resize-y"
          placeholder="Example: Find flip candidates with room for a meaningful value spread, avoid major foundation risk, and stay closer to cosmetic or light rehab when possible."
        />
      </label>

      <div className="rounded-[26px] border border-ink-100 bg-white px-4 py-4 shadow-[0_18px_40px_rgba(28,23,19,0.05)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              Market focus
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              Add cities, ZIP codes, and counties
            </p>
            <p className="mt-1 text-sm text-ink-500">
              Suggestions powered by {providerName}. Search runs on RentCast sale listings with AI scoring on top.
            </p>
          </div>
          <span className="rounded-full bg-sand-50 px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-ink-100">
            {locations.length} selected
          </span>
        </div>

        <div className="relative mt-4">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={locationQuery}
            onChange={onLocationQueryChange}
            className="auth-input pl-11 pr-32"
            placeholder="Try Phoenix, 85016, Maricopa County, or Buckhead"
          />
          <button
            type="button"
            onClick={onAddLocation}
            className="primary-action absolute right-1.5 top-1.5 px-4 py-2 text-sm"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add
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

        <div className="mt-4 flex flex-wrap gap-2">
          {locations.length ? (
            locations.map((location) => (
              <LocationChip key={location.id} location={location} onRemove={onRemoveLocation} />
            ))
          ) : (
            <p className="text-sm text-ink-500">No markets selected yet.</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          Asset focus
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {propertyFilterOptions.map((option) => {
            const active = brief.assetTypes.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggleAssetType(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-ink-900 text-white shadow-[0_12px_24px_rgba(28,23,19,0.14)]"
                    : "bg-white text-ink-600 ring-1 ring-ink-100 hover:bg-sand-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[22px] border border-ink-100 bg-white px-4 py-4">
        <button
          type="button"
          onClick={onToggleAdvancedFilters}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              Advanced filters
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              Beds, baths, square footage, lot size, age, and search radius
            </p>
          </div>

          {showAdvancedFilters ? (
            <ChevronUpIcon className="h-5 w-5 text-ink-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-ink-500" />
          )}
        </button>

        {showAdvancedFilters ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Search radius
              </span>
              <select name="radius" value={filters.radius} onChange={onFilterChange} className="auth-input">
                {RADIUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Single property type
              </span>
              <select name="propertyType" value={filters.propertyType} onChange={onFilterChange} className="auth-input">
                <option value="">Any property type</option>
                {propertyFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Bedrooms
              </span>
              <select name="minBedrooms" value={filters.minBedrooms} onChange={onFilterChange} className="auth-input">
                {BEDROOM_OPTIONS.map((option) => (
                  <option key={option.value || "any"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Bathrooms
              </span>
              <select name="minBathrooms" value={filters.minBathrooms} onChange={onFilterChange} className="auth-input">
                {BATHROOM_OPTIONS.map((option) => (
                  <option key={option.value || "any"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Min sqft
              </span>
              <input type="number" inputMode="numeric" name="minSquareFootage" value={filters.minSquareFootage} onChange={onFilterChange} className="auth-input" placeholder="Any" />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Max sqft
              </span>
              <input type="number" inputMode="numeric" name="maxSquareFootage" value={filters.maxSquareFootage} onChange={onFilterChange} className="auth-input" placeholder="Any" />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Min lot size
              </span>
              <input type="number" inputMode="numeric" name="minLotSize" value={filters.minLotSize} onChange={onFilterChange} className="auth-input" placeholder="Any" />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Max lot size
              </span>
              <input type="number" inputMode="numeric" name="maxLotSize" value={filters.maxLotSize} onChange={onFilterChange} className="auth-input" placeholder="Any" />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Min year built
              </span>
              <input type="number" inputMode="numeric" name="minYearBuilt" value={filters.minYearBuilt} onChange={onFilterChange} className="auth-input" placeholder="Any" />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Max year built
              </span>
              <input type="number" inputMode="numeric" name="maxYearBuilt" value={filters.maxYearBuilt} onChange={onFilterChange} className="auth-input" placeholder="Any" />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Days on market
              </span>
              <select name="maxDaysOnMarket" value={filters.maxDaysOnMarket} onChange={onFilterChange} className="auth-input">
                {DAY_ON_MARKET_OPTIONS.map((option) => (
                  <option key={option.value || "any"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-[18px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm font-medium text-clay-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSearch}
          disabled={isLoading}
          className="primary-action disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SparklesIcon className="mr-2 h-4 w-4" />
          )}
          Run AI market search
        </button>

        <p className="text-sm text-ink-500">
          Searches multiple markets, scores live listings, and keeps weak fits out of the main queue.
        </p>
      </div>
    </div>
  </section>
);

const MarketSearchPage = () => {
  const navigate = useNavigate();
  const providerName = getLocationProviderName();
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia("(min-width: 1024px)").matches
  );
  const [brief, setBrief] = useState(DEFAULT_DEAL_BRIEF);
  const [submittedBrief, setSubmittedBrief] = useState(DEFAULT_DEAL_BRIEF);
  const [filters, setFilters] = useState(DEFAULT_DEAL_FILTERS);
  const [locationQuery, setLocationQuery] = useState("");
  const deferredLocationQuery = useDeferredValue(locationQuery);
  const [locations, setLocations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [searchMeta, setSearchMeta] = useState(null);
  const [selectedResultId, setSelectedResultId] = useState("");
  const [quickViewResultId, setQuickViewResultId] = useState("");
  const [fitBoundsToken, setFitBoundsToken] = useState(0);
  const [focusSelectedToken, setFocusSelectedToken] = useState(0);
  const [pendingViewport, setPendingViewport] = useState(null);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savingListingId, setSavingListingId] = useState("");
  const [error, setError] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [resultsView, setResultsView] = useState("detailed");
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
        const resultsPayload = await searchLocationSuggestions(query, controller.signal, { limit: 6 });
        setSuggestions(resultsPayload);
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

  const selectedListing =
    results.find((listing) => listing.id === selectedResultId) || results[0] || null;
  const quickViewListing =
    results.find((listing) => listing.id === quickViewResultId) || null;

  const searchCenter = useMemo(() => {
    const firstLocation = locations.find(
      (location) => location.latitude !== null && location.longitude !== null
    );

    return firstLocation || DEFAULT_MAP_CENTER;
  }, [locations]);

  const resultCountLabel = buildResultCountLabel(results.length);

  useEffect(() => {
    if (!quickViewResultId) {
      return;
    }

    if (!results.some((listing) => listing.id === quickViewResultId)) {
      setQuickViewResultId("");
    }
  }, [results, quickViewResultId]);

  const resolveLocationChip = async (query) => {
    const geocodeResult = await geocodeAddress(query);
    const feature = geocodeResult?.features?.[0];

    if (!feature) {
      throw new Error("We couldn't resolve that market. Try a more specific city, ZIP, or county.");
    }

    return extractDealLocationFromFeature(feature, query);
  };

  const addLocationChip = async (inputValue = locationQuery.trim()) => {
    if (!inputValue) {
      return locations;
    }

    const chip = await resolveLocationChip(inputValue);
    const nextLocations = mergeLocationChip(locations, chip);
    setLocations(nextLocations);
    setLocationQuery("");
    setSuggestions([]);
    selectedQueryRef.current = chip.label;
    suppressSuggestionsRef.current = true;
    return nextLocations;
  };

  const executeSearch = async ({
    nextLocations = locations,
    viewport = null,
    nextBrief = brief,
  } = {}) => {
    if (!nextLocations.length) {
      setError("Add at least one city, ZIP code, or county before running the search.");
      return;
    }

    const payload = buildDealSearchPayload({
      brief: nextBrief,
      filters,
      locations: nextLocations,
      viewport,
    });

    setIsLoading(true);
    setError("");

    try {
      const response = await searchMarketDealMatches(payload);

      startTransition(() => {
        setResults(response.results || []);
        setSearchMeta(response.meta || null);
        setSelectedResultId((current) => {
          if (current && (response.results || []).some((listing) => listing.id === current)) {
            return current;
          }

          return response.results?.[0]?.id || "";
        });
        setQuickViewResultId("");
        setFitBoundsToken((current) => current + 1);
      });

      setSubmittedBrief(payload.brief);
      setPendingViewport(null);
      setShowSearchAreaButton(false);

      if (!isDesktop) {
        setIsMobileDrawerOpen(true);
      }
    } catch (searchError) {
      console.error("AI market search request failed", searchError);
      setError(searchError.message || "Failed to analyze the market search brief.");
      toast.error(searchError.message || "Failed to analyze the market search brief.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocation = async () => {
    try {
      await addLocationChip();
    } catch (locationError) {
      setError(locationError.message || "Failed to resolve that market.");
      toast.error(locationError.message || "Failed to resolve that market.");
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    const label = suggestion.place_name || "";
    selectedQueryRef.current = label;
    suppressSuggestionsRef.current = true;

    try {
      const chip = await resolveLocationChip(label);
      setLocations((current) => mergeLocationChip(current, chip));
      setLocationQuery("");
      setSuggestions([]);
    } catch (locationError) {
      setError(locationError.message || "Failed to resolve that market.");
      toast.error(locationError.message || "Failed to resolve that market.");
    }
  };

  const handleSearch = async () => {
    try {
      const nextLocations =
        locationQuery.trim() && !suppressSuggestionsRef.current
          ? await addLocationChip()
          : locations;
      await executeSearch({ nextLocations });
    } catch (locationError) {
      setError(locationError.message || "Failed to resolve that market.");
      toast.error(locationError.message || "Failed to resolve that market.");
    }
  };

  const handleViewportChange = (viewport) => {
    if (!locations.length && !results.length) {
      return;
    }

    setPendingViewport(viewport);
    setShowSearchAreaButton(true);
  };

  const handleSearchArea = async () => {
    if (!pendingViewport) {
      return;
    }

    await executeSearch({
      viewport: pendingViewport,
    });
  };

  const handleBriefChange = (event) => {
    const { name, value } = event.target;
    setBrief((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleToggleAssetType = (value) => {
    setBrief((current) => {
      const currentAssetTypes = Array.isArray(current.assetTypes) ? current.assetTypes : [];
      const nextAssetTypes = currentAssetTypes.includes(value)
        ? currentAssetTypes.filter((item) => item !== value)
        : [...currentAssetTypes, value];

      return {
        ...current,
        assetTypes: nextAssetTypes,
      };
    });
  };

  const handleSelectListing = (listingId, { source = "list" } = {}) => {
    setSelectedResultId(listingId);
    setQuickViewResultId(listingId);

    if (source !== "map") {
      setFocusSelectedToken((current) => current + 1);
    }

    if (!isDesktop) {
      setIsMobileDrawerOpen(true);
    }
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
        leadSource: "rentcast_ai_market_search",
        marketSearchAssessment: {
          brief: submittedBrief,
          match: listing.match,
        },
      });

      startTransition(() => {
        setResults((current) =>
          current.map((item) => (item.id === listing.id ? mergeImportedListingState(item, response) : item))
        );
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
            <span className="eyebrow">Ranked deals</span>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink-900">
              {results.length ? resultCountLabel : "No strong deals surfaced yet"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {results.length
                ? `${searchMeta?.candidateCount || results.length} candidates screened across ${
                    searchMeta?.searchedLocations?.length || locations.length
                  } market${(searchMeta?.searchedLocations?.length || locations.length) === 1 ? "" : "s"}`
                : locations.length
                  ? "The AI screened the market but did not find enough aligned deals to keep in the main queue."
                  : "Build the search brief and add markets to start screening live inventory."}
            </p>
            {searchMeta?.hiddenWeakFitCount ? (
              <p className="mt-2 text-sm leading-6 text-ink-500">
                {searchMeta.hiddenWeakFitCount} weaker-fit listing
                {searchMeta.hiddenWeakFitCount === 1 ? "" : "s"} were hidden to keep the queue tight.
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {results.length ? (
              <div className="inline-flex items-center rounded-full border border-ink-100 bg-white p-1">
                {RESULT_VIEW_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setResultsView(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      resultsView === option.value
                        ? "bg-ink-900 text-white"
                        : "text-ink-600 hover:bg-sand-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            {isLoading ? <ArrowPathIcon className="h-5 w-5 animate-spin text-ink-400" /> : null}
          </div>
        </div>

        {results.length ? (
          <div className="space-y-4">
            {results.map((listing) => (
              <DealResultCard
                key={listing.id}
                listing={listing}
                selected={listing.id === selectedListing?.id}
                saving={savingListingId === listing.id}
                compact={resultsView === "compact"}
                onSelect={() => handleSelectListing(listing.id)}
                onImport={() => handleImportListing(listing)}
                onOpenLead={() => handleOpenLead(listing.existingLeadId)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-ink-200 bg-white/72 px-5 py-10 text-center">
            <p className="text-lg font-semibold text-ink-900">
              {locations.length ? "No strong-fit deals matched this brief." : "Add a market to start."}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {locations.length
                ? "Try widening the price band, loosening a few filters, or softening the renovation preference."
                : "Cities, ZIP codes, and counties all work here, and the AI will rank the live inventory for you."}
            </p>
          </div>
        )}
      </section>
    </div>
  );

  const renderDesktopLayout = () => (
    <section className="surface-panel-strong overflow-hidden">
      <div className="grid min-h-[calc(100vh-10.5rem)] lg:grid-cols-[460px_minmax(0,1fr)]">
        <aside className="border-r border-ink-100 bg-[linear-gradient(180deg,_rgba(255,255,255,0.88),_rgba(250,246,241,0.94))]">
          <div className="flex h-[calc(100vh-10.5rem)] flex-col">
            <div className="border-b border-ink-100 px-5 py-5">
              <SearchBriefPanel
                brief={brief}
                filters={filters}
                locations={locations}
                locationQuery={locationQuery}
                suggestions={suggestions}
                providerName={providerName}
                showAdvancedFilters={showAdvancedFilters}
                isLoading={isLoading}
                error={error}
                onBriefChange={handleBriefChange}
                onLocationQueryChange={(event) => {
                  suppressSuggestionsRef.current = false;
                  setError("");
                  setLocationQuery(event.target.value);
                }}
                onAddLocation={handleAddLocation}
                onSelectSuggestion={handleSelectSuggestion}
                onRemoveLocation={(locationId) =>
                  setLocations((current) => current.filter((location) => location.id !== locationId))
                }
                onFilterChange={handleFilterChange}
                onToggleAssetType={handleToggleAssetType}
                onToggleAdvancedFilters={() => setShowAdvancedFilters((current) => !current)}
                onSearch={handleSearch}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">{renderResultsPanel()}</div>
          </div>
        </aside>

        <div className="relative h-[calc(100vh-10.5rem)] overflow-hidden">
          <MarketSearchMap
            listings={results}
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
                {locations.length
                  ? `${locations.length} market${locations.length === 1 ? "" : "s"} selected`
                  : "Add a market"}
              </span>
              {searchMeta?.hiddenWeakFitCount ? (
                <span className="glass-chip bg-white/92">{searchMeta.hiddenWeakFitCount} hidden weak fits</span>
              ) : null}
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
          <SearchBriefPanel
            brief={brief}
            filters={filters}
            locations={locations}
            locationQuery={locationQuery}
            suggestions={suggestions}
            providerName={providerName}
            showAdvancedFilters={showAdvancedFilters}
            isLoading={isLoading}
            error={error}
            onBriefChange={handleBriefChange}
            onLocationQueryChange={(event) => {
              suppressSuggestionsRef.current = false;
              setError("");
              setLocationQuery(event.target.value);
            }}
            onAddLocation={handleAddLocation}
            onSelectSuggestion={handleSelectSuggestion}
            onRemoveLocation={(locationId) =>
              setLocations((current) => current.filter((location) => location.id !== locationId))
            }
            onFilterChange={handleFilterChange}
            onToggleAssetType={handleToggleAssetType}
            onToggleAdvancedFilters={() => setShowAdvancedFilters((current) => !current)}
            onSearch={handleSearch}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setIsMobileFiltersOpen(true)} className="secondary-action">
              <AdjustmentsHorizontalIcon className="mr-2 h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="relative h-[calc(100vh-19rem)] min-h-[540px] overflow-hidden">
          <MarketSearchMap
            listings={results}
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
              {searchMeta?.hiddenWeakFitCount ? (
                <span className="glass-chip bg-white/92">{searchMeta.hiddenWeakFitCount} hidden</span>
              ) : null}
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
                    Deal queue
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

            <div className="max-h-[56vh] overflow-y-auto px-4 pb-5">{renderResultsPanel()}</div>
          </div>
        </div>
      </section>

      {isMobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-ink-900/30 p-3">
          <div className="surface-panel-strong max-h-[88vh] w-full overflow-y-auto px-5 py-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <span className="eyebrow">Advanced filters</span>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink-900">
                  Tighten the buy box
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

            <div className="space-y-3">
              <SearchBriefPanel
                brief={brief}
                filters={filters}
                locations={locations}
                locationQuery={locationQuery}
                suggestions={[]}
                providerName={providerName}
                showAdvancedFilters
                isLoading={isLoading}
                error=""
                onBriefChange={handleBriefChange}
                onLocationQueryChange={() => {}}
                onAddLocation={() => {}}
                onSelectSuggestion={() => {}}
                onRemoveLocation={() => {}}
                onFilterChange={handleFilterChange}
                onToggleAssetType={handleToggleAssetType}
                onToggleAdvancedFilters={() => {}}
                onSearch={async () => {
                  await handleSearch();
                  setIsMobileFiltersOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {isDesktop ? renderDesktopLayout() : renderMobileLayout()}
      <QuickViewModal
        listing={quickViewListing}
        saving={savingListingId === quickViewListing?.id}
        onClose={() => setQuickViewResultId("")}
        onImport={() => handleImportListing(quickViewListing)}
        onOpenLead={() => handleOpenLead(quickViewListing?.existingLeadId)}
      />
    </>
  );
};

export default MarketSearchPage;
