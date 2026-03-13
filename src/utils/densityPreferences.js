export const DENSITY_STORAGE_KEY = "mypropai.densityPreset";
export const DEFAULT_DENSITY_PRESET = "standard";

export const DENSITY_OPTIONS = [
  {
    value: "compact",
    label: "Compact",
    description: "Tighter cards, controls, and workspace spacing.",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced spacing for everyday property operations.",
  },
  {
    value: "comfortable",
    label: "Comfortable",
    description: "More breathing room across panels and inputs.",
  },
];

export const getDensityOption = (value) =>
  DENSITY_OPTIONS.find((option) => option.value === value) ||
  DENSITY_OPTIONS.find((option) => option.value === DEFAULT_DENSITY_PRESET) ||
  DENSITY_OPTIONS[0];

export const loadDensityPreference = () => {
  if (typeof window === "undefined") {
    return DEFAULT_DENSITY_PRESET;
  }

  try {
    return getDensityOption(window.localStorage.getItem(DENSITY_STORAGE_KEY)).value;
  } catch (error) {
    return DEFAULT_DENSITY_PRESET;
  }
};

export const applyDensityPreference = (value) => {
  const option = getDensityOption(value);

  if (typeof document !== "undefined") {
    document.documentElement.dataset.densityPreset = option.value;
  }

  return option;
};

export const persistDensityPreference = (value) => {
  const option = getDensityOption(value);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, option.value);
    } catch (error) {
      // Ignore localStorage write errors and still apply the current session preference.
    }
  }

  return applyDensityPreference(option.value);
};

export const initializeDensityPreference = () =>
  applyDensityPreference(loadDensityPreference());
