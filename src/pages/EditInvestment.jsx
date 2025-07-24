import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInvestment, getAuthHeaders } from "../utils/api";

const FormInput = (props) => (
  <input
    className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 placeholder-brand-gray-400 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition"
    {...props}
  />
);

const FormLabel = ({ children }) => (
  <label className="block text-sm font-medium text-brand-gray-700 mb-1">{children}</label>
);

const EditInvestment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchInvestment = async () => {
      try {
        const data = await getInvestment(id);
        setFormData(data);
      } catch (err) {
        setMessage("❌ Error loading investment data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestment();
  }, [id]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSaving(true);
    try {
      const res = await fetch(`https://mypropai-server.onrender.com/api/investments/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update investment");
      setMessage("✅ Investment updated successfully!");
      setTimeout(() => navigate(`/investments/${id}`), 1500);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading investment...</div>;
  if (!formData) return <div className="p-6 text-red-500 text-center">Investment not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-brand-gray-900">Edit Investment</h1>
      <p className="text-brand-gray-500 mb-6">{formData.address}</p>

      {message && (
        <div className={`mb-4 p-3 rounded-md text-sm ${message.startsWith("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Property Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormLabel>Property Type</FormLabel>
            <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full border p-2 rounded-md">
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
            <FormInput name="address" value={formData.address} onChange={handleChange} />
          </div>
        </div>

        {["multi-family", "mixed-use", "commercial"].includes(formData.propertyType) && (
          <div>
            <FormLabel>Unit Count</FormLabel>
            <FormInput name="unitCount" type="number" value={formData.unitCount || ""} onChange={handleChange} />
          </div>
        )}

        {/* Specs and Pricing */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <FormLabel>Purchase Price</FormLabel>
            <FormInput name="purchasePrice" type="number" value={formData.purchasePrice || ""} onChange={handleChange} />
          </div>
          <div>
            <FormLabel>ARV</FormLabel>
            <FormInput name="arv" type="number" value={formData.arv || ""} onChange={handleChange} />
          </div>
          <div>
            <FormLabel>Bedrooms</FormLabel>
            <FormInput name="bedrooms" type="number" value={formData.bedrooms || ""} onChange={handleChange} />
          </div>
          <div>
            <FormLabel>Bathrooms</FormLabel>
            <FormInput name="bathrooms" type="number" value={formData.bathrooms || ""} onChange={handleChange} />
          </div>
          <div>
            <FormLabel>Sqft</FormLabel>
            <FormInput name="sqft" type="number" value={formData.sqft || ""} onChange={handleChange} />
          </div>
          <div>
            <FormLabel>Lot Size</FormLabel>
            <FormInput name="lotSize" type="number" value={formData.lotSize || ""} onChange={handleChange} />
          </div>
          <div>
            <FormLabel>Year Built</FormLabel>
            <FormInput name="yearBuilt" type="number" value={formData.yearBuilt || ""} onChange={handleChange} />
          </div>
        </div>

        {/* Deal Calculator Fields */}
        <h2 className="text-lg font-bold pt-6 border-t">Deal Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput name="buyClosingCost" type="number" value={formData.buyClosingCost || 0} onChange={handleChange} placeholder="Buy Closing Cost" />
          <label className="text-sm flex items-center">
            <input type="checkbox" name="buyClosingIsPercent" checked={formData.buyClosingIsPercent || false} onChange={handleChange} className="mr-2" />
            Closing cost is %
          </label>
          <FormInput name="loanAmount" type="number" value={formData.loanAmount || 0} onChange={handleChange} placeholder="Loan Amount" />
          <FormInput name="interestRate" type="number" value={formData.interestRate || 0} onChange={handleChange} placeholder="Interest Rate (%)" />
          <FormInput name="loanTerm" type="number" value={formData.loanTerm || 0} onChange={handleChange} placeholder="Loan Term (Months)" />
          <FormInput name="loanPoints" type="number" value={formData.loanPoints || 0} onChange={handleChange} placeholder="Loan Points (%)" />
          <FormInput name="holdingMonths" type="number" value={formData.holdingMonths || 6} onChange={handleChange} placeholder="Holding Period (Months)" />
          <FormInput name="taxes" type="number" value={formData.taxes || 0} onChange={handleChange} placeholder="Monthly Taxes" />
          <FormInput name="insurance" type="number" value={formData.insurance || 0} onChange={handleChange} placeholder="Monthly Insurance" />
          <FormInput name="utilities" type="number" value={formData.utilities || 0} onChange={handleChange} placeholder="Monthly Utilities" />
          <FormInput name="otherMonthly" type="number" value={formData.otherMonthly || 0} onChange={handleChange} placeholder="Other Monthly" />
          <FormInput name="sellClosingCost" type="number" value={formData.sellClosingCost || 0} onChange={handleChange} placeholder="Sell Closing Cost" />
          <label className="text-sm flex items-center">
            <input type="checkbox" name="sellClosingIsPercent" checked={formData.sellClosingIsPercent || false} onChange={handleChange} className="mr-2" />
            Sell closing is %
          </label>
        </div>

        <div className="pt-6 text-right">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-brand-turquoise text-white font-semibold px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditInvestment;
