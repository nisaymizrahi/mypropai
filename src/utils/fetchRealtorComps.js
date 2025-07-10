import { API_BASE_URL } from '../config';
import { getTokenHeader } from './api'; // NEW: Import the working header function

const fetchComps = async (formData) => {
  const { address, distance, propertyType, soldInLastMonths } = formData;

  try {
    const url = new URL(`${API_BASE_URL}/comps`);
    
    url.searchParams.append("address", address);
    if (distance) url.searchParams.append("radius", distance);
    if (propertyType) url.searchParams.append("propertyType", propertyType);
    if (soldInLastMonths) url.searchParams.append("soldInLastMonths", soldInLastMonths);

    // FIXED: Use the exact same header function as all other working API calls.
    const res = await fetch(url.toString(), {
        headers: getTokenHeader() 
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch comps from the server.");
    }

    return res.json();

  } catch (err) {
    console.error("❌ Error fetching comps:", err);
    throw err; // Re-throw the error so the calling component can handle it
  }
};

export default fetchComps;
