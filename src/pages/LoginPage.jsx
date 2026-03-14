import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import { API_BASE_URL } from "../config";
import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../utils/api";

const workspaceNotes = [
  {
    title: "Deal review",
    description: "A cleaner shell for acquisitions, underwriting, and next actions.",
  },
  {
    title: "Portfolio operations",
    description: "Less chrome around the day-to-day work of leasing and management.",
  },
  {
    title: "Reporting",
    description: "A simpler visual layer for summaries, updates, and internal handoff.",
  },
];

const accessPrinciples = [
  "Smaller typography and flatter panels keep the page easier to scan.",
  "Google and email sign in stay visible without competing blocks around them.",
  "The overall palette remains warm, but the interface now feels quieter.",
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
      navigate("/leads", { replace: true });
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
    <div className="public-shell min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1240px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo caption="Workspace access" />
          </Link>

          <div className="flex items-center gap-2.5">
            <Link to="/signup" className="primary-action">
              Create account
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-12">
          <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-8">
            <section className="flex flex-col justify-center reveal-up">
              <span className="eyebrow">Workspace login</span>
              <h1 className="mt-5 max-w-3xl font-display text-[2.9rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.6rem]">
                Sign in to the lighter version of the Fliprop workspace.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
                Use this access if you manage acquisitions, operations, reporting, or portfolio
                decisions.
              </p>

              <div className="surface-panel mt-7 p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                  What changed
                </p>
                <div className="soft-list mt-4">
                  {workspaceNotes.map((note) => (
                    <div key={note.title} className="py-4 first:pt-0 last:pb-0">
                      <h2 className="text-sm font-medium text-ink-900">{note.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-ink-600">{note.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-card mt-4 p-5">
                <div className="soft-list">
                  {accessPrinciples.map((principle) => (
                    <div key={principle} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-sm leading-6 text-ink-600">{principle}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="auth-card p-6 reveal-up" style={{ animationDelay: "90ms" }}>
              <span className="eyebrow">Secure sign in</span>
              <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
                Welcome back
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Continue with Google or use your workspace email and password.
              </p>

              {oauthMessage && (
                <div className="section-card mt-5 p-4 text-sm leading-6 text-clay-700">
                  {oauthMessage}
                </div>
              )}

              <button onClick={handleGoogleLogin} type="button" className="secondary-action mt-5 w-full">
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-4">
                <div className="h-px flex-1 bg-ink-100" />
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                  Or use email
                </p>
                <div className="h-px flex-1 bg-ink-100" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label htmlFor="password" className="auth-label">
                    Password
                  </label>
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
                  <div className="section-card p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="primary-action w-full">
                  {isSubmitting ? "Signing in..." : "Sign in"}
                  {!isSubmitting && <ArrowRightIcon className="ml-2 h-4 w-4" />}
                </button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link to="/signup" className="ghost-action">
                  Create account
                </Link>
                <Link to="/" className="ghost-action">
                  Homepage
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
