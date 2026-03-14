import React, { useEffect, useMemo, useState } from "react";

import CompsSavedReportView from "./CompsSavedReportView";
import { formatCurrency, formatDate } from "../utils/compsReport";

const SavedCompsReportsTab = ({
  reports = [],
  isLoading = false,
  title = "Saved reports",
  description = "Open any saved comps report snapshot and review the selected comp set.",
  emptyTitle = "No saved reports yet",
  emptyMessage = "Run a comps analysis, choose the comps you want, and save the report to build your library here.",
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
                  <p className="mt-1 text-sm text-ink-500">{report.address}</p>
                </div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                  {formatDate(report.generatedAt)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-white/80 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Estimated value
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    {formatCurrency(report.estimatedValue)}
                  </p>
                </div>
                <div className="rounded-[18px] bg-white/80 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Selected comps
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    {report.saleCompCount || 0}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <CompsSavedReportView report={selectedReport} tableIntro="This is the saved comps report snapshot, including the comparables selected for the final report." />
    </div>
  );
};

export default SavedCompsReportsTab;
