const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

let googleMapsPromise = null;

const loadGoogleMaps = async () => {
  if (!GOOGLE_MAPS_API_KEY || typeof window === "undefined") {
    return null;
  }

  if (window.google?.maps?.places && window.google?.maps?.Geocoder) {
    return window.google.maps;
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = "__mypropaiGoogleMapsReady";

    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };

    const existingScript = document.querySelector('script[data-google-maps-loader="mypropai"]');
    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(window.google.maps),
        { once: true }
      );
      existingScript.addEventListener(
        "error",
        () => {
          googleMapsPromise = null;
          reject(new Error("Failed to load Google Maps."));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_MAPS_API_KEY
    )}&libraries=places&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "mypropai";
    script.onerror = () => {
      delete window[callbackName];
      googleMapsPromise = null;
      reject(new Error("Failed to load Google Maps."));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

const geocodeWithMapbox = async (address) => {
  if (!MAPBOX_TOKEN) throw new Error("Missing REACT_APP_MAPBOX_TOKEN");

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    address
  )}.json?access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  return res.json();
};

const searchWithMapbox = async (query, signal) => {
  if (!MAPBOX_TOKEN) throw new Error("Missing REACT_APP_MAPBOX_TOKEN");
  if (!query?.trim()) return [];

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  url.searchParams.set("access_token", MAPBOX_TOKEN);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "5");
  url.searchParams.set("types", "address");
  url.searchParams.set("country", "us");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error("Address search failed");

  const data = await res.json();
  return data.features || [];
};

const geocodeWithGoogle = async (address) => {
  const maps = await loadGoogleMaps();
  if (!maps) {
    return geocodeWithMapbox(address);
  }

  const geocoder = new maps.Geocoder();
  const results = await new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (matches, status) => {
      if (status === "OK") {
        resolve(matches || []);
        return;
      }
      if (status === "ZERO_RESULTS") {
        resolve([]);
        return;
      }
      reject(new Error("Geocoding failed"));
    });
  });

  return {
    features: results.map((result) => ({
      id: result.place_id || result.formatted_address,
      place_name: result.formatted_address,
      center: [
        result.geometry.location.lng(),
        result.geometry.location.lat(),
      ],
      provider: "google",
    })),
  };
};

const searchWithGoogle = async (query, signal) => {
  if (!query?.trim()) return [];
  if (signal?.aborted) {
    throw new DOMException("Request aborted", "AbortError");
  }

  const maps = await loadGoogleMaps();
  if (!maps?.places?.AutocompleteService) {
    return searchWithMapbox(query, signal);
  }

  const autocompleteService = new maps.places.AutocompleteService();

  const predictions = await new Promise((resolve, reject) => {
    autocompleteService.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: "us" },
        types: ["address"],
      },
      (matches, status) => {
        if (signal?.aborted) {
          reject(new DOMException("Request aborted", "AbortError"));
          return;
        }

        if (
          status === maps.places.PlacesServiceStatus.OK ||
          status === maps.places.PlacesServiceStatus.ZERO_RESULTS
        ) {
          resolve(matches || []);
          return;
        }

        reject(new Error("Address search failed"));
      }
    );
  });

  return predictions.map((prediction) => ({
    id: prediction.place_id || prediction.description,
    place_name: prediction.description,
    provider: "google",
    placeId: prediction.place_id,
  }));
};

export const geocodeAddress = async (address) => {
  if (GOOGLE_MAPS_API_KEY) {
    return geocodeWithGoogle(address);
  }

  return geocodeWithMapbox(address);
};

export const searchAddressSuggestions = async (query, signal) => {
  if (GOOGLE_MAPS_API_KEY) {
    return searchWithGoogle(query, signal);
  }

  return searchWithMapbox(query, signal);
};

export const getLocationProviderName = () =>
  GOOGLE_MAPS_API_KEY ? "Google Places" : "Mapbox";
