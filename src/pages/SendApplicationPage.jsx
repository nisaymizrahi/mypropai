import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ClipboardDocumentListIcon,
  LinkIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { API_BASE_URL } from "../config";
import { getAuthHeaders, getManagedProperties } from "../utils/api";

const LoadingCard = () => (
  <div className="rounded-[24px] border border-ink-100 bg-white px-5 py-10 text-center text-ink-500">
    Loading vacant units...
  </div>
);

const buildPropertyQuery = (propertyId) =>
  propertyId ? `?${new URLSearchParams({ propertyId }).toString()}` : "";

const SendApplicationPage = () => {
  const [units, setUnits] = useState([]);
  const [managedProperties, setManagedProperties] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [apiError, setApiError] = useState(false);
  const [managementError, setManagementError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const propertyIdParam = searchParams.get("propertyId") || "";
  const unitIdParam = searchParams.get("unitId") || "";

  useEffect(() => {
    let isMounted = true;

    const fetchPageData = async () => {
      setIsLoading(true);
      setApiError(false);
      setManagementError(false);

      const [unitsResult, managementResult] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/management/units/vacant`, {
          headers: getAuthHeaders(),
        }),
        getManagedProperties(),
      ]);

      if (!isMounted) {
        return;
      }

      if (unitsResult.status === "fulfilled") {
        if (unitsResult.value.ok) {
          const data = await unitsResult.value.json();
          if (isMounted) {
            setUnits(data || []);
          }
        } else {
          setApiError(true);
          toast.error("Failed to load vacant units. Try again after your units finish loading.");
        }
      } else {
        setApiError(true);
        toast.error("Failed to load vacant units. Try again after your units finish loading.");
      }

      if (managementResult.status === "fulfilled") {
        setManagedProperties(managementResult.value || []);
      } else {
        setManagementError(true);
      }

      setIsLoading(false);
    };

    fetchPageData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPropertyId = useMemo(() => {
    if (managedProperties.some((property) => property._id === propertyIdParam)) {
      return propertyIdParam;
    }

    if (!isLoading && managedProperties.length === 1) {
      return managedProperties[0]._id;
    }

    return "";
  }, [isLoading, managedProperties, propertyIdParam]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (selectedPropertyId && propertyIdParam !== selectedPropertyId) {
      setSearchParams({ propertyId: selectedPropertyId }, { replace: true });
      return;
    }

    if (!selectedPropertyId && propertyIdParam) {
      setSearchParams({}, { replace: true });
    }
  }, [isLoading, propertyIdParam, selectedPropertyId, setSearchParams]);

  const selectedProperty = useMemo(
    () => managedProperties.find((property) => property._id === selectedPropertyId) || null,
    [managedProperties, selectedPropertyId]
  );

  const availableUnits = useMemo(() => {
    if (managedProperties.length > 1 && !selectedPropertyId) {
      return [];
    }

    if (!selectedPropertyId) {
      return units;
    }

    return units.filter((unit) => unit.property?._id === selectedPropertyId);
  }, [managedProperties.length, selectedPropertyId, units]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setSelectedUnit((currentSelectedUnit) => {
      if (currentSelectedUnit && availableUnits.some((unit) => unit._id === currentSelectedUnit)) {
        return currentSelectedUnit;
      }

      if (unitIdParam && availableUnits.some((unit) => unit._id === unitIdParam)) {
        return unitIdParam;
      }

      if (availableUnits.length === 1) {
        return availableUnits[0]._id;
      }

      return "";
    });
  }, [availableUnits, isLoading, unitIdParam]);

  useEffect(() => {
    setGeneratedLink("");
  }, [selectedPropertyId, selectedUnit]);

  const selectedUnitDetails = useMemo(
    () => units.find((unit) => unit._id === selectedUnit) || null,
    [selectedUnit, units]
  );

  const handlePropertyChange = (event) => {
    const nextPropertyId = event.target.value;
    setSelectedUnit("");
    setSearchParams(nextPropertyId ? { propertyId: nextPropertyId } : {});
  };

  const generateLink = () => {
    const base = window.location.origin;
    if (selectedUnit) {
      setGeneratedLink(`${base}/apply/${selectedUnit}`);
      return;
    }

    if (managedProperties.length > 1 && !selectedPropertyId) {
      toast.error("Choose a property before generating an application link.");
      return;
    }

    toast.error(apiError ? "Vacant units could not be loaded." : "Please select a vacant unit.");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied to clipboard.");
    } catch (error) {
      toast.error("Could not copy the link automatically.");
    }
  };

  const handleAddUnit = () => {
    if (selectedPropertyId) {
      navigate(`/management/${selectedPropertyId}`);
      return;
    }

    if (managedProperties.length === 1) {
      navigate(`/management/${managedProperties[0]._id}`);
      return;
    }

    navigate("/management");
  };

  const propertyApplicationsQuery = buildPropertyQuery(selectedPropertyId);

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <span className="eyebrow">Application distribution</span>
            <h2 className="page-hero-title">
              Generate a clean rental application link without losing property context.
            </h2>
            <p className="page-hero-copy">
              Pick the property first, confirm the correct vacant unit, and generate a public
              application URL that stays tied to the right leasing pipeline.
            </p>
          </div>

          <div className="section-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Vacant inventory
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink-900">
                  {selectedPropertyId ? availableUnits.length : units.length}
                </h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                <ClipboardDocumentListIcon className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="rounded-[18px] bg-sand-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Property scope
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {selectedProperty
                    ? selectedProperty.address
                    : managedProperties.length > 0
                      ? "Choose a property"
                      : "No managed properties"}
                </p>
              </div>
              <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Selected unit
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {selectedUnitDetails
                    ? `${selectedUnitDetails.property?.address} - ${selectedUnitDetails.name}`
                    : "None selected"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <div className="section-card p-6 sm:p-7">
          <span className="eyebrow">Unit selection</span>
          <h3 className="mt-4 text-2xl font-semibold text-ink-900">Choose a vacant unit</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Select the property first when you manage multiple assets, then choose the exact vacant
            unit to generate the public application link.
          </p>

          <div className="mt-6 space-y-6">
            {managedProperties.length > 1 && (
              <div>
                <label htmlFor="property" className="auth-label">
                  Property
                </label>
                <select
                  id="property"
                  className="auth-input"
                  value={selectedPropertyId}
                  onChange={handlePropertyChange}
                >
                  <option value="">Choose a property</option>
                  {managedProperties.map((property) => (
                    <option key={property._id} value={property._id}>
                      {property.address}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="unit" className="auth-label">
                Vacant unit
              </label>
              {isLoading ? (
                <LoadingCard />
              ) : (
                <select
                  id="unit"
                  className="auth-input"
                  value={selectedUnit}
                  onChange={(event) => setSelectedUnit(event.target.value)}
                  disabled={
                    !availableUnits.length || (managedProperties.length > 1 && !selectedPropertyId)
                  }
                >
                  <option value="">
                    {managedProperties.length > 1 && !selectedPropertyId
                      ? "Choose a property first"
                      : "Choose a unit"}
                  </option>
                  {availableUnits.map((unit) => (
                    <option key={unit._id} value={unit._id}>
                      {unit.property?.address} - {unit.name}
                    </option>
                  ))}
                </select>
              )}

              {managedProperties.length === 0 && !apiError && !isLoading && (
                <div className="mt-4 rounded-[22px] border border-dashed border-ink-200 bg-sand-50 p-5">
                  <p className="text-sm font-semibold text-ink-900">No managed properties yet</p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    Start management on a Fix &amp; Rent or Rental property first so you can create
                    leasing links from a real property workspace.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate("/properties/new?workspace=management")}
                      className="primary-action"
                    >
                      Create Managed Property
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/management")}
                      className="secondary-action"
                    >
                      Open Managed Properties
                    </button>
                  </div>
                </div>
              )}

              {managedProperties.length > 1 && !selectedPropertyId && !isLoading && (
                <div className="mt-4 rounded-[22px] border border-dashed border-ink-200 bg-sand-50 p-5">
                  <p className="text-sm font-semibold text-ink-900">Choose a property first</p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    Leasing links now stay anchored to a specific property so the resulting
                    applications land in the right review queue.
                  </p>
                </div>
              )}

              {managedProperties.length > 0 &&
                selectedPropertyId &&
                availableUnits.length === 0 &&
                !apiError &&
                !isLoading && (
                  <div className="mt-4 rounded-[22px] border border-dashed border-ink-200 bg-sand-50 p-5">
                    <p className="text-sm font-semibold text-ink-900">No vacant units for this property</p>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      Add a unit or mark an existing one vacant before sending a public application
                      link for {selectedProperty?.address || "this property"}.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button type="button" onClick={handleAddUnit} className="primary-action">
                        Open Property
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/management")}
                        className="secondary-action"
                      >
                        View All Properties
                      </button>
                    </div>
                  </div>
                )}

              {apiError && (
                <div className="mt-4 rounded-[20px] border border-clay-200 bg-clay-50 px-4 py-4 text-sm text-clay-700">
                  Vacant units are unavailable right now. Refresh and try again.
                </div>
              )}

              {managementError && !isLoading && (
                <p className="mt-3 text-sm text-clay-700">
                  Management properties could not be loaded, so property shortcuts may be
                  unavailable right now.
                </p>
              )}
            </div>
          </div>

          {selectedUnitDetails && (
            <div className="mt-6 rounded-[22px] border border-ink-100 bg-sand-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Selected unit summary
              </p>
              <h4 className="mt-2 text-lg font-semibold text-ink-900">
                {selectedUnitDetails.property?.address}
              </h4>
              <p className="mt-1 text-sm text-ink-500">{selectedUnitDetails.name}</p>
            </div>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={generateLink}
              disabled={isLoading || apiError || !availableUnits.length}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PaperAirplaneIcon className="mr-2 h-5 w-5" />
              Generate application link
            </button>
          </div>
        </div>

        <div className="section-card p-6 sm:p-7">
          <span className="eyebrow">Shareable link</span>
          <h3 className="mt-4 text-2xl font-semibold text-ink-900">Public application URL</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Once generated, this link can be shared directly with prospective tenants.
          </p>

          {generatedLink ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-[22px] border border-ink-100 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                    <LinkIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Generated link
                    </p>
                    <p className="mt-2 break-all text-sm font-medium text-ink-900">{generatedLink}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={copyToClipboard} className="secondary-action">
                  Copy link
                </button>
                {selectedPropertyId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/applications${propertyApplicationsQuery}`)}
                    className="secondary-action"
                  >
                    Review applications
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[22px] border border-dashed border-ink-200 bg-sand-50 px-5 py-10 text-center text-ink-500">
              Generate a link first and it will appear here ready to share.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SendApplicationPage;
