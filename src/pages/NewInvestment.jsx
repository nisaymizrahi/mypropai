import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import InvestmentEditor from "../components/InvestmentEditor";
import { createInvestment } from "../utils/api";

const NewInvestment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    strategy: "flip",
    address: "",
    sqft: "",
    lotSize: "",
    purchasePrice: "",
    bedrooms: "",
    bathrooms: "",
    yearBuilt: "",
    propertyType: "",
    unitCount: "",
    arv: "",
    buyClosingCost: 0,
    buyClosingIsPercent: true,
    loanAmount: 0,
    interestRate: 8,
    loanTerm: 12,
    loanPoints: 1,
    holdingMonths: 6,
    taxes: 0,
    insurance: 0,
    utilities: 0,
    otherMonthly: 0,
    sellClosingCost: 6,
    sellClosingIsPercent: true,
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        strategy: formData.strategy,
        sqft: Number(formData.sqft) || undefined,
        lotSize: Number(formData.lotSize) || undefined,
        purchasePrice: Number(formData.purchasePrice) || undefined,
        bedrooms: Number(formData.bedrooms) || undefined,
        bathrooms: Number(formData.bathrooms) || undefined,
        yearBuilt: Number(formData.yearBuilt) || undefined,
        unitCount: ["multi-family", "mixed-use", "commercial"].includes(formData.propertyType)
          ? Number(formData.unitCount)
          : undefined,
        arv: Number(formData.arv) || undefined,
        buyClosingCost: Number(formData.buyClosingCost) || 0,
        loanAmount: Number(formData.loanAmount) || 0,
        interestRate: Number(formData.interestRate) || 0,
        loanTerm: Number(formData.loanTerm) || 12,
        loanPoints: Number(formData.loanPoints) || 0,
        holdingMonths: Number(formData.holdingMonths) || 6,
        taxes: Number(formData.taxes) || 0,
        insurance: Number(formData.insurance) || 0,
        utilities: Number(formData.utilities) || 0,
        otherMonthly: Number(formData.otherMonthly) || 0,
        sellClosingCost: Number(formData.sellClosingCost) || 0,
      };

      const newInvestment = await createInvestment(payload);
      setMessage({
        type: "success",
        text: "Investment saved successfully. Opening the project hub...",
      });
      window.setTimeout(() => {
        navigate(`/investments/${newInvestment._id}`);
      }, 1200);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to save investment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <InvestmentEditor
      eyebrow="New investment"
      title="Create a polished acquisition profile for your next property."
      description="Set the asset basics and underwriting assumptions now so the rest of the project workspace starts from a clean operational baseline."
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      message={message}
      isSubmitting={isLoading}
      submitLabel="Create investment"
      submittingLabel="Creating investment..."
      onCancel={() => navigate("/investments")}
    />
  );
};

export default NewInvestment;
