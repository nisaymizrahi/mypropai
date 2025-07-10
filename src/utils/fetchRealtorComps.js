import { API_BASE_URL } from '../config'; // NEW: Import from our central config file

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const fetchRealtorComps = async (lat, lng, filters = {}) => {
  const { distance = 1, propertyType = "", bedsMin, bedsMax, bathsMin, bathsMax, sqftMin, sqftMax, priceMin, priceMax, soldInLastMonths } = filters;

  try {
    const url = new URL(`${API_BASE_URL}/comps`);
    url.searchParams.append("lng", lng);
    url.searchParams.append("lat", lat);
    url.searchParams.append("distance", distance);
    if (propertyType) url.searchParams.append("propertyType", propertyType);
    if (soldInLastMonths) url.searchParams.append("soldInLastMonths", soldInLastMonths);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to fetch comps from the server.");

    const comps = await res.json();
    return comps.filter((comp) => {
      const d = haversineDistance(lat, lng, parseFloat(comp.lat), parseFloat(comp.lng));
      if (d > parseFloat(distance)) return false;
      if (bedsMin && comp.beds < parseFloat(bedsMin)) return false;
      if (bedsMax && comp.beds > parseFloat(bedsMax)) return false;
      if (bathsMin && comp.baths < parseFloat(bathsMin)) return false;
      if (bathsMax && comp.baths > parseFloat(bathsMax)) return false;
      if (sqftMin && comp.sqft < parseFloat(sqftMin)) return false;
      if (sqftMax && comp.sqft > parseFloat(sqftMax)) return false;
      if (priceMin && comp.price < parseFloat(priceMin)) return false;
      if (priceMax && comp.price > parseFloat(priceMax)) return false;
      return true;
    });
  } catch (err) {
    console.error("❌ Error fetching comps:", err);
    throw err;
  }
};

export default fetchRealtorComps;