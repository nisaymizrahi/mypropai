import React from "react";
import {
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CreditCardIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

import { formatCurrency } from "../../../utils/investmentMetrics";
import { DRAW_STATUS_OPTIONS, getFundingPaymentDraft, getFundingSourceLabel, getFundingSourceTypeLabel } from "../../../utils/capitalStack";
import {
  DrawRequestEditor,
  FinanceField,
  FinanceRow,
  FinanceSelect,
  FundingSourceEditor,
  formatDateLabel,
  formatPercent,
  MetricTile,
  ProgressBar,
} from "./PropertyFinanceShared";

const PropertyFinanceCapitalStackView = ({
  embedded = false,
  strategyLabel,
  metrics,
  fundingSources,
  totalFundingAmount,
  financeSummary,
  drawSummary,
  handleSaveFinance,
  financeForm,
  handleFinanceFieldChange,
  handleAddFundingSource,
  handleFundingSourceChange,
  handleRemoveFundingSource,
  handleAddDrawRequest,
  drawRequests,
  fundingSourceOptions,
  handleDrawRequestChange,
  handleRemoveDrawRequest,
  isSavingFinance,
  debtToCost,
}) => (
  <div className="space-y-6">
    {!embedded ? (
      <section className="surface-panel px-6 py-7 sm:px-7">
        <span className="eyebrow">Finance / Capital Stack</span>
        <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
          Model every source of capital, payment draft, and draw flow
        </h3>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
          This is the editable finance model for the property. Update the purchase basis,
          monthly carry, multiple funding sources, and lender draw tracking so returns and
          reporting stay accurate across the whole project.
        </p>
      </section>
    ) : null}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricTile
        icon={BuildingOffice2Icon}
        label="Strategy"
        value={strategyLabel}
        hint="The primary acquisitions strategy on this property."
      />
      <MetricTile
        icon={CreditCardIcon}
        label="Funding sources"
        value={fundingSources.length}
        hint={
          fundingSources.length > 0
            ? `${formatCurrency(totalFundingAmount)} modeled across all sources.`
            : "Add hard money, cards, loans, or private capital."
        }
      />
      <MetricTile
        icon={BanknotesIcon}
        label="Payment draft / month"
        value={formatCurrency(financeSummary.monthlyPaymentDraft)}
        hint="Modeled from interest-only, amortizing, revolving, or custom payments."
      />
      <MetricTile
        icon={CalendarDaysIcon}
        label="Draw funded"
        value={`${formatCurrency(drawSummary.funded)} / ${formatCurrency(drawSummary.capacity)}`}
        hint={
          drawSummary.capacity > 0
            ? `${drawSummary.activeRequests} active draw request${drawSummary.activeRequests === 1 ? "" : "s"}`
            : "Add hard money or construction sources to track draw flow."
        }
      />
    </div>

    <form
      onSubmit={handleSaveFinance}
      className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]"
    >
      <div className="space-y-4">
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Deal assumptions</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Acquisition and exit</h4>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FinanceField
              label="Purchase price"
              name="purchasePrice"
              value={financeForm.purchasePrice}
              onChange={handleFinanceFieldChange}
              type="number"
              placeholder="0"
            />
            <FinanceField
              label="ARV / exit value"
              name="arv"
              value={financeForm.arv}
              onChange={handleFinanceFieldChange}
              type="number"
              placeholder="0"
            />
            <FinanceField
              label="Buy closing cost"
              name="buyClosingCost"
              value={financeForm.buyClosingCost}
              onChange={handleFinanceFieldChange}
              type="number"
              placeholder="0"
            />
            <FinanceSelect
              label="Buy closing mode"
              name="buyClosingMode"
              value={financeForm.buyClosingMode}
              onChange={handleFinanceFieldChange}
              options={[
                { value: "percent", label: "Percent of purchase price" },
                { value: "amount", label: "Flat dollar amount" },
              ]}
            />
            <FinanceField
              label="Sell closing cost"
              name="sellClosingCost"
              value={financeForm.sellClosingCost}
              onChange={handleFinanceFieldChange}
              type="number"
              placeholder="0"
            />
            <FinanceSelect
              label="Sell closing mode"
              name="sellClosingMode"
              value={financeForm.sellClosingMode}
              onChange={handleFinanceFieldChange}
              options={[
                { value: "percent", label: "Percent of ARV" },
                { value: "amount", label: "Flat dollar amount" },
              ]}
            />
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Funding sources</span>
              <h4 className="mt-4 text-2xl font-semibold text-ink-900">Capital stack editor</h4>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Track every loan, card, private lender, or seller-finance piece here and let
                the workspace draft the payment picture automatically.
              </p>
            </div>
            <button type="button" onClick={handleAddFundingSource} className="secondary-action">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add funding source
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {fundingSources.length > 0 ? (
              fundingSources.map((source, index) => (
                <FundingSourceEditor
                  key={source.sourceId}
                  source={source}
                  index={index}
                  onChange={handleFundingSourceChange}
                  onRemove={handleRemoveFundingSource}
                  canRemove
                />
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                No funding sources modeled yet. Add the first lender, card, or equity-backed
                capital source to build the stack.
              </div>
            )}
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Draw tracker</span>
              <h4 className="mt-4 text-2xl font-semibold text-ink-900">Requests and funding flow</h4>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Use this for hard money and construction draws, expected funding dates, and
                holdbacks tied back to the exact source.
              </p>
            </div>
            <button type="button" onClick={handleAddDrawRequest} className="secondary-action">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add draw request
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {drawRequests.length > 0 ? (
              drawRequests.map((request, index) => (
                <DrawRequestEditor
                  key={request.drawId}
                  request={request}
                  index={index}
                  sourceOptions={fundingSourceOptions}
                  onChange={handleDrawRequestChange}
                  onRemove={handleRemoveDrawRequest}
                />
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                No draw requests yet. Add one when a lender reimburses phases of work or
                releases capital in stages.
              </div>
            )}
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Monthly carry</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Holding assumptions</h4>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FinanceField
              label="Holding months"
              name="holdingMonths"
              value={financeForm.holdingMonths}
              onChange={handleFinanceFieldChange}
              type="number"
              placeholder="6"
              suffix="mo"
            />
            <div className="hidden md:block" />
            <FinanceField
              label="Taxes / month"
              name="taxes"
              value={financeForm.taxes}
              onChange={handleFinanceFieldChange}
              type="number"
              placeholder="0"
            />
            <FinanceField
              label="Insurance / month"
              name="insurance"
              value={financeForm.insurance}
              onChange={handleFinanceFieldChange}
              type="number"
              placeholder="0"
            />
            <FinanceField
              label="Utilities / month"
              name="utilities"
              value={financeForm.utilities}
              onChange={handleFinanceFieldChange}
              type="number"
              placeholder="0"
            />
            <FinanceField
              label="Other monthly carry"
              name="otherMonthly"
              value={financeForm.otherMonthly}
              onChange={handleFinanceFieldChange}
              type="number"
              placeholder="0"
            />
            <FinanceField
              label="Operating reserve"
              name="operatingCashReserve"
              value={financeForm.operatingCashReserve}
              onChange={handleFinanceFieldChange}
              type="number"
              placeholder="0"
            />
            <FinanceField
              label="Contingency reserve"
              name="contingencyReserve"
              value={financeForm.contingencyReserve}
              onChange={handleFinanceFieldChange}
              type="number"
              placeholder="0"
            />
            <FinanceField
              label="Minimum cash buffer"
              name="minimumCashBuffer"
              value={financeForm.minimumCashBuffer}
              onChange={handleFinanceFieldChange}
              type="number"
              placeholder="0"
            />
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSavingFinance}
            className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSavingFinance ? "Saving..." : "Save finance assumptions"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <section className="section-card p-5">
          <span className="eyebrow">Live outcome</span>
          <h4 className="mt-4 text-xl font-semibold text-ink-900">What these inputs drive</h4>
          <div className="mt-5">
            <FinanceRow label="All-in cost" value={formatCurrency(metrics.allInCost)} />
            <FinanceRow
              label="Total debt modeled"
              value={formatCurrency(totalFundingAmount)}
              hint={`${formatPercent(debtToCost)} of project cost`}
            />
            <FinanceRow
              label="Projected profit"
              value={formatCurrency(metrics.profit)}
              tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
            />
            <FinanceRow label="Cash invested" value={formatCurrency(metrics.cashInvested)} />
            <FinanceRow
              label="Payment draft / month"
              value={formatCurrency(financeSummary.monthlyPaymentDraft)}
            />
            <FinanceRow label="ROI on cash" value={formatPercent(metrics.roiOnCash)} />
            <FinanceRow label="Annualized ROI" value={formatPercent(metrics.annualizedROI)} />
          </div>
        </section>

        <section className="section-card p-5">
          <span className="eyebrow">Capital stack snapshot</span>
          <h4 className="mt-4 text-xl font-semibold text-ink-900">Source-by-source view</h4>
          <div className="mt-5 space-y-3">
            {fundingSources.length > 0 ? (
              fundingSources.map((source, index) => (
                <div
                  key={source.sourceId}
                  className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {getFundingSourceLabel(source, index)}
                      </p>
                      <p className="mt-1 text-sm text-ink-500">
                        {getFundingSourceTypeLabel(source.type)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-ink-900">
                      {formatCurrency(source.amount || 0)}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[16px] bg-sand-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Payment draft
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink-900">
                        {formatCurrency(getFundingPaymentDraft(source))}
                      </p>
                    </div>
                    <div className="rounded-[16px] bg-verdigris-50/70 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        First due
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink-900">
                        {formatDateLabel(source.paymentStartDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 px-4 py-5 text-sm leading-6 text-ink-500">
                Add funding sources to break the deal into real capital pieces.
              </div>
            )}
          </div>
        </section>

        <section className="section-card p-5">
          <span className="eyebrow">Draw position</span>
          <h4 className="mt-4 text-xl font-semibold text-ink-900">Capacity and requests</h4>
          <div className="mt-5">
            <FinanceRow label="Draw capacity" value={formatCurrency(drawSummary.capacity)} />
            <FinanceRow label="Requested" value={formatCurrency(drawSummary.requested)} />
            <FinanceRow label="Funded" value={formatCurrency(drawSummary.funded)} />
            <FinanceRow label="Remaining capacity" value={formatCurrency(drawSummary.remaining)} />
          </div>

          <div className="mt-5 space-y-4">
            <ProgressBar
              label="Requested vs capacity"
              value={drawSummary.requested}
              total={drawSummary.capacity || 1}
              tone="bg-sky-500"
              helper={`${formatCurrency(drawSummary.requested)} requested`}
            />
            <ProgressBar
              label="Funded vs capacity"
              value={drawSummary.funded}
              total={drawSummary.capacity || 1}
              tone="bg-verdigris-500"
              helper={`${formatCurrency(drawSummary.funded)} funded`}
            />
          </div>

          <div className="mt-5 space-y-3">
            {drawRequests.length > 0 ? (
              drawRequests.slice(0, 4).map((request) => (
                <div key={request.drawId} className="rounded-[16px] bg-sand-50/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {request.label || "Unnamed draw"}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">
                        {DRAW_STATUS_OPTIONS.find((option) => option.value === request.status)?.label ||
                          "Planned"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-ink-900">
                      {formatCurrency(request.amountFunded || request.amountRequested || 0)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[16px] border border-dashed border-ink-200 bg-white/80 px-4 py-5 text-sm leading-6 text-ink-500">
                Draw requests will show here once you start tracking lender releases.
              </div>
            )}
          </div>
        </section>
      </div>
    </form>
  </div>
);

export default PropertyFinanceCapitalStackView;
