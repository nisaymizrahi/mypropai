import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardDocumentListIcon,
  LinkIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { API_BASE_URL } from "../config";
import { getAuthHeaders } from "../utils/api";

const LoadingCard = () => (
  <div className="rounded-[24px] border border-ink-100 bg-white px-5 py-10 text-center text-ink-500">
    Loading vacant units...
  </div>
);

const SendApplicationPage = () => {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [apiError, setApiError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/management/units/vacant`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Response not OK");
        const data = await res.json();
        setUnits(data);
      } catch (err) {
        setApiError(true);
        toast.error("Failed to load vacant units. Try again after your units finish loading.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const selectedUnitDetails = useMemo(
    () => units.find((unit) => unit._id === selectedUnit),
    [selectedUnit, units]
  );

  const generateLink = () => {
    const base = window.location.origin;
    if (selectedUnit) {
      setGeneratedLink(`${base}/apply/${selectedUnit}`);
    } else {
      toast.error(apiError ? "Vacant units could not be loaded." : "Please select a vacant unit.");
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
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900">
              Generate a clean rental application link for any vacant unit.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">
              Select an open unit, generate the public application URL, and send it out through your own email, SMS, or leasing workflow.
            </p>
          </div>

          <div className="section-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Vacant inventory
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink-900">{units.length}</h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                <ClipboardDocumentListIcon className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="rounded-[18px] bg-sand-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Link status
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {generatedLink ? "Generated" : "Not generated yet"}
                </p>
              </div>
              <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Selected unit
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {selectedUnitDetails ? `${selectedUnitDetails.property?.address} - ${selectedUnitDetails.name}` : "None selected"}
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
            Only currently vacant units appear here. Generate the public application link once you pick the correct one.
          </p>

          <div className="mt-6">
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
              >
                <option value="">Choose a unit</option>
                {units.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.property?.address} - {unit.name}
                  </option>
                ))}
              </select>
            )}

            {units.length === 0 && !apiError && !isLoading && (
              <p className="mt-3 text-sm text-ink-500">
                Add or mark a unit as vacant before sending an application link.
              </p>
            )}

            {apiError && (
              <div className="mt-4 rounded-[20px] border border-clay-200 bg-clay-50 px-4 py-4 text-sm text-clay-700">
                Vacant units are unavailable right now. Refresh and try again.
              </div>
            )}
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
            <button type="button" onClick={generateLink} className="primary-action">
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

              <button type="button" onClick={copyToClipboard} className="secondary-action">
                Copy link
              </button>
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
