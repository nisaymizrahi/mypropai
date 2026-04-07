import { propertyTypeOptions, toOptionalNumber } from "./compsReport";

export const DEAL_STRATEGY_OPTIONS = [
  { value: "flip", label: "Flip" },
  { value: "fix_and_rent", label: "Fix & Rent" },
];

export const RENOVATION_PRESET_OPTIONS = [
  { value: "", label: "Any rehab profile" },
  { value: "full_gut", label: "Full gut / major rehab" },
  { value: "light_rehab", label: "Light rehab" },
  { value: "cosmetic", label: "Cosmetic only" },
  { value: "avoid_major", label: "Avoid major structural / system issues" },
];

export const DEFAULT_DEAL_BRIEF = {
  strategy: "flip",
  objective: "",
  renovationPreference: "",
  minPrice: "",
  maxPrice: "",
  assetTypes: [],
};

export const DEFAULT_DEAL_FILTERS = {
  radius: "10",
  minBedrooms: "",
  maxBedrooms: "",
  minBathrooms: "",
  maxBathrooms: "",
  propertyType: "",
  minSquareFootage: "",
  maxSquareFootage: "",
  minLotSize: "",
  maxLotSize: "",
  minYearBuilt: "",
  maxYearBuilt: "",
  maxDaysOnMarket: "",
};

export const RADIUS_OPTIONS = [
  { value: "5", label: "5 mi" },
  { value: "10", label: "10 mi" },
  { value: "15", label: "15 mi" },
  { value: "20", label: "20 mi" },
  { value: "30", label: "30 mi" },
  { value: "40", label: "40 mi" },
];

export const BEDROOM_OPTIONS = [
  { value: "", label: "Any beds" },
  { value: "1", label: "1+ beds" },
  { value: "2", label: "2+ beds" },
  { value: "3", label: "3+ beds" },
  { value: "4", label: "4+ beds" },
  { value: "5", label: "5+ beds" },
];

export const BATHROOM_OPTIONS = [
  { value: "", label: "Any baths" },
  { value: "1", label: "1+ baths" },
  { value: "2", label: "2+ baths" },
  { value: "3", label: "3+ baths" },
  { value: "4", label: "4+ baths" },
];

export const DAY_ON_MARKET_OPTIONS = [
  { value: "", label: "Any age" },
  { value: "14", label: "14 days or newer" },
  { value: "30", label: "30 days or newer" },
  { value: "60", label: "60 days or newer" },
  { value: "90", label: "90 days or newer" },
];

export const propertyFilterOptions = propertyTypeOptions.filter((option) => option.value);

const normalizeString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeLocationType = (label, feature) => {
  const lowerLabel = normalizeString(label).toLowerCase();
  const placeTypes = Array.isArray(feature?.place_type) ? feature.place_type : [];

  if (placeTypes.includes("postcode")) {
    return "zip";
  }

  if (placeTypes.includes("district") || /county/.test(lowerLabel)) {
    return "county";
  }

  if (placeTypes.includes("place") || placeTypes.includes("locality")) {
    return "city";
  }

  if (placeTypes.includes("neighborhood")) {
    return "neighborhood";
  }

  return "custom";
};

const getContextEntry = (feature, prefix) =>
  (feature?.context || []).find((entry) => String(entry?.id || "").startsWith(`${prefix}.`)) || null;

const normalizeAssetTypeKey = (value) =>
  normalizeString(value)
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

export const extractDealLocationFromFeature = (feature, label = "") => {
  const center = Array.isArray(feature?.center) ? feature.center : [];
  const regionContext = getContextEntry(feature, "region");
  const placeContext = getContextEntry(feature, "place");
  const postcodeContext = getContextEntry(feature, "postcode");
  const districtContext = getContextEntry(feature, "district");
  const directRegion =
    feature?.place_type?.includes?.("region") && feature?.properties?.short_code
      ? feature.properties.short_code
      : "";
  const resolvedLabel = label || feature?.place_name || feature?.text || "";
  const bbox = Array.isArray(feature?.bbox) && feature.bbox.length === 4
    ? {
        west: Number(feature.bbox[0]),
        south: Number(feature.bbox[1]),
        east: Number(feature.bbox[2]),
        north: Number(feature.bbox[3]),
      }
    : null;
  const type = normalizeLocationType(resolvedLabel, feature);

  return {
    id: normalizeString(feature?.id || feature?.place_id || resolvedLabel) || resolvedLabel,
    label: resolvedLabel,
    type,
    address: feature?.place_name || resolvedLabel,
    city:
      feature?.place_type?.includes?.("place")
        ? feature?.text || ""
        : placeContext?.text || "",
    state:
      normalizeString(directRegion || regionContext?.short_code)
        .replace(/^us-/i, "")
        .toUpperCase(),
    zipCode:
      feature?.place_type?.includes?.("postcode")
        ? feature?.text || ""
        : postcodeContext?.text || "",
    county:
      feature?.place_type?.includes?.("district")
        ? feature?.text || ""
        : districtContext?.text || (/county/i.test(resolvedLabel) ? resolvedLabel : ""),
    latitude: Number.isFinite(Number(center[1])) ? Number(center[1]) : null,
    longitude: Number.isFinite(Number(center[0])) ? Number(center[0]) : null,
    bbox,
  };
};

