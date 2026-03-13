export const FONT_SIZE_STORAGE_KEY = "fliprop.fontSizePreset";
export const DEFAULT_FONT_SIZE_PRESET = "standard";

export const FONT_SIZE_OPTIONS = [
  {
    value: "compact",
    label: "Compact",
    description: "Smaller type and a tighter workspace layout.",
    rootSize: "15px",
    previewSize: "0.94rem",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced sizing for everyday work.",
    rootSize: "16px",
    previewSize: "1rem",
  },
  {
    value: "large",
    label: "Large",
    description: "Bigger text for easier reading.",
    rootSize: "17px",
    previewSize: "1.06rem",
  },
];

export const getFontSizeOption = (value) =>
  FONT_SIZE_OPTIONS.find((option) => option.value === value) ||
  FONT_SIZE_OPTIONS.find((option) => option.value === DEFAULT_FONT_SIZE_PRESET) ||
  FONT_SIZE_OPTIONS[0];

export const loadFontSizePreference = () => {
  if (typeof window === "undefined") {
    return DEFAULT_FONT_SIZE_PRESET;
  }

  try {
    return getFontSizeOption(window.localStorage.getItem(FONT_SIZE_STORAGE_KEY)).value;
  } catch (error) {
    return DEFAULT_FONT_SIZE_PRESET;
  }
};

export const applyFontSizePreference = (value) => {
  const option = getFontSizeOption(value);

  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--app-root-font-size", option.rootSize);
    document.documentElement.dataset.fontSizePreset = option.value;
  }

  return option;
};

export const persistFontSizePreference = (value) => {
  const option = getFontSizeOption(value);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, option.value);
    } catch (error) {
      // Ignore localStorage write errors and still apply the current session preference.
    }
  }

  return applyFontSizePreference(option.value);
};

export const initializeFontSizePreference = () =>
  applyFontSizePreference(loadFontSizePreference());
