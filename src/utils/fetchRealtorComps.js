const fetchComps = async (lat, lng, filters = {}) => {
  const { distance = 1, propertyType } = filters;

  try {
    const url = new URL("https://mypropai-server.onrender.com/api/comps");
    url.searchParams.append("lat", lat);
    url.searchParams.append("lng", lng);
    url.searchParams.append("distance", distance);
    if (propertyType) {
      url.searchParams.append("propertyType", propertyType);
    }

    const res = await fetch(url);
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
