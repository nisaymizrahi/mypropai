import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BoltIcon,
  CreditCardIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import {
  changePassword,
  createBillingPortalSession,
  createSubscriptionCheckout,
  getBillingOverview,
  syncBillingCheckoutSession,
  updateUserProfile,
} from "../utils/api";
import {
  getSidebarOption,
  loadSidebarPreference,
  persistSidebarPreference,
  SIDEBAR_OPTIONS,
  SIDEBAR_PREFERENCE_EVENT,
} from "../utils/sidebarPreferences";

const LoadingSpinner = () => (
  <div className="surface-panel flex items-center justify-center px-6 py-20">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-verdigris-100 border-t-verdigris-500" />
  </div>
);

const BillingPill = ({ active, children }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
      active ? "bg-verdigris-50 text-verdigris-700" : "bg-sand-100 text-sand-700"
    }`}
  >
    {children}
  </span>
);

const MetricCard = ({ label, value, detail, icon: Icon, accent = "verdigris" }) => {
  const accentClasses = {
    verdigris: "bg-verdigris-50 text-verdigris-700",
    clay: "bg-clay-50 text-clay-700",
    sand: "bg-sand-100 text-sand-700",
    ink: "bg-ink-100 text-ink-700",
  };

  return (
    <div className="metric-tile p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            {label}
          </p>
          <p className="mt-4 text-3xl font-semibold text-ink-900">{value}</p>
          <p className="mt-3 text-sm leading-6 text-ink-500">{detail}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentClasses[accent]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const PreferenceOptionCard = ({
  active,
  label,
  description,
  previewText = "Sample workspace text",
  previewStyle,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-[18px] border px-4 py-4 text-left transition ${
      active
        ? "border-verdigris-200 bg-verdigris-50 shadow-soft"
        : "border-ink-100 bg-white hover:border-ink-200 hover:bg-sand-50"
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        <p className="mt-1 text-sm leading-6 text-ink-500">{description}</p>
      </div>
      {active ? (
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-verdigris-700">
          Active
        </span>
      ) : null}
    </div>
    <p className="mt-4 text-ink-900" style={previewStyle}>
      {previewText}
    </p>
  </button>
);

const AccountCenter = () => {
  const { user, loading, refreshUser } = useAuth();
  const location = useLocation();
  const syncedSessionRef = useRef(null);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    phoneNumber: "",
    marketingConsent: false,
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const [billingOverview, setBillingOverview] = useState(null);
  const [isBillingLoading, setIsBillingLoading] = useState(true);
  const [isStartingSubscription, setIsStartingSubscription] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [sidebarPreference, setSidebarPreference] = useState(() => loadSidebarPreference());

  const loadBillingOverview = useCallback(async () => {
    try {
      setIsBillingLoading(true);
      const overview = await getBillingOverview();
      setBillingOverview(overview);
    } catch (error) {
      toast.error(error.message || "Failed to load billing details.");
    } finally {
      setIsBillingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        companyName: user.companyName || "",
        phoneNumber: user.phoneNumber || "",
        marketingConsent: Boolean(user.consent?.marketingOptIn),
      });
    }
  }, [user]);

  useEffect(() => {
    loadBillingOverview();
  }, [loadBillingOverview]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get("session_id");

    if (queryParams.get("billing_canceled")) {
      toast("Billing checkout was canceled.");
    }

    if (queryParams.get("stripe_success")) {
      toast.success("Stripe account connected successfully!");
    }

    if (!sessionId || syncedSessionRef.current === sessionId) {
      return;
    }

    syncedSessionRef.current = sessionId;

    const syncSession = async () => {
      try {
        await syncBillingCheckoutSession(sessionId);
        await Promise.all([refreshUser(), loadBillingOverview()]);
        toast.success("Billing updated successfully.");
      } catch (error) {
        toast.error(error.message || "We could not verify that checkout session yet.");
      }
    };

    syncSession();
  }, [loadBillingOverview, location.search, refreshUser]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleSidebarPreferenceChange = (event) => {
      setSidebarPreference(getSidebarOption(event.detail).value);
    };

    window.addEventListener(SIDEBAR_PREFERENCE_EVENT, handleSidebarPreferenceChange);
    return () => window.removeEventListener(SIDEBAR_PREFERENCE_EVENT, handleSidebarPreferenceChange);
  }, []);

  const handleProfileChange = (event) => {
    const { checked, name, type, value } = event.target;
    setProfileData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePasswordChange = (event) => {
    setPasswordData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsProfileSaving(true);
    try {
      await updateUserProfile(profileData);
      await refreshUser();
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setIsPasswordSaving(true);
    try {
      const data = await changePassword(passwordData);
      toast.success(data.message);
      setPasswordData({ currentPassword: "", newPassword: "" });
    } catch (error) {
      toast.error(error.message || "Failed to change password.");
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleStartSubscription = async () => {
    setIsStartingSubscription(true);
    try {
      const { url } = await createSubscriptionCheckout("pro");
      window.location.href = url;
    } catch (error) {
      toast.error(error.message || "Could not start the Pro checkout.");
      setIsStartingSubscription(false);
    }
  };

  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const { url } = await createBillingPortalSession();
      window.location.href = url;
    } catch (error) {
      toast.error(error.message || "Could not open the billing portal.");
      setIsOpeningPortal(false);
    }
  };

  const handleSidebarChange = (value) => {
    const appliedOption = persistSidebarPreference(value);
    setSidebarPreference(appliedOption.value);
    toast.success(`${appliedOption.label} sidebar applied.`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const currentPlan = billingOverview?.plan;
  const usage = billingOverview?.usage?.compsReport;
  const planFeatures = currentPlan?.features || [];
  const activeSidebarOption = getSidebarOption(sidebarPreference);

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <span className="eyebrow">Account and billing</span>
            <h2 className="page-hero-title">Manage your workspace profile and subscription.</h2>
            <p className="page-hero-copy">
              Keep your operator identity current, review your plan, and manage the subscription
              attached to this workspace.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {currentPlan?.isActive ? (
                <button
                  type="button"
                  onClick={handleOpenPortal}
                  disabled={isOpeningPortal}
                  className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isOpeningPortal ? "Opening..." : "Manage subscription"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartSubscription}
                  disabled={isStartingSubscription}
                  className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isStartingSubscription ? "Redirecting..." : "Upgrade to Pro"}
                </button>
              )}
            </div>
          </div>

          <div className="section-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Current billing state
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink-900">
                  {currentPlan?.name || "Starter"}
                </h3>
              </div>
              {currentPlan ? (
                <BillingPill active={currentPlan.isActive}>
                  {currentPlan.isActive ? currentPlan.status || "Active" : "Inactive"}
                </BillingPill>
              ) : null}
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-[18px] bg-sand-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Workspace owner
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {user?.name || "Fliprop User"}
                </p>
                <p className="mt-1 text-sm text-ink-500">{user?.email || "No email on file"}</p>
              </div>

              <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Renewal
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {currentPlan?.renewsAt
                    ? new Date(currentPlan.renewsAt).toLocaleDateString()
                    : "No active renewal date"}
                </p>
              </div>

              <div
                className={`rounded-[18px] px-4 py-4 ${
                  currentPlan?.isActive ? "bg-verdigris-50 text-verdigris-800" : "bg-sand-50 text-sand-800"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Plan status
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {currentPlan?.isActive ? currentPlan.status || "Active" : "No active paid plan"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <MetricCard
          label="Plan"
          value={currentPlan?.name || "Starter"}
          detail="The current subscription level attached to this workspace."
          icon={CreditCardIcon}
          accent="ink"
        />
        <MetricCard
          label="Comps Left"
          value={
            currentPlan?.isActive && usage?.monthlyIncludedLimit
              ? usage.monthlyIncludedRemainingCount
              : "Payg"
          }
          detail={
            currentPlan?.isActive && usage?.monthlyIncludedLimit
              ? `${usage.monthlyIncludedUsedCount} of ${usage.monthlyIncludedLimit} included comps reports used this month.`
              : "Starter users buy comps reports one at a time."
          }
          icon={BoltIcon}
          accent="verdigris"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <div className="space-y-6">
          <div className="section-card p-6 sm:p-7">
            <span className="eyebrow">Profile</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Workspace profile</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Update the account details used across the workspace.
            </p>

            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="auth-label">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    className="auth-input"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="auth-label">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    className="auth-input"
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="auth-label">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="auth-input"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label htmlFor="companyName" className="auth-label">
                    Company name
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={profileData.companyName}
                    onChange={handleProfileChange}
                    className="auth-input"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="auth-label">
                    Phone number
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={profileData.phoneNumber}
                    onChange={handleProfileChange}
                    className="auth-input"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-[20px] bg-sand-50 px-4 py-4 text-sm leading-6 text-ink-600">
                <input
                  type="checkbox"
                  name="marketingConsent"
                  checked={profileData.marketingConsent}
                  onChange={handleProfileChange}
                  className="mt-1 h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900"
                />
                <span>
                  Allow Fliprop to send marketing emails and, if a phone number is on file,
                  marketing calls or text messages. You can opt out later.
                </span>
              </label>

              <div className="rounded-[20px] border border-ink-100 bg-white px-4 py-4 text-sm leading-6 text-ink-600">
                <p>
                  Terms accepted:{" "}
                  <span className="font-semibold text-ink-900">
                    {user?.consent?.termsAcceptedAt
                      ? new Date(user.consent.termsAcceptedAt).toLocaleDateString()
                      : "Not recorded"}
                  </span>
                </p>
                <p className="mt-2">
                  Review the{" "}
                  <Link to="/terms" className="font-semibold text-ink-900 underline underline-offset-4">
                    Terms of Use
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="font-semibold text-ink-900 underline underline-offset-4">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isProfileSaving}
                  className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isProfileSaving ? "Saving..." : "Save profile"}
                </button>
              </div>
            </form>
          </div>

          <div className="section-card p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="eyebrow">Subscription</span>
                <h3 className="mt-4 text-2xl font-semibold text-ink-900">Billing and services</h3>
              </div>
              {currentPlan ? (
                <BillingPill active={currentPlan.isActive}>
                  {currentPlan.name} {currentPlan.isActive ? "Active" : "Plan"}
                </BillingPill>
              ) : null}
            </div>

            {isBillingLoading ? (
              <div className="mt-6 rounded-[24px] bg-sand-50 px-5 py-10 text-center text-ink-500">
                Loading billing details...
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="rounded-[24px] border border-ink-100 bg-sand-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                        Current plan
                      </p>
                      <h4 className="mt-2 text-2xl font-semibold text-ink-900">
                        {currentPlan?.name || "Starter"}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-ink-500">
                      {currentPlan?.isActive
                          ? `Status: ${currentPlan.status || "active"}`
                          : "Upgrade to Pro for AI investment reports and 10 included comps reports each month."}
                      </p>
                      {currentPlan?.renewsAt ? (
                        <p className="mt-1 text-sm text-ink-500">
                          Renews on {new Date(currentPlan.renewsAt).toLocaleDateString()}
                        </p>
                      ) : null}
                      {usage?.monthlyIncludedLimit ? (
                        <p className="mt-2 text-sm text-ink-500">
                          {usage.monthlyIncludedRemainingCount} of {usage.monthlyIncludedLimit} included comps reports remaining this month
                          {usage.monthlyIncludedResetsAt
                            ? `, resets on ${new Date(usage.monthlyIncludedResetsAt).toLocaleDateString()}`
                            : ''}
                          .
                        </p>
                      ) : null}
                    </div>
                    {currentPlan?.isActive ? (
                      <button
                        type="button"
                        onClick={handleOpenPortal}
                        disabled={isOpeningPortal}
                        className="secondary-action disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isOpeningPortal ? "Opening..." : "Manage subscription"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartSubscription}
                        disabled={isStartingSubscription}
                        className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isStartingSubscription ? "Redirecting..." : "Upgrade to Pro"}
                      </button>
                    )}
                  </div>

                    {planFeatures.length > 0 ? (
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {planFeatures.map((feature) => (
                        <div
                          key={feature}
                          className="rounded-[18px] border border-white/70 bg-white px-4 py-3 text-sm text-ink-600"
                        >
                          {feature}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="section-card p-6 sm:p-7">
            <span className="eyebrow">Workspace</span>
            <p className="mt-4 text-sm leading-6 text-ink-500">
              Choose how the desktop navigation opens by default in this browser.
            </p>

            <div className="mt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-ink-900">Sidebar</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      Choose whether the desktop navigation stays expanded or minimized by default.
                    </p>
                  </div>
                  <div className="rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-ink-600">
                    {activeSidebarOption.label}
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {SIDEBAR_OPTIONS.map((option) => (
                    <PreferenceOptionCard
                      key={option.value}
                      active={sidebarPreference === option.value}
                      label={option.label}
                      description={option.description}
                      previewText="The desktop navigation will open in this mode each time you return."
                      previewStyle={{ lineHeight: 1.45 }}
                      onClick={() => handleSidebarChange(option.value)}
                    />
                  ))}
                </div>
            </div>
          </div>

          <div className="section-card p-6 sm:p-7">
            <span className="eyebrow">Security</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Change password</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Keep the workspace secure with an updated password.
            </p>

            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="currentPassword" className="auth-label">
                  Current password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="auth-input"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="auth-label">
                  New password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="auth-input"
                  placeholder="Create a new password"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPasswordSaving}
                  className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPasswordSaving ? "Saving..." : "Change password"}
                </button>
              </div>
            </form>
          </div>

          <div className="section-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-ink-100 text-ink-700">
                <UserCircleIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink-900">Account posture</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Use this page for profile changes, billing checks, and security updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccountCenter;
