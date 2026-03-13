import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  ReceiptPercentIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import { getTenantLeaseDetails, logoutTenant, submitTenantCommunication } from "../utils/api";

const requestCategories = [
  "General Inquiry",
  "Maintenance",
  "Payment Issue",
  "Personal Message",
  "Other",
];

const tabOptions = [
  { id: "overview", label: "Overview" },
  { id: "ledger", label: "Ledger" },
  { id: "request", label: "Requests" },
];

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value, options = {}) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(date);
};

const getDaysRemaining = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const diff = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
};

const getRequestStatusClassName = (status) => {
  switch (status) {
    case "Closed":
    case "Finished":
      return "border border-verdigris-200 bg-verdigris-50 text-verdigris-700";
    case "In Progress":
      return "border border-sand-200 bg-sand-100 text-sand-700";
    default:
      return "border border-clay-200 bg-clay-50 text-clay-700";
  }
};

const getCategoryIcon = (category) =>
  category === "Maintenance" ? WrenchScrewdriverIcon : ChatBubbleLeftRightIcon;

const TenantDashboardLoading = () => (
  <div className="public-shell relative min-h-screen overflow-hidden text-ink-900">
    <div className="absolute inset-0 grid-fade opacity-25" />

    <div className="relative mx-auto flex min-h-screen max-w-[1180px] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="auth-card flex max-w-xl flex-col items-center px-8 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-verdigris-50 text-verdigris-600">
          <ArrowPathIcon className="h-8 w-8 animate-spin" />
        </div>
        <span className="eyebrow mt-6">Tenant portal</span>
        <h1 className="mt-5 font-display text-4xl text-ink-900">Loading your lease workspace</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-ink-500">
          Pulling your current lease, ledger activity, and request history.
        </p>
      </div>
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-6 border-b border-ink-100 py-4 last:border-b-0">
    <dt className="text-sm font-medium text-ink-500">{label}</dt>
    <dd className="text-right text-sm font-semibold text-ink-900">{value}</dd>
  </div>
);

