import { API_BASE_URL } from "../config";
import { getAuthHeaders } from "./api";

const fetchMarketComps = async ({
  address,
  lat,
  lng,
  radius = 1,
  propertyType,
  minBeds,
  maxBeds,
  minBaths,
  maxBaths,
  minSqft,
  maxSqft,
}) => {
  const params = new URLSearchParams();

  if (address) params.set("address", address);
  if (lat !== undefined && lat !== null) params.set("lat", lat);
  if (lng !== undefined && lng !== null) params.set("lng", lng);
  if (radius) params.set("radius", radius);
  if (propertyType) params.set("propertyType", propertyType);
  if (minBeds !== undefined) params.set("minBeds", minBeds);
  if (maxBeds !== undefined) params.set("maxBeds", maxBeds);
  if (minBaths !== undefined) params.set("minBaths", minBaths);
  if (maxBaths !== undefined) params.set("maxBaths", maxBaths);
  if (minSqft !== undefined) params.set("minSqft", minSqft);
  if (maxSqft !== undefined) params.set("maxSqft", maxSqft);

  const res = await fetch(`${API_BASE_URL}/comps?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch comps");
  }

  return res.json();
};

export default fetchMarketComps;