export const mergeLocationChip = (locations = [], nextLocation) => {
  if (!nextLocation?.label) {
    return locations;
  }

  const nextKey = normalizeString(nextLocation.id || nextLocation.label).toLowerCase();
  const existing = locations.find(
    (location) =>
      normalizeString(location.id || location.label).toLowerCase() === nextKey ||
      normalizeString(location.label).toLowerCase() === normalizeString(nextLocation.label).toLowerCase()
  );

  if (existing) {
    return locations;
  }

  return [...locations, nextLocation];
};

export const buildDealSearchPayload = ({ brief, filters, locations, viewport }) => {
  const assetTypes = Array.isArray(brief?.assetTypes)
    ? brief.assetTypes.map((value) => normalizeAssetTypeKey(value)).filter(Boolean)
    : [];

  return {
    brief: {
      strategy: normalizeString(brief?.strategy || "flip") || "flip",
      objective: normalizeString(brief?.objective),
      renovationPreference: normalizeString(brief?.renovationPreference),
      minPrice: toOptionalNumber(brief?.minPrice),
      maxPrice: toOptionalNumber(brief?.maxPrice),
      assetTypes,
    },
    locations: Array.isArray(locations)
      ? locations.map((location) => ({
          id: location.id,
          label: location.label,
          type: location.type,
          address: location.address,
          city: location.city,
          state: location.state,
          zipCode: location.zipCode,
          county: location.county,
          latitude: location.latitude,
          longitude: location.longitude,
          bbox: location.bbox || undefined,
        }))
      : [],
    viewport: viewport || undefined,
    filters: {
      radius: toOptionalNumber(filters?.radius),
      minPrice: toOptionalNumber(brief?.minPrice),
      maxPrice: toOptionalNumber(brief?.maxPrice),
      minBedrooms: toOptionalNumber(filters?.minBedrooms),
      maxBedrooms: toOptionalNumber(filters?.maxBedrooms),
      minBathrooms: toOptionalNumber(filters?.minBathrooms),
      maxBathrooms: toOptionalNumber(filters?.maxBathrooms),
      propertyType: normalizeString(filters?.propertyType) || undefined,
      minSquareFootage: toOptionalNumber(filters?.minSquareFootage),
      maxSquareFootage: toOptionalNumber(filters?.maxSquareFootage),
      minLotSize: toOptionalNumber(filters?.minLotSize),
      maxLotSize: toOptionalNumber(filters?.maxLotSize),
      minYearBuilt: toOptionalNumber(filters?.minYearBuilt),
      maxYearBuilt: toOptionalNumber(filters?.maxYearBuilt),
      maxDaysOnMarket: toOptionalNumber(filters?.maxDaysOnMarket),
      limit: 60,
    },
  };
};

export const formatInteger = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return parsed.toLocaleString("en-US");
};

export const formatMarketDate = (value) => {
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

export const buildListingFacts = (listing = {}) =>
  [
    listing.bedrooms ? `${listing.bedrooms} bd` : null,
    listing.bathrooms ? `${listing.bathrooms} ba` : null,
    listing.squareFootage ? `${formatInteger(listing.squareFootage)} sqft` : null,
  ].filter(Boolean);

export const buildListingLocationLine = (listing = {}) => {
  const cityState = [listing.city, listing.state].filter(Boolean).join(", ");
  if (cityState && listing.zipCode) {
    return `${cityState} ${listing.zipCode}`;
  }

  return cityState || listing.zipCode || "";
};

export const buildGalleryPhotos = (listing = {}) => {
  const seen = new Set();

  return [listing.photoUrl, ...(Array.isArray(listing.photos) ? listing.photos : [])]
    .map((photo) => normalizeString(photo))
    .filter((photo) => {
      if (!photo || seen.has(photo)) {
        return false;
      }

      seen.add(photo);
      return true;
    });
};

export const getSourceLinkLabel = (sourceLinkType) => {
  if (sourceLinkType === "mls") {
    return "Open MLS Source";
  }

  if (sourceLinkType === "office") {
    return "Office Site";
  }

  if (sourceLinkType === "agent") {
    return "Agent Site";
  }

  if (sourceLinkType === "search") {
    return "Search Public Source";
  }

  return "View Listing";
};

export const getVerdictLabel = (verdict) => {
  if (verdict === "strong") {
    return "Strong Fit";
  }

  if (verdict === "weak") {
    return "Weak Fit";
  }

  return "Watch";
};

export const getVerdictTone = (verdict) => {
  if (verdict === "strong") {
    return {
      badge: "bg-verdigris-100 text-verdigris-800 ring-1 ring-verdigris-200",
      score: "text-verdigris-700",
      marker: "#2f7665",
    };
  }

  if (verdict === "weak") {
    return {
      badge: "bg-clay-100 text-clay-800 ring-1 ring-clay-200",
      score: "text-clay-700",
      marker: "#a8735b",
    };
  }

  return {
    badge: "bg-sand-100 text-ink-700 ring-1 ring-sand-200",
    score: "text-ink-700",
    marker: "#6d7f5d",
  };
};

export const buildPriceContext = (match = {}) => {
  const estimatedValue = match?.valueEstimate?.price;
  const estimatedRent = match?.rentEstimate?.rent;
  const items = [];

  if (estimatedValue) {
    items.push(`Value ${Number(estimatedValue).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}`);
  }

  if (estimatedRent) {
    items.push(`Rent ${Number(estimatedRent).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}/mo`);
  }

  return items;
};
