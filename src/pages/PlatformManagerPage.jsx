import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  InboxStackIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  TrashIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import {
  addPlatformManagerSupportNote,
  deletePlatformManagerSupportNote,
  deletePlatformManagerUser,
  exportPlatformManagerUsers,
  getPlatformManagerSupportRequests,
  getPlatformManagerUserDetail,
  getPlatformManagerUsers,
  revokePlatformManagerUserSessions,
  sendPlatformManagerPasswordReset,
  setPlatformManagerAccountStatus,
  setPlatformManagerSubscriptionOverride,
  startPlatformManagerImpersonation,
  syncPlatformManagerUserBilling,
  updatePlatformManagerSupportRequest,
  updatePlatformManagerUserEmail,
} from "../utils/api";
import { formatStorageBytes } from "../utils/documentStorage";

const FILTERS = [
  { value: "all", label: "All users" },
  { value: "pro", label: "Pro" },
  { value: "free", label: "Free" },
  { value: "override", label: "Overrides" },
  { value: "override_pro", label: "Override Pro" },
  { value: "override_free", label: "Override Free" },
  { value: "suspended", label: "Suspended" },
  { value: "billing_issue", label: "Billing issues" },
  { value: "paying", label: "Paying" },
  { value: "google", label: "Google" },
  { value: "marketing_opt_in", label: "Marketing opt-in" },
  { value: "marketing_opt_out", label: "No marketing opt-in" },
  { value: "profile_incomplete", label: "Profile incomplete" },
  { value: "high_usage", label: "High usage" },
  { value: "recent", label: "Recent signups" },
  { value: "inactive", label: "Inactive 30d" },
];

