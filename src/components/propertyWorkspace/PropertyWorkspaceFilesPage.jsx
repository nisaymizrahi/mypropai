import React from "react";

import PropertyDocumentsPanel from "../PropertyDocumentsPanel";
import { WorkspacePageShell } from "./WorkspacePagePrimitives";

const PropertyWorkspaceFilesPage = ({
  activeView,
  activeViewId,
  hasAcquisitionWorkspace,
  renderAcquisitionSetup,
  property,
  propertyKey,
  syncPropertyState,
  workspaceSurfaceVersion,
  workspacePayments,
  workspaceReceipts,
  projectVendorRecords,
  documentUploadRequestKey,
  handleViewSelect,
}) => (
  <WorkspacePageShell
    eyebrow={`Files / ${activeView?.label || "All Files"}`}
    title={
      activeViewId === "all-files"
        ? "Keep the project library structured and usable"
        : `Open ${activeView?.label || "file"} records without digging`
    }
    description={
      activeViewId === "all-files"
        ? "Use the file library for draw support, contracts, invoices, receipts, and photos while keeping upload structure consistent."
        : "Each file page is filtered so you can work the document set that matters right now."
    }
  >
    {!hasAcquisitionWorkspace ? (
      renderAcquisitionSetup({
        title: "Set up budget workspace to unlock files",
        description:
          "Uploads, draw support, contracts, receipts, and project documents open as soon as the budget workspace exists.",
        buttonLabel: "Create budget workspace",
      })
    ) : (
      <PropertyDocumentsPanel
        key={`files-${activeViewId}-${workspaceSurfaceVersion}`}
        property={property}
        propertyKey={propertyKey}
        onPropertyUpdated={syncPropertyState}
        embedded
        activeView={activeViewId || "all-files"}
        payments={workspacePayments}
        receipts={workspaceReceipts}
        vendors={projectVendorRecords}
        uploadRequestKey={documentUploadRequestKey}
        onOpenWorkspaceView={handleViewSelect}
      />
    )}
  </WorkspacePageShell>
);

export default PropertyWorkspaceFilesPage;
