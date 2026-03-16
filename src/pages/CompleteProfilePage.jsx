import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import BrandLogo from "../components/BrandLogo";
import PublicLegalLinks from "../components/PublicLegalLinks";
import { useAuth } from "../context/AuthContext";
import { completeUserProfile } from "../utils/api";

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const { loading, refreshUser, user } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    phoneNumber: "",
    termsAccepted: false,
    marketingConsent: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((previous) => ({
        ...previous,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        companyName: user.companyName || "",
        phoneNumber: user.phoneNumber || "",
        marketingConsent: Boolean(user.consent?.marketingOptIn),
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!loading && user && !user.profileCompletionRequired) {
      navigate("/leads", { replace: true });
    }
  }, [loading, navigate, user]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    if (!formData.termsAccepted) {
      setError("You must accept the Terms of Use and Privacy Policy to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      await completeUserProfile(formData);
      await refreshUser();
      navigate("/leads", { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Unable to finish your profile.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="public-shell min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1180px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo caption="Google onboarding" />
          </Link>

          <div className="rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-ink-700">
            Step 1 of 1
          </div>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-12">
          <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-8">
            <section className="surface-panel-strong px-6 py-7 sm:px-8 reveal-up">
              <span className="eyebrow">Complete your workspace profile</span>
              <h1 className="mt-5 max-w-3xl font-display text-[2.9rem] leading-[0.96] text-ink-900 sm:text-[3.6rem]">
                Finish the details Google didn&apos;t cover.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
                We already secured your account. Add the contact details you want attached to the
                workspace and confirm the legal terms before entering the app.
              </p>

              <div className="section-card mt-6 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Google account
                </p>
                <p className="mt-3 text-lg font-semibold text-ink-900">{user?.email || "Loading..."}</p>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Your Google email is already linked. You can add or update the rest of your
                  operator profile here.
                </p>
              </div>
            </section>

            <section className="auth-card p-6 reveal-up" style={{ animationDelay: "90ms" }}>
              <span className="eyebrow">One last step</span>
              <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
                Finish setup
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                First name, last name, and legal acceptance are required. Company and phone stay optional.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                      autoComplete="family-name"
                      required
                    />
                  </div>
                </div>

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
                    number, marketing calls or text messages. Consent is optional and I can opt out
                    later.
                  </span>
                </label>

                {error ? <div className="section-card p-4 text-sm text-red-700">{error}</div> : null}

                <button type="submit" disabled={isSubmitting} className="primary-action w-full">
                  {isSubmitting ? "Saving..." : "Enter workspace"}
                  {!isSubmitting ? <ArrowRightIcon className="ml-2 h-4 w-4" /> : null}
                </button>
              </form>

              <PublicLegalLinks />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