const SUPPORT_REQUEST_FILTERS = [
  { value: "all", label: "All requests" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

const supportRequestTypeLabels = {
  general_question: "General question",
  report_issue: "Issue report",
  account_help: "Account help",
  billing_help: "Billing help",
  feature_request: "Feature request",
};

const statusStyles = {
  active: "bg-verdigris-50 text-verdigris-700",
  suspended: "bg-clay-50 text-clay-700",
};

const planStyles = {
  pro: "bg-ink-900 text-white",
  free: "bg-sand-100 text-ink-700",
};

const sessionStatusStyles = {
  active: "bg-verdigris-50 text-verdigris-700",
  expired: "bg-sand-100 text-ink-700",
  revoked: "bg-clay-50 text-clay-700",
};

const supportRequestStatusStyles = {
  new: "bg-clay-50 text-clay-700",
  in_progress: "bg-sand-100 text-ink-700",
  resolved: "bg-verdigris-50 text-verdigris-700",
};

const summaryCards = (stats) => [
  {
    label: "Total users",
    value: stats.totalUsers,
    detail: "Accounts currently visible to the platform owner.",
  },
  {
    label: "Pro access",
    value: stats.proUsers,
    detail: "Users with effective Pro access, including temporary grants.",
  },
  {
    label: "Suspended",
    value: stats.suspendedUsers,
    detail: "Accounts blocked from logging in until reactivated.",
  },
  {
    label: "Billing issues",
    value: stats.billingIssueUsers,
    detail: "Users whose Stripe-backed status needs attention.",
  },
  {
    label: "Marketing opt-ins",
    value: stats.marketingOptInUsers,
    detail: "Accounts currently open to promotional email, calls, or texts.",
  },
];

const getInitials = (name = "", email = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return String(email).slice(0, 2).toUpperCase() || "FL";
};

const formatDateTime = (value, fallback = "Unknown") =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : fallback;

const formatDate = (value, fallback = "Unknown") =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : fallback;

const formatSupportRequestStatus = (status) =>
  status === "in_progress" ? "In progress" : status === "resolved" ? "Resolved" : "New";

const truncateText = (value, maxLength = 280) => {
  const normalized = String(value || "").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
};

const toDateInputValue = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const describeSubscription = (subscription) => {
  if (subscription.override === "pro") {
    return subscription.overrideExpiresAt
      ? `Complimentary Pro is active until ${formatDate(subscription.overrideExpiresAt)}.`
      : "Complimentary Pro override is active.";
  }

  if (subscription.override === "free") {
    return subscription.overrideExpiresAt
      ? `Forced free access is active until ${formatDate(subscription.overrideExpiresAt)}.`
      : "Pro access is manually disabled for this account.";
  }

  if (subscription.source === "stripe" && subscription.plan === "pro") {
    return "Access is coming from the user’s Stripe subscription.";
  }

  return "Access follows the normal billing state for this account.";
};

const describeAuthAccess = (authProviders) => authProviders?.label || "Password";

const describeConsentState = (isAllowed, when) => {
  if (!isAllowed) {
    return "No";
  }

  return when ? `Yes, ${formatDate(when)}` : "Yes";
};

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const matchesFilter = (listedUser, filter) => {
  if (filter === "pro") return listedUser.subscription.plan === "pro";
  if (filter === "free") return listedUser.subscription.plan === "free";
  if (filter === "override") return listedUser.subscription.override !== "none";
  if (filter === "override_pro") return listedUser.subscription.override === "pro";
  if (filter === "override_free") return listedUser.subscription.override === "free";
  if (filter === "suspended") return listedUser.accountStatus === "suspended";
  if (filter === "billing_issue") return listedUser.hasBillingIssue;
  if (filter === "paying") return listedUser.subscription.source === "stripe";
  if (filter === "google") return Boolean(listedUser.authProviders?.google);
  if (filter === "marketing_opt_in") return Boolean(listedUser.consent?.marketingOptIn);
  if (filter === "marketing_opt_out") return !listedUser.consent?.marketingOptIn;
  if (filter === "profile_incomplete") return Boolean(listedUser.profileCompletionRequired);
  if (filter === "high_usage") return listedUser.isHighUsage;
  if (filter === "recent") return listedUser.isRecentSignup;
  if (filter === "inactive") return !listedUser.isRecentlyActive;
  return true;
};

const SummaryCard = ({ label, value, detail }) => (
  <div className="metric-tile p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-4 text-3xl font-semibold text-ink-900">{value}</p>
    <p className="mt-3 text-sm leading-6 text-ink-500">{detail}</p>
  </div>
);

const EmptyDetailState = () => (
  <div className="section-card sticky top-24 p-6">
    <span className="eyebrow">User detail</span>
    <h3 className="mt-4 text-2xl font-semibold text-ink-900">Choose a user to manage</h3>
    <p className="mt-3 text-sm leading-6 text-ink-500">
      The detail panel gives you session control, temporary access overrides, support notes,
      usage history, billing sync, and the audit trail for that account.
    </p>
  </div>
);

const DetailBlock = ({ title, subtitle, children, action = null }) => (
  <section className="rounded-[24px] border border-ink-100 bg-white px-5 py-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h4 className="text-base font-semibold text-ink-900">{title}</h4>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-ink-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

const PlatformManagerPage = () => {
  const navigate = useNavigate();
  const { user, startImpersonation } = useAuth();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    proUsers: 0,
    freeUsers: 0,
    overriddenUsers: 0,
    billingIssueUsers: 0,
    marketingOptInUsers: 0,
    profileCompletionUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [supportQuery, setSupportQuery] = useState("");
  const [supportStatus, setSupportStatus] = useState("all");
  const [supportRequests, setSupportRequests] = useState([]);
  const [supportStats, setSupportStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState("");
  const [supportBusyKey, setSupportBusyKey] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailBusyKey, setDetailBusyKey] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [overrideForm, setOverrideForm] = useState({
    overridePlan: "none",
    expiresAt: "",
    reason: "",
  });
  const [emailForm, setEmailForm] = useState({
    email: "",
    reason: "",
  });

  const loadUsers = useCallback(async (activeQuery = "") => {
    try {
      setLoading(true);
      setError("");
      const data = await getPlatformManagerUsers(activeQuery);
      setUsers(data.users || []);
      setStats(data.stats || {});
    } catch (loadError) {
      setError(loadError.message || "Failed to load platform users.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSupportRequests = useCallback(async (activeQuery = "", activeStatus = "all") => {
    try {
      setSupportLoading(true);
      setSupportError("");
      const data = await getPlatformManagerSupportRequests({
        query: activeQuery,
        status: activeStatus,
      });
      setSupportRequests(data.requests || []);
      setSupportStats(
        data.stats || {
          total: 0,
          new: 0,
          inProgress: 0,
          resolved: 0,
        }
      );
    } catch (loadError) {
      setSupportError(loadError.message || "Failed to load support requests.");
    } finally {
      setSupportLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (userId) => {
    if (!userId) {
      setDetail(null);
      setDetailError("");
      return;
    }

    try {
      setDetailLoading(true);
      setDetailError("");
      const data = await getPlatformManagerUserDetail(userId);
      setDetail(data);
      setOverrideForm({
        overridePlan: data.user?.subscription?.override || "none",
        expiresAt: toDateInputValue(data.user?.subscription?.overrideExpiresAt),
        reason: data.user?.subscription?.overrideReason || "",
      });
      setEmailForm({
        email: data.user?.email || "",
        reason: "",
      });
    } catch (loadError) {
      setDetail(null);
      setDetailError(loadError.message || "Failed to load user detail.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadUsers(query);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadUsers, query]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadSupportRequests(supportQuery, supportStatus);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadSupportRequests, supportQuery, supportStatus]);

  useEffect(() => {
    if (selectedUserId) {
      loadDetail(selectedUserId);
    }
  }, [loadDetail, selectedUserId]);

  const filteredUsers = useMemo(() => {
    return users.filter((listedUser) => matchesFilter(listedUser, filter));
  }, [filter, users]);

  const refreshSelectedUser = useCallback(async () => {
    if (selectedUserId) {
      await loadDetail(selectedUserId);
    }
  }, [loadDetail, selectedUserId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadUsers(query), loadSupportRequests(supportQuery, supportStatus)]);
    await refreshSelectedUser();
  }, [loadSupportRequests, loadUsers, query, refreshSelectedUser, supportQuery, supportStatus]);

  const runListAction = async (key, action, successMessage, options = {}) => {
    try {
      setBusyKey(key);
      await action();
      await loadUsers(query);

      if (options.refreshSelected !== false) {
        await refreshSelectedUser();
      }

      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (actionError) {
      toast.error(actionError.message || "Action failed.");
    } finally {
      setBusyKey("");
    }
  };

  const runDetailAction = async (key, action, successMessage, options = {}) => {
    try {
      setDetailBusyKey(key);
      await action();
      await loadUsers(query);

      if (options.clearSelection) {
        setSelectedUserId("");
        setDetail(null);
      } else {
        await refreshSelectedUser();
      }

      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (actionError) {
      toast.error(actionError.message || "Action failed.");
    } finally {
      setDetailBusyKey("");
    }
  };

  const runSupportAction = async (key, action, successMessage) => {
    try {
      setSupportBusyKey(key);
      await action();
      await loadSupportRequests(supportQuery, supportStatus);

      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (actionError) {
      toast.error(actionError.message || "Action failed.");
    } finally {
      setSupportBusyKey("");
    }
  };

  const handleImpersonation = async (targetUser) => {
    const reason = window.prompt(`Why are you opening ${targetUser.email}'s workspace?`);
    if (!reason || reason.trim().length < 3) {
      return;
    }

    try {
      const busyId = `impersonate-${targetUser.id}`;
      setBusyKey(busyId);
      setDetailBusyKey(busyId);
      const data = await startPlatformManagerImpersonation(targetUser.id, reason.trim());
      startImpersonation(data.token);
      navigate("/dashboard");
      toast.success(`Now viewing ${targetUser.name}'s workspace.`);
    } catch (actionError) {
      toast.error(actionError.message || "Failed to start impersonation.");
    } finally {
      setBusyKey("");
      setDetailBusyKey("");
    }
  };

  const handleDelete = (targetUser) => {
    if (
      !window.confirm(
        `Delete ${targetUser.email}? This only works for empty accounts with no owned records.`
      )
    ) {
      return;
    }

    runListAction(
      `delete-${targetUser.id}`,
      () => deletePlatformManagerUser(targetUser.id),
      "User deleted.",
      { refreshSelected: selectedUserId === targetUser.id }
    );

    if (selectedUserId === targetUser.id) {
      setSelectedUserId("");
      setDetail(null);
    }
  };

  const handleExport = async () => {
    try {
      setBusyKey("export");
      const blob = await exportPlatformManagerUsers(query);
      downloadBlob(blob, "platform-users.csv");
    } catch (exportError) {
      toast.error(exportError.message || "Failed to export users.");
    } finally {
      setBusyKey("");
    }
  };

  const handleOverrideSubmit = async (event) => {
    event.preventDefault();
    if (!detail?.user?.id) {
      return;
    }

    const payload = {
      overridePlan: overrideForm.overridePlan,
      expiresAt: overrideForm.overridePlan === "none" ? null : overrideForm.expiresAt || null,
      reason: overrideForm.reason,
    };

    await runDetailAction(
      "save-override",
      () => setPlatformManagerSubscriptionOverride(detail.user.id, payload),
      payload.overridePlan === "none" ? "Billing override cleared." : "Access override saved."
    );
  };

  const handleAddNote = async () => {
    const body = noteDraft.trim();
    if (!body || !detail?.user?.id) {
      return;
    }

    await runDetailAction(
      "add-note",
      () => addPlatformManagerSupportNote(detail.user.id, body),
      "Support note saved."
    );
    setNoteDraft("");
  };

  const handlePasswordReset = async () => {
    if (!selectedUser?.id) {
      return;
    }

    const reason = window.prompt(`Why are you sending a password reset to ${selectedUser.email}?`);
    if (!reason || reason.trim().length < 3) {
      return;
    }

    try {
      setDetailBusyKey("password-reset");
      const data = await sendPlatformManagerPasswordReset(selectedUser.id, reason.trim());
      await loadUsers(query);
      await refreshSelectedUser();
      toast.success(data.message || "Password reset prepared.");

      if (!data.deliveredByEmail && data.resetUrl) {
        window.prompt("Copy this password reset link for the user:", data.resetUrl);
      }
    } catch (actionError) {
      toast.error(actionError.message || "Failed to create password reset.");
    } finally {
      setDetailBusyKey("");
    }
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    if (!selectedUser?.id) {
      return;
    }

    await runDetailAction(
      "save-email",
      () =>
        updatePlatformManagerUserEmail(selectedUser.id, {
          email: emailForm.email,
          reason: emailForm.reason,
        }),
      "User email updated."
    );
  };

  const selectedUser = detail?.user || filteredUsers.find((entry) => entry.id === selectedUserId) || null;

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(13,23,36,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <span className="eyebrow">Owner-only command room</span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900">
              Platform support, billing control, and audit-ready admin tools.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">
              From here you can review users, step into their workspace, issue temporary Pro
              access, revoke sessions, sync Stripe, leave support notes, and see the audit trail
              behind every change.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={refreshAll}
                className="secondary-action"
                disabled={busyKey !== "" || detailBusyKey !== ""}
              >
                <ArrowPathIcon className="mr-2 h-5 w-5" />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="secondary-action"
                disabled={busyKey !== "" || detailBusyKey !== ""}
              >
                <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="section-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Security context
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink-900">
                  {user?.email || "Platform manager"}
                </h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-white">
                <ShieldCheckIcon className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                <span className="text-sm font-medium text-ink-600">Owner-locked access</span>
                <span className="text-sm font-semibold text-ink-900">Server enforced</span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-sand-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Session controls</span>
                <span className="text-sm font-semibold text-ink-900">Revocable</span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-clay-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Audit trail</span>
                <span className="text-sm font-semibold text-ink-900">Persistent logs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards(stats).map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </section>

      <section className="section-card p-6 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Support inbox</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Website help requests</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
              Review questions and issue reports submitted through the public Help page, then triage
              them without leaving the platform manager.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] bg-clay-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">New</p>
              <p className="mt-2 text-2xl font-semibold text-ink-900">{supportStats.new}</p>
            </div>
            <div className="rounded-[18px] bg-sand-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                In progress
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink-900">{supportStats.inProgress}</p>
            </div>
            <div className="rounded-[18px] bg-verdigris-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                Resolved
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink-900">{supportStats.resolved}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-[520px]">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={supportQuery}
              onChange={(event) => setSupportQuery(event.target.value)}
              placeholder="Search support requests by name, email, subject, or message"
              className="auth-input pl-11"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {SUPPORT_REQUEST_FILTERS.map((filterOption) => (
              <button
                key={filterOption.value}
                type="button"
                onClick={() => setSupportStatus(filterOption.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  supportStatus === filterOption.value
                    ? "bg-ink-900 text-white"
                    : "bg-sand-50 text-ink-600 hover:bg-sand-100"
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {supportLoading ? (
          <div className="mt-8 flex items-center justify-center px-6 py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-verdigris-100 border-t-verdigris-500" />
          </div>
        ) : null}

        {!supportLoading && supportError ? (
          <div className="mt-6 rounded-[24px] border border-clay-200 bg-clay-50 px-6 py-10 text-center text-clay-700">
            {supportError}
          </div>
        ) : null}

        {!supportLoading && !supportError && supportRequests.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-ink-200 bg-sand-50 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-ink-900">No support requests in this view</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              New Help Center submissions will appear here as users send them in.
            </p>
          </div>
        ) : null}

        {!supportLoading && !supportError && supportRequests.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {supportRequests.map((request) => {
              const requestBusy = supportBusyKey === `support-${request.id}`;

              return (
                <article
                  key={request.id}
                  className="rounded-[26px] border border-ink-100 bg-white px-5 py-5"
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-900 via-ink-700 to-verdigris-600 text-white">
                          <InboxStackIcon className="h-7 w-7" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-xl font-semibold text-ink-900">{request.subject}</h4>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                supportRequestStatusStyles[request.status] ||
                                supportRequestStatusStyles.new
                              }`}
                            >
                              {formatSupportRequestStatus(request.status)}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-100">
                              {supportRequestTypeLabels[request.requestType] || "Support request"}
                            </span>
                            <span className="rounded-full bg-sand-50 px-3 py-1 text-xs font-semibold text-ink-700">
                              {request.referenceCode}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-500">
                            <span className="font-medium text-ink-800">{request.name}</span>
                            <a
                              href={`mailto:${request.email}`}
                              className="inline-flex items-center gap-1 text-verdigris-700"
                            >
                              <EnvelopeIcon className="h-4 w-4" />
                              {request.email}
                            </a>
                            {request.companyName ? <span>{request.companyName}</span> : null}
                          </div>

                          <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-400">
                            Submitted {formatDateTime(request.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        {request.matchedUser ? (
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(request.matchedUser.id)}
                            className="secondary-action"
                          >
                            <DocumentTextIcon className="mr-2 h-5 w-5" />
                            Open matched user
                          </button>
                        ) : null}

                        {request.status !== "in_progress" ? (
                          <button
                            type="button"
                            onClick={() =>
                              runSupportAction(
                                `support-${request.id}`,
                                () =>
                                  updatePlatformManagerSupportRequest(request.id, {
                                    status: "in_progress",
                                  }),
                                "Support request marked in progress."
                              )
                            }
                            disabled={requestBusy}
                            className="secondary-action"
                          >
                            <ArrowPathIcon className="mr-2 h-5 w-5" />
                            {requestBusy ? "Saving..." : "Mark in progress"}
                          </button>
                        ) : null}

                        {request.status !== "resolved" ? (
                          <button
                            type="button"
                            onClick={() =>
                              runSupportAction(
                                `support-${request.id}`,
                                () =>
                                  updatePlatformManagerSupportRequest(request.id, {
                                    status: "resolved",
                                  }),
                                "Support request marked resolved."
                              )
                            }
                            disabled={requestBusy}
                            className="primary-action"
                          >
                            <CheckCircleIcon className="mr-2 h-5 w-5" />
                            {requestBusy ? "Saving..." : "Resolve"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              runSupportAction(
                                `support-${request.id}`,
                                () =>
                                  updatePlatformManagerSupportRequest(request.id, {
                                    status: "new",
                                  }),
                                "Support request reopened."
                              )
                            }
                            disabled={requestBusy}
                            className="secondary-action"
                          >
                            <ArrowUturnLeftIcon className="mr-2 h-5 w-5" />
                            {requestBusy ? "Saving..." : "Reopen"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-ink-100 bg-white px-4 py-4">
                      <p className="text-sm leading-7 text-ink-600">
                        {truncateText(request.message, 420)}
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                      <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                          Source
                        </p>
                        <p className="mt-2 text-sm font-semibold text-ink-900">
                          {request.source || "website_help_center"}
                        </p>
                      </div>

                      <div className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                          Page or feature
                        </p>
                        <p className="mt-2 break-all text-sm font-semibold text-ink-900">
                          {request.pageUrl || "Not provided"}
                        </p>
                      </div>

                      <div className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                          Matched account
                        </p>
                        <p className="mt-2 text-sm font-semibold text-ink-900">
                          {request.matchedUser
                            ? `${request.matchedUser.name} • ${request.matchedUser.subscriptionPlan}`
                            : "No matching account"}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="eyebrow">User roster</span>
              <h3 className="mt-4 text-2xl font-semibold text-ink-900">Workspace accounts</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Search by name, email, company, or phone, then open the detail panel to manage
                billing, consent, sessions, notes, and support actions.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 lg:max-w-[620px]">
              <label className="relative block">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, email, company, or phone"
                  className="auth-input pl-11"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {FILTERS.map((filterOption) => (
                  <button
                    key={filterOption.value}
                    type="button"
                    onClick={() => setFilter(filterOption.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      filter === filterOption.value
                        ? "bg-ink-900 text-white"
                        : "bg-sand-50 text-ink-600 hover:bg-sand-100"
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 flex items-center justify-center px-6 py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-verdigris-100 border-t-verdigris-500" />
            </div>
          ) : null}

          {!loading && error ? (
            <div className="mt-6 rounded-[24px] border border-clay-200 bg-clay-50 px-6 py-10 text-center text-clay-700">
              {error}
            </div>
          ) : null}

          {!loading && !error && filteredUsers.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-ink-200 bg-sand-50 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-ink-900">No users match this view</p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Try another filter or adjust the search to pull in the account you want.
              </p>
            </div>
          ) : null}

          {!loading && !error && filteredUsers.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {filteredUsers.map((listedUser) => {
                const statusBusy = busyKey === `status-${listedUser.id}`;
                const accessBusy = busyKey === `access-${listedUser.id}`;
                const deleteBusy = busyKey === `delete-${listedUser.id}`;
                const impersonateBusy = busyKey === `impersonate-${listedUser.id}`;
                const isSelected = selectedUserId === listedUser.id;

                return (
                  <article
                    key={listedUser.id}
                    className={`rounded-[28px] border px-5 py-5 transition ${
                      isSelected
                        ? "border-ink-900 bg-white shadow-soft"
                        : "border-ink-100 bg-white hover:border-ink-200"
                    }`}
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-900 via-ink-700 to-verdigris-600 text-base font-bold text-white">
                            {getInitials(listedUser.name, listedUser.email)}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xl font-semibold text-ink-900">{listedUser.name}</h4>
                              {listedUser.isCurrentPlatformManager ? (
                                <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700">
                                  You
                                </span>
                              ) : null}
                              {listedUser.hasBillingIssue ? (
                                <span className="rounded-full bg-clay-50 px-3 py-1 text-xs font-semibold text-clay-700">
                                  Billing issue
                                </span>
                              ) : null}
                              {listedUser.profileCompletionRequired ? (
                                <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-700">
                                  Profile incomplete
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-ink-500">{listedUser.email}</p>
                            <div className="mt-2 flex flex-wrap gap-3 text-sm text-ink-500">
                              <span>{listedUser.companyName || "No company"}</span>
                              <span>{listedUser.phoneNumber || "No phone"}</span>
                            </div>
                            <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-400">
                              Joined {formatDate(listedUser.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              statusStyles[listedUser.accountStatus] || statusStyles.active
                            }`}
                          >
                            {listedUser.accountStatus}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              planStyles[listedUser.subscription.plan] || planStyles.free
                            }`}
                          >
                            {listedUser.subscription.plan === "pro" ? "Pro" : "Free"}
                          </span>
                          {listedUser.subscription.override !== "none" ? (
                            <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-700">
                              Override: {listedUser.subscription.override}
                            </span>
                          ) : null}
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-100">
                            {describeAuthAccess(listedUser.authProviders)}
                          </span>
                          {listedUser.consent?.marketingOptIn ? (
                            <span className="rounded-full bg-verdigris-50 px-3 py-1 text-xs font-semibold text-verdigris-700">
                              Marketing ok
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                            Leads
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-ink-900">
                            {listedUser.counts.leads}
                          </p>
                        </div>
                        <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                            Investments
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-ink-900">
                            {listedUser.counts.investments}
                          </p>
                        </div>
                        <div className="rounded-[18px] bg-clay-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                            Last login
                          </p>
                          <p className="mt-2 text-sm font-semibold text-ink-900">
                            {formatDateTime(listedUser.lastLoginAt, "Never")}
                          </p>
                        </div>
                        <div className="rounded-[18px] bg-verdigris-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                            Monthly usage
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-ink-900">{listedUser.monthlyUsageCount}</p>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-ink-100 bg-white px-4 py-4">
                        <div className="flex items-start gap-3">
                          <SparklesIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-verdigris-600" />
                          <div>
                            <p className="text-sm font-semibold text-ink-900">Access state</p>
                            <p className="mt-1 text-sm leading-6 text-ink-500">
                              {describeSubscription(listedUser.subscription)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(listedUser.id)}
                          className={isSelected ? "primary-action" : "secondary-action"}
                        >
                          <DocumentTextIcon className="mr-2 h-5 w-5" />
                          {isSelected ? "Viewing details" : "Manage user"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleImpersonation(listedUser)}
                          disabled={
                            listedUser.isCurrentPlatformManager ||
                            listedUser.accountStatus === "suspended" ||
                            impersonateBusy
                          }
                          className="secondary-action"
                        >
                          <EyeIcon className="mr-2 h-5 w-5" />
                          {impersonateBusy ? "Opening..." : "View as user"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            runListAction(
                              `access-${listedUser.id}`,
                              () =>
                                setPlatformManagerSubscriptionOverride(listedUser.id, {
                                  overridePlan:
                                    listedUser.subscription.plan === "pro" ? "free" : "pro",
                                }),
                              listedUser.subscription.plan === "pro"
                                ? "Pro access removed."
                                : "Complimentary Pro access granted."
                            )
                          }
                          disabled={listedUser.isCurrentPlatformManager || accessBusy}
                          className="secondary-action"
                        >
                          {listedUser.subscription.plan === "pro" ? (
                            <UserMinusIcon className="mr-2 h-5 w-5" />
                          ) : (
                            <UserPlusIcon className="mr-2 h-5 w-5" />
                          )}
                          {accessBusy
                            ? "Saving..."
                            : listedUser.subscription.plan === "pro"
                              ? "Force free"
                              : "Grant Pro"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            runListAction(
                              `status-${listedUser.id}`,
                              () =>
                                setPlatformManagerAccountStatus(
                                  listedUser.id,
                                  listedUser.accountStatus === "suspended" ? "active" : "suspended"
                                ),
                              listedUser.accountStatus === "suspended"
                                ? "User reactivated."
                                : "User suspended."
                            )
                          }
                          disabled={listedUser.isCurrentPlatformManager || statusBusy}
                          className="secondary-action"
                        >
                          {listedUser.accountStatus === "suspended" ? (
                            <UserPlusIcon className="mr-2 h-5 w-5" />
                          ) : (
                            <UserMinusIcon className="mr-2 h-5 w-5" />
                          )}
                          {statusBusy
                            ? "Saving..."
                            : listedUser.accountStatus === "suspended"
                              ? "Reactivate"
                              : "Suspend"}
                        </button>

                        {listedUser.canDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(listedUser)}
                            disabled={listedUser.isCurrentPlatformManager || deleteBusy}
                            className="secondary-action !border-clay-200 !text-clay-700"
                          >
                            <TrashIcon className="mr-2 h-5 w-5" />
                            {deleteBusy ? "Deleting..." : "Delete empty account"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>

        {!selectedUserId ? <EmptyDetailState /> : null}

        {selectedUserId ? (
          <aside className="section-card sticky top-24 self-start p-6">
            {detailLoading ? (
              <div className="flex items-center justify-center px-4 py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-verdigris-100 border-t-verdigris-500" />
              </div>
            ) : null}

            {!detailLoading && detailError ? (
              <div className="rounded-[20px] border border-clay-200 bg-clay-50 px-5 py-6 text-sm text-clay-700">
                {detailError}
              </div>
            ) : null}

            {!detailLoading && !detailError && selectedUser ? (
              <div className="space-y-5">
                <section>
                  <span className="eyebrow">User detail</span>
                  <div className="mt-4 flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-900 via-ink-700 to-verdigris-600 text-lg font-bold text-white">
                      {getInitials(selectedUser.name, selectedUser.email)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-ink-900">{selectedUser.name}</h3>
                      <p className="mt-1 text-sm text-ink-500">{selectedUser.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[selectedUser.accountStatus] || statusStyles.active
                          }`}
                        >
                          {selectedUser.accountStatus}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            planStyles[selectedUser.subscription.plan] || planStyles.free
                          }`}
                        >
                          {selectedUser.subscription.plan === "pro" ? "Pro" : "Free"}
                        </span>
                        {selectedUser.hasBillingIssue ? (
                          <span className="rounded-full bg-clay-50 px-3 py-1 text-xs font-semibold text-clay-700">
                            Billing issue
                          </span>
                        ) : null}
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-100">
                          {describeAuthAccess(selectedUser.authProviders)}
                        </span>
                        {selectedUser.consent?.marketingOptIn ? (
                          <span className="rounded-full bg-verdigris-50 px-3 py-1 text-xs font-semibold text-verdigris-700">
                            Marketing opt-in
                          </span>
                        ) : null}
                        {selectedUser.profileCompletionRequired ? (
                          <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-700">
                            Profile incomplete
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => handleImpersonation(selectedUser)}
                    disabled={
                      selectedUser.isCurrentPlatformManager ||
                      selectedUser.accountStatus === "suspended" ||
                      detailBusyKey === `impersonate-${selectedUser.id}`
                    }
                    className="primary-action w-full justify-center"
                  >
                    <EyeIcon className="mr-2 h-5 w-5" />
                    View as user
                  </button>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        runDetailAction(
                          "sync-billing",
                          () => syncPlatformManagerUserBilling(selectedUser.id),
                          "Billing synced."
                        )
                      }
                      disabled={!detail?.billing?.canSync || detailBusyKey !== ""}
                      className="secondary-action justify-center"
                    >
                      <ArrowPathIcon className="mr-2 h-5 w-5" />
                      Sync billing
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        runDetailAction(
                          "revoke-sessions",
                          () => revokePlatformManagerUserSessions(selectedUser.id),
                          "All active sessions revoked."
                        )
                      }
                      disabled={selectedUser.isCurrentPlatformManager || detailBusyKey !== ""}
                      className="secondary-action justify-center"
                    >
                      <ShieldExclamationIcon className="mr-2 h-5 w-5" />
                      Revoke sessions
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={detailBusyKey !== ""}
                      className="secondary-action justify-center"
                    >
                      <ShieldCheckIcon className="mr-2 h-5 w-5" />
                      Send password reset
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        runDetailAction(
                          "clear-override",
                          () =>
                            setPlatformManagerSubscriptionOverride(selectedUser.id, {
                              overridePlan: "none",
                            }),
                          "Billing override cleared."
                        )
                      }
                      disabled={selectedUser.subscription.override === "none" || detailBusyKey !== ""}
                      className="secondary-action justify-center"
                    >
                      <ArrowPathIcon className="mr-2 h-5 w-5" />
                      Clear override
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        runDetailAction(
                          "toggle-status",
                          () =>
                            setPlatformManagerAccountStatus(
                              selectedUser.id,
                              selectedUser.accountStatus === "suspended" ? "active" : "suspended"
                            ),
                          selectedUser.accountStatus === "suspended"
                            ? "User reactivated."
                            : "User suspended."
                        )
                      }
                      disabled={selectedUser.isCurrentPlatformManager || detailBusyKey !== ""}
                      className="secondary-action justify-center"
                    >
                      {selectedUser.accountStatus === "suspended" ? (
                        <UserPlusIcon className="mr-2 h-5 w-5" />
                      ) : (
                        <UserMinusIcon className="mr-2 h-5 w-5" />
                      )}
                      {selectedUser.accountStatus === "suspended" ? "Reactivate" : "Suspend"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete ${selectedUser.email}? This only works for empty accounts with no owned records.`
                          )
                        ) {
                          runDetailAction(
                            "delete-user",
                            () => deletePlatformManagerUser(selectedUser.id),
                            "User deleted.",
                            { clearSelection: true }
                          );
                        }
                      }}
                      disabled={!selectedUser.canDelete || selectedUser.isCurrentPlatformManager || detailBusyKey !== ""}
                      className="secondary-action justify-center !border-clay-200 !text-clay-700"
                    >
                      <TrashIcon className="mr-2 h-5 w-5" />
                      Delete empty account
                    </button>
                  </div>
                </div>

                <DetailBlock
                  title="Profile and consent"
                  subtitle="Signup details, login method, and communication permissions recorded for this account."
                >
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                      <span className="text-sm font-medium text-ink-600">First / last name</span>
                      <span className="text-sm font-semibold text-ink-900">
                        {selectedUser.firstName || "Not set"} {selectedUser.lastName || ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                      <span className="text-sm font-medium text-ink-600">Company</span>
                      <span className="text-sm font-semibold text-ink-900">
                        {selectedUser.companyName || "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                      <span className="text-sm font-medium text-ink-600">Phone</span>
                      <span className="text-sm font-semibold text-ink-900">
                        {selectedUser.phoneNumber || "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] bg-sand-50 px-4 py-3">
                      <span className="text-sm font-medium text-ink-600">Sign-in access</span>
                      <span className="text-sm font-semibold text-ink-900">
                        {describeAuthAccess(selectedUser.authProviders)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                      <span className="text-sm font-medium text-ink-600">Terms accepted</span>
                      <span className="text-sm font-semibold text-ink-900">
                        {describeConsentState(
                          selectedUser.consent?.termsAccepted,
                          selectedUser.consent?.termsAcceptedAt
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                      <span className="text-sm font-medium text-ink-600">Marketing outreach</span>
                      <span className="text-sm font-semibold text-ink-900">
                        {describeConsentState(
                          selectedUser.consent?.marketingOptIn,
                          selectedUser.consent?.marketingConsentAcceptedAt
                        )}
                      </span>
                    </div>
                  </div>
                </DetailBlock>

                <DetailBlock
                  title="Identity support"
                  subtitle="Update the account email or issue a password reset for support handoff."
                >
                  <form className="space-y-4" onSubmit={handleEmailSubmit}>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                        Account email
                      </span>
                      <input
                        type="email"
                        value={emailForm.email}
                        onChange={(event) =>
                          setEmailForm((previous) => ({
                            ...previous,
                            email: event.target.value,
                          }))
                        }
                        className="auth-input mt-2"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                        Reason
                      </span>
                      <textarea
                        value={emailForm.reason}
                        onChange={(event) =>
                          setEmailForm((previous) => ({
                            ...previous,
                            reason: event.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Why are you changing the email?"
                        className="auth-input mt-2 min-h-[96px]"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={detailBusyKey !== ""}
                      className="secondary-action w-full justify-center"
                    >
                      {detailBusyKey === "save-email" ? "Saving..." : "Update email"}
                    </button>
                  </form>
                </DetailBlock>

                <DetailBlock
                  title="Temporary access"
                  subtitle="Grant or remove an override, optionally with an expiry date and support reason."
                >
                  <form className="space-y-4" onSubmit={handleOverrideSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                          Override
                        </span>
                        <select
                          value={overrideForm.overridePlan}
                          onChange={(event) =>
                            setOverrideForm((previous) => ({
                              ...previous,
                              overridePlan: event.target.value,
                            }))
                          }
                          className="auth-input mt-2"
                        >
                          <option value="none">No override</option>
                          <option value="pro">Grant Pro</option>
                          <option value="free">Force Free</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                          Expires
                        </span>
                        <input
                          type="date"
                          value={overrideForm.expiresAt}
                          onChange={(event) =>
                            setOverrideForm((previous) => ({
                              ...previous,
                              expiresAt: event.target.value,
                            }))
                          }
                          disabled={overrideForm.overridePlan === "none"}
                          className="auth-input mt-2"
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                        Reason
                      </span>
                      <textarea
                        value={overrideForm.reason}
                        onChange={(event) =>
                          setOverrideForm((previous) => ({
                            ...previous,
                            reason: event.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Why are you changing access for this account?"
                        className="auth-input mt-2 min-h-[100px]"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={detailBusyKey !== ""}
                      className="primary-action w-full justify-center"
                    >
                      {detailBusyKey === "save-override" ? "Saving..." : "Save access rule"}
                    </button>
                  </form>
                </DetailBlock>

                <DetailBlock
                  title="Billing snapshot"
                  subtitle="Current Stripe-linked state, renewal timing, and sync health."
                >
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between rounded-[18px] bg-sand-50 px-4 py-3">
                      <span className="text-sm font-medium text-ink-600">Plan / status</span>
                      <span className="text-sm font-semibold text-ink-900">
                        {detail?.billing?.subscriptionPlan || "free"} / {detail?.billing?.subscriptionStatus || "inactive"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                      <span className="text-sm font-medium text-ink-600">Source</span>
                      <span className="text-sm font-semibold text-ink-900">
                        {detail?.billing?.subscriptionSource || "none"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                      <span className="text-sm font-medium text-ink-600">Renews / ends</span>
                      <span className="text-sm font-semibold text-ink-900">
                        {formatDateTime(detail?.billing?.subscriptionCurrentPeriodEnd, "Not set")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                      <span className="text-sm font-medium text-ink-600">Last billing sync</span>
                      <span className="text-sm font-semibold text-ink-900">
                        {formatDateTime(detail?.billing?.subscriptionLastSyncedAt, "Never")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                      <span className="text-sm font-medium text-ink-600">Cancel at period end</span>
                      <span className="text-sm font-semibold text-ink-900">
                        {detail?.billing?.cancelAtPeriodEnd ? "Yes" : "No"}
                      </span>
                    </div>
                    {detail?.billing?.cancelAt ? (
                      <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                        <span className="text-sm font-medium text-ink-600">Cancel date</span>
                        <span className="text-sm font-semibold text-ink-900">
                          {formatDateTime(detail?.billing?.cancelAt)}
                        </span>
                      </div>
                    ) : null}
                    <div className="rounded-[18px] bg-clay-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                        Stripe references
                      </p>
                      <p className="mt-2 text-sm text-ink-700">
                        Customer: {detail?.billing?.stripeCustomerId || "None"}
                      </p>
                      <p className="mt-1 text-sm text-ink-700">
                        Subscription: {detail?.billing?.stripeSubscriptionId || "None"}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <a
                        href={detail?.billing?.customerDashboardUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className={`secondary-action justify-center ${
                          detail?.billing?.customerDashboardUrl ? "" : "pointer-events-none opacity-50"
                        }`}
                      >
                        Open customer in Stripe
                      </a>
                      <a
                        href={detail?.billing?.subscriptionDashboardUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className={`secondary-action justify-center ${
                          detail?.billing?.subscriptionDashboardUrl ? "" : "pointer-events-none opacity-50"
                        }`}
                      >
                        Open subscription in Stripe
                      </a>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                        Recent invoices
                      </p>
                      {detail?.billing?.invoices?.length ? (
                        detail.billing.invoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="rounded-[18px] border border-ink-100 bg-white px-4 py-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-ink-900">
                                  {invoice.number || invoice.id}
                                </p>
                                <p className="mt-1 text-sm text-ink-500">
                                  {formatDateTime(invoice.createdAt, "Unknown")} / {invoice.status || "unknown"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-ink-900">
                                  ${(Number(invoice.amountDue || 0) / 100).toFixed(2)}
                                </p>
                                {invoice.hostedInvoiceUrl ? (
                                  <a
                                    href={invoice.hostedInvoiceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-verdigris-700"
                                  >
                                    Open invoice
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-ink-500">No invoices found for this customer.</p>
                      )}
                    </div>
                  </div>
                </DetailBlock>

                <DetailBlock
                  title="Activity"
                  subtitle="Login recency, active session count, and support-side visibility."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                        Joined
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatDateTime(selectedUser.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                        Last login
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatDateTime(selectedUser.lastLoginAt, "Never")}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                        Last seen
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatDateTime(selectedUser.lastSeenAt, "No session history")}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-verdigris-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                        Monthly usage
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-ink-900">{selectedUser.monthlyUsageCount}</p>
                    </div>
                  </div>
                </DetailBlock>

                <DetailBlock
                  title="Workspace footprint"
                  subtitle="What the user currently owns inside the product."
                >
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedUser.counts || {}).map(([key, value]) => (
                      <div key={key} className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                          {key.replace(/([A-Z])/g, " $1")}
                        </p>
                        <p className="mt-2 text-xl font-semibold text-ink-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </DetailBlock>

                <DetailBlock
                  title="Feature usage"
                  subtitle="Recent tracked product usage from billing and premium workflows."
                >
                  <div className="space-y-3">
                    {detail?.usage?.lifetime?.length ? (
                      detail.usage.lifetime.map((entry) => (
                        <div
                          key={entry.featureKey}
                          className="rounded-[18px] border border-ink-100 bg-white px-4 py-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-ink-900">{entry.label}</p>
                              <p className="mt-1 text-sm text-ink-500">
                                Last used {formatDateTime(entry.lastUsedAt, "Never")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                                Current month
                              </p>
                              <p className="mt-1 text-lg font-semibold text-ink-900">
                                {entry.currentMonthCount}
                              </p>
                              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                                Lifetime
                              </p>
                              <p className="mt-1 text-sm font-semibold text-ink-900">
                                {entry.totalCount}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-ink-500">No tracked premium usage yet.</p>
                    )}
                  </div>
                </DetailBlock>

                <DetailBlock
                  title="Document storage"
                  subtitle="Quota status, largest files, and the most recent document uploads for this account."
                >
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                          Storage used
                        </p>
                        <p className="mt-2 text-sm font-semibold text-ink-900">
                          {detail?.documentStorage
                            ? formatStorageBytes(detail.documentStorage.bytesUsed)
                            : "0 B"}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                          Quota
                        </p>
                        <p className="mt-2 text-sm font-semibold text-ink-900">
                          {detail?.documentStorage
                            ? formatStorageBytes(detail.documentStorage.totalStorageQuotaBytes)
                            : "0 B"}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                          Files
                        </p>
                        <p className="mt-2 text-sm font-semibold text-ink-900">
                          {detail?.documentStorage?.fileCount || 0}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                          Max file size
                        </p>
                        <p className="mt-2 text-sm font-semibold text-ink-900">
                          {detail?.documentStorage
                            ? formatStorageBytes(detail.documentStorage.maxFileSizeBytes)
                            : "0 B"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                          Largest files
                        </p>
                        <div className="mt-3 space-y-3">
                          {detail?.documentStorage?.largestFiles?.length ? (
                            detail.documentStorage.largestFiles.map((file) => (
                              <div key={file.id} className="rounded-[16px] bg-ink-50/50 px-3 py-3">
                                <p className="text-sm font-semibold text-ink-900">{file.displayName}</p>
                                <p className="mt-1 text-sm text-ink-500">
                                  {file.bytesLabel} • {file.source.replace(/_/g, " ")}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-ink-500">No stored documents yet.</p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                          Recent uploads
                        </p>
                        <div className="mt-3 space-y-3">
                          {detail?.documentStorage?.recentUploads?.length ? (
                            detail.documentStorage.recentUploads.map((file) => (
                              <div key={file.id} className="rounded-[16px] bg-ink-50/50 px-3 py-3">
                                <p className="text-sm font-semibold text-ink-900">{file.displayName}</p>
                                <p className="mt-1 text-sm text-ink-500">
                                  {file.bytesLabel} • {formatDateTime(file.createdAt)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-ink-500">No uploads recorded yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </DetailBlock>

                <DetailBlock
                  title="Support notes"
                  subtitle="Internal-only notes for future support follow-up."
                >
                  <div className="space-y-4">
                    <textarea
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      rows={4}
                      placeholder="Add a note about the user, issue, promise, or follow-up."
                      className="auth-input min-h-[120px]"
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={detailBusyKey !== "" || !noteDraft.trim()}
                      className="secondary-action w-full justify-center"
                    >
                      {detailBusyKey === "add-note" ? "Saving..." : "Save support note"}
                    </button>
                    <div className="space-y-3">
                      {detail?.supportNotes?.length ? (
                        detail.supportNotes.map((note) => (
                          <div
                            key={note.id}
                            className="rounded-[18px] border border-ink-100 bg-white px-4 py-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-ink-900">{note.authorEmail}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink-400">
                                  {formatDateTime(note.createdAt)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  runDetailAction(
                                    `delete-note-${note.id}`,
                                    () => deletePlatformManagerSupportNote(note.id),
                                    "Support note deleted."
                                  )
                                }
                                disabled={detailBusyKey !== ""}
                                className="text-xs font-semibold uppercase tracking-[0.14em] text-clay-700"
                              >
                                Delete
                              </button>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-ink-600">{note.body}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-ink-500">No support notes saved yet.</p>
                      )}
                    </div>
                  </div>
                </DetailBlock>

                <DetailBlock
                  title="Sessions"
                  subtitle="Recent sessions with auth method, last activity, and expiry state."
                >
                  <div className="space-y-3">
                    {detail?.sessions?.length ? (
                      detail.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="rounded-[18px] border border-ink-100 bg-white px-4 py-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-ink-900">
                                  {session.authMethod} / {session.sessionType}
                                </p>
                                {session.isCurrent ? (
                                  <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700">
                                    Current admin session
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-ink-500">{session.userAgent}</p>
                              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-ink-400">
                                Last activity {formatDateTime(session.lastActivityAt)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                sessionStatusStyles[session.status] || sessionStatusStyles.active
                              }`}
                            >
                              {session.status}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm text-ink-600">
                            <p>Started: {formatDateTime(session.createdAt)}</p>
                            <p>Expires: {formatDateTime(session.expiresAt, "None")}</p>
                            <p>IP: {session.ipAddress || "Unknown"}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-ink-500">No session history found.</p>
                    )}
                  </div>
                </DetailBlock>

                <DetailBlock
                  title="Audit trail"
                  subtitle="Recent platform-manager actions taken on this account."
                >
                  <div className="space-y-3">
                    {detail?.auditLogs?.length ? (
                      detail.auditLogs.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-[18px] border border-ink-100 bg-white px-4 py-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-sand-100 text-ink-700">
                              <ClockIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-ink-900">
                                  {entry.action.replace(/_/g, " ")}
                                </p>
                                <span className="text-xs uppercase tracking-[0.14em] text-ink-400">
                                  {formatDateTime(entry.createdAt)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-ink-500">
                                Actor: {entry.actorEmail || "Unknown"}
                              </p>
                              {entry.reason ? (
                                <p className="mt-2 text-sm leading-6 text-ink-600">
                                  Reason: {entry.reason}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-ink-500">No audit events have been recorded yet.</p>
                    )}
                  </div>
                </DetailBlock>

                <DetailBlock
                  title="Guardrails"
                  subtitle="Actions that remove access or data ownership are intentionally constrained."
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-[18px] bg-sand-50 px-4 py-3">
                      <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-ink-700" />
                      <p className="text-sm leading-6 text-ink-600">
                        Suspending an account revokes its live sessions but preserves every owned
                        record.
                      </p>
                    </div>
                    <div className="flex items-start gap-3 rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                      <UsersIcon className="mt-0.5 h-5 w-5 text-ink-700" />
                      <p className="text-sm leading-6 text-ink-600">
                        Deletion is only available for empty accounts so user-owned data never gets
                        orphaned.
                      </p>
                    </div>
                  </div>
                </DetailBlock>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
};

export default PlatformManagerPage;
