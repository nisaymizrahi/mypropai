import React, { useMemo } from "react";

const CATEGORY_STYLES = {
  subject: { fill: "#0f766e", label: "Subject" },
  primary_valuation: { fill: "#d97706", label: "AVM valuation comp" },
  recent_sale: { fill: "#b45309", label: "Recent sale" },
  active_market: { fill: "#0284c7", label: "Active listing" },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDistanceLabel = (value) => {
  const parsed = toNumber(value);
  if (parsed === null) return "Unknown radius";
  return `${parsed.toFixed(parsed >= 10 ? 0 : 1)} mi radius`;
};

const buildPointLayout = (subject = {}, comps = [], radiusMiles = null) => {
  const subjectLat = toNumber(subject.latitude);
  const subjectLng = toNumber(subject.longitude);
  const radius = Math.max(toNumber(radiusMiles) || 1, 0.25);

  if (subjectLat === null || subjectLng === null) {
    return null;
  }

  const degreesPerMileLat = 1 / 69;
  const cosLat = Math.cos((subjectLat * Math.PI) / 180) || 1;
  const degreesPerMileLng = 1 / (69 * cosLat);
  const maxMiles = Math.max(
    radius,
    ...comps.map((comp) => Math.max(Math.abs(toNumber(comp.distance) || 0), 0.1))
  );
  const safeMiles = Math.max(maxMiles, 0.5);

  const toCanvasPoint = (latitude, longitude) => {
    const lat = toNumber(latitude);
    const lng = toNumber(longitude);
    if (lat === null || lng === null) return null;

    const deltaXMiles = (lng - subjectLng) / degreesPerMileLng;
    const deltaYMiles = (subjectLat - lat) / degreesPerMileLat;
    const normalizedX = clamp(deltaXMiles / safeMiles, -1, 1);
    const normalizedY = clamp(deltaYMiles / safeMiles, -1, 1);

    return {
      x: 210 + normalizedX * 150,
      y: 150 + normalizedY * 110,
    };
  };

  return {
    radius,
    safeMiles,
    subjectPoint: { x: 210, y: 150 },
    compPoints: comps
      .map((comp, index) => {
        const point = toCanvasPoint(comp.latitude, comp.longitude);
        if (!point) return null;
        return {
          id: comp.id || `${comp.address || "comp"}-${index}`,
          address: comp.address || "Comparable",
          distance: comp.distance,
          category: comp.category || "primary_valuation",
          ...point,
        };
      })
      .filter(Boolean),
  };
};

const LegendItem = ({ color, label }) => (
  <div className="inline-flex items-center gap-2 text-[11px] text-[#5f564f]">
    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
    <span>{label}</span>
  </div>
);

const DealMapFigure = ({
  subject = {},
  comps = [],
  radiusMiles = null,
  title = "Comp map",
  subtitle = "Subject centered with the visible report comp set.",
  className = "",
  theme = "sand",
}) => {
  const layout = useMemo(
    () => buildPointLayout(subject, Array.isArray(comps) ? comps : [], radiusMiles),
    [comps, radiusMiles, subject]
  );

  if (!layout) {
    return (
      <div
        className={`rounded-[26px] border border-dashed border-[#d8cec3] bg-[#f7f2ec] px-6 py-8 text-center ${className}`.trim()}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c7d72]">{title}</p>
        <p className="mt-3 text-sm leading-6 text-[#6d5e55]">
          Coordinates were not available for this property, so the report map could not be drawn.
        </p>
      </div>
    );
  }

  const palette =
    theme === "night"
      ? {
          shell: "bg-[#102c2b]",
          panel: "bg-[#173937]",
          border: "border-white/10",
          title: "text-white",
          subtitle: "text-white/70",
          grid: "#ffffff14",
          ring: "#ffffff18",
          label: "#ffffffb8",
        }
      : {
          shell: "bg-[#f7f2ec]",
          panel: "bg-white/88",
          border: "border-[#ddd3c7]",
          title: "text-[#1d1713]",
          subtitle: "text-[#6d5e55]",
          grid: "#d9cec1",
          ring: "#d8cec3",
          label: "#6d5e55",
        };

  return (
    <div className={`overflow-hidden rounded-[28px] border ${palette.border} ${palette.shell} ${className}`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${palette.subtitle}`}>{title}</p>
          <p className={`mt-2 text-sm leading-6 ${palette.subtitle}`}>{subtitle}</p>
        </div>
        <div className={`rounded-full border px-4 py-2 text-xs font-semibold ${palette.border} ${palette.panel} ${palette.title}`}>
          {formatDistanceLabel(radiusMiles)}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className={`rounded-[24px] border ${palette.border} ${palette.panel} p-4`}>
          <svg viewBox="0 0 420 300" className="w-full">
            <rect x="0" y="0" width="420" height="300" rx="24" fill="transparent" />
            {[60, 120, 180, 240].map((y) => (
              <line key={`h-${y}`} x1="24" y1={y} x2="396" y2={y} stroke={palette.grid} strokeWidth="1" />
            ))}
            {[80, 140, 210, 280, 340].map((x) => (
              <line key={`v-${x}`} x1={x} y1="24" x2={x} y2="276" stroke={palette.grid} strokeWidth="1" />
            ))}

            <circle cx="210" cy="150" r="110" fill="none" stroke={palette.ring} strokeWidth="1.5" strokeDasharray="6 6" />
            <circle cx="210" cy="150" r="78" fill="none" stroke={palette.ring} strokeWidth="1" />
            <circle cx="210" cy="150" r="42" fill="none" stroke={palette.ring} strokeWidth="1" />

            {layout.compPoints.map((point) => {
              const style = CATEGORY_STYLES[point.category] || CATEGORY_STYLES.primary_valuation;
              return (
                <g key={point.id}>
                  <circle cx={point.x} cy={point.y} r="6" fill={style.fill} opacity="0.92" />
                  <circle cx={point.x} cy={point.y} r="10" fill={style.fill} opacity="0.12" />
                </g>
              );
            })}

            <circle cx={layout.subjectPoint.x} cy={layout.subjectPoint.y} r="8" fill={CATEGORY_STYLES.subject.fill} />
            <circle
              cx={layout.subjectPoint.x}
              cy={layout.subjectPoint.y}
              r="16"
              fill={CATEGORY_STYLES.subject.fill}
              opacity="0.14"
            />

            <text x="210" y="292" textAnchor="middle" fontSize="11" fill={palette.label}>
              Relative layout based on subject and visible comp coordinates
            </text>
          </svg>

          <div className="mt-4 flex flex-wrap gap-4">
            <LegendItem color={CATEGORY_STYLES.subject.fill} label={CATEGORY_STYLES.subject.label} />
            <LegendItem
              color={CATEGORY_STYLES.primary_valuation.fill}
              label={CATEGORY_STYLES.primary_valuation.label}
            />
            <LegendItem color={CATEGORY_STYLES.recent_sale.fill} label={CATEGORY_STYLES.recent_sale.label} />
            <LegendItem
              color={CATEGORY_STYLES.active_market.fill}
              label={CATEGORY_STYLES.active_market.label}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealMapFigure;
