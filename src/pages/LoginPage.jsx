import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../utils/api";

const workspaceBenefits = [
  {
    title: "Deal and project visibility",
    description: "Track acquisitions, rehab work, rent performance, and next actions without juggling tabs.",
    icon: ChartBarIcon,
  },
  {
    title: "Leasing and operations",
    description: "Manage leads, applications, leases, maintenance, and tenant communication.",
    icon: ClipboardDocumentListIcon,
  },
  {
    title: "AI assistance",
    description: "Generate reporting, listing copy, and operating insight from the same workspace.",
    icon: SparklesIcon,
  },
];

const accessPrinciples = [
  "Premium hierarchy without the clutter of a generic SaaS dashboard.",
  "Google and email sign in stay close to the surface with fewer detours.",
  "Warm materials and calmer contrast help long work sessions feel steadier.",
];

const oauthMessages = {
  nouser: "We could not complete Google sign in for that account. Try email login or another Google account.",
  token: "Google sign in started, but the session could not be completed. Please try again.",
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, authenticated, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && authenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [authenticated, loading, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Enter both your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await loginUser(email, password);
      login(data.token);
    } catch (err) {
      setError(err.message || "Unable to sign you in.");
      setIsSubmitting(false);
    }
  };

  const oauthError = searchParams.get("error");
  const oauthMessage = oauthError ? oauthMessages[oauthError] || "Unable to complete sign in." : "";

  return (
    <div className="public-shell relative min-h-screen overflow-hidden text-ink-900">
      <div className="absolute inset-0 grid-fade opacity-30" />
      <div className="ambient-orb ambient-orb-bronze float-slower left-[-9rem] top-[-4rem] h-[18rem] w-[18rem]" />
      <div className="ambient-orb ambient-orb-sage float-slow right-[-7rem] top-24 h-[16rem] w-[16rem]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-4">
            <div className="brand-mark flex h-12 w-12 items-center justify-center rounded-[18px] text-lg font-semibold text-white">
              FL
            </div>
            <div>
              <p className="font-display text-[2rem] leading-none text-ink-900">Fliprop</p>
              <p className="mt-1 text-sm text-ink-500">Secure workspace access</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="glass-chip hidden sm:inline-flex">Operator login</span>
            <Link to="/signup" className="primary-action">
              Create workspace account
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-16">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12">
            <section className="surface-panel-strong relative overflow-hidden p-6 sm:p-8 reveal-up">
              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-clay-100/35 blur-3xl" />

              <div className="relative">
                <span className="eyebrow">Workspace login</span>
                <h1 className="mt-6 max-w-3xl font-display text-[3.6rem] leading-[0.94] text-balance text-ink-900 sm:text-[4.7rem]">
                  Return to a portfolio workspace that feels calm under pressure.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600 sm:text-xl">
                  Use this login if you run deals, rehab planning, leasing, or ongoing operations.
                  The experience has been simplified so the essentials surface faster.
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {workspaceBenefits.map((benefit) => (
                    <div key={benefit.title} className="section-card p-5">
                      <benefit.icon className="h-6 w-6 text-verdigris-600" />
                      <h2 className="mt-4 text-lg font-semibold text-ink-900">
                        {benefit.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-ink-500">
                        {benefit.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="section-card mt-6 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                    Why it feels different
                  </p>
                  <div className="soft-list mt-4">
                    {accessPrinciples.map((principle) => (
                      <div key={principle} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                        <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-verdigris-600" />
                        <p className="text-sm leading-6 text-ink-600">{principle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="auth-card p-6 text-ink-900 sm:p-8 reveal-up" style={{ animationDelay: "120ms" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="eyebrow">Secure sign in</span>
                  <h2 className="mt-5 font-display text-[3rem] leading-none text-ink-900">
                    Welcome back
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-ink-500">
                    Continue with Google or email. If you are waiting on lease or tenant request
                    details, use the tenant-specific access flow rather than this operator login.
                  </p>
                </div>
                <div className="brand-mark hidden h-14 w-14 flex-shrink-0 items-center justify-center rounded-[20px] text-lg font-semibold text-white sm:flex">
                  FL
                </div>
              </div>

              {oauthMessage && (
                <div className="mt-6 rounded-[24px] border border-clay-200 bg-clay-50/80 p-4 text-sm leading-6 text-clay-700">
                  {oauthMessage}
                </div>
              )}

              <button onClick={handleGoogleLogin} type="button" className="secondary-action mt-6 w-full">
                Continue with Google
              </button>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-ink-100" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                  Or use email
                </p>
                <div className="h-px flex-1 bg-ink-100" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="auth-label">
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="auth-input"
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="password" className="auth-label !mb-0">
                      Password
                    </label>
                    <p className="text-xs text-ink-400">
                      Use the password tied to your Fliprop workspace account.
                    </p>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="auth-input"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-[24px] border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="primary-action w-full">
                  {isSubmitting ? "Signing in..." : "Sign in to workspace"}
                  {!isSubmitting && <ArrowRightIcon className="ml-2 h-5 w-5" />}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/signup" className="ghost-action">
                  Create a workspace account
                </Link>
                <Link to="/" className="ghost-action">
                  Back to homepage
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;
