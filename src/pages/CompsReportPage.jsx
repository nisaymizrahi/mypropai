import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

import MasterDealReportWorkspace from "../components/MasterDealReportWorkspace";
import SavedCompsReportsTab from "../components/SavedCompsReportsTab";
import {
  analyzeStandaloneComps,
  createOneTimeCheckout,
  createSubscriptionCheckout,
  getBillingAccess,
  getPropertyReports,
  previewLeadProperty,
  saveCompsReport,
} from "../utils/api";
import { geocodeAddress, searchAddressSuggestions } from "../utils/locationSearch";
import {
  buildCompsFilterPayload,
  buildCompsFilters,
  buildCompsReportForm,
  buildDealForm,
  buildDealPayload,
  buildPreviewToCompsReportForm,
  buildStandaloneCompsSubject,
  composeAddress,
  formatCurrency,
  formatDate,
  normalizeMasterReport,
  parseAddressLabel,
  propertyTypeOptions,
} from "../utils/compsReport";

const ReportField = ({ label, hint, children, className = "" }) => (
  <label className={`space-y-2 ${className}`.trim()}>
    <span className="text-sm font-medium text-ink-700">{label}</span>
    {children}
    {hint ? <span className="block text-xs leading-5 text-ink-400">{hint}</span> : null}
  </label>
);

const SnapshotCard = ({ label, value, hint }) => (
  <div className="rounded-[18px] bg-sand-50 px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">{label}</p>
    <p className="mt-2 text-sm font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
  </div>
);

const tabOptions = [
  { id: "master", label: "Master Deal Report" },
  { id: "saved", label: "Saved Reports" },
];

const isSavedReportsBackendUnavailable = (error) =>
  String(error?.message || "").includes("Saved reports are not available on the server yet");

const hasCoordinateValue = (value) =>
  value !== null && value !== undefined && value !== "";

