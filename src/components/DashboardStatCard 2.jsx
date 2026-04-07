import React from "react";

const TONE_STYLES = {
  neutral: {
    badge: "bg-white text-ink-700 ring-1 ring-ink-100",
    shell: "border-ink-100 bg-white/90",
    meter: "bg-ink-900",
  },
  success: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    shell: "border-emerald-100 bg-emerald-50/60",
    meter: "bg-emerald-500",
  },
  warning: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    shell: "border-amber-100 bg-amber-50/60",
    meter: "bg-amber-500",
  },
  danger: {
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    shell: "border-rose-100 bg-rose-50/60",
    meter: "bg-rose-500",
  },
};

const DashboardStatCard = ({
  title,
  value,
  detail,
  eyebrow,
  icon: Icon,
  tone = "neutral",
  progress = null,
}) => {
  const palette = TONE_STYLES[tone] || TONE_STYLES.neutral;

  return (
    <div
      className={`rounded-[22px] border p-5 shadow-[0_12px_30px_rgba(28,23,19,0.05)] backdrop-blur-sm ${palette.shell}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">
              {eyebrow}
            </p>
          ) : null}
          <p className="mt-2 text-sm font-medium text-ink-500">{title}</p>
        </div>
        {Icon ? (
          <div className={`flex h-10 w-10 items-center justify-center rounded-[18px] ${palette.badge}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>

      <p className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">{value}</p>
      {detail ? <p className="mt-3 text-sm leading-6 text-ink-600">{detail}</p> : null}

      {typeof progress === "number" ? (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/70">
            <div
              className={`h-full rounded-full ${palette.meter}`}
              style={{ width: `${Math.max(6, Math.min(progress, 100))}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DashboardStatCard;
