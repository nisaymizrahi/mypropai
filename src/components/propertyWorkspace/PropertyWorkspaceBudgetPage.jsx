import React from "react";

import PropertyCostsPanel from "../PropertyCostsPanel";
import PropertyFinancePanel from "../PropertyFinancePanel";
import { WorkspacePageShell } from "./WorkspacePagePrimitives";

const PropertyWorkspaceBudgetPage = ({
  activeViewId,
  hasAcquisitionWorkspace,
  renderAcquisitionSetup,
  property,
  propertyKey,
  syncPropertyState,
  workspaceSurfaceVersion,
}) => {
  if (!hasAcquisitionWorkspace) {
    return (
      <WorkspacePageShell
        eyebrow="Budget"
        title="Turn this project into a real financial workplace"
        description="Payments, cost plan, capital, draws, and lender reporting all open once the budget workspace is created."
      >
        {renderAcquisitionSetup({
          title: "Set up the budget workspace for this project",
          description:
            "Budget, capital, payments, draws, and finance reports all start here.",
          buttonLabel: "Create budget workspace",
        })}
      </WorkspacePageShell>
    );
  }

  if (activeViewId === "cost-plan") {
    return (
      <WorkspacePageShell
        eyebrow="Budget / Cost Plan"
        title="Run the cost plan from scope, commitments, and variance"
        description="Use the cost plan as the live budget-control page for category budgets, commitments, paid amounts, and remaining exposure."
      >
        <PropertyCostsPanel
          key={`budget-cost-plan-${workspaceSurfaceVersion}`}
          property={property}
          propertyKey={propertyKey}
          activeContentKey="costs-cost-plan"
          onPropertyUpdated={syncPropertyState}
          embedded
        />
      </WorkspacePageShell>
    );
  }

  if (activeViewId === "snapshot") {
    return (
      <WorkspacePageShell
        eyebrow="Budget / Snapshot"
        title="See the current financial picture fast"
        description="Review profitability, basis, carrying pressure, and finance health without leaving the workspace."
      >
        <PropertyFinancePanel
          property={property}
          propertyKey={propertyKey}
          activeContentKey="finance-health"
          onPropertyUpdated={syncPropertyState}
          embedded
        />
      </WorkspacePageShell>
    );
  }

  if (activeViewId === "capital") {
    return (
      <WorkspacePageShell
        eyebrow="Budget / Capital"
        title="Keep lender terms, capital stack, and payment cadence together"
        description="This is the working page for loan structure, repayment timing, and capital availability."
      >
        <PropertyFinancePanel
          property={property}
          propertyKey={propertyKey}
          activeContentKey="finance-capital-suite"
          onPropertyUpdated={syncPropertyState}
          embedded
        />
      </WorkspacePageShell>
    );
  }

  if (activeViewId === "draws") {
    return (
      <WorkspacePageShell
        eyebrow="Budget / Draws"
        title="Run draw operations without leaving the project"
        description="Prepare support, manage request timing, and keep lender packet readiness visible."
      >
        <PropertyFinancePanel
          property={property}
          propertyKey={propertyKey}
          activeContentKey="finance-draw-operations"
          onPropertyUpdated={syncPropertyState}
          embedded
        />
      </WorkspacePageShell>
    );
  }

  if (activeViewId === "reports") {
    return (
      <WorkspacePageShell
        eyebrow="Budget / Reports"
        title="Export finance-ready views for partners and lenders"
        description="Use this page for formal reporting and clean lender-facing exports."
      >
        <PropertyFinancePanel
          property={property}
          propertyKey={propertyKey}
          activeContentKey="finance-reports"
          onPropertyUpdated={syncPropertyState}
          embedded
        />
      </WorkspacePageShell>
    );
  }

  return (
    <WorkspacePageShell
      eyebrow="Budget / Payments"
      title="Keep every project payment in one professional ledger"
      description="Track construction payments, soft costs, lender fees, closing costs, and holding costs with scope, capital, and receipt links."
    >
      <PropertyCostsPanel
        key={`budget-payments-${workspaceSurfaceVersion}`}
        property={property}
        propertyKey={propertyKey}
        activeContentKey="costs-payments"
        onPropertyUpdated={syncPropertyState}
        embedded
      />
    </WorkspacePageShell>
  );
};

export default PropertyWorkspaceBudgetPage;
