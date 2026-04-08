import React from "react";
import {
  BanknotesIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";

import { formatCurrency } from "../../../utils/investmentMetrics";
import { FinanceRow, MetricTile, safeRatio } from "./PropertyFinanceShared";

const PropertyFinanceSourcesUsesView = ({
  embedded = false,
  sourceItems,
  useItems,
  metrics,
}) => {
  const totalSources = sourceItems.reduce((sum, item) => sum + item.amount, 0);
  const totalUses = useItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      {!embedded ? (
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Finance / Sources & Uses</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Show exactly where the money comes from and where it goes
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            This is the finance view you can use to explain the deal to partners, lenders, or your
            own team without piecing it together from several tabs.
          </p>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile
          icon={BanknotesIcon}
          label="Total sources"
          value={formatCurrency(totalSources)}
          hint="Debt plus cash required to run the project."
        />
        <MetricTile
          icon={ClipboardDocumentListIcon}
          label="Total uses"
          value={formatCurrency(totalUses)}
          hint="Purchase, close, rehab, finance, and hold assumptions."
        />
        <MetricTile
          icon={DocumentChartBarIcon}
          label="Projected exit value"
          value={formatCurrency(metrics.arv)}
          hint="Current projected exit value based on deal assumptions."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Capital in</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Sources</h4>
          <div className="mt-6">
            {sourceItems.map((item) => (
              <FinanceRow
                key={item.label}
                label={item.label}
                value={formatCurrency(item.amount)}
                hint={item.hint}
              />
            ))}
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Capital out</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Uses</h4>
          <div className="mt-6">
            {useItems.map((item) => (
              <FinanceRow
                key={item.label}
                label={item.label}
                value={formatCurrency(item.amount)}
                hint={item.hint}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Visual split</span>
        <h4 className="mt-4 text-2xl font-semibold text-ink-900">Use allocation</h4>
        <div className="mt-6 space-y-4">
          {useItems.map((item, index) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-ink-700">{item.label}</p>
                <p className="text-sm font-semibold text-ink-900">{formatCurrency(item.amount)}</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-ink-100">
                <div
                  className={`h-full rounded-full ${
                    index % 4 === 0
                      ? "bg-verdigris-500"
                      : index % 4 === 1
                        ? "bg-sky-500"
                        : index % 4 === 2
                          ? "bg-amber-400"
                          : "bg-clay-400"
                  }`}
                  style={{ width: `${safeRatio(item.amount, totalUses)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PropertyFinanceSourcesUsesView;
