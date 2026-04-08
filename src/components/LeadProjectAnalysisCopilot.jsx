import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import { askLeadProjectAnalysisCopilot } from "../utils/api";

const buildAssistantMessage = ({ leadAddress }) => ({
  id: "lead-project-analysis-copilot-welcome",
  role: "assistant",
  content: leadAddress
    ? `I can help pressure-test scenarios for ${leadAddress}. Ask me to compare strategies, suggest a rehab assumption, or sanity-check the ARV before you apply any changes.`
    : "I can help pressure-test scenarios, suggest a rehab assumption, or sanity-check the ARV before you apply any changes.",
  patches: null,
});

const quickPrompts = [
  "Compare light cosmetic versus full gut for this deal",
  "What scenario looks safest right now?",
  "Suggest a better rehab and ARV assumption for the selected scenario",
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value) => {
  if (!Number.isFinite(Number(value))) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const buildLocalFallbackMessage = ({
  leadAddress,
  leadSnapshot = {},
  scenarios = [],
}) => {
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    return leadAddress
      ? `The live project analysis assistant is temporarily unavailable for ${leadAddress}. Add at least one scenario in the Scenario Lab and try again once the backend is refreshed.`
      : "The live project analysis assistant is temporarily unavailable. Add at least one scenario in the Scenario Lab and try again once the backend is refreshed.";
  }

  const acquisitionBasis =
    toNumber(leadSnapshot?.targetOffer, null) ?? toNumber(leadSnapshot?.sellerAskingPrice, 0);

  const strongestScenario = scenarios
    .map((scenario) => {
      const rehabEstimate = toNumber(scenario?.rehabEstimate, 0);
      const arv = toNumber(scenario?.arv, 0);
      const holdingMonths = Math.max(toNumber(scenario?.holdingMonths, 6) || 6, 0);
      const holdingCost = Math.round(acquisitionBasis * 0.006 * holdingMonths);
      const totalProjectCost = acquisitionBasis + rehabEstimate + holdingCost;
      const projectedProfit = arv - totalProjectCost;

      return {
        scenarioId: String(scenario?.scenarioId || ""),
        label: scenario?.label || "Scenario",
        rehabEstimate,
        arv,
        holdingMonths,
        extensionPlanned: Boolean(scenario?.extensionPlanned),
        extensionSquareFootage: toNumber(scenario?.extensionSquareFootage, 0),
        totalProjectCost,
        projectedProfit,
      };
    })
    .sort((left, right) => (right.projectedProfit || 0) - (left.projectedProfit || 0))[0];

  if (!strongestScenario) {
    return "The live project analysis assistant is temporarily unavailable. Try again in a moment.";
  }

  const caution =
    strongestScenario.projectedProfit < 0
      ? "This draft is still underwater on the current assumptions, so tighten the acquisition, rehab, or resale case before moving forward."
      : !strongestScenario.arv
        ? "The ARV still needs to be filled in before this read is decision-ready."
        : !strongestScenario.rehabEstimate
          ? "The rehab estimate still needs a real scope number before this read is trustworthy."
          : strongestScenario.extensionPlanned && !strongestScenario.extensionSquareFootage
            ? "The extension scenario still needs square footage and contractor pricing before you trust it."
            : "Validate the rehab scope and resale comps with contractor feedback before treating this as a final decision.";

  return [
    `The live project analysis assistant is temporarily unavailable, so here is a local planning read${
      leadAddress ? ` for ${leadAddress}` : ""
    }.`,
    `Best current draft: ${strongestScenario.label}.`,
    `Projected spread is about ${formatCurrency(strongestScenario.projectedProfit)} on ${formatCurrency(
      strongestScenario.arv
    )} ARV, ${formatCurrency(strongestScenario.rehabEstimate)} rehab, and roughly ${formatCurrency(
      strongestScenario.totalProjectCost
    )} total project cost.`,
    caution,
    "Refresh after the backend deploy completes if you want deeper AI suggestions and draft patches.",
  ].join(" ");
};

const MessageBubble = ({ message, onApply }) => {
  const isAssistant = message.role === "assistant";
  const hasPatches =
    Boolean(message.patches?.summaryPatch) ||
    (Array.isArray(message.patches?.scenarioPatches) && message.patches.scenarioPatches.length > 0);

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[92%] rounded-[24px] px-4 py-3 text-sm leading-6 shadow-soft ${
          isAssistant
            ? "bg-white text-ink-900 ring-1 ring-ink-100"
            : "bg-ink-900 text-white"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {hasPatches ? (
          <button
            type="button"
            onClick={() => onApply(message.patches)}
            className="secondary-action mt-3"
          >
            Apply suggestions
          </button>
        ) : null}
      </div>
    </div>
  );
};

