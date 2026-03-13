import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";

import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { signupUser } from "../utils/api";

const managerUseCases = [
  {
    title: "Track investments",
    description: "Create a shared system for acquisitions, ROI, and property performance.",
    icon: ChartBarIcon,
  },
  {
    title: "Run leasing workflows",
    description: "Manage applications, approvals, leases, and day-to-day property tasks.",
    icon: ClipboardDocumentListIcon,
  },
  {
    title: "Operate at portfolio level",
    description: "Keep properties, tenants, and reporting inside one organized workspace.",
    icon: HomeModernIcon,
  },
];

const SignupPage = () => {
  const navigate = useNavigate();
  const { login, authenticated } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authenticated) {
      navigate("/dashboard", { replace: true });
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
              <p className="mt-1 text-sm text-ink-500">Create a manager account</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/tenant-login" className="secondary-action hidden sm:inline-flex">
              Tenant portal
            </Link>
            <Link to="/login" className="ghost-action">
              Manager login
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-16">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12">
            <section className="flex flex-col justify-center">
              <span className="eyebrow">New manager account</span>
              <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.03] text-balance text-ink-900 sm:text-6xl">
                Create your workspace for investing, operations, and tenant workflows.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600 sm:text-xl">
                This account is for owners, operators, and property managers. If you are a tenant,
                use the tenant portal instead of creating a manager account.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {managerUseCases.map((item) => (
                  <div key={item.title} className="section-card p-5">
                    <item.icon className="h-6 w-6 text-verdigris-600" />
                    <h2 className="mt-4 text-lg font-semibold text-ink-900">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="auth-card p-6 text-ink-900 sm:p-8">
              <span className="eyebrow">Manager onboarding</span>
              <h2 className="mt-4 font-display text-4xl text-ink-900">Create your account</h2>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Get started with email or continue with Google. Once you are in, you can begin
                adding properties, deals, leads, and tenant workflows.
              </p>

              <div className="mt-6 rounded-[24px] border border-verdigris-100 bg-verdigris-50/80 p-4 text-sm text-verdigris-800">
                This sign up is for managers and operators. Tenants should wait for an invite and
                sign in through the tenant portal.
              </div>

              <button onClick={handleGoogleSignup} type="button" className="secondary-action mt-6 w-full">
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
                  <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="primary-action w-full">
                  {isSubmitting ? "Creating account..." : "Create manager account"}
                  {!isSubmitting && <ArrowRightIcon className="ml-2 h-5 w-5" />}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/login" className="ghost-action">
                  Already have an account?
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

export default SignupPage;
