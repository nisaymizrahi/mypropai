import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrashIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import {
  deletePlatformManagerUser,
  getPlatformManagerUsers,
  setPlatformManagerAccountStatus,
  setPlatformManagerSubscriptionOverride,
  startPlatformManagerImpersonation,
} from "../utils/api";

const FILTERS = [
  { value: "all", label: "All users" },
  { value: "pro", label: "Pro access" },
  { value: "free", label: "Free access" },
  { value: "suspended", label: "Suspended" },
  { value: "override", label: "Overrides" },
];

const statusStyles = {
  active: "bg-verdigris-50 text-verdigris-700",
  suspended: "bg-clay-50 text-clay-700",
};

const planStyles = {
  pro: "bg-ink-900 text-white",
  free: "bg-sand-100 text-ink-700",
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
    detail: "Users with effective Pro access, including complimentary grants.",
  },
  {
    label: "Suspended",
    value: stats.suspendedUsers,
    detail: "Accounts blocked from logging in until reactivated.",
  },
  {
    label: "Overrides",
    value: stats.overriddenUsers,
    detail: "Accounts where you have manually changed access behavior.",
  },
];

const SummaryCard = ({ label, value, detail }) => (
  <div className="metric-tile p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-4 text-3xl font-semibold text-ink-900">{value}</p>
    <p className="mt-3 text-sm leading-6 text-ink-500">{detail}</p>
  </div>
);

const getInitials = (name = "", email = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return String(email).slice(0, 2).toUpperCase() || "MP";
};

const formatJoinedDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "Unknown";

const describeSubscription = (subscription) => {
  if (subscription.override === "pro") {
    return "Complimentary Pro override is active.";
  }

  if (subscription.override === "free") {
    return subscription.underlyingStatus === "active"
      ? "Pro access is force-disabled even though billing is still active underneath."
      : "Pro access is manually disabled for this account.";
  }

  if (subscription.source === "stripe" && subscription.plan === "pro") {
    return "Access is coming from the user’s Stripe subscription.";
  }

  return "Access follows the normal billing state for this account.";
};

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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadUsers(query);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadUsers, query]);

  const filteredUsers = useMemo(() => {
    return users.filter((listedUser) => {
      if (filter === "pro") return listedUser.subscription.plan === "pro";
      if (filter === "free") return listedUser.subscription.plan === "free";
      if (filter === "suspended") return listedUser.accountStatus === "suspended";
      if (filter === "override") return listedUser.subscription.override !== "none";
      return true;
    });
  }, [filter, users]);

  const runAction = async (busyId, action, successMessage) => {
    try {
      setBusyKey(busyId);
      await action();
      await loadUsers(query);
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (actionError) {
      toast.error(actionError.message || "Action failed.");
    } finally {
      setBusyKey("");
    }
  };

  const handleImpersonation = async (targetUser) => {
    try {
      setBusyKey(`impersonate-${targetUser.id}`);
      const data = await startPlatformManagerImpersonation(targetUser.id);
      startImpersonation(data.token);
      navigate("/dashboard");
      toast.success(`Now viewing ${targetUser.name}'s workspace.`);
    } catch (actionError) {
      toast.error(actionError.message || "Failed to start impersonation.");
    } finally {
      setBusyKey("");
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

    runAction(
      `delete-${targetUser.id}`,
      () => deletePlatformManagerUser(targetUser.id),
      "User deleted."
    );
  };

  if (loading) {
    return (
      <div className="surface-panel flex items-center justify-center px-6 py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-verdigris-100 border-t-verdigris-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(13,23,36,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <span className="eyebrow">Owner-only command room</span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900">
              Platform support, account control, and safe impersonation.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">
              This page is locked behind a server-side platform manager email allowlist. From here
              you can review users, enter their workspace, grant complimentary Pro access, remove
              access, suspend accounts, and delete empty accounts safely.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => loadUsers(query)}
                className="secondary-action"
                disabled={busyKey !== ""}
              >
                <ArrowPathIcon className="mr-2 h-5 w-5" />
                Refresh users
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
                <span className="text-sm font-medium text-ink-600">Impersonation safety</span>
                <span className="text-sm font-semibold text-ink-900">Restorable session</span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-clay-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Billing support</span>
                <span className="text-sm font-semibold text-ink-900">Manual overrides</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards(stats).map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </section>

      <section className="section-card p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">User roster</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Workspace accounts</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Search for a user, open their workspace as them, or adjust access without touching
              the underlying product data.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:max-w-[560px]">
            <label className="relative block">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or email"
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

        {error ? (
          <div className="mt-6 rounded-[24px] border border-clay-200 bg-clay-50 px-6 py-10 text-center text-clay-700">
            {error}
          </div>
        ) : null}

        {!error && filteredUsers.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-ink-200 bg-sand-50 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-ink-900">No users match this view</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Try another filter or adjust the search to pull in the account you want.
            </p>
          </div>
        ) : null}

        {!error && filteredUsers.length > 0 ? (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {filteredUsers.map((listedUser) => {
              const statusBusy = busyKey === `status-${listedUser.id}`;
              const accessBusy = busyKey === `access-${listedUser.id}`;
              const deleteBusy = busyKey === `delete-${listedUser.id}`;
              const impersonateBusy = busyKey === `impersonate-${listedUser.id}`;

              return (
                <article key={listedUser.id} className="section-card p-5">
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
                          </div>
                          <p className="mt-1 text-sm text-ink-500">{listedUser.email}</p>
                          <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-400">
                            Joined {formatJoinedDate(listedUser.createdAt)}
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
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
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
                          Managed
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-ink-900">
                          {listedUser.counts.managedProperties}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-verdigris-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">
                          Total records
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-ink-900">
                          {listedUser.counts.totalOwnedRecords}
                        </p>
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
                        onClick={() => handleImpersonation(listedUser)}
                        disabled={
                          listedUser.isCurrentPlatformManager ||
                          listedUser.accountStatus === "suspended" ||
                          impersonateBusy
                        }
                        className="primary-action"
                      >
                        <EyeIcon className="mr-2 h-5 w-5" />
                        {impersonateBusy ? "Opening..." : "View as user"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            `access-${listedUser.id}`,
                            () =>
                              setPlatformManagerSubscriptionOverride(
                                listedUser.id,
                                listedUser.subscription.plan === "pro" ? "free" : "pro"
                              ),
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
                            ? "Remove Pro"
                            : "Grant Pro"}
                      </button>

                      {listedUser.subscription.override !== "none" ? (
                        <button
                          type="button"
                          onClick={() =>
                            runAction(
                              `access-${listedUser.id}`,
                              () => setPlatformManagerSubscriptionOverride(listedUser.id, "none"),
                              "Billing override cleared."
                            )
                          }
                          disabled={listedUser.isCurrentPlatformManager || accessBusy}
                          className="secondary-action"
                        >
                          <ArrowPathIcon className="mr-2 h-5 w-5" />
                          Clear override
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() =>
                          runAction(
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

      <section className="section-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand-100 text-ink-700">
            <UsersIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink-900">Support guardrails</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Suspending an account preserves all property, pipeline, and management data. Deleting
              is only allowed for empty accounts so we do not orphan user-owned records.
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              Complimentary Pro and forced Free access are implemented as platform overrides, so
              you can help a user immediately without rewriting their underlying billing history.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlatformManagerPage;
