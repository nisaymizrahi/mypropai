import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInvestment, getAuthHeaders } from "../utils/api";

// --- Reusable components ---
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

    // Deep update for nested fields like refinanceDetails.newLoanAmount
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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

  if (loading) return <div className="p-6 text-center">Loading investment data...</div>;
  if (!formData) return <div className="p-6 text-red-500 text-center">Investment not found.</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-gray-900">Edit Investment</h1>
      <p className="text-lg text-brand-gray-500 mt-1">{formData.address}</p>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
        {message && (
          <p className={`mb-4 text-sm p-3 rounded-md ${message.startsWith("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Investment Type and Property Type */}
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
              <FormInput name="unitCount" type="number" value={formData.unitCount || ""} onChange={handleChange} />
            </div>
          )}

          <FormLabel>Property Address</FormLabel>
          <FormInput name="address" type="text" value={formData.address} onChange={handleChange} required />

          {/* Financials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormLabel>Purchase Price</FormLabel>
              <FormInput name="purchasePrice" type="number" value={formData.purchasePrice || ""} onChange={handleChange} />
            </div>
            {formData.type === "flip" && (
              <div>
                <FormLabel>ARV (After Repair Value)</FormLabel>
                <FormInput name="arv" type="number" value={formData.arv || ""} onChange={handleChange} />
              </div>
            )}
            {formData.type === "rent" && (
              <div>
                <FormLabel>Projected Monthly Rent</FormLabel>
                <FormInput name="rentEstimate" type="number" value={formData.rentEstimate || ""} onChange={handleChange} />
              </div>
            )}
          </div>

          {/* Beds, Baths, Size */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <FormLabel>Bedrooms</FormLabel>
              <FormInput name="bedrooms" type="number" value={formData.bedrooms || ""} onChange={handleChange} />
            </div>
            <div>
              <FormLabel>Bathrooms</FormLabel>
              <FormInput name="bathrooms" type="number" value={formData.bathrooms || ""} onChange={handleChange} />
            </div>
            <div>
              <FormLabel>Property Size (Sqft)</FormLabel>
              <FormInput name="sqft" type="number" value={formData.sqft || ""} onChange={handleChange} />
            </div>
            <div>
              <FormLabel>Lot Size (Sqft)</FormLabel>
              <FormInput name="lotSize" type="number" value={formData.lotSize || ""} onChange={handleChange} />
            </div>
          </div>

          {/* New Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormLabel>Status</FormLabel>
              <FormSelect name="status" value={formData.status || "Not Started"} onChange={handleChange}>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Sold">Sold</option>
                <option value="Archived">Archived</option>
              </FormSelect>
            </div>
            <div>
              <FormLabel>Cover Image URL</FormLabel>
              <FormInput name="coverImage" value={formData.coverImage || ""} onChange={handleChange} />
            </div>
          </div>

          {/* Refinance Section */}
          <div className="pt-6 border-t">
            <h2 className="text-lg font-bold text-brand-gray-800">Refinance Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div>
                <FormLabel>New Loan Amount</FormLabel>
                <FormInput type="number" name="refinanceDetails.newLoanAmount" value={formData?.refinanceDetails?.newLoanAmount || ''} onChange={handleChange} />
              </div>
              <div>
                <FormLabel>New Interest Rate (%)</FormLabel>
                <FormInput type="number" name="refinanceDetails.newInterestRate" value={formData?.refinanceDetails?.newInterestRate || ''} onChange={handleChange} />
              </div>
              <div>
                <FormLabel>New Loan Term (years)</FormLabel>
                <FormInput type="number" name="refinanceDetails.newLoanTerm" value={formData?.refinanceDetails?.newLoanTerm || ''} onChange={handleChange} />
              </div>
              <div>
                <FormLabel>New ARV (Post-Refi)</FormLabel>
                <FormInput type="number" name="refinanceDetails.newArv" value={formData?.refinanceDetails?.newArv || ''} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Inspection Notes */}
          <div className="pt-6 border-t">
            <h2 className="text-lg font-bold text-brand-gray-800">Inspection Notes</h2>
            <FormLabel>Summary</FormLabel>
            <textarea name="inspectionNotes.summary" rows={3} className="w-full border rounded-md p-2" value={formData.inspectionNotes?.summary || ''} onChange={handleChange} />
            <div className="mt-3">
              <FormLabel>Repair Items</FormLabel>
              {(formData.inspectionNotes?.issues || []).map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 items-center mb-2">
                  <input
                    type="text"
                    className="col-span-2 border p-1 rounded-md"
                    value={item.title}
                    placeholder="Repair description"
                    onChange={(e) => {
                      const updated = [...formData.inspectionNotes.issues];
                      updated[index].title = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        inspectionNotes: { ...prev.inspectionNotes, issues: updated }
                      }));
                    }}
                  />
                  <select
                    className="border p-1 rounded-md"
                    value={item.severity}
                    onChange={(e) => {
                      const updated = [...formData.inspectionNotes.issues];
                      updated[index].severity = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        inspectionNotes: { ...prev.inspectionNotes, issues: updated }
                      }));
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newItem = { title: "", severity: "Medium", resolved: false };
                  setFormData(prev => ({
                    ...prev,
                    inspectionNotes: {
                      ...prev.inspectionNotes,
                      issues: [...(prev.inspectionNotes?.issues || []), newItem]
                    }
                  }));
                }}
                className="text-brand-turquoise text-sm mt-2"
              >
                + Add Item
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={isSaving} className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold p-3 rounded-lg w-full md:w-auto disabled:bg-brand-gray-300">
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInvestment;
