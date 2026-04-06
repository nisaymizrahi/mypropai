import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";

import { confirmApplicationPayment } from "../utils/api";

const ApplicationSuccessPage = () => {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(
    "We are confirming your application and payment status."
  );

  useEffect(() => {
    const syncPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      const paymentState = params.get("payment");

      if (!sessionId) {
        if (paymentState === "manual_followup") {
          setStatus("warning");
          setMessage(
            "Your application was received, but secure online payment is not available for this property yet. The property manager will follow up with you."
          );
          return;
        }

        setStatus("success");
        setMessage("Thank you for applying. Your application has been received.");
        return;
      }

      try {
        const result = await confirmApplicationPayment(sessionId);
        if (result.feePaid) {
          setStatus("success");
          setMessage(
            "Your application and payment were received successfully. A property manager will review everything shortly."
          );
          return;
        }

        setStatus("warning");
        setMessage(
          "Your application was received, but the payment is still pending. Please watch for a confirmation email from Stripe."
        );
      } catch (error) {
        setStatus("warning");
        setMessage(
          error.message ||
            "Your application was received, but we could not confirm the payment yet."
        );
      }
    };

    syncPayment();
  }, []);

  const isWarning = status === "warning";

  return (
    <div className="public-shell relative min-h-screen overflow-hidden text-ink-900">
      <div className="absolute inset-0 grid-fade opacity-30" />

      <div className="relative mx-auto flex min-h-screen max-w-[1200px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="auth-card w-full p-8 text-center sm:p-10">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
              isWarning ? "bg-sand-100 text-sand-700" : "bg-verdigris-50 text-verdigris-700"
            }`}
          >
            {isWarning ? (
              <ExclamationTriangleIcon className="h-10 w-10" />
            ) : (
              <CheckCircleIcon className="h-10 w-10" />
            )}
          </div>

          <span className="eyebrow mt-6">
            {isWarning ? "Application received" : "Application submitted"}
          </span>
          <h1 className="mt-5 text-4xl font-semibold text-ink-900">
            {isWarning ? "Application received" : "Thank you for applying"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-500">{message}</p>

          <div className="mx-auto mt-8 max-w-xl rounded-[24px] border border-ink-100 bg-sand-50 p-5 text-left">
            <div className="flex items-start gap-3">
              <HomeModernIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-verdigris-700" />
              <div>
                <p className="text-sm font-semibold text-ink-900">What happens next</p>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  The property manager will review your application details and follow up if anything else is needed. Keep an eye on your email for payment or application-status updates.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/" className="primary-action">
              Return home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSuccessPage;
