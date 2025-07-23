import React, { useState } from "react";
import { generateBudgetLines } from "../utils/api";

const AIRehabBuilderModal = ({ isOpen, onClose, investmentId, onSuccess }) => {
  const [formData, setFormData] = useState({
    description: "",
    sqft: "",
    beds: "",
    baths: "",
    yearBuilt: ""
  });
  const [generatedLines, setGeneratedLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await generateBudgetLines({ ...formData, investmentId });
      setGeneratedLines(result.budgetLines);
      setStep(2);
    } catch (err) {
      setError("Failed to generate lines.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await Promise.all(
        generatedLines.map((line) =>
          fetch(`${process.env.REACT_APP_API_URL}/api/budget-items`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              investmentId,
              category: line.category,
              budgetedAmount: line.budgetedAmount,
            }),
          })
        )
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error adding lines:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl space-y-4">
        <h2 className="text-xl font-bold text-brand-gray-800">AI Budget Builder</h2>

        {step === 1 && (
          <>
            <textarea
              name="description"
              rows="3"
              placeholder="Describe what you want to renovate..."
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
            <div className="grid grid-cols-2 gap-4">
              <input name="sqft" placeholder="Sqft" value={formData.sqft} onChange={handleChange} className="border p-2 rounded-md" />
              <input name="beds" placeholder="Beds" value={formData.beds} onChange={handleChange} className="border p-2 rounded-md" />
              <input name="baths" placeholder="Baths" value={formData.baths} onChange={handleChange} className="border p-2 rounded-md" />
              <input name="yearBuilt" placeholder="Year Built" value={formData.yearBuilt} onChange={handleChange} className="border p-2 rounded-md" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleGenerate} disabled={loading} className="bg-brand-turquoise text-white px-4 py-2 rounded-md">
              {loading ? "Generating..." : "Generate Budget"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="text-md font-semibold">Suggested Budget Lines</h3>
            <ul className="space-y-2 text-sm">
              {generatedLines.map((line, i) => (
                <li key={i} className="flex justify-between border-b pb-1">
                  <span>{line.category}</span>
                  <span>${line.budgetedAmount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <button onClick={handleConfirm} className="bg-green-600 text-white px-4 py-2 rounded-md mt-4">
              Add to Budget
            </button>
          </>
        )}

        <div className="pt-4 text-right">
          <button onClick={onClose} className="text-sm text-gray-600 hover:underline">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIRehabBuilderModal;
