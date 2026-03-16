import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import html2pdf from "html2pdf.js";
import {
  ArrowDownTrayIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { EmptyAcquisitionState } from "./PropertyFinancePanel";
import ScheduleTab from "./ScheduleTab";
import {
  createPropertyWorkspace,
  getBudgetItems,
  getExpenses,
  getInvestment,
  getProjectDocuments,
  getProjectTasks,
  getVendors,
} from "../utils/api";
import { formatCurrency, toNumber } from "../utils/investmentMetrics";
import {
  buildProjectTimelineEvents,
  formatTimelineDate,
  formatTimelineDateTime,
  timelineLaneConfig,
  toTimelineTime,
} from "../utils/propertyTimeline";

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

const PropertyOperationsPanel = ({
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
  const [tasks, setTasks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const timelineExportRef = useRef(null);

  useEffect(() => {
    setSelectedStrategy(property?.workspaces?.acquisitions?.strategy || "flip");
  }, [property?.workspaces?.acquisitions?.strategy]);

  const loadOperationsWorkspace = useCallback(async () => {
    if (!investmentId) {
      setInvestment(null);
      setTasks([]);
      setVendors([]);
      setBudgetItems([]);
      setExpenses([]);
      setDocuments([]);
      setError("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [investmentData, taskData, vendorData, budgetData, expenseData, documentData] =
        await Promise.all([
          getInvestment(investmentId),
          getProjectTasks(investmentId),
          getVendors(),
          getBudgetItems(investmentId),
          getExpenses(investmentId),
          getProjectDocuments(investmentId),
        ]);

      setInvestment(investmentData);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
      setBudgetItems(Array.isArray(budgetData) ? budgetData : []);
      setExpenses(Array.isArray(expenseData) ? expenseData : []);
      setDocuments(Array.isArray(documentData) ? documentData : []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load the operations workspace.");
    } finally {
      setLoading(false);
    }
  }, [investmentId]);

  useEffect(() => {
    if (!activeContentKey.startsWith("operations-")) {
      return;
    }

    loadOperationsWorkspace();
  }, [activeContentKey, loadOperationsWorkspace]);

  const timelineEvents = useMemo(
    () =>
      buildProjectTimelineEvents({
        investment,
        tasks,
        budgetItems,
        expenses,
        documents,
        propertyKey,
        propertyLabel: property?.sharedProfile?.address || property?.title || investment?.address || "",
      }),
    [budgetItems, documents, expenses, investment, property?.sharedProfile?.address, property?.title, propertyKey, tasks]
  );

  const eventsByLane = useMemo(() => {
    const groups = Object.keys(timelineLaneConfig).reduce((accumulator, key) => {
      accumulator[key] = [];
      return accumulator;
    }, {});

    timelineEvents.forEach((event) => {
      const lane = groups[event.lane] ? event.lane : "milestones";
      groups[lane].push(event);
    });

    return groups;
  }, [timelineEvents]);

  const today = useMemo(() => new Date(), []);
  const nextSevenDays = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 7);
    return next;
  }, []);

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status !== "Complete" && task.endDate && new Date(task.endDate) < today
      ).length,
    [tasks, today]
  );

  const upcomingTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status !== "Complete" &&
          task.endDate &&
          new Date(task.endDate) >= today &&
          new Date(task.endDate) <= nextSevenDays
      ).length,
    [nextSevenDays, tasks, today]
  );

  const vendorDirectory = useMemo(() => {
    const vendorMap = new Map();

    const ensureVendor = ({ key, name, trade = "", email = "", phone = "" }) => {
      if (!vendorMap.has(key)) {
        vendorMap.set(key, {
          key,
          name,
          trade,
          email,
          phone,
          commitments: 0,
          commitmentAmount: 0,
          paidToDate: 0,
          openTasks: 0,
          completedTasks: 0,
          nextDue: null,
        });
      }

      return vendorMap.get(key);
    };

    vendors.forEach((vendor) => {
      ensureVendor({
        key: vendor._id,
        name: vendor.name || "Vendor",
        trade: vendor.trade || "",
        email: vendor.contactInfo?.email || "",
        phone: vendor.contactInfo?.phone || "",
      });
    });

    budgetItems.forEach((item) => {
      (item.awards || []).forEach((award) => {
        const vendorId =
          typeof award.vendor === "object" ? award.vendor?._id || "" : award.vendor || "";
        const key = vendorId || `name:${award.vendorName || award.awardId}`;
        const entry = ensureVendor({
          key,
          name:
            (typeof award.vendor === "object" ? award.vendor?.name : "") ||
            award.vendorName ||
            "Selected vendor",
        });
        entry.commitments += 1;
        entry.commitmentAmount += toNumber(award.amount, 0);
      });
    });

    tasks.forEach((task) => {
      const vendorId =
        typeof task.assignee === "object" ? task.assignee?._id || "" : task.assignee || "";
      const vendorName =
        (typeof task.assignee === "object" ? task.assignee?.name : "") || "Assigned vendor";
      if (!vendorId && !task.assignee?.name) {
        return;
      }

      const entry = ensureVendor({
        key: vendorId || `name:${vendorName}`,
        name: vendorName,
        trade: task.assignee?.trade || "",
      });

      if (task.status === "Complete") {
        entry.completedTasks += 1;
      } else {
        entry.openTasks += 1;
      }

      if (task.endDate) {
        const due = new Date(task.endDate);
        if (!entry.nextDue || due < new Date(entry.nextDue)) {
          entry.nextDue = task.endDate;
        }
      }
    });

    expenses.forEach((expense) => {
      const vendorId =
        typeof expense.vendor === "object" ? expense.vendor?._id || "" : expense.vendor || "";
      const vendorName =
        (typeof expense.vendor === "object" ? expense.vendor?.name : "") ||
        expense.payeeName ||
        "Expense payee";
      const entry = ensureVendor({
        key: vendorId || `name:${vendorName}`,
        name: vendorName,
      });

      entry.paidToDate += toNumber(expense.amount, 0);
    });

    return [...vendorMap.values()]
      .filter((vendor) => vendor.commitments || vendor.paidToDate || vendor.openTasks || vendor.completedTasks)
      .sort(
        (left, right) =>
          right.commitmentAmount + right.paidToDate - (left.commitmentAmount + left.paidToDate)
      );
  }, [budgetItems, expenses, tasks, vendors]);

  const recentActivity = useMemo(
    () =>
      [...timelineEvents]
        .sort((left, right) => toTimelineTime(right.date) - toTimelineTime(left.date))
        .slice(0, 16),
    [timelineEvents]
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

      toast.success("Operations workspace created.");
    } catch (createError) {
      toast.error(createError.message || "Failed to create the acquisitions workspace.");
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleExportTimeline = () => {
    if (!timelineExportRef.current) {
      return;
    }

    html2pdf().from(timelineExportRef.current).save("property-operations-timeline.pdf");
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
        Loading operations workspace...
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

  if (activeContentKey === "operations-schedule") {
    return (
      <div className="space-y-6">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Operations > Schedule</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Run the property with a real schedule instead of scattered reminders
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            This page uses the linked project tasks and vendor assignments to show the execution
            calendar, gantt view, milestones, and delivery cadence for the property.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={CalendarDaysIcon}
            label="Scheduled tasks"
            value={tasks.length}
            hint="Project tasks currently planned."
          />
          <MetricTile
            icon={ClockIcon}
            label="Upcoming 7 days"
            value={upcomingTasks}
            hint="Tasks due in the next week."
          />
          <MetricTile
            icon={BuildingOffice2Icon}
            label="Overdue"
            value={overdueTasks}
            hint="Open tasks already past due."
            tone={overdueTasks > 0 ? "text-clay-700" : "text-ink-900"}
          />
          <MetricTile
            icon={UserGroupIcon}
            label="Assigned vendors"
            value={vendorDirectory.length}
            hint="Vendors currently touching this project."
          />
        </div>

        <ScheduleTab
          investment={investment}
          tasks={tasks}
          vendors={vendors}
          onUpdate={loadOperationsWorkspace}
        />
      </div>
    );
  }

  if (activeContentKey === "operations-timeline") {
    return (
      <div className="space-y-6">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <span className="eyebrow">Operations > Timeline</span>
              <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
                A colorful property timeline across vendors, costs, documents, and milestones
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
                This timeline turns the property into a visual story: who was committed, what was
                paid, what was uploaded, and which milestones landed when.
              </p>
            </div>

            <button type="button" onClick={handleExportTimeline} className="primary-action">
              <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
              Export timeline PDF
            </button>
          </div>
        </section>

        <div ref={timelineExportRef} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              icon={CalendarDaysIcon}
              label="Timeline events"
              value={timelineEvents.length}
              hint="Combined project history currently visible."
            />
            <MetricTile
              icon={UserGroupIcon}
              label="Vendor events"
              value={eventsByLane.vendors.length}
              hint="Awards and vendor task moments."
            />
            <MetricTile
              icon={BuildingOffice2Icon}
              label="Cost events"
              value={eventsByLane.costs.length}
              hint="Expenses recorded against the project."
            />
            <MetricTile
              icon={DocumentTextIcon}
              label="Document events"
              value={eventsByLane.documents.length}
              hint="Uploads visible in the document library."
            />
          </div>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Swimlanes</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Project event lanes</h4>

            <div className="mt-8 space-y-6">
              {Object.entries(timelineLaneConfig).map(([laneKey, laneConfig]) => (
                <div key={laneKey} className="rounded-[26px] border border-ink-100 bg-white/90 p-5">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${laneConfig.railClass}`} />
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${laneConfig.chipClass}`}>
                      {laneConfig.label}
                    </span>
                    <span className="text-sm text-ink-400">
                      {eventsByLane[laneKey].length} event
                      {eventsByLane[laneKey].length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {eventsByLane[laneKey].length > 0 ? (
                    <div className="mt-5 overflow-x-auto">
                      <div className="flex min-w-max gap-4 pb-2">
                        {eventsByLane[laneKey].map((event) => (
                          <div
                            key={event.id}
                            className={`w-[270px] rounded-[22px] border p-4 ${laneConfig.cardClass}`}
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                              {formatTimelineDate(event.date, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            <p className="mt-3 text-base font-semibold text-ink-900">{event.title}</p>
                            <p className="mt-2 text-sm leading-6 text-ink-500">
                              {event.description || "No extra detail"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[22px] border border-dashed border-ink-200 bg-ink-50/40 p-5 text-sm leading-6 text-ink-500">
                      No events in this lane yet.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (activeContentKey === "operations-vendors") {
    return (
      <div className="space-y-6">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <span className="eyebrow">Operations > Vendors</span>
              <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
                See who is involved, what they are committed to, and what has already been paid
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
                This roster turns vendors from a static list into a property-specific view of
                commitments, spend, and assigned work.
              </p>
            </div>

            <Link to="/vendors" className="secondary-action">
              Open full vendor directory
            </Link>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={UserGroupIcon}
            label="Active vendors"
            value={vendorDirectory.length}
            hint="Vendors with project involvement."
          />
          <MetricTile
            icon={BuildingOffice2Icon}
            label="Vendor commitments"
            value={vendorDirectory.reduce((sum, vendor) => sum + vendor.commitments, 0)}
            hint="Awarded commitments across the property."
          />
          <MetricTile
            icon={CalendarDaysIcon}
            label="Open assigned tasks"
            value={vendorDirectory.reduce((sum, vendor) => sum + vendor.openTasks, 0)}
            hint="Vendor-facing work still open."
          />
          <MetricTile
            icon={ClockIcon}
            label="Paid to vendors"
            value={formatCurrency(
              vendorDirectory.reduce((sum, vendor) => sum + vendor.paidToDate, 0)
            )}
            hint="Payments linked to vendor records or payees."
          />
        </div>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Property vendor roster</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Vendors touching this job</h4>

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {vendorDirectory.length > 0 ? (
              vendorDirectory.map((vendor) => (
                <div key={vendor.key} className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-ink-900">{vendor.name}</p>
                      <p className="mt-1 text-sm font-medium text-ink-500">
                        {vendor.trade || "Trade not specified"}
                      </p>
                    </div>
                    <span className="rounded-full border border-verdigris-200 bg-verdigris-50 px-3 py-1 text-xs font-semibold text-verdigris-700">
                      {vendor.commitments} commitment{vendor.commitments === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                        Committed
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink-900">
                        {formatCurrency(vendor.commitmentAmount)}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                        Paid
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink-900">
                        {formatCurrency(vendor.paidToDate)}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                        Open tasks
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink-900">{vendor.openTasks}</p>
                    </div>
                    <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                        Next due
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink-900">
                          {vendor.nextDue ? formatTimelineDate(vendor.nextDue) : "No due date"}
                      </p>
                    </div>
                  </div>

                  {vendor.email || vendor.phone ? (
                    <div className="mt-4 rounded-[18px] border border-ink-100 bg-ink-50/40 p-4 text-sm leading-6 text-ink-600">
                      {vendor.email ? <p>{vendor.email}</p> : null}
                      {vendor.phone ? <p>{vendor.phone}</p> : null}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500 xl:col-span-2">
                No project-specific vendor activity yet. Add commitments, assign tasks, or record
                vendor expenses to populate this roster.
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel px-6 py-7 sm:px-7">
        <span className="eyebrow">Operations > Activity</span>
        <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
          Watch the property activity stream across schedule, vendors, costs, and documents
        </h3>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
          This feed gives you one quick place to scan what has changed recently without jumping
          between the other workspace sections.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={CalendarDaysIcon}
          label="Recent events"
          value={recentActivity.length}
          hint="Newest cross-workspace events shown below."
        />
        <MetricTile
          icon={ClockIcon}
          label="Upcoming tasks"
          value={upcomingTasks}
          hint="Due in the next seven days."
        />
        <MetricTile
          icon={DocumentTextIcon}
          label="Document uploads"
          value={documents.length}
          hint="Files currently in the property library."
        />
        <MetricTile
          icon={BuildingOffice2Icon}
          label="Expenses posted"
          value={expenses.length}
          hint="Cost entries contributing to the activity feed."
        />
      </div>

      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Recent activity</span>
        <h4 className="mt-4 text-2xl font-semibold text-ink-900">Property event feed</h4>

        <div className="mt-8 space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((event) => {
              const lane = timelineLaneConfig[event.lane] || timelineLaneConfig.milestones;
              return (
                <div key={event.id} className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lane.chipClass}`}>
                          {lane.label}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                          {formatTimelineDateTime(event.date)}
                        </span>
                      </div>
                      <p className="mt-3 text-base font-semibold text-ink-900">{event.title}</p>
                      <p className="mt-2 text-sm leading-6 text-ink-500">
                        {event.description || "No extra detail"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
              No recent activity yet. Start adding tasks, documents, or costs and the feed will
              populate automatically.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PropertyOperationsPanel;
