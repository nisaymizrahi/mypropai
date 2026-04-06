import React, { useEffect, useMemo, useState } from "react";

import CompsSavedReportView from "./CompsSavedReportView";
import { formatCurrency, formatDate } from "../utils/compsReport";

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toFixed(1)}%`;
};

const SavedCompsReportsTab = ({
  reports = [],
  isLoading = false,
  title = "Saved reports",
  description = "Open any saved Master Deal Report and review the property, value, comps, and deal verdict package.",
  emptyTitle = "No saved reports yet",
  emptyMessage = "Run a Master Deal Report, save it, and your report library will build here.",
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

  if (isLoading) {
    return (
      <div className="section-card p-6 sm:p-7">
        <span className="eyebrow">Saved reports</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">Loading saved reports</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
          Pulling your saved comps report snapshots now.
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
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="section-card p-6">
        <span className="eyebrow">Saved reports</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-ink-500">{description}</p>

        <div className="mt-6 space-y-3">
          {reports.map((report) => (
            <button
              key={report._id}
              type="button"
              onClick={() => setSelectedReportId(report._id)}
              className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                selectedReport?._id === report._id
                  ? "border-verdigris-200 bg-verdigris-50/70"
                  : "border-ink-100 bg-white hover:border-ink-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{report.title || report.address}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {report.propertySnapshot?.address || report.subject?.address || report.address}
                  </p>
                </div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                  {formatDate(report.generatedAt)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-white/80 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Verdict
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    {report.aiVerdict?.verdict || report.report?.verdict || "Pending"}
                  </p>
                </div>
                <div className="rounded-[18px] bg-white/80 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Blended value
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    {formatCurrency(report.valuation?.blendedEstimate ?? report.estimatedValue)}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-[18px] bg-white/80 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Deal snapshot
                </p>
                <p className="mt-2 text-sm font-semibold text-ink-900">
                  Ask {formatCurrency(report.dealInputs?.askingPrice ?? report.dealSnapshot?.askingPrice)}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  {report.dealAnalysis?.mode === "hold"
                    ? `Yield ${formatPercent(report.dealAnalysis?.metrics?.grossYieldPercent)}`
                    : `Profit ${formatCurrency(report.dealAnalysis?.metrics?.estimatedProfit)}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <CompsSavedReportView report={selectedReport} />
    </div>
  );
};

export default SavedCompsReportsTab;
