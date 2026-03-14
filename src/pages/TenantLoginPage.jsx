import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

import BrandLogo from "../components/BrandLogo";
import { API_BASE_URL } from "../config";

const tenantBenefits = [
  {
    title: "Review your lease details",
    description: "See the property and unit information connected to your account.",
    icon: ClipboardDocumentListIcon,
  },
  {
    title: "Check balances and ledger",
    description: "View rent-related transactions and your current balance from one place.",
    icon: CurrencyDollarIcon,
  },
  {
    title: "Submit requests",
    description: "Send questions or maintenance-related communication directly through the portal.",
    icon: ChatBubbleLeftRightIcon,
  },
];

const TenantLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/tenant-auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Failed to log in.");
      }

      localStorage.setItem("tenantToken", data.token);
      navigate("/tenant-dashboard");
    } catch (err) {
      setError(err.message || "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="public-shell relative min-h-screen overflow-hidden text-ink-900">
      <div className="absolute inset-0 grid-fade opacity-30" />

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-4">
            <BrandLogo caption="Tenant portal" imageClassName="sm:h-12 sm:max-w-[190px]" />
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/login" className="ghost-action">
              Workspace login
            </Link>
            <Link to="/signup" className="primary-action hidden sm:inline-flex">
              Create workspace account
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-16">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12">
            <section className="flex flex-col justify-center">
              <span className="eyebrow">Tenant access</span>
              <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.03] text-balance text-ink-900 sm:text-6xl">
                Sign in to review your lease information and send requests.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600 sm:text-xl">
                This portal is for tenants who have already been invited. Use the same email
                address connected to your lease or invitation.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {tenantBenefits.map((benefit) => (
                  <div key={benefit.title} className="section-card p-5">
                    <benefit.icon className="h-6 w-6 text-verdigris-600" />
                    <h2 className="mt-4 text-lg font-semibold text-ink-900">{benefit.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-500">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="auth-card p-6 text-ink-900 sm:p-8">
              <span className="eyebrow">Tenant portal login</span>
              <h2 className="mt-4 font-display text-4xl text-ink-900">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Use your tenant credentials to review your balance, lease details, and
                communication history.
              </p>

              <div className="mt-6 rounded-[24px] border border-sand-200 bg-sand-50 p-4 text-sm leading-6 text-ink-600">
                Need access? Contact your property manager for a tenant invitation. Managers and
                operators should use{" "}
                <Link to="/login" className="font-semibold underline decoration-verdigris-300 underline-offset-4">
                  the workspace login
                </Link>
                .
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="email" className="auth-label">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="auth-input"
                    placeholder="tenant@email.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="auth-label">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
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
                  {isSubmitting ? "Logging in..." : "Enter tenant portal"}
                  {!isSubmitting && <ArrowRightIcon className="ml-2 h-5 w-5" />}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/" className="ghost-action">
                  Back to homepage
                </Link>
                <Link to="/login" className="ghost-action">
                  Workspace login
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TenantLoginPage;
