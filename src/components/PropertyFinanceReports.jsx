import React, { useMemo, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { generateAIReport } from "../utils/api";
import {
  getFundingCurrentBalance,
  getFundingSourceLabel,
  getFundingSourceTypeLabel,
} from "../utils/capitalStack";
import {
  formatCurrency,
  toNumber,
} from "../utils/investmentMetrics";
import {
  exportElementToPdf,
  sanitizePdfFilename,
} from "../utils/pdfExport";
import {
  getInvestmentStrategy,
  getInvestmentStrategyLabel,
} from "../utils/propertyStrategy";

const REPORT_OPTIONS = [
  {
    key: "financial",
    label: "Project financial",
    title: "Project financial report",
    description:
      "A lender- and operator-ready view of sources and uses, actual spend, forecast, and debt health.",
    fileSuffix: "project-financial-report",
    accent: "bg-verdigris-500",
  },
  {
    key: "lender",
    label: "Lender draw",
    title: "Lender draw packet",
    description:
      "A clean packet summary for draw status, support coverage, linked files, and upcoming obligations.",
    fileSuffix: "lender-draw-packet",
    accent: "bg-sky-500",
  },
  {
    key: "investor",
    label: "Investor update",
    title: "Investor update",
    description:
      "A concise progress update focused on returns, budget movement, capital exposure, and next milestones.",
    fileSuffix: "investor-update",
    accent: "bg-amber-500",
  },
];

const formatPercent = (value = 0, digits = 1) =>
  `${toNumber(value, 0).toFixed(digits)}%`;

const formatDateLabel = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "Not scheduled";
  }

  return parsed.toLocaleDateString();
};

