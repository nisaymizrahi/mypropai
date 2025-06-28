const fetchComps = async (lat, lng, filters = {}) => {
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
      `https://mypropai-server.onrender.com/api/comps?lat=${lat}&lng=${lng}&distance=${distance}`
    );

    if (!res.ok) {
      console.error("Backend error:", res.statusText);
      return [];
    }

    const data = await res.json();

    return data
      .filter((comp) => {
        if (bedsMin && comp.beds < +bedsMin) return false;
        if (bedsMax && comp.beds > +bedsMax) return false;
        if (bathsMin && comp.baths < +bathsMin) return false;
        if (bathsMax && comp.baths > +bathsMax) return false;
        if (sqftMin && comp.sqft < +sqftMin) return false;
        if (sqftMax && comp.sqft > +sqftMax) return false;
        return true;
      })
      .map((comp, i) => ({
        ...comp,
        id: comp.id || `comp-${i}`,
        color: comp.color || "#FF0000"
      }));
  } catch (err) {
    console.error("❌ Error fetching comps:", err);
    return [];
  }
};

export default fetchComps;
