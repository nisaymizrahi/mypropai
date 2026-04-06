import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import {
  createApplicationPaymentIntent,
  getApplicationDetails,
  updateApplicationStatus,
} from "../utils/api";

const statusStyles = {
  "Pending Payment": "bg-sand-100 text-sand-700",
  "Under Review": "bg-ink-100 text-ink-700",
  Approved: "bg-verdigris-50 text-verdigris-700",
  Denied: "bg-clay-100 text-clay-800",
};

const LoadingSpinner = () => (
  <div className="surface-panel flex items-center justify-center px-6 py-20">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-verdigris-100 border-t-verdigris-500" />
  </div>
);

const DetailSection = ({ eyebrow, title, children }) => (
  <div className="section-card p-6 sm:p-7">
    {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
    <h3 className="mt-4 text-2xl font-semibold text-ink-900">{title}</h3>
    <div className="mt-6 space-y-4">{children}</div>
  </div>
);

const InfoPair = ({ label, value }) => (
  <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-ink-900">{value || "N/A"}</p>
  </div>
);

const ActionButton = ({ className, ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
  />
);

const ApplicationDetailPage = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getApplicationDetails(id);
      setApplication(data);
    } catch (err) {
      setError(err.message || "Failed to load application details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (status) => {
    setIsActionLoading(true);
    try {
      await updateApplicationStatus(id, status);
      toast.success(`Application has been ${status.toLowerCase()}.`);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenFeeCheckout = async () => {
    setIsOpeningCheckout(true);
    try {
      const result = await createApplicationPaymentIntent(id);

      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
        toast.success(result.msg || "Opened a fresh fee checkout in a new tab.");
        return;
      }

      toast.success(result.msg || "Application fee is already marked as paid.");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to create a fee checkout session.");
    } finally {
      setIsOpeningCheckout(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    return <div className="section-card px-6 py-10 text-center text-clay-700">{error}</div>;
  }
  if (!application) {
    return <div className="section-card px-6 py-10 text-center text-ink-500">Application not found.</div>;
  }

  const propertyLabel =
    application.property?.address ||
    application.propertyAddressSnapshot ||
    "Portfolio-wide application";
  const unitLabel =
    application.unit?.name ||
    application.unitNameSnapshot ||
    (application.applicationScope === "property" ? "No unit selected" : "General application");
  const statusClass = statusStyles[application.status] || "bg-ink-100 text-ink-700";
  const residenceHistory = application.residenceHistory || [];
  const employmentHistory = application.employmentHistory || [];
  const applicationsQueueHref = application.property?._id
    ? `/applications?${new URLSearchParams({ propertyId: application.property._id }).toString()}`
    : "/applications";
  const reviewReadiness = application.feePaid
    ? application.status === "Under Review"
      ? "Ready for manager decision"
      : "Decision has already been recorded"
    : "Waiting for application fee";

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <span className="eyebrow">Application review</span>
            <h2 className="page-hero-title">
              {application.applicantInfo?.fullName || "Applicant record"}
            </h2>
            <p className="mt-3 text-lg text-ink-500">
              {unitLabel} at {propertyLabel}
            </p>
            <p className="page-hero-copy">
              Review the applicant profile, confirm the application fee status, and record an
              approval or denial decision with the supporting details in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={applicationsQueueHref} className="secondary-action">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to applications
              </Link>
              {application.property?._id && (
                <Link to={`/management/${application.property._id}`} className="secondary-action">
                  Open property
                </Link>
              )}
            </div>
          </div>

          <div className="section-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Current status
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink-900">{application.status}</h3>
              </div>
              <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusClass}`}>
                {application.status}
              </span>
            </div>

            <div className="mt-8 space-y-3">
              <div className="rounded-[18px] bg-sand-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Fee status
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {application.feePaid ? "Paid" : "Pending"}
                </p>
              </div>

              <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Review readiness
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-900">{reviewReadiness}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-card p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="eyebrow">Actions</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Application workflow controls</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
              Keep payment and decision handling tidy by opening a fresh fee checkout when needed
              and only approving or denying applications once they are under review.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {application.status === "Pending Payment" && (
              <ActionButton
                type="button"
                onClick={handleOpenFeeCheckout}
                disabled={isOpeningCheckout}
                className="bg-sand-500 text-white hover:bg-sand-600"
              >
                {isOpeningCheckout ? "Opening..." : "Open fee checkout"}
              </ActionButton>
            )}

            {application.status === "Under Review" && (
              <>
                <ActionButton
                  type="button"
                  onClick={() => handleStatusUpdate("Approved")}
                  disabled={isActionLoading}
                  className="bg-verdigris-600 text-white hover:bg-verdigris-700"
                >
                  Approve
                </ActionButton>
                <ActionButton
                  type="button"
                  onClick={() => handleStatusUpdate("Denied")}
                  disabled={isActionLoading}
                  className="bg-clay-600 text-white hover:bg-clay-700"
                >
                  Deny
                </ActionButton>
              </>
            )}
          </div>
        </div>

        {application.status === "Pending Payment" && (
          <div className="mt-6 rounded-[24px] border border-ink-100 bg-sand-50 p-5 text-sm leading-6 text-ink-600">
            The applicant must complete the application fee before this record moves into manager
            review.
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <DetailSection eyebrow="Applicant" title="Applicant information">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoPair label="Full name" value={application.applicantInfo?.fullName} />
              <InfoPair label="Email" value={application.applicantInfo?.email} />
              <InfoPair label="Phone" value={application.applicantInfo?.phone} />
              <InfoPair
                label="Date of birth"
                value={
                  application.applicantInfo?.dateOfBirth
                    ? new Date(application.applicantInfo.dateOfBirth).toLocaleDateString()
                    : "N/A"
                }
              />
              <InfoPair
                label="Consent recorded"
                value={
                  application.applicantConsent?.acceptedAt
                    ? new Date(application.applicantConsent.acceptedAt).toLocaleString()
                    : "Not recorded"
                }
              />
              <InfoPair
                label="Legal version"
                value={application.applicantConsent?.legalVersion || "Not recorded"}
              />
            </div>
          </DetailSection>

          <DetailSection eyebrow="Housing" title="Residence history">
            {residenceHistory.length > 0 ? (
              residenceHistory.map((item, index) => (
                <div key={`${item.address}-${index}`} className="rounded-[22px] border border-ink-100 bg-white p-5">
                  <p className="text-sm font-semibold text-ink-900">Previous residence #{index + 1}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoPair label="Address" value={item.address} />
                    <InfoPair
                      label="Monthly rent"
                      value={item.rentAmount ? `$${Number(item.rentAmount).toLocaleString()}` : "N/A"}
                    />
                    <InfoPair label="Duration" value={item.duration} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-ink-200 bg-sand-50 px-5 py-10 text-center text-ink-500">
                No residence history provided.
              </div>
            )}
          </DetailSection>

          <DetailSection eyebrow="Employment" title="Employment history">
            {employmentHistory.length > 0 ? (
              employmentHistory.map((item, index) => (
                <div key={`${item.employer}-${index}`} className="rounded-[22px] border border-ink-100 bg-white p-5">
                  <p className="text-sm font-semibold text-ink-900">Employer #{index + 1}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoPair label="Employer" value={item.employer} />
                    <InfoPair label="Position" value={item.position} />
                    <InfoPair
                      label="Gross monthly income"
                      value={item.monthlyIncome ? `$${Number(item.monthlyIncome).toLocaleString()}` : "N/A"}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-ink-200 bg-sand-50 px-5 py-10 text-center text-ink-500">
                No employment history provided.
              </div>
            )}
          </DetailSection>
        </div>

        <div className="space-y-6">
          <DetailSection eyebrow="Summary" title="Decision snapshot">
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-[20px] bg-sand-50 px-4 py-4">
                <ClipboardDocumentListIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-sand-700" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">Application status</p>
                  <p className="mt-1 text-sm leading-6 text-ink-500">{application.status}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[20px] bg-white px-4 py-4 ring-1 ring-ink-100">
                <BanknotesIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-verdigris-700" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">Fee status</p>
                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    {application.feePaid ? "Payment confirmed" : "Payment still pending"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[20px] bg-white px-4 py-4 ring-1 ring-ink-100">
                <ClipboardDocumentListIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink-700" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">Next step</p>
                  <p className="mt-1 text-sm leading-6 text-ink-500">{reviewReadiness}</p>
                </div>
              </div>
            </div>
          </DetailSection>

          <DetailSection eyebrow="Review" title="Review guidance">
            <div className="rounded-[22px] border border-dashed border-ink-200 bg-sand-50 px-5 py-10 text-center text-ink-500">
              Use the applicant information, housing history, and employment details on this page
              as the source of truth for your review decision.
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-[20px] border border-ink-100 bg-white px-4 py-4">
                <UserCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink-700" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">Applicant record</p>
                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    Keep this page as the source of truth while the application moves from payment
                    to decision.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[20px] border border-ink-100 bg-white px-4 py-4">
                {application.status === "Approved" ? (
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-verdigris-700" />
                ) : application.status === "Denied" ? (
                  <XCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-clay-700" />
                ) : (
                  <ClipboardDocumentListIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-sand-700" />
                )}
                <div>
                  <p className="text-sm font-semibold text-ink-900">Decision posture</p>
                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    {application.status === "Approved"
                      ? "This application has already been approved."
                      : application.status === "Denied"
                        ? "This application has already been denied."
                        : "This application is still in progress and ready for the next action."}
                  </p>
                </div>
              </div>
            </div>
          </DetailSection>
        </div>
      </section>
    </div>
  );
};

export default ApplicationDetailPage;
