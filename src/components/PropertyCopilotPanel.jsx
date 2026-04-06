import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { askPropertyCopilot } from "../utils/api";

const QUICK_PROMPTS_BY_TAB = {
  overview: [
    "Summarize this property for me",
    "What should I review next on this property?",
    "Open the financials tab",
  ],
  financials: [
    "Summarize the numbers on this property",
    "Do we have budget versus actual spend here?",
    "Open the documents tab",
  ],
  work: [
    "What tasks look most urgent here?",
    "Open the documents tab",
    "Create a high-priority task due tomorrow to review vendor follow-up",
  ],
  documents: [
    "What documents do we have for this property?",
    "Which documents seem missing based on this workspace?",
    "Open the analysis tab",
  ],
  analysis: [
    "Summarize the comps story for this property",
    "What was the recommended offer range?",
    "Open the work tab",
  ],
  settings: [
    "What workspaces are linked to this property?",
    "Is anything missing from this setup?",
    "Open the overview tab",
  ],
};

const buildWelcomeMessage = ({ propertyTitle }) => ({
  id: "copilot-welcome",
  role: "assistant",
  content: propertyTitle
    ? `I can help with ${propertyTitle}. Ask me to summarize the workspace, open the right section, or create a follow-up task tied to this property.`
    : "I can summarize this workspace, open the right section, or create a follow-up task tied to this property.",
  actions: [],
});

const MessageBubble = ({ message, onAction }) => {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-6 shadow-soft ${
          isAssistant
            ? "bg-white text-ink-900 ring-1 ring-ink-100"
            : "bg-ink-900 text-white"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {Array.isArray(message.actions) && message.actions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action, index) => (
              <button
                key={`${action.type || "action"}-${action.path || action.label || index}`}
                type="button"
                onClick={() => onAction(action)}
                className="rounded-full bg-sand-100 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-sand-200"
              >
                {action.label || "Open"}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const PropertyCopilotPanel = ({
  propertyKey,
  propertyTitle,
  activeTab,
  disabled = false,
  onTasksChanged,
}) => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const textareaRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(() => [buildWelcomeMessage({ propertyTitle })]);
  const [previousResponseId, setPreviousResponseId] = useState("");
  const [isSending, setIsSending] = useState(false);

  const quickPrompts = useMemo(
    () => QUICK_PROMPTS_BY_TAB[activeTab?.id] || QUICK_PROMPTS_BY_TAB.overview,
    [activeTab?.id]
  );

  useEffect(() => {
    requestSequenceRef.current += 1;
    setMessages([buildWelcomeMessage({ propertyTitle })]);
    setPreviousResponseId("");
    setDraft("");
    setIsSending(false);
  }, [propertyKey, propertyTitle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isOpen]);

  const submitMessage = async (nextMessage) => {
    const trimmedMessage = String(nextMessage || "").trim();
    if (!trimmedMessage || isSending || disabled) {
      return;
    }

    const pendingId = `assistant-pending-${Date.now()}`;
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedMessage,
      actions: [],
    };

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: pendingId,
        role: "assistant",
        content: "Looking through this property workspace...",
        actions: [],
      },
    ]);
    setDraft("");
    setIsSending(true);

    try {
      const response = await askPropertyCopilot(propertyKey, {
        message: trimmedMessage,
        previousResponseId,
        activeTab: activeTab?.id || "overview",
      });

      if (requestSequenceRef.current !== requestId) {
        return;
      }

      setPreviousResponseId(response.responseId || "");
      setMessages((current) =>
        current.map((message) =>
          message.id === pendingId
            ? {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content:
                  response.message ||
                  "I checked the workspace, but I do not have anything else to add yet.",
                actions: Array.isArray(response.actions) ? response.actions : [],
              }
            : message
        )
      );

      if (Array.isArray(response.createdTasks) && response.createdTasks.length > 0) {
        onTasksChanged?.();
      }
    } catch (error) {
      if (requestSequenceRef.current !== requestId) {
        return;
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === pendingId
            ? {
                id: `assistant-error-${Date.now()}`,
                role: "assistant",
                content:
                  error.message ||
                  "The property copilot could not answer right now. Please try again.",
                actions: [],
              }
            : message
        )
      );
    } finally {
      if (requestSequenceRef.current === requestId) {
        setIsSending(false);
      }
    }
  };

  const handleAction = (action) => {
    if (action?.type === "navigate" && action.path) {
      navigate(action.path);
      setIsOpen(false);
      return;
    }

    if (action?.type === "refresh_tasks") {
      onTasksChanged?.();
    }
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={`fixed bottom-6 right-6 z-[55] inline-flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold shadow-soft transition ${
          disabled
            ? "cursor-not-allowed bg-white/80 text-ink-400 ring-1 ring-ink-100"
            : "bg-ink-900 text-white hover:bg-ink-800"
        }`}
      >
        <SparklesIcon className="h-5 w-5" />
        Property Copilot
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[70] bg-ink-900/28 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-[30rem] flex-col bg-[#f7f4ee] shadow-[0_18px_48px_rgba(30,34,41,0.22)]">
            <div className="border-b border-ink-100 px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="eyebrow">AI assistant</span>
                  <h2 className="mt-3 text-2xl font-semibold text-ink-900">Property Copilot</h2>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    Answers stay grounded in this property workspace and can open the right section
                    for you.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-500 ring-1 ring-ink-100 transition hover:text-ink-900"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500 ring-1 ring-ink-100">
                  Current tab: {activeTab?.label || "Overview"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMessages([buildWelcomeMessage({ propertyTitle })]);
                    setPreviousResponseId("");
                  }}
                  className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500 ring-1 ring-ink-100 transition hover:text-ink-900"
                >
                  Reset chat
                </button>
              </div>
            </div>

            <div className="border-b border-ink-100 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Try asking
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submitMessage(prompt)}
                    disabled={isSending || disabled}
                    className="rounded-full bg-white px-3 py-2 text-left text-xs font-semibold text-ink-700 ring-1 ring-ink-100 transition hover:bg-sand-100 disabled:cursor-not-allowed disabled:text-ink-400"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onAction={handleAction}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-ink-100 px-4 py-4">
              <div className="rounded-[24px] bg-white p-3 ring-1 ring-ink-100">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submitMessage(draft);
                    }
                  }}
                  rows={3}
                  placeholder="Ask about this property, open a section, or create a task..."
                  className="min-h-[88px] w-full resize-none border-none bg-transparent text-sm leading-6 text-ink-900 outline-none placeholder:text-ink-400"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-ink-400">Shift + Enter for a new line.</p>
                  <button
                    type="button"
                    onClick={() => submitMessage(draft)}
                    disabled={isSending || disabled || !draft.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-ink-300"
                  >
                    {isSending ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className="h-4 w-4" />
                    )}
                    Send
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>,
    document.body
  );
};

export default PropertyCopilotPanel;
