import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRightIcon,
  HomeModernIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { getPublicApplicationDetails, submitApplication } from "../utils/api";

const applicantFields = [
  { key: "fullName", label: "Full name", type: "text", placeholder: "Your full name" },
  { key: "email", label: "Email", type: "email", placeholder: "you@email.com" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "Phone number" },
  { key: "dateOfBirth", label: "Date of birth", type: "date", placeholder: "" },
];

const publicBenefits = [
  {
    title: "Secure submission",
    description: "Your details are submitted directly to the property manager for review.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Straightforward review",
    description: "Complete the form once and the property team can move you through payment and screening.",
    icon: UserGroupIcon,
  },
  {
    title: "Tied to the right unit",
    description: "This application is linked to the specific unit you were invited to apply for.",
    icon: HomeModernIcon,
  },
];

const emptyResidence = { address: "", rentAmount: "", duration: "" };
const emptyEmployment = { employer: "", position: "", monthlyIncome: "" };

const ApplicationFormPage = () => {
  const { unitId } = useParams();
  const [searchParams] = useSearchParams();

  const [unitInfo, setUnitInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formData, setFormData] = useState({
    applicantInfo: {
      fullName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
    },
    residenceHistory: [{ ...emptyResidence }],
    employmentHistory: [{ ...emptyEmployment }],
    agree: false,
  });

  useEffect(() => {
    const fetchUnitInfo = async () => {
      if (!unitId) {
        setLoadError("This application link is invalid.");
        setLoading(false);
        return;
      }

      try {
        const data = await getPublicApplicationDetails(unitId);
        setUnitInfo(data);
        setLoadError("");
      } catch (err) {
        setLoadError(err.message || "This application is no longer available.");
        toast.error(err.message || "Could not load unit info");
      } finally {
        setLoading(false);
      }
    };

    fetchUnitInfo();
  }, [unitId]);

  useEffect(() => {
    if (searchParams.get("payment") === "cancelled") {
      toast.error(
        "Payment was cancelled. Submit the form again when you're ready to complete the application fee."
      );
    }
  }, [searchParams]);

  const handleApplicantChange = (key, value) => {
    setFormData((current) => ({
      ...current,
      applicantInfo: {
        ...current.applicantInfo,
        [key]: value,
      },
    }));
  };

  const handleHistoryChange = (section, index, key, value) => {
    setFormData((current) => {
      const updated = current[section].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      );

      return {
        ...current,
        [section]: updated,
      };
    });
  };

  const addHistoryRow = (section, template) => {
    setFormData((current) => ({
      ...current,
      [section]: [...current[section], { ...template }],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.agree) {
      toast.error("You must agree to the terms.");
      return;
    }

    if (!unitInfo) {
      toast.error("This application link is no longer available.");
      return;
    }

    try {
      const payload = {
        unitId,
        ...formData,
      };
      const response = await submitApplication(payload);

      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
        return;
      }

      const paymentStatus = response.paymentStatus || "submitted";
      window.location.href = `/apply/success?payment=${encodeURIComponent(paymentStatus)}`;
    } catch (err) {
      toast.error(err.message || "Failed to submit application.");
    }
  };

  if (loading) {
    return (
      <div className="public-shell flex min-h-screen items-center justify-center px-4">
        <div className="auth-card px-8 py-10 text-center text-ink-500">Loading application...</div>
      </div>
    );
  }

  if (loadError || !unitInfo) {
    return (
      <div className="public-shell flex min-h-screen items-center justify-center px-4">
        <div className="auth-card max-w-2xl px-8 py-10 text-center">
          <span className="eyebrow">Application unavailable</span>
          <h1 className="mt-5 text-3xl font-semibold text-ink-900">This application link is not active</h1>
          <p className="mt-4 text-base leading-7 text-ink-500">
            {loadError || "This application link is no longer available."}
          </p>
          <Link to="/" className="ghost-action mt-6">
            Return home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="public-shell relative min-h-screen overflow-hidden text-ink-900">
      <div className="absolute inset-0 grid-fade opacity-30" />

      <div className="relative mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-lg font-bold text-white">
              MP
            </div>
            <div>
              <p className="font-display text-2xl leading-none text-ink-900">MyPropAI</p>
              <p className="mt-1 text-sm text-ink-500">Rental application</p>
            </div>
          </Link>

          <Link to="/" className="ghost-action">
            Return home
          </Link>
        </header>

        <main className="py-10 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12">
            <section className="flex flex-col justify-start">
              <span className="eyebrow">Application intake</span>
              <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.03] text-balance text-ink-900 sm:text-6xl">
                Apply for {unitInfo.unitName}.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600 sm:text-xl">
                Complete the form below to submit your rental application for this unit. The property manager will review your information and follow up on next steps.
              </p>

              <div className="mt-8 rounded-[28px] border border-ink-100 bg-white/80 p-6 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Unit details
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-ink-900">{unitInfo.address}</h2>
                <p className="mt-2 text-sm text-ink-500">Unit {unitInfo.unitName}</p>
                <div className="mt-6 rounded-[20px] bg-sand-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Application fee
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink-900">
                    ${unitInfo.applicationFee}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {publicBenefits.map((benefit) => (
                  <div key={benefit.title} className="section-card p-5">
                    <benefit.icon className="h-6 w-6 text-verdigris-600" />
                    <h3 className="mt-4 text-lg font-semibold text-ink-900">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-500">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="auth-card p-6 text-ink-900 sm:p-8">
              <span className="eyebrow">Applicant details</span>
              <h2 className="mt-4 text-3xl font-semibold text-ink-900">Complete your application</h2>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Fill in your personal information, housing history, and employment details. You may be redirected to pay the application fee after submitting.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-ink-900">Applicant information</h3>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    {applicantFields.map((field) => (
                      <div key={field.key} className={field.key === "fullName" || field.key === "email" ? "sm:col-span-2" : ""}>
                        <label htmlFor={field.key} className="auth-label">
                          {field.label}
                        </label>
                        <input
                          id={field.key}
                          type={field.type}
                          value={formData.applicantInfo[field.key]}
                          onChange={(event) => handleApplicantChange(field.key, event.target.value)}
                          className="auth-input"
                          placeholder={field.placeholder}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-ink-900">Residence history</h3>
                    <button
                      type="button"
                      onClick={() => addHistoryRow("residenceHistory", emptyResidence)}
                      className="ghost-action"
                    >
                      Add residence
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {formData.residenceHistory.map((item, index) => (
                      <div key={`residence-${index}`} className="rounded-[22px] border border-ink-100 bg-white px-4 py-4">
                        <p className="text-sm font-semibold text-ink-900">Residence #{index + 1}</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                          <div className="sm:col-span-3">
                            <label className="auth-label">Address</label>
                            <input
                              type="text"
                              value={item.address}
                              onChange={(event) =>
                                handleHistoryChange("residenceHistory", index, "address", event.target.value)
                              }
                              className="auth-input"
                              placeholder="Street address"
                              required
                            />
                          </div>
                          <div>
                            <label className="auth-label">Monthly rent</label>
                            <input
                              type="number"
                              value={item.rentAmount}
                              onChange={(event) =>
                                handleHistoryChange("residenceHistory", index, "rentAmount", event.target.value)
                              }
                              className="auth-input"
                              placeholder="0"
                              required
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="auth-label">Duration</label>
                            <input
                              type="text"
                              value={item.duration}
                              onChange={(event) =>
                                handleHistoryChange("residenceHistory", index, "duration", event.target.value)
                              }
                              className="auth-input"
                              placeholder="Example: 2 years"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-ink-900">Employment history</h3>
                    <button
                      type="button"
                      onClick={() => addHistoryRow("employmentHistory", emptyEmployment)}
                      className="ghost-action"
                    >
                      Add employer
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {formData.employmentHistory.map((item, index) => (
                      <div key={`employment-${index}`} className="rounded-[22px] border border-ink-100 bg-white px-4 py-4">
                        <p className="text-sm font-semibold text-ink-900">Employer #{index + 1}</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                          <div>
                            <label className="auth-label">Employer</label>
                            <input
                              type="text"
                              value={item.employer}
                              onChange={(event) =>
                                handleHistoryChange("employmentHistory", index, "employer", event.target.value)
                              }
                              className="auth-input"
                              placeholder="Employer name"
                              required
                            />
                          </div>
                          <div>
                            <label className="auth-label">Position</label>
                            <input
                              type="text"
                              value={item.position}
                              onChange={(event) =>
                                handleHistoryChange("employmentHistory", index, "position", event.target.value)
                              }
                              className="auth-input"
                              placeholder="Job title"
                              required
                            />
                          </div>
                          <div>
                            <label className="auth-label">Monthly income</label>
                            <input
                              type="number"
                              value={item.monthlyIncome}
                              onChange={(event) =>
                                handleHistoryChange("employmentHistory", index, "monthlyIncome", event.target.value)
                              }
                              className="auth-input"
                              placeholder="0"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-[22px] border border-ink-100 bg-sand-50 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={formData.agree}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, agree: event.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded border-ink-300 text-verdigris-600 focus:ring-verdigris-200"
                  />
                  <span className="text-sm leading-6 text-ink-600">
                    I certify that the information above is accurate and I agree to future screening as part of the application review process.
                  </span>
                </label>

                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="primary-action">
                    Submit application
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </button>
                  <Link to="/" className="ghost-action">
                    Cancel
                  </Link>
                </div>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ApplicationFormPage;