const TenantDashboard = () => {
  const navigate = useNavigate();
  const attachmentInputRef = useRef(null);

  const [leaseData, setLeaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General Inquiry");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState({ type: "", message: "" });

  const handleLogout = () => {
    logoutTenant();
    navigate("/tenant-login", { replace: true });
  };

  const loadLeaseData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTenantLeaseDetails();
      setLeaseData(data);
    } catch (err) {
      const message = err.message || "Could not load your lease information.";
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes("authorized") || normalizedMessage.includes("token")) {
        logoutTenant();
        navigate("/tenant-login", { replace: true });
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadLeaseData();
  }, [loadLeaseData]);

  const transactions = [...(Array.isArray(leaseData?.transactions) ? leaseData.transactions : [])].sort(
    (left, right) => new Date(right.date) - new Date(left.date)
  );

  const communications = [
    ...(Array.isArray(leaseData?.communications) ? leaseData.communications : []),
  ].sort((left, right) => new Date(right.date) - new Date(left.date));

  const recurringCharges = Array.isArray(leaseData?.recurringCharges) ? leaseData.recurringCharges : [];
  const currentBalance = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0
  );
  const openRequests = communications.filter(
    (entry) => !["Finished", "Closed"].includes(entry.status)
  ).length;
  const daysRemaining = getDaysRemaining(leaseData?.endDate);
  const propertyAddress = leaseData?.unit?.property?.address || "Property address unavailable";
  const unitName = leaseData?.unit?.name || "Unit not assigned";
  const tenantName = leaseData?.tenant?.fullName || "Tenant";

  const handleSubmitRequest = async (event) => {
    event.preventDefault();

    if (!subject.trim() || !category) {
      setFormFeedback({
        type: "error",
        message: "Please provide a subject and request category.",
      });
      return;
    }

    setIsSubmitting(true);
    setFormFeedback({ type: "", message: "" });

    const formData = new FormData();
    formData.append("subject", subject.trim());
    formData.append("category", category);
    formData.append("notes", notes.trim());

    if (file) {
      formData.append("attachment", file);
    }

    try {
      await submitTenantCommunication(formData);
      setFormFeedback({
        type: "success",
        message: "Your request has been sent to the property team.",
      });
      setSubject("");
      setCategory("General Inquiry");
      setNotes("");
      setFile(null);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
      await loadLeaseData();
      setActiveTab("request");
    } catch (err) {
      setFormFeedback({
        type: "error",
        message: err.message || "There was an error sending your request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <TenantDashboardLoading />;
  }

  if (error) {
    return (
      <div className="public-shell relative min-h-screen overflow-hidden text-ink-900">
        <div className="absolute inset-0 grid-fade opacity-25" />

        <div className="relative mx-auto flex min-h-screen max-w-[1180px] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="auth-card max-w-xl px-8 py-10 text-center">
            <span className="eyebrow">Tenant portal</span>
            <h1 className="mt-5 font-display text-4xl text-ink-900">We could not load your account</h1>
            <p className="mt-4 text-sm leading-6 text-ink-500">{error}</p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={loadLeaseData} className="primary-action">
                Try again
              </button>
              <button type="button" onClick={handleLogout} className="ghost-action">
                Back to tenant login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!leaseData) {
    return (
      <div className="public-shell relative min-h-screen overflow-hidden text-ink-900">
        <div className="absolute inset-0 grid-fade opacity-25" />

        <div className="relative mx-auto flex min-h-screen max-w-[1180px] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="auth-card max-w-xl px-8 py-10 text-center">
            <span className="eyebrow">Tenant portal</span>
            <h1 className="mt-5 font-display text-4xl text-ink-900">No active lease found</h1>
            <p className="mt-4 text-sm leading-6 text-ink-500">
              Contact your property manager if you expected to see lease information here.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={handleLogout} className="primary-action">
                Return to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-shell relative min-h-screen overflow-hidden text-ink-900">
      <div className="absolute inset-0 grid-fade opacity-20" />

      <div className="relative mx-auto flex min-h-screen max-w-[1480px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="surface-panel flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-lg font-bold text-white">
              FL
            </div>
            <div>
              <p className="font-display text-2xl leading-none text-ink-900">Fliprop</p>
              <p className="mt-1 text-sm text-ink-500">Tenant portal</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {leaseData.leaseDocumentUrl && (
              <a
                href={leaseData.leaseDocumentUrl}
                target="_blank"
                rel="noreferrer"
                className="secondary-action"
              >
                <DocumentTextIcon className="mr-2 h-5 w-5" />
                View lease document
              </a>
            )}

            <button type="button" onClick={handleLogout} className="ghost-action">
              <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
              Log out
            </button>
          </div>
        </header>

        <main className="flex-1 py-8 lg:py-10">
          <section className="surface-panel-strong overflow-hidden px-6 py-7 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_360px]">
              <div>
                <span className="eyebrow">Tenant command center</span>
                <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight text-ink-900 sm:text-5xl">
                  Welcome back, {tenantName}. Everything tied to your current lease is in one place.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600 sm:text-lg">
                  Review your ledger, confirm lease details, and send requests to the property
                  team without leaving the portal.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-full border border-ink-200 bg-white/90 px-4 py-2 text-sm font-medium text-ink-700">
                    {propertyAddress}
                  </span>
                  <span className="rounded-full border border-verdigris-200 bg-verdigris-50 px-4 py-2 text-sm font-medium text-verdigris-700">
                    {unitName}
                  </span>
                  <span className="rounded-full border border-sand-200 bg-sand-50 px-4 py-2 text-sm font-medium text-sand-700">
                    Active lease
                  </span>
                </div>
              </div>

              <div className="section-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
                    <BuildingOffice2Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Lease summary
                    </p>
                    <p className="mt-1 text-lg font-semibold text-ink-900">{unitName}</p>
                  </div>
                </div>

                <dl className="mt-6">
                  <InfoRow label="Lease term" value={`${formatDate(leaseData.startDate)} - ${formatDate(leaseData.endDate)}`} />
                  <InfoRow label="Monthly rent" value={formatCurrency(leaseData.rentAmount)} />
                  <InfoRow
                    label="Security deposit"
                    value={formatCurrency(leaseData.securityDeposit)}
                  />
                  <InfoRow
                    label="Tenant contact"
                    value={leaseData.tenant?.email || "Contact unavailable"}
                  />
                </dl>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="metric-tile p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
                <ReceiptPercentIcon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                Current balance
              </p>
              <p
                className={`mt-2 text-3xl font-semibold ${
                  currentBalance >= 0 ? "text-verdigris-700" : "text-clay-700"
                }`}
              >
                {formatCurrency(currentBalance)}
              </p>
              <p className="mt-2 text-sm text-ink-500">Latest ledger total across all posted activity.</p>
            </div>

            <div className="metric-tile p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sand-100 text-sand-700">
                <BanknotesIcon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                Monthly rent
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink-900">
                {formatCurrency(leaseData.rentAmount)}
              </p>
              <p className="mt-2 text-sm text-ink-500">
                Base rent currently attached to your active lease.
              </p>
            </div>

            <div className="metric-tile p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-50 text-ink-700">
                <CalendarDaysIcon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                Lease end
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink-900">
                {formatDate(leaseData.endDate, { month: "short", day: "numeric" })}
              </p>
              <p className="mt-2 text-sm text-ink-500">
                {daysRemaining === null
                  ? "Lease end date unavailable."
                  : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining in the current term.`}
              </p>
            </div>

            <div className="metric-tile p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay-50 text-clay-600">
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                Open requests
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink-900">{openRequests}</p>
              <p className="mt-2 text-sm text-ink-500">
                Active conversations or maintenance items still in progress.
              </p>
            </div>
          </section>

          <section className="mt-6 surface-panel px-4 py-4 sm:px-5">
            <div className="flex flex-wrap gap-2">
              {tabOptions.map((tab) => (
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

          {activeTab === "overview" && (
            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="space-y-6">
                <div className="section-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="eyebrow">Lease details</span>
                      <h2 className="mt-4 text-2xl font-semibold text-ink-900">At a glance</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-700">
                      <DocumentTextIcon className="h-6 w-6" />
                    </div>
                  </div>

                  <dl className="mt-6">
                    <InfoRow label="Property" value={propertyAddress} />
                    <InfoRow label="Unit" value={unitName} />
                    <InfoRow label="Resident" value={tenantName} />
                    <InfoRow label="Email" value={leaseData.tenant?.email || "Not available"} />
                    <InfoRow label="Phone" value={leaseData.tenant?.phone || "Not available"} />
                    <InfoRow
                      label="Security deposit"
                      value={formatCurrency(leaseData.securityDeposit)}
                    />
                  </dl>
                </div>

                <div className="section-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="eyebrow">Recurring charges</span>
                      <h2 className="mt-4 text-2xl font-semibold text-ink-900">Billing cadence</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand-100 text-sand-700">
                      <CalendarDaysIcon className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {recurringCharges.length > 0 ? (
                      recurringCharges.map((charge) => (
                        <div
                          key={`${charge.type}-${charge.description}-${charge.dayOfMonth}`}
                          className="rounded-[24px] border border-ink-100 bg-white/80 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-ink-900">{charge.description}</p>
                              <p className="mt-1 text-sm text-ink-500">
                                {charge.type} on day {charge.dayOfMonth} of each month
                              </p>
                            </div>
                            <p className="text-base font-semibold text-ink-900">
                              {formatCurrency(charge.amount)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-5 text-sm leading-6 text-ink-500">
                        No recurring charges are listed beyond the current rent structure.
                      </div>
                    )}
                  </div>

                  {leaseData.lateFeePolicy?.applies && (
                    <div className="mt-4 rounded-[24px] border border-clay-200 bg-clay-50 p-4 text-sm leading-6 text-clay-700">
                      Late fee policy: {leaseData.lateFeePolicy.feeType} of{" "}
                      {leaseData.lateFeePolicy.feeType === "Percentage"
                        ? `${leaseData.lateFeePolicy.amount}%`
                        : formatCurrency(leaseData.lateFeePolicy.amount)}{" "}
                      after {leaseData.lateFeePolicy.daysLate} day
                      {leaseData.lateFeePolicy.daysLate === 1 ? "" : "s"} late.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="section-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="eyebrow">Recent ledger activity</span>
                      <h2 className="mt-4 text-2xl font-semibold text-ink-900">Latest transactions</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
                      <BanknotesIcon className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {transactions.length > 0 ? (
                      transactions.slice(0, 5).map((transaction) => (
                        <div
                          key={transaction._id || `${transaction.type}-${transaction.date}`}
                          className="rounded-[24px] border border-ink-100 bg-white/80 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-ink-900">{transaction.type}</p>
                              <p className="mt-1 text-sm text-ink-500">{formatDate(transaction.date)}</p>
                              {transaction.description && (
                                <p className="mt-2 text-sm leading-6 text-ink-500">
                                  {transaction.description}
                                </p>
                              )}
                            </div>
                            <p
                              className={`text-base font-semibold ${
                                Number(transaction.amount || 0) >= 0
                                  ? "text-verdigris-700"
                                  : "text-clay-700"
                              }`}
                            >
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-5 text-sm leading-6 text-ink-500">
                        No transactions have posted to your lease yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="section-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="eyebrow">Communication history</span>
                      <h2 className="mt-4 text-2xl font-semibold text-ink-900">Recent requests</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-50 text-clay-600">
                      <ChatBubbleLeftRightIcon className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {communications.length > 0 ? (
                      communications.slice(0, 4).map((entry) => {
                        const CategoryIcon = getCategoryIcon(entry.category);

                        return (
                          <div
                            key={entry._id || `${entry.subject}-${entry.date}`}
                            className="rounded-[24px] border border-ink-100 bg-white/80 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-ink-50 text-ink-700">
                                  <CategoryIcon className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-ink-900">{entry.subject}</p>
                                  <p className="mt-1 text-sm text-ink-500">
                                    {entry.category} · {formatDate(entry.date)}
                                  </p>
                                  {entry.notes && (
                                    <p className="mt-2 text-sm leading-6 text-ink-500">
                                      {entry.notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRequestStatusClassName(
                                    entry.status
                                  )}`}
                                >
                                  {entry.status}
                                </span>
                                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink-400">
                                  {entry.author || "Tenant"}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-5 text-sm leading-6 text-ink-500">
                        No messages yet. Use the Requests tab when you need help from the property
                        team.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "ledger" && (
            <section className="mt-6 section-card p-6 sm:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <span className="eyebrow">Financial ledger</span>
                  <h2 className="mt-4 text-3xl font-semibold text-ink-900">Charges and payments</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                    Review every posted transaction attached to your lease. Reach out through the
                    Requests tab if you need clarification on an entry.
                  </p>
                </div>

                <div className="rounded-[28px] border border-ink-100 bg-ink-50/70 px-5 py-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Current total
                  </p>
                  <p
                    className={`mt-2 text-3xl font-semibold ${
                      currentBalance >= 0 ? "text-verdigris-700" : "text-clay-700"
                    }`}
                  >
                    {formatCurrency(currentBalance)}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div
                      key={transaction._id || `${transaction.type}-${transaction.date}`}
                      className="rounded-[24px] border border-ink-100 bg-white/85 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-ink-900">{transaction.type}</p>
                          <p className="mt-1 text-sm text-ink-500">{formatDate(transaction.date)}</p>
                          {transaction.description && (
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                        <p
                          className={`text-lg font-semibold ${
                            Number(transaction.amount || 0) >= 0
                              ? "text-verdigris-700"
                              : "text-clay-700"
                          }`}
                        >
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                    No ledger activity has been posted to your lease yet.
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "request" && (
            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div className="section-card p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="eyebrow">Contact the property team</span>
                    <h2 className="mt-4 text-3xl font-semibold text-ink-900">Send a request</h2>
                    <p className="mt-3 text-sm leading-6 text-ink-500">
                      Use this form for maintenance, payment questions, or general communication.
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
                    <PaperAirplaneIcon className="h-6 w-6" />
                  </div>
                </div>

                <form onSubmit={handleSubmitRequest} className="mt-8 space-y-5">
                  <div>
                    <label htmlFor="tenant-request-category" className="auth-label">
                      Category
                    </label>
                    <select
                      id="tenant-request-category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="auth-input"
                    >
                      {requestCategories.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tenant-request-subject" className="auth-label">
                      Subject
                    </label>
                    <input
                      id="tenant-request-subject"
                      type="text"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      className="auth-input"
                      placeholder="Short summary of what you need"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="tenant-request-notes" className="auth-label">
                      Details
                    </label>
                    <textarea
                      id="tenant-request-notes"
                      rows="5"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      className="auth-input min-h-[140px] resize-y"
                      placeholder="Add any details that will help the team respond quickly."
                    />
                  </div>

                  <div>
                    <label htmlFor="tenant-attachment-input" className="auth-label">
                      Attachment
                    </label>
                    <input
                      ref={attachmentInputRef}
                      id="tenant-attachment-input"
                      type="file"
                      onChange={(event) => setFile(event.target.files?.[0] || null)}
                      className="block w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-500 file:mr-4 file:rounded-full file:border-0 file:bg-verdigris-50 file:px-4 file:py-2 file:font-semibold file:text-verdigris-700 hover:file:bg-verdigris-100"
                    />
                    <p className="mt-2 text-xs text-ink-400">
                      Photos or supporting documents can help speed up a response.
                    </p>
                  </div>

                  {formFeedback.message && (
                    <div
                      className={`rounded-[24px] p-4 text-sm ${
                        formFeedback.type === "success"
                          ? "border border-verdigris-200 bg-verdigris-50 text-verdigris-800"
                          : "border border-clay-200 bg-clay-50 text-clay-700"
                      }`}
                    >
                      {formFeedback.message}
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting} className="primary-action w-full">
                    {isSubmitting ? "Sending request..." : "Send request"}
                    {!isSubmitting && <PaperAirplaneIcon className="ml-2 h-5 w-5" />}
                  </button>
                </form>
              </div>

              <div className="section-card p-6 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="eyebrow">Request history</span>
                    <h2 className="mt-4 text-3xl font-semibold text-ink-900">
                      Conversations and updates
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                      Follow the status of each request and keep a record of communication with your
                      property team.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-sand-200 bg-sand-50 px-4 py-3 text-sm font-semibold text-sand-700">
                    {openRequests} active
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {communications.length > 0 ? (
                    communications.map((entry) => {
                      const CategoryIcon = getCategoryIcon(entry.category);

                      return (
                        <div
                          key={entry._id || `${entry.subject}-${entry.date}`}
                          className="rounded-[24px] border border-ink-100 bg-white/85 p-5"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-700">
                                <CategoryIcon className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-base font-semibold text-ink-900">{entry.subject}</p>
                                <p className="mt-1 text-sm text-ink-500">
                                  {entry.category} · {formatDate(entry.date)}
                                </p>
                                {entry.notes && (
                                  <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                                    {entry.notes}
                                  </p>
                                )}

                                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                                  <span className="inline-flex items-center gap-1">
                                    <UserCircleIcon className="h-4 w-4" />
                                    {entry.author || "Tenant"}
                                  </span>
                                  {entry.attachmentUrl && (
                                    <a
                                      href={entry.attachmentUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-verdigris-700"
                                    >
                                      <DocumentTextIcon className="h-4 w-4" />
                                      Attachment
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${getRequestStatusClassName(
                                entry.status
                              )}`}
                            >
                              {entry.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                      No requests have been submitted yet.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="section-card flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-50 text-ink-700">
                <UserCircleIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">Primary contact</p>
                <p className="mt-1 text-sm leading-6 text-ink-500">
                  {leaseData.tenant?.email || "Email unavailable"}
                </p>
                <p className="text-sm leading-6 text-ink-500">
                  {leaseData.tenant?.phone || "Phone unavailable"}
                </p>
              </div>
            </div>

            <div className="section-card flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sand-100 text-sand-700">
                <PhoneIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">Need direct help?</p>
                <p className="mt-1 text-sm leading-6 text-ink-500">
                  Use the Requests tab for the fastest tracked response from the property team.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default TenantDashboard;
