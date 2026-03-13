import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  PencilSquareIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import DashboardTab from "../components/DashboardTab";
import DealCalculatorTab from "../components/DealCalculatorTab";
import DealPerformanceTab from "../components/DealPerformanceTab";
import DocumentsTab from "../components/DocumentsTab";
import FinancialsTab from "../components/FinancialsTab";
import ScheduleTab from "../components/ScheduleTab";
import StatusBadge from "../components/StatusBadge";
import TeamTab from "../components/TeamTab";
import TimelineTab from "../components/TimelineTab";
import {
  deleteInvestment,
  getBudgetItems,
  getExpenses,
  getInvestment,
  getProjectTasks,
  getVendors,
  promoteInvestmentToManagement,
} from "../utils/api";
import {
  canStartManagement,
  getInvestmentStrategy,
  getInvestmentStrategyLabel,
} from "../utils/propertyStrategy";

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

const ProjectSettings = ({ onDelete }) => (
  <div className="section-card p-6 sm:p-7">
    <span className="eyebrow">Project settings</span>
    <h3 className="mt-4 text-3xl font-semibold text-ink-900">Administrative controls</h3>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
      Deleting a project is permanent and removes the related budget, expense, and schedule data.
    </p>

    <button
      type="button"
      onClick={onDelete}
      className="mt-8 inline-flex items-center justify-center rounded-full bg-clay-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-clay-700"
    >
      Delete this investment project
    </button>
  </div>
);

const tabConfig = [
  { id: "dashboard", label: "Dashboard" },
  { id: "financials", label: "Financials" },
  { id: "performance", label: "Performance" },
  { id: "schedule", label: "Schedule" },
  { id: "documents", label: "Documents" },
  { id: "team", label: "Team" },
  { id: "timeline", label: "Timeline" },
  { id: "dealcalc", label: "Deal calculator" },
  { id: "settings", label: "Settings" },
];

const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [investment, setInvestment] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isStartingManagement, setIsStartingManagement] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [investmentData, budgetData, expenseData, taskData, vendorData] = await Promise.all([
        getInvestment(id),
        getBudgetItems(id),
        getExpenses(id),
        getProjectTasks(id),
        getVendors(),
      ]);

      setInvestment(investmentData);
      setBudgetItems(budgetData);
      setExpenses(expenseData);
      setTasks(taskData);
      setVendors(vendorData);
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
      "Are you sure you want to delete this entire investment? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteInvestment(id);
      navigate("/investments");
    } catch (err) {
      setError(err.message || "Failed to delete investment.");
    }
  };

  const handleStartManagement = async () => {
    try {
      setActionError("");
      setIsStartingManagement(true);
      const managedProperty = await promoteInvestmentToManagement(id);
      navigate(`/management/${managedProperty._id}`);
    } catch (err) {
      setActionError(err.message || "Failed to start management.");
    } finally {
      setIsStartingManagement(false);
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
  const isManagementEligible = canStartManagement(investment);
  const managedPropertyId =
    typeof investment.managedProperty === "object"
      ? investment.managedProperty?._id
      : investment.managedProperty;
  const propertyWorkspaceId =
    typeof investment.property === "object" ? investment.property?._id : investment.property;
  const hasManagedProperty = Boolean(managedPropertyId);
  const hasPropertyWorkspace = Boolean(propertyWorkspaceId);
  const totalBudget = budgetItems.reduce((sum, item) => sum + Number(item.budgetedAmount || 0), 0);
  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const openTasks = tasks.filter((task) => task.status !== "Complete").length;
  const progress = Number(investment.progress || 0);

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => navigate("/investments")} className="ghost-action">
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
                Back to investments
              </button>
              <StatusBadge investment={investment} onUpdate={fetchData} />
            </div>

            <span className="eyebrow mt-6">Project hub</span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight text-ink-900 sm:text-5xl">
              {investment.address}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600 sm:text-lg">
              Track acquisition progress, project spend, and the operational handoff from a single
              investment workspace.
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

              {hasManagedProperty ? (
                <button
                  type="button"
                  onClick={() => navigate(`/management/${managedPropertyId}`)}
                  className="secondary-action"
                >
                  <BuildingOffice2Icon className="mr-2 h-5 w-5" />
                  Open management
                </button>
              ) : isManagementEligible ? (
                <button
                  type="button"
                  onClick={handleStartManagement}
                  disabled={isStartingManagement}
                  className="primary-action"
                >
                  {isStartingManagement ? "Starting management..." : "Start management"}
                  {!isStartingManagement && <SparklesIcon className="ml-2 h-5 w-5" />}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => navigate(`/investments/${id}/edit`)}
                className="ghost-action"
              >
                <PencilSquareIcon className="mr-2 h-5 w-5" />
                Edit deal assumptions
              </button>
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
                    Management handoff
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    {hasManagedProperty
                      ? "Already linked to active management."
                      : isManagementEligible
                        ? "Eligible to move into operations."
                        : "Still in acquisition setup."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {actionError ? (
        <div className="rounded-[26px] border border-clay-200 bg-clay-50 px-5 py-4 text-sm text-clay-700">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Purchase price" value={formatCurrency(investment.purchasePrice)} />
        <MetricTile label="ARV / future value" value={formatCurrency(investment.arv)} />
        <MetricTile label="Budgeted rehab" value={formatCurrency(totalBudget)} hint={`${openTasks} open task${openTasks === 1 ? "" : "s"}`} />
        <MetricTile label="Total spent" value={formatCurrency(totalSpent)} hint={`${progress}% project progress`} />
      </section>

      <section className="surface-panel px-4 py-4 sm:px-5">
        <div className="flex flex-wrap gap-2">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-ink-900 text-white shadow-soft"
                  : "bg-white/80 text-ink-600 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <div className="pb-2">
        {activeTab === "dashboard" && (
          <DashboardTab
            investment={investment}
            budgetItems={budgetItems}
            expenses={expenses}
            tasks={tasks}
            vendors={vendors}
            onUpdate={fetchData}
          />
        )}
        {activeTab === "financials" && (
          <FinancialsTab
            investment={investment}
            budgetItems={budgetItems}
            expenses={expenses}
            vendors={vendors}
            onUpdate={fetchData}
          />
        )}
        {activeTab === "performance" && (
          <DealPerformanceTab investment={investment} budgetItems={budgetItems} expenses={expenses} />
        )}
        {activeTab === "schedule" && (
          <ScheduleTab investment={investment} tasks={tasks} vendors={vendors} onUpdate={fetchData} />
        )}
        {activeTab === "documents" && <DocumentsTab investment={investment} />}
        {activeTab === "team" && <TeamTab vendors={vendors} onUpdate={fetchData} />}
        {activeTab === "timeline" && <TimelineTab investment={investment} />}
        {activeTab === "dealcalc" && (
          <DealCalculatorTab
            investment={investment}
            budgetItems={budgetItems}
            expenses={expenses}
          />
        )}
        {activeTab === "settings" && <ProjectSettings onDelete={handleDeleteInvestment} />}
      </div>
    </div>
  );
};

export default InvestmentDetail;
