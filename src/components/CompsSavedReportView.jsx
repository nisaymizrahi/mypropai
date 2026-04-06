import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

import CompsReportPdfTemplate from "./CompsReportPdfTemplate";
import MasterDealReportSections from "./MasterDealReportSections";
import { formatCurrency, formatDate } from "../utils/compsReport";
import { exportElementToPdf, sanitizePdfFilename } from "../utils/pdfExport";

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toFixed(1)}%`;
};

const MetricPill = ({ label, value, hint }) => (
  <div className="rounded-[22px] border border-ink-100 bg-white/80 px-4 py-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-lg font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-xs text-ink-500">{hint}</p> : null}
  </div>
);

const CompsSavedReportView = ({
  report = null,
  emptyEyebrow = "Saved reports",
  emptyTitle = "No saved report was found",
  emptyMessage = "Run and save a Master Deal Report to review it here.",
}) => {
  const exportRef = useRef(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!report?.generatedAt || !exportRef.current) return;

    setIsExportingPdf(true);
    try {
      await exportElementToPdf({
        element: exportRef.current,
        filename: `${sanitizePdfFilename(report.title || report.subject?.address || "master-deal-report")}.pdf`,
        options: {
          margin: [0.22, 0.22, 0.28, 0.22],
          html2canvas: {
            scale: 2,
            backgroundColor: "#f6f1ea",
          },
        },
      });
      toast.success("PDF downloaded.");
    } catch (error) {
      console.error("Master Deal Report PDF export failed", error);
      toast.error(error.message || "Failed to export the PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!report?.generatedAt) {
    return (
      <div className="section-card p-6 sm:p-7">
        <span className="eyebrow">{emptyEyebrow}</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">{emptyTitle}</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">{emptyMessage}</p>
      </div>
    );
  }

  const property = report.propertySnapshot || {};
  const valuation = report.valuation || {};
  const deal = report.dealInputs || {};
  const analysis = report.dealAnalysis || {};
  const ai = report.aiVerdict || {};

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong overflow-hidden px-6 py-7 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Saved Master Deal Report</span>
            <h2 className="mt-4 font-display text-[2.5rem] leading-[0.95] text-ink-900">
              {report.title || report.subject?.address || "Master Deal Report"}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-600">
              Reopen the full property, comps, deal math, and verdict package exactly as it was saved, then export a polished client-ready PDF when needed.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-full border border-sand-200 bg-sand-50 px-4 py-2 text-sm font-semibold text-sand-700">
              Generated {formatDate(report.generatedAt)}
            </div>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="secondary-action gap-2 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricPill
            label="Verdict"
            value={ai.verdict || "Pending"}
            hint={`Comp support ${ai.compSupport || "—"} • Confidence ${ai.confidence || "—"}`}
          />
          <MetricPill
            label="Blended value"
            value={formatCurrency(valuation.blendedEstimate)}
            hint={`${formatCurrency(valuation.blendedLow)} to ${formatCurrency(valuation.blendedHigh)}`}
          />
          <MetricPill
            label="Asking / rehab"
            value={`${formatCurrency(deal.askingPrice)} / ${formatCurrency(deal.rehabEstimate)}`}
            hint={deal.strategy ? `${String(deal.strategy).toUpperCase()} strategy` : "Deal inputs"}
          />
          <MetricPill
            label={analysis.mode === "hold" ? "Gross yield" : "Estimated profit"}
            value={
              analysis.mode === "hold"
                ? formatPercent(analysis.metrics?.grossYieldPercent)
                : formatCurrency(analysis.metrics?.estimatedProfit)
            }
            hint={property.address || report.subject?.address || "Property"}
          />
        </div>
      </section>

      <MasterDealReportSections report={report} />

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-200vw",
          top: 0,
          width: "980px",
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <div ref={exportRef}>
          <CompsReportPdfTemplate report={report} />
        </div>
      </div>
    </div>
  );
};

export default CompsSavedReportView;
