import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";

import {
  PROPERTY_STRATEGIES,
  getInvestmentStrategyLabel,
  normalizeInvestmentStrategy,
} from "../utils/propertyStrategy";

const propertyTypeOptions = [
  { value: "", label: "Select property type" },
  { value: "single-family", label: "Single Family" },
  { value: "multi-family", label: "Multi-Family" },
  { value: "mixed-use", label: "Mixed Use" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "other", label: "Other" },
];

const strategySummaries = {
  flip: {
    title: "Resale-focused underwriting",
    description:
      "Track acquisition, rehab, financing, holding costs, and exit assumptions in one profile.",
    icon: ChartBarIcon,
  },
  fix_and_rent: {
    title: "Bridge-to-stabilization workflow",
    description:
      "Model the rehab and hold period while keeping the property ready for long-term operations.",
    icon: HomeModernIcon,
  },
  rental: {
    title: "Long-term hold setup",
    description:
      "Capture the asset profile and financing inputs needed for a cleaner operating picture.",
    icon: CurrencyDollarIcon,
  },
};

const Section = ({ eyebrow, title, description, children }) => (
  <section className="section-card p-6 sm:p-7">
    <div className="flex flex-col gap-2">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="text-2xl font-semibold text-ink-900">{title}</h2>
      {description ? (
        <p className="max-w-3xl text-sm leading-6 text-ink-500">{description}</p>
      ) : null}
    </div>

    <div className="mt-6">{children}</div>
  </section>
);

const Field = ({ label, hint, children }) => (
  <div>
    <label className="auth-label">{label}</label>
    {children}
    {hint ? <p className="mt-2 text-xs leading-5 text-ink-400">{hint}</p> : null}
  </div>
);

const ToggleField = ({ name, checked, onChange, label, description }) => (
  <label className="flex h-full cursor-pointer items-start gap-3 rounded-[24px] border border-ink-100 bg-white/90 p-4 transition hover:border-verdigris-200 hover:bg-verdigris-50/30">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="mt-1 h-4 w-4 rounded border-ink-300 text-verdigris-600 focus:ring-verdigris-200"
    />
    <span>
      <span className="block text-sm font-semibold text-ink-900">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-ink-500">{description}</span>
    </span>
  </label>
);

