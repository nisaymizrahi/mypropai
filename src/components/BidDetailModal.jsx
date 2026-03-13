import React from "react";

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const BidDetailModal = ({ isOpen, onClose, bid }) => {
  if (!isOpen || !bid) return null;

  const items = Array.isArray(bid.items) ? bid.items : [];
  const assignments = Array.isArray(bid.renovationAssignments) ? bid.renovationAssignments : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-ink-900">
              {bid.contractorName || "Contractor quote"}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Total amount: <span className="font-semibold text-ink-900">{formatCurrency(bid.totalAmount)}</span>
            </p>
            {bid.sourceFileName ? (
              <p className="mt-1 text-xs text-ink-400">{bid.sourceFileName}</p>
            ) : null}
          </div>

          <button type="button" onClick={onClose} className="ghost-action">
            Close
          </button>
        </div>

        <div className="max-h-[calc(90vh-96px)] overflow-y-auto px-6 py-6">
          {assignments.length ? (
            <div className="mb-6 rounded-[22px] border border-ink-100 bg-sand-50/70 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Matched renovation items
              </p>
              <div className="mt-4 space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={`${bid._id}-${assignment.renovationItemId}`}
                    className="rounded-[18px] bg-white px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink-900">
                        {assignment.renovationItemName || "Matched item"}
                      </p>
                      <p className="text-sm font-semibold text-ink-900">
                        {formatCurrency(assignment.amount)}
                      </p>
                    </div>
                    {assignment.scopeSummary ? (
                      <p className="mt-2 text-sm leading-6 text-ink-600">
                        {assignment.scopeSummary}
                      </p>
                    ) : null}
                    {Array.isArray(assignment.matchedLineItems) && assignment.matchedLineItems.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {assignment.matchedLineItems.map((item) => (
                          <span
                            key={`${assignment.renovationItemId}-${item}`}
                            className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[22px] border border-ink-100">
            <div className="flex items-center justify-between bg-sand-50 px-4 py-3">
              <p className="text-sm font-semibold text-ink-900">Extracted line items</p>
              {bid.sourceDocumentUrl ? (
                <a
                  href={bid.sourceDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-verdigris-700 hover:underline"
                >
                  Open uploaded file
                </a>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white text-left text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 text-right font-semibold">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {items.length ? (
                    items.map((item, index) => (
                      <tr key={`${item.description}-${index}`}>
                        <td className="px-4 py-3 text-ink-700">{item.description}</td>
                        <td className="px-4 py-3 text-ink-500">{item.category || "—"}</td>
                        <td className="px-4 py-3 text-right font-medium text-ink-900">
                          {formatCurrency(item.cost)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-4 text-ink-500" colSpan="3">
                        No line items were extracted from this quote.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidDetailModal;
