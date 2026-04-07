import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

import CompsReportPdfTemplate from "./CompsReportPdfTemplate";
import MasterDealReportSections from "./MasterDealReportSections";
import {
  buildFinancialSnapshot,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatPercent,
  getVerdictMeta,
} from "../utils/compsReport";
import { exportElementToPdf, sanitizePdfFilename } from "../utils/pdfExport";
import { INVESTOR_TERMS } from "../utils/investorTerminology";

const getContextLabel = (contextType = "") => {
  if (contextType === "project") return "Project report";
  if (contextType === "lead") return `${INVESTOR_TERMS.deal.singular} report`;
  if (contextType === "standalone") return "Standalone report";
  return "Saved report";
};

const SummaryPill = ({ label, value, hint }) => (
  <div className="rounded-[22px] border border-ink-100 bg-white/85 px-4 py-4">
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-lg font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
  </div>
);

const CompsSavedReportView = ({
  report = null,
  emptyEyebrow = "Saved reports",
  emptyTitle = "No saved report was found",
  emptyMessage = "Run and save a Master Deal Report to review it here.",
  actions = null,
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
          margin: [0.18, 0.18, 0.2, 0.18],
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
      <div className="surface-panel px-6 py-6 sm:px-7">
        <span className="eyebrow">{emptyEyebrow}</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">{emptyTitle}</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">{emptyMessage}</p>
        {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    );
  }

  const valuation = report.valuation || {};
  const financial = buildFinancialSnapshot(report);
  const verdictMeta = getVerdictMeta(report);

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong overflow-hidden px-6 py-6 sm:px-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="eyebrow">Saved Master Deal Report</span>
              <span className="glass-chip">{getContextLabel(report.contextType)}</span>
              <span className="glass-chip">{formatDate(report.generatedAt)}</span>
            </div>
            <h2 className="mt-4 font-display text-[2.4rem] leading-[0.95] text-ink-900">
              {report.propertySnapshot?.address || report.subject?.address || report.title || "Master Deal Report"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-600">
              Reopen the saved investor package, review the exact underwriting snapshot, and export a polished PDF when needed.
            </p>
            {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`report-score-pill report-score-pill-${verdictMeta.tone}`}>
              {verdictMeta.score}
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
          <SummaryPill
            label="Verdict"
            value={verdictMeta.label}
            hint={`${verdictMeta.compSupport} comp support • ${verdictMeta.confidence} confidence`}
          />
          <SummaryPill
            label="Estimated value"
            value={formatCurrency(valuation.blendedEstimate)}
            hint={`${formatCompactCurrency(financial.totalProjectCost)} total cost`}
          />
          <SummaryPill
            label={financial.mode === "hold" ? "Gross yield" : "Estimated profit"}
            value={
              financial.mode === "hold"
                ? formatPercent(financial.marginPercent)
                : formatCurrency(financial.estimatedProfit)
            }
            hint={`${financial.returnLabel} ${formatPercent(financial.returnPercent)}`}
          />
          <SummaryPill
            label="Asking / rehab"
            value={`${formatCompactCurrency(report.dealInputs?.askingPrice)} / ${formatCompactCurrency(
              report.dealInputs?.rehabEstimate
            )}`}
            hint={String(report.dealInputs?.strategy || "flip").toUpperCase()}
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
