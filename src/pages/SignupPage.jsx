import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import { API_BASE_URL } from "../config";
import BrandLogo from "../components/BrandLogo";
import PublicLegalLinks from "../components/PublicLegalLinks";
import Seo from "../components/Seo";
import { useAuth } from "../context/AuthContext";
import { trackAnalyticsEvent } from "../utils/analytics";
import { signupUser } from "../utils/api";

const workspaceUseCases = [
  {
    title: "Acquisitions",
    description: "Keep pricing, notes, and decisions in one place.",
  },
  {
    title: "Execution",
    description: "Coordinate tasks, vendors, and rehab work without tool sprawl.",
  },
  {
    title: "Property operations",
    description: "Keep documents, property context, and daily work tied together.",
  },
];

const onboardingPromises = [
  "Start on Starter, then upgrade when Pro workflows become useful.",
  "Required fields stay tight: first name, last name, email, and password.",
  "Google signup can collect missing details after sign-in.",
];

const initialFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  companyName: "",
  phoneNumber: "",
  termsAccepted: false,
  marketingConsent: false,
};

const SignupPage = () => {
  const navigate = useNavigate();
  const { authenticated, login, user } = useAuth();
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authenticated) {
      navigate(user?.profileCompletionRequired ? "/complete-profile" : "/leads", {
        replace: true,
      });
    }
  }, [authenticated, navigate, user]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleGoogleSignup = () => {
    trackAnalyticsEvent("workspace_signup_google_started", {
      page_section: "auth",
      auth_method: "google",
      interaction_location: "signup_form",
    });
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setError("First name, last name, email, and password are required.");
      return;
    }

    if (!formData.termsAccepted) {
      setError("You must accept the Terms of Use and Privacy Policy to continue.");
      return;
    }

    trackAnalyticsEvent("workspace_signup_submitted", {
      page_section: "auth",
      auth_method: "email",
      interaction_location: "signup_form",
    });

    setIsSubmitting(true);

    try {
      const data = await signupUser(formData);
      trackAnalyticsEvent("workspace_signup_completed", {
        page_section: "auth",
        auth_method: "email",
      });
      login(data.token);
    } catch (err) {
      setError(err.message || "Failed to create account.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="public-shell min-h-screen text-ink-900">
      <Seo
        title="Create your workspace | Fliprop"
        description="Start a Fliprop workspace for acquisitions, execution, and property operations."
        path="/signup"
        section="auth"
      />
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo caption="Workspace onboarding" />
          </Link>

          <Link to="/login" className="ghost-action">
            Workspace login
          </Link>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-12">
          <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-8">
            <section className="flex flex-col justify-center reveal-up">
              <span className="eyebrow">New workspace account</span>
              <h1 className="mt-5 max-w-3xl font-display text-[2.9rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.6rem]">
                Create your Fliprop workspace.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
                Get one place for deals, property work, documents, and financial workflows.
              </p>

              <div className="surface-panel mt-7 p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                  Built for
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
                Start with email or continue with Google.
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="auth-label">
                      First name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="Nisa"
                      autoComplete="given-name"
                      required
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
                      value={formData.lastName}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="Mizrahi"
                      autoComplete="family-name"
                      required
                    />
                  </div>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="companyName" className="auth-label">
                      Company name
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="Optional"
                      autoComplete="organization"
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
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="Optional"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-[20px] bg-sand-50 px-4 py-4 text-sm leading-6 text-ink-600">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900"
                    required
                  />
                  <span>
                    I agree to the{" "}
                    <Link to="/terms" className="font-semibold text-ink-900 underline underline-offset-4">
                      Terms of Use
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="font-semibold text-ink-900 underline underline-offset-4">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-[20px] bg-white px-4 py-4 text-sm leading-6 text-ink-600 ring-1 ring-ink-100">
                  <input
                    type="checkbox"
                    name="marketingConsent"
                    checked={formData.marketingConsent}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900"
                  />
                  <span>
                    I agree that Fliprop may send me marketing emails and, if I provide a phone
                    number, marketing calls or text messages. Consent is optional and I can opt out later.
                  </span>
                </label>

                {error ? <div className="section-card p-4 text-sm text-red-700">{error}</div> : null}

                <button type="submit" disabled={isSubmitting} className="primary-action w-full">
                  {isSubmitting ? "Creating account..." : "Create account"}
                  {!isSubmitting ? <ArrowRightIcon className="ml-2 h-4 w-4" /> : null}
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

              <PublicLegalLinks />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SignupPage;
