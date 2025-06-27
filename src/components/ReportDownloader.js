import React from "react";
import { jsPDF } from "jspdf";

const ReportDownloader = ({ comps, roiData }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text("MyPropAI Property Report", 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text("Comparable Properties", 10, y);
    y += 8;

    comps.forEach((comp, index) => {
      doc.text(
        `${index + 1}. ${comp.address || "Unknown"} | ${comp.beds} bd / ${comp.baths} ba | ${comp.sqft} sqft | $${comp.price.toLocaleString()}`,
        10,
        y
      );
      y += 7;
    });

    if (roiData) {
      y += 10;
      doc.text("ROI Summary", 10, y);
      y += 8;
      doc.text(`Monthly Cash Flow: $${roiData.cashFlow}`, 10, y); y += 7;
      doc.text(`Cap Rate: ${roiData.capRate}%`, 10, y); y += 7;
      doc.text(`Cash-on-Cash ROI: ${roiData.roi}%`, 10, y);
    }

    doc.save("mypropai_report.pdf");
  };

  return (
    <div className="text-center">
      <button
        onClick={generatePDF}
        className="mt-4 px-6 py-2 bg-purple-600 text-white font-medium rounded hover:bg-purple-700 transition"
      >
        📄 Download Report as PDF
      </button>
    </div>
  );
};

export default ReportDownloader;
