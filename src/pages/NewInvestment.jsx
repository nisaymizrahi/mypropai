import React, { useState } from "react";

const NewInvestment = () => {
  const [type, setType] = useState("flip");
  const [address, setAddress] = useState("");
  const [size, setSize] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [arv, setArv] = useState("");
  const [rentEstimate, setRentEstimate] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("https://mypropai-server.onrender.com/api/investments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          address,
          sqft: Number(size),
          lotSize: Number(lotSize),
          purchasePrice: Number(purchasePrice),
          arv: type === "flip" ? Number(arv) : undefined,
          rentEstimate: type === "rent" ? Number(rentEstimate) : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save investment");

      setMessage("✅ Investment saved!");
      setAddress("");
      setSize("");
      setLotSize("");
      setPurchasePrice("");
      setArv("");
      setRentEstimate("");
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Add New Investment</h2>

      {message && <p className="mb-4 text-sm text-blue-600">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-medium">Investment Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="flip">Fix and Flip</option>
            <option value="rent">Fix and Rent</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Size (Sqft)"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Lot Size"
          value={lotSize}
          onChange={(e) => setLotSize(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Purchase Price"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          className="w-full p-2 border rounded"
        />

        {type === "flip" && (
          <input
            type="number"
            placeholder="ARV (After Repair Value)"
            value={arv}
            onChange={(e) => setArv(e.target.value)}
            className="w-full p-2 border rounded"
          />
        )}

        {type === "rent" && (
          <input
            type="number"
            placeholder="Projected Monthly Rent"
            value={rentEstimate}
            onChange={(e) => setRentEstimate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Save Investment
        </button>
      </form>
    </div>
  );
};

export default NewInvestment;
