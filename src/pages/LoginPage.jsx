import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../utils/api";

const managerBenefits = [
  {
    title: "Portfolio visibility",
    description: "Track investments, occupancy, rent, and action items without juggling tabs.",
    icon: ChartBarIcon,
  },
  {
    title: "Operational workflow",
    description: "Manage leads, applications, leases, maintenance, and tenant communication.",
    icon: ClipboardDocumentListIcon,
  },
  {
    title: "AI assistance",
    description: "Generate reporting, listing copy, and operating insight from the same workspace.",
    icon: SparklesIcon,
  },
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

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-lg font-bold text-white">
              MP
            </div>
            <div>
              <p className="font-display text-2xl leading-none text-ink-900">MyPropAI</p>
              <p className="mt-1 text-sm text-ink-500">Manager and operator workspace</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/tenant-login" className="secondary-action hidden sm:inline-flex">
              Tenant portal
            </Link>
            <Link to="/signup" className="primary-action">
              Create account
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-16">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12">
            <section className="flex flex-col justify-center">
              <span className="eyebrow">Manager login</span>
              <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.03] text-balance text-ink-900 sm:text-6xl">
                Sign in to the workspace built for owners, operators, and property managers.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600 sm:text-xl">
                Use this login if you manage acquisitions, leasing, applications, reporting, or
                tenant operations. Tenants should use the separate tenant portal.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-ink-600">
                <span className="rounded-full border border-ink-200 bg-white/80 px-4 py-2">
                  Investments and underwriting
                </span>
                <span className="rounded-full border border-ink-200 bg-white/80 px-4 py-2">
                  Leasing and applications
                </span>
                <span className="rounded-full border border-ink-200 bg-white/80 px-4 py-2">
                  Tenant portal management
                </span>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {managerBenefits.map((benefit) => (
                  <div key={benefit.title} className="section-card p-5">
                    <benefit.icon className="h-6 w-6 text-verdigris-600" />
                    <h2 className="mt-4 text-lg font-semibold text-ink-900">{benefit.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-500">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="auth-card p-6 text-ink-900 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="eyebrow">Operator access</span>
                  <h2 className="mt-4 font-display text-4xl text-ink-900">Welcome back</h2>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-ink-500">
                    Sign in with email or continue with Google. If you are a tenant looking for
                    rent, lease, or request information, use the tenant portal instead.
                  </p>
                </div>
                <div className="hidden h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-white sm:flex">
                  <BuildingOffice2Icon className="h-7 w-7" />
                </div>
              </div>

              <div className="mt-8 rounded-[24px] border border-verdigris-100 bg-verdigris-50/80 p-4 text-sm text-verdigris-800">
                Managers and operators sign in here. Tenants should use{" "}
                <Link to="/tenant-login" className="font-semibold underline decoration-verdigris-400 underline-offset-4">
                  the tenant portal
                </Link>
                .
              </div>

              {oauthMessage && (
                <div className="mt-4 rounded-[24px] border border-clay-200 bg-clay-50 p-4 text-sm text-clay-700">
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
                    <p className="text-xs text-ink-400">Use the password tied to your manager account.</p>
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
                  <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="primary-action w-full">
                  {isSubmitting ? "Signing in..." : "Sign in to manager workspace"}
                  {!isSubmitting && <ArrowRightIcon className="ml-2 h-5 w-5" />}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/signup" className="ghost-action">
                  Create a manager account
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
