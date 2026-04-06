import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import AddBudgetItemModal from "./AddBudgetItemModal";
import AddExpenseModal from "./AddExpenseModal";
import AIRehabBuilderModal from "./AIRehabBuilderModal";
import BudgetAwardModal from "./BudgetAwardModal";
import BudgetLineItem from "./BudgetLineItem";
import { EmptyAcquisitionState } from "./PropertyFinancePanel";
import {
  addBudgetAward,
  createPropertyWorkspace,
  deleteBudgetAward,
  getBudgetItems,
  getExpenses,
  getInvestment,
  getVendors,
  updateExpense,
  updateBudgetAward,
} from "../utils/api";
import {
  formatCurrency,
  getInvestmentAnalysisMetrics,
  toNumber,
} from "../utils/investmentMetrics";
import {
  getDrawRequestById,
  getDrawRequestLabel,
  getDrawRequests,
  getFundingSourceById,
  getFundingSourceLabel,
  getFundingSources,
} from "../utils/capitalStack";
import {
  buildExpenseDuplicateGroups,
  buildRecurringCarryTemplates,
  getExpensePaymentMethodLabel,
  getExpenseRecurringCategoryLabel,
  getExpenseStatusClasses,
  getExpenseStatusLabel,
} from "../utils/expenseOperations";

