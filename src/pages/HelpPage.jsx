import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRightIcon,
  BugAntIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

import BrandLogo from "../components/BrandLogo";
import PublicLegalLinks from "../components/PublicLegalLinks";
import { LEGAL_CONTACT_EMAIL } from "../content/legalDocuments";
import { useAuth } from "../context/AuthContext";
import { submitSupportRequest } from "../utils/api";

const helpTopics = [
  {
    title: "Ask a question",
    description: "Share product, workflow, or setup questions and we’ll point you in the right direction.",
    icon: QuestionMarkCircleIcon,
  },
  {
    title: "Report an issue",
    description: "Tell us what broke, what page you were on, and what you expected to happen.",
    icon: BugAntIcon,
  },
  {
    title: "Get account help",
    description: "Use this for login trouble, workspace access, billing questions, or account changes.",
    icon: CreditCardIcon,
  },
];

const responseTips = [
  "Include the page or feature name if something is not working.",
  "Describe what you expected to happen and what happened instead.",
  "Add any timing, browser, or account details that will help us reproduce the issue.",
];

const initialFormState = {
  name: "",
  email: "",
  companyName: "",
  requestType: "general_question",
  subject: "",
  message: "",
  pageUrl: "",
};

const HelpPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormState);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [referenceCode, setReferenceCode] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromParam = params.get("from");

    setFormData((current) => ({
      ...current,
      name: current.name || user?.name || "",
      email: current.email || user?.email || "",
      companyName: current.companyName || user?.companyName || "",
      pageUrl: current.pageUrl || fromParam || "",
    }));
  }, [location.search, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      const payload = await submitSupportRequest({
        ...formData,
        source: "website_help_center",
      });

      setReferenceCode(payload?.request?.referenceCode || "");
      setStatus("success");
      setFormData((current) => ({
        ...initialFormState,
        name: current.name,
        email: current.email,
        companyName: current.companyName,
      }));
    } catch (submitError) {
      setError(submitError.message || "We couldn't submit your request right now.");
      setStatus("idle");
    }
  };

  return (
    <div className="public-shell min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo caption="Help and support" />
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/login" className="ghost-action">
              Workspace login
            </Link>
            <Link to="/signup" className="primary-action">
              Create account
            </Link>
          </div>
        </header>

        <main className="flex-1 py-10 lg:py-12">
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="surface-panel-strong px-6 py-7 sm:px-8 sm:py-8">
              <span className="eyebrow">Help center</span>
              <h1 className="mt-4 max-w-3xl font-display text-[2.7rem] leading-[0.98] text-ink-900 sm:text-[3.4rem]">
                Contact us when you need answers, account help, or a place to report issues.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
                Use this page to ask questions about Fliprop, report a bug, or tell us what you
                need help with on the site. The more detail you share, the faster we can help.
              </p>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {helpTopics.map((topic) => (
                  <div key={topic.title} className="section-card p-4">
                    <topic.icon className="h-5 w-5 text-verdigris-700" />
                    <h2 className="mt-3 text-base font-medium text-ink-900">{topic.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-500">{topic.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="section-card p-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                    What helps most
                  </p>
                  <div className="mt-4 space-y-3">
                    {responseTips.map((tip) => (
                      <div key={tip} className="flex gap-3">
                        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-verdigris-700" />
                        <p className="text-sm leading-6 text-ink-600">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="section-card p-5">
                  <div className="flex items-center gap-3">
                    <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl">
                      <EnvelopeIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">Prefer email?</p>
                      <a
                        href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                        className="text-sm text-verdigris-700 underline decoration-verdigris-300 underline-offset-4"
                      >
                        {LEGAL_CONTACT_EMAIL}
                      </a>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink-500">
                    You can reach out directly, but the form on this page is the best way to send a
                    detailed question or issue report.
                  </p>
                </div>
              </div>
            </div>

            <section className="auth-card p-6">
              <div className="flex items-center gap-3">
                <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                    Contact us
                  </p>
                  <h2 className="mt-1 text-xl font-medium text-ink-900">Send a support request</h2>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-ink-500">
                We’ll use this information to follow up about your question, issue, or help request.
              </p>

              {status === "success" ? (
                <div className="section-card mt-6 p-5">
                  <p className="text-sm font-medium text-verdigris-700">Request received</p>
                  <h3 className="mt-2 text-lg font-medium text-ink-900">
                    Thanks, your message is in our queue.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-600">
                    We saved your request and will use the email you provided to follow up.
                    {referenceCode ? ` Reference: ${referenceCode}.` : ""}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setStatus("idle");
                        setReferenceCode("");
                      }}
                      className="secondary-action"
                    >
                      Send another request
                    </button>
                    <Link to="/" className="ghost-action">
                      Back to homepage
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="auth-label">
                        Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="auth-input"
                        placeholder="Your name"
                        autoComplete="name"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="auth-label">
                        Email
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
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="companyName" className="auth-label">
                        Company or workspace
                      </label>
                      <input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="auth-input"
                        placeholder="Optional"
                        autoComplete="organization"
                      />
                    </div>

                    <div>
                      <label htmlFor="requestType" className="auth-label">
                        What do you need help with?
                      </label>
                      <select
                        id="requestType"
                        name="requestType"
                        value={formData.requestType}
                        onChange={handleChange}
                        className="auth-input appearance-none"
                        required
                      >
                        <option value="general_question">General question</option>
                        <option value="report_issue">Report an issue</option>
                        <option value="account_help">Account help</option>
                        <option value="billing_help">Billing help</option>
                        <option value="feature_request">Feature request</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="auth-label">
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="Short summary of your question or issue"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="pageUrl" className="auth-label">
                      Page or feature
                    </label>
                    <input
                      id="pageUrl"
                      name="pageUrl"
                      value={formData.pageUrl}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="Optional: /properties/123 or billing page"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="auth-label">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="auth-input min-h-[180px]"
                      placeholder="Tell us what happened, what you expected, and any details that will help us respond."
                      required
                    />
                  </div>

                  {error ? <div className="section-card p-4 text-sm text-red-700">{error}</div> : null}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="primary-action w-full justify-center"
                  >
                    {status === "submitting" ? "Sending..." : "Send support request"}
                    {status !== "submitting" ? <ArrowRightIcon className="ml-2 h-4 w-4" /> : null}
                  </button>
                </form>
              )}

              <PublicLegalLinks className="mt-6 justify-start" />
            </section>
          </section>
        </main>
      </div>
    </div>
  );
};

export default HelpPage;
