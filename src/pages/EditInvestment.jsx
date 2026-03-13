import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import InvestmentEditor from "../components/InvestmentEditor";
import { getInvestment, updateInvestment } from "../utils/api";
import { normalizeInvestmentStrategy } from "../utils/propertyStrategy";

const investmentStageFields = [
  "strategy",
  "status",
  "purchasePrice",
  "arv",
  "progress",
  "buyClosingCost",
  "buyClosingIsPercent",
  "loanAmount",
  "interestRate",
  "loanTerm",
  "loanPoints",
  "holdingMonths",
  "taxes",
  "insurance",
  "utilities",
  "otherMonthly",
  "sellClosingCost",
  "sellClosingIsPercent",
  "inspectionNotes",
  "aiDealSummary",
  "coverImage",
  "images",
];

const getPropertyWorkspacePath = (investment) => {
  const propertyId =
    typeof investment?.property === "object" ? investment?.property?._id : investment?.property;

  return propertyId ? `/properties/${encodeURIComponent(propertyId)}` : "";
};

const buildInvestmentStagePayload = (formData = {}) =>
  investmentStageFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(formData, field)) {
      payload[field] = formData[field];
    }

    return payload;
  }, {});

const EditInvestment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchInvestment = async () => {
      try {
        const data = await getInvestment(id);
        setFormData({
          ...data,
          strategy: normalizeInvestmentStrategy(data.strategy || data.type),
          address: data.address || "",
          sqft: data.sqft ?? "",
          lotSize: data.lotSize ?? "",
          purchasePrice: data.purchasePrice ?? "",
          bedrooms: data.bedrooms ?? "",
          bathrooms: data.bathrooms ?? "",
          yearBuilt: data.yearBuilt ?? "",
          propertyType: data.propertyType || "",
          unitCount: data.unitCount ?? "",
          arv: data.arv ?? "",
          buyClosingCost: data.buyClosingCost ?? 0,
          buyClosingIsPercent: data.buyClosingIsPercent ?? true,
          loanAmount: data.loanAmount ?? 0,
          interestRate: data.interestRate ?? 0,
          loanTerm: data.loanTerm ?? 12,
          loanPoints: data.loanPoints ?? 0,
          holdingMonths: data.holdingMonths ?? 6,
          taxes: data.taxes ?? 0,
          insurance: data.insurance ?? 0,
          utilities: data.utilities ?? 0,
          otherMonthly: data.otherMonthly ?? 0,
          sellClosingCost: data.sellClosingCost ?? 6,
          sellClosingIsPercent: data.sellClosingIsPercent ?? true,
        });
      } catch (err) {
        setMessage({
          type: "error",
          text: "Error loading investment data.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvestment();
  }, [id]);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((previous) => ({
      ...previous,
      [name]: fieldValue,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setIsSaving(true);

    try {
      await updateInvestment(id, buildInvestmentStagePayload(formData));
      setMessage({
        type: "success",
        text: "Investment updated successfully. Returning to the project hub...",
      });
      window.setTimeout(() => {
        navigate(`/investments/${id}`);
      }, 1200);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to update investment.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="surface-panel flex items-center justify-center px-6 py-20">
        <div className="flex items-center gap-4 text-ink-500">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-200 border-t-verdigris-500" />
          <p className="text-sm font-medium">Loading investment details...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="section-card px-6 py-10 text-center text-clay-700">
        Investment not found.
      </div>
    );
  }

  const propertyWorkspacePath = getPropertyWorkspacePath(formData);

  return (
    <InvestmentEditor
      eyebrow="Edit investment"
      title="Refine the deal plan and underwriting assumptions."
      description="Shared property details now live in the Property Workspace. Use this page for strategy, pricing, financing, and execution inputs."
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSave}
      message={message}
      isSubmitting={isSaving}
      submitLabel="Save changes"
      submittingLabel="Saving changes..."
      onCancel={() => navigate(`/investments/${id}`)}
      cancelLabel="Back to project hub"
      sharedProfileLocked={Boolean(propertyWorkspacePath)}
      propertyWorkspacePath={propertyWorkspacePath}
    />
  );
};

export default EditInvestment;
