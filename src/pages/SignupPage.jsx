import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import { API_BASE_URL } from "../config";
import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";
import { signupUser } from "../utils/api";

const workspaceUseCases = [
  {
    title: "Acquisitions",
    description: "Keep deals, assumptions, and decisions inside one clean workspace.",
  },
  {
    title: "Execution",
    description: "Manage rehab and leasing work without a crowded interface around it.",
  },
  {
    title: "Operations",
    description: "Review portfolio activity in a lighter daily command view.",
  },
];

const onboardingPromises = [
  "A smaller, simpler visual system from the first screen.",
  "A flatter interface with less blur, weight, and extra decoration.",
  "Direct access through Google or email once the account is created.",
];

const SignupPage = () => {
  const navigate = useNavigate();
  const { login, authenticated } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authenticated) {
      navigate("/leads", { replace: true });
    }
  }, [authenticated, navigate]);

  const handleChange = (event) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const handleGoogleSignup = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await signupUser(formData);
      login(data.token);
    } catch (err) {
      setError(err.message || "Failed to create account.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="public-shell min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1240px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo caption="Workspace onboarding" />
          </Link>

          <Link to="/login" className="ghost-action">
            Workspace login
          </Link>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-12">
          <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-8">
            <section className="flex flex-col justify-center reveal-up">
              <span className="eyebrow">New workspace account</span>
              <h1 className="mt-5 max-w-3xl font-display text-[2.9rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.6rem]">
                Create an account for the lighter Fliprop workspace.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
                This access is for owners, operators, and teams managing acquisitions, execution,
                and portfolio work.
              </p>

              <div className="surface-panel mt-7 p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                  Workspace fit
                </p>
                <div className="soft-list mt-4">
                  {workspaceUseCases.map((item) => (
                    <div key={item.title} className="py-4 first:pt-0 last:pb-0">
                      <h2 className="text-sm font-medium text-ink-900">{item.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-ink-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-card mt-4 p-5">
                <div className="soft-list">
                  {onboardingPromises.map((promise) => (
                    <div key={promise} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-sm leading-6 text-ink-600">{promise}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="auth-card p-6 reveal-up" style={{ animationDelay: "90ms" }}>
              <span className="eyebrow">Workspace onboarding</span>
              <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
                Create your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Start with email or continue with Google and step into the simplified shell.
              </p>

              <button onClick={handleGoogleSignup} type="button" className="secondary-action mt-5 w-full">
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
                  <label htmlFor="name" className="auth-label">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="auth-label">
                    Work email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
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
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="Create a secure password"
                    autoComplete="new-password"
                    required
                  />
                </div>

                {error && (
                  <div className="section-card p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="primary-action w-full">
                  {isSubmitting ? "Creating account..." : "Create account"}
                  {!isSubmitting && <ArrowRightIcon className="ml-2 h-4 w-4" />}
                </button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link to="/login" className="ghost-action">
                  Already have an account?
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

export default SignupPage;
