import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import AnalysisCalculator from "./AnalysisCalculator";
import FinancialsTab from "./FinancialsTab";
import {
  createPropertyWorkspace,
  getBudgetItems,
  getExpenses,
  getInvestment,
  getVendors,
  updateInvestment,
} from "../utils/api";
import {
  formatCurrency,
  getInvestmentAnalysisMetrics,
  toNumber,
} from "../utils/investmentMetrics";
import {
  getInvestmentStrategy,
  getInvestmentStrategyLabel,
  PROPERTY_STRATEGIES,
} from "../utils/propertyStrategy";

const loanTypeOptions = [
  { value: "", label: "Select loan type" },
  { value: "business_loan", label: "Business loan" },
  { value: "personal_loan", label: "Personal loan" },
  { value: "credit_card", label: "Credit card" },
  { value: "hard_money", label: "Hard money" },
  { value: "construction", label: "Construction" },
  { value: "heloc", label: "HELOC" },
  { value: "private_lender", label: "Private lender" },
  { value: "seller_finance", label: "Seller finance" },
  { value: "other", label: "Other" },
];

const formatPercent = (value = 0, digits = 1) => `${toNumber(value, 0).toFixed(digits)}%`;

const safeRatio = (value, total) => {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (toNumber(value, 0) / total) * 100));
};

const buildFinanceForm = (investment) => ({
  purchasePrice: investment?.purchasePrice ?? "",
  arv: investment?.arv ?? "",
  buyClosingCost: investment?.buyClosingCost ?? "",
  buyClosingMode: investment?.buyClosingIsPercent ? "percent" : "amount",
  sellClosingCost: investment?.sellClosingCost ?? "",
  sellClosingMode: investment?.sellClosingIsPercent ? "percent" : "amount",
  loanType: investment?.loanType || "",
  lenderName: investment?.lenderName || "",
  loanAmount: investment?.loanAmount ?? "",
  interestRate: investment?.interestRate ?? "",
  loanTerm: investment?.loanTerm ?? "",
  loanPoints: investment?.loanPoints ?? "",
  loanNotes: investment?.loanNotes || "",
  holdingMonths: investment?.holdingMonths ?? "",
  taxes: investment?.taxes ?? "",
  insurance: investment?.insurance ?? "",
  utilities: investment?.utilities ?? "",
  otherMonthly: investment?.otherMonthly ?? "",
});

