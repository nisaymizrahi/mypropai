import { API_BASE_URL } from '../config';
// 1. IMPORT THE CORRECT FUNCTION
import { getAuthHeaders } from './api';

const fetchAttomComps = async (formData) => {
  const { lat, lng, distance, propertyType, soldInLastMonths } = formData;

  // This check ensures we don't send a request without coordinates.
  if (!lat || !lng) {
    throw new Error("Latitude and longitude are required to fetch comps.");
  }

  try {
    const url = new URL(`${API_BASE_URL}/comps`);
    
    // Add lat and lng to the URL search parameters.
    url.searchParams.append("lat", lat);
    url.searchParams.append("lng", lng);
    if (distance) url.searchParams.append("radius", distance);
    if (propertyType) url.searchParams.append("propertyType", propertyType);
    if (soldInLastMonths) url.searchParams.append("soldInLastMonths", soldInLastMonths);

    const res = await fetch(url.toString(), {
        // 2. USE THE NEW FUNCTION
        headers: getAuthHeaders() 
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch comps from the server.");
    }

    return res.json();

  } catch (err) {
    console.error("❌ Error fetching comps:", err);
    throw err; 
  }
};

export default fetchAttomComps;