const MetricCard = ({ icon: Icon, label, value, hint, tone = "text-ink-900" }) => (
  <div className="rounded-[22px] border border-ink-100 bg-white/90 p-5">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-50 text-ink-700">
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
      {label}
    </p>
    <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const ReportSection = ({ eyebrow, title, description, children }) => (
  <section className="rounded-[28px] border border-ink-100 bg-white/95 p-6 sm:p-7">
    {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
    <h4 className="mt-4 text-2xl font-semibold text-ink-900">{title}</h4>
    {description ? (
      <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500">{description}</p>
    ) : null}
    <div className="mt-6">{children}</div>
  </section>
);

const ReportRow = ({ label, value, hint, tone = "text-ink-900" }) => (
  <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-3 last:border-b-0">
    <div>
      <p className="text-sm font-medium text-ink-600">{label}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-ink-400">{hint}</p> : null}
    </div>
    <p className={`text-sm font-semibold ${tone}`}>{value}</p>
  </div>
);

const VisualList = ({ items = [], type = "currency" }) => {
  const maxValue = useMemo(
    () =>
      Math.max(
        1,
        ...items.map((item) =>
          Math.abs(toNumber(item?.value ?? item?.amount ?? item?.variance ?? 0, 0))
        )
      ),
    [items]
  );

  if (!items.length) {
    return (
      <div className="rounded-[20px] border border-dashed border-ink-200 bg-ink-50/45 p-5 text-sm leading-6 text-ink-500">
        Nothing has been modeled here yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const rawValue = toNumber(item?.value ?? item?.amount ?? item?.variance ?? 0, 0);
        const width = `${Math.max(8, (Math.abs(rawValue) / maxValue) * 100)}%`;
        const tone =
          item.tone ||
          (rawValue < 0 ? "bg-clay-400" : rawValue > 0 ? "bg-verdigris-500" : "bg-ink-300");
        const formattedValue =
          type === "percent"
            ? formatPercent(rawValue)
            : type === "number"
              ? rawValue.toLocaleString()
              : formatCurrency(rawValue);

        return (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink-700">{item.label}</p>
                {item.hint ? (
                  <p className="mt-1 text-xs leading-5 text-ink-400">{item.hint}</p>
                ) : null}
              </div>
              <p
                className={`text-sm font-semibold ${
                  rawValue < 0 ? "text-clay-700" : "text-ink-900"
                }`}
              >
                {formattedValue}
              </p>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
              <div className={`h-full rounded-full ${tone}`} style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StatusBadge = ({ value, tone = "bg-ink-50 text-ink-600" }) => (
  <span
    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${tone}`}
  >
    {value}
  </span>
);

const PropertyFinanceReports = ({
  property,
  investment,
  metrics,
  fundingSources = [],
  sourceItems = [],
  useItems = [],
  drawSummary,
  drawOperations = [],
  budgetCategorySummary = [],
  cashManagement,
  expenses = [],
  documents = [],
  paymentEvents = [],
}) => {
  const [selectedReport, setSelectedReport] = useState("financial");
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const reportRef = useRef(null);

  const reportMeta = REPORT_OPTIONS.find((option) => option.key === selectedReport) || REPORT_OPTIONS[0];
  const strategyLabel = getInvestmentStrategyLabel(getInvestmentStrategy(investment));
  const propertyLabel =
    property?.title || investment?.name || investment?.address || property?.address || "Property";
  const propertyAddress = investment?.address || property?.address || "";
  const generatedDate = useMemo(() => new Date().toLocaleDateString(), []);

  const recentDocuments = useMemo(
    () =>
      [...documents]
        .sort(
          (left, right) =>
            new Date(right.createdAt || right.updatedAt || 0).getTime() -
            new Date(left.createdAt || left.updatedAt || 0).getTime()
        )
        .slice(0, 6),
    [documents]
  );

  const recentExpenses = useMemo(
    () =>
      [...expenses]
        .sort((left, right) => new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime())
        .slice(0, 6),
    [expenses]
  );

  const nextPaymentEvents = useMemo(
    () =>
      [...paymentEvents]
        .filter((event) => event?.dueDate)
        .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())
        .slice(0, 6),
    [paymentEvents]
  );

  const topVarianceCategories = useMemo(
    () =>
      [...budgetCategorySummary]
        .sort((left, right) => Math.abs(right.variance) - Math.abs(left.variance))
        .slice(0, 5)
        .map((item) => ({
          label: item.label,
          value: item.variance,
          hint: `${formatCurrency(item.actual)} actual vs ${formatCurrency(item.expected)} expected`,
          tone: item.variance > 0 ? "bg-clay-400" : "bg-verdigris-500",
        })),
    [budgetCategorySummary]
  );

  const sourceBreakdown = useMemo(
    () =>
      sourceItems
        .filter((item) => toNumber(item.amount, 0) > 0)
        .map((item) => ({
          label: item.label,
          value: item.amount,
          hint: item.hint,
        })),
    [sourceItems]
  );

  const useBreakdown = useMemo(
    () =>
      useItems
        .filter((item) => toNumber(item.amount, 0) > 0)
        .map((item) => ({
          label: item.label,
          value: item.amount,
          hint: item.hint,
        })),
    [useItems]
  );

  const expenseStatusSummary = useMemo(() => {
    const groups = [
      { label: "Draft", value: 0, tone: "bg-ink-300" },
      { label: "Approved", value: 0, tone: "bg-amber-400" },
      { label: "Paid", value: 0, tone: "bg-verdigris-500" },
      { label: "Reimbursed", value: 0, tone: "bg-sky-500" },
    ];
    const groupMap = new Map(groups.map((item) => [item.label.toLowerCase(), item]));

    expenses.forEach((expense) => {
      const key = String(expense?.status || "paid").replace(/^\w/, (match) => match.toUpperCase());
      const target = groupMap.get(key.toLowerCase());
      if (target) {
        target.value += toNumber(expense.amount, 0);
      }
    });

    return groups.filter((item) => item.value > 0);
  }, [expenses]);

  const documentCategorySummary = useMemo(() => {
    const categoryMap = new Map();

    documents.forEach((document) => {
      const label = document?.category || "General";
      categoryMap.set(label, (categoryMap.get(label) || 0) + 1);
    });

    return [...categoryMap.entries()]
      .map(([label, count]) => ({
        label,
        value: count,
        hint: `${count} file${count === 1 ? "" : "s"}`,
        tone: "bg-sky-500",
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);
  }, [documents]);

  const drawPacketSummary = useMemo(() => {
    const packetReady = drawOperations.filter((item) => item.packetReady).length;
    const outstanding = drawOperations.reduce(
      (sum, item) => sum + toNumber(item.outstandingAmount, 0),
      0
    );
    const supportGap = drawOperations.reduce((sum, item) => sum + toNumber(item.supportGap, 0), 0);

    return {
      packetReady,
      outstanding,
      supportGap,
      packetDocs: documents.filter((document) => document.drawRequestId).length,
    };
  }, [documents, drawOperations]);

  const activeMetrics = useMemo(() => {
    if (selectedReport === "lender") {
      return [
        {
          icon: BanknotesIcon,
          label: "Requested",
          value: formatCurrency(drawSummary.requested),
          hint: "Total draw requests modeled so far.",
        },
        {
          icon: ReceiptPercentIcon,
          label: "Funded",
          value: formatCurrency(drawSummary.funded),
          hint: "Amount already funded back into the project.",
        },
        {
          icon: ClipboardDocumentListIcon,
          label: "Packet ready",
          value: `${drawPacketSummary.packetReady}/${drawOperations.length || 0}`,
          hint: `${drawPacketSummary.packetDocs} linked packet document${
            drawPacketSummary.packetDocs === 1 ? "" : "s"
          }.`,
        },
        {
          icon: CalendarDaysIcon,
          label: "Outstanding",
          value: formatCurrency(drawPacketSummary.outstanding),
          hint: `${formatCurrency(drawPacketSummary.supportGap)} still needs support or reimbursement alignment.`,
        },
      ];
    }

    if (selectedReport === "investor") {
      return [
        {
          icon: ChartBarIcon,
          label: "Projected profit",
          value: formatCurrency(metrics.profit),
          hint: `${formatPercent(metrics.roiOnCash)} modeled ROI on cash.`,
          tone: metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700",
        },
        {
          icon: BanknotesIcon,
          label: "Spent to date",
          value: formatCurrency(metrics.totalSpent),
          hint: `${formatCurrency(metrics.remainingBudget)} budget remaining.`,
        },
        {
          icon: ReceiptPercentIcon,
          label: "Reserve runway",
          value: `${cashManagement.reserveRunwayMonths.toFixed(1)} mo`,
          hint: `${formatCurrency(cashManagement.totalReserve)} held in reserve right now.`,
        },
        {
          icon: ClipboardDocumentListIcon,
          label: "Docs uploaded",
          value: documents.length.toLocaleString(),
          hint: `${recentDocuments.length} recent file${recentDocuments.length === 1 ? "" : "s"} included in the snapshot.`,
        },
      ];
    }

    return [
      {
        icon: BanknotesIcon,
        label: "All-in basis",
        value: formatCurrency(metrics.totalCost),
        hint: "Purchase, close, budget, finance, and holding costs.",
      },
      {
        icon: ChartBarIcon,
        label: "Projected profit",
        value: formatCurrency(metrics.profit),
        hint: `${formatPercent(metrics.roiOnCash)} ROI on cash invested.`,
        tone: metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700",
      },
      {
        icon: ReceiptPercentIcon,
        label: "Budget remaining",
        value: formatCurrency(metrics.remainingBudget),
        hint: `${formatCurrency(metrics.totalSpent)} already spent against the current budget.`,
      },
      {
        icon: CalendarDaysIcon,
        label: "Next due",
        value: nextPaymentEvents[0] ? formatDateLabel(nextPaymentEvents[0].dueDate) : "No dates",
        hint: nextPaymentEvents[0]?.sourceLabel || "No scheduled servicing dates yet.",
      },
    ];
  }, [
    cashManagement.reserveRunwayMonths,
    cashManagement.totalReserve,
    documents.length,
    drawOperations.length,
    drawPacketSummary.outstanding,
    drawPacketSummary.packetDocs,
    drawPacketSummary.packetReady,
    drawPacketSummary.supportGap,
    drawSummary.funded,
    drawSummary.requested,
    metrics.profit,
    metrics.remainingBudget,
    metrics.roiOnCash,
    metrics.totalCost,
    metrics.totalSpent,
    nextPaymentEvents,
    recentDocuments.length,
    selectedReport,
  ]);

  const handleExportReport = async () => {
    if (!reportRef.current) {
      toast.error("Report preview is not ready yet.");
      return;
    }

    try {
      setIsExporting(true);
      await exportElementToPdf({
        element: reportRef.current,
        filename: `${sanitizePdfFilename(`${propertyLabel}-${reportMeta.fileSuffix}`)}.pdf`,
      });
      toast.success(`${reportMeta.title} exported.`);
    } catch (error) {
      toast.error(error.message || "Failed to export the report.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateAiSummary = async () => {
    if (!investment?._id) {
      toast.error("Investment data is not ready yet.");
      return;
    }

    try {
      setIsGeneratingAI(true);
      const response = await generateAIReport(investment._id);
      setAiSummary(response.report || "");
      toast.success("AI narrative updated from the latest underwriting inputs.");
    } catch (error) {
      toast.error(error.message || "Failed to generate the AI narrative.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const renderFinancialReport = () => (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.94fr)]">
        <ReportSection
          eyebrow="Executive snapshot"
          title="Current deal economics"
          description="The live financial picture below combines acquisition assumptions, project budget, actual spend, financing, and hold costs."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-ink-100 bg-ink-50/55 p-5">
              <ReportRow label="Purchase price" value={formatCurrency(metrics.purchasePrice)} />
              <ReportRow label="Closing costs" value={formatCurrency(metrics.calcBuyingCost)} />
              <ReportRow label="Expected budget" value={formatCurrency(metrics.totalBudget)} />
              <ReportRow label="Financing cost" value={formatCurrency(metrics.calcFinanceCost)} />
              <ReportRow label="Holding cost" value={formatCurrency(metrics.calcHoldingCost)} />
              <ReportRow
                label="Projected profit"
                value={formatCurrency(metrics.profit)}
                tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
              />
            </div>
            <div className="rounded-[22px] border border-ink-100 bg-ink-50/55 p-5">
              <ReportRow label="ARV / exit value" value={formatCurrency(metrics.arv)} />
              <ReportRow label="Cash invested" value={formatCurrency(metrics.cashInvested)} />
              <ReportRow label="Breakeven ARV" value={formatCurrency(metrics.breakevenARV)} />
              <ReportRow label="ROI on cash" value={formatPercent(metrics.roiOnCash)} />
              <ReportRow
                label="Annualized ROI"
                value={formatPercent(metrics.annualizedROI)}
              />
              <ReportRow
                label="Reserve runway"
                value={`${cashManagement.reserveRunwayMonths.toFixed(1)} mo`}
                hint={`${formatCurrency(cashManagement.totalReserve)} total reserve modeled.`}
              />
            </div>
          </div>
        </ReportSection>

        <ReportSection
          eyebrow="Capital stack"
          title="Funding and debt posture"
          description="Every active source stays visible here with current balances, structure, and expected payment cadence."
        >
          <div className="space-y-3">
            {fundingSources.length ? (
              fundingSources.map((source, index) => (
                <div
                  key={source.sourceId}
                  className="rounded-[22px] border border-ink-100 bg-white/90 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-ink-900">
                        {getFundingSourceLabel(source, index)}
                      </p>
                      <p className="mt-1 text-sm text-ink-500">
                        {getFundingSourceTypeLabel(source.type)} · {formatCurrency(getFundingCurrentBalance(source))} balance
                      </p>
                    </div>
                    <StatusBadge value={getFundingSourceTypeLabel(source.type)} tone="bg-sky-50 text-sky-700" />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-[18px] bg-ink-50/70 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Original amount
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatCurrency(source.amount)}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-ink-50/70 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Rate / term
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatPercent(source.interestRate, 2)} · {toNumber(source.termMonths, 0)} mo
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-ink-50/70 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Next maturity
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatDateLabel(source.maturityDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-ink-200 bg-ink-50/45 p-5 text-sm leading-6 text-ink-500">
                No funding sources have been modeled yet.
              </div>
            )}
          </div>
        </ReportSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportSection
          eyebrow="Sources"
          title="Where capital is coming from"
          description="Modeled debt plus required equity for the project."
        >
          <VisualList items={sourceBreakdown} />
        </ReportSection>

        <ReportSection
          eyebrow="Uses"
          title="Where capital is going"
          description="Acquisition basis, close, rehab, finance, and hold uses."
        >
          <VisualList items={useBreakdown} />
        </ReportSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <ReportSection
          eyebrow="Variance watch"
          title="Budget vs actual pressure points"
          description="These categories are moving the most versus plan right now."
        >
          <VisualList items={topVarianceCategories} />
        </ReportSection>

        <ReportSection
          eyebrow="Cash + servicing"
          title="Near-term operating pressure"
          description="Use this section to understand liquidity and debt timing over the next stretch of the project."
        >
          <ReportRow label="Monthly cash need" value={formatCurrency(cashManagement.monthlyCashNeed)} />
          <ReportRow label="Monthly debt draft" value={formatCurrency(cashManagement.monthlyDebtDraft)} />
          <ReportRow label="Approved unpaid expenses" value={formatCurrency(cashManagement.approvedUnpaidExpenses)} />
          <ReportRow label="Debt due in 60 days" value={formatCurrency(cashManagement.nextSixtyDebt)} />
          <ReportRow
            label="Overdue debt"
            value={formatCurrency(cashManagement.overdueAmount)}
            tone={cashManagement.overdueAmount > 0 ? "text-clay-700" : "text-ink-900"}
          />
          <ReportRow label="Undrawn capacity" value={formatCurrency(cashManagement.drawRemaining)} />
        </ReportSection>
      </div>
    </div>
  );

  const renderLenderReport = () => (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.96fr)]">
        <ReportSection
          eyebrow="Draw overview"
          title="Packet status across the lending workflow"
          description="This report is built for draw calls and lender check-ins, showing what is requested, supported, funded, and still missing."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-ink-100 bg-ink-50/55 p-5">
              <ReportRow label="Total requested" value={formatCurrency(drawSummary.requested)} />
              <ReportRow label="Funded so far" value={formatCurrency(drawSummary.funded)} />
              <ReportRow label="Outstanding request" value={formatCurrency(drawPacketSummary.outstanding)} />
              <ReportRow
                label="Support gap"
                value={formatCurrency(drawPacketSummary.supportGap)}
                tone={drawPacketSummary.supportGap > 0 ? "text-clay-700" : "text-ink-900"}
              />
            </div>
            <div className="rounded-[22px] border border-ink-100 bg-ink-50/55 p-5">
              <ReportRow label="Packet-ready draws" value={`${drawPacketSummary.packetReady}`} />
              <ReportRow label="Linked packet docs" value={`${drawPacketSummary.packetDocs}`} />
              <ReportRow label="Draw capacity" value={formatCurrency(drawSummary.capacity)} />
              <ReportRow label="Draws modeled" value={`${drawOperations.length}`} />
            </div>
          </div>
        </ReportSection>

        <ReportSection
          eyebrow="Linked support"
          title="Finance-linked documents"
          description="These categories are already supporting the current lender workflow and packet assembly."
        >
          <VisualList items={documentCategorySummary} type="number" />
        </ReportSection>
      </div>

      <ReportSection
        eyebrow="Request board"
        title="Draw-by-draw packet review"
        description="Each draw below rolls up the key support pieces a lender usually asks for: source, docs, linked spend, and status."
      >
        <div className="space-y-4">
          {drawOperations.length ? (
            drawOperations.map((item) => (
              <div key={item.drawId} className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-ink-900">{item.label}</p>
                      <StatusBadge
                        value={item.status || "planned"}
                        tone={
                          item.status === "funded"
                            ? "bg-verdigris-50 text-verdigris-700"
                            : item.status === "approved"
                              ? "bg-sky-50 text-sky-700"
                              : item.status === "holdback"
                                ? "bg-clay-50 text-clay-700"
                                : "bg-amber-50 text-amber-700"
                        }
                      />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      {item.sourceLabel} · requested {formatCurrency(item.amountRequested)} · funded{" "}
                      {formatCurrency(item.amountFunded)}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[18px] bg-ink-50/70 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Linked spend
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatCurrency(item.linkedExpenseAmount)}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-ink-50/70 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Support gap
                      </p>
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          item.supportGap > 0 ? "text-clay-700" : "text-ink-900"
                        }`}
                      >
                        {formatCurrency(item.supportGap)}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-ink-50/70 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Packet score
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {item.packetScore}/{item.packetChecks.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                  <div className="rounded-[22px] border border-ink-100 bg-ink-50/45 p-4">
                    <p className="text-sm font-semibold text-ink-900">Checklist</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.packetChecks.map((check) => (
                        <StatusBadge
                          key={check.label}
                          value={check.label}
                          tone={
                            check.complete
                              ? "bg-verdigris-50 text-verdigris-700"
                              : "bg-clay-50 text-clay-700"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-ink-100 bg-ink-50/45 p-4">
                    <p className="text-sm font-semibold text-ink-900">Key dates</p>
                    <div className="mt-3">
                      <ReportRow label="Request date" value={formatDateLabel(item.requestDate)} />
                      <ReportRow
                        label="Expected funding"
                        value={formatDateLabel(item.expectedFundingDate)}
                      />
                      <ReportRow label="Funded date" value={formatDateLabel(item.fundedDate)} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/45 p-6 text-sm leading-6 text-ink-500">
              No draw requests have been modeled yet. Add them in Capital Stack or Draw Operations
              and they will show up here automatically.
            </div>
          )}
        </div>
      </ReportSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportSection
          eyebrow="Upcoming obligations"
          title="Debt and funding dates"
          description="Use this list in lender updates so upcoming obligations stay visible next to the packet."
        >
          <div className="space-y-3">
            {nextPaymentEvents.length ? (
              nextPaymentEvents.map((event) => (
                <div key={event.scheduleId} className="rounded-[20px] border border-ink-100 bg-white/90 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{event.title}</p>
                      <p className="mt-1 text-sm text-ink-500">{event.sourceLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink-900">
                        {formatCurrency(event.remainingAmount || event.scheduledAmount)}
                      </p>
                      <p className="mt-1 text-xs text-ink-400">
                        Due {formatDateLabel(event.dueDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-ink-200 bg-ink-50/45 p-5 text-sm leading-6 text-ink-500">
                No payment or draw dates are currently scheduled.
              </div>
            )}
          </div>
        </ReportSection>

        <ReportSection
          eyebrow="Recent packet activity"
          title="Most recent supporting files"
          description="Recent uploads help show that support is moving with the work."
        >
          <div className="space-y-3">
            {recentDocuments.length ? (
              recentDocuments.map((document) => (
                <div
                  key={document._id || `${document.displayName}-${document.createdAt}`}
                  className="rounded-[20px] border border-ink-100 bg-white/90 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{document.displayName}</p>
                      <p className="mt-1 text-sm text-ink-500">{document.category || "General"}</p>
                    </div>
                    <p className="text-xs text-ink-400">{formatDateLabel(document.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-ink-200 bg-ink-50/45 p-5 text-sm leading-6 text-ink-500">
                No finance-linked documents have been uploaded yet.
              </div>
            )}
          </div>
        </ReportSection>
      </div>
    </div>
  );

  const renderInvestorReport = () => (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]">
        <ReportSection
          eyebrow="Performance snapshot"
          title="How the project is performing today"
          description="This investor-facing snapshot focuses on current spend, projected returns, and how the capital plan is holding together."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-ink-100 bg-ink-50/55 p-5">
              <ReportRow label="All-in project cost" value={formatCurrency(metrics.totalCost)} />
              <ReportRow label="Spent to date" value={formatCurrency(metrics.totalSpent)} />
              <ReportRow label="Committed work" value={formatCurrency(metrics.totalCommitted)} />
              <ReportRow label="Projected profit" value={formatCurrency(metrics.profit)} tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"} />
            </div>
            <div className="rounded-[22px] border border-ink-100 bg-ink-50/55 p-5">
              <ReportRow label="ROI on cash" value={formatPercent(metrics.roiOnCash)} />
              <ReportRow label="Annualized ROI" value={formatPercent(metrics.annualizedROI)} />
              <ReportRow label="Reserve runway" value={`${cashManagement.reserveRunwayMonths.toFixed(1)} mo`} />
              <ReportRow label="Undrawn lender support" value={formatCurrency(cashManagement.drawRemaining)} />
            </div>
          </div>
        </ReportSection>

        <ReportSection
          eyebrow="Budget movement"
          title="What is moving versus plan"
          description="These are the categories with the largest variance against the current expected budget."
        >
          <VisualList items={topVarianceCategories} />
        </ReportSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportSection
          eyebrow="Expense posture"
          title="Where current spending sits"
          description="This helps investors understand whether money is still in review, approved, paid, or reimbursed."
        >
          <VisualList items={expenseStatusSummary} />
        </ReportSection>

        <ReportSection
          eyebrow="Upcoming obligations"
          title="What is next on the calendar"
          description="Upcoming debt dates, capital events, and recent activity help frame the next reporting window."
        >
          <div className="space-y-3">
            {nextPaymentEvents.length ? (
              nextPaymentEvents.map((event) => (
                <div key={event.scheduleId} className="rounded-[20px] border border-ink-100 bg-white/90 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{event.sourceLabel}</p>
                      <p className="mt-1 text-sm text-ink-500">{event.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink-900">
                        {formatCurrency(event.remainingAmount || event.scheduledAmount)}
                      </p>
                      <p className="mt-1 text-xs text-ink-400">
                        Due {formatDateLabel(event.dueDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-ink-200 bg-ink-50/45 p-5 text-sm leading-6 text-ink-500">
                No servicing dates are scheduled yet.
              </div>
            )}
          </div>
        </ReportSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ReportSection
          eyebrow="Recent spend"
          title="Latest expenses included in the update"
          description="This keeps investors close to the most recent activity without sending them into the ledger."
        >
          <div className="space-y-3">
            {recentExpenses.length ? (
              recentExpenses.map((expense) => (
                <div
                  key={expense._id || `${expense.title}-${expense.date}`}
                  className="rounded-[20px] border border-ink-100 bg-white/90 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{expense.title}</p>
                      <p className="mt-1 text-sm text-ink-500">
                        {expense.payeeName || expense.vendor?.name || expense.status || "Expense"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink-900">
                        {formatCurrency(expense.amount)}
                      </p>
                      <p className="mt-1 text-xs text-ink-400">{formatDateLabel(expense.date)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-ink-200 bg-ink-50/45 p-5 text-sm leading-6 text-ink-500">
                No expenses have been logged yet.
              </div>
            )}
          </div>
        </ReportSection>

        <ReportSection
          eyebrow="Documents"
          title="Recent files and reporting support"
          description="These uploads usually matter most for an investor summary: contracts, receipts, invoices, permits, and report exports."
        >
          <div className="space-y-3">
            {recentDocuments.length ? (
              recentDocuments.map((document) => (
                <div
                  key={document._id || `${document.displayName}-${document.createdAt}`}
                  className="rounded-[20px] border border-ink-100 bg-white/90 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{document.displayName}</p>
                      <p className="mt-1 text-sm text-ink-500">{document.category || "General"}</p>
                    </div>
                    <p className="text-xs text-ink-400">{formatDateLabel(document.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-ink-200 bg-ink-50/45 p-5 text-sm leading-6 text-ink-500">
                No documents have been uploaded yet.
              </div>
            )}
          </div>
        </ReportSection>
      </div>
    </div>
  );

  const renderReportBody = () => {
    if (selectedReport === "lender") {
      return renderLenderReport();
    }

    if (selectedReport === "investor") {
      return renderInvestorReport();
    }

    return renderFinancialReport();
  };

  return (
    <div className="space-y-6">
      <section className="surface-panel px-6 py-7 sm:px-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="eyebrow">Finance > Reports</span>
            <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
              Export lender-ready and investor-ready project reports
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
              Choose a report mode, preview the live project snapshot, then export a polished PDF
              built from the same finance, costs, documents, and draw data already tied to this
              property.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerateAiSummary}
              disabled={isGeneratingAI}
              className="secondary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isGeneratingAI ? (
                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DocumentChartBarIcon className="mr-2 h-4 w-4" />
              )}
              {isGeneratingAI ? "Refreshing AI narrative..." : "Refresh AI narrative"}
            </button>
            <button
              type="button"
              onClick={handleExportReport}
              disabled={isExporting}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isExporting ? (
                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
              )}
              {isExporting ? "Exporting..." : "Export current report"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {REPORT_OPTIONS.map((option) => {
          const active = option.key === selectedReport;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelectedReport(option.key)}
              className={`rounded-[26px] border p-5 text-left transition ${
                active
                  ? "border-ink-900 bg-ink-900 text-white shadow-[0_24px_60px_rgba(26,35,48,0.2)]"
                  : "border-ink-100 bg-white/90 text-ink-900 hover:border-ink-200 hover:bg-white"
              }`}
            >
              <div className={`h-1.5 w-16 rounded-full ${active ? "bg-white" : option.accent}`} />
              <p
                className={`mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  active ? "text-white/65" : "text-ink-400"
                }`}
              >
                {option.label}
              </p>
              <h4 className="mt-3 text-xl font-semibold">{option.title}</h4>
              <p className={`mt-3 text-sm leading-6 ${active ? "text-white/75" : "text-ink-500"}`}>
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {activeMetrics.map((item) => (
          <MetricCard
            key={item.label}
            icon={item.icon}
            label={item.label}
            value={item.value}
            hint={item.hint}
            tone={item.tone}
          />
        ))}
      </div>

      <div
        ref={reportRef}
        className="space-y-6 rounded-[32px] border border-ink-100 bg-[#f6f1ea] p-6 shadow-[0_24px_70px_rgba(26,35,48,0.08)] sm:p-7"
      >
        <section className="rounded-[28px] bg-ink-900 px-6 py-7 text-white sm:px-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                {reportMeta.title}
              </p>
              <h2 className="mt-4 font-display text-[2.4rem] leading-[0.95]">
                {propertyLabel}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
                {propertyAddress || "Address not yet confirmed"} · {strategyLabel} strategy ·
                generated from the live property workspace on {generatedDate}.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] bg-white/10 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  Budget posture
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatCurrency(metrics.totalSpent)} / {formatCurrency(metrics.totalBudget)}
                </p>
              </div>
              <div className="rounded-[20px] bg-white/10 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  Capital stack
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {fundingSources.length} source{fundingSources.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {renderReportBody()}

        {aiSummary ? (
          <ReportSection
            eyebrow="AI narrative"
            title="Generated commentary from the current underwriting"
            description="This narrative is regenerated from the latest live project assumptions and can be included in the exported PDF."
          >
            <div className="whitespace-pre-line rounded-[22px] border border-verdigris-200 bg-verdigris-50/60 p-5 text-sm leading-7 text-ink-700">
              {aiSummary}
            </div>
          </ReportSection>
        ) : null}
      </div>
    </div>
  );
};

export default PropertyFinanceReports;
