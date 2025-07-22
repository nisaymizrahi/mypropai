import React from "react";

const TimelineTab = ({ investment }) => {
  const phases = [
    { label: "Purchase", complete: !!investment.purchasePrice },
    { label: "Rehab", complete: investment.progress > 0 },
    { label: "Refinance", complete: investment.refinanceDetails?.newLoanAmount > 0 },
    { label: "Sale", complete: investment.status === "Sold" || investment.status === "Archived" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-brand-gray-900">Project Timeline</h2>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        {phases.map((phase, idx) => (
          <div key={idx} className="flex flex-col items-center space-y-2 w-full">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${phase.complete ? 'bg-green-500' : 'bg-gray-300'}`}>
              {idx + 1}
            </div>
            <span className={`text-sm font-medium ${phase.complete ? 'text-green-700' : 'text-gray-500'}`}>
              {phase.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineTab;
