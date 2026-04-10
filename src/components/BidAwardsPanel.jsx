import React, { useMemo } from "react";

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const formatDate = (value, fallback = "No date") => {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) {
    return fallback;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeText = (value, fallback = "") => {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim() || fallback;
};

const normalizeBids = (items = []) =>
  items
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      _id: normalizeText(item._id, `bid-${index}`),
      contractorName: normalizeText(item.contractorName, "Unknown contractor"),
      decisionStatus: normalizeText(item.decisionStatus, "open"),
      awardedAt: item.awardedAt || item.updatedAt || item.createdAt || "",
      totalAmount: item.totalAmount,
      sourceFileName: normalizeText(item.sourceFileName),
      vendorName:
        typeof item.vendor === "object"
          ? normalizeText(item.vendor?.name)
          : normalizeText(item.vendorSnapshot?.name),
      assignments: Array.isArray(item.renovationAssignments)
        ? item.renovationAssignments
            .filter((assignment) => assignment && typeof assignment === "object")
            .map((assignment, assignmentIndex) => ({
              id: `${item._id}-assignment-${assignmentIndex}`,
              name:
                normalizeText(assignment.budgetItemLabel) ||
                normalizeText(assignment.renovationItemName) ||
                "Scope item",
              amount: assignment.amount,
              scopeSummary: normalizeText(assignment.scopeSummary),
            }))
        : [],
    }));

const BidAwardsPanel = ({ bids = [] }) => {
  const awardedBids = useMemo(
    () =>
      normalizeBids(bids)
        .filter((bid) => bid.decisionStatus === "awarded")
        .sort(
          (left, right) =>
            new Date(right.awardedAt || 0).valueOf() - new Date(left.awardedAt || 0).valueOf()
        ),
    [bids]
  );

  const totalAwardedAmount = useMemo(
    () =>
      awardedBids.reduce((sum, bid) => {
        const parsed = Number(bid.totalAmount);
        return Number.isFinite(parsed) ? sum + parsed : sum;
      }, 0),
    [awardedBids]
  );

  return (
    <div className="space-y-5">
      <section className="section-card p-6">
        <span className="eyebrow">Awarded work</span>
        <h2 className="mt-4 text-2xl font-semibold text-ink-900">
          Keep accepted contractor pricing organized
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
          This page shows the quotes that have already won work so the team can move cleanly from
          bid comparison into vendor execution and budget tracking.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="metric-tile p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Awarded quotes
            </p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">{awardedBids.length}</p>
          </div>
          <div className="metric-tile p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Awarded total
            </p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">
              {awardedBids.length ? formatCurrency(totalAwardedAmount) : "—"}
            </p>
          </div>
        </div>
      </section>

      {awardedBids.length ? (
        <div className="space-y-4">
          {awardedBids.map((bid) => (
            <article key={bid._id} className="section-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-ink-900">{bid.contractorName}</h3>
                    <span className="rounded-full bg-verdigris-50 px-3 py-1 text-xs font-semibold text-verdigris-700">
                      Awarded
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-500">
                    {bid.vendorName ? `Vendor: ${bid.vendorName}` : "Vendor not linked yet"}
                  </p>
                  <p className="mt-1 text-sm text-ink-500">
                    Awarded {formatDate(bid.awardedAt)}
                    {bid.sourceFileName ? ` • ${bid.sourceFileName}` : ""}
                  </p>
                </div>

                <div className="rounded-[18px] bg-sand-50 px-4 py-4 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Quote total
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink-900">
                    {formatCurrency(bid.totalAmount)}
                  </p>
                </div>
              </div>

              {bid.assignments.length ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {bid.assignments.map((assignment) => (
                    <div key={assignment.id} className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-ink-900">{assignment.name}</p>
                          {assignment.scopeSummary ? (
                            <p className="mt-1 text-sm leading-6 text-ink-500">
                              {assignment.scopeSummary}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold text-ink-900">
                          {formatCurrency(assignment.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm text-ink-500">
                  This award does not have scope-level matches attached yet.
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <section className="section-card px-5 py-10 text-center">
          <h3 className="text-xl font-semibold text-ink-900">No awards yet</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Award a quote from the comparison page and it will show up here.
          </p>
        </section>
      )}
    </div>
  );
};

export default BidAwardsPanel;