const formatDate = (value) => {
  if (!value) return "Recently";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return "Recently";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

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

const SpendBar = ({ label, expected, actual, committed }) => {
  const maxValue = Math.max(expected, actual, committed, 1);
  const expectedRatio = Math.max(8, (expected / maxValue) * 100);
  const actualRatio = Math.max(8, (actual / maxValue) * 100);
  const committedRatio = Math.max(8, (committed / maxValue) * 100);

  return (
    <div className="rounded-[20px] border border-ink-100 bg-white/85 p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-base font-semibold text-ink-900">{label}</p>
        <p
          className={`text-sm font-semibold ${
            actual <= expected ? "text-verdigris-700" : "text-clay-700"
          }`}
        >
          {formatCurrency(actual - expected)} variance
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-ink-600">Expected</span>
            <span className="font-semibold text-ink-900">{formatCurrency(expected)}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-sky-500" style={{ width: `${expectedRatio}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-ink-600">Committed</span>
            <span className="font-semibold text-ink-900">{formatCurrency(committed)}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${committedRatio}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-ink-600">Actual</span>
            <span className="font-semibold text-ink-900">{formatCurrency(actual)}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className={`h-full rounded-full ${actual <= expected ? "bg-verdigris-500" : "bg-clay-500"}`}
              style={{ width: `${actualRatio}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertyCostsPanel = ({
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
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [expenseModalState, setExpenseModalState] = useState({
    isOpen: false,
    budgetItemId: "",
    awardId: "",
    mode: "manual",
    initialValues: {},
  });
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAIBuilderModal, setShowAIBuilderModal] = useState(false);
  const [awardModalState, setAwardModalState] = useState({
    isOpen: false,
    budgetItem: null,
    award: null,
  });

  useEffect(() => {
    setSelectedStrategy(property?.workspaces?.acquisitions?.strategy || "flip");
  }, [property?.workspaces?.acquisitions?.strategy]);

  const loadCostsWorkspace = useCallback(async () => {
    if (!investmentId) {
      setInvestment(null);
      setBudgetItems([]);
      setExpenses([]);
      setVendors([]);
      setError("");
      setLoading(false);
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
      setBudgetItems(Array.isArray(budgetData) ? budgetData : []);
      setExpenses(Array.isArray(expenseData) ? expenseData : []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load the costs workspace.");
    } finally {
      setLoading(false);
    }
  }, [investmentId]);

  useEffect(() => {
    if (!activeContentKey.startsWith("costs-")) {
      return;
    }

    loadCostsWorkspace();
  }, [activeContentKey, loadCostsWorkspace]);

  const metrics = useMemo(
    () => getInvestmentAnalysisMetrics(investment || {}, { budgetItems, expenses }),
    [budgetItems, expenses, investment]
  );

  const fundingSources = useMemo(() => getFundingSources(investment || {}), [investment]);
  const drawRequests = useMemo(() => getDrawRequests(investment || {}), [investment]);

  const expensesByBudgetItemId = useMemo(() => {
    const groups = new Map();

    expenses.forEach((expense) => {
      const key =
        typeof expense.budgetItem === "object"
          ? expense.budgetItem?._id || ""
          : expense.budgetItem || "";

      if (!key) {
        return;
      }

      const current = groups.get(key) || [];
      current.push(expense);
      groups.set(key, current);
    });

    return groups;
  }, [expenses]);

  const categorySpendSummary = useMemo(() => {
    const groups = new Map();

    budgetItems.forEach((item) => {
      const key = item.category || "Uncategorized";
      if (!groups.has(key)) {
        groups.set(key, {
          label: key,
          expected: 0,
          committed: 0,
          actual: 0,
        });
      }

      const current = groups.get(key);
      current.expected += toNumber(item.budgetedAmount, 0);
      current.committed += Array.isArray(item.awards)
        ? item.awards.reduce((sum, award) => sum + toNumber(award.amount, 0), 0)
        : 0;
    });

    expenses.forEach((expense) => {
      const budgetItemId =
        typeof expense.budgetItem === "object"
          ? expense.budgetItem?._id || ""
          : expense.budgetItem || "";
      const budgetItem = budgetItems.find((item) => item._id === budgetItemId);
      const key = budgetItem?.category || "Project-level";

      if (!groups.has(key)) {
        groups.set(key, {
          label: key,
          expected: 0,
          committed: 0,
          actual: 0,
        });
      }

      groups.get(key).actual += toNumber(expense.amount, 0);
    });

    return [...groups.values()]
      .sort((left, right) => Math.max(right.expected, right.actual) - Math.max(left.expected, left.actual))
      .slice(0, 8);
  }, [budgetItems, expenses]);

  const fundingSpendSummary = useMemo(() => {
    const groups = new Map();

    expenses.forEach((expense) => {
      if (!expense.fundingSourceId) {
        return;
      }

      const linkedSource = getFundingSourceById(fundingSources, expense.fundingSourceId);
      const index = Math.max(
        fundingSources.findIndex((source) => source.sourceId === expense.fundingSourceId),
        0
      );
      const label = linkedSource
        ? getFundingSourceLabel(linkedSource, index)
        : "Archived funding source";
      const current = groups.get(expense.fundingSourceId) || {
        key: expense.fundingSourceId,
        label,
        amount: 0,
        count: 0,
      };

      current.amount += toNumber(expense.amount, 0);
      current.count += 1;
      groups.set(expense.fundingSourceId, current);
    });

    return [...groups.values()].sort((left, right) => right.amount - left.amount);
  }, [expenses, fundingSources]);

  const drawSpendSummary = useMemo(() => {
    const groups = new Map();

    expenses.forEach((expense) => {
      if (!expense.drawRequestId) {
        return;
      }

      const linkedDrawRequest = getDrawRequestById(drawRequests, expense.drawRequestId);
      const index = Math.max(
        drawRequests.findIndex((request) => request.drawId === expense.drawRequestId),
        0
      );
      const label = linkedDrawRequest
        ? getDrawRequestLabel(linkedDrawRequest, index)
        : "Archived draw request";
      const current = groups.get(expense.drawRequestId) || {
        key: expense.drawRequestId,
        label,
        amount: 0,
        count: 0,
      };

      current.amount += toNumber(expense.amount, 0);
      current.count += 1;
      groups.set(expense.drawRequestId, current);
    });

    return [...groups.values()].sort((left, right) => right.amount - left.amount);
  }, [drawRequests, expenses]);

  const approvalQueue = useMemo(
    () =>
      expenses
        .filter((expense) => ["draft", "approved"].includes(expense.status || "paid"))
        .sort((left, right) => new Date(left.date || 0) - new Date(right.date || 0)),
    [expenses]
  );

  const duplicateGroups = useMemo(() => buildExpenseDuplicateGroups(expenses), [expenses]);
  const duplicateExpenseIds = useMemo(
    () =>
      new Set(
        duplicateGroups.flatMap((group) => group.expenses.map((expense) => String(expense._id)))
      ),
    [duplicateGroups]
  );

  const recurringCarryTemplates = useMemo(
    () => buildRecurringCarryTemplates(investment || {}),
    [investment]
  );

  const recurringCarryActuals = useMemo(() => {
    const groups = new Map();

    expenses.forEach((expense) => {
      if (!expense.recurringCategory) {
        return;
      }

      const current = groups.get(expense.recurringCategory) || {
        amount: 0,
        count: 0,
        lastDate: null,
      };

      current.amount += toNumber(expense.amount, 0);
      current.count += 1;
      if (!current.lastDate || new Date(expense.date || 0) > new Date(current.lastDate || 0)) {
        current.lastDate = expense.date;
      }
      groups.set(expense.recurringCategory, current);
    });

    return groups;
  }, [expenses]);

  const commitments = useMemo(
    () =>
      budgetItems
        .flatMap((item) =>
          (item.awards || []).map((award) => {
            const vendorId =
              typeof award.vendor === "object" ? award.vendor?._id || "" : award.vendor || "";
            const matchedExpenses = expenses.filter((expense) => {
              const expenseBudgetItemId =
                typeof expense.budgetItem === "object"
                  ? expense.budgetItem?._id || ""
                  : expense.budgetItem || "";
              const expenseVendorId =
                typeof expense.vendor === "object" ? expense.vendor?._id || "" : expense.vendor || "";

              if (expense.awardId && expense.awardId === award.awardId) {
                return true;
              }

              return expenseBudgetItemId === item._id && vendorId && vendorId === expenseVendorId;
            });

            const paidToDate = matchedExpenses.reduce(
              (sum, expense) => sum + toNumber(expense.amount, 0),
              0
            );

            return {
              awardId: award.awardId,
              scopeItemId: item._id,
              scopeItemLabel: item.category || "Scope item",
              description: item.description || award.description || "",
              vendorName:
                (typeof award.vendor === "object" ? award.vendor?.name : "") ||
                award.vendorName ||
                "Selected vendor",
              amount: toNumber(award.amount, 0),
              paidToDate,
              remainingBalance: toNumber(award.amount, 0) - paidToDate,
              expensesCount: matchedExpenses.length,
              createdAt: award.createdAt || item.updatedAt || item.createdAt,
            };
          })
        )
        .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)),
    [budgetItems, expenses]
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

      toast.success("Costs workspace created.");
    } catch (createError) {
      toast.error(createError.message || "Failed to create the acquisitions workspace.");
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleOpenExpenseModal = ({
    budgetItemId = "",
    awardId = "",
    mode = "manual",
    initialValues = {},
  } = {}) => {
    setExpenseModalState({
      isOpen: true,
      budgetItemId,
      awardId,
      mode,
      initialValues,
    });
  };

  const handleExpenseStatusChange = async (expenseId, status) => {
    try {
      await updateExpense(expenseId, { status });
      await loadCostsWorkspace();
      toast.success(`Expense moved to ${getExpenseStatusLabel(status).toLowerCase()}.`);
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update expense status.");
    }
  };

  const handleSaveAward = async (payload) => {
    if (!awardModalState.budgetItem?._id) {
      return;
    }

    if (awardModalState.award?.awardId) {
      await updateBudgetAward(
        awardModalState.budgetItem._id,
        awardModalState.award.awardId,
        payload
      );
    } else {
      await addBudgetAward(awardModalState.budgetItem._id, payload);
    }

    await loadCostsWorkspace();
  };

  const handleDeleteAward = async (budgetItem, award) => {
    if (!window.confirm("Remove this selected vendor from the scope item?")) {
      return;
    }

    await deleteBudgetAward(budgetItem._id, award.awardId);
    await loadCostsWorkspace();
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
        Loading costs workspace...
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-card px-6 py-10 text-center text-clay-700">
        {error}
      </div>
    );
  }

  const sharedModals = (
    <>
      <AddExpenseModal
        isOpen={expenseModalState.isOpen}
        onClose={() =>
          setExpenseModalState({
            isOpen: false,
            budgetItemId: "",
            awardId: "",
            mode: "manual",
            initialValues: {},
          })
        }
        investmentId={investment._id}
        defaultBudgetItemId={expenseModalState.budgetItemId}
        defaultAwardId={expenseModalState.awardId}
        initialMode={expenseModalState.mode}
        onSuccess={loadCostsWorkspace}
        budgetItems={budgetItems}
        vendors={vendors}
        fundingSources={fundingSources}
        drawRequests={drawRequests}
        initialValues={expenseModalState.initialValues}
      />
      <AddBudgetItemModal
        isOpen={showAddBudgetModal}
        onClose={() => setShowAddBudgetModal(false)}
        investmentId={investment._id}
        onSuccess={loadCostsWorkspace}
      />
      <AIRehabBuilderModal
        isOpen={showAIBuilderModal}
        onClose={() => setShowAIBuilderModal(false)}
        investmentId={investment._id}
        onSuccess={loadCostsWorkspace}
      />
      <BudgetAwardModal
        isOpen={awardModalState.isOpen}
        onClose={() => setAwardModalState({ isOpen: false, budgetItem: null, award: null })}
        onSave={handleSaveAward}
        vendors={vendors}
        budgetItem={awardModalState.budgetItem}
        initialAward={awardModalState.award}
      />
    </>
  );

  if (activeContentKey === "costs-budget") {
    return (
      <>
        {sharedModals}
        <div className="space-y-6">
          {!embedded ? (
            <section className="surface-panel px-6 py-7 sm:px-7">
              <span className="eyebrow">Costs / Budget</span>
              <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
                Keep the expected cost plan editable and visible at every step
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
                Budget is the live expected-cost plan for this property. Scope lines, vendor
                commitments, and actual spend all roll into the same cost view.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => setShowAddBudgetModal(true)} className="primary-action">
                  Add scope item
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenExpenseModal()}
                  className="secondary-action"
                >
                  Add manual expense
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenExpenseModal({ mode: "receipt" })}
                  className="secondary-action"
                >
                  Scan receipt with AI
                </button>
                <button type="button" onClick={() => setShowAIBuilderModal(true)} className="ghost-action">
                  Generate AI budget
                </button>
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              icon={ClipboardDocumentListIcon}
              label="Expected budget"
              value={formatCurrency(metrics.totalBudget)}
              hint="Current editable cost plan."
            />
            <MetricTile
              icon={ArrowTrendingUpIcon}
              label="Committed"
              value={formatCurrency(metrics.totalCommitted)}
              hint="Awarded vendor and supplier amounts."
            />
            <MetricTile
              icon={BanknotesIcon}
              label="Actual spent"
              value={formatCurrency(metrics.totalSpent)}
              hint="Payments already recorded against the project."
            />
            <MetricTile
              icon={ReceiptPercentIcon}
              label="Remaining budget"
              value={formatCurrency(metrics.remainingBudget)}
              hint={`${budgetItems.length} scope item${budgetItems.length === 1 ? "" : "s"} in the plan.`}
              tone={metrics.remainingBudget >= 0 ? "text-ink-900" : "text-clay-700"}
            />
          </div>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Scope budget</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Budget lines and scope items</h4>

            <div className="mt-8 space-y-4">
              {budgetItems.length > 0 ? (
                budgetItems.map((item) => (
                  <BudgetLineItem
                    key={item._id}
                    item={item}
                    expenses={expensesByBudgetItemId.get(item._id) || []}
                    fundingSources={fundingSources}
                    drawRequests={drawRequests}
                    onAddExpense={() => handleOpenExpenseModal({ budgetItemId: item._id })}
                    onAddAward={() =>
                      setAwardModalState({ isOpen: true, budgetItem: item, award: null })
                    }
                    onEditAward={(award) =>
                      setAwardModalState({ isOpen: true, budgetItem: item, award })
                    }
                    onDeleteAward={(award) => handleDeleteAward(item, award)}
                  />
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                  No scope items yet. Add one manually or generate a first-pass budget with AI.
                </div>
              )}
            </div>
          </section>
        </div>
      </>
    );
  }

  if (activeContentKey === "costs-expenses") {
    return (
      <>
        {sharedModals}
        <div className="space-y-6">
          {!embedded ? (
            <section className="surface-panel px-6 py-7 sm:px-7">
                <span className="eyebrow">Costs / Expenses</span>
              <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
                Capture every property expense in one ledger
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
                Use manual entries or AI receipt capture, then keep every payment tied back to the
                property, vendor, and budget line wherever possible.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenExpenseModal()}
                  className="primary-action"
                >
                  Add manual expense
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenExpenseModal({ mode: "receipt" })}
                  className="secondary-action"
                >
                  Scan receipt with AI
                </button>
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              icon={BanknotesIcon}
              label="Total expenses"
              value={formatCurrency(metrics.totalSpent)}
              hint={`${expenses.length} payment record${expenses.length === 1 ? "" : "s"} logged.`}
            />
            <MetricTile
              icon={ClipboardDocumentListIcon}
              label="Approval queue"
              value={approvalQueue.length}
              hint="Draft and approved expenses still waiting to clear the workflow."
            />
            <MetricTile
              icon={ReceiptPercentIcon}
              label="AI receipt entries"
              value={expenses.filter((expense) => expense.entryMethod === "receipt_ai").length}
              hint="Entries created with receipt OCR assistance."
            />
            <MetricTile
              icon={ArrowTrendingUpIcon}
              label="Duplicate watch"
              value={duplicateGroups.length}
              hint="Potential duplicate groups found from amount, payee, and close dates."
            />
            <MetricTile
              icon={CreditCardIcon}
              label="Recurring carry logged"
              value={formatCurrency(
                [...recurringCarryActuals.values()].reduce(
                  (sum, item) => sum + toNumber(item.amount, 0),
                  0
                )
              )}
              hint="Expenses tagged to taxes, insurance, utilities, or other monthly carry."
            />
            <MetricTile
              icon={ArrowTrendingUpIcon}
              label="Funding-linked spend"
              value={formatCurrency(
                expenses.reduce(
                  (sum, expense) =>
                    sum + (expense.fundingSourceId ? toNumber(expense.amount, 0) : 0),
                  0
                )
              )}
              hint="Payments mapped directly to a funding source."
            />
            <MetricTile
              icon={ClipboardDocumentListIcon}
              label="Draw-linked spend"
              value={formatCurrency(
                expenses.reduce(
                  (sum, expense) =>
                    sum + (expense.drawRequestId ? toNumber(expense.amount, 0) : 0),
                  0
                )
              )}
              hint="Payments already tied to a specific draw."
            />
          </div>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">AP workflow</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">
              Approvals, duplicate watch, and recurring carry
            </h4>

            <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.04fr)_minmax(280px,360px)]">
              <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Approval queue
                    </p>
                    <p className="mt-2 text-base font-semibold text-ink-900">
                      Keep invoice capture moving to approved and paid
                    </p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    {approvalQueue.length} open
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {approvalQueue.length > 0 ? (
                    approvalQueue.slice(0, 6).map((expense) => (
                      <div
                        key={expense._id}
                        className="rounded-[18px] border border-ink-100 bg-ink-50/50 p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-ink-900">{expense.title}</p>
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getExpenseStatusClasses(
                                  expense.status
                                )}`}
                              >
                                {getExpenseStatusLabel(expense.status)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-ink-500">
                              {expense.vendor?.name || expense.payeeName || "Project expense"} ·{" "}
                              {formatDate(expense.date)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(expense.status || "paid") === "draft" ? (
                              <button
                                type="button"
                                onClick={() => handleExpenseStatusChange(expense._id, "approved")}
                                className="secondary-action"
                              >
                                Approve
                              </button>
                            ) : null}
                            {(expense.status || "paid") !== "paid" &&
                            (expense.status || "paid") !== "reimbursed" ? (
                              <button
                                type="button"
                                onClick={() => handleExpenseStatusChange(expense._id, "paid")}
                                className="primary-action"
                              >
                                Mark paid
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                      No expenses are waiting on approval right now.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Duplicate watch
                  </p>
                  <div className="mt-5 space-y-3">
                    {duplicateGroups.length > 0 ? (
                      duplicateGroups.slice(0, 4).map((group) => (
                        <div
                          key={group.key}
                          className="rounded-[18px] border border-clay-200 bg-clay-50/70 p-4"
                        >
                          <p className="text-sm font-semibold text-ink-900">
                            {group.expenses[0]?.vendor?.name ||
                              group.expenses[0]?.payeeName ||
                              group.expenses[0]?.title ||
                              "Potential duplicate"}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-ink-500">
                            {group.expenses.length} similar expenses totaling{" "}
                            {formatCurrency(group.totalAmount)} were logged within a short date
                            window.
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                        No likely duplicates detected in the current expense ledger.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Reimbursement status
                  </p>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-[18px] bg-ink-50/60 px-4 py-4">
                      <p className="text-sm font-medium text-ink-600">Paid expenses</p>
                      <p className="mt-2 text-lg font-semibold text-ink-900">
                        {
                          expenses.filter((expense) => (expense.status || "paid") === "paid")
                            .length
                        }
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-ink-50/60 px-4 py-4">
                      <p className="text-sm font-medium text-ink-600">Reimbursed expenses</p>
                      <p className="mt-2 text-lg font-semibold text-ink-900">
                        {
                          expenses.filter((expense) => (expense.status || "paid") === "reimbursed")
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Recurring carry</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">
              Turn finance assumptions into quick monthly logging
            </h4>

            <div className="mt-8 grid gap-4 xl:grid-cols-2">
              {recurringCarryTemplates.length > 0 ? (
                recurringCarryTemplates.map((template) => {
                  const actual = recurringCarryActuals.get(template.recurringCategory) || {
                    amount: 0,
                    count: 0,
                    lastDate: null,
                  };

                  return (
                    <div
                      key={template.id}
                      className="rounded-[22px] border border-ink-100 bg-white/90 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-ink-900">{template.label}</p>
                          <p className="mt-2 text-sm leading-6 text-ink-500">
                            Expected monthly carry from the finance model.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenExpenseModal({
                              initialValues: {
                                title: template.title,
                                description: template.description,
                                amount: template.amount,
                                payeeName: template.label,
                                recurringCategory: template.recurringCategory,
                                paymentMethod: "ach",
                                status: "paid",
                              },
                            })
                          }
                          className="secondary-action"
                        >
                          Log this month
                        </button>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-[18px] bg-sky-50 px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                            Expected
                          </p>
                          <p className="mt-2 text-sm font-semibold text-ink-900">
                            {formatCurrency(template.amount)}
                          </p>
                        </div>
                        <div className="rounded-[18px] bg-verdigris-50 px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                            Logged
                          </p>
                          <p className="mt-2 text-sm font-semibold text-ink-900">
                            {formatCurrency(actual.amount)}
                          </p>
                        </div>
                        <div className="rounded-[18px] bg-sand-50 px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                            Last logged
                          </p>
                          <p className="mt-2 text-sm font-semibold text-ink-900">
                            {actual.lastDate ? formatDate(actual.lastDate) : "Not yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500 xl:col-span-2">
                  Add monthly taxes, insurance, utilities, or other carry in Finance to unlock quick
                  recurring logging here.
                </div>
              )}
            </div>
          </section>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Capital allocation</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">
              See which sources and draws are funding the work
            </h4>

            <div className="mt-8 grid gap-5 xl:grid-cols-2">
              <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Funding sources
                    </p>
                    <p className="mt-2 text-base font-semibold text-ink-900">
                      Spend mapped to the capital stack
                    </p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    {fundingSpendSummary.length} linked
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {fundingSpendSummary.length > 0 ? (
                    fundingSpendSummary.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-[18px] border border-ink-100 bg-ink-50/50 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                            <p className="mt-1 text-sm text-ink-500">
                              {item.count} expense{item.count === 1 ? "" : "s"} linked
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-ink-900">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                      No expenses are linked to a funding source yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Draw requests
                    </p>
                    <p className="mt-2 text-base font-semibold text-ink-900">
                      Spend already attached to lender draws
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {drawSpendSummary.length} linked
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {drawSpendSummary.length > 0 ? (
                    drawSpendSummary.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-[18px] border border-ink-100 bg-ink-50/50 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                            <p className="mt-1 text-sm text-ink-500">
                              {item.count} expense{item.count === 1 ? "" : "s"} linked
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-ink-900">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                      No expenses are assigned to a specific draw request yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Spend by category</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Budget versus actual by area</h4>

            <div className="mt-8 grid gap-4 xl:grid-cols-2">
              {categorySpendSummary.length > 0 ? (
                categorySpendSummary.map((group) => (
                  <SpendBar
                    key={group.label}
                    label={group.label}
                    expected={group.expected}
                    committed={group.committed}
                    actual={group.actual}
                  />
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500 xl:col-span-2">
                  No expense categories yet. Add the first expense or budget line to start tracking
                  category burn.
                </div>
              )}
            </div>
          </section>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Expense ledger</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">All property expenses</h4>

            <div className="mt-8 space-y-3">
              {expenses.length > 0 ? (
                [...expenses]
                  .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))
                  .map((expense) => {
                    const budgetItemId =
                      typeof expense.budgetItem === "object"
                        ? expense.budgetItem?._id || ""
                        : expense.budgetItem || "";
                    const budgetItem =
                      typeof expense.budgetItem === "object"
                        ? expense.budgetItem
                        : budgetItems.find((item) => item._id === budgetItemId) || null;
                    const linkedFundingSource = getFundingSourceById(
                      fundingSources,
                      expense.fundingSourceId
                    );
                    const linkedDrawRequest = getDrawRequestById(
                      drawRequests,
                      expense.drawRequestId
                    );

                    return (
                      <div
                        key={expense._id}
                        className="rounded-[22px] border border-ink-100 bg-white/85 p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold text-ink-900">{expense.title}</p>
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                                  expense.entryMethod === "receipt_ai"
                                    ? "bg-verdigris-50 text-verdigris-700"
                                    : "bg-sand-50 text-sand-700"
                                }`}
                              >
                                {expense.entryMethod === "receipt_ai" ? "AI receipt" : "Manual"}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getExpenseStatusClasses(
                                  expense.status
                                )}`}
                              >
                                {getExpenseStatusLabel(expense.status)}
                              </span>
                              {expense.recurringCategory ? (
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                                  {getExpenseRecurringCategoryLabel(expense.recurringCategory)}
                                </span>
                              ) : null}
                              {duplicateExpenseIds.has(String(expense._id)) ? (
                                <span className="rounded-full bg-clay-50 px-3 py-1 text-[11px] font-semibold text-clay-700">
                                  Possible duplicate
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-2 text-sm text-ink-500">
                              {(expense.vendor?.name || expense.payeeName || "Project expense") +
                                (expense.description ? ` • ${expense.description}` : "")}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                              <span>{formatDate(expense.date)}</span>
                              <span>•</span>
                              <span>{budgetItem?.category || "Project-level"}</span>
                              <span>•</span>
                              <span>{getExpensePaymentMethodLabel(expense.paymentMethod)}</span>
                            </div>

                            {linkedFundingSource || linkedDrawRequest ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {linkedFundingSource ? (
                                  <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                                    {getFundingSourceLabel(
                                      linkedFundingSource,
                                      Math.max(
                                        fundingSources.findIndex(
                                          (source) =>
                                            source.sourceId === linkedFundingSource.sourceId
                                        ),
                                        0
                                      )
                                    )}
                                  </span>
                                ) : null}
                                {linkedDrawRequest ? (
                                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                                    {getDrawRequestLabel(
                                      linkedDrawRequest,
                                      Math.max(
                                        drawRequests.findIndex(
                                          (request) =>
                                            request.drawId === linkedDrawRequest.drawId
                                        ),
                                        0
                                      )
                                    )}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}

                            {expense.notes ? (
                              <p className="mt-3 text-sm leading-6 text-ink-500">{expense.notes}</p>
                            ) : null}
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-semibold text-ink-900">
                              {formatCurrency(expense.amount)}
                            </p>
                            {(expense.status || "paid") === "approved" ? (
                              <button
                                type="button"
                                onClick={() => handleExpenseStatusChange(expense._id, "paid")}
                                className="secondary-action mt-3"
                              >
                                Mark paid
                              </button>
                            ) : null}
                            {(expense.status || "paid") === "paid" ? (
                              <button
                                type="button"
                                onClick={() => handleExpenseStatusChange(expense._id, "reimbursed")}
                                className="ghost-action mt-3"
                              >
                                Mark reimbursed
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                  No expenses yet. Add a manual payment or scan the first receipt to start the
                  ledger.
                </div>
              )}
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      {sharedModals}
      <div className="space-y-6">
        {!embedded ? (
          <section className="surface-panel px-6 py-7 sm:px-7">
            <span className="eyebrow">Costs / Commitments</span>
            <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
              Track what has been awarded, what has been paid, and what is still outstanding
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
              Commitments connect your chosen vendor awards to actual payments so you can see
              remaining contract exposure before it becomes a surprise.
            </p>
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={ArrowTrendingUpIcon}
            label="Commitments"
            value={commitments.length}
            hint="Selected vendor commitments across scope items."
          />
          <MetricTile
            icon={ClipboardDocumentListIcon}
            label="Committed amount"
            value={formatCurrency(metrics.totalCommitted)}
            hint="Total contract value awarded so far."
          />
          <MetricTile
            icon={BanknotesIcon}
            label="Paid to date"
            value={formatCurrency(commitments.reduce((sum, item) => sum + item.paidToDate, 0))}
            hint="Payments mapped back to those commitments."
          />
          <MetricTile
            icon={CreditCardIcon}
            label="Remaining balance"
            value={formatCurrency(
              commitments.reduce((sum, item) => sum + item.remainingBalance, 0)
            )}
            hint="Outstanding commitment exposure."
            tone={
              commitments.reduce((sum, item) => sum + item.remainingBalance, 0) >= 0
                ? "text-ink-900"
                : "text-clay-700"
            }
          />
        </div>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Commitment ledger</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Awarded scope obligations</h4>

          <div className="mt-8 space-y-4">
            {commitments.length > 0 ? (
              commitments.map((commitment) => (
                <div
                  key={commitment.awardId}
                  className="rounded-[24px] border border-ink-100 bg-white/90 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-base font-semibold text-ink-900">{commitment.vendorName}</p>
                      <p className="mt-2 text-sm font-medium text-ink-600">
                        {commitment.scopeItemLabel}
                      </p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
                        {commitment.description || "No scope note saved for this commitment."}
                      </p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Added {formatDate(commitment.createdAt)}
                      </p>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-3 xl:min-w-[360px]">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Awarded
                        </p>
                        <p className="mt-1 font-semibold text-ink-900">
                          {formatCurrency(commitment.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Paid
                        </p>
                        <p className="mt-1 font-semibold text-ink-900">
                          {formatCurrency(commitment.paidToDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Remaining
                        </p>
                        <p
                          className={`mt-1 font-semibold ${
                            commitment.remainingBalance >= 0 ? "text-ink-900" : "text-clay-700"
                          }`}
                        >
                          {formatCurrency(commitment.remainingBalance)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-verdigris-500"
                      style={{
                        width: `${Math.max(
                          6,
                          Math.min(
                            100,
                            (commitment.paidToDate / Math.max(commitment.amount, 1)) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-ink-500">
                    {commitment.expensesCount} linked payment
                    {commitment.expensesCount === 1 ? "" : "s"} recorded so far.
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                No commitments yet. Add vendors to budget lines in the Budget section to start the
                commitment ledger.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default PropertyCostsPanel;
