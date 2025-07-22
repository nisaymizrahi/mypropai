import React from "react";

const AIGeneratedReport = ({ content }) => {
  if (!content) return null;

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm mt-6 whitespace-pre-line text-sm leading-relaxed text-brand-gray-800">
      {content}
    </div>
  );
};

export default AIGeneratedReport;
