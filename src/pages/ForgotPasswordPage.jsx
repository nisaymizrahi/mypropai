import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import BrandLogo from "../components/BrandLogo";
import PublicLegalLinks from "../components/PublicLegalLinks";
import { requestPasswordReset } from "../utils/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Enter the email address tied to your workspace.");
      return;
    }

    setStatus("submitting");

    try {
      await requestPasswordReset(email);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message || "Unable to prepare a reset link.");
      setStatus("idle");
    }
  };

  return (
    <div className="public-shell min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1120px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo caption="Password help" />
          </Link>

          <Link to="/login" className="ghost-action">
            Back to login
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-10 lg:py-12">
          <section className="auth-card w-full max-w-[560px] p-6">
            <span className="eyebrow">Account recovery</span>
            <h1 className="mt-4 font-display text-[2.3rem] leading-none text-ink-900">
              Reset your password
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              Enter your email and we&apos;ll send a secure reset link if a Fliprop account exists for
              it.
            </p>

            {status === "success" ? (
              <div className="section-card mt-6 p-4 text-sm leading-6 text-verdigris-700">
                If that email exists in Fliprop, a reset link has been prepared. Check your inbox
                and spam folder for the next step.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="auth-label">
                    Workspace email
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

                {error ? <div className="section-card p-4 text-sm text-red-700">{error}</div> : null}

                <button type="submit" disabled={status === "submitting"} className="primary-action w-full">
                  {status === "submitting" ? "Preparing..." : "Send reset link"}
                  {status !== "submitting" ? <ArrowRightIcon className="ml-2 h-4 w-4" /> : null}
                </button>
              </form>
            )}

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link to="/login" className="ghost-action">
                Back to login
              </Link>
              <Link to="/signup" className="ghost-action">
                Create account
              </Link>
            </div>

            <PublicLegalLinks />
          </section>
        </main>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
