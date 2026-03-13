import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowTopRightOnSquareIcon,
  BanknotesIcon,
  BoltIcon,
  CheckBadgeIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import {
  changePassword,
  createBillingPortalSession,
  createStripeConnectAccount,
  createSubscriptionCheckout,
  getBillingOverview,
  syncBillingCheckoutSession,
  updateUserProfile,
} from "../utils/api";

const formatCurrency = (amountCents = 0, currency = "usd") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format((amountCents || 0) / 100);

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

const AccountCenter = () => {
  const { user, loading, refreshUser } = useAuth();
  const location = useLocation();
  const syncedSessionRef = useRef(null);

  const [profileData, setProfileData] = useState({ name: "", email: "" });
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const [isConnecting, setIsConnecting] = useState(false);
  const [billingOverview, setBillingOverview] = useState(null);
  const [isBillingLoading, setIsBillingLoading] = useState(true);
  const [isStartingSubscription, setIsStartingSubscription] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

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
      setProfileData({ name: user.name || "", email: user.email || "" });
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

  const handleProfileChange = (event) => {
    setProfileData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
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

  const handleStripeConnect = async () => {
    setIsConnecting(true);
    try {
      const { url } = await createStripeConnectAccount();
      window.location.href = url;
    } catch (error) {
      toast.error(error.message || "Could not connect to Stripe. Please try again.");
      setIsConnecting(false);
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

  if (loading) {
    return <LoadingSpinner />;
  }

  const currentPlan = billingOverview?.plan;
  const catalog = billingOverview?.catalog;
  const purchases = billingOverview?.purchases || [];
  const planFeatures = currentPlan?.features || [];
  const oneTimeProducts = catalog?.oneTimeProducts || [];

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <span className="eyebrow">Account and billing</span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900">
              Manage your workspace profile, subscription, and payout setup.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">
              Keep your operator identity current, review billing posture, and make sure
              application fees and future rent flows land in the right payout account.
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

              <button
                type="button"
                onClick={handleStripeConnect}
                disabled={isConnecting || user?.stripeOnboardingComplete}
                className="secondary-action disabled:cursor-not-allowed disabled:opacity-60"
              >
                {user?.stripeOnboardingComplete
                  ? "Stripe connected"
                  : isConnecting
                    ? "Connecting..."
                    : "Connect Stripe"}
              </button>
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
                  {user?.name || "MyPropAI User"}
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
                  user?.stripeOnboardingComplete
                    ? "bg-verdigris-50 text-verdigris-800"
                    : "bg-clay-50 text-clay-800"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Stripe payouts
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {user?.stripeOnboardingComplete
                    ? "Connected and ready to receive funds"
                    : "Not connected yet"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Plan"
          value={currentPlan?.name || "Starter"}
          detail="The current subscription level attached to this manager workspace."
          icon={CreditCardIcon}
          accent="ink"
        />
        <MetricCard
          label="Features"
          value={planFeatures.length}
          detail="Active capabilities currently included with your plan."
          icon={BoltIcon}
          accent="verdigris"
        />
        <MetricCard
          label="Purchases"
          value={purchases.length}
          detail="Tracked billing records and one-time service purchases to date."
          icon={BanknotesIcon}
          accent="sand"
        />
        <MetricCard
          label="Payouts"
          value={user?.stripeOnboardingComplete ? "Ready" : "Pending"}
          detail="Whether Stripe payouts are set up for application fees and income collection."
          icon={CheckBadgeIcon}
          accent={user?.stripeOnboardingComplete ? "verdigris" : "clay"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <div className="space-y-6">
          <div className="section-card p-6 sm:p-7">
            <span className="eyebrow">Profile</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Workspace profile</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Update the account details used across the manager workspace.
            </p>

            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="auth-label">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="auth-input"
                    placeholder="Your full name"
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
                          : "Upgrade to Pro to unlock premium AI workflows and expanded billing tools."}
                      </p>
                      {currentPlan?.renewsAt ? (
                        <p className="mt-1 text-sm text-ink-500">
                          Renews on {new Date(currentPlan.renewsAt).toLocaleDateString()}
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

                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-ink-900">One-time services</h4>
                      <p className="mt-1 text-sm text-ink-500">
                        Purchase these from the related lead or application when needed.
                      </p>
                    </div>
                    <Link
                      to="/leads"
                      className="inline-flex items-center text-sm font-semibold text-verdigris-700 hover:text-verdigris-800"
                    >
                      Open leads
                      <ArrowTopRightOnSquareIcon className="ml-1.5 h-4 w-4" />
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {oneTimeProducts.length > 0 ? (
                      oneTimeProducts.map((product) => (
                        <div
                          key={product.key}
                          className="rounded-[22px] border border-ink-100 bg-white p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h5 className="text-base font-semibold text-ink-900">
                                {product.name}
                              </h5>
                              <p className="mt-2 text-sm leading-6 text-ink-500">
                                {product.description}
                              </p>
                            </div>
                            <span className="text-lg font-semibold text-ink-900">
                              {formatCurrency(product.priceCents, product.currency)}
                            </span>
                          </div>
                          {product.subscriberPriceCents ? (
                            <p className="mt-4 text-xs leading-5 text-ink-400">
                              Standard price{" "}
                              {formatCurrency(product.basePriceCents, product.currency)}. Pro users
                              pay {formatCurrency(product.subscriberPriceCents, product.currency)}.
                            </p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-ink-200 bg-sand-50 px-5 py-10 text-center text-ink-500 md:col-span-2">
                        No one-time products are currently configured.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-ink-900">Recent purchases</h4>
                  {purchases.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {purchases.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-ink-100 bg-white px-4 py-4"
                        >
                          <div>
                            <p className="font-semibold capitalize text-ink-900">
                              {purchase.kind.replace("_", " ")}
                            </p>
                            <p className="mt-1 text-sm text-ink-500">
                              {purchase.purchasedAt
                                ? new Date(purchase.purchasedAt).toLocaleDateString()
                                : "Pending payment"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-ink-900">
                              {formatCurrency(purchase.amountCents, purchase.currency)}
                            </p>
                            <p className="text-sm capitalize text-ink-400">{purchase.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[22px] border border-dashed border-ink-200 bg-sand-50 px-5 py-10 text-center text-ink-500">
                      No billing activity yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="section-card p-6 sm:p-7">
            <span className="eyebrow">Payout setup</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Payments and Stripe</h3>

            {user?.stripeOnboardingComplete ? (
              <div className="mt-6 rounded-[22px] border border-verdigris-200 bg-verdigris-50 p-5 text-verdigris-900">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="mt-0.5 h-6 w-6 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Stripe payout account connected</p>
                    <p className="mt-2 text-sm leading-6 text-verdigris-800">
                      You are ready to accept application fees and rental income into your own bank account.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[22px] border border-clay-200 bg-clay-50 p-5 text-clay-900">
                <div className="flex items-start gap-3">
                  <BanknotesIcon className="mt-0.5 h-6 w-6 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Stripe still needs to be connected</p>
                    <p className="mt-2 text-sm leading-6 text-clay-800">
                      Connect your payout account to securely accept application fees and rental income.
                    </p>
                    <button
                      type="button"
                      onClick={handleStripeConnect}
                      disabled={isConnecting}
                      className="primary-action mt-4 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isConnecting ? "Connecting..." : "Connect with Stripe"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="section-card p-6 sm:p-7">
            <span className="eyebrow">Security</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Change password</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Keep the manager workspace secure with an updated password.
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
                  Use this page as the operating layer for profile changes, billing checks, and payout readiness before you start collecting fees at scale.
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
