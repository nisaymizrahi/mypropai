import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  HomeModernIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import BrandLogo from "../components/BrandLogo";
import { getPublicApplicationDetails, submitApplication } from "../utils/api";

const applicantFields = [
  { key: "fullName", label: "Full name", type: "text", placeholder: "Your full name" },
  { key: "email", label: "Email", type: "email", placeholder: "you@email.com" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "Phone number" },
  { key: "dateOfBirth", label: "Date of birth", type: "date", placeholder: "" },
];

const applicationSteps = [
  {
    key: "applicant",
    label: "About you",
    title: "Tell us about yourself",
    description: "Start with the core contact and identity details for the primary applicant.",
  },
  {
    key: "residence",
    label: "Housing",
    title: "Add your housing history",
    description: "Share your recent residences so the property team can review rental stability.",
  },
  {
    key: "employment",
    label: "Employment",
    title: "Add your income details",
    description: "Provide current employment and income information for underwriting review.",
  },
  {
    key: "review",
    label: "Review",
    title: "Review and submit",
    description: "Confirm the information below and agree to the application terms.",
  },
];

const emptyResidence = {
  address: "",
  landlordName: "",
  landlordPhone: "",
  reasonForLeaving: "",
  rentAmount: "",
  duration: "",
};

const emptyEmployment = {
  employer: "",
  position: "",
  supervisorName: "",
  supervisorPhone: "",
  monthlyIncome: "",
  duration: "",
};

const LoadingCard = ({ children }) => (
  <div className="auth-card px-8 py-10 text-center text-ink-500">{children}</div>
);

const FormField = ({ label, id, className = "", ...inputProps }) => (
  <div className={className}>
    <label htmlFor={id} className="auth-label">
      {label}
    </label>
    <input id={id} className="auth-input" {...inputProps} />
  </div>
);

const SummaryItem = ({ label, value }) => (
  <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-ink-900">{value || "N/A"}</p>
  </div>
);

