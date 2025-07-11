import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInvestment, getTokenHeader } from "../utils/api";

// --- Reusable styled components ---
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const res = await fetch(`https://mypropai-server.onrender.com/api/investments/${id}`, {
        method: "PATCH",
        headers: getTokenHeader(),
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update investment");
      
      setMessage("✅ Investment updated successfully!");
      setTimeout(() => {
        navigate(`/investments/${id}`);
      }, 1500);

    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading investment data...</div>;
  if (!formData) return <div className="p-6 text-red-500 text-center">Investment not found.</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-brand-gray-900">Edit Investment</h1>
        <p className="text-lg text-brand-gray-500 mt-1">{formData.address}</p>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
        {message && <p className={`mb-4 text-sm p-3 rounded-md ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message}</p>}

        <form onSubmit={handleSave} className="space-y-6">
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
                    <FormInput name="unitCount" type="number" placeholder="e.g., 4" value={formData.unitCount || ''} onChange={handleChange} />
                </div>
            )}

            <div>
                <FormLabel>Property Address</FormLabel>
                <FormInput name="address" type="text" placeholder="123 Main St, Anytown, USA" value={formData.address} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <FormLabel>Purchase Price</FormLabel>
                    <FormInput name="purchasePrice" type="number" placeholder="e.g., 300000" value={formData.purchasePrice || ''} onChange={handleChange} />
                </div>
                {formData.type === "flip" && (
                    <div>
                        <FormLabel>ARV (After Repair Value)</FormLabel>
                        <FormInput name="arv" type="number" placeholder="e.g., 450000" value={formData.arv || ''} onChange={handleChange} />
                    </div>
                )}
                {formData.type === "rent" && (
                    <div>
                        <FormLabel>Projected Monthly Rent</FormLabel>
                        <FormInput name="rentEstimate" type="number" placeholder="e.g., 2500" value={formData.rentEstimate || ''} onChange={handleChange} />
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormInput name="bedrooms" type="number" placeholder="e.g., 3" value={formData.bedrooms || ''} onChange={handleChange} />
                </div>
                 <div>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormInput name="bathrooms" type="number" placeholder="e.g., 2" value={formData.bathrooms || ''} onChange={handleChange} />
                </div>
                <div>
                    <FormLabel>Property Size (Sqft)</FormLabel>
                    <FormInput name="sqft" type="number" placeholder="e.g., 1500" value={formData.sqft || ''} onChange={handleChange} />
                </div>
                <div>
                    <FormLabel>Lot Size (Sqft)</FormLabel>
                    <FormInput name="lotSize" type="number" placeholder="e.g., 5000" value={formData.lotSize || ''} onChange={handleChange} />
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                type="submit"
                disabled={isSaving}
                className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold p-3 rounded-lg w-full md:w-auto disabled:bg-brand-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                >
                {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditInvestment;
