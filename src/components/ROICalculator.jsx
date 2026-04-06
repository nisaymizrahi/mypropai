// client/src/components/ROICalculator.jsx
import React, { useState } from "react";

const ROICalculator = ({ onCalculate }) => {
  const [purchase, setPurchase] = useState("");
  const [repairs, setRepairs] = useState("");
  const [arv, setArv] = useState("");
  const [holding, setHolding] = useState("");
  const [sellingCosts, setSellingCosts] = useState("");

  const calc = () => {
    const p = Number(purchase) || 0;
    const r = Number(repairs) || 0;
    const a = Number(arv) || 0;
    const h = Number(holding) || 0;
    const s = Number(sellingCosts) || 0;

    const totalCost = p + r + h + s;
    const profit = a - totalCost;
    const margin = a > 0 ? (profit / a) * 100 : 0;

    const result = { purchase: p, repairs: r, arv: a, holding: h, selling: s, totalCost, profit, margin };
    onCalculate?.(result);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-xl font-semibold text-brand-dark-100 mb-3">Quick ROI (Flip)</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <input className="border rounded px-3 py-2" placeholder="Purchase $" value={purchase} onChange={(e) => setPurchase(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Repairs $" value={repairs} onChange={(e) => setRepairs(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="ARV $" value={arv} onChange={(e) => setArv(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Holding $" value={holding} onChange={(e) => setHolding(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Selling Costs $" value={sellingCosts} onChange={(e) => setSellingCosts(e.target.value)} />
      </div>
      <div className="text-right mt-3">
        <button className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={calc}>Calculate</button>
      </div>
    </div>
  );
};

export default ROICalculator;
