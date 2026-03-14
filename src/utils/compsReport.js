export const propertyTypeOptions = [
  { value: "", label: "Select property type" },
  { value: "single-family", label: "Single Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi-family", label: "Multi-Family" },
  { value: "mixed-use", label: "Mixed Use" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "other", label: "Other" },
];

export const compsPropertyTypeOptions = [
  { value: "", label: "Any property type" },
  { value: "single-family", label: "Single Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi-family-any", label: "Multi-Family (Any)" },
  { value: "multi-family-2-4", label: "Multi-Family (2-4 units)" },
  { value: "multi-family-5-plus", label: "Multi-Family (5+ units)" },
  { value: "mixed-use", label: "Mixed Use" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Vacant Land" },
  { value: "other", label: "Other" },
];

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return "—";
  return date.toLocaleDateString();
};

export const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const toNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const toInputValue = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  return String(value);
};

export const parseAddressLabel = (value = "") => {
  const [addressLine1 = "", city = "", region = ""] = String(value)
    .split(",")
    .map((part) => part.trim());
  const regionTokens = region.split(/\s+/).filter(Boolean);

  return {
    addressLine1,
    city,
    state: regionTokens[0] || "",
    zipCode: regionTokens[1] || "",
  };
};

export const composeAddress = (parts = {}) =>
  [parts.addressLine1, parts.city, parts.state, parts.zipCode].filter(Boolean).join(", ");

export const normalizePropertyType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (!normalized) return "";
  if (propertyTypeOptions.some((option) => option.value === normalized)) return normalized;
  if (normalized.includes("single")) return "single-family";
  if (normalized.includes("condo")) return "condo";
  if (normalized.includes("town")) return "townhouse";
  if (normalized.includes("multi")) return "multi-family";
  if (normalized.includes("mixed")) return "mixed-use";
  if (normalized.includes("commercial")) return "commercial";
  if (normalized.includes("land") || normalized.includes("lot")) return "land";
  return "other";
};

export const deriveCompsPropertyTypeFilter = (propertyType, unitCount) => {
  const normalizedType = normalizePropertyType(propertyType);
  const normalizedUnitCount = toNullableNumber(unitCount);

  if (!normalizedType) return "";
  if (normalizedType === "other") return "";
  if (normalizedType !== "multi-family") return normalizedType;
  if (normalizedUnitCount !== null && normalizedUnitCount >= 5) return "multi-family-5-plus";
  if (normalizedUnitCount !== null && normalizedUnitCount >= 2) return "multi-family-2-4";
  return "multi-family-any";
};

export const buildCompsFilters = (subject = {}, savedFilters = {}) => ({
  radius: toInputValue(savedFilters.radius ?? 1),
  saleDateMonths: toInputValue(savedFilters.saleDateMonths ?? 6),
  maxComps: toInputValue(savedFilters.maxComps ?? 8),
  propertyType:
    savedFilters.propertyType !== undefined
      ? String(savedFilters.propertyType || "")
      : deriveCompsPropertyTypeFilter(subject.propertyType, subject.unitCount),
  minSquareFootage: toInputValue(savedFilters.minSquareFootage),
  maxSquareFootage: toInputValue(savedFilters.maxSquareFootage),
  minLotSize: toInputValue(savedFilters.minLotSize),
  maxLotSize: toInputValue(savedFilters.maxLotSize),
});

export const buildCompsReportForm = (subject = {}) => {
  const parsedAddress = parseAddressLabel(subject.address || "");

  return {
    addressLine1: subject.addressLine1 || parsedAddress.addressLine1 || "",
    city: subject.city || parsedAddress.city || "",
    state: subject.state || parsedAddress.state || "",
    zipCode: subject.zipCode || parsedAddress.zipCode || "",
    county: subject.county || "",
    latitude: subject.latitude ?? "",
    longitude: subject.longitude ?? "",
    propertyType: normalizePropertyType(subject.propertyType),
    bedrooms: subject.bedrooms ?? "",
    bathrooms: subject.bathrooms ?? "",
    squareFootage: subject.squareFootage ?? subject.sqft ?? "",
    lotSize: subject.lotSize ?? "",
    yearBuilt: subject.yearBuilt ?? "",
    unitCount: subject.unitCount ?? "",
    sellerAskingPrice: subject.sellerAskingPrice ?? "",
    targetOffer: subject.targetOffer ?? "",
    arv: subject.arv ?? "",
    listingStatus: subject.listingStatus || "",
    listedDate: subject.listedDate || "",
    daysOnMarket: subject.daysOnMarket ?? "",
    lastSalePrice: subject.lastSalePrice ?? "",
    lastSaleDate: subject.lastSaleDate || "",
  };
};

export const buildPreviewToCompsReportForm = (preview = {}) => ({
  addressLine1: preview.addressLine1 || parseAddressLabel(preview.address || "").addressLine1 || "",
  city: preview.city || "",
  state: preview.state || "",
  zipCode: preview.zipCode || "",
  county: preview.county || "",
  latitude: preview.latitude ?? "",
  longitude: preview.longitude ?? "",
  propertyType: normalizePropertyType(preview.propertyType),
  bedrooms: preview.bedrooms ?? "",
  bathrooms: preview.bathrooms ?? "",
  squareFootage: preview.squareFootage ?? "",
  lotSize: preview.lotSize ?? "",
  yearBuilt: preview.yearBuilt ?? "",
  unitCount: preview.unitCount ?? "",
  sellerAskingPrice: preview.sellerAskingPrice ?? "",
  arv: preview.arv ?? "",
  listingStatus: preview.listingStatus || "",
  listedDate: preview.listedDate || "",
  daysOnMarket: preview.daysOnMarket ?? "",
  lastSalePrice: preview.lastSalePrice ?? "",
  lastSaleDate: preview.lastSaleDate || "",
});

export const buildStandaloneCompsSubject = (form = {}) => ({
  address: composeAddress(form),
  addressLine1: form.addressLine1 || "",
  city: form.city || "",
  state: form.state || "",
  zipCode: form.zipCode || "",
  county: form.county || "",
  latitude: toNullableNumber(form.latitude),
  longitude: toNullableNumber(form.longitude),
  propertyType: form.propertyType || "",
  bedrooms: toNullableNumber(form.bedrooms),
  bathrooms: toNullableNumber(form.bathrooms),
  squareFootage: toNullableNumber(form.squareFootage),
  lotSize: toNullableNumber(form.lotSize),
  yearBuilt: toNullableNumber(form.yearBuilt),
  unitCount: form.propertyType === "multi-family" ? toNullableNumber(form.unitCount) : null,
  sellerAskingPrice: toNullableNumber(form.sellerAskingPrice),
  targetOffer: toNullableNumber(form.targetOffer),
  arv: toNullableNumber(form.arv),
  listingStatus: form.listingStatus || "",
  listedDate: form.listedDate || null,
  daysOnMarket: toNullableNumber(form.daysOnMarket),
  lastSalePrice: toNullableNumber(form.lastSalePrice),
  lastSaleDate: form.lastSaleDate || null,
});
