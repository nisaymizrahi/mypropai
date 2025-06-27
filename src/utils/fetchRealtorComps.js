const fetchRealtorComps = async (lat, lng, filters = {}) => {
  const {
    bedsMin,
    bedsMax,
    bathsMin,
    bathsMax,
    sqftMin,
    sqftMax,
    distance = 1
  } = filters;

  try {
    const res = await fetch(
      `http://localhost:5000/api/comps?lat=${lat}&lng=${lng}&distance=${distance}`
    );

    if (!res.ok) {
      console.error("Backend request failed:", res.statusText);
      return [];
    }

    const data = await res.json();

    const filtered = data.filter((comp) => {
      if (bedsMin && comp.beds < parseInt(bedsMin)) return false;
      if (bedsMax && comp.beds > parseInt(bedsMax)) return false;
      if (bathsMin && comp.baths < parseFloat(bathsMin)) return false;
      if (bathsMax && comp.baths > parseFloat(bathsMax)) return false;
      if (sqftMin && comp.sqft < parseInt(sqftMin)) return false;
      if (sqftMax && comp.sqft > parseInt(sqftMax)) return false;
      return true;
    });

    return filtered.map((comp, i) => ({
      ...comp,
      lat: lat + (Math.random() - 0.5) * 0.01,
      lng: lng + (Math.random() - 0.5) * 0.01,
      color: "#FF0000",
      id: comp.id || `realtor-${i}`
    }));
  } catch (err) {
    console.error("Error fetching from backend:", err);
    return [];
  }
};

export default fetchRealtorComps;