const LeadProjectAnalysisCopilot = ({
  leadId,
  leadAddress,
  activePanel = "scenario-lab",
  leadSnapshot,
  scenarios = [],
  aiSummary = "",
  onApplySuggestions,
}) => {
  const [messages, setMessages] = useState(() => [buildAssistantMessage({ leadAddress })]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [previousResponseId, setPreviousResponseId] = useState("");
  const scrollTargetRef = useRef(null);

  useEffect(() => {
    setMessages([buildAssistantMessage({ leadAddress })]);
    setDraft("");
    setPreviousResponseId("");
    setIsSending(false);
  }, [leadAddress, leadId]);

  useEffect(() => {
    scrollTargetRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const inputPayload = useMemo(
    () => ({
      previousResponseId,
      activePanel,
      currentScenarioDrafts: scenarios,
      leadSnapshot,
    }),
    [activePanel, leadSnapshot, previousResponseId, scenarios]
  );

  const submitMessage = async (nextMessage) => {
    const trimmedMessage = String(nextMessage || "").trim();
    if (!trimmedMessage || !leadId || isSending) {
      return;
    }

    const requestId = `lead-project-analysis-request-${Date.now()}`;
    setMessages((current) => [
      ...current,
      {
        id: `user-${requestId}`,
        role: "user",
        content: trimmedMessage,
        patches: null,
      },
      {
        id: `assistant-${requestId}`,
        role: "assistant",
        content: "Reviewing the deal assumptions...",
        patches: null,
      },
    ]);
    setDraft("");
    setIsSending(true);

    try {
      const response = await askLeadProjectAnalysisCopilot(leadId, {
        message: trimmedMessage,
        ...inputPayload,
      });

      setPreviousResponseId(response.responseId || "");
      setMessages((current) =>
        current.map((message) =>
          message.id === `assistant-${requestId}`
            ? {
                id: `assistant-response-${requestId}`,
                role: "assistant",
                content:
                  response.message ||
                  "I reviewed the current setup, but I do not have a better recommendation yet.",
                patches: {
                  summaryPatch: response.proposedSummaryPatch || null,
                  scenarioPatches: Array.isArray(response.proposedScenarioPatches)
                    ? response.proposedScenarioPatches
                    : [],
                },
              }
            : message
        )
      );
    } catch (error) {
      const shouldUseLocalFallback =
        error?.status === 404 ||
        /not available on the server yet/i.test(String(error?.message || ""));

      setMessages((current) =>
        current.map((message) =>
          message.id === `assistant-${requestId}`
            ? {
                id: shouldUseLocalFallback
                  ? `assistant-fallback-${requestId}`
                  : `assistant-error-${requestId}`,
                role: "assistant",
                content: shouldUseLocalFallback
                  ? buildLocalFallbackMessage({
                      leadAddress,
                      leadSnapshot,
                      scenarios,
                    })
                  : error.message ||
                    "The project analysis assistant could not respond right now. Try again in a moment.",
                patches: null,
              }
            : message
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="section-card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">AI planning assistant</span>
          <h3 className="mt-4 text-2xl font-semibold text-ink-900">Pressure-test the scenarios</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
            Ask for better rehab assumptions, ARV guidance, or a recommendation on which strategy
            deserves the next contractor conversation. Suggestions stay as drafts until you apply
            them.
          </p>
        </div>
        {aiSummary ? (
          <div className="max-w-md rounded-[22px] border border-ink-100 bg-white/85 px-4 py-4 text-sm text-ink-600">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Current AI summary
            </p>
            <p className="mt-2 leading-6 text-ink-700">{aiSummary}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => submitMessage(prompt)}
            className="secondary-action"
            disabled={isSending}
          >
            <SparklesIcon className="h-4 w-4" />
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3 rounded-[28px] border border-ink-100 bg-sand-50/70 p-4 sm:p-5">
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} onApply={onApplySuggestions} />
          ))}
          <div ref={scrollTargetRef} />
        </div>

        <div className="rounded-[22px] border border-ink-100 bg-white px-4 py-4">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Ask the assistant
          </label>
          <textarea
            rows="4"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="auth-input mt-3 min-h-[140px]"
            placeholder="Example: If we keep the acquisition at $310k, what does a moderate rehab scenario need to look like for this to still be worth pursuing?"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-500">
              The assistant can suggest scenario changes and summary notes, but it will not save
              anything unless you apply the draft.
            </p>
            <button
              type="button"
              onClick={() => submitMessage(draft)}
              disabled={isSending || !draft.trim()}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSending ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadProjectAnalysisCopilot;
