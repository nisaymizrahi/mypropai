const fetchRealtorComps = async (lat, lng, filters = {}) => {
  const { distance = 3 } = filters;

  try {
    const res = await fetch(`https://mypropai-server.onrender.com/api/comps?lat=${lat}&lng=${lng}&distance=${distance}`);
    if (!res.ok) {
      console.error("Backend request failed:", res.statusText);
      return [];
    }

    const comps = await res.json();

    return comps.map((comp, i) => ({
      ...comp,
      id: comp.id || `comp-${i}`,
      color: comp.color || "#FF0000",
    }));
  } catch (err) {
    console.error("❌ Error fetching from backend:", err);
    return [];
  }
};

export default fetchRealtorComps;