const CompsReportPage = () => {
  const selectedSuggestionRef = useRef("");
  const suppressSuggestionsRef = useRef(false);
  const mapLookupAttemptedRef = useRef("");
  const [activeTab, setActiveTab] = useState("master");
  const [detailForm, setDetailForm] = useState(() => buildCompsReportForm());
  const [dealForm, setDealForm] = useState(() => buildDealForm());
  const [suggestions, setSuggestions] = useState([]);
  const [report, setReport] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [savedReportsLoading, setSavedReportsLoading] = useState(true);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [filters, setFilters] = useState(() => buildCompsFilters());
  const [reportNotice, setReportNotice] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isMapLookupLoading, setIsMapLookupLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [billingAccess, setBillingAccess] = useState(null);
  const [isBillingAccessLoading, setIsBillingAccessLoading] = useState(true);
  const [isStartingSubscription, setIsStartingSubscription] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  const subject = useMemo(() => buildStandaloneCompsSubject(detailForm), [detailForm]);
  const pricingTarget = subject.targetOffer ?? report?.valuation?.blendedEstimate ?? null;
  const hasMapCoordinates =
    subject.latitude !== null &&
    subject.latitude !== undefined &&
    subject.longitude !== null &&
    subject.longitude !== undefined;

  const loadBillingAccess = useCallback(async () => {
    try {
      setIsBillingAccessLoading(true);
      const access = await getBillingAccess("comps_report");
      setBillingAccess(access);
    } catch (error) {
      setBillingAccess(null);
    } finally {
      setIsBillingAccessLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBillingAccess();
  }, [loadBillingAccess]);

  const loadSavedReports = useCallback(async () => {
    try {
      setSavedReportsLoading(true);
      const reports = await getPropertyReports({
        kind: "comps",
        contextType: "standalone",
      });
      setSavedReports(reports.map((item) => normalizeMasterReport(item)));
    } catch (error) {
      if (!isSavedReportsBackendUnavailable(error)) {
        console.error("Failed to load standalone saved reports", error);
      }
      setSavedReports([]);
    } finally {
      setSavedReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedReports();
  }, [loadSavedReports]);

  useEffect(() => {
    const lookupAddress = subject.address?.trim();

    if (!lookupAddress || hasMapCoordinates || isPreviewLoading) {
      if (hasMapCoordinates) {
        mapLookupAttemptedRef.current = lookupAddress || "";
      }
      setIsMapLookupLoading(false);
      return undefined;
    }

    if (mapLookupAttemptedRef.current === lookupAddress) {
      return undefined;
    }

    mapLookupAttemptedRef.current = lookupAddress;
    let cancelled = false;

    const resolveCoordinates = async () => {
      setIsMapLookupLoading(true);

      try {
        const geocodeResult = await geocodeAddress(lookupAddress);
        const [geocodedLongitude, geocodedLatitude] = geocodeResult?.features?.[0]?.center || [];

        if (!hasCoordinateValue(geocodedLatitude) || !hasCoordinateValue(geocodedLongitude)) {
          return;
        }

        if (cancelled) {
          return;
        }

        setDetailForm((previous) => {
          const previousAddress = composeAddress(previous).trim();
          if (previousAddress && previousAddress !== lookupAddress) {
            return previous;
          }

          return {
            ...previous,
            latitude: geocodedLatitude,
            longitude: geocodedLongitude,
          };
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to geocode report address for initial map render", error);
        }
      } finally {
        if (!cancelled) {
          setIsMapLookupLoading(false);
        }
      }
    };

    resolveCoordinates();

    return () => {
      cancelled = true;
    };
  }, [hasMapCoordinates, isPreviewLoading, subject.address]);

  useEffect(() => {
    const query = composeAddress({
      addressLine1: detailForm.addressLine1,
      city: detailForm.city,
      state: detailForm.state,
      zipCode: detailForm.zipCode,
    }).trim();

    if (suppressSuggestionsRef.current || query.length < 4 || query === selectedSuggestionRef.current) {
      setSuggestions([]);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchAddressSuggestions(query, controller.signal);
        setSuggestions(results);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Address suggestion error", error);
        }
      }
    }, 160);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [detailForm.addressLine1, detailForm.city, detailForm.state, detailForm.zipCode]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    if (["addressLine1", "city", "state", "zipCode"].includes(name)) {
      suppressSuggestionsRef.current = false;
      selectedSuggestionRef.current = "";
    }
    setDetailForm((previous) => {
      if (name === "propertyType" && value !== "multi-family") {
        return {
          ...previous,
          [name]: value,
          unitCount: "",
        };
      }

      return {
        ...previous,
        [name]: value,
      };
    });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleDealChange = (event) => {
    const { name, value } = event.target;
    setDealForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetReport = () => {
    setReport(null);
    setReportNotice("");
  };

  const handlePreviewLookup = async (suggestedAddress = "", fieldOverrides = {}) => {
    const previewSource = {
      ...detailForm,
      ...fieldOverrides,
    };
    const lookupAddress = suggestedAddress || composeAddress(previewSource).trim();
    if (!lookupAddress) {
      toast.error("Enter an address first.");
      return;
    }

    setIsPreviewLoading(true);
    try {
      const preview = await previewLeadProperty({
        ...buildStandaloneCompsSubject(previewSource),
        address: lookupAddress,
      });

      const mappedPreview = buildPreviewToCompsReportForm(preview);
      let fallbackLatitude =
        hasCoordinateValue(mappedPreview.latitude) ? mappedPreview.latitude : previewSource.latitude;
      let fallbackLongitude =
        hasCoordinateValue(mappedPreview.longitude) ? mappedPreview.longitude : previewSource.longitude;

      if (!hasCoordinateValue(fallbackLatitude) || !hasCoordinateValue(fallbackLongitude)) {
        try {
          const geocodeResult = await geocodeAddress(lookupAddress);
          const [geocodedLongitude, geocodedLatitude] = geocodeResult?.features?.[0]?.center || [];

          if (hasCoordinateValue(geocodedLatitude) && hasCoordinateValue(geocodedLongitude)) {
            fallbackLatitude = geocodedLatitude;
            fallbackLongitude = geocodedLongitude;
          }
        } catch (geocodeError) {
          console.error("Failed to geocode report address for map fallback", geocodeError);
        }
      }

      suppressSuggestionsRef.current = true;
      setDetailForm((previous) => {
        const next = {
          ...previous,
          ...mappedPreview,
          sellerAskingPrice:
            mappedPreview.sellerAskingPrice !== "" ? mappedPreview.sellerAskingPrice : previewSource.sellerAskingPrice,
          rehabEstimate:
            mappedPreview.rehabEstimate !== "" ? mappedPreview.rehabEstimate : previewSource.rehabEstimate,
          targetOffer:
            mappedPreview.targetOffer !== "" ? mappedPreview.targetOffer : previewSource.targetOffer,
          arv: mappedPreview.arv !== "" ? mappedPreview.arv : previewSource.arv,
          latitude: hasCoordinateValue(fallbackLatitude) ? fallbackLatitude : previous.latitude,
          longitude: hasCoordinateValue(fallbackLongitude) ? fallbackLongitude : previous.longitude,
        };
        selectedSuggestionRef.current = composeAddress(next) || lookupAddress;
        return next;
      });

      setDealForm((previous) => ({
        ...previous,
        askingPrice: previous.askingPrice || mappedPreview.sellerAskingPrice || previous.askingPrice,
        rehabEstimate: previous.rehabEstimate || previewSource.rehabEstimate || previous.rehabEstimate,
      }));
      setSuggestions([]);
      resetReport();
      toast.success("Property facts refreshed.");
    } catch (error) {
      toast.error(error.message || "Failed to refresh property facts.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    const parsedAddress = parseAddressLabel(suggestion.place_name);
    const latitude = suggestion.center?.[1] ?? "";
    const longitude = suggestion.center?.[0] ?? "";

    suppressSuggestionsRef.current = true;
    selectedSuggestionRef.current = composeAddress(parsedAddress) || suggestion.place_name;
    setSuggestions([]);
    setDetailForm((previous) => ({
      ...previous,
      ...parsedAddress,
      latitude,
      longitude,
    }));
    await handlePreviewLookup(suggestion.place_name, {
      ...parsedAddress,
      latitude,
      longitude,
    });
  };

  const handleRunAnalysis = async () => {
    if (!subject.address) {
      toast.error("Add an address before running the report.");
      return;
    }

    setIsAnalyzing(true);
    setReportNotice("");
    try {
      const result = await analyzeStandaloneComps(
        subject,
        buildCompsFilterPayload(filters),
        buildDealPayload(dealForm)
      );
      const normalized = normalizeMasterReport(result, subject);
      setReport(normalized);
      setReportNotice("");
      await loadBillingAccess();
    } catch (error) {
      setReportNotice("");
      toast.error(error.message || "Report generation failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = async ({
    subject: reportSubject,
    filters: reportFilters,
    deal: reportDeal,
    valuationContext,
    selectedComps,
    reportData,
  }) => {
    setIsSavingReport(true);
    try {
      const savedReport = await saveCompsReport({
        contextType: "standalone",
        subject: reportSubject,
        deal: reportDeal,
        filters: reportFilters,
        valuationContext,
        selectedComps,
        reportData,
      });

      const normalized = normalizeMasterReport(savedReport, reportSubject);
      setSavedReports((previous) => [
        normalized,
        ...previous.filter((item) => item._id !== normalized._id),
      ]);
      setReport(normalized);
      setActiveTab("saved");
      toast.success("Master Deal Report saved.");
    } catch (error) {
      toast.error(error.message || "Failed to save the report.");
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleStartSubscription = async () => {
    setIsStartingSubscription(true);
    try {
      const { url } = await createSubscriptionCheckout("pro");
      window.location.href = url;
    } catch (error) {
      toast.error(error.message || "Could not start the Pro checkout.");
      setIsStartingSubscription(false);
    }
  };

  const handleBuyCredits = async () => {
    setIsStartingCheckout(true);
    try {
      const kind = billingAccess?.hasActiveSubscription ? "pro_comps_topup_10" : "comps_pack_10";
      const { url } = await createOneTimeCheckout({
        kind,
        returnPath: window.location.pathname,
      });
      window.location.href = url;
    } catch (error) {
      toast.error(error.message || "Could not start the credits checkout.");
      setIsStartingCheckout(false);
    }
  };

  const propertyStepPanel = (
    <div className="space-y-4" data-testid="property-current-snapshot">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SnapshotCard
          label="Address"
          value={subject.address || "No address selected yet"}
          hint={
            isMapLookupLoading
              ? "Finding map coordinates..."
              : detailForm.county
                ? `${detailForm.county} County`
                : "Start with the address"
          }
        />
        <SnapshotCard
          label="Property"
          value={
            [
              subject.propertyType,
              subject.squareFootage ? `${Number(subject.squareFootage).toLocaleString()} sqft` : null,
            ]
              .filter(Boolean)
              .join(" • ") || "Add the property basics"
          }
          hint={
            [subject.bedrooms ? `${subject.bedrooms} bd` : null, subject.bathrooms ? `${subject.bathrooms} ba` : null]
              .filter(Boolean)
              .join(" • ") || "Beds and baths appear here"
          }
        />
        <SnapshotCard
          label="Pricing"
          value={`Ask ${formatCurrency(subject.sellerAskingPrice)}`}
          hint={`Target ${formatCurrency(pricingTarget)}`}
        />
        <SnapshotCard
          label="Condition"
          value={`Rehab ${formatCurrency(subject.rehabEstimate)}`}
          hint={
            subject.lastSaleDate
              ? `Last sold ${formatDate(subject.lastSaleDate)}`
              : "Add rehab only if you already know it"
          }
        />
      </div>

      <div className="rounded-[22px] border border-ink-100 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold text-ink-900">Find the property</h4>
            <p className="mt-1 text-sm text-ink-500">
              Start with the address, then let the app pull in facts where possible.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handlePreviewLookup()}
            disabled={isPreviewLoading || !subject.address}
            data-testid="report-autofill-button"
            className="ghost-action disabled:opacity-50"
          >
            <ArrowPathIcon className="mr-2 h-4 w-4" />
            {isPreviewLoading ? "Refreshing..." : "Auto-fill facts"}
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="relative md:col-span-3">
            <ReportField
              label="Address"
              hint="Use the property address you want the report centered on."
            >
              <input
                name="addressLine1"
                value={detailForm.addressLine1}
                onChange={handleFormChange}
                data-testid="report-address-input"
                className="auth-input"
                placeholder="Start typing the property address..."
              />
            </ReportField>

            {suggestions.length > 0 ? (
              <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-[16px] border border-ink-100 bg-white shadow-soft">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full border-b border-ink-100 px-4 py-3 text-left text-sm text-ink-700 transition hover:bg-sand-50 last:border-b-0"
                  >
                    {suggestion.place_name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <ReportField label="City">
            <input name="city" value={detailForm.city} onChange={handleFormChange} className="auth-input" />
          </ReportField>
          <ReportField label="State">
            <input name="state" value={detailForm.state} onChange={handleFormChange} className="auth-input" />
          </ReportField>
          <ReportField label="Zip code">
            <input name="zipCode" value={detailForm.zipCode} onChange={handleFormChange} className="auth-input" />
          </ReportField>
        </div>
      </div>

      <div className="rounded-[22px] border border-ink-100 bg-white p-5">
        <h4 className="text-lg font-semibold text-ink-900">Property basics</h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ReportField label="Property type">
            <select
              name="propertyType"
              value={detailForm.propertyType}
              onChange={handleFormChange}
              className="auth-input"
            >
              {propertyTypeOptions.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </ReportField>
          <ReportField label="Bedrooms">
            <input
              name="bedrooms"
              type="number"
              value={detailForm.bedrooms}
              onChange={handleFormChange}
              className="auth-input"
              placeholder="0"
            />
          </ReportField>
          <ReportField label="Bathrooms">
            <input
              name="bathrooms"
              type="number"
              step="0.5"
              value={detailForm.bathrooms}
              onChange={handleFormChange}
              className="auth-input"
              placeholder="0"
            />
          </ReportField>
          <ReportField label="Square footage">
            <input
              name="squareFootage"
              type="number"
              value={detailForm.squareFootage}
              onChange={handleFormChange}
              className="auth-input"
              placeholder="0"
            />
          </ReportField>
          <ReportField label="Lot size">
            <input
              name="lotSize"
              type="number"
              value={detailForm.lotSize}
              onChange={handleFormChange}
              className="auth-input"
              placeholder="0"
            />
          </ReportField>
          <ReportField label="Year built">
            <input
              name="yearBuilt"
              type="number"
              value={detailForm.yearBuilt}
              onChange={handleFormChange}
              className="auth-input"
              placeholder="0"
            />
          </ReportField>
          {detailForm.propertyType === "multi-family" ? (
            <ReportField label="Unit count">
              <input
                name="unitCount"
                type="number"
                value={detailForm.unitCount}
                onChange={handleFormChange}
                className="auth-input"
                placeholder="0"
              />
            </ReportField>
          ) : null}
        </div>
      </div>

      <div className="rounded-[22px] border border-ink-100 bg-white p-5">
        <h4 className="text-lg font-semibold text-ink-900">Pricing anchors</h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReportField label="Asking price">
            <input
              name="sellerAskingPrice"
              type="number"
              value={detailForm.sellerAskingPrice}
              onChange={handleFormChange}
              data-testid="report-asking-price-input"
              className="auth-input"
              placeholder="0"
            />
          </ReportField>
          <ReportField label="Estimated rehab">
            <input
              name="rehabEstimate"
              type="number"
              value={detailForm.rehabEstimate}
              onChange={handleFormChange}
              data-testid="report-rehab-input"
              className="auth-input"
              placeholder="0"
            />
          </ReportField>
          <ReportField label="Target offer" hint="Optional">
            <input
              name="targetOffer"
              type="number"
              value={detailForm.targetOffer}
              onChange={handleFormChange}
              className="auth-input"
              placeholder="0"
            />
          </ReportField>
          <ReportField label="ARV" hint="Optional">
            <input
              name="arv"
              type="number"
              value={detailForm.arv}
              onChange={handleFormChange}
              className="auth-input"
              placeholder="0"
            />
          </ReportField>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong overflow-hidden px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="eyebrow">Master Deal Reports</span>
            <h1 className="mt-4 font-display text-[2.5rem] leading-[0.94] text-ink-900 sm:text-[3rem]">
              Investor-ready reports with a cleaner deal workflow
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-600 sm:text-base">
              Enter the property, guide the underwriting, and export a presentation-grade deal report without
              fighting through a long page.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] border border-ink-100 bg-white/80 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Library</p>
              <p className="mt-2 text-2xl font-semibold text-ink-900">{savedReports.length}</p>
              <p className="mt-1 text-xs text-ink-500">Saved master reports</p>
            </div>
            <div className="rounded-[20px] border border-ink-100 bg-white/80 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Live subject</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">
                {subject.address || "No address yet"}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {subject.propertyType || "Property type pending"}
              </p>
            </div>
            <div className="rounded-[20px] border border-ink-100 bg-white/80 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Current ask</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{formatCurrency(subject.sellerAskingPrice)}</p>
              <p className="mt-1 text-xs text-ink-500">Rehab {formatCurrency(subject.rehabEstimate)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-panel px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabOptions.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-testid={`report-tab-${tab.id}`}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-ink-900 text-white shadow-soft"
                    : "bg-white/80 text-ink-600 hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-sm text-ink-500">
            {activeTab === "master"
              ? "Guided input on the left, polished report on the right."
              : "Browse, reopen, and export saved reports."}
          </p>
        </div>
      </section>

      {activeTab === "master" ? (
        <MasterDealReportWorkspace
          subject={subject}
          report={report}
          filters={filters}
          deal={dealForm}
          onFilterChange={handleFilterChange}
          onDealChange={handleDealChange}
          isAnalyzing={isAnalyzing}
          onRunAnalysis={handleRunAnalysis}
          billingAccess={billingAccess}
          isBillingAccessLoading={isBillingAccessLoading}
          onStartSubscription={handleStartSubscription}
          isStartingSubscription={isStartingSubscription}
          onBuyReport={handleBuyCredits}
          isStartingCheckout={isStartingCheckout}
          onSaveReport={handleSaveReport}
          isSavingReport={isSavingReport}
          saveButtonLabel="Save Master Report"
          showOneTimeCheckout
          reportNotice={reportNotice}
          runDisabled={!subject.address}
          renderSubjectPanel={() => propertyStepPanel}
        />
      ) : (
        <SavedCompsReportsTab
          reports={savedReports}
          isLoading={savedReportsLoading}
          title="Saved Master Deal Reports"
          description="Saved premium deal reports live here so you can reopen, compare, and export them later."
          emptyTitle="No saved deal reports yet"
          emptyMessage="Run a Master Deal Report from this page and save it to build your report library."
        />
      )}
    </div>
  );
};

export default CompsReportPage;
