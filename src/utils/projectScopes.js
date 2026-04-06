export const PROJECT_SCOPE_OPTIONS = [
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "flooring", label: "Flooring" },
  { value: "paint", label: "Paint" },
  { value: "roof", label: "Roof" },
  { value: "hvac", label: "HVAC" },
  { value: "exterior", label: "Exterior" },
  { value: "demolition", label: "Demolition" },
  { value: "framing", label: "Framing" },
  { value: "windows-doors", label: "Windows / Doors" },
  { value: "insulation-drywall", label: "Insulation / Drywall" },
  { value: "permits-soft-costs", label: "Permit / Soft Costs" },
  { value: "cleanout", label: "Cleanout" },
  { value: "foundation-structure", label: "Foundation / Structure" },
  { value: "sitework", label: "Sitework" },
  { value: "other", label: "Other" },
];

export const getProjectScopeLabel = (scopeKey, fallback = "Custom") =>
  PROJECT_SCOPE_OPTIONS.find((option) => option.value === scopeKey)?.label || fallback;
