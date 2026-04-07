import React, { useEffect, useMemo, useRef, useState } from "react";

const WorkspaceQuickAddMenu = ({ actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const visibleActions = useMemo(() => actions.filter(Boolean), [actions]);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!visibleActions.length) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed bottom-24 right-5 z-[70] flex flex-col items-end gap-3 sm:bottom-28 sm:right-7"
    >
      {isOpen ? (
        <div className="surface-panel w-[min(92vw,320px)] px-3 py-3">
          <div className="space-y-2">
            {visibleActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  if (action.disabled) {
                    return;
                  }
                  setIsOpen(false);
                  action.onSelect?.();
                }}
                disabled={action.disabled}
                className="flex w-full items-start justify-between gap-4 rounded-[18px] px-4 py-3 text-left transition hover:bg-mist-50 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">{action.label}</p>
                  {action.detail ? (
                    <p className="mt-1 text-xs leading-5 text-ink-500">{action.detail}</p>
                  ) : null}
                </div>
                <span className="text-sm font-semibold text-verdigris-700">+</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`workspace-quick-add ${isOpen ? "workspace-quick-add-open" : ""}`}
        aria-label="Open quick add menu"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
};

export default WorkspaceQuickAddMenu;
