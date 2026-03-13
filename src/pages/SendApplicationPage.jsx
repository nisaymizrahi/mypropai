import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  EnvelopeIcon,
  HomeModernIcon,
  LinkIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { createApplicationInvite, getManagedProperties } from "../utils/api";

const scopeOptions = [
  {
    value: "portfolio",
    label: "General application",
    description: "Send a portfolio-wide application without tying it to a property or unit yet.",
  },
  {
    value: "property",
    label: "Specific property",
    description: "Keep the application tied to one property while leaving the unit flexible.",
  },
  {
    value: "unit",
    label: "Specific unit",
    description: "Send the application for an exact unit when you already know the placement.",
  },
];

const LoadingCard = ({ children }) => (
  <div className="rounded-[24px] border border-ink-100 bg-white px-5 py-10 text-center text-ink-500">
    {children}
  </div>
);

const SendApplicationPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [managedProperties, setManagedProperties] = useState([]);
  const [generatedLink, setGeneratedLink] = useState("");
  const [scope, setScope] = useState(
    scopeOptions.some((option) => option.value === searchParams.get("scope"))
      ? searchParams.get("scope")
      : "portfolio"
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState(searchParams.get("propertyId") || "");
  const [selectedUnitId, setSelectedUnitId] = useState(searchParams.get("unitId") || "");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchManagedProperties = async () => {
      try {
        setIsLoading(true);
        const data = await getManagedProperties();
        if (!isMounted) {
          return;
        }

        setManagedProperties(data || []);
      } catch (error) {
        if (isMounted) {
          toast.error(error.message || "Failed to load managed properties");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchManagedProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  const allUnits = useMemo(
    () =>
      managedProperties.flatMap((property) =>
        (property.units || []).map((unit) => ({
          ...unit,
          property: {
            _id: property._id,
            address: property.address,
          },
        }))
      ),
    [managedProperties]
  );

  const selectedProperty = useMemo(
    () => managedProperties.find((property) => property._id === selectedPropertyId) || null,
    [managedProperties, selectedPropertyId]
  );

  const visibleUnits = useMemo(() => {
    if (!selectedPropertyId) {
      return allUnits;
    }

    return allUnits.filter((unit) => unit.property?._id === selectedPropertyId);
  }, [allUnits, selectedPropertyId]);

  const selectedUnit = useMemo(
    () => allUnits.find((unit) => unit._id === selectedUnitId) || null,
    [allUnits, selectedUnitId]
  );

  const totalVacantUnits = useMemo(
    () => allUnits.filter((unit) => unit.status === "Vacant").length,
    [allUnits]
  );

  useEffect(() => {
    if (selectedPropertyId && !managedProperties.some((property) => property._id === selectedPropertyId)) {
      setSelectedPropertyId("");
    }
  }, [managedProperties, selectedPropertyId]);

  useEffect(() => {
    if (selectedUnitId && !visibleUnits.some((unit) => unit._id === selectedUnitId)) {
      setSelectedUnitId("");
    }
  }, [selectedUnitId, visibleUnits]);

  useEffect(() => {
    const nextParams = {};

    if (scope !== "portfolio") {
      nextParams.scope = scope;
    }
    if (selectedPropertyId) {
      nextParams.propertyId = selectedPropertyId;
    }
    if (selectedUnitId) {
      nextParams.unitId = selectedUnitId;
    }

    setSearchParams(nextParams, { replace: true });
  }, [scope, selectedPropertyId, selectedUnitId, setSearchParams]);

  useEffect(() => {
    setGeneratedLink("");
  }, [scope, selectedPropertyId, selectedUnitId]);

  const selectedScope = useMemo(
    () => scopeOptions.find((option) => option.value === scope) || scopeOptions[0],
    [scope]
  );

  const inviteSummary = useMemo(() => {
    if (scope === "unit") {
      return selectedUnit
        ? `${selectedUnit.property?.address || "Property"} - ${selectedUnit.name}`
        : "Choose the exact unit that should appear on the application.";
    }

    if (scope === "property") {
      return selectedProperty
        ? selectedProperty.address
        : "Choose the property that should anchor this application.";
    }

    return "This link will work as a general application for your rental portfolio.";
  }, [scope, selectedProperty, selectedUnit]);

  const validateSelection = () => {
    if (scope === "property" && !selectedPropertyId) {
      toast.error("Choose a property before creating this application invite.");
      return false;
    }

    if (scope === "unit" && !selectedUnitId) {
      toast.error("Choose a unit before creating this application invite.");
      return false;
    }

    return true;
  };

  const buildPayload = (extra = {}) => {
    if (!validateSelection()) {
      return null;
    }

    return {
      scope,
      propertyId: scope === "property" ? selectedPropertyId : undefined,
      unitId: scope === "unit" ? selectedUnitId : undefined,
      ...extra,
    };
  };

  const handleCreateLink = async () => {
    const payload = buildPayload();
    if (!payload) {
      return;
    }

    try {
      setIsGenerating(true);
      const result = await createApplicationInvite(payload);
      setGeneratedLink(result.url);
      toast.success(result.message || "Application link created.");
    } catch (error) {
      toast.error(error.message || "Failed to create application link.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail.trim()) {
      toast.error("Enter the prospect's email address first.");
      return;
    }

    const payload = buildPayload({
      recipientName: recipientName || undefined,
      recipientEmail,
      note: note || undefined,
    });
    if (!payload) {
      return;
    }

    try {
      setIsSending(true);
      const result = await createApplicationInvite(payload);
      setGeneratedLink(result.url);
      toast.success(result.message || "Application email sent.");
    } catch (error) {
      toast.error(error.message || "Failed to send application email.");
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied to clipboard.");
    } catch (error) {
      toast.error("Could not copy the link automatically.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <span className="eyebrow">Application distribution</span>
            <h2 className="page-hero-title">
              Send an application by link or email without being boxed into one vacant unit.
            </h2>
            <p className="page-hero-copy">
              Choose whether this invite should point to a specific unit, a property, or your wider
              rental portfolio. Then either copy the share link or email it directly to a prospect.
            </p>
          </div>

          <div className="section-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Portfolio coverage
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink-900">
                  {managedProperties.length}
                </h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                <HomeModernIcon className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="rounded-[18px] bg-sand-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Managed properties
                </p>
                <p className="mt-1 text-lg font-semibold text-ink-900">{managedProperties.length}</p>
              </div>
              <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Vacant units tracked
                </p>
                <p className="mt-1 text-lg font-semibold text-ink-900">{totalVacantUnits}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div className="section-card p-6 sm:p-7">
          <span className="eyebrow">Invite setup</span>
          <h3 className="mt-4 text-2xl font-semibold text-ink-900">Choose what the application should target</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Property and unit selection are now optional. Use the lightest context that still helps
            the applicant understand what they are applying for.
          </p>

          <div className="mt-6 grid gap-3">
            {scopeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setScope(option.value)}
                className={`rounded-[22px] border px-5 py-5 text-left transition ${
                  scope === option.value
                    ? "border-verdigris-200 bg-verdigris-50"
                    : "border-ink-100 bg-white hover:border-ink-200 hover:bg-sand-50"
                }`}
              >
                <p className="text-sm font-semibold text-ink-900">{option.label}</p>
                <p className="mt-2 text-sm leading-6 text-ink-500">{option.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-6">
            {scope !== "portfolio" && (
              <div>
                <label htmlFor="property" className="auth-label">
                  Property
                </label>
                {isLoading ? (
                  <LoadingCard>Loading properties...</LoadingCard>
                ) : (
                  <select
                    id="property"
                    className="auth-input"
                    value={selectedPropertyId}
                    onChange={(event) => {
                      setSelectedPropertyId(event.target.value);
                      setSelectedUnitId("");
                    }}
                  >
                    <option value="">Choose a property</option>
                    {managedProperties.map((property) => (
                      <option key={property._id} value={property._id}>
                        {property.address}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {scope === "unit" && (
              <div>
                <label htmlFor="unit" className="auth-label">
                  Unit
                </label>
                {isLoading ? (
                  <LoadingCard>Loading units...</LoadingCard>
                ) : (
                  <select
                    id="unit"
                    className="auth-input"
                    value={selectedUnitId}
                    onChange={(event) => setSelectedUnitId(event.target.value)}
                    disabled={!visibleUnits.length}
                  >
                    <option value="">
                      {selectedPropertyId ? "Choose a unit" : "Choose any unit"}
                    </option>
                    {visibleUnits.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.property?.address} - {unit.name} ({unit.status || "Unknown"})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

              {managedProperties.length === 0 && !isLoading && (
                <div className="rounded-[22px] border border-dashed border-ink-200 bg-sand-50 p-5">
                  <p className="text-sm font-semibold text-ink-900">No managed properties yet</p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    You can still send a general application now, or create managed properties to
                    attach invites to a specific property or unit later.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/properties/new?workspace=management")}
                    className="primary-action"
                  >
                    Create managed property
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/management")}
                    className="secondary-action"
                  >
                    Open managed properties
                  </button>
                </div>
              </div>
            )}

            {scope === "unit" && !isLoading && !visibleUnits.length && managedProperties.length > 0 && (
              <div className="rounded-[22px] border border-dashed border-ink-200 bg-sand-50 p-5">
                <p className="text-sm font-semibold text-ink-900">No units match this selection</p>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Choose another property, add units in management, or switch to a property-level or
                  general application invite.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-[22px] border border-ink-100 bg-sand-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Current invite scope
            </p>
            <h4 className="mt-2 text-lg font-semibold text-ink-900">{selectedScope.label}</h4>
            <p className="mt-2 text-sm leading-6 text-ink-500">{inviteSummary}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCreateLink}
              disabled={isLoading || isGenerating || (scope !== "portfolio" && managedProperties.length === 0)}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PaperAirplaneIcon className="mr-2 h-5 w-5" />
              {isGenerating ? "Creating..." : "Generate application link"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/applications")}
              className="secondary-action"
            >
              Review applications
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="section-card p-6 sm:p-7">
            <span className="eyebrow">Email delivery</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Email the invite directly</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Send the same application link straight to a prospective tenant without leaving the app.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="recipientName" className="auth-label">
                  Prospect name
                </label>
                <input
                  id="recipientName"
                  className="auth-input"
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label htmlFor="recipientEmail" className="auth-label">
                  Prospect email
                </label>
                <input
                  id="recipientEmail"
                  type="email"
                  className="auth-input"
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label htmlFor="inviteNote" className="auth-label">
                  Optional note
                </label>
                <textarea
                  id="inviteNote"
                  rows="4"
                  className="auth-input min-h-[120px]"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional message to include in the email"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isLoading || isSending || (scope !== "portfolio" && managedProperties.length === 0)}
                className="primary-action disabled:cursor-not-allowed disabled:opacity-60"
              >
                <EnvelopeIcon className="mr-2 h-5 w-5" />
                {isSending ? "Sending..." : "Email application"}
              </button>
            </div>
          </div>

          <div className="section-card p-6 sm:p-7">
            <span className="eyebrow">Shareable link</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Public application URL</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Create the link once, then copy it into texts, listings, or manual follow-ups.
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
                  <button
                    type="button"
                    onClick={() => navigate("/applications")}
                    className="secondary-action"
                  >
                    Open applications
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[22px] border border-dashed border-ink-200 bg-sand-50 px-5 py-10 text-center text-ink-500">
                Generate or email an invite first and the signed application link will appear here.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SendApplicationPage;
