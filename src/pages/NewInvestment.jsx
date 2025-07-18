import React, { useState } from "react";
import { createInvestment } from "../utils/api";
import { useNavigate } from "react-router-dom";

// --- NEW: Reusable styled components for this form ---
const FormInput = (props) => (
    <input 
        className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 placeholder-brand-gray-400 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition"
        {...props} 
    />
);

const FormSelect = ({ children, ...props }) => (
    <select 
        className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition"
        {...props}
    >
        {children}
    </select>
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
    rentEstimate: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        sqft: Number(formData.sqft) || undefined,
        lotSize: Number(formData.lotSize) || undefined,
        purchasePrice: Number(formData.purchasePrice) || undefined,
        bedrooms: Number(formData.bedrooms) || undefined,
        bathrooms: Number(formData.bathrooms) || undefined,
        yearBuilt: Number(formData.yearBuilt) || undefined,
        unitCount: ["multi-family", "mixed-use", "commercial"].includes(formData.propertyType) ? Number(formData.unitCount) : undefined,
        arv: formData.type === "flip" ? Number(formData.arv) : undefined,
        rentEstimate: formData.type === "rent" ? Number(formData.rentEstimate) : undefined,
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
        <div>
            <h1 className="text-3xl font-bold text-brand-gray-900">Add New Investment</h1>
            <p className="text-lg text-brand-gray-500 mt-1">Enter the details for your new property.</p>
        </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
        {message && <p className={`mb-4 text-sm p-3 rounded-md ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <FormLabel>Investment Type</FormLabel>
                    <FormSelect name="type" value={formData.type} onChange={handleChange}>
                        <option value="flip">Fix and Flip</option>
                        <option value="rent">Fix and Rent</option>
                    </FormSelect>
                </div>
                <div>
                    <FormLabel>Property Type</FormLabel>
                    <FormSelect name="propertyType" value={formData.propertyType} onChange={handleChange}>
                        <option value="">Select Type</option>
                        <option value="single-family">Single Family</option>
                        <option value="multi-family">Multi-Family</option>
                        <option value="mixed-use">Mixed Use</option>
                        <option value="commercial">Commercial</option>
                        <option value="land">Land</option>
                        <option value="other">Other</option>
                    </FormSelect>
                </div>
            </div>

            {["multi-family", "mixed-use", "commercial"].includes(formData.propertyType) && (
                <div>
                    <FormLabel>Number of Units</FormLabel>
                    <FormInput name="unitCount" type="number" placeholder="e.g., 4" value={formData.unitCount} onChange={handleChange} />
                </div>
            )}

            <div>
                <FormLabel>Property Address</FormLabel>
                <FormInput name="address" type="text" placeholder="123 Main St, Anytown, USA" value={formData.address} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <FormLabel>Purchase Price</FormLabel>
                    <FormInput name="purchasePrice" type="number" placeholder="e.g., 300000" value={formData.purchasePrice} onChange={handleChange} />
                </div>
                {formData.type === "flip" && (
                    <div>
                        <FormLabel>ARV (After Repair Value)</FormLabel>
                        <FormInput name="arv" type="number" placeholder="e.g., 450000" value={formData.arv} onChange={handleChange} />
                    </div>
                )}
                {formData.type === "rent" && (
                    <div>
                        <FormLabel>Projected Monthly Rent</FormLabel>
                        <FormInput name="rentEstimate" type="number" placeholder="e.g., 2500" value={formData.rentEstimate} onChange={handleChange} />
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormInput name="bedrooms" type="number" placeholder="e.g., 3" value={formData.bedrooms} onChange={handleChange} />
                </div>
                 <div>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormInput name="bathrooms" type="number" placeholder="e.g., 2" value={formData.bathrooms} onChange={handleChange} />
                </div>
                <div>
                    <FormLabel>Property Size (Sqft)</FormLabel>
                    <FormInput name="sqft" type="number" placeholder="e.g., 1500" value={formData.sqft} onChange={handleChange} />
                </div>
                <div>
                    <FormLabel>Lot Size (Sqft)</FormLabel>
                    <FormInput name="lotSize" type="number" placeholder="e.g., 5000" value={formData.lotSize} onChange={handleChange} />
                </div>
            </div>

            <div className="pt-4">
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
