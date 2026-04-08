import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import {
  createPropertyWorkspace,
  getBudgetItems,
  getExpenses,
  getInvestment,
  getProjectDocuments,
  getVendors,
  updateInvestment,
} from "../utils/api";
import {
  getInvestmentAnalysisMetrics,
  toNumber,
} from "../utils/investmentMetrics";
import { exportElementToPdf } from "../utils/pdfExport";
import {
  buildDrawRequest,
  buildFundingSource,
  buildPaymentRecord,
  getDrawRequests,
  getDrawSummary,
  getFundingSourceLabel,
  getFundingSourceTypeLabel,
  getFundingSources,
  getPaymentRecords,
  getTotalFundingAmount,
  getTotalFundingMonthlyInterest,
  getTotalFundingPaymentDraft,
  getTotalFundingPointsCost,
  PAYMENT_TYPE_OPTIONS,
} from "../utils/capitalStack";
import {
  addDaysToDate,
  buildCashManagementSummary,
  buildDrawOperationsSummary,
  buildFundingPaymentSchedule,
  buildServicingSchedule,
} from "../utils/financeOperations";
import {
  getInvestmentStrategy,
  getInvestmentStrategyLabel,
} from "../utils/propertyStrategy";
import {
  buildFinanceForm,
  EmptyAcquisitionState,
  normalizeDrawRequestsForSave,
  normalizeFundingSourcesForSave,
  normalizePaymentRecordsForSave,
  safeRatio,
  toDateInputValue,
} from "./propertyWorkspace/finance/PropertyFinanceShared";

const PropertyFinanceBudgetVsActualView = lazy(() =>
  import("./propertyWorkspace/finance/PropertyFinanceBudgetVsActualView")
);
const PropertyFinanceDrawOperationsView = lazy(() =>
  import("./propertyWorkspace/finance/PropertyFinanceDrawOperationsView")
);
const PropertyFinancePaymentScheduleView = lazy(() =>
  import("./propertyWorkspace/finance/PropertyFinancePaymentScheduleView")
);
const PropertyFinanceReportsView = lazy(() =>
  import("./propertyWorkspace/finance/PropertyFinanceReportsView")
);
const PropertyFinanceSourcesUsesView = lazy(() =>
  import("./propertyWorkspace/finance/PropertyFinanceSourcesUsesView")
);
const PropertyFinanceCapitalStackView = lazy(() =>
  import("./propertyWorkspace/finance/PropertyFinanceCapitalStackView")
);
const PropertyFinanceHealthView = lazy(() =>
  import("./propertyWorkspace/finance/PropertyFinanceHealthView")
);

const FinanceViewFallback = () => (
  <div className="section-card px-6 py-10 text-center text-ink-500">Loading finance view...</div>
);

