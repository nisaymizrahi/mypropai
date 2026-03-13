import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  KeyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

import { API_BASE_URL } from "../config";

const activationHighlights = [
  {
    title: "Secure account setup",
    description: "Create your tenant password and activate access without contacting support.",
    icon: KeyIcon,
  },
  {
    title: "Private lease workspace",
    description: "Review ledger activity, lease details, and requests inside a dedicated portal.",
    icon: BuildingOffice2Icon,
  },
  {
    title: "Protected access",
    description: "Invitation links expire automatically for security, and passwords stay private.",
    icon: ShieldCheckIcon,
  },
];

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/tenant-auth/invite/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Failed to set password.");
      }

      setSuccess("Password set successfully. Redirecting to tenant login...");
      window.setTimeout(() => {
        navigate("/tenant-login", { replace: true });
      }, 1800);
    } catch (err) {
      setError(err.message || "Failed to activate account.");
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-lg font-bold text-white">
              MP
            </div>
            <div>
              <p className="font-display text-2xl leading-none text-ink-900">MyPropAI</p>
              <p className="mt-1 text-sm text-ink-500">Tenant account activation</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/tenant-login" className="secondary-action">
              Tenant login
            </Link>
            <Link to="/login" className="ghost-action hidden sm:inline-flex">
              Manager login
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-16">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12">
            <section className="flex flex-col justify-center">
              <span className="eyebrow">Tenant invitation</span>
              <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.03] text-balance text-ink-900 sm:text-6xl">
                Activate your tenant portal and create your secure password.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600 sm:text-xl">
                This invitation gives you access to your private lease workspace, where you can
                review ledger activity, send requests, and stay connected to the property team.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {activationHighlights.map((item) => (
                  <div key={item.title} className="section-card p-5">
                    <item.icon className="h-6 w-6 text-verdigris-600" />
                    <h2 className="mt-4 text-lg font-semibold text-ink-900">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="auth-card p-6 text-ink-900 sm:p-8">
              <span className="eyebrow">Complete setup</span>
              <h2 className="mt-4 font-display text-4xl text-ink-900">Set your password</h2>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Choose a password with at least 8 characters. Once activated, you will be
                redirected to the tenant login page.
              </p>

              <div className="mt-6 rounded-[24px] border border-sand-200 bg-sand-50 p-4 text-sm leading-6 text-ink-600">
                Invitation links expire for security. If this link no longer works, contact your
                property manager and ask for a new invite.
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="password" className="auth-label">
                    New password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="auth-input"
                    placeholder="Create a secure password"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="auth-label">
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="auth-input"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-[24px] border border-clay-200 bg-clay-50 p-4 text-sm text-clay-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-[24px] border border-verdigris-200 bg-verdigris-50 p-4 text-sm text-verdigris-800">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || Boolean(success)}
                  className="primary-action w-full"
                >
                  {isSubmitting ? "Activating account..." : "Activate tenant portal"}
                  {!isSubmitting && !success && <ArrowRightIcon className="ml-2 h-5 w-5" />}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/tenant-login" className="ghost-action">
                  Back to tenant login
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

export default InvitePage;
