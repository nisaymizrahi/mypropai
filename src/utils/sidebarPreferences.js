export const SIDEBAR_STORAGE_KEY = "mypropai.sidebarPreset";
export const SIDEBAR_PREFERENCE_EVENT = "mypropai:sidebar-preference-change";
export const DEFAULT_SIDEBAR_PRESET = "expanded";

export const SIDEBAR_OPTIONS = [
  {
    value: "expanded",
    label: "Expanded",
    description: "Show the full desktop navigation with labels and workspace context.",
  },
  {
    value: "collapsed",
    label: "Minimized",
    description: "Keep a slimmer icon rail so you have more room to work.",
  },
];

export const getSidebarOption = (value) =>
  SIDEBAR_OPTIONS.find((option) => option.value === value) ||
  SIDEBAR_OPTIONS.find((option) => option.value === DEFAULT_SIDEBAR_PRESET) ||
  SIDEBAR_OPTIONS[0];

export const loadSidebarPreference = () => {
  if (typeof window === "undefined") {
    return DEFAULT_SIDEBAR_PRESET;
  }

  try {
    return getSidebarOption(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).value;
  } catch (error) {
    return DEFAULT_SIDEBAR_PRESET;
  }
};

export const applySidebarPreference = (value) => {
  const option = getSidebarOption(value);

  if (typeof document !== "undefined") {
    document.documentElement.dataset.sidebarPreset = option.value;
  }

  return option;
};

const announceSidebarPreferenceChange = (value) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SIDEBAR_PREFERENCE_EVENT, {
        detail: value,
      })
    );
  }
};

export const persistSidebarPreference = (value) => {
  const option = getSidebarOption(value);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, option.value);
    } catch (error) {
      // Ignore localStorage write errors and still apply the current session preference.
    }
  }

  const appliedOption = applySidebarPreference(option.value);
  announceSidebarPreferenceChange(appliedOption.value);
  return appliedOption;
};

export const initializeSidebarPreference = () =>
  applySidebarPreference(loadSidebarPreference());
