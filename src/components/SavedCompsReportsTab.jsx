import React, { useEffect, useMemo, useState } from "react";

import CompsSavedReportView from "./CompsSavedReportView";
import {
  buildFinancialSnapshot,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatPercent,
  getVerdictMeta,
} from "../utils/compsReport";
import { getInvestorContextLabel } from "../utils/investorTerminology";

const SavedReportCard = ({ report, isActive, onSelect }) => {
  const verdictMeta = getVerdictMeta(report);
  const financial = buildFinancialSnapshot(report);
  const primaryCount = report?.comps?.primary?.summary?.count || 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`saved-report-card ${isActive ? `saved-report-card-active saved-report-card-${verdictMeta.tone}` : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-ink-900">
            {report.propertySnapshot?.address || report.subject?.address || report.address}
          </p>
          <p className="mt-1 truncate text-sm text-ink-500">
            {report.title || "Master Deal Report"}
          </p>
        </div>
        <div className="text-right">
          <div className={`report-score-pill report-score-pill-${verdictMeta.tone}`}>{verdictMeta.score}</div>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            {verdictMeta.label}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="glass-chip">{getInvestorContextLabel(report.contextType)}</span>
        <span className="glass-chip">{formatDate(report.generatedAt)}</span>
        <span className="glass-chip">{primaryCount} primary comps</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[18px] border border-ink-100 bg-white/85 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Value</p>
          <p className="mt-2 text-sm font-semibold text-ink-900">
            {formatCurrency(report.valuation?.blendedEstimate ?? report.estimatedValue)}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Cost {formatCompactCurrency(financial.totalProjectCost)}
          </p>
        </div>
        <div className="rounded-[18px] border border-ink-100 bg-white/85 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            {financial.mode === "hold" ? "Yield" : "Profit"}
          </p>
          <p className="mt-2 text-sm font-semibold text-ink-900">
            {financial.mode === "hold"
              ? formatPercent(financial.marginPercent)
              : formatCurrency(financial.estimatedProfit)}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Ask {formatCompactCurrency(report.dealInputs?.askingPrice ?? report.dealSnapshot?.askingPrice)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-ink-600">
        {report.aiVerdict?.headline ||
          report.aiVerdict?.executiveSummary ||
          report.report?.headline ||
          "Saved report ready to reopen and export."}
      </p>
    </button>
  );
};

const SavedCompsReportsTab = ({
  reports = [],
  isLoading = false,
  title = "Saved reports",
  description = "Open any saved Master Deal Report and review the property, value, comps, and deal verdict package.",
  emptyTitle = "No saved reports yet",
  emptyMessage = "Run a Master Deal Report, save it, and your report library will build here.",
  actions = null,
  reportActions = null,
}) => {
  const [selectedReportId, setSelectedReportId] = useState("");

  useEffect(() => {
    if (!reports.length) {
      setSelectedReportId("");
      return;
    }

    setSelectedReportId((previous) => {
      if (previous && reports.some((report) => report._id === previous)) {
        return previous;
      }
      return reports[0]._id;
    });
  }, [reports]);

  const selectedReport = useMemo(
    () => reports.find((report) => report._id === selectedReportId) || reports[0] || null,
    [reports, selectedReportId]
  );

  const reportStats = useMemo(() => {
    const strongCount = reports.filter((report) => getVerdictMeta(report).label === "Strong").length;
    const averageValue =
      reports.reduce((sum, report) => sum + (Number(report.valuation?.blendedEstimate ?? report.estimatedValue) || 0), 0) /
      (reports.length || 1);

    return {
      strongCount,
      averageValue: reports.length ? averageValue : null,
      latestGeneratedAt: reports[0]?.generatedAt || null,
    };
  }, [reports]);

  if (isLoading) {
    return (
      <div className="section-card p-6 sm:p-7">
        <span className="eyebrow">Saved reports</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">Loading saved reports</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
          Pulling your report library now.
        </p>
      </div>
    );
  }

  if (!reports.length) {
    return (
      <CompsSavedReportView
        report={null}
        emptyEyebrow="Saved reports"
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        actions={actions}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <section className="surface-panel-strong px-6 py-6">
        <span className="eyebrow">Saved reports</span>
        <h3 className="mt-4 font-display text-[2.2rem] leading-[0.96] text-ink-900">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-ink-500">{description}</p>
        {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-[20px] border border-ink-100 bg-white/85 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Reports</p>
            <p className="mt-2 text-2xl font-semibold text-ink-900">{reports.length}</p>
            <p className="mt-1 text-xs text-ink-500">In this library</p>
          </div>
          <div className="rounded-[20px] border border-ink-100 bg-white/85 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Strong deals</p>
            <p className="mt-2 text-2xl font-semibold text-ink-900">{reportStats.strongCount}</p>
            <p className="mt-1 text-xs text-ink-500">Saved with a strong verdict</p>
          </div>
          <div className="rounded-[20px] border border-ink-100 bg-white/85 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Avg value</p>
            <p className="mt-2 text-2xl font-semibold text-ink-900">
              {formatCompactCurrency(reportStats.averageValue)}
            </p>
            <p className="mt-1 text-xs text-ink-500">
              Latest {formatDate(reportStats.latestGeneratedAt)}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {reports.map((report) => (
            <SavedReportCard
              key={report._id}
              report={report}
              isActive={selectedReport?._id === report._id}
              onSelect={() => setSelectedReportId(report._id)}
            />
          ))}
        </div>
      </section>

      <CompsSavedReportView report={selectedReport} actions={reportActions || actions} />
    </div>
  );
};

export default SavedCompsReportsTab;
