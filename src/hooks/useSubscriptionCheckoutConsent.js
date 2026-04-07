import { createElement, useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";

import SubscriptionConsentDialog from "../components/SubscriptionConsentDialog";
import { LEGAL_VERSION } from "../content/legalDocuments";
import { createSubscriptionCheckout } from "../utils/api";

const useSubscriptionCheckoutConsent = ({
  planKey = "pro",
  monthlyPriceCents = null,
  trialPeriodDays = 0,
  trialEligible = false,
  source = "subscription_checkout",
  onError = null,
} = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isStartingSubscription, setIsStartingSubscription] = useState(false);

  const openSubscriptionConsent = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSubscriptionConsent = useCallback(() => {
    if (!isStartingSubscription) {
      setIsOpen(false);
    }
  }, [isStartingSubscription]);

  const confirmSubscriptionConsent = useCallback(async () => {
    setIsStartingSubscription(true);

    try {
      const { url } = await createSubscriptionCheckout({
        planKey,
        subscriptionConsent: {
          accepted: true,
          acceptedAt: new Date().toISOString(),
          autoRenewDisclosureAccepted: true,
          nonRefundableDisclosureAccepted: true,
          legalVersion: LEGAL_VERSION,
          source,
        },
      });

      window.location.href = url;
    } catch (error) {
      if (typeof onError === "function") {
        onError(error);
      } else {
        toast.error(error.message || "Could not start the Pro checkout.");
      }

      setIsStartingSubscription(false);
    }
  }, [onError, planKey, source]);

  const subscriptionConsentDialog = useMemo(
    () =>
      createElement(SubscriptionConsentDialog, {
        open: isOpen,
        onClose: closeSubscriptionConsent,
        onConfirm: confirmSubscriptionConsent,
        isSubmitting: isStartingSubscription,
        trialEligible,
        trialPeriodDays,
        monthlyPriceCents,
      }),
    [
      closeSubscriptionConsent,
      confirmSubscriptionConsent,
      isOpen,
      isStartingSubscription,
      monthlyPriceCents,
      trialEligible,
      trialPeriodDays,
    ]
  );

  return {
    openSubscriptionConsent,
    isStartingSubscription,
    subscriptionConsentDialog,
  };
};

export default useSubscriptionCheckoutConsent;
