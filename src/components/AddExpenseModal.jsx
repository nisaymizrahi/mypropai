import React, { useState, useEffect } from "react";
import { createExpense } from "../utils/api";

const AddExpenseModal = ({ isOpen, onClose, investmentId, defaultCategory = null, onSuccess, budgetItems = [] }) => {
  const [formData, setFormData] = useState({
    category: defaultCategory || "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        category: defaultCategory || "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setReceipt(null);
      setError("");
    }
  }, [isOpen, defaultCategory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.amount) {
      setError("Category and amount are required.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("investmentId", investmentId);
      payload.append("category", formData.category);
      payload.append("amount", formData.amount);
      payload.append("date", formData.date);
      payload.append("notes", formData.notes);
      if (receipt) payload.append("receipt", receipt);

      await createExpense(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save expense.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-brand-gray-800">Add Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full border rounded-md p-2">
              <option value="">Select a category</option>
              {budgetItems.map((item) => (
                <option key={item._id} value={item.category}>{item.category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} className="w-full border rounded-md p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input name="date" type="date" value={formData.date} onChange={handleChange} className="w-full border rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full border rounded-md p-2" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium">Upload Receipt</label>
            <input type="file" onChange={(e) => setReceipt(e.target.files[0])} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" disabled={isSaving} className="bg-brand-turquoise text-white px-4 py-2 rounded-md disabled:opacity-50">
              {isSaving ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
