const fetchComps = async (lat, lng, filters = {}) => {
  const {
    distance = 1,
    propertyType,
    bedsMin,
    bedsMax,
    bathsMin,
    bathsMax,
    sqftMin,
    sqftMax
  } = filters;

  try {
    const url = new URL("https://mypropai-server.onrender.com/api/comps");
    url.searchParams.append("lat", lat);
    url.searchParams.append("lng", lng);
    url.searchParams.append("distance", distance);

    if (propertyType) url.searchParams.append("propertyType", propertyType);
    if (bedsMin) url.searchParams.append("bedsMin", bedsMin);
    if (bedsMax) url.searchParams.append("bedsMax", bedsMax);
    if (bathsMin) url.searchParams.append("bathsMin", bathsMin);
    if (bathsMax) url.searchParams.append("bathsMax", bathsMax);
    if (sqftMin) url.searchParams.append("sqftMin", sqftMin);
    if (sqftMax) url.searchParams.append("sqftMax", sqftMax);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Backend error");

    const data = await res.json();

    return data
      .filter((c) => c.price > 0 && c.sqft > 0)
      .map((comp, i) => ({
        ...comp,
        id: comp.id ?? `comp-${i}`,
        color: "#FF0000",
        lat: comp.lat ?? lat + (Math.random() - 0.5) * 0.01,
        lng: comp.lng ?? lng + (Math.random() - 0.5) * 0.01
      }));
  } catch (err) {
    console.error("❌ Error fetching comps:", err);
    return [];
  }
};

export default fetchComps;
