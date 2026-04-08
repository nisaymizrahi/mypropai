import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BanknotesIcon,
  CameraIcon,
  ClipboardDocumentListIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  LinkIcon,
  PhotoIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { EmptyAcquisitionState } from "./PropertyFinancePanel";
import {
  createPropertyWorkspace,
  deleteProjectDocument,
  getDocumentAssetAccessUrl,
  getDocumentStorageOverview,
  getProjectDocuments,
  getInvestment,
  uploadProjectDocument,
} from "../utils/api";
import { DOCUMENT_FILE_ACCEPT, formatStorageBytes } from "../utils/documentStorage";
import {
  getDrawRequestById,
  getDrawRequestLabel,
  getDrawRequests,
  getFundingSourceById,
  getFundingSourceLabel,
  getFundingSources,
} from "../utils/capitalStack";
import { getVendorProcurementSummary } from "../utils/vendorProcurement";

const documentCategories = [
  "Closing",
  "Loan & Draw",
  "Receipts & Invoices",
  "Contracts & Bids",
  "Permits & Inspections",
  "Vendor Compliance",
  "Reports",
  "Photos",
  "Scope",
  "General",
];

const formatDate = (value) => {
  if (!value) return "Recently uploaded";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return "Recently uploaded";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const MetricTile = ({ icon: Icon, label, value, hint }) => (
  <div className="metric-tile p-5">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

const FocusCard = ({
  eyebrow,
  title,
  detail,
  actionLabel,
  onAction,
  tone = "bg-white/92",
}) => (
  <div className={`rounded-[24px] border border-ink-100 p-5 ${tone}`}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{eyebrow}</p>
    <h4 className="mt-4 text-lg font-semibold text-ink-900">{title}</h4>
    <p className="mt-2 text-sm leading-6 text-ink-500">{detail}</p>
    {actionLabel && onAction ? (
      <button type="button" onClick={onAction} className="ghost-action mt-5">
        {actionLabel}
      </button>
    ) : null}
  </div>
);

const DocumentCategoryPill = ({ label }) => (
  <span className="inline-flex rounded-full bg-mist-50 px-3 py-1 text-[11px] font-semibold text-ink-700">
    {label}
  </span>
);

const bucketDescriptions = {
  Closing: "HUDs, settlement statements, title files, and purchase-close records.",
  "Loan & Draw": "Lender notes, draw requests, payoff letters, and financing records.",
  "Receipts & Invoices": "Receipts, invoices, and payment support files for the project.",
  "Contracts & Bids": "Bid sheets, vendor contracts, proposals, and scope agreements.",
  "Permits & Inspections": "Permit packages, approvals, inspection notes, and compliance items.",
  "Vendor Compliance": "Insurance certificates, W9s, licenses, and vendor support files.",
  Reports: "Financial reports, lender packages, and investor-facing exports.",
  Photos: "Progress photography and supporting visual documentation.",
  Scope: "Scope drafts, revisions, and planning artifacts.",
  General: "Anything important that does not fit the other structured buckets yet.",
};

const documentViewConfigById = {
  "all-files": {
    title: "All Files",
    description: "Browse the full structured project library.",
    buckets: documentCategories,
    defaultCategory: "General",
  },
  "loan-draw": {
    title: "Loan & Draw",
    description: "Focus on lender-facing support, draw packets, and financing records.",
    buckets: ["Loan & Draw"],
    defaultCategory: "Loan & Draw",
  },
  "contracts-bids": {
    title: "Contracts & Bids",
    description: "Keep awarded work, contracts, proposals, and compliance packets together.",
    buckets: ["Contracts & Bids", "Vendor Compliance"],
    defaultCategory: "Contracts & Bids",
  },
  "receipts-invoices": {
    title: "Receipts & Invoices",
    description: "Track the financial paper trail for project payments and support.",
    buckets: ["Receipts & Invoices"],
    defaultCategory: "Receipts & Invoices",
  },
  photos: {
    title: "Photos",
    description: "Keep progress photography and visual support in one place.",
    buckets: ["Photos"],
    defaultCategory: "Photos",
  },
};

const getDocumentViewConfig = (activeView = "all-files") =>
  documentViewConfigById[activeView] || documentViewConfigById["all-files"];

const getFileTypeLabel = (document = {}) => {
  const mimeType = String(document.mimeType || "").toLowerCase();
  const filename = String(document.originalFilename || document.displayName || "").toLowerCase();

  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.includes("pdf") || filename.endsWith(".pdf")) return "PDF";
  if (
    mimeType.includes("spreadsheet") ||
    filename.endsWith(".xlsx") ||
    filename.endsWith(".csv")
  ) {
    return "Spreadsheet";
  }
  if (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    filename.endsWith(".doc") ||
    filename.endsWith(".docx")
  ) {
    return "Document";
  }
  return "File";
};

const PropertyDocumentsPanel = ({
  property,
  propertyKey,
  onPropertyUpdated,
  embedded = false,
  sectionAnchors = {},
  activeView = "all-files",
  payments = [],
  receipts = [],
  vendors = [],
  uploadRequestKey = 0,
  onOpenWorkspaceView = null,
}) => {
  const investmentId = property?.workspaces?.acquisitions?.id || "";
  const [selectedStrategy, setSelectedStrategy] = useState(
    property?.workspaces?.acquisitions?.strategy || "flip"
  );
  const [investment, setInvestment] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("General");
  const [fundingSourceId, setFundingSourceId] = useState("");
  const [drawRequestId, setDrawRequestId] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storageOverview, setStorageOverview] = useState(null);
  const [error, setError] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadHighlighted, setIsUploadHighlighted] = useState(false);
  const fileInputRef = useRef(null);
  const documentNameInputRef = useRef(null);
  const uploadFormRef = useRef(null);
  const viewConfig = useMemo(() => getDocumentViewConfig(activeView), [activeView]);
  const visibleBuckets = viewConfig.buckets;

  useEffect(() => {
    setSelectedStrategy(property?.workspaces?.acquisitions?.strategy || "flip");
  }, [property?.workspaces?.acquisitions?.strategy]);

  useEffect(() => {
    setCategory((current) =>
      visibleBuckets.includes(current) ? current : viewConfig.defaultCategory
    );
  }, [viewConfig.defaultCategory, visibleBuckets]);

  useEffect(() => {
    if (!uploadRequestKey) {
      return undefined;
    }

    uploadFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => {
      documentNameInputRef.current?.focus();
    });
    setIsUploadHighlighted(true);

    const timeoutId = window.setTimeout(() => {
      setIsUploadHighlighted(false);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [uploadRequestKey]);

  const loadDocumentsWorkspace = useCallback(async () => {
    if (!investmentId) {
      setInvestment(null);
      setDocuments([]);
      setError("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [investmentData, documentData] = await Promise.all([
        getInvestment(investmentId),
        getProjectDocuments(investmentId),
      ]);

      setInvestment(investmentData);
      setDocuments(Array.isArray(documentData) ? documentData : []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load the documents workspace.");
    } finally {
      setLoading(false);
    }
  }, [investmentId]);

  useEffect(() => {
    loadDocumentsWorkspace();
  }, [loadDocumentsWorkspace]);

  useEffect(() => {
    let isMounted = true;

    const loadStorageOverview = async () => {
      try {
        const overview = await getDocumentStorageOverview();
        if (isMounted) {
          setStorageOverview(overview);
        }
      } catch (loadError) {
        if (isMounted) {
          setError((current) => current || loadError.message || "Failed to load storage details.");
        }
      }
    };

    loadStorageOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleDocuments = useMemo(
    () =>
      documents.filter((item) =>
        visibleBuckets.includes(documentCategories.includes(item.category) ? item.category : "General")
      ),
    [documents, visibleBuckets]
  );

  const groupedDocuments = useMemo(() => {
    const groups = documentCategories.reduce((accumulator, key) => {
      accumulator[key] = [];
      return accumulator;
    }, {});

    visibleDocuments.forEach((item) => {
      const key = groups[item.category] ? item.category : "General";
      groups[key].push(item);
    });

    return groups;
  }, [visibleDocuments]);

  const fundingSources = useMemo(() => getFundingSources(investment || {}), [investment]);
  const drawRequests = useMemo(() => getDrawRequests(investment || {}), [investment]);
  const filteredDrawRequests = useMemo(() => {
    if (!fundingSourceId) {
      return drawRequests;
    }

    return drawRequests.filter(
      (request) => !request.sourceId || request.sourceId === fundingSourceId
    );
  }, [drawRequests, fundingSourceId]);

  const recentDocuments = useMemo(
    () =>
      [...visibleDocuments]
        .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0))
        .slice(0, 4),
    [visibleDocuments]
  );

  const linkedFundingDocuments = useMemo(
    () => visibleDocuments.filter((document) => document.fundingSourceId),
    [visibleDocuments]
  );

  const linkedDrawDocuments = useMemo(
    () => visibleDocuments.filter((document) => document.drawRequestId),
    [visibleDocuments]
  );

  const sortedVisibleDocuments = useMemo(
    () =>
      [...visibleDocuments].sort(
        (left, right) =>
          new Date(right.updatedAt || right.createdAt || 0) -
          new Date(left.updatedAt || left.createdAt || 0)
      ),
    [visibleDocuments]
  );

  const receiptBacklog = useMemo(
    () => receipts.filter((receipt) => !receipt.expense),
    [receipts]
  );

  const paymentsWithReceiptSupportCount = useMemo(
    () => payments.filter((payment) => payment?.receiptUrl || payment?.receiptRecord).length,
    [payments]
  );

  const paymentsMissingReceiptSupportCount = useMemo(
    () =>
      payments.filter((payment) => Number(payment?.amount || 0) > 0 && !payment?.receiptUrl && !payment?.receiptRecord)
        .length,
    [payments]
  );

  const drawRequestsMissingSupport = useMemo(
    () =>
      drawRequests.filter(
        (request) =>
          !visibleDocuments.some(
            (document) => String(document.drawRequestId || "") === String(request.drawId || "")
          )
      ),
    [drawRequests, visibleDocuments]
  );

  const fundingSourcesMissingSupport = useMemo(
    () =>
      fundingSources.filter(
        (source) =>
          !visibleDocuments.some(
            (document) =>
              String(document.fundingSourceId || "") === String(source.sourceId || "")
          )
      ),
    [fundingSources, visibleDocuments]
  );

  const vendorPacketSummaries = useMemo(
    () =>
      vendors.map((vendor) => ({
        vendor,
        procurement: getVendorProcurementSummary(vendor),
      })),
    [vendors]
  );

  const vendorPacketGapRecords = useMemo(
    () =>
      vendorPacketSummaries.filter(
        ({ procurement }) => procurement.blockingIssuesCount > 0
      ),
    [vendorPacketSummaries]
  );

  const readyToPayVendorRecords = useMemo(
    () =>
      vendorPacketSummaries.filter(({ procurement }) => procurement.paymentReady),
    [vendorPacketSummaries]
  );

  const photoDocuments = useMemo(
    () => documents.filter((document) => document.category === "Photos"),
    [documents]
  );

  const recentPhotoUploadsCount = useMemo(() => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 14;
    return photoDocuments.filter(
      (document) => new Date(document.updatedAt || document.createdAt || 0).valueOf() >= cutoff
    ).length;
  }, [photoDocuments]);

  const latestPhotoDocument = useMemo(() => photoDocuments[0] || sortedVisibleDocuments[0] || null, [
    photoDocuments,
    sortedVisibleDocuments,
  ]);

  const latestLoanDocument = useMemo(
    () => sortedVisibleDocuments.find((document) => document.category === "Loan & Draw") || null,
    [sortedVisibleDocuments]
  );

  const latestReceiptDocument = useMemo(
    () =>
      sortedVisibleDocuments.find((document) => document.category === "Receipts & Invoices") ||
      null,
    [sortedVisibleDocuments]
  );

  const contractsDocumentCount = useMemo(
    () => visibleDocuments.filter((document) => document.category === "Contracts & Bids").length,
    [visibleDocuments]
  );

  const complianceDocumentCount = useMemo(
    () => visibleDocuments.filter((document) => document.category === "Vendor Compliance").length,
    [visibleDocuments]
  );

  const uploadCategoryOptions = useMemo(
    () => (activeView === "all-files" ? documentCategories : visibleBuckets),
    [activeView, visibleBuckets]
  );

  const uploadConfig = useMemo(() => {
    if (activeView === "loan-draw") {
      return {
        title: "Upload lender support",
        detail: "Attach files directly to funding sources and draw requests so lender packets stay ready.",
        buttonLabel: "Upload draw support",
        placeholder: "Draw request #2 invoice package, lender payoff letter, wire confirmation",
      };
    }

    if (activeView === "contracts-bids") {
      return {
        title: "Upload contract or packet support",
        detail: "Keep proposals, contracts, and vendor packet files close to awarded work.",
        buttonLabel: "Upload contract support",
        placeholder: "Roofing signed contract, painter proposal, W-9, insurance certificate",
      };
    }

    if (activeView === "receipts-invoices") {
      return {
        title: "Upload receipt or invoice support",
        detail: "Keep payment backup easy to find when reconciling the ledger or preparing a draw.",
        buttonLabel: "Upload payment support",
        placeholder: "Framing invoice 04-07, lender draw fee receipt, utility bill",
      };
    }

    if (activeView === "photos") {
      return {
        title: "Upload progress photos",
        detail: "Save field photos and visual proof so the project story is easy to review later.",
        buttonLabel: "Upload photo set",
        placeholder: "Kitchen demo progress, exterior before, bathroom finish photos",
      };
    }

    return {
      title: "Upload project file",
      detail: "Keep every closing file, lender document, receipt, contract, and photo in the right structured bucket.",
      buttonLabel: "Upload document",
      placeholder: "Closing statement, hard money note, permit set",
    };
  }, [activeView]);

  const focusCards = useMemo(() => {
    if (activeView === "loan-draw") {
      return [
        {
          eyebrow: "Draw coverage",
          title:
            drawRequestsMissingSupport.length > 0
              ? `${drawRequestsMissingSupport.length} draw request${drawRequestsMissingSupport.length === 1 ? "" : "s"} still missing support`
              : `${linkedDrawDocuments.length} draw-linked file${linkedDrawDocuments.length === 1 ? "" : "s"} are already attached`,
          detail:
            drawRequestsMissingSupport.length > 0
              ? `Missing: ${drawRequestsMissingSupport
                  .slice(0, 2)
                  .map((request, index) => getDrawRequestLabel(request, index))
                  .join(" • ")}${drawRequestsMissingSupport.length > 2 ? "..." : ""}`
              : "Draw-linked files are already connected to the right request records.",
          actionLabel: "Open Draws",
          onAction: () => onOpenWorkspaceView?.("budget", "draws"),
          tone:
            drawRequestsMissingSupport.length > 0 ? "bg-clay-50/70" : "bg-verdigris-50/70",
        },
        {
          eyebrow: "Funding support",
          title:
            fundingSourcesMissingSupport.length > 0
              ? `${fundingSourcesMissingSupport.length} funding source${fundingSourcesMissingSupport.length === 1 ? "" : "s"} still need backup`
              : `${linkedFundingDocuments.length} file${linkedFundingDocuments.length === 1 ? "" : "s"} are capital-linked`,
          detail:
            fundingSourcesMissingSupport.length > 0
              ? "Tie lender docs and support files to the right capital source so packets stay clean."
              : "Funding-linked files are already organized for the capital stack.",
          actionLabel: "Open Capital",
          onAction: () => onOpenWorkspaceView?.("budget", "capital"),
          tone:
            fundingSourcesMissingSupport.length > 0 ? "bg-sand-50/70" : "bg-mist-50/70",
        },
        {
          eyebrow: "Latest support",
          title: latestLoanDocument?.displayName || "No lender file uploaded yet",
          detail: latestLoanDocument
            ? `Updated ${formatDate(latestLoanDocument.updatedAt || latestLoanDocument.createdAt)}`
            : "The most recent lender-facing file will appear here.",
          tone: "bg-white/92",
        },
      ];
    }

    if (activeView === "contracts-bids") {
      return [
        {
          eyebrow: "Vendor packets",
          title:
            vendorPacketGapRecords.length > 0
              ? `${vendorPacketGapRecords.length} vendor packet${vendorPacketGapRecords.length === 1 ? "" : "s"} need attention`
              : `${readyToPayVendorRecords.length} vendor${readyToPayVendorRecords.length === 1 ? "" : "s"} are payment-ready`,
          detail:
            vendorPacketGapRecords.length > 0
              ? `${vendorPacketGapRecords
                  .slice(0, 2)
                  .map(({ vendor }) => vendor?.name || "Unnamed vendor")
                  .join(" • ")}${vendorPacketGapRecords.length > 2 ? "..." : ""}`
              : "Contracts, packet files, and compliance are in better shape for payout.",
          actionLabel: "Open Procurement",
          onAction: () => onOpenWorkspaceView?.("execution", "procurement"),
          tone:
            vendorPacketGapRecords.length > 0 ? "bg-clay-50/70" : "bg-verdigris-50/70",
        },
        {
          eyebrow: "Contract stack",
          title: `${contractsDocumentCount} contract file${contractsDocumentCount === 1 ? "" : "s"} and ${complianceDocumentCount} compliance file${complianceDocumentCount === 1 ? "" : "s"}`,
          detail: "Keep proposals, agreements, W-9s, insurance, and packet backup easy to review before awarding or paying.",
          tone: "bg-mist-50/70",
        },
        {
          eyebrow: "Next move",
          title:
            vendorPacketGapRecords[0]?.vendor?.name || "No vendor packet gaps right now",
          detail: vendorPacketGapRecords[0]
            ? vendorPacketGapRecords[0].procurement.nextActions.join(" • ")
            : "Use this page to keep contracts, proposals, and vendor compliance together.",
          tone: "bg-white/92",
        },
      ];
    }

    if (activeView === "receipts-invoices") {
      return [
        {
          eyebrow: "Receipt backlog",
          title:
            receiptBacklog.length > 0
              ? `${receiptBacklog.length} receipt${receiptBacklog.length === 1 ? "" : "s"} still need review`
              : "Receipt review is current",
          detail:
            receiptBacklog.length > 0
              ? "AI-captured receipts still need to be matched cleanly to the ledger."
              : "The separate receipt capture queue is currently tied back to payments.",
          actionLabel: "Open Payments",
          onAction: () => onOpenWorkspaceView?.("budget", "payments"),
          tone: receiptBacklog.length > 0 ? "bg-clay-50/70" : "bg-verdigris-50/70",
        },
        {
          eyebrow: "Ledger support",
          title:
            paymentsMissingReceiptSupportCount > 0
              ? `${paymentsMissingReceiptSupportCount} payment${paymentsMissingReceiptSupportCount === 1 ? "" : "s"} still need support`
              : `${paymentsWithReceiptSupportCount} payment${paymentsWithReceiptSupportCount === 1 ? "" : "s"} have receipt support`,
          detail:
            paymentsMissingReceiptSupportCount > 0
              ? "Use this page to close the paper trail gap before reporting or draw packaging."
              : "Payment support is already attached across the working ledger.",
          actionLabel: "Open Payments",
          onAction: () => onOpenWorkspaceView?.("budget", "payments"),
          tone:
            paymentsMissingReceiptSupportCount > 0 ? "bg-sand-50/70" : "bg-mist-50/70",
        },
        {
          eyebrow: "Latest support",
          title: latestReceiptDocument?.displayName || "No receipt file uploaded yet",
          detail: latestReceiptDocument
            ? `Updated ${formatDate(latestReceiptDocument.updatedAt || latestReceiptDocument.createdAt)}`
            : "Upload invoice and receipt support here so the money trail stays clean.",
          tone: "bg-white/92",
        },
      ];
    }

    if (activeView === "photos") {
      return [
        {
          eyebrow: "Photo log",
          title:
            photoDocuments.length > 0
              ? `${photoDocuments.length} progress photo${photoDocuments.length === 1 ? "" : "s"} saved`
              : "No project photos yet",
          detail:
            photoDocuments.length > 0
              ? `${recentPhotoUploadsCount} uploaded in the last 14 days.`
              : "Use this page to keep visual before, during, and after proof together.",
          tone: photoDocuments.length > 0 ? "bg-mist-50/70" : "bg-sand-50/70",
        },
        {
          eyebrow: "Latest upload",
          title: latestPhotoDocument?.displayName || "No recent photo upload",
          detail: latestPhotoDocument
            ? `Updated ${formatDate(latestPhotoDocument.updatedAt || latestPhotoDocument.createdAt)}`
            : "Fresh progress photos will help underwriting, lender reviews, and investor updates later.",
          tone: "bg-white/92",
        },
      ];
    }

    return [
      {
        eyebrow: "Loan & Draw",
        title: `${linkedDrawDocuments.length} draw-linked file${linkedDrawDocuments.length === 1 ? "" : "s"}`,
        detail:
          drawRequestsMissingSupport.length > 0
            ? `${drawRequestsMissingSupport.length} draw request${drawRequestsMissingSupport.length === 1 ? "" : "s"} still need support.`
            : "Lender-facing support is organized and easy to find.",
        actionLabel: "Open Loan & Draw",
        onAction: () => onOpenWorkspaceView?.("files", "loan-draw"),
        tone: drawRequestsMissingSupport.length > 0 ? "bg-sand-50/70" : "bg-mist-50/70",
      },
      {
        eyebrow: "Receipts & Invoices",
        title: `${receiptBacklog.length} receipt${receiptBacklog.length === 1 ? "" : "s"} waiting review`,
        detail:
          paymentsMissingReceiptSupportCount > 0
            ? `${paymentsMissingReceiptSupportCount} payment${paymentsMissingReceiptSupportCount === 1 ? "" : "s"} still need attached support.`
            : "Payment backup is coming together cleanly.",
        actionLabel: "Open Receipts",
        onAction: () => onOpenWorkspaceView?.("files", "receipts-invoices"),
        tone:
          receiptBacklog.length > 0 || paymentsMissingReceiptSupportCount > 0
            ? "bg-clay-50/70"
            : "bg-white/92",
      },
      {
        eyebrow: "Contracts & Bids",
        title: `${vendorPacketGapRecords.length} vendor packet gap${vendorPacketGapRecords.length === 1 ? "" : "s"}`,
        detail:
          vendorPacketGapRecords.length > 0
            ? "Vendor packet cleanup is still blocking assignment or payout."
            : "Contracts and vendor packets are in a healthier place.",
        actionLabel: "Open Contracts",
        onAction: () => onOpenWorkspaceView?.("files", "contracts-bids"),
        tone: vendorPacketGapRecords.length > 0 ? "bg-sand-50/70" : "bg-verdigris-50/70",
      },
      {
        eyebrow: "Photos",
        title: `${photoDocuments.length} project photo${photoDocuments.length === 1 ? "" : "s"} saved`,
        detail:
          recentPhotoUploadsCount > 0
            ? `${recentPhotoUploadsCount} uploaded in the last 14 days.`
            : "Fresh progress photos help keep the project story credible.",
        actionLabel: "Open Photos",
        onAction: () => onOpenWorkspaceView?.("files", "photos"),
        tone: recentPhotoUploadsCount > 0 ? "bg-white/92" : "bg-sand-50/70",
      },
    ];
  }, [
    activeView,
    complianceDocumentCount,
    contractsDocumentCount,
    drawRequestsMissingSupport,
    fundingSourcesMissingSupport.length,
    latestLoanDocument,
    latestPhotoDocument,
    latestReceiptDocument,
    linkedDrawDocuments.length,
    linkedFundingDocuments.length,
    onOpenWorkspaceView,
    paymentsMissingReceiptSupportCount,
    paymentsWithReceiptSupportCount,
    photoDocuments.length,
    recentPhotoUploadsCount,
    readyToPayVendorRecords.length,
    receiptBacklog.length,
    vendorPacketGapRecords,
  ]);

  const primaryMetrics = useMemo(() => {
    if (activeView === "loan-draw") {
      return [
        {
          icon: LinkIcon,
          label: "Draw linked",
          value: linkedDrawDocuments.length,
          hint: "Files already attached directly to draw records.",
        },
        {
          icon: BanknotesIcon,
          label: "Funding linked",
          value: linkedFundingDocuments.length,
          hint: "Files connected to the capital stack.",
        },
        {
          icon: ExclamationTriangleIcon,
          label: "Missing draw support",
          value: drawRequestsMissingSupport.length,
          hint: "Draw requests that still need attached support.",
        },
        {
          icon: DocumentDuplicateIcon,
          label: "Visible files",
          value: visibleDocuments.length,
          hint: "Current lender-facing document count.",
        },
      ];
    }

    if (activeView === "contracts-bids") {
      return [
        {
          icon: ClipboardDocumentListIcon,
          label: "Contracts",
          value: contractsDocumentCount,
          hint: "Agreements, proposals, and scope support.",
        },
        {
          icon: ShieldCheckIcon,
          label: "Compliance",
          value: complianceDocumentCount,
          hint: "Packet files like W-9s and insurance.",
        },
        {
          icon: ExclamationTriangleIcon,
          label: "Packet gaps",
          value: vendorPacketGapRecords.length,
          hint: "Project vendors still missing required packet docs.",
        },
        {
          icon: BanknotesIcon,
          label: "Ready to pay",
          value: readyToPayVendorRecords.length,
          hint: "Vendors whose packet is clean enough for payout.",
        },
      ];
    }

    if (activeView === "receipts-invoices") {
      return [
        {
          icon: DocumentDuplicateIcon,
          label: "Receipt files",
          value: visibleDocuments.length,
          hint: "Uploaded invoices and payment support files.",
        },
        {
          icon: ClipboardDocumentListIcon,
          label: "Receipt backlog",
          value: receiptBacklog.length,
          hint: "Captured receipts still waiting to be tied back to a payment.",
        },
        {
          icon: LinkIcon,
          label: "Supported payments",
          value: paymentsWithReceiptSupportCount,
          hint: "Payments already carrying receipt support.",
        },
        {
          icon: ExclamationTriangleIcon,
          label: "Missing support",
          value: paymentsMissingReceiptSupportCount,
          hint: "Payments that still need invoice or receipt support.",
        },
      ];
    }

    if (activeView === "photos") {
      return [
        {
          icon: CameraIcon,
          label: "Photo files",
          value: visibleDocuments.length,
          hint: "Saved progress and field photography.",
        },
        {
          icon: PhotoIcon,
          label: "Last 14 days",
          value: recentPhotoUploadsCount,
          hint: "Recent visual documentation activity.",
        },
        {
          icon: DocumentDuplicateIcon,
          label: "Latest upload",
          value: latestPhotoDocument ? formatDate(latestPhotoDocument.updatedAt || latestPhotoDocument.createdAt) : "None",
          hint: "Most recent photo timestamp.",
        },
        {
          icon: FolderIcon,
          label: "All files",
          value: documents.length,
          hint: "Total project library size across all buckets.",
        },
      ];
    }

    return [
      {
        icon: DocumentDuplicateIcon,
        label: "Total files",
        value: visibleDocuments.length,
        hint: "All uploaded files tied to this property project.",
      },
      {
        icon: FolderIcon,
        label: "Active buckets",
        value: Object.values(groupedDocuments).filter((items) => items.length > 0).length,
        hint: "Structured categories currently in use.",
      },
      {
        icon: BanknotesIcon,
        label: "Draw support gaps",
        value: drawRequestsMissingSupport.length,
        hint: "Draw requests still missing attached support.",
      },
      {
        icon: PhotoIcon,
        label: "Recent photo uploads",
        value: recentPhotoUploadsCount,
        hint: "Progress photos added in the last 14 days.",
      },
    ];
  }, [
    activeView,
    complianceDocumentCount,
    contractsDocumentCount,
    documents.length,
    drawRequestsMissingSupport.length,
    groupedDocuments,
    latestPhotoDocument,
    linkedDrawDocuments.length,
    linkedFundingDocuments.length,
    paymentsMissingReceiptSupportCount,
    paymentsWithReceiptSupportCount,
    readyToPayVendorRecords.length,
    receiptBacklog.length,
    recentPhotoUploadsCount,
    vendorPacketGapRecords.length,
    visibleDocuments.length,
  ]);

  const handleCreateAcquisitionWorkspace = async () => {
    try {
      setIsCreatingWorkspace(true);
      const result = await createPropertyWorkspace(propertyKey, "acquisitions", {
        strategy: selectedStrategy,
      });

      if (result?.property) {
        onPropertyUpdated?.(result.property);
      }

      toast.success("Documents workspace created.");
    } catch (createError) {
      toast.error(createError.message || "Failed to create the acquisitions workspace.");
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const refreshDocuments = async () => {
    if (!investmentId) {
      return;
    }

    const nextDocuments = await getProjectDocuments(investmentId);
    setDocuments(Array.isArray(nextDocuments) ? nextDocuments : []);
  };

  const refreshStorageOverview = async () => {
    const overview = await getDocumentStorageOverview();
    setStorageOverview(overview);
  };

  const handleFundingSourceChange = (event) => {
    const nextFundingSourceId = event.target.value;
    setFundingSourceId(nextFundingSourceId);

    if (!drawRequestId) {
      return;
    }

    const activeDrawRequest = drawRequests.find((request) => request.drawId === drawRequestId) || null;
    if (activeDrawRequest?.sourceId && activeDrawRequest.sourceId !== nextFundingSourceId) {
      setDrawRequestId("");
    }
  };

  const handleDrawRequestChange = (event) => {
    const nextDrawRequestId = event.target.value;
    setDrawRequestId(nextDrawRequestId);

    const selectedDrawRequest =
      drawRequests.find((request) => request.drawId === nextDrawRequestId) || null;
    if (selectedDrawRequest?.sourceId) {
      setFundingSourceId(selectedDrawRequest.sourceId);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!displayName.trim() || !file) {
      setError("A document name and file are required.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("investmentId", investmentId);
      formData.append("displayName", displayName.trim());
      formData.append("category", category);
      if (fundingSourceId) formData.append("fundingSourceId", fundingSourceId);
      if (drawRequestId) formData.append("drawRequestId", drawRequestId);
      formData.append("document", file);

      await uploadProjectDocument(formData);
      await refreshDocuments();
      await refreshStorageOverview().catch(() => null);
      setDisplayName("");
      setCategory(viewConfig.defaultCategory);
      setFundingSourceId("");
      setDrawRequestId("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Document uploaded.");
    } catch (uploadError) {
      setError(uploadError.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm("Delete this document from the property library?")) {
      return;
    }

    try {
      setError("");
      await deleteProjectDocument(documentId);
      await refreshDocuments();
      await refreshStorageOverview().catch(() => null);
      toast.success("Document removed.");
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete document.");
    }
  };

  const handleOpenDocument = async (document) => {
    const previewWindow = window.open("", "_blank", "noopener,noreferrer");

    try {
      setError("");

      if (document.documentAsset) {
        const payload = await getDocumentAssetAccessUrl(document.documentAsset);
        if (previewWindow) {
          previewWindow.location.replace(payload.url);
        } else {
          window.open(payload.url, "_blank", "noopener,noreferrer");
        }
        return;
      }

      if (document.fileUrl) {
        if (previewWindow) {
          previewWindow.location.replace(document.fileUrl);
        } else {
          window.open(document.fileUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch (openError) {
      if (previewWindow) {
        previewWindow.close();
      }
      setError(openError.message || "Failed to open document.");
    }
  };

  const getLinkedRecordLabel = (document) => {
    const linkedDrawRequest = getDrawRequestById(drawRequests, document.drawRequestId);
    if (linkedDrawRequest) {
      return getDrawRequestLabel(
        linkedDrawRequest,
        Math.max(
          drawRequests.findIndex((request) => request.drawId === linkedDrawRequest.drawId),
          0
        )
      );
    }

    const linkedFundingSource = getFundingSourceById(fundingSources, document.fundingSourceId);
    if (linkedFundingSource) {
      return getFundingSourceLabel(
        linkedFundingSource,
        Math.max(
          fundingSources.findIndex((source) => source.sourceId === linkedFundingSource.sourceId),
          0
        )
      );
    }

    return "Not linked";
  };

  if (!investmentId) {
    return (
      <EmptyAcquisitionState
        property={property}
        selectedStrategy={selectedStrategy}
        onStrategyChange={(event) => setSelectedStrategy(event.target.value)}
        onCreate={handleCreateAcquisitionWorkspace}
        isCreating={isCreatingWorkspace}
      />
    );
  }

  if (loading) {
    return (
      <div className="section-card px-6 py-10 text-center text-ink-500">
        Loading document library...
      </div>
    );
  }

  if (error && !investment) {
    return (
      <div className="section-card px-6 py-10 text-center text-clay-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Documents</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Keep every project file in a structured property library
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            Store closing files, lender records, receipts, contracts, permits, and reports in one
            place so the property stays organized as execution gets busier.
          </p>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {primaryMetrics.map((metric) => (
          <MetricTile
            key={`${activeView}-${metric.label}`}
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
          />
        ))}
      </div>

      {focusCards.length ? (
        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Operational focus</span>
              <h4 className="mt-4 text-2xl font-semibold text-ink-900">
                Work the file lane from what matters right now
              </h4>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
                Each file page now highlights the support gaps, packet issues, and document groups
                that actually affect day-to-day project operations.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            {focusCards.map((card) => (
              <FocusCard key={`${activeView}-${card.eyebrow}-${card.title}`} {...card} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-card p-6 sm:p-7">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_360px]">
          <div id={sectionAnchors.allFiles || undefined}>
            <span className="eyebrow">
              {activeView === "all-files" ? "Structured buckets" : "Current operating view"}
            </span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">{viewConfig.title}</h4>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
              {viewConfig.description}
            </p>

            {storageOverview ? (
              <div className="mt-6 rounded-[20px] border border-ink-100 bg-white/85 px-5 py-4 text-sm text-ink-600">
                <p className="font-semibold text-ink-900">
                  {formatStorageBytes(storageOverview.bytesUsed)} of{" "}
                  {formatStorageBytes(storageOverview.totalStorageQuotaBytes)} used
                </p>
                <p className="mt-2">
                  {formatStorageBytes(storageOverview.bytesRemaining)} remaining. Max file size:{" "}
                  {formatStorageBytes(storageOverview.maxFileSizeBytes)} on your{" "}
                  {storageOverview.tierLabel} plan.
                </p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {visibleBuckets.map((bucket) => (
                <div key={bucket} className="rounded-[20px] border border-ink-100 bg-white/90 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{bucket}</p>
                      <p className="mt-2 text-sm leading-6 text-ink-500">
                        {bucketDescriptions[bucket]}
                      </p>
                    </div>
                    <span className="rounded-full bg-sand-50 px-3 py-1 text-[11px] font-semibold text-sand-700">
                      {groupedDocuments[bucket]?.length || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {error ? (
              <div className="mt-6 rounded-[20px] border border-clay-200 bg-clay-50 px-5 py-4 text-sm text-clay-700">
                {error}
              </div>
            ) : null}
          </div>

          <form
            ref={uploadFormRef}
            onSubmit={handleUpload}
            className={`rounded-[28px] border border-ink-100 bg-white/90 p-5 transition ${
              isUploadHighlighted ? "ring-2 ring-verdigris-300 shadow-soft" : ""
            }`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
              {uploadConfig.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-500">{uploadConfig.detail}</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Document name</label>
                <input
                  ref={documentNameInputRef}
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={uploadConfig.placeholder}
                  className="auth-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Category</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="auth-input"
                >
                  {uploadCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Funding source</label>
                <select
                  value={fundingSourceId}
                  onChange={handleFundingSourceChange}
                  className="auth-input"
                >
                  <option value="">No funding source selected</option>
                  {fundingSources.map((source, index) => (
                    <option key={source.sourceId || `source-${index}`} value={source.sourceId || ""}>
                      {getFundingSourceLabel(source, index)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Draw request</label>
                <select
                  value={drawRequestId}
                  onChange={handleDrawRequestChange}
                  className="auth-input"
                  disabled={!filteredDrawRequests.length}
                >
                  <option value="">No specific draw</option>
                  {filteredDrawRequests.map((drawRequest, index) => (
                    <option
                      key={drawRequest.drawId || `draw-${index}`}
                      value={drawRequest.drawId || ""}
                    >
                      {getDrawRequestLabel(drawRequest, index)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={DOCUMENT_FILE_ACCEPT}
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="block w-full text-sm text-ink-500"
                />
              </div>
            </div>

            {drawRequestId ? (
              <div className="mt-5 rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-800">
                <p className="font-semibold">This file will be draw-ready</p>
                <p className="mt-2">
                  The uploaded document will stay attached to the selected draw request and funding
                  source for lender packets and reporting.
                </p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isUploading}
              className="primary-action mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploading ? "Uploading..." : uploadConfig.buttonLabel}
            </button>
          </form>
        </div>
      </section>

      {recentDocuments.length > 0 ? (
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Recent files</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">
            {activeView === "all-files" ? "Latest uploads across the library" : `Latest ${viewConfig.title.toLowerCase()} uploads`}
          </h4>

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {recentDocuments.map((document) => {
              const linkedFundingSource = getFundingSourceById(
                fundingSources,
                document.fundingSourceId
              );
              const linkedDrawRequest = getDrawRequestById(drawRequests, document.drawRequestId);

              return (
                <div key={document._id} className="rounded-[22px] border border-ink-100 bg-white/85 p-5">
                  <p className="text-base font-semibold text-ink-900">{document.displayName}</p>
                  <p className="mt-2 text-sm text-ink-500">{document.category || "General"}</p>

                  {linkedFundingSource || linkedDrawRequest ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {linkedFundingSource ? (
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                          {getFundingSourceLabel(
                            linkedFundingSource,
                            Math.max(
                              fundingSources.findIndex(
                                (source) => source.sourceId === linkedFundingSource.sourceId
                              ),
                              0
                            )
                          )}
                        </span>
                      ) : null}
                      {linkedDrawRequest ? (
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                          {getDrawRequestLabel(
                            linkedDrawRequest,
                            Math.max(
                              drawRequests.findIndex(
                                (request) => request.drawId === linkedDrawRequest.drawId
                              ),
                              0
                            )
                          )}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Uploaded {formatDate(document.updatedAt || document.createdAt)}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(document)}
                      className="secondary-action"
                    >
                      Open file
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(document._id)}
                      className="ghost-action text-clay-700 hover:bg-clay-50 hover:text-clay-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Document ledger</span>
        <h4 className="mt-4 text-2xl font-semibold text-ink-900">
          {activeView === "all-files" ? "Browse the current file set" : `Work the ${viewConfig.title.toLowerCase()} file set`}
        </h4>

        <div className="mt-8">
          {sortedVisibleDocuments.length > 0 ? (
            <div className="overflow-hidden rounded-[24px] border border-ink-100 bg-white/92">
              <div className="hidden grid-cols-[minmax(0,1.5fr)_150px_190px_120px_170px] gap-4 border-b border-ink-100 bg-ink-50/60 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400 md:grid">
                <span>File</span>
                <span>Category</span>
                <span>Linked record</span>
                <span>Type</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-ink-100">
                {sortedVisibleDocuments.map((document) => (
                  <div
                    key={document._id}
                    className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.5fr)_150px_190px_120px_170px] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {document.displayName}
                      </p>
                      <p className="mt-1 text-sm text-ink-500">
                        Uploaded {formatDate(document.updatedAt || document.createdAt)}
                        {document.fileBytes ? ` • ${formatStorageBytes(document.fileBytes)}` : ""}
                      </p>
                    </div>

                    <div>
                      <DocumentCategoryPill label={document.category || "General"} />
                    </div>

                    <div className="text-sm text-ink-600">
                      <p className="font-medium text-ink-800">{getLinkedRecordLabel(document)}</p>
                    </div>

                    <div>
                      <span className="inline-flex rounded-full border border-ink-100 bg-white px-3 py-1 text-xs font-semibold text-ink-600">
                        {getFileTypeLabel(document)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 md:justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenDocument(document)}
                        className="secondary-action"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(document._id)}
                        className="ghost-action text-clay-700 hover:bg-clay-50 hover:text-clay-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
              No files yet in this view. Upload the first document and it will land here with the
              rest of the project library.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PropertyDocumentsPanel;
