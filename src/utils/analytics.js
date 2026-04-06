const GA_MEASUREMENT_ID = (process.env.REACT_APP_GA_MEASUREMENT_ID || "").trim();
const ANALYTICS_DEBUG = process.env.REACT_APP_ANALYTICS_DEBUG === "true";

let initialized = false;
let lastPageViewKey = "";
let lastPageViewAt = 0;

const canUseBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

const normalizePayload = (payload = {}) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

const ensureDataLayer = () => {
  if (!canUseBrowser()) {
    return [];
  }

  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
};

const debugLog = (eventName, payload) => {
  if (!ANALYTICS_DEBUG || typeof console === "undefined") {
    return;
  }

  console.info(`[analytics] ${eventName}`, payload);
};

const loadGtagScript = () => {
  if (!canUseBrowser() || !GA_MEASUREMENT_ID) {
    return;
  }

  if (document.querySelector('script[data-analytics="gtag"]')) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    GA_MEASUREMENT_ID
  )}`;
  script.setAttribute("data-analytics", "gtag");
  document.head.appendChild(script);
};

export const initializeAnalytics = () => {
  if (!canUseBrowser() || initialized) {
    return;
  }

  ensureDataLayer();

  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  if (GA_MEASUREMENT_ID) {
    loadGtagScript();
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: false,
      anonymize_ip: true,
    });
  }

  initialized = true;
  debugLog("analytics_init", {
    ga_measurement_id: GA_MEASUREMENT_ID || "not_configured",
  });
};

export const trackAnalyticsEvent = (eventName, payload = {}) => {
  if (!canUseBrowser()) {
    return;
  }

  initializeAnalytics();

  const normalizedPayload = normalizePayload(payload);

  ensureDataLayer().push({
    event: eventName,
    ...normalizedPayload,
  });

  if (GA_MEASUREMENT_ID && typeof window.gtag === "function") {
    window.gtag("event", eventName, normalizedPayload);
  }

  debugLog(eventName, normalizedPayload);
};

export const trackPageView = ({ path, title, section = "app" }) => {
  const pagePath = path || "/";
  const pageTitle = title || document.title || "Fliprop";
  const dedupeKey = `${section}|${pagePath}|${pageTitle}`;
  const now = Date.now();

  if (dedupeKey === lastPageViewKey && now - lastPageViewAt < 750) {
    return;
  }

  lastPageViewKey = dedupeKey;
  lastPageViewAt = now;

  trackAnalyticsEvent("page_view", {
    page_path: pagePath,
    page_title: pageTitle,
    page_section: section,
  });
};

export const trackMarketingEvent = (eventName, payload = {}) => {
  trackAnalyticsEvent(eventName, {
    page_section: "marketing",
    ...payload,
  });
};

export const trackWebVital = (metric) => {
  if (!metric?.name) {
    return;
  }

  const metricValue =
    metric.name === "CLS" ? Number(metric.delta.toFixed(4)) : Math.round(metric.delta);

  trackAnalyticsEvent("web_vital", {
    page_section: "app",
    metric_name: metric.name,
    metric_value: metricValue,
    metric_id: metric.id,
    non_interaction: true,
  });
};
