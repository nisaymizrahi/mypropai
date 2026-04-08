import React from "react";

import FinancialsTab from "../../FinancialsTab";

const PropertyFinanceBudgetVsActualView = ({
  embedded = false,
  investment,
  budgetItems,
  expenses,
  vendors,
  onUpdate,
}) => (
  <div className="space-y-6">
    {!embedded ? (
      <section className="surface-panel px-6 py-7 sm:px-7">
        <span className="eyebrow">Finance / Budget vs Actual</span>
        <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
          Expected cost plan versus actual project spend
        </h3>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
          This section reuses the live budget and expense engine so line-item budgets, vendor
          commitments, receipt capture, and actual spend stay tied to the same property finance
          model.
        </p>
      </section>
    ) : null}

    <FinancialsTab
      investment={investment}
      budgetItems={budgetItems}
      expenses={expenses}
      vendors={vendors}
      onUpdate={onUpdate}
      showAnalysis={false}
    />
  </div>
);

export default PropertyFinanceBudgetVsActualView;
