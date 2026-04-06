import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowPathIcon, CheckCircleIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

import BrandLogo from "../components/BrandLogo";
import PublicLegalLinks from "../components/PublicLegalLinks";
import { getEmailPreferences, updateEmailPreferences } from "../utils/api";

const EmailPreferencesPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const action = searchParams.get("action") || "";
  const autoActionHandledRef = useRef(false);
  const [preferences, setPreferences] = useState(null);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [status, setStatus] = useState(token ? "loading" : "error");
  const [error, setError] = useState(
    token ? "" : "This email preferences link is missing the secure token we need to verify it."
  );
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return undefined;
    }

    autoActionHandledRef.current = false;

    let cancelled = false;

    const loadPreferences = async () => {
      setStatus("loading");
      setError("");

      try {
        const payload = await getEmailPreferences(token);
        if (cancelled) return;

        const nextPreferences = payload?.preferences || null;
        setPreferences(nextPreferences);
        setMarketingConsent(Boolean(nextPreferences?.marketingOptIn));
        setStatus("ready");
      } catch (requestError) {
        if (cancelled) return;
        setError(requestError.message || "This email preferences link is invalid or expired.");
        setStatus("error");
      }
    };

    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (status !== "ready" || !preferences || action !== "unsubscribe" || autoActionHandledRef.current) {
      return undefined;
    }

    autoActionHandledRef.current = true;

    if (!preferences.marketingOptIn) {
      setMarketingConsent(false);
      setNotice("You are already unsubscribed from Fliprop marketing emails.");
      return undefined;
    }

    let cancelled = false;

    const runUnsubscribe = async () => {
      setStatus("saving");
      setError("");

      try {
        const payload = await updateEmailPreferences({
          token,
          marketingConsent: false,
        });
        if (cancelled) return;

        const nextPreferences = payload?.preferences || {
          ...preferences,
          marketingOptIn: false,
        };

        setPreferences(nextPreferences);
        setMarketingConsent(false);
        setNotice(payload?.message || "You've been unsubscribed from Fliprop marketing emails.");
        setStatus("ready");
      } catch (requestError) {
        if (cancelled) return;
        setError(requestError.message || "We couldn't unsubscribe you right now.");
        setStatus("ready");
      }
    };

    runUnsubscribe();

    return () => {
      cancelled = true;
    };
  }, [action, preferences, status, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) return;

    setStatus("saving");
    setError("");
    setNotice("");

    try {
      const payload = await updateEmailPreferences({
        token,
        marketingConsent,
      });
      setPreferences(payload?.preferences || preferences);
      setNotice(
        payload?.message ||
          (marketingConsent
            ? "You're subscribed to Fliprop marketing emails."
            : "You've been unsubscribed from Fliprop marketing emails.")
      );
      setStatus("ready");
    } catch (requestError) {
      setError(requestError.message || "We couldn't update your preferences.");
      setStatus("ready");
    }
  };

  return (
    <div className="public-shell min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1120px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo caption="Email preferences" />
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/help" className="ghost-action">
              Contact support
            </Link>
            <Link to="/login" className="ghost-action">
              Workspace login
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-10 lg:py-12">
          <section className="auth-card w-full max-w-[620px] p-6">
            <div className="flex items-center gap-3">
              <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl">
                <EnvelopeIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="eyebrow">Email center</span>
                <h1 className="mt-2 text-[2rem] font-display leading-none text-ink-900">
                  Manage promotional emails
                </h1>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-ink-500">
              Use this page to control newsletters, product updates, offers, and other promotional
              Fliprop emails. Account, billing, security, and support emails still go out when they
              are needed for your workspace.
            </p>

            {status === "loading" ? (
              <div className="section-card mt-6 flex items-center gap-3 p-4 text-sm text-ink-600">
                <ArrowPathIcon className="h-5 w-5 animate-spin text-verdigris-700" />
                Loading your email preferences...
              </div>
            ) : null}

            {notice ? (
              <div className="section-card mt-6 flex gap-3 p-4 text-sm leading-6 text-verdigris-700">
                <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <span>{notice}</span>
              </div>
            ) : null}

            {error ? (
              <div className="section-card mt-6 p-4 text-sm leading-6 text-red-700">{error}</div>
            ) : null}

            {preferences && status !== "loading" ? (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="section-card p-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                    Sending to
                  </p>
                  <p className="mt-2 text-base font-medium text-ink-900">{preferences.email}</p>
                </div>

                <label className="flex items-start gap-3 rounded-[20px] bg-white px-4 py-4 text-sm leading-6 text-ink-600 ring-1 ring-ink-100">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(event) => setMarketingConsent(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900"
                  />
                  <span>
                    Send me promotional Fliprop emails like product updates, newsletters, feature
                    highlights, events, and special offers.
                  </span>
                </label>

                <div className="section-card p-4 text-sm leading-6 text-ink-500">
                  Turning this off does not unsubscribe you from account, billing, password reset,
                  security, or support emails related to your workspace.
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button type="submit" disabled={status === "saving"} className="primary-action">
                    {status === "saving" ? "Saving..." : "Save preferences"}
                  </button>
                  <button
                    type="button"
                    disabled={status === "saving"}
                    onClick={() => setMarketingConsent(false)}
                    className="secondary-action"
                  >
                    Unsubscribe from marketing
                  </button>
                </div>
              </form>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link to="/" className="ghost-action">
                Homepage
              </Link>
              <Link to="/help" className="ghost-action">
                Help center
              </Link>
            </div>

            <PublicLegalLinks />
          </section>
        </main>
      </div>
    </div>
  );
};

export default EmailPreferencesPage;
