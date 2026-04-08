import React from "react";

export const StatCard = ({ label, value, helper = "", tone = "bg-white/86" }) => (
  <div className={`rounded-[22px] p-4 ring-1 ring-white/70 ${tone}`}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">{label}</p>
    <p className="mt-3 text-2xl font-semibold text-ink-900">{value}</p>
    {helper ? <p className="mt-2 text-sm text-ink-500">{helper}</p> : null}
  </div>
);

export const WorkspacePageShell = ({ eyebrow, title, description, actions = null, children }) => (
  <div className="space-y-5">
    <section className="surface-panel px-6 py-6 sm:px-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900">{title}</h2>
          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
    {children}
  </div>
);

export const ActionQueueCard = ({ title, detail, label, onClick, disabled = false }) => (
  <div className="flex flex-col gap-3 rounded-[20px] border border-ink-100 bg-white/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      <p className="mt-1 text-sm text-ink-500">{detail}</p>
    </div>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="secondary-action shrink-0 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {label}
    </button>
  </div>
);

export const WorkspaceLaunchCard = ({
  eyebrow,
  title,
  detail,
  label,
  onClick,
  tone = "bg-white/90",
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-[24px] border border-ink-100 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${tone}`}
  >
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{eyebrow}</p>
    <h3 className="mt-4 text-lg font-semibold text-ink-900">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-ink-500">{detail}</p>
    <span className="mt-5 inline-flex rounded-full bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white">
      {label}
    </span>
  </button>
);

export const SetupStateCard = ({
  eyebrow = "Setup",
  title,
  description,
  primaryAction = null,
  secondaryAction = null,
}) => (
  <section className="section-card p-6 sm:p-7">
    <span className="eyebrow">{eyebrow}</span>
    <h3 className="mt-4 text-2xl font-semibold text-ink-900">{title}</h3>
    <p className="mt-2 max-w-2xl text-sm text-ink-500">{description}</p>
    {primaryAction || secondaryAction ? (
      <div className="mt-5 flex flex-wrap gap-3">
        {primaryAction}
        {secondaryAction}
      </div>
    ) : null}
  </section>
);

export const LoadingStateCard = ({ label }) => (
  <div className="section-card px-6 py-10 text-center text-ink-500">{label}</div>
);
