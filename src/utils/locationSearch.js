import { GOOGLE_MAPS_API_KEY, MAPBOX_TOKEN } from "./env";
const GOOGLE_MAPS_LOAD_TIMEOUT_MS = 5000;
const GOOGLE_MAPS_CALLBACK_NAME = "__flipropGoogleMapsReady";

let googleMapsPromise = null;
let googleMapsDisabled = false;

const hasGoogleMapsKey = () => Boolean(GOOGLE_MAPS_API_KEY) && !googleMapsDisabled;
const hasMapboxToken = () => Boolean(MAPBOX_TOKEN);

const createAbortError = () => {
  if (typeof DOMException === "function") {
    return new DOMException("Request aborted", "AbortError");
  }

  const error = new Error("Request aborted");
  error.name = "AbortError";
  return error;
};

const throwIfAborted = (signal) => {
  if (signal?.aborted) {
    throw createAbortError();
  }
};

const disableGoogleMaps = () => {
  googleMapsDisabled = true;
  googleMapsPromise = null;
};

export const loadGoogleMaps = async () => {
  if (!hasGoogleMapsKey() || typeof window === "undefined") {
    return null;
  }

  if (window.google?.maps?.places && window.google?.maps?.Geocoder) {
    return window.google.maps;
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-maps-loader="fliprop"]');
    const previousAuthFailure = window.gm_authFailure;
    let settled = false;

    if (typeof window[GOOGLE_MAPS_CALLBACK_NAME] !== "function") {
      window[GOOGLE_MAPS_CALLBACK_NAME] = () => {};
    }

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      window[GOOGLE_MAPS_CALLBACK_NAME] = () => {};

      if (previousAuthFailure) {
        window.gm_authFailure = previousAuthFailure;
      } else {
        delete window.gm_authFailure;
      }
    };

    const rejectWith = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      disableGoogleMaps();
      reject(error);
    };

    const resolveMaps = () => {
      if (settled) {
        return;
      }

      const maps = window.google?.maps;
      if (!maps) {
        rejectWith(new Error("Google Maps failed to initialize."));
        return;
      }

      settled = true;
      cleanup();
      resolve(maps);
    };

    const timeoutId = window.setTimeout(() => {
      rejectWith(new Error("Google Maps failed to initialize."));
    }, GOOGLE_MAPS_LOAD_TIMEOUT_MS);

    window[GOOGLE_MAPS_CALLBACK_NAME] = () => {
      resolveMaps();
    };

    window.gm_authFailure = () => {
      if (typeof previousAuthFailure === "function") {
        previousAuthFailure();
      }

      rejectWith(new Error("Google Maps authorization failed."));
    };

    if (existingScript) {
      if (window.google?.maps) {
        resolveMaps();
        return;
      }

      existingScript.addEventListener(
        "load",
        () => resolveMaps(),
        { once: true }
      );
      existingScript.addEventListener(
        "error",
        () => {
          rejectWith(new Error("Failed to load Google Maps."));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_MAPS_API_KEY
    )}&libraries=places&loading=async&callback=${GOOGLE_MAPS_CALLBACK_NAME}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "fliprop";
    script.onload = () => {
      if (window.google?.maps) {
        resolveMaps();
      }
    };
    script.onerror = () => {
      rejectWith(new Error("Failed to load Google Maps."));
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

const buildMapboxSuggestionTypes = (options = {}) => {
  if (options.searchContext === "location") {
    return "address,place,postcode,neighborhood,locality,region";
  }

  return "address";
};

const searchWithMapbox = async (query, signal, options = {}) => {
  if (!MAPBOX_TOKEN) throw new Error("Missing REACT_APP_MAPBOX_TOKEN");
  if (!query?.trim()) return [];

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  url.searchParams.set("access_token", MAPBOX_TOKEN);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", String(options.limit || 5));
  url.searchParams.set("types", buildMapboxSuggestionTypes(options));
  url.searchParams.set("country", options.country || "us");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error("Address search failed");

  const data = await res.json();
  return data.features || [];
};

const geocodeWithGoogle = async (address) => {
  let maps;

  try {
    maps = await loadGoogleMaps();
  } catch (error) {
    if (hasMapboxToken()) {
      return geocodeWithMapbox(address);
    }

    throw error;
  }

  if (!maps?.Geocoder) {
    if (hasMapboxToken()) {
      return geocodeWithMapbox(address);
    }

    throw new Error("Google geocoder is unavailable.");
  }

  try {
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
  } catch (error) {
    disableGoogleMaps();

    if (hasMapboxToken()) {
      return geocodeWithMapbox(address);
    }

    throw error;
  }
};

const searchWithGoogleAutocompleteData = async (maps, query, signal) => {
  if (typeof maps?.importLibrary !== "function") {
    return null;
  }

  const placesLibrary = await maps.importLibrary("places");
  const autocompleteSuggestion = placesLibrary?.AutocompleteSuggestion;

  if (!autocompleteSuggestion?.fetchAutocompleteSuggestions) {
    return null;
  }

  throwIfAborted(signal);

  const response = await autocompleteSuggestion.fetchAutocompleteSuggestions({
    input: query,
    includedRegionCodes: ["us"],
    region: "us",
    language: "en-US",
  });

  throwIfAborted(signal);

  return (response?.suggestions || [])
    .map((suggestion) => {
      const prediction = suggestion?.placePrediction;
      const label =
        prediction?.text?.toString?.() ||
        prediction?.text?.text ||
        "";

      if (!label) {
        return null;
      }

      return {
        id: prediction.placeId || label,
        place_name: label,
        provider: "google",
        placeId: prediction.placeId || null,
      };
    })
    .filter(Boolean);
};

const searchWithGoogleLegacy = async (maps, query, signal, options = {}) => {
  if (!maps?.places?.AutocompleteService) {
    return null;
  }

  const autocompleteService = new maps.places.AutocompleteService();

  const predictions = await new Promise((resolve, reject) => {
    autocompleteService.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: options.country || "us" },
        types: [options.searchContext === "location" ? "geocode" : "address"],
      },
      (matches, status) => {
        if (signal?.aborted) {
          reject(createAbortError());
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

const searchWithGoogle = async (query, signal, options = {}) => {
  if (!query?.trim()) return [];
  throwIfAborted(signal);

  let maps;

  try {
    maps = await loadGoogleMaps();
  } catch (error) {
    if (hasMapboxToken()) {
      return searchWithMapbox(query, signal, options);
    }

    throw error;
  }

  if (!maps) {
    if (hasMapboxToken()) {
      return searchWithMapbox(query, signal, options);
    }

    return [];
  }

  try {
    const newResults = await searchWithGoogleAutocompleteData(maps, query, signal);
    if (Array.isArray(newResults)) {
      return newResults;
    }

    const legacyResults = await searchWithGoogleLegacy(maps, query, signal, options);
    if (Array.isArray(legacyResults)) {
      return legacyResults;
    }

    throw new Error("Google autocomplete is unavailable.");
  } catch (error) {
    if (error?.name !== "AbortError") {
      disableGoogleMaps();
    }

    if (hasMapboxToken()) {
      return searchWithMapbox(query, signal, options);
    }

    throw error;
  }
};

export const geocodeAddress = async (address) => {
  if (hasGoogleMapsKey()) {
    return geocodeWithGoogle(address);
  }

  return geocodeWithMapbox(address);
};

export const searchAddressSuggestions = async (query, signal, options = {}) => {
  if (hasGoogleMapsKey()) {
    return searchWithGoogle(query, signal, options);
  }

  return searchWithMapbox(query, signal, options);
};

export const searchLocationSuggestions = async (query, signal, options = {}) =>
  searchAddressSuggestions(query, signal, {
    ...options,
    searchContext: "location",
  });

export const getLocationProviderName = () => {
  if (hasGoogleMapsKey() && hasMapboxToken()) {
    return "Google Places with Mapbox fallback";
  }

  if (hasGoogleMapsKey()) {
    return "Google Places";
  }

  if (hasMapboxToken()) {
    return "Mapbox";
  }

  return "address lookup service";
};