const MetricTile = ({ icon: Icon, label, value, hint, tone = "text-ink-900" }) => (
  <div className="metric-tile p-5">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

const FinanceRow = ({ label, value, tone = "text-ink-900", hint }) => (
  <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-3 last:border-b-0">
    <div>
      <p className="text-sm font-medium text-ink-600">{label}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-ink-400">{hint}</p> : null}
    </div>
    <p className={`text-sm font-semibold ${tone}`}>{value}</p>
  </div>
);

const ProgressBar = ({ label, value, total, tone = "bg-verdigris-500", helper }) => {
  const ratio = safeRatio(value, total);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-ink-700">{label}</p>
        <p className="text-sm font-semibold text-ink-900">{formatPercent(ratio)}</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${ratio}%` }} />
      </div>
      {helper ? <p className="text-xs leading-5 text-ink-400">{helper}</p> : null}
    </div>
  );
};

const FinanceField = ({ label, name, value, onChange, type = "text", placeholder, suffix }) => (
  <label className="space-y-2">
    <span className="text-sm font-medium text-ink-700">{label}</span>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`auth-input ${suffix ? "pr-12" : ""}`}
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-400">
          {suffix}
        </span>
      ) : null}
    </div>
  </label>
);

const FinanceSelect = ({ label, name, value, options, onChange }) => (
  <label className="space-y-2">
    <span className="text-sm font-medium text-ink-700">{label}</span>
    <select name={name} value={value} onChange={onChange} className="auth-input appearance-none">
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export const EmptyAcquisitionState = ({
  property,
  selectedStrategy,
  onStrategyChange,
  onCreate,
  isCreating,
}) => (
  <section className="surface-panel px-6 py-7 sm:px-7">
    <span className="eyebrow">Finance workspace</span>
    <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <h3 className="font-display text-[2.15rem] leading-[0.96] text-ink-900">
          Create the acquisitions finance workspace for this property
        </h3>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
          Phase 2 runs on the linked acquisitions project. Once we create it, this property gets a
          real finance center with budget versus actual, capital stack inputs, sources and uses,
          and PDF-ready reporting.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
            <p className="text-sm font-semibold text-ink-900">Expected cost plan</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Budget lines and actual expenses stay connected instead of living in separate tools.
            </p>
          </div>
          <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
            <p className="text-sm font-semibold text-ink-900">Editable deal assumptions</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Purchase price, closing costs, hold assumptions, loan profile, and returns all stay
              live in one place.
            </p>
          </div>
          <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
            <p className="text-sm font-semibold text-ink-900">Report-ready outputs</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Export polished PDF deal analysis for lender reviews, investor updates, or internal
              decision making.
            </p>
          </div>
        </div>
      </div>

      <div className="section-card p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
          {property?.title || "Property"}
        </p>
        <h4 className="mt-4 text-xl font-semibold text-ink-900">Start the finance center</h4>
        <p className="mt-3 text-sm leading-6 text-ink-500">
          Choose the primary strategy for this property. We will create the acquisitions workspace
          and load the finance sections from there.
        </p>

        <div className="mt-5">
          <FinanceSelect
            label="Strategy"
            name="strategy"
            value={selectedStrategy}
            options={PROPERTY_STRATEGIES}
            onChange={onStrategyChange}
          />
        </div>

        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className="primary-action mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isCreating ? "Creating..." : "Create acquisitions workspace"}
        </button>
      </div>
    </div>
  </section>
);

const PropertyFinancePanel = ({
  property,
  propertyKey,
  activeContentKey,
  onPropertyUpdated,
}) => {
  const investmentId = property?.workspaces?.acquisitions?.id || "";
  const [selectedStrategy, setSelectedStrategy] = useState(
    property?.workspaces?.acquisitions?.strategy || "flip"
  );
  const [investment, setInvestment] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [financeForm, setFinanceForm] = useState(() => buildFinanceForm(null));
  const [isSavingFinance, setIsSavingFinance] = useState(false);

  const loadFinanceWorkspace = useCallback(async () => {
    if (!investmentId) {
      setInvestment(null);
      setBudgetItems([]);
      setExpenses([]);
      setVendors([]);
      setFinanceForm(buildFinanceForm(null));
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [investmentData, budgetData, expenseData, vendorData] = await Promise.all([
        getInvestment(investmentId),
        getBudgetItems(investmentId),
        getExpenses(investmentId),
        getVendors(),
      ]);

      setInvestment(investmentData);
      setBudgetItems(budgetData || []);
      setExpenses(expenseData || []);
      setVendors(vendorData || []);
      setFinanceForm(buildFinanceForm(investmentData));
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

  const metrics = useMemo(
    () => getInvestmentAnalysisMetrics(investment || {}, { budgetItems, expenses }),
    [budgetItems, expenses, investment]
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
        toNumber(investment?.taxes, 0) +
        toNumber(investment?.insurance, 0) +
        toNumber(investment?.utilities, 0) +
        toNumber(investment?.otherMonthly, 0) +
        ((toNumber(investment?.loanAmount, 0) * (toNumber(investment?.interestRate, 0) / 100)) /
          12 || 0),
      pointsCost:
        (toNumber(investment?.loanAmount, 0) * toNumber(investment?.loanPoints, 0)) / 100,
      receiptAiCount: expenses.filter((expense) => expense.entryMethod === "receipt_ai").length,
    }),
    [expenses, investment]
  );

  const sourceItems = useMemo(
    () => [
      {
        label: "Debt capital",
        amount: metrics.loanAmount,
        hint: financeForm.loanType
          ? loanTypeOptions.find((option) => option.value === financeForm.loanType)?.label
          : "Primary financing source",
      },
      {
        label: "Equity and cash required",
        amount: metrics.cashInvested,
        hint: "Down payment, close costs, rehab, hold, and finance carry not covered by debt.",
      },
    ],
    [financeForm.loanType, metrics.cashInvested, metrics.loanAmount]
  );

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

  const handleSaveFinance = async (event) => {
    event.preventDefault();

    if (!investment?._id) {
      toast.error("Create the acquisitions workspace first.");
      return;
    }

    try {
      setIsSavingFinance(true);
      const updated = await updateInvestment(investment._id, {
        purchasePrice: toNumber(financeForm.purchasePrice, 0),
        arv: toNumber(financeForm.arv, 0),
        buyClosingCost: toNumber(financeForm.buyClosingCost, 0),
        buyClosingIsPercent: financeForm.buyClosingMode === "percent",
        sellClosingCost: toNumber(financeForm.sellClosingCost, 0),
        sellClosingIsPercent: financeForm.sellClosingMode === "percent",
        loanType: financeForm.loanType,
        lenderName: financeForm.lenderName.trim(),
        loanAmount: toNumber(financeForm.loanAmount, 0),
        interestRate: toNumber(financeForm.interestRate, 0),
        loanTerm: toNumber(financeForm.loanTerm, 0),
        loanPoints: toNumber(financeForm.loanPoints, 0),
        loanNotes: financeForm.loanNotes.trim(),
        holdingMonths: toNumber(financeForm.holdingMonths, 0),
        taxes: toNumber(financeForm.taxes, 0),
        insurance: toNumber(financeForm.insurance, 0),
        utilities: toNumber(financeForm.utilities, 0),
        otherMonthly: toNumber(financeForm.otherMonthly, 0),
      });

      setInvestment(updated);
      setFinanceForm(buildFinanceForm(updated));
      toast.success("Finance assumptions updated.");
    } catch (saveError) {
      toast.error(saveError.message || "Failed to update finance assumptions.");
    } finally {
      setIsSavingFinance(false);
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

  if (activeContentKey === "finance-budget-vs-actual") {
    return (
      <div className="space-y-6">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Finance > Budget vs Actual</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Expected cost plan versus actual project spend
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            This section reuses the live budget and expense engine so line-item budgets, vendor
            commitments, receipt capture, and actual spend stay tied to the same property finance
            model.
          </p>
        </section>

        <FinancialsTab
          investment={investment}
          budgetItems={budgetItems}
          expenses={expenses}
          vendors={vendors}
          onUpdate={loadFinanceWorkspace}
          showAnalysis={false}
        />
      </div>
    );
  }

  if (activeContentKey === "finance-reports") {
    return (
      <div className="space-y-6">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Finance > Reports</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Printable project financial reports
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            Export the current deal analysis to PDF and regenerate the AI summary from the latest
            underwriting inputs, budget, and spend data.
          </p>
        </section>

        <section className="section-card p-6 sm:p-7">
          <AnalysisCalculator
            investment={investment}
            budgetItems={budgetItems}
            expenses={expenses}
          />
        </section>
      </div>
    );
  }

  if (activeContentKey === "finance-sources-uses") {
    const totalSources = sourceItems.reduce((sum, item) => sum + item.amount, 0);
    const totalUses = useItems.reduce((sum, item) => sum + item.amount, 0);

    return (
      <div className="space-y-6">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Finance > Sources & Uses</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Show exactly where the money comes from and where it goes
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            This is the finance view you can use to explain the deal to partners, lenders, or your
            own team without piecing it together from several tabs.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricTile
            icon={BanknotesIcon}
            label="Total sources"
            value={formatCurrency(totalSources)}
            hint="Debt plus cash required to run the project."
          />
          <MetricTile
            icon={ClipboardDocumentListIcon}
            label="Total uses"
            value={formatCurrency(totalUses)}
            hint="Purchase, close, rehab, finance, and hold assumptions."
          />
          <MetricTile
            icon={DocumentChartBarIcon}
            label="Projected exit value"
            value={formatCurrency(metrics.arv)}
            hint="Current projected exit value based on deal assumptions."
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Capital in</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Sources</h4>
            <div className="mt-6">
              {sourceItems.map((item) => (
                <FinanceRow
                  key={item.label}
                  label={item.label}
                  value={formatCurrency(item.amount)}
                  hint={item.hint}
                />
              ))}
            </div>
          </section>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Capital out</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Uses</h4>
            <div className="mt-6">
              {useItems.map((item) => (
                <FinanceRow
                  key={item.label}
                  label={item.label}
                  value={formatCurrency(item.amount)}
                  hint={item.hint}
                />
              ))}
            </div>
          </section>
        </div>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Visual split</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Use allocation</h4>
          <div className="mt-6 space-y-4">
            {useItems.map((item, index) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-ink-700">{item.label}</p>
                  <p className="text-sm font-semibold text-ink-900">{formatCurrency(item.amount)}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full ${
                      index % 4 === 0
                        ? "bg-verdigris-500"
                        : index % 4 === 1
                          ? "bg-sky-500"
                          : index % 4 === 2
                            ? "bg-amber-400"
                            : "bg-clay-400"
                    }`}
                    style={{ width: `${safeRatio(item.amount, totalUses)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (activeContentKey === "finance-capital-stack") {
    const strategyLabel = getInvestmentStrategyLabel(getInvestmentStrategy(investment));
    const debtToCost = safeRatio(metrics.loanAmount, metrics.totalCost);
    const monthlyInterestCarry =
      (toNumber(financeForm.loanAmount, 0) * (toNumber(financeForm.interestRate, 0) / 100)) / 12;

    return (
      <div className="space-y-6">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Finance > Capital Stack</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Control the deal assumptions and financing profile
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            This is the editable finance model for the property. Update the purchase basis,
            closing assumptions, monthly carry, and the primary funding source so returns and
            reporting stay accurate.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={BuildingOffice2Icon}
            label="Strategy"
            value={strategyLabel}
            hint="The primary acquisitions strategy on this property."
          />
          <MetricTile
            icon={CreditCardIcon}
            label="Debt to cost"
            value={formatPercent(debtToCost)}
            hint="Loan amount against modeled project cost."
          />
          <MetricTile
            icon={BanknotesIcon}
            label="Monthly interest"
            value={formatCurrency(monthlyInterestCarry)}
            hint="Interest-only estimate from the current debt settings."
          />
          <MetricTile
            icon={ReceiptPercentIcon}
            label="Points cost"
            value={formatCurrency(financeSummary.pointsCost)}
            hint="Upfront points based on current loan settings."
          />
        </div>

        <form onSubmit={handleSaveFinance} className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
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
              <span className="eyebrow">Funding source</span>
              <h4 className="mt-4 text-2xl font-semibold text-ink-900">Primary capital stack</h4>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <FinanceSelect
                  label="Loan type"
                  name="loanType"
                  value={financeForm.loanType}
                  onChange={handleFinanceFieldChange}
                  options={loanTypeOptions}
                />
                <FinanceField
                  label="Lender / source"
                  name="lenderName"
                  value={financeForm.lenderName}
                  onChange={handleFinanceFieldChange}
                  placeholder="Private lender, bank, card issuer..."
                />
                <FinanceField
                  label="Loan amount"
                  name="loanAmount"
                  value={financeForm.loanAmount}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                />
                <FinanceField
                  label="Interest rate"
                  name="interestRate"
                  value={financeForm.interestRate}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                  suffix="%"
                />
                <FinanceField
                  label="Loan term"
                  name="loanTerm"
                  value={financeForm.loanTerm}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="12"
                  suffix="mo"
                />
                <FinanceField
                  label="Loan points"
                  name="loanPoints"
                  value={financeForm.loanPoints}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                  suffix="%"
                />
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-ink-700">Loan notes</span>
                  <textarea
                    name="loanNotes"
                    value={financeForm.loanNotes}
                    onChange={handleFinanceFieldChange}
                    rows={4}
                    className="auth-input min-h-[120px]"
                    placeholder="Track payment draft, draw cadence, or other financing notes here."
                  />
                </label>
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
                  label="Projected profit"
                  value={formatCurrency(metrics.profit)}
                  tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
                />
                <FinanceRow label="Cash invested" value={formatCurrency(metrics.cashInvested)} />
                <FinanceRow label="ROI on cash" value={formatPercent(metrics.roiOnCash)} />
                <FinanceRow label="Annualized ROI" value={formatPercent(metrics.annualizedROI)} />
              </div>
            </section>

            <section className="section-card p-5">
              <span className="eyebrow">Carry mix</span>
              <h4 className="mt-4 text-xl font-semibold text-ink-900">Monthly run rate</h4>
              <div className="mt-5 space-y-4">
                <ProgressBar
                  label="Taxes"
                  value={toNumber(financeForm.taxes, 0)}
                  total={metrics.monthlyHoldingCost || 1}
                  tone="bg-amber-400"
                  helper={formatCurrency(toNumber(financeForm.taxes, 0))}
                />
                <ProgressBar
                  label="Insurance"
                  value={toNumber(financeForm.insurance, 0)}
                  total={metrics.monthlyHoldingCost || 1}
                  tone="bg-sky-500"
                  helper={formatCurrency(toNumber(financeForm.insurance, 0))}
                />
                <ProgressBar
                  label="Utilities"
                  value={toNumber(financeForm.utilities, 0)}
                  total={metrics.monthlyHoldingCost || 1}
                  tone="bg-verdigris-500"
                  helper={formatCurrency(toNumber(financeForm.utilities, 0))}
                />
                <ProgressBar
                  label="Other carry"
                  value={toNumber(financeForm.otherMonthly, 0)}
                  total={metrics.monthlyHoldingCost || 1}
                  tone="bg-clay-400"
                  helper={formatCurrency(toNumber(financeForm.otherMonthly, 0))}
                />
              </div>
            </section>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel px-6 py-7 sm:px-7">
        <span className="eyebrow">Finance > Financial Health</span>
        <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
          Keep the entire project financial picture in one control tower
        </h3>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
          This dashboard brings the purchase basis, expected budget, actual spend, carry, debt,
          and return profile together so you can see the health of the property at a glance.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={BanknotesIcon}
          label="All-in basis"
          value={formatCurrency(metrics.totalCost)}
          hint="Purchase, close, expected budget, finance, and hold."
        />
        <MetricTile
          icon={ChartBarIcon}
          label="Projected profit"
          value={formatCurrency(metrics.profit)}
          hint={`${formatPercent(metrics.roiOnCash)} ROI on cash invested.`}
          tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
        />
        <MetricTile
          icon={ClipboardDocumentListIcon}
          label="Budget remaining"
          value={formatCurrency(metrics.remainingBudget)}
          hint={`${formatCurrency(metrics.totalSpent)} already spent against expected cost.`}
          tone={metrics.remainingBudget >= 0 ? "text-ink-900" : "text-clay-700"}
        />
        <MetricTile
          icon={ReceiptPercentIcon}
          label="AI receipt entries"
          value={financeSummary.receiptAiCount}
          hint={`${expenses.length} total expense record${expenses.length === 1 ? "" : "s"} so far.`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)]">
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Budget pulse</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Progress against plan</h4>
          <div className="mt-6 space-y-5">
            <ProgressBar
              label="Actual spent vs expected budget"
              value={metrics.totalSpent}
              total={metrics.totalBudget || 1}
              tone="bg-verdigris-500"
              helper={`${formatCurrency(metrics.totalSpent)} of ${formatCurrency(metrics.totalBudget)}`}
            />
            <ProgressBar
              label="Committed vs original budget"
              value={metrics.totalCommitted}
              total={metrics.totalOriginalBudget || 1}
              tone="bg-sky-500"
              helper={`${formatCurrency(metrics.totalCommitted)} committed`}
            />
            <ProgressBar
              label="All-in cost vs ARV"
              value={metrics.totalCost}
              total={metrics.arv || 1}
              tone="bg-amber-400"
              helper={`${formatCurrency(metrics.totalCost)} of ${formatCurrency(metrics.arv)} projected value`}
            />
            <ProgressBar
              label="Debt share of total cost"
              value={metrics.loanAmount}
              total={metrics.totalCost || 1}
              tone="bg-clay-400"
              helper={`${formatCurrency(metrics.loanAmount)} debt currently modeled`}
            />
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Return profile</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Outcome summary</h4>
          <div className="mt-6">
            <FinanceRow label="Purchase price" value={formatCurrency(metrics.purchasePrice)} />
            <FinanceRow label="Buy closing costs" value={formatCurrency(metrics.calcBuyingCost)} />
            <FinanceRow label="Expected rehab budget" value={formatCurrency(metrics.totalBudget)} />
            <FinanceRow label="Finance costs" value={formatCurrency(metrics.calcFinanceCost)} />
            <FinanceRow label="Holding costs" value={formatCurrency(metrics.calcHoldingCost)} />
            <FinanceRow label="Projected ARV" value={formatCurrency(metrics.arv)} />
            <FinanceRow label="Selling costs" value={formatCurrency(metrics.calcSellCost)} />
            <FinanceRow
              label="Net profit"
              value={formatCurrency(metrics.profit)}
              tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
            />
          </div>
        </section>
      </div>

      <section className="section-card p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Category burn</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Where the budget is moving</h4>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
              A quick read on how the current project categories compare against expected cost.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {budgetCategorySummary.length > 0 ? (
            budgetCategorySummary.slice(0, 8).map((group) => (
              <div key={group.label} className="rounded-[20px] border border-ink-100 bg-white/90 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-ink-900">{group.label}</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {group.expensesCount} expense record{group.expensesCount === 1 ? "" : "s"} linked
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[360px]">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Expected
                      </p>
                      <p className="mt-1 font-semibold text-ink-900">{formatCurrency(group.expected)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Actual
                      </p>
                      <p className="mt-1 font-semibold text-ink-900">{formatCurrency(group.actual)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Variance
                      </p>
                      <p
                        className={`mt-1 font-semibold ${
                          group.variance <= 0 ? "text-verdigris-700" : "text-clay-700"
                        }`}
                      >
                        {formatCurrency(group.variance)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <ProgressBar
                    label="Actual vs expected"
                    value={group.actual}
                    total={group.expected || 1}
                    tone="bg-verdigris-500"
                  />
                  <ProgressBar
                    label="Committed vs expected"
                    value={group.committed}
                    total={group.expected || 1}
                    tone="bg-sky-500"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
              No budget lines yet. The budget versus actual section is ready whenever you start
              adding scope items or expenses.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PropertyFinancePanel;
