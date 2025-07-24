import React, { useState } from "react";
import { createInvestment } from "../utils/api";
import { useNavigate } from "react-router-dom";

// Styled components
const FormInput = (props) => (
  <input
    className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 placeholder-brand-gray-400 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition"
    {...props}
  />
);

const FormLabel = ({ children }) => (
  <label className="block text-sm font-medium text-brand-gray-700 mb-1">{children}</label>
);

const NewInvestment = () => {
  const [formData, setFormData] = useState({
    type: "flip",
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

    // Deal Calculator Fields
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

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        type: "flip",
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

      const newInvestment = await createInvestment(dataToSubmit);
      setMessage("✅ Investment saved successfully! Redirecting...");
      setTimeout(() => {
        navigate(`/investments/${newInvestment._id}`);
      }, 1500);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-gray-900">Add New Investment</h1>
      <p className="text-lg text-brand-gray-500 mt-1">Enter the full investment details.</p>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
        {message && (
          <p
            className={`mb-4 text-sm p-3 rounded-md ${
              message.startsWith("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormLabel>Property Type</FormLabel>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="w-full border p-2 rounded-md"
              >
                <option value="">Select Type</option>
                <option value="single-family">Single Family</option>
                <option value="multi-family">Multi-Family</option>
                <option value="mixed-use">Mixed Use</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <FormLabel>Address</FormLabel>
              <FormInput name="address" value={formData.address} onChange={handleChange} required />
            </div>
          </div>

          {["multi-family", "mixed-use", "commercial"].includes(formData.propertyType) && (
            <div>
              <FormLabel>Number of Units</FormLabel>
              <FormInput name="unitCount" type="number" value={formData.unitCount} onChange={handleChange} />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <FormLabel>Purchase Price</FormLabel>
              <FormInput name="purchasePrice" type="number" value={formData.purchasePrice} onChange={handleChange} />
            </div>
            <div>
              <FormLabel>ARV</FormLabel>
              <FormInput name="arv" type="number" value={formData.arv} onChange={handleChange} />
            </div>
            <div>
              <FormLabel>Bedrooms</FormLabel>
              <FormInput name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} />
            </div>
            <div>
              <FormLabel>Bathrooms</FormLabel>
              <FormInput name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} />
            </div>
            <div>
              <FormLabel>Sqft</FormLabel>
              <FormInput name="sqft" type="number" value={formData.sqft} onChange={handleChange} />
            </div>
            <div>
              <FormLabel>Lot Size</FormLabel>
              <FormInput name="lotSize" type="number" value={formData.lotSize} onChange={handleChange} />
            </div>
            <div>
              <FormLabel>Year Built</FormLabel>
              <FormInput name="yearBuilt" type="number" value={formData.yearBuilt} onChange={handleChange} />
            </div>
          </div>

          {/* Analysis Section */}
          <h2 className="text-lg font-semibold pt-6">Deal Analysis Inputs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormInput name="buyClosingCost" type="number" placeholder="Buy Closing Cost" value={formData.buyClosingCost} onChange={handleChange} />
            <label className="text-sm">
              <input type="checkbox" name="buyClosingIsPercent" checked={formData.buyClosingIsPercent} onChange={handleChange} className="mr-2" />
              Closing cost is %
            </label>

            <FormInput name="loanAmount" type="number" placeholder="Loan Amount" value={formData.loanAmount} onChange={handleChange} />
            <FormInput name="interestRate" type="number" placeholder="Interest Rate" value={formData.interestRate} onChange={handleChange} />
            <FormInput name="loanTerm" type="number" placeholder="Loan Term (Months)" value={formData.loanTerm} onChange={handleChange} />
            <FormInput name="loanPoints" type="number" placeholder="Loan Points (%)" value={formData.loanPoints} onChange={handleChange} />

            <FormInput name="holdingMonths" type="number" placeholder="Holding Period (Months)" value={formData.holdingMonths} onChange={handleChange} />
            <FormInput name="taxes" type="number" placeholder="Monthly Taxes" value={formData.taxes} onChange={handleChange} />
            <FormInput name="insurance" type="number" placeholder="Monthly Insurance" value={formData.insurance} onChange={handleChange} />
            <FormInput name="utilities" type="number" placeholder="Monthly Utilities" value={formData.utilities} onChange={handleChange} />
            <FormInput name="otherMonthly" type="number" placeholder="Other Monthly Costs" value={formData.otherMonthly} onChange={handleChange} />

            <FormInput name="sellClosingCost" type="number" placeholder="Sell Closing Cost" value={formData.sellClosingCost} onChange={handleChange} />
            <label className="text-sm">
              <input type="checkbox" name="sellClosingIsPercent" checked={formData.sellClosingIsPercent} onChange={handleChange} className="mr-2" />
              Sell closing is %
            </label>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold p-3 rounded-lg disabled:bg-brand-gray-300 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? "Saving..." : "Save Investment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewInvestment;
