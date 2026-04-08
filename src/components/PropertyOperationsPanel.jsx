import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
import {
  getVendorComplianceClasses,
  getVendorComplianceLabel,
} from "../utils/vendors";
import {
  getVendorProcurementStateClasses,
  getVendorProcurementSummary,
} from "../utils/vendorProcurement";
import { exportElementToPdf } from "../utils/pdfExport";

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

const getTaskAssigneeLabel = (task = {}) => {
  if (task?.assignee && typeof task.assignee === "object") {
    return task.assignee.name || task.assignee.trade || "Assigned vendor";
  }

  return task?.assigneeName || task?.assignedVendorName || task?.assignee || "Unassigned";
};

const getVendorNextDueSortValue = (vendor = {}) => {
  if (!vendor.nextDue) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = new Date(vendor.nextDue);
  return Number.isFinite(parsed.valueOf()) ? parsed.valueOf() : Number.POSITIVE_INFINITY;
};

const PropertyOperationsPanel = ({
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

  const openTasks = useMemo(
    () => tasks.filter((task) => String(task.status || "").trim() !== "Complete"),
    [tasks]
  );

  const overdueTaskList = useMemo(
    () =>
      [...openTasks]
        .filter((task) => task.endDate && new Date(task.endDate) < today)
        .sort((left, right) => new Date(left.endDate) - new Date(right.endDate))
        .slice(0, 6),
    [openTasks, today]
  );

  const upcomingTaskList = useMemo(
    () =>
      [...openTasks]
        .filter(
          (task) =>
            task.endDate &&
            new Date(task.endDate) >= today &&
            new Date(task.endDate) <= nextSevenDays
        )
        .sort((left, right) => new Date(left.endDate) - new Date(right.endDate))
        .slice(0, 6),
    [nextSevenDays, openTasks, today]
  );

  const unassignedOpenTasksCount = useMemo(
    () =>
      openTasks.filter((task) => {
        if (task?.assignee && typeof task.assignee === "object") {
          return !task.assignee?._id && !task.assignee?.name;
        }

        return !task?.assignee && !task?.assigneeName && !task?.assignedVendorName;
      }).length,
    [openTasks]
  );

  const vendorDirectory = useMemo(() => {
    const vendorMap = new Map();
    const vendorRecordsById = new Map(
      vendors
        .filter((vendor) => vendor && typeof vendor === "object" && !Array.isArray(vendor))
        .map((vendor) => [vendor._id, vendor])
    );

    const ensureVendor = ({
      key,
      name,
      trade = "",
      email = "",
      phone = "",
      vendorRecord = null,
    }) => {
      if (!vendorMap.has(key)) {
        vendorMap.set(key, {
          key,
          name,
          trade,
          email,
          phone,
          vendorRecord: vendorRecord || null,
          linkedVendor: Boolean(vendorRecord),
          commitments: 0,
          commitmentAmount: 0,
          paidToDate: 0,
          openTasks: 0,
          completedTasks: 0,
          nextDue: null,
        });
      }

      const entry = vendorMap.get(key);

      if (name && (!entry.name || entry.name === "Vendor")) {
        entry.name = name;
      }

      if (trade && !entry.trade) {
        entry.trade = trade;
      }

      if (email && !entry.email) {
        entry.email = email;
      }

      if (phone && !entry.phone) {
        entry.phone = phone;
      }

      if (vendorRecord) {
        entry.vendorRecord = vendorRecord;
        entry.linkedVendor = true;
        entry.name = vendorRecord.name || entry.name;
        entry.trade = vendorRecord.trade || entry.trade;
        entry.email = vendorRecord.contactInfo?.email || entry.email;
        entry.phone = vendorRecord.contactInfo?.phone || entry.phone;
      }

      return entry;
    };

    vendors.forEach((vendor) => {
      ensureVendor({
        key: vendor._id,
        name: vendor.name || "Vendor",
        trade: vendor.trade || "",
        email: vendor.contactInfo?.email || "",
        phone: vendor.contactInfo?.phone || "",
        vendorRecord: vendor,
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
          vendorRecord: vendorRecordsById.get(vendorId) || null,
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
        vendorRecord: vendorRecordsById.get(vendorId) || null,
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
        "Payment payee";
      const entry = ensureVendor({
        key: vendorId || `name:${vendorName}`,
        name: vendorName,
        vendorRecord: vendorRecordsById.get(vendorId) || null,
      });

      entry.paidToDate += toNumber(expense.amount, 0);
    });

    return [...vendorMap.values()]
      .filter((vendor) => vendor.commitments || vendor.paidToDate || vendor.openTasks || vendor.completedTasks)
      .map((vendor) => {
        const procurement = getVendorProcurementSummary(vendor.vendorRecord || {});
        return {
          ...vendor,
          procurement: {
            ...procurement,
            overallLabel: vendor.linkedVendor ? procurement.overallLabel : "Unlinked payee",
            nextActions: vendor.linkedVendor
              ? procurement.nextActions
              : ["Create a vendor record", ...procurement.nextActions].slice(0, 4),
          },
        };
      })
      .sort(
        (left, right) =>
          right.commitmentAmount + right.paidToDate - (left.commitmentAmount + left.paidToDate)
      );
  }, [budgetItems, expenses, tasks, vendors]);

  const readyToAssignCount = useMemo(
    () => vendorDirectory.filter((vendor) => vendor.linkedVendor && vendor.procurement.assignmentReady).length,
    [vendorDirectory]
  );
  const vendorPacketGapCount = useMemo(
    () =>
      vendorDirectory.filter(
        (vendor) => !vendor.linkedVendor || vendor.procurement.blockingIssuesCount > 0
      ).length,
    [vendorDirectory]
  );
  const readyToPayCount = useMemo(
    () => vendorDirectory.filter((vendor) => vendor.procurement.paymentReady).length,
    [vendorDirectory]
  );
  const renewalWatchCount = useMemo(
    () =>
      vendorDirectory.filter((vendor) => vendor.procurement.renewalsDueCount > 0).length,
    [vendorDirectory]
  );
  const highRiskVendors = useMemo(
    () =>
      [...vendorDirectory]
        .filter(
          (vendor) =>
            !vendor.linkedVendor ||
            vendor.procurement.blockingIssuesCount > 0 ||
            (vendor.openTasks > 0 && !vendor.procurement.assignmentReady)
        )
        .sort((left, right) => {
          const rightPriority =
            right.procurement.blockingIssuesCount * 100 +
            (right.openTasks > 0 && !right.procurement.assignmentReady ? 10 : 0) +
            (right.linkedVendor ? 0 : 1);
          const leftPriority =
            left.procurement.blockingIssuesCount * 100 +
            (left.openTasks > 0 && !left.procurement.assignmentReady ? 10 : 0) +
            (left.linkedVendor ? 0 : 1);

          if (rightPriority !== leftPriority) {
            return rightPriority - leftPriority;
          }

          return getVendorNextDueSortValue(left) - getVendorNextDueSortValue(right);
        })
        .slice(0, 6),
    [vendorDirectory]
  );
  const readyNowVendors = useMemo(
    () =>
      [...vendorDirectory]
        .filter(
          (vendor) =>
            vendor.procurement.paymentReady ||
            vendor.procurement.assignmentReady ||
            vendor.procurement.renewalsDueCount > 0
        )
        .sort((left, right) => {
          const rightReadiness =
            (right.procurement.paymentReady ? 2 : 0) +
            (right.procurement.assignmentReady ? 1 : 0);
          const leftReadiness =
            (left.procurement.paymentReady ? 2 : 0) +
            (left.procurement.assignmentReady ? 1 : 0);

          if (rightReadiness !== leftReadiness) {
            return rightReadiness - leftReadiness;
          }

          return right.commitmentAmount + right.paidToDate - (left.commitmentAmount + left.paidToDate);
        })
        .slice(0, 6),
    [vendorDirectory]
  );
  const vendorScheduleWatchlist = useMemo(
    () =>
      [...vendorDirectory]
        .filter((vendor) => vendor.openTasks > 0 || vendor.nextDue)
        .sort((left, right) => getVendorNextDueSortValue(left) - getVendorNextDueSortValue(right))
        .slice(0, 6),
    [vendorDirectory]
  );

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

  const handleExportTimeline = async () => {
    if (!timelineExportRef.current) {
      return;
    }

    await exportElementToPdf({
      element: timelineExportRef.current,
      filename: "property-operations-timeline.pdf",
    });
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
        {!embedded ? (
          <section className="surface-panel px-6 py-7 sm:px-7">
            <span className="eyebrow">Operations / Schedule</span>
            <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
              Run the property with a real schedule instead of scattered reminders
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
              This page uses the linked project tasks and vendor assignments to show the execution
              calendar, gantt view, milestones, and delivery cadence for the property.
            </p>
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
            label="Unassigned work"
            value={unassignedOpenTasksCount}
            hint="Open tasks still missing a vendor owner."
            tone={unassignedOpenTasksCount > 0 ? "text-sand-700" : "text-ink-900"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <section className="section-card p-5 sm:p-6">
            <span className="eyebrow">Schedule watch</span>
            <h4 className="mt-4 text-xl font-semibold text-ink-900">Past due now</h4>
            <div className="mt-5 space-y-3">
              {overdueTaskList.length > 0 ? (
                overdueTaskList.map((task) => (
                  <div
                    key={task._id || `${task.title}-${task.endDate}`}
                    className="rounded-[18px] border border-clay-100 bg-clay-50/55 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">
                          {task.title || "Untitled task"}
                        </p>
                        <p className="mt-1 text-sm text-ink-500">{getTaskAssigneeLabel(task)}</p>
                      </div>
                      <span className="rounded-full border border-clay-200 bg-white px-3 py-1 text-xs font-semibold text-clay-700">
                        {task.endDate ? formatTimelineDate(task.endDate) : "No due date"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/35 px-4 py-4 text-sm leading-6 text-ink-500">
                  No overdue work right now.
                </div>
              )}
            </div>
          </section>

          <section className="section-card p-5 sm:p-6">
            <span className="eyebrow">This week</span>
            <h4 className="mt-4 text-xl font-semibold text-ink-900">Due in the next 7 days</h4>
            <div className="mt-5 space-y-3">
              {upcomingTaskList.length > 0 ? (
                upcomingTaskList.map((task) => (
                  <div
                    key={task._id || `${task.title}-${task.endDate}`}
                    className="rounded-[18px] border border-sand-100 bg-sand-50/55 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">
                          {task.title || "Untitled task"}
                        </p>
                        <p className="mt-1 text-sm text-ink-500">{getTaskAssigneeLabel(task)}</p>
                      </div>
                      <span className="rounded-full border border-sand-200 bg-white px-3 py-1 text-xs font-semibold text-sand-700">
                        {task.endDate ? formatTimelineDate(task.endDate) : "No due date"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/35 px-4 py-4 text-sm leading-6 text-ink-500">
                  No due-soon work in the current window.
                </div>
              )}
            </div>
          </section>

          <section className="section-card p-5 sm:p-6">
            <span className="eyebrow">Vendor handoffs</span>
            <h4 className="mt-4 text-xl font-semibold text-ink-900">Dependencies that affect timing</h4>
            <div className="mt-5 space-y-3">
              {vendorScheduleWatchlist.length > 0 ? (
                vendorScheduleWatchlist.map((vendor) => (
                  <div
                    key={vendor.key}
                    className="rounded-[18px] border border-ink-100 bg-ink-50/50 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{vendor.name}</p>
                        <p className="mt-1 text-sm text-ink-500">
                          {vendor.openTasks} open task{vendor.openTasks === 1 ? "" : "s"}
                          {vendor.trade ? ` • ${vendor.trade}` : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getVendorProcurementStateClasses(
                          vendor.procurement.overallState
                        )}`}
                      >
                        {vendor.procurement.overallLabel}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink-500">
                      {vendor.nextDue
                        ? `Next due ${formatTimelineDate(vendor.nextDue)}`
                        : "No committed due date yet"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/35 px-4 py-4 text-sm leading-6 text-ink-500">
                  Vendor handoffs will appear here once assignments and due dates are in place.
                </div>
              )}
            </div>
          </section>
        </div>

        <ScheduleTab
          investment={investment}
          tasks={tasks}
          vendors={vendors}
          budgetItems={budgetItems}
          onUpdate={loadOperationsWorkspace}
        />
      </div>
    );
  }

  if (activeContentKey === "operations-timeline") {
    return (
      <div className="space-y-6">
        {!embedded ? (
          <section className="surface-panel px-6 py-7 sm:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <span className="eyebrow">Operations / Timeline</span>
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
        ) : null}

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
              label="Payment events"
              value={eventsByLane.costs.length}
              hint="Payments recorded against the project."
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
        {!embedded ? (
          <section className="surface-panel px-6 py-7 sm:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <span className="eyebrow">Operations / Vendors</span>
                <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
                  See who is involved, what they are committed to, and whether their packet is ready
                </h3>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
                  This roster turns vendors from a static list into a property-specific procurement
                  board with commitments, spend, packet gaps, and assignment readiness.
                </p>
              </div>

              <Link to="/vendors" className="secondary-action">
                Open full vendor directory
              </Link>
            </div>
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={UserGroupIcon}
            label="Active vendors"
            value={vendorDirectory.length}
            hint="Vendors with project involvement."
          />
          <MetricTile
            icon={BuildingOffice2Icon}
            label="Ready to assign"
            value={readyToAssignCount}
            hint="Linked vendors with usable procurement packets."
          />
          <MetricTile
            icon={CalendarDaysIcon}
            label="Packet gaps"
            value={vendorPacketGapCount}
            hint="Vendors missing onboarding, contract, or payment backup."
          />
          <MetricTile
            icon={ClockIcon}
            label="Ready to pay"
            value={readyToPayCount}
            hint="Vendor packets ready for clean release of funds."
          />
          <MetricTile
            icon={BuildingOffice2Icon}
            label="Paid to vendors"
            value={formatCurrency(
              vendorDirectory.reduce((sum, vendor) => sum + vendor.paidToDate, 0)
            )}
            hint={`Vendor-linked payments recorded. ${renewalWatchCount} packet${renewalWatchCount === 1 ? "" : "s"} on renewal watch.`}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Action queue</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Vendors needing attention</h4>

            <div className="mt-6 space-y-3">
              {highRiskVendors.length > 0 ? (
                highRiskVendors.map((vendor) => (
                  <div
                    key={vendor.key}
                    className="rounded-[20px] border border-clay-100 bg-clay-50/55 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-ink-900">{vendor.name}</p>
                        <p className="mt-1 text-sm text-ink-500">
                          {vendor.trade || "Trade not specified"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getVendorProcurementStateClasses(
                          vendor.procurement.overallState
                        )}`}
                      >
                        {vendor.procurement.overallLabel}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink-600">
                      {vendor.procurement.nextActions[0]
                        ? vendor.procurement.nextActions.join(" • ")
                        : "Packet cleanup is recommended before new work or new payments."}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-ink-200 bg-ink-50/35 p-4 text-sm leading-6 text-ink-500">
                  No vendor packet blockers right now.
                </div>
              )}
            </div>
          </section>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Ready now</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Vendors ready to use or pay</h4>

            <div className="mt-6 space-y-3">
              {readyNowVendors.length > 0 ? (
                readyNowVendors.map((vendor) => (
                  <div
                    key={vendor.key}
                    className="rounded-[20px] border border-verdigris-100 bg-verdigris-50/55 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-ink-900">{vendor.name}</p>
                        <p className="mt-1 text-sm text-ink-500">
                          {formatCurrency(vendor.commitmentAmount)} committed • {formatCurrency(vendor.paidToDate)} paid
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getVendorProcurementStateClasses(
                          vendor.procurement.overallState
                        )}`}
                      >
                        {vendor.procurement.overallLabel}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink-600">
                      {vendor.procurement.paymentReady
                        ? "Payment support is in place."
                        : vendor.procurement.assignmentReady
                          ? "Packet is ready for new assignments."
                          : "This vendor is mostly ready but still needs packet cleanup."}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-ink-200 bg-ink-50/35 p-4 text-sm leading-6 text-ink-500">
                  Vendors will show up here once their packet is complete enough to assign or pay.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="eyebrow">Vendor control table</span>
              <h4 className="mt-4 text-2xl font-semibold text-ink-900">Run the roster without opening every record</h4>
            </div>
            <p className="text-sm leading-6 text-ink-500">
              Scan packet readiness, commitments, live payments, and due pressure in one place.
            </p>
          </div>

          {vendorDirectory.length > 0 ? (
            <div className="mt-8 overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-100 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.16em] text-ink-400">
                    <th className="pb-3 pr-4 font-semibold">Vendor</th>
                    <th className="pb-3 pr-4 font-semibold">Packet</th>
                    <th className="pb-3 pr-4 font-semibold">Commitments</th>
                    <th className="pb-3 pr-4 font-semibold">Paid</th>
                    <th className="pb-3 pr-4 font-semibold">Open tasks</th>
                    <th className="pb-3 pr-4 font-semibold">Next due</th>
                    <th className="pb-3 font-semibold">Next action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {vendorDirectory.map((vendor) => (
                    <tr key={vendor.key} className="align-top">
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-ink-900">{vendor.name}</p>
                        <p className="mt-1 text-sm text-ink-500">
                          {vendor.trade || "Trade not specified"}
                        </p>
                        {(vendor.email || vendor.phone) && (
                          <p className="mt-2 text-xs leading-5 text-ink-400">
                            {[vendor.email, vendor.phone].filter(Boolean).join(" • ")}
                          </p>
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getVendorProcurementStateClasses(
                              vendor.procurement.overallState
                            )}`}
                          >
                            {vendor.procurement.overallLabel}
                          </span>
                          {vendor.linkedVendor ? (
                            <span
                              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getVendorComplianceClasses(
                                vendor.vendorRecord
                              )}`}
                            >
                              {getVendorComplianceLabel(vendor.vendorRecord)}
                            </span>
                          ) : (
                            <span className="inline-flex w-fit rounded-full border border-ink-100 bg-white px-3 py-1 text-xs font-semibold text-ink-500">
                              Unlinked payee
                            </span>
                          )}
                          <span className="text-xs text-ink-400">
                            {vendor.procurement.completedRequiredCount}/{vendor.procurement.requiredCount} required items ready
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-sm font-semibold text-ink-900">
                        {formatCurrency(vendor.commitmentAmount)}
                        <p className="mt-1 text-xs font-medium text-ink-400">
                          {vendor.commitments} commitment{vendor.commitments === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="py-4 pr-4 text-sm font-semibold text-ink-900">
                        {formatCurrency(vendor.paidToDate)}
                      </td>
                      <td className="py-4 pr-4 text-sm font-semibold text-ink-900">
                        {vendor.openTasks}
                      </td>
                      <td className="py-4 pr-4 text-sm text-ink-600">
                        {vendor.nextDue ? formatTimelineDate(vendor.nextDue) : "No due date"}
                      </td>
                      <td className="py-4 text-sm leading-6 text-ink-600">
                        {vendor.procurement.nextActions[0]
                          ? vendor.procurement.nextActions.join(" • ")
                          : "Vendor packet looks healthy for the current stage."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-8 rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
              No project-specific vendor activity yet. Add commitments, assign tasks, or record
              vendor payments to populate this roster.
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Operations / Updates</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Watch the execution feed across schedule, vendors, payments, and documents
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            This feed gives you one quick place to scan what has changed recently without jumping
            between the other workspace sections.
          </p>
        </section>
      ) : null}

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
          label="Payments posted"
          value={expenses.length}
          hint="Cost entries contributing to the activity feed."
        />
      </div>

      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Recent activity</span>
        <h4 className="mt-4 text-2xl font-semibold text-ink-900">Execution event feed</h4>

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
              No recent activity yet. Start adding tasks, documents, or payments and the feed will
              populate automatically.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PropertyOperationsPanel;
