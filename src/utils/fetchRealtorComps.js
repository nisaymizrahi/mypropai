const fetchRealtorComps = async (lat, lng, filters = {}) => {
  const {
    street,
    city,
    county,
    state,
    zip
  } = filters;

  try {
    const res = await fetch(
      `https://mypropai-server.onrender.com/api/comps?street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&county=${encodeURIComponent(county)}&state=${state}&zip=${zip}`
    );

    if (!res.ok) {
      console.error("Backend request failed:", res.statusText);
      return [];
    }

    const data = await res.json();

    return data.map((comp, i) => ({
      ...comp,
      color: "#FF0000"
    }));
  } catch (err) {
    console.error("❌ Error fetching from backend:", err);
    return [];
  }
};

export default fetchRealtorComps;