const ApplicationFormPage = () => {
  const { unitId } = useParams();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";

  const [unitInfo, setUnitInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      if (!unitId && !inviteToken) {
        setLoadError("This application link is invalid.");
        setLoading(false);
        return;
      }

      try {
        const data = await getPublicApplicationDetails(
          inviteToken ? { inviteToken } : { unitId }
        );
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
  }, [inviteToken, unitId]);

  useEffect(() => {
    if (searchParams.get("payment") === "cancelled") {
      toast.error(
        "Payment was cancelled. Submit the form again when you're ready to complete the application fee."
      );
    }
  }, [searchParams]);

  const currentStep = applicationSteps[activeStep];
  const applicationHeadline = unitInfo?.title || "Rental application";
  const applicationSummary =
    unitInfo?.summary ||
    "Complete this guided rental application and the property manager will review your information.";
  const unitSummaryLabel =
    unitInfo?.unitName ||
    (unitInfo?.applicationScope === "property" ? "Unit to be assigned" : "General application");
  const publicBenefits = useMemo(
    () => [
      {
        title: "Secure submission",
        description: "Your details are sent directly to the property manager for review.",
        icon: ShieldCheckIcon,
      },
      {
        title: "Guided review",
        description: "The property team can move you through payment and screening faster.",
        icon: UserGroupIcon,
      },
      {
        title:
          unitInfo?.applicationScope === "unit"
            ? "Unit-specific"
            : unitInfo?.applicationScope === "property"
              ? "Property-aware"
              : "Flexible placement",
        description:
          unitInfo?.applicationScope === "unit"
            ? "This application is tied to the exact unit you were invited to apply for."
            : unitInfo?.applicationScope === "property"
              ? "This application stays connected to the selected property even without a unit assignment."
              : "This application can be reviewed and matched to the right property later.",
        icon: HomeModernIcon,
      },
    ],
    [unitInfo?.applicationScope]
  );

  const completedStepCount = useMemo(() => {
    let completed = 0;

    if (
      formData.applicantInfo.fullName.trim() &&
      formData.applicantInfo.email.trim() &&
      formData.applicantInfo.phone.trim()
    ) {
      completed += 1;
    }

    if (
      formData.residenceHistory.every(
        (item) => item.address.trim() && item.rentAmount !== "" && item.duration.trim()
      )
    ) {
      completed += 1;
    }

    if (
      formData.employmentHistory.every(
        (item) => item.employer.trim() && item.position.trim() && item.monthlyIncome !== ""
      )
    ) {
      completed += 1;
    }

    if (formData.agree) {
      completed += 1;
    }

    return completed;
  }, [formData]);

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

  const removeHistoryRow = (section, index) => {
    setFormData((current) => {
      if (current[section].length === 1) {
        return current;
      }

      return {
        ...current,
        [section]: current[section].filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const validateCurrentStep = () => {
    if (activeStep === 0) {
      const { fullName, email, phone } = formData.applicantInfo;
      if (!fullName.trim() || !email.trim() || !phone.trim()) {
        toast.error("Please complete your name, email, and phone number.");
        return false;
      }
    }

    if (activeStep === 1) {
      const hasIncompleteResidence = formData.residenceHistory.some(
        (item) => !item.address.trim() || item.rentAmount === "" || !item.duration.trim()
      );

      if (hasIncompleteResidence) {
        toast.error("Please complete the required residence history fields.");
        return false;
      }
    }

    if (activeStep === 2) {
      const hasIncompleteEmployment = formData.employmentHistory.some(
        (item) => !item.employer.trim() || !item.position.trim() || item.monthlyIncome === ""
      );

      if (hasIncompleteEmployment) {
        toast.error("Please complete the required employment fields.");
        return false;
      }
    }

    if (activeStep === 3 && !formData.agree) {
      toast.error("You must agree to the application terms before submitting.");
      return false;
    }

    return true;
  };

  const goToNextStep = () => {
    if (!validateCurrentStep()) {
      return;
    }

    setActiveStep((current) => Math.min(current + 1, applicationSteps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPreviousStep = () => {
    setActiveStep((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateCurrentStep()) {
      return;
    }

    if (!unitInfo) {
      toast.error("This application link is no longer available.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        unitId,
        inviteToken: inviteToken || undefined,
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
      setIsSubmitting(false);
    }
  };

  const renderApplicantStep = () => (
    <div>
      <h3 className="text-lg font-semibold text-ink-900">Applicant information</h3>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {applicantFields.map((field) => (
          <FormField
            key={field.key}
            id={field.key}
            label={field.label}
            type={field.type}
            value={formData.applicantInfo[field.key]}
            onChange={(event) => handleApplicantChange(field.key, event.target.value)}
            placeholder={field.placeholder}
            required={field.key !== "dateOfBirth"}
            className={field.key === "fullName" || field.key === "email" ? "sm:col-span-2" : ""}
          />
        ))}
      </div>
    </div>
  );

  const renderResidenceStep = () => (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-ink-900">Residence history</h3>
        <button
          type="button"
          onClick={() => addHistoryRow("residenceHistory", emptyResidence)}
          className="ghost-action"
        >
          Add residence
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {formData.residenceHistory.map((item, index) => (
          <div key={`residence-${index}`} className="rounded-[20px] border border-ink-100 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-ink-900">Residence #{index + 1}</p>
              {formData.residenceHistory.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHistoryRow("residenceHistory", index)}
                  className="text-sm font-semibold text-clay-700 hover:text-clay-800"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField
                id={`residence-address-${index}`}
                label="Address"
                type="text"
                value={item.address}
                onChange={(event) =>
                  handleHistoryChange("residenceHistory", index, "address", event.target.value)
                }
                placeholder="Street address"
                required
                className="sm:col-span-2"
              />
              <FormField
                id={`residence-rent-${index}`}
                label="Monthly rent"
                type="number"
                min="0"
                value={item.rentAmount}
                onChange={(event) =>
                  handleHistoryChange("residenceHistory", index, "rentAmount", event.target.value)
                }
                placeholder="0"
                required
              />
              <FormField
                id={`residence-duration-${index}`}
                label="Duration"
                type="text"
                value={item.duration}
                onChange={(event) =>
                  handleHistoryChange("residenceHistory", index, "duration", event.target.value)
                }
                placeholder="Example: 2 years"
                required
              />
              <FormField
                id={`residence-landlord-name-${index}`}
                label="Landlord name"
                type="text"
                value={item.landlordName}
                onChange={(event) =>
                  handleHistoryChange(
                    "residenceHistory",
                    index,
                    "landlordName",
                    event.target.value
                  )
                }
                placeholder="Optional"
              />
              <FormField
                id={`residence-landlord-phone-${index}`}
                label="Landlord phone"
                type="tel"
                value={item.landlordPhone}
                onChange={(event) =>
                  handleHistoryChange(
                    "residenceHistory",
                    index,
                    "landlordPhone",
                    event.target.value
                  )
                }
                placeholder="Optional"
              />
              <FormField
                id={`residence-reason-${index}`}
                label="Reason for leaving"
                type="text"
                value={item.reasonForLeaving}
                onChange={(event) =>
                  handleHistoryChange(
                    "residenceHistory",
                    index,
                    "reasonForLeaving",
                    event.target.value
                  )
                }
                placeholder="Optional"
                className="sm:col-span-2"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEmploymentStep = () => (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-ink-900">Employment history</h3>
        <button
          type="button"
          onClick={() => addHistoryRow("employmentHistory", emptyEmployment)}
          className="ghost-action"
        >
          Add employer
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {formData.employmentHistory.map((item, index) => (
          <div key={`employment-${index}`} className="rounded-[20px] border border-ink-100 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-ink-900">Employer #{index + 1}</p>
              {formData.employmentHistory.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHistoryRow("employmentHistory", index)}
                  className="text-sm font-semibold text-clay-700 hover:text-clay-800"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField
                id={`employment-employer-${index}`}
                label="Employer"
                type="text"
                value={item.employer}
                onChange={(event) =>
                  handleHistoryChange("employmentHistory", index, "employer", event.target.value)
                }
                placeholder="Employer name"
                required
              />
              <FormField
                id={`employment-position-${index}`}
                label="Position"
                type="text"
                value={item.position}
                onChange={(event) =>
                  handleHistoryChange("employmentHistory", index, "position", event.target.value)
                }
                placeholder="Job title"
                required
              />
              <FormField
                id={`employment-income-${index}`}
                label="Monthly income"
                type="number"
                min="0"
                value={item.monthlyIncome}
                onChange={(event) =>
                  handleHistoryChange(
                    "employmentHistory",
                    index,
                    "monthlyIncome",
                    event.target.value
                  )
                }
                placeholder="0"
                required
              />
              <FormField
                id={`employment-duration-${index}`}
                label="Duration"
                type="text"
                value={item.duration}
                onChange={(event) =>
                  handleHistoryChange("employmentHistory", index, "duration", event.target.value)
                }
                placeholder="Example: 1 year"
              />
              <FormField
                id={`employment-supervisor-name-${index}`}
                label="Supervisor name"
                type="text"
                value={item.supervisorName}
                onChange={(event) =>
                  handleHistoryChange(
                    "employmentHistory",
                    index,
                    "supervisorName",
                    event.target.value
                  )
                }
                placeholder="Optional"
              />
              <FormField
                id={`employment-supervisor-phone-${index}`}
                label="Supervisor phone"
                type="tel"
                value={item.supervisorPhone}
                onChange={(event) =>
                  handleHistoryChange(
                    "employmentHistory",
                    index,
                    "supervisorPhone",
                    event.target.value
                  )
                }
                placeholder="Optional"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-ink-900">Application summary</h3>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          Review your details before submitting. You may be redirected to pay the application fee
          after the form is received.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryItem label="Applicant" value={formData.applicantInfo.fullName} />
        <SummaryItem label="Email" value={formData.applicantInfo.email} />
        <SummaryItem label="Phone" value={formData.applicantInfo.phone} />
        <SummaryItem
          label="Date of birth"
          value={
            formData.applicantInfo.dateOfBirth
              ? new Date(formData.applicantInfo.dateOfBirth).toLocaleDateString()
              : "Not provided"
          }
        />
        <SummaryItem
          label="Residences listed"
          value={`${formData.residenceHistory.length} record(s)`}
        />
        <SummaryItem
          label="Employers listed"
          value={`${formData.employmentHistory.length} record(s)`}
        />
      </div>

      <div className="rounded-[20px] border border-ink-100 bg-sand-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
          What happens next
        </p>
        <p className="mt-3 text-sm leading-6 text-ink-600">
          The property manager will receive your application immediately. If secure online payments
          are enabled for this property, you will be redirected to pay the application fee after you
          submit.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-[20px] border border-ink-100 bg-white px-4 py-4">
        <input
          type="checkbox"
          checked={formData.agree}
          onChange={(event) =>
            setFormData((current) => ({ ...current, agree: event.target.checked }))
          }
          className="mt-1 h-4 w-4 rounded border-ink-300 text-verdigris-600 focus:ring-verdigris-200"
        />
        <span className="text-sm leading-6 text-ink-600">
          I certify that the information above is accurate and I agree to future screening as part
          of the application review process.
        </span>
      </label>
    </div>
  );

  if (loading) {
    return (
      <div className="public-shell flex min-h-screen items-center justify-center px-4">
        <LoadingCard>Loading application...</LoadingCard>
      </div>
    );
  }

  if (loadError || !unitInfo) {
    return (
      <div className="public-shell flex min-h-screen items-center justify-center px-4">
        <div className="auth-card max-w-2xl px-8 py-10 text-center">
          <span className="eyebrow">Application unavailable</span>
          <h1 className="page-hero-title">This application link is not active</h1>
          <p className="page-hero-copy">{loadError || "This application link is no longer available."}</p>
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

      <div className="relative mx-auto max-w-[1460px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-4">
            <BrandLogo caption="Rental application" imageClassName="sm:h-12 sm:max-w-[190px]" />
          </Link>

          <Link to="/" className="ghost-action">
            Return home
          </Link>
        </header>

        <main className="py-8 lg:py-12">
          <div className="grid gap-8 xl:grid-cols-[minmax(320px,0.84fr)_minmax(0,1.16fr)] xl:gap-10">
            <section className="space-y-6">
              <div>
                <span className="eyebrow">Application intake</span>
                <h1 className="mt-6 max-w-3xl font-display text-4xl leading-[1.05] text-balance text-ink-900 sm:text-[3.75rem]">
                  {applicationHeadline}.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-ink-600">
                  {applicationSummary}
                </p>
              </div>

              <div className="section-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Application summary
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-ink-900">
                  {unitInfo.propertyAddress || unitInfo.ownerName || "General application"}
                </h2>
                <p className="mt-2 text-sm text-ink-500">{unitSummaryLabel}</p>
                <div className="mt-5 rounded-[18px] bg-sand-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Application fee
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink-900">${unitInfo.applicationFee}</p>
                </div>
              </div>

              <div className="section-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Progress
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-ink-900">
                      Step {activeStep + 1} of {applicationSteps.length}
                    </h2>
                  </div>
                  <div className="rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-ink-700">
                    {completedStepCount}/{applicationSteps.length} complete
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {applicationSteps.map((step, index) => {
                    const isActive = index === activeStep;
                    const isComplete = index < activeStep;

                    return (
                      <div
                        key={step.key}
                        className={`rounded-[18px] border px-4 py-4 ${
                          isActive
                            ? "border-verdigris-200 bg-verdigris-50"
                            : isComplete
                              ? "border-ink-100 bg-white"
                              : "border-ink-100 bg-sand-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                              isActive
                                ? "bg-verdigris-600 text-white"
                                : isComplete
                                  ? "bg-ink-900 text-white"
                                  : "bg-white text-ink-500"
                            }`}
                          >
                            {isComplete ? <CheckCircleIcon className="h-4 w-4" /> : index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink-900">{step.label}</p>
                            <p className="mt-1 text-sm leading-6 text-ink-500">{step.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
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
              <div className="rounded-[20px] bg-sand-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  {currentStep.label}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-ink-900">{currentStep.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-500">{currentStep.description}</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                {activeStep === 0 && renderApplicantStep()}
                {activeStep === 1 && renderResidenceStep()}
                {activeStep === 2 && renderEmploymentStep()}
                {activeStep === 3 && renderReviewStep()}

                <div className="flex flex-col gap-3 border-t border-ink-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm leading-6 text-ink-500">
                    {activeStep < applicationSteps.length - 1
                      ? "You can review and edit any section before submitting."
                      : "Submitting may redirect you to a secure application-fee checkout."}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {activeStep > 0 && (
                      <button type="button" onClick={goToPreviousStep} className="ghost-action">
                        <ArrowLeftIcon className="mr-2 h-5 w-5" />
                        Back
                      </button>
                    )}

                    {activeStep < applicationSteps.length - 1 ? (
                      <button type="button" onClick={goToNextStep} className="primary-action">
                        Continue
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSubmitting ? "Submitting..." : "Submit application"}
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </button>
                    )}
                  </div>
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
