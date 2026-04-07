import React, { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const PropertyWorkspaceSection = ({
  title,
  helper = "",
  action = null,
  defaultOpen = false,
  sectionId = "",
  revealToken = 0,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasRendered, setHasRendered] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) {
      setIsOpen(true);
      setHasRendered(true);
    }
  }, [defaultOpen]);

  useEffect(() => {
    if (!revealToken) {
      return;
    }

    setIsOpen(true);
    setHasRendered(true);
  }, [revealToken]);

  const handleToggle = () => {
    setIsOpen((current) => {
      const next = !current;
      if (next) {
        setHasRendered(true);
      }
      return next;
    });
  };

  return (
    <section id={sectionId || undefined} className="section-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <button type="button" onClick={handleToggle} className="min-w-0 flex-1 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-mist-100 p-1.5 text-ink-700">
              {isOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-ink-900 sm:text-lg">{title}</h3>
              {helper ? <p className="mt-1 text-sm text-ink-500">{helper}</p> : null}
            </div>
          </div>
        </button>

        {action ? <div className="flex shrink-0 flex-wrap gap-3">{action}</div> : null}
      </div>

      {isOpen && hasRendered ? <div className="px-5 py-5 sm:px-6">{children}</div> : null}
    </section>
  );
};

export default PropertyWorkspaceSection;
