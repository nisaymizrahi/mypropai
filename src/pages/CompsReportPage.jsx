import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

import CompsReportWorkspace from "../components/CompsReportWorkspace";
import MapView from "../components/MapView";
import PropertyAnalysisWorkspace from "../components/PropertyAnalysisWorkspace";
import SavedCompsReportsTab from "../components/SavedCompsReportsTab";
import {
  analyzeFullPropertyReport,
  analyzeStandaloneComps,
  createSubscriptionCheckout,
  getBillingAccess,
  getPropertyReports,
  previewLeadProperty,
  saveCompsReport,
} from "../utils/api";
import { searchAddressSuggestions } from "../utils/locationSearch";
import {
  buildAnalysisFromSavedReport,
  buildCompsFilters,
  buildCompsReportForm,
  buildPreviewToCompsReportForm,
  buildStandaloneCompsSubject,
  composeAddress,
  formatCurrency,
  formatDate,
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
  { id: "comps", label: "Comps Report" },
  { id: "analysis", label: "Full Property Analysis" },
  { id: "saved", label: "Saved Reports" },
];

const CompsReportPage = () => {
  const selectedSuggestionRef = useRef("");
  const [activeTab, setActiveTab] = useState("comps");
  const [detailForm, setDetailForm] = useState(() => buildCompsReportForm());
  const [suggestions, setSuggestions] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [fullReport, setFullReport] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [savedReportsLoading, setSavedReportsLoading] = useState(true);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [filters, setFilters] = useState(() => buildCompsFilters());
  const [compsNotice, setCompsNotice] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingFullReport, setIsAnalyzingFullReport] = useState(false);
  const [billingAccess, setBillingAccess] = useState(null);
  const [isBillingAccessLoading, setIsBillingAccessLoading] = useState(true);
  const [isStartingSubscription, setIsStartingSubscription] = useState(false);

  const subject = useMemo(() => buildStandaloneCompsSubject(detailForm), [detailForm]);
  const pricingTarget = subject.targetOffer ?? analysis?.summary?.recommendedOfferHigh ?? null;
  const hasMapCoordinates =
    subject.latitude !== null &&
    subject.latitude !== undefined &&
    subject.longitude !== null &&
    subject.longitude !== undefined;

  const activeMapComps = useMemo(() => {
    if (activeTab === "analysis") {
      return fullReport?.compsSummary?.comps || analysis?.comps || [];
    }

    return analysis?.comps || fullReport?.compsSummary?.comps || [];
  }, [activeTab, analysis?.comps, fullReport?.compsSummary?.comps]);

  const mapMarkers = useMemo(() => {
    const markers = [];

    if (hasMapCoordinates) {
      markers.push({
        lat: subject.latitude,
        lng: subject.longitude,
        color: "#0f766e",
      });
    }

    activeMapComps.forEach((comp) => {
      const lat = comp.latitude ?? comp.lat;
      const lng = comp.longitude ?? comp.lng;
      if (lat === null || lat === undefined || lng === null || lng === undefined) return;

      markers.push({
        lat,
        lng,
        color: "#d97706",
      });
    });

    return markers;
  }, [activeMapComps, hasMapCoordinates, subject.latitude, subject.longitude]);

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
      setSavedReports(reports);
    } catch (error) {
      console.error("Failed to load standalone saved reports", error);
      setSavedReports([]);
    } finally {
      setSavedReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedReports();
  }, [loadSavedReports]);

  useEffect(() => {
    const query = composeAddress({
      addressLine1: detailForm.addressLine1,
      city: detailForm.city,
      state: detailForm.state,
      zipCode: detailForm.zipCode,
    }).trim();

    if (query.length < 4 || query === selectedSuggestionRef.current) {
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

  const resetReports = () => {
    setAnalysis(null);
    setFullReport(null);
    setCompsNotice("");
  };

  const handlePreviewLookup = async (suggestedAddress = "") => {
    const lookupAddress = suggestedAddress || composeAddress(detailForm).trim();
    if (!lookupAddress) {
      toast.error("Enter an address first.");
      return;
    }

    setIsPreviewLoading(true);
    try {
      const preview = await previewLeadProperty({
        ...subject,
        address: lookupAddress,
      });

      setDetailForm((previous) => ({
        ...previous,
        ...buildPreviewToCompsReportForm(preview),
      }));

      selectedSuggestionRef.current = lookupAddress;
      setSuggestions([]);
      resetReports();
      toast.success("Property facts refreshed.");
    } catch (error) {
      toast.error(error.message || "Failed to refresh property facts.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    const parsedAddress = parseAddressLabel(suggestion.place_name);
    selectedSuggestionRef.current = composeAddress(parsedAddress) || suggestion.place_name;
    setSuggestions([]);
    setDetailForm((previous) => ({
      ...previous,
      ...parsedAddress,
    }));
    await handlePreviewLookup(suggestion.place_name);
  };

  const handleRunAnalysis = async () => {
    if (!subject.address) {
      toast.error("Add an address before running the report.");
      return;
    }

    setIsAnalyzing(true);
    setCompsNotice("");
    try {
      const result = await analyzeStandaloneComps(subject, filters);
      if (result?.noResults) {
        setAnalysis(null);
        setCompsNotice(
          result.msg ||
            "No comparable properties matched the selected filters. Try widening the radius or relaxing the size filters."
        );
        toast(result.msg || "No comparable properties matched the selected filters.");
        return;
      }

      setAnalysis(result);
      setCompsNotice("");
      await loadBillingAccess();
    } catch (error) {
      setCompsNotice("");
      toast.error(error.message || "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunFullAnalysis = async () => {
    if (!subject.address) {
      toast.error("Add an address before running the full analysis.");
      return;
    }

    setIsAnalyzingFullReport(true);
    try {
      const result = await analyzeFullPropertyReport(subject, filters);
      setFullReport(result);
      await loadBillingAccess();
    } catch (error) {
      toast.error(error.message || "Property analysis failed.");
    } finally {
      setIsAnalyzingFullReport(false);
    }
  };

  const handleSaveReport = async ({ subject: reportSubject, filters: reportFilters, valuationContext, selectedComps }) => {
    setIsSavingReport(true);
    try {
      const savedReport = await saveCompsReport({
        contextType: "standalone",
        subject: reportSubject,
        filters: reportFilters,
        valuationContext,
        selectedComps,
      });

      setSavedReports((previous) => [
        savedReport,
        ...previous.filter((report) => report._id !== savedReport._id),
      ]);
      setAnalysis(buildAnalysisFromSavedReport(savedReport, reportSubject));
      setActiveTab("saved");
      toast.success("Comps report saved.");
    } catch (error) {
      toast.error(error.message || "Failed to save comps report.");
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

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_360px]">
          <div>
            <span className="eyebrow">Property reports</span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight text-ink-900 sm:text-5xl">
              Start with an address, see it on the map, then run comps or a full property analysis.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600 sm:text-lg">
              This page keeps the same comps tool from your lead and project tabs, then layers a
              deeper property profile on top using the data you already have today.
            </p>
          </div>

          <div className="section-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
              Report flow
            </p>
            <div className="mt-5 space-y-3 text-sm leading-6 text-ink-600">
              <p>1. Select an address and auto-fill the property facts.</p>
              <p>2. Review the subject on the map and adjust the comp filters if needed.</p>
              <p>3. Run either the comps report or the fuller property analysis.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <div className="section-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-ink-900">Property intake</h2>
              <p className="mt-1 text-sm text-ink-500">
                Enter the subject details you want both report tabs to use.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handlePreviewLookup()}
              disabled={isPreviewLoading || !subject.address}
              className="ghost-action disabled:opacity-50"
            >
              <ArrowPathIcon className="mr-2 h-4 w-4" />
              {isPreviewLoading ? "Refreshing..." : "Auto-fill facts"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="relative md:col-span-2">
              <ReportField label="Address">
                <input
                  name="addressLine1"
                  value={detailForm.addressLine1}
                  onChange={handleFormChange}
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
              <input
                name="city"
                value={detailForm.city}
                onChange={handleFormChange}
                className="auth-input"
              />
            </ReportField>
            <ReportField label="State">
              <input
                name="state"
                value={detailForm.state}
                onChange={handleFormChange}
                className="auth-input"
              />
            </ReportField>
            <ReportField label="Zip code">
              <input
                name="zipCode"
                value={detailForm.zipCode}
                onChange={handleFormChange}
                className="auth-input"
              />
            </ReportField>
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
            <ReportField label="Asking price">
              <input
                name="sellerAskingPrice"
                type="number"
                value={detailForm.sellerAskingPrice}
                onChange={handleFormChange}
                className="auth-input"
                placeholder="0"
              />
            </ReportField>
            <ReportField label="Target offer">
              <input
                name="targetOffer"
                type="number"
                value={detailForm.targetOffer}
                onChange={handleFormChange}
                className="auth-input"
                placeholder="0"
              />
            </ReportField>
            <ReportField label="ARV / future value">
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

        <div className="section-card p-6">
          <h2 className="text-xl font-semibold text-ink-900">Current snapshot</h2>
          <p className="mt-1 text-sm text-ink-500">
            These are the numbers the comps report and property analysis will use.
          </p>

          <div className="mt-5 space-y-3">
            <SnapshotCard
              label="Address"
              value={subject.address || "No address selected yet"}
              hint={detailForm.county ? `${detailForm.county} County` : "Choose a property to begin"}
            />
            <SnapshotCard
              label="Property"
              value={
                [subject.propertyType, subject.squareFootage ? `${Number(subject.squareFootage).toLocaleString()} sqft` : null]
                  .filter(Boolean)
                  .join(" • ") || "No property facts yet"
              }
              hint={
                [subject.bedrooms ? `${subject.bedrooms} bd` : null, subject.bathrooms ? `${subject.bathrooms} ba` : null]
                  .filter(Boolean)
                  .join(" • ") || "Bedrooms and bathrooms will appear here"
              }
            />
            <SnapshotCard
              label="Pricing"
              value={`Ask ${formatCurrency(subject.sellerAskingPrice)}`}
              hint={`Target ${formatCurrency(pricingTarget)}`}
            />
            <SnapshotCard
              label="Listing status"
              value={subject.listingStatus || "No active listing status"}
              hint={
                subject.listedDate
                  ? `Listed ${formatDate(subject.listedDate)}`
                  : subject.lastSaleDate
                    ? `Last sold ${formatDate(subject.lastSaleDate)}`
                    : "Listing and transfer dates will appear here"
              }
            />
          </div>
        </div>
      </section>

      <section className="section-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink-900">Property map</h2>
            <p className="mt-1 text-sm text-ink-500">
              The subject property appears in green. Comparable properties appear in amber after a
              report runs.
            </p>
          </div>
          <div className="rounded-[18px] bg-sand-50 px-4 py-3 text-sm text-ink-600">
            <p className="font-semibold text-ink-900">{subject.address || "No address selected yet"}</p>
            <p className="mt-1">
              {hasMapCoordinates
                ? "Map centered on the selected property."
                : "Run auto-fill facts to fetch coordinates for the selected address."}
            </p>
          </div>
        </div>

        <div className="mt-5">
          {hasMapCoordinates ? (
            <MapView
              latitude={subject.latitude}
              longitude={subject.longitude}
              markers={mapMarkers}
              zoom={13}
            />
          ) : (
            <div className="flex h-[380px] items-center justify-center rounded-[20px] border border-dashed border-ink-200 bg-sand-50 px-6 text-center text-sm leading-6 text-ink-500">
              Choose an address and refresh the property facts to place the subject on the map.
            </div>
          )}
        </div>
      </section>

      <section className="surface-panel px-4 py-4 sm:px-5">
        <div className="flex flex-wrap gap-2">
          {tabOptions.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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
      </section>

      {activeTab === "comps" ? (
        <CompsReportWorkspace
          subject={subject}
          analysis={analysis}
          filters={filters}
          onFilterChange={handleFilterChange}
          isAnalyzing={isAnalyzing}
          onRunAnalysis={handleRunAnalysis}
          billingAccess={billingAccess}
          isBillingAccessLoading={isBillingAccessLoading}
          onStartSubscription={handleStartSubscription}
          isStartingSubscription={isStartingSubscription}
          onSaveReport={handleSaveReport}
          isSavingReport={isSavingReport}
          saveButtonLabel="Save Report"
          showOneTimeCheckout={false}
          compsNotice={compsNotice}
          runDisabled={!subject.address}
        />
      ) : activeTab === "saved" ? (
        <SavedCompsReportsTab
          reports={savedReports}
          isLoading={savedReportsLoading}
          title="Standalone comps reports"
          description="Saved comps snapshots from the main reports page live here so you can reopen any comp set without building a lead first."
          emptyTitle="No standalone comps reports saved yet"
          emptyMessage="Run a comps report from this page, choose the comp set you want, and save it to build your report library."
        />
      ) : (
        <PropertyAnalysisWorkspace
          report={fullReport}
          isAnalyzing={isAnalyzingFullReport}
          onRunAnalysis={handleRunFullAnalysis}
          billingAccess={billingAccess}
          isBillingAccessLoading={isBillingAccessLoading}
          onStartSubscription={handleStartSubscription}
          isStartingSubscription={isStartingSubscription}
          runDisabled={!subject.address}
        />
      )}
    </div>
  );
};

export default CompsReportPage;
