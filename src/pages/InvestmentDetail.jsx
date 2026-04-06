import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, BuildingOffice2Icon, ChartBarIcon } from "@heroicons/react/24/outline";

import AddExpenseModal from "../components/AddExpenseModal";
import ProjectExecutionHub from "../components/ProjectExecutionHub";
import StatusBadge from "../components/StatusBadge";
import {
  deleteInvestment,
  getInvestment,
  getBudgetItems,
  getBidsForProject,
  getExpenses,
  getProjectReceipts,
  getProjectTasks,
  getVendors,
} from "../utils/api";
import { getInvestmentStrategy, getInvestmentStrategyLabel } from "../utils/propertyStrategy";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const PageLoading = () => (
  <div className="surface-panel flex items-center justify-center px-6 py-20">
    <div className="flex items-center gap-4 text-ink-500">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-200 border-t-verdigris-500" />
      <p className="text-sm font-medium">Loading project hub...</p>
    </div>
  </div>
);

const MetricTile = ({ label, value, hint }) => (
  <div className="metric-tile p-5">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [investment, setInvestment] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [projectReceipts, setProjectReceipts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [heroExpenseModalState, setHeroExpenseModalState] = useState({
    isOpen: false,
    mode: "manual",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const investmentData = await getInvestment(id);

      const [budgetData, expenseData, receiptData, taskData, vendorData, bidsData] = await Promise.all([
        getBudgetItems(id),
        getExpenses(id),
        getProjectReceipts(id).catch(() => []),
        getProjectTasks(id),
        getVendors(),
        getBidsForProject(id),
      ]);

      setInvestment(investmentData);
      setBudgetItems(budgetData);
      setExpenses(expenseData);
      setProjectReceipts(receiptData);
      setTasks(taskData);
      setVendors(vendorData);
      setBids(bidsData);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load project data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteInvestment = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this entire project workspace? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteInvestment(id);
      navigate("/leads");
    } catch (err) {
      setError(err.message || "Failed to delete the project workspace.");
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return <div className="section-card px-6 py-10 text-center text-clay-700">{error}</div>;
  }

  if (!investment) {
    return <div className="section-card px-6 py-10 text-center text-ink-500">Project not found.</div>;
  }

  const strategy = getInvestmentStrategy(investment);
  const strategyLabel = getInvestmentStrategyLabel(strategy);
  const propertyWorkspaceId =
    typeof investment.property === "object" ? investment.property?._id : investment.property;
  const sourceLeadId =
    typeof investment.sourceLead === "object" ? investment.sourceLead?._id : investment.sourceLead;
  const sourceLeadSnapshot = investment.sourceLeadSnapshot || null;
  const hasPropertyWorkspace = Boolean(propertyWorkspaceId);
  const totalBudget = budgetItems.reduce((sum, item) => sum + Number(item.budgetedAmount ?? 0), 0);
  const totalCommitted = budgetItems.reduce(
    (sum, item) =>
      sum +
      (Array.isArray(item.awards)
        ? item.awards.reduce((awardSum, award) => awardSum + Number(award.amount || 0), 0)
        : 0),
    0
  );
  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const openTasks = tasks.filter((task) => task.status !== "Complete").length;
  const receiptInboxCount = projectReceipts.filter((receipt) => !receipt.expense).length;
  const progress = Number(investment.progress || 0);
  const backTarget = propertyWorkspaceId
    ? `/properties/${encodeURIComponent(propertyWorkspaceId)}`
    : "/leads";

  return (
    <div className="space-y-6">
      <AddExpenseModal
        isOpen={heroExpenseModalState.isOpen}
        onClose={() => setHeroExpenseModalState({ isOpen: false, mode: "manual" })}
        investmentId={investment._id}
        initialMode={heroExpenseModalState.mode}
        budgetItems={budgetItems}
        vendors={vendors}
        onSuccess={fetchData}
      />

      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(backTarget)}
                className="ghost-action"
              >
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
                Back to property workspace
              </button>
              <StatusBadge investment={investment} onUpdate={fetchData} />
            </div>

            <span className="eyebrow mt-6">Project management</span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight text-ink-900 sm:text-5xl">
              {investment.address}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600 sm:text-lg">
              Run the project from one execution hub where the scope budget, vendors, bids,
              receipts, expenses, schedule, and analysis stay connected.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-verdigris-200 bg-verdigris-50 px-4 py-2 text-sm font-medium text-verdigris-700">
                Strategy: {strategyLabel}
              </span>
              <span className="rounded-full border border-ink-200 bg-white/90 px-4 py-2 text-sm font-medium text-ink-700">
                {investment.propertyType || "Property type not specified"}
              </span>
              <span className="rounded-full border border-sand-200 bg-sand-50 px-4 py-2 text-sm font-medium text-sand-700">
                {progress}% progress
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {hasPropertyWorkspace ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/properties/${encodeURIComponent(propertyWorkspaceId)}`)
                  }
                  className="secondary-action"
                >
                  <BuildingOffice2Icon className="mr-2 h-5 w-5" />
                  Open property hub
                  </button>
              ) : null}

              {sourceLeadId ? (
                <button
                  type="button"
                  onClick={() => navigate(`/leads/${sourceLeadId}`)}
                  className="secondary-action"
                >
                  Open original lead
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setHeroExpenseModalState({ isOpen: true, mode: "manual" })}
                className="secondary-action"
              >
                Add expense
              </button>

              <button
                type="button"
                onClick={() => setHeroExpenseModalState({ isOpen: true, mode: "receipt" })}
                className="secondary-action"
              >
                Scan receipt with AI
              </button>

              {propertyWorkspaceId ? (
                <button
                  type="button"
                  className="primary-action"
                  onClick={() =>
                    navigate(`/properties/${encodeURIComponent(propertyWorkspaceId)}`)
                  }
                >
                  Open property workspace
                </button>
              ) : null}
            </div>
          </div>

          <div className="section-card overflow-hidden p-0">
            {investment.coverImage ? (
              <div className="relative h-full min-h-[280px]">
                <img
                  src={investment.coverImage}
                  alt={investment.address}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-transparent p-6 text-white">
                  <div className="flex h-full flex-col justify-end">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                      Current status
                    </p>
                    <p className="mt-2 text-3xl font-semibold">{investment.status || "Not Started"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[280px] flex-col justify-between bg-[radial-gradient(circle_at_top_left,_rgba(232,220,193,0.42),_transparent_34%),linear-gradient(135deg,_rgba(31,111,99,0.12),_rgba(255,255,255,0.92))] p-6">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
                    <ChartBarIcon className="h-6 w-6" />
                  </div>
                  <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Deal snapshot
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-ink-900">{strategyLabel}</p>
                  <p className="mt-3 text-sm leading-6 text-ink-500">
                    Add a cover image later if you want a more visual project identity inside the
                    hub.
                  </p>
                </div>

                <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Property workspace
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    {hasPropertyWorkspace
                      ? "Use the shared property record as the main workspace."
                      : "Shared property link unavailable."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Live budget"
          value={formatCurrency(totalBudget)}
          hint={`${budgetItems.length} scope ${budgetItems.length === 1 ? "category" : "categories"}`}
        />
        <MetricTile
          label="Committed"
          value={formatCurrency(totalCommitted)}
          hint="Awarded vendors and selected commitments"
        />
        <MetricTile
          label="Actual spent"
          value={formatCurrency(totalSpent)}
          hint={`${progress}% project progress`}
        />
        <MetricTile
          label="Execution queue"
          value={`${openTasks} open`}
          hint={`${receiptInboxCount} receipt${receiptInboxCount === 1 ? "" : "s"} awaiting review`}
        />
      </section>

      <div className="pb-2">
        <ProjectExecutionHub
          investment={investment}
          budgetItems={budgetItems}
          expenses={expenses}
          tasks={tasks}
          vendors={vendors}
          bids={bids}
          projectReceipts={projectReceipts}
          sourceLeadSnapshot={sourceLeadSnapshot}
          sourceLeadId={sourceLeadId}
          propertyWorkspaceId={propertyWorkspaceId}
          onRefresh={fetchData}
          onDeleteProject={handleDeleteInvestment}
        />
      </div>
    </div>
  );
};

export default InvestmentDetail;
