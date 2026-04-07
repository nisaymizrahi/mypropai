export const PROJECT_UPDATE_TYPE_OPTIONS = [
  { value: "internal_note", label: "Internal Note" },
  { value: "site_visit", label: "Site Visit" },
  { value: "issue", label: "Issue" },
  { value: "vendor_update", label: "Vendor Update" },
  { value: "lender_update", label: "Lender Update" },
];

const PROJECT_UPDATE_TYPE_LABELS = PROJECT_UPDATE_TYPE_OPTIONS.reduce((accumulator, option) => {
  accumulator[option.value] = option.label;
  return accumulator;
}, {});

const PROJECT_UPDATE_TYPE_TONES = {
  internal_note: "bg-mist-50 text-ink-700",
  site_visit: "bg-sky-50 text-sky-700",
  issue: "bg-clay-50 text-clay-700",
  vendor_update: "bg-verdigris-50 text-verdigris-700",
  lender_update: "bg-sand-50 text-ink-700",
};

export const getProjectUpdateTypeLabel = (value) =>
  PROJECT_UPDATE_TYPE_LABELS[value] || "Internal Note";

export const getProjectUpdateTypeTone = (value) =>
  PROJECT_UPDATE_TYPE_TONES[value] || PROJECT_UPDATE_TYPE_TONES.internal_note;

export const formatProjectUpdateDateTime = (value, fallback = "Recently") => {
  if (!value) return fallback;

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};