const PropertyFinancePanel = ({
  property,
  propertyKey,
  activeContentKey,
  onPropertyUpdated,
  embedded = false,
}) => {
  const investmentId = property?.workspaces?.acquisitions?.id || "";
  const [selectedStrategy, setSelectedStrategy] = useState(
    property?.workspaces?.acquisitions?.strategy || "flip"
  );
  const [investment, setInvestment] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [financeForm, setFinanceForm] = useState(() => buildFinanceForm(null));
  const [fundingSources, setFundingSources] = useState([]);
  const [drawRequests, setDrawRequests] = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [isSavingFinance, setIsSavingFinance] = useState(false);
  const drawExportRef = useRef(null);

  const loadFinanceWorkspace = useCallback(async () => {
    if (!investmentId) {
      setInvestment(null);
      setBudgetItems([]);
      setExpenses([]);
      setDocuments([]);
      setVendors([]);
      setFinanceForm(buildFinanceForm(null));
      setFundingSources([]);
      setDrawRequests([]);
      setPaymentRecords([]);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [investmentData, budgetData, expenseData, documentData, vendorData] = await Promise.all([
        getInvestment(investmentId),
        getBudgetItems(investmentId),
        getExpenses(investmentId),
        getProjectDocuments(investmentId),
        getVendors(),
      ]);

      setInvestment(investmentData);
      setBudgetItems(budgetData || []);
      setExpenses(expenseData || []);
      setDocuments(documentData || []);
      setVendors(vendorData || []);
      setFinanceForm(buildFinanceForm(investmentData));
      setFundingSources(getFundingSources(investmentData));
      setDrawRequests(getDrawRequests(investmentData));
      setPaymentRecords(getPaymentRecords(investmentData));
    } catch (loadError) {
      setError(loadError.message || "Failed to load the finance workspace.");
    } finally {
      setLoading(false);
    }
  }, [investmentId]);

  useEffect(() => {
    setSelectedStrategy(property?.workspaces?.acquisitions?.strategy || "flip");
  }, [property?.workspaces?.acquisitions?.strategy]);

  useEffect(() => {
    if (!activeContentKey.startsWith("finance-")) {
      return;
    }

    loadFinanceWorkspace();
  }, [activeContentKey, loadFinanceWorkspace]);

  const normalizedFundingSources = useMemo(
    () => normalizeFundingSourcesForSave(fundingSources),
    [fundingSources]
  );
  const normalizedDrawRequests = useMemo(
    () => normalizeDrawRequestsForSave(drawRequests),
    [drawRequests]
  );
  const normalizedPaymentRecords = useMemo(
    () => normalizePaymentRecordsForSave(paymentRecords),
    [paymentRecords]
  );

  const metricsInvestment = useMemo(() => {
    const primarySource = normalizedFundingSources[0] || null;

    return {
      ...(investment || {}),
      purchasePrice: toNumber(financeForm.purchasePrice, 0),
      arv: toNumber(financeForm.arv, 0),
      buyClosingCost: toNumber(financeForm.buyClosingCost, 0),
      buyClosingIsPercent: financeForm.buyClosingMode === "percent",
      sellClosingCost: toNumber(financeForm.sellClosingCost, 0),
      sellClosingIsPercent: financeForm.sellClosingMode === "percent",
      holdingMonths: toNumber(financeForm.holdingMonths, 0),
      taxes: toNumber(financeForm.taxes, 0),
      insurance: toNumber(financeForm.insurance, 0),
      utilities: toNumber(financeForm.utilities, 0),
      otherMonthly: toNumber(financeForm.otherMonthly, 0),
      fundingSources: normalizedFundingSources,
      drawRequests: normalizedDrawRequests,
      paymentRecords: normalizedPaymentRecords,
      loanType: primarySource?.type || "",
      lenderName: primarySource?.name || "",
      loanAmount: primarySource?.amount || 0,
      interestRate: primarySource?.interestRate || 0,
      loanTerm: primarySource?.termMonths || 0,
      loanPoints: primarySource?.points || 0,
      loanNotes: primarySource?.notes || "",
    };
  }, [financeForm, investment, normalizedDrawRequests, normalizedFundingSources, normalizedPaymentRecords]);

  const metrics = useMemo(
    () => getInvestmentAnalysisMetrics(metricsInvestment, { budgetItems, expenses }),
    [budgetItems, expenses, metricsInvestment]
  );

  const totalFundingAmount = useMemo(() => getTotalFundingAmount(fundingSources), [fundingSources]);
  const totalFundingMonthlyInterest = useMemo(
    () => getTotalFundingMonthlyInterest(fundingSources),
    [fundingSources]
  );
  const totalFundingPaymentDraft = useMemo(
    () => getTotalFundingPaymentDraft(fundingSources),
    [fundingSources]
  );
  const totalFundingPoints = useMemo(
    () => getTotalFundingPointsCost(fundingSources),
    [fundingSources]
  );
  const drawSummary = useMemo(() => getDrawSummary(fundingSources, drawRequests), [drawRequests, fundingSources]);
  const fundingSourceOptions = useMemo(
    () => [
      { value: "", label: "Select funding source" },
      ...fundingSources.map((source, index) => ({
        value: source.sourceId,
        label: getFundingSourceLabel(source, index),
      })),
    ],
    [fundingSources]
  );
  const drawOperations = useMemo(
    () =>
      buildDrawOperationsSummary({
        drawRequests,
        fundingSources,
        expenses,
        documents,
      }),
    [documents, drawRequests, expenses, fundingSources]
  );
  const paymentSchedule = useMemo(
    () =>
      buildFundingPaymentSchedule(fundingSources, {
        holdingMonths: toNumber(financeForm.holdingMonths, 0),
      }),
    [financeForm.holdingMonths, fundingSources]
  );
  const today = useMemo(() => {
    const next = new Date();
    next.setHours(0, 0, 0, 0);
    return next;
  }, []);
  const nextThirtyDays = useMemo(() => addDaysToDate(today, 30), [today]);
  const servicingSchedule = useMemo(
    () =>
      buildServicingSchedule({
        fundingSources,
        paymentSchedule,
        paymentRecords,
        anchorDate: today,
      }),
    [fundingSources, paymentRecords, paymentSchedule, today]
  );
  const datedPaymentEvents = useMemo(
    () => servicingSchedule.filter((event) => event.dueDate && !event.eventBased),
    [servicingSchedule]
  );
  const upcomingPaymentEvents = useMemo(
    () =>
      datedPaymentEvents.filter((event) => {
        const due = new Date(event.dueDate);
        return due >= today && due <= nextThirtyDays;
      }),
    [datedPaymentEvents, nextThirtyDays, today]
  );
  const overduePaymentEvents = useMemo(
    () => datedPaymentEvents.filter((event) => event.status === "overdue"),
    [datedPaymentEvents]
  );
  const nextPaymentEvent = useMemo(
    () => datedPaymentEvents.find((event) => new Date(event.dueDate) >= today) || null,
    [datedPaymentEvents, today]
  );
  const eventBasedPaymentEvents = useMemo(
    () => servicingSchedule.filter((event) => event.eventBased),
    [servicingSchedule]
  );
  const paymentScheduleBySource = useMemo(
    () =>
      fundingSources.map((source, index) => {
        const sourceEvents = servicingSchedule.filter((event) => event.sourceId === source.sourceId);
        const nextDue =
          sourceEvents.find(
            (event) =>
              event.dueDate &&
              !event.eventBased &&
              !["paid", "deferred"].includes(event.status) &&
              new Date(event.dueDate) >= today
          ) ||
          sourceEvents.find(
            (event) =>
              event.dueDate && !event.eventBased && !["paid", "deferred"].includes(event.status)
          ) ||
          null;

        return {
          source,
          index,
          events: sourceEvents,
          nextDue,
        };
      }),
    [fundingSources, servicingSchedule, today]
  );
  const cashManagement = useMemo(
    () =>
      buildCashManagementSummary({
        financeForm,
        fundingSources,
        paymentEvents: servicingSchedule,
        expenses,
        drawSummary,
        anchorDate: today,
      }),
    [drawSummary, expenses, financeForm, fundingSources, servicingSchedule, today]
  );
  const paidThisMonthAmount = useMemo(
    () =>
      paymentRecords.reduce((sum, record) => {
        if (!record.paidDate) {
          return sum;
        }

        const paidDate = new Date(record.paidDate);
        if (
          Number.isNaN(paidDate.valueOf()) ||
          paidDate.getMonth() !== today.getMonth() ||
          paidDate.getFullYear() !== today.getFullYear()
        ) {
          return sum;
        }

        return sum + toNumber(record.paidAmount, 0);
      }, 0),
    [paymentRecords, today]
  );

  const budgetCategorySummary = useMemo(() => {
    const categoryMap = new Map();
    const budgetItemLookup = new Map(
      budgetItems.map((item) => [
        item._id,
        {
          category: item.category || "Uncategorized",
          originalBudgetAmount: toNumber(item.originalBudgetAmount ?? item.budgetedAmount, 0),
          budgetedAmount: toNumber(item.budgetedAmount, 0),
          committedAmount: Array.isArray(item.awards)
            ? item.awards.reduce((sum, award) => sum + toNumber(award.amount, 0), 0)
            : 0,
        },
      ])
    );

    const ensureGroup = (label) => {
      if (!categoryMap.has(label)) {
        categoryMap.set(label, {
          label,
          original: 0,
          expected: 0,
          committed: 0,
          actual: 0,
          expensesCount: 0,
        });
      }

      return categoryMap.get(label);
    };

    budgetItems.forEach((item) => {
      const label = item.category || "Uncategorized";
      const group = ensureGroup(label);
      group.original += toNumber(item.originalBudgetAmount ?? item.budgetedAmount, 0);
      group.expected += toNumber(item.budgetedAmount, 0);
      group.committed += Array.isArray(item.awards)
        ? item.awards.reduce((sum, award) => sum + toNumber(award.amount, 0), 0)
        : 0;
    });

    expenses.forEach((expense) => {
      const budgetItemId =
        typeof expense.budgetItem === "object"
          ? expense.budgetItem?._id || ""
          : expense.budgetItem || "";
      const lookup = budgetItemId ? budgetItemLookup.get(budgetItemId) : null;
      const label = lookup?.category || "Project-level";
      const group = ensureGroup(label);
      group.actual += toNumber(expense.amount, 0);
      group.expensesCount += 1;
    });

    return [...categoryMap.values()]
      .map((group) => ({
        ...group,
        variance: group.actual - group.expected,
      }))
      .sort(
        (left, right) =>
          Math.max(right.expected, right.actual, right.committed) -
          Math.max(left.expected, left.actual, left.committed)
      );
  }, [budgetItems, expenses]);

  const financeSummary = useMemo(
    () => ({
      monthlyCarry:
        toNumber(financeForm.taxes, 0) +
        toNumber(financeForm.insurance, 0) +
        toNumber(financeForm.utilities, 0) +
        toNumber(financeForm.otherMonthly, 0) +
        totalFundingMonthlyInterest,
      pointsCost: totalFundingPoints,
      monthlyPaymentDraft: totalFundingPaymentDraft,
      debtSourcesCount: fundingSources.length,
      drawCapacity: drawSummary.capacity,
      drawFunded: drawSummary.funded,
      receiptAiCount: expenses.filter((expense) => expense.entryMethod === "receipt_ai").length,
    }),
    [
      drawSummary.capacity,
      drawSummary.funded,
      expenses,
      financeForm.insurance,
      financeForm.otherMonthly,
      financeForm.taxes,
      financeForm.utilities,
      fundingSources.length,
      totalFundingMonthlyInterest,
      totalFundingPaymentDraft,
      totalFundingPoints,
    ]
  );

  const sourceItems = useMemo(() => {
    const debtItems = fundingSources
      .filter(
        (source) =>
          source.name ||
          source.type ||
          toNumber(source.amount, 0) > 0 ||
          toNumber(source.paymentAmount, 0) > 0
      )
      .map((source, index) => ({
        label: getFundingSourceLabel(source, index),
        amount: toNumber(source.amount, 0),
        hint: [
          getFundingSourceTypeLabel(source.type),
          source.paymentType
            ? `Payment ${PAYMENT_TYPE_OPTIONS.find((option) => option.value === source.paymentType)?.label?.toLowerCase()}`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
      }));

    return [
      ...debtItems,
      {
        label: "Equity and cash required",
        amount: metrics.cashInvested,
        hint: "Cash still needed after modeled debt and revolving sources are applied.",
      },
    ];
  }, [fundingSources, metrics.cashInvested]);

  const useItems = useMemo(
    () => [
      {
        label: "Purchase price",
        amount: metrics.purchasePrice,
        hint: "Acquisition basis",
      },
      {
        label: "Closing costs",
        amount: metrics.calcBuyingCost,
        hint: financeForm.buyClosingMode === "percent" ? "Calculated from purchase price." : "",
      },
      {
        label: "Expected project budget",
        amount: metrics.totalBudget,
        hint: "Editable expected cost plan.",
      },
      {
        label: "Financing costs",
        amount: metrics.calcFinanceCost,
        hint: "Interest carry and points based on current inputs.",
      },
      {
        label: "Holding costs",
        amount: metrics.calcHoldingCost,
        hint: "Taxes, insurance, utilities, and other monthly carry.",
      },
    ],
    [
      financeForm.buyClosingMode,
      metrics.calcBuyingCost,
      metrics.calcFinanceCost,
      metrics.calcHoldingCost,
      metrics.purchasePrice,
      metrics.totalBudget,
    ]
  );

  const strategyLabel = useMemo(
    () => getInvestmentStrategyLabel(getInvestmentStrategy(investment)),
    [investment]
  );
  const debtToCost = useMemo(() => safeRatio(metrics.loanAmount, metrics.totalCost), [metrics.loanAmount, metrics.totalCost]);

  const handleCreateAcquisitionWorkspace = async () => {
    try {
      setIsCreatingWorkspace(true);
      const result = await createPropertyWorkspace(propertyKey, "acquisitions", {
        strategy: selectedStrategy,
      });

      if (result?.property) {
        onPropertyUpdated?.(result.property);
      }

      toast.success("Finance workspace created.");
    } catch (createError) {
      toast.error(createError.message || "Failed to create the acquisitions workspace.");
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleFinanceFieldChange = (event) => {
    const { name, value } = event.target;
    setFinanceForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFundingSourceChange = (sourceId, event) => {
    const { name, value } = event.target;
    setFundingSources((current) =>
      current.map((source) =>
        source.sourceId === sourceId
          ? {
              ...source,
              [name]: value,
            }
          : source
      )
    );
  };

  const handleAddFundingSource = () => {
    setFundingSources((current) => [...current, buildFundingSource()]);
  };

  const handleRemoveFundingSource = (sourceId) => {
    setFundingSources((current) => current.filter((source) => source.sourceId !== sourceId));
    setDrawRequests((current) => current.filter((request) => request.sourceId !== sourceId));
  };

  const handleDrawRequestChange = (drawId, event) => {
    const { name, value } = event.target;
    setDrawRequests((current) =>
      current.map((request) =>
        request.drawId === drawId
          ? {
              ...request,
              [name]: value,
            }
          : request
      )
    );
  };

  const handleAddDrawRequest = () => {
    setDrawRequests((current) => [
      ...current,
      buildDrawRequest({
        sourceId: fundingSources[0]?.sourceId || "",
      }),
    ]);
  };

  const handleRemoveDrawRequest = (drawId) => {
    setDrawRequests((current) => current.filter((request) => request.drawId !== drawId));
  };

  const handlePaymentRecordChange = (paymentId, event) => {
    const { name, value } = event.target;
    setPaymentRecords((current) =>
      current.map((record) =>
        record.paymentId === paymentId
          ? {
              ...record,
              [name]: value,
            }
          : record
      )
    );
  };

  const handleAddPaymentRecord = (sourceId = "", overrides = {}) => {
    setPaymentRecords((current) => [
      ...current,
      buildPaymentRecord({
        sourceId,
        dueDate: overrides.dueDate || toDateInputValue(today),
        scheduledAmount: overrides.scheduledAmount ?? "",
        paidAmount: overrides.paidAmount ?? "",
        status: overrides.status || "scheduled",
        paidDate: overrides.paidDate || "",
        paymentMethod: overrides.paymentMethod || "other",
        notes: overrides.notes || "",
      }),
    ]);
  };

  const handleRemovePaymentRecord = (paymentId) => {
    setPaymentRecords((current) => current.filter((record) => record.paymentId !== paymentId));
  };

  const handleMarkPaymentPaid = (event) => {
    const dueDate = toDateInputValue(event.dueDate);

    setPaymentRecords((current) => {
      const existing = current.find(
        (record) => record.sourceId === event.sourceId && record.dueDate === dueDate
      );

      if (existing) {
        return current.map((record) =>
          record.paymentId === existing.paymentId
            ? {
                ...record,
                scheduledAmount: event.scheduledAmount,
                paidAmount: event.scheduledAmount,
                paidDate: toDateInputValue(today),
                status: "paid",
              }
            : record
        );
      }

      return [
        ...current,
        buildPaymentRecord({
          sourceId: event.sourceId,
          dueDate,
          scheduledAmount: event.scheduledAmount,
          paidAmount: event.scheduledAmount,
          paidDate: toDateInputValue(today),
          status: "paid",
          paymentMethod: "ach",
          notes: event.title ? `${event.title} marked paid from schedule.` : "",
        }),
      ];
    });
  };

  const handleSaveFinance = async (event) => {
    event.preventDefault();

    if (!investment?._id) {
      toast.error("Create the acquisitions workspace first.");
      return;
    }

    try {
      setIsSavingFinance(true);
      const primarySource = normalizedFundingSources[0] || null;
      const updated = await updateInvestment(investment._id, {
        purchasePrice: toNumber(financeForm.purchasePrice, 0),
        arv: toNumber(financeForm.arv, 0),
        buyClosingCost: toNumber(financeForm.buyClosingCost, 0),
        buyClosingIsPercent: financeForm.buyClosingMode === "percent",
        sellClosingCost: toNumber(financeForm.sellClosingCost, 0),
        sellClosingIsPercent: financeForm.sellClosingMode === "percent",
        loanType: primarySource?.type || "",
        lenderName: primarySource?.name || "",
        loanAmount: primarySource?.amount || 0,
        interestRate: primarySource?.interestRate || 0,
        loanTerm: primarySource?.termMonths || 0,
        loanPoints: primarySource?.points || 0,
        loanNotes: primarySource?.notes || "",
        fundingSources: normalizedFundingSources,
        drawRequests: normalizedDrawRequests,
        paymentRecords: normalizedPaymentRecords,
        holdingMonths: toNumber(financeForm.holdingMonths, 0),
        taxes: toNumber(financeForm.taxes, 0),
        insurance: toNumber(financeForm.insurance, 0),
        utilities: toNumber(financeForm.utilities, 0),
        otherMonthly: toNumber(financeForm.otherMonthly, 0),
        operatingCashReserve: toNumber(financeForm.operatingCashReserve, 0),
        contingencyReserve: toNumber(financeForm.contingencyReserve, 0),
        minimumCashBuffer: toNumber(financeForm.minimumCashBuffer, 0),
      });

      setInvestment(updated);
      setFinanceForm(buildFinanceForm(updated));
      setFundingSources(getFundingSources(updated));
      setDrawRequests(getDrawRequests(updated));
      setPaymentRecords(getPaymentRecords(updated));
      toast.success("Finance assumptions updated.");
    } catch (saveError) {
      toast.error(saveError.message || "Failed to update finance assumptions.");
    } finally {
      setIsSavingFinance(false);
    }
  };

  const handleExportDrawSummary = async () => {
    if (!drawExportRef.current) {
      return;
    }

    try {
      await exportElementToPdf({
        element: drawExportRef.current,
        filename: "lender-draw-summary.pdf",
      });
    } catch (exportError) {
      toast.error(exportError.message || "Failed to export the draw summary.");
    }
  };

  if (!investmentId) {
    return (
      <EmptyAcquisitionState
        property={property}
        selectedStrategy={selectedStrategy}
        onStrategyChange={(event) => setSelectedStrategy(event.target.value)}
        onCreate={handleCreateAcquisitionWorkspace}
        isCreating={isCreatingWorkspace}
      />
    );
  }

  if (loading) {
    return (
      <div className="section-card px-6 py-10 text-center text-ink-500">
        Loading finance workspace...
      </div>
    );
  }

  if (error) {
    return (
      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Finance workspace</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">
          We could not load the finance data
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">{error}</p>
        <button type="button" onClick={loadFinanceWorkspace} className="primary-action mt-6">
          <ArrowPathIcon className="mr-2 h-5 w-5" />
          Try again
        </button>
      </section>
    );
  }

  const drawOperationsProps = {
    embedded,
    drawOperations,
    drawSummary,
    documents,
    drawExportRef,
    handleAddDrawRequest,
    handleExportDrawSummary,
    handleSaveFinance,
    isSavingFinance,
    handleDrawRequestChange,
  };

  const paymentScheduleProps = {
    embedded,
    nextPaymentEvent,
    upcomingPaymentEvents,
    datedPaymentEvents,
    overduePaymentEvents,
    cashManagement,
    paidThisMonthAmount,
    handleSaveFinance,
    isSavingFinance,
    handleAddPaymentRecord,
    fundingSources,
    paymentScheduleBySource,
    paymentRecords,
    fundingSourceOptions,
    handlePaymentRecordChange,
    handleRemovePaymentRecord,
    handleMarkPaymentPaid,
    eventBasedPaymentEvents,
    today,
  };

  const capitalStackProps = {
    embedded,
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
  };

  return (
    <Suspense fallback={<FinanceViewFallback />}>
      {activeContentKey === "finance-budget-vs-actual" ? (
        <PropertyFinanceBudgetVsActualView
          embedded={embedded}
          investment={investment}
          budgetItems={budgetItems}
          expenses={expenses}
          vendors={vendors}
          onUpdate={loadFinanceWorkspace}
        />
      ) : null}

      {activeContentKey === "finance-draw-operations" ? (
        <PropertyFinanceDrawOperationsView {...drawOperationsProps} />
      ) : null}

      {activeContentKey === "finance-payment-schedule" ? (
        <PropertyFinancePaymentScheduleView {...paymentScheduleProps} />
      ) : null}

      {activeContentKey === "finance-reports" ? (
        <PropertyFinanceReportsView
          property={property}
          investment={metricsInvestment}
          metrics={metrics}
          fundingSources={fundingSources}
          sourceItems={sourceItems}
          useItems={useItems}
          drawSummary={drawSummary}
          drawOperations={drawOperations}
          budgetCategorySummary={budgetCategorySummary}
          cashManagement={cashManagement}
          expenses={expenses}
          documents={documents}
          paymentEvents={datedPaymentEvents}
        />
      ) : null}

      {activeContentKey === "finance-sources-uses" ? (
        <PropertyFinanceSourcesUsesView
          embedded={embedded}
          sourceItems={sourceItems}
          useItems={useItems}
          metrics={metrics}
        />
      ) : null}

      {activeContentKey === "finance-capital-stack" ? (
        <PropertyFinanceCapitalStackView {...capitalStackProps} />
      ) : null}

      {activeContentKey === "finance-capital-suite" ? (
        <div className="space-y-5">
          <PropertyFinanceCapitalStackView {...capitalStackProps} />
          <PropertyFinancePaymentScheduleView {...paymentScheduleProps} />
        </div>
      ) : null}

      {![
        "finance-budget-vs-actual",
        "finance-draw-operations",
        "finance-payment-schedule",
        "finance-reports",
        "finance-sources-uses",
        "finance-capital-stack",
        "finance-capital-suite",
      ].includes(activeContentKey) ? (
        <PropertyFinanceHealthView
          embedded={embedded}
          metrics={metrics}
          financeSummary={financeSummary}
          expenses={expenses}
          budgetCategorySummary={budgetCategorySummary}
        />
      ) : null}
    </Suspense>
  );
};

export { EmptyAcquisitionState };
export default PropertyFinancePanel;
