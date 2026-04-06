const readEnv = (key, fallback = "") => {
  const value = import.meta.env[key];
  return value === undefined || value === null || value === "" ? fallback : value;
};

const baseUrl = import.meta.env.BASE_URL || "/";
const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

export const API_BASE_URL = readEnv("REACT_APP_API_BASE_URL", "http://localhost:5001/api");
export const AUTH_IDLE_TIMEOUT_MINUTES = Number.parseInt(
  readEnv("REACT_APP_AUTH_IDLE_TIMEOUT_MINUTES", "30"),
  10
);
export const GA_MEASUREMENT_ID = readEnv("REACT_APP_GA_MEASUREMENT_ID", "").trim();
export const ANALYTICS_DEBUG = readEnv("REACT_APP_ANALYTICS_DEBUG", "false") === "true";
export const GOOGLE_MAPS_API_KEY = readEnv("REACT_APP_GOOGLE_MAPS_API_KEY", "");
export const MAPBOX_TOKEN = readEnv("REACT_APP_MAPBOX_TOKEN", "");
export const SITE_URL = readEnv("REACT_APP_SITE_URL", "https://fliprop.com");
export const ENABLE_QA_MOCKS = readEnv("REACT_APP_ENABLE_QA_MOCKS", "false") === "true";

export const publicAssetUrl = (assetPath = "") => {
  const sanitizedAssetPath = String(assetPath).replace(/^\/+/, "");
  return `${normalizedBaseUrl}${sanitizedAssetPath}`;
};