const InvestmentEditor = ({
  eyebrow,
  title,
  description,
  formData,
  onChange,
  onSubmit,
  message,
  isSubmitting,
  submitLabel,
  submittingLabel,
  onCancel,
  cancelLabel = "Back to investments",
  sharedProfileLocked = false,
  propertyWorkspacePath = "",
}) => {
  const strategy = normalizeInvestmentStrategy(formData?.strategy);
  const strategySummary = strategySummaries[strategy] || strategySummaries.flip;
  const StrategyIcon = strategySummary.icon;
  const propertyTypeLabel =
    propertyTypeOptions.find((option) => option.value === formData.propertyType)?.label ||
    "Property type not selected";
  const showsUnitCount = ["multi-family", "mixed-use", "commercial"].includes(
    formData.propertyType
  );
  const sharedFacts = [
    formData.bedrooms ? `${formData.bedrooms} bd` : null,
    formData.bathrooms ? `${formData.bathrooms} ba` : null,
    formData.sqft ? `${Number(formData.sqft).toLocaleString()} sqft` : null,
    formData.yearBuilt ? `Built ${formData.yearBuilt}` : null,
    showsUnitCount && formData.unitCount ? `${formData.unitCount} units` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_360px]">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight text-ink-900 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600 sm:text-lg">
              {description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-verdigris-200 bg-verdigris-50 px-4 py-2 text-sm font-medium text-verdigris-700">
                Strategy: {getInvestmentStrategyLabel(strategy)}
              </span>
              <span className="rounded-full border border-ink-200 bg-white/90 px-4 py-2 text-sm font-medium text-ink-700">
                {propertyTypeLabel}
              </span>
              <span className="rounded-full border border-sand-200 bg-sand-50 px-4 py-2 text-sm font-medium text-sand-700">
                Underwriting ready
              </span>
            </div>
          </div>

          <div className="section-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
                <StrategyIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Investment brief
                </p>
                <p className="mt-1 text-lg font-semibold text-ink-900">
                  {strategySummary.title}
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-ink-500">{strategySummary.description}</p>

            <div className="mt-6 space-y-3">
              <div className="rounded-[22px] border border-ink-100 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Address
                </p>
                <p className="mt-2 text-sm font-semibold text-ink-900">
                  {formData.address || "Add the property address to anchor this project."}
                </p>
              </div>
              <div className="rounded-[22px] border border-ink-100 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Purchase assumptions
                </p>
                <p className="mt-2 text-sm font-semibold text-ink-900">
                  {formData.purchasePrice ? `$${Number(formData.purchasePrice).toLocaleString()}` : "Set a purchase price"}
                </p>
              </div>
              <div className="rounded-[22px] border border-ink-100 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Exit target
                </p>
                <p className="mt-2 text-sm font-semibold text-ink-900">
                  {formData.arv ? `$${Number(formData.arv).toLocaleString()}` : "Set an ARV or future value"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {message?.text ? (
        <div
          className={`rounded-[26px] border px-5 py-4 text-sm ${
            message.type === "success"
              ? "border-verdigris-200 bg-verdigris-50 text-verdigris-800"
              : "border-clay-200 bg-clay-50 text-clay-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
        <Section
          eyebrow="Asset profile"
          title={sharedProfileLocked ? "Shared property identity" : "Core investment details"}
          description={
            sharedProfileLocked
              ? "Strategy stays editable here, while address and physical specs now live in the shared property workspace."
              : "Define the strategy, asset type, and basic information so the project starts with a clear operating frame."
          }
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Strategy">
              <select
                name="strategy"
                value={formData.strategy}
                onChange={onChange}
                className="auth-input appearance-none"
              >
                {PROPERTY_STRATEGIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            {sharedProfileLocked ? (
              <div className="md:col-span-2 xl:col-span-2">
                <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Shared property profile
                  </p>
                  <p className="mt-3 text-lg font-semibold text-ink-900">
                    {formData.address || "Property address not added yet"}
                  </p>
                  <p className="mt-2 text-sm text-ink-600">
                    {[propertyTypeLabel, sharedFacts || null].filter(Boolean).join(" • ")}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-ink-500">
                    Update address, type, unit count, and physical specs once from the unified property workspace.
                  </p>
                  {propertyWorkspacePath ? (
                    <Link to={propertyWorkspacePath} className="secondary-action mt-4 inline-flex">
                      Edit shared profile
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <Field label="Property type">
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={onChange}
                    className="auth-input appearance-none"
                  >
                    {propertyTypeOptions.map((option) => (
                      <option key={option.value || "empty"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {showsUnitCount ? (
                  <Field label="Unit count" hint="Shown for mixed-use, commercial, and multi-family assets.">
                    <input
                      name="unitCount"
                      type="number"
                      value={formData.unitCount}
                      onChange={onChange}
                      className="auth-input"
                      placeholder="Number of units"
                    />
                  </Field>
                ) : (
                  <div className="hidden xl:block" />
                )}

                <div className="md:col-span-2 xl:col-span-3">
                  <Field label="Address">
                    <input
                      name="address"
                      value={formData.address}
                      onChange={onChange}
                      className="auth-input"
                      placeholder="123 Main Street, City, State"
                      required
                    />
                  </Field>
                </div>
              </>
            )}
          </div>
        </Section>

        <Section
          eyebrow={sharedProfileLocked ? "Deal pricing" : "Property specs"}
          title={sharedProfileLocked ? "Investment-specific valuation inputs" : "Physical and pricing inputs"}
          description={
            sharedProfileLocked
              ? "Keep the deal math here. Physical asset details are now maintained in the shared property workspace."
              : "Capture the asset facts and baseline pricing assumptions used throughout the project."
          }
        >
          <div className={`grid gap-5 md:grid-cols-2 ${sharedProfileLocked ? "xl:grid-cols-2" : "xl:grid-cols-4"}`}>
            <Field label="Purchase price">
              <input
                name="purchasePrice"
                type="number"
                value={formData.purchasePrice}
                onChange={onChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>
            <Field label="ARV / future value">
              <input
                name="arv"
                type="number"
                value={formData.arv}
                onChange={onChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>

            {!sharedProfileLocked ? (
              <>
                <Field label="Bedrooms">
                  <input
                    name="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={onChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </Field>
                <Field label="Bathrooms">
                  <input
                    name="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={onChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </Field>
                <Field label="Square footage">
                  <input
                    name="sqft"
                    type="number"
                    value={formData.sqft}
                    onChange={onChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </Field>
                <Field label="Lot size">
                  <input
                    name="lotSize"
                    type="number"
                    value={formData.lotSize}
                    onChange={onChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </Field>
                <Field label="Year built">
                  <input
                    name="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={onChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </Field>
              </>
            ) : null}
          </div>

          {sharedProfileLocked && propertyWorkspacePath ? (
            <div className="mt-5 rounded-[22px] border border-dashed border-ink-200 bg-ink-50/60 px-4 py-4 text-sm text-ink-600">
              Physical property specs are now read-only here.
              <Link to={propertyWorkspacePath} className="ml-2 font-semibold text-verdigris-700 hover:text-verdigris-800">
                Open the property workspace
              </Link>
              {" "}to edit the shared asset profile.
            </div>
          ) : null}
        </Section>

        <Section
          eyebrow="Deal analysis"
          title="Financing and hold assumptions"
          description="These values feed the acquisition and performance tools used to assess project viability."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Buy closing cost">
              <input
                name="buyClosingCost"
                type="number"
                value={formData.buyClosingCost}
                onChange={onChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>
            <ToggleField
              name="buyClosingIsPercent"
              checked={formData.buyClosingIsPercent}
              onChange={onChange}
              label="Buying cost is a percentage"
              description="Treat the buy closing input as a percent of purchase price."
            />
            <div className="hidden xl:block" />

            <Field label="Loan amount">
              <input
                name="loanAmount"
                type="number"
                value={formData.loanAmount}
                onChange={onChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>
            <Field label="Interest rate (%)">
              <input
                name="interestRate"
                type="number"
                value={formData.interestRate}
                onChange={onChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>
            <Field label="Loan term (months)">
              <input
                name="loanTerm"
                type="number"
                value={formData.loanTerm}
                onChange={onChange}
                className="auth-input"
                placeholder="12"
              />
            </Field>
            <Field label="Loan points (%)">
              <input
                name="loanPoints"
                type="number"
                value={formData.loanPoints}
                onChange={onChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>
            <Field label="Holding period (months)">
              <input
                name="holdingMonths"
                type="number"
                value={formData.holdingMonths}
                onChange={onChange}
                className="auth-input"
                placeholder="6"
              />
            </Field>
            <Field label="Monthly taxes">
              <input
                name="taxes"
                type="number"
                value={formData.taxes}
                onChange={onChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>
            <Field label="Monthly insurance">
              <input
                name="insurance"
                type="number"
                value={formData.insurance}
                onChange={onChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>
            <Field label="Monthly utilities">
              <input
                name="utilities"
                type="number"
                value={formData.utilities}
                onChange={onChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>
            <Field label="Other monthly costs">
              <input
                name="otherMonthly"
                type="number"
                value={formData.otherMonthly}
                onChange={onChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>
            <Field label="Sell closing cost">
              <input
                name="sellClosingCost"
                type="number"
                value={formData.sellClosingCost}
                onChange={onChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>
            <ToggleField
              name="sellClosingIsPercent"
              checked={formData.sellClosingIsPercent}
              onChange={onChange}
              label="Selling cost is a percentage"
              description="Treat the sell closing input as a percent of projected ARV."
            />
          </div>
        </Section>

        <section className="section-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-700">
              <BuildingOffice2Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-ink-900">Ready to save this project?</p>
              <p className="mt-1 text-sm leading-6 text-ink-500">
                You can refine budget, schedule, documents, and operations after the project is created.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onCancel} className="ghost-action">
              <ArrowLeftIcon className="mr-2 h-5 w-5" />
              {cancelLabel}
            </button>
            <button type="submit" disabled={isSubmitting} className="primary-action">
              {isSubmitting ? submittingLabel : submitLabel}
              {!isSubmitting && <ArrowRightIcon className="ml-2 h-5 w-5" />}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

export default InvestmentEditor;
