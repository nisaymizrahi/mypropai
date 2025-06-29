const fetchRealtorComps = async (lat, lng, filters = {}) => {
  const {
    distance = 1,
    propertyType = "",
    bedsMin,
    bedsMax,
    bathsMin,
    bathsMax,
    sqftMin,
    sqftMax,
    priceMin,
    priceMax,
    soldInLastMonths
  } = filters;

  try {
    const url = new URL("https://mypropai-server.onrender.com/api/comps");
    url.searchParams.append("lat", lat);
    url.searchParams.append("lng", lng);
    url.searchParams.append("distance", distance);
    if (propertyType) url.searchParams.append("propertyType", propertyType);
    if (soldInLastMonths) url.searchParams.append("soldInLastMonths", soldInLastMonths);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to fetch comps");

    const comps = await res.json();

    return comps.filter((comp) => {
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
    return [];
  }
};

export default fetchRealtorComps;
