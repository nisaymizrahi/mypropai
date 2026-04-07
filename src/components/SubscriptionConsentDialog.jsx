import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export const formatSubscriptionPrice = (monthlyPriceCents) => {
  const normalized = Number(monthlyPriceCents);

  if (!Number.isFinite(normalized)) {
    return "the current monthly price";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(normalized / 100);
};

export const buildSubscriptionDisclosureText = ({
  trialEligible = false,
  trialPeriodDays = 0,
  monthlyPriceCents = null,
}) => {
  const formattedPrice = formatSubscriptionPrice(monthlyPriceCents);

  if (trialEligible && trialPeriodDays > 0) {
    return `Starts with a ${trialPeriodDays}-day free trial. Unless you cancel before the trial ends, Pro renews automatically at ${formattedPrice} per month until canceled. Charges are non-refundable except where required by law.`;
  }

  return `Pro renews automatically at ${formattedPrice} per month until canceled. Charges are non-refundable except where required by law.`;
};

export const SubscriptionLegalNotice = ({
  trialEligible = false,
  trialPeriodDays = 0,
  monthlyPriceCents = null,
  className = "",
}) => {
  const disclosureText = useMemo(
    () =>
      buildSubscriptionDisclosureText({
        trialEligible,
        trialPeriodDays,
        monthlyPriceCents,
      }),
    [monthlyPriceCents, trialEligible, trialPeriodDays]
  );

  return (
    <div className={`rounded-[20px] border border-ink-100 bg-white px-4 py-4 text-sm leading-6 text-ink-600 ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
        Subscription terms
      </p>
      <p className="mt-2">{disclosureText}</p>
      <p className="mt-2">
        Payment details are collected through Stripe. After checkout, you can manage or cancel the
        subscription from the billing portal in your account.
      </p>
    </div>
  );
};

const SubscriptionConsentDialog = ({
  open = false,
  onClose,
  onConfirm,
  isSubmitting = false,
  trialEligible = false,
  trialPeriodDays = 0,
  monthlyPriceCents = null,
}) => {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!open) {
      setAgreed(false);
    }
  }, [open]);

  const disclosureText = useMemo(
    () =>
      buildSubscriptionDisclosureText({
        trialEligible,
        trialPeriodDays,
        monthlyPriceCents,
      }),
    [monthlyPriceCents, trialEligible, trialPeriodDays]
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-consent-title"
        className="w-full max-w-xl rounded-[28px] border border-white/70 bg-[#fcfaf7] p-6 shadow-soft sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Pro checkout
            </p>
            <h3 id="subscription-consent-title" className="mt-3 text-2xl font-semibold text-ink-900">
              {trialEligible ? "Confirm your free trial terms" : "Confirm your Pro subscription terms"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-ink-200 px-3 py-1.5 text-sm font-semibold text-ink-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>

        <SubscriptionLegalNotice
          trialEligible={trialEligible}
          trialPeriodDays={trialPeriodDays}
          monthlyPriceCents={monthlyPriceCents}
          className="mt-5 bg-white/80"
        />

        <label className="mt-5 flex items-start gap-3 rounded-[20px] border border-ink-100 bg-white px-4 py-4 text-sm leading-6 text-ink-600">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900"
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
            , and I understand that {disclosureText.toLowerCase()}
          </span>
        </label>

        <p className="mt-4 text-sm leading-6 text-ink-500">
          Continue to Stripe to finish setup with secure payment details.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="secondary-action justify-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!agreed || isSubmitting}
            className="primary-action justify-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Redirecting..." : "Agree and continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionConsentDialog;
