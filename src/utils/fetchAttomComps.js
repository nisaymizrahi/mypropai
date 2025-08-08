// src/utils/fetchAttomComps.js
import { API_BASE_URL } from '../config';
import { getAuthHeaders } from './api';

/**
 * Fetch comps from the protected /api/comps endpoint.
 * - Uses Bearer token from localStorage via getAuthHeaders().
 * - Supports radius in miles via formData.radius or formData.radiusMi (default 1 mi).
 */
export default async function fetchAttomComps(lat, lng, formData = {}) {
  const radius = formData?.radiusMi ?? formData?.radius ?? 1;
  const qs = new URLSearchParams({ lat, lng, radius });

  const res = await fetch(`${API_BASE_URL}/comps?${qs.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Comps fetch failed (${res.status}). ${text}`);
  }

  return res.json();
}

