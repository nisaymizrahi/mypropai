import React from "react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

// --- NEW: SVG Icon for the download button ---
const DownloadIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);


const ReportDownloader = ({ comps, subject, roiData }) => {
  const generatePDF = () => {
    if (!subject) {
        alert("Please search for a property first to generate a report.");
        return;
    }
    
    const doc = new jsPDF();
    const pageTitle = "MyPropAI Property Analysis Report";
    const reportDate = new Date().toLocaleDateString();

    // --- NEW: Improved PDF Generation Logic ---

    // 1. Add Header
    doc.setFontSize(18);
    doc.text(pageTitle, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report for: ${subject.address}`, 14, 30);
    doc.text(`Date: ${reportDate}`, 14, 36);

    // 2. Add Subject Property Details
    if (subject) {
        autoTable(doc, {
            startY: 45,
            head: [['Subject Property Details', '']],
            body: [
                ['Beds', subject.beds || 'N/A'],
                ['Baths', subject.baths || 'N/A'],
                ['Sqft', subject.sqft ? subject.sqft.toLocaleString() : 'N/A'],
                ['Est. Price', subject.price ? `$${subject.price.toLocaleString()}` : 'N/A'],
            ],
            theme: 'striped',
            headStyles: { fillColor: [42, 59, 77] }, // brand-slate-100
        });
    }

    // 3. Add Comps Table
    if (comps && comps.length > 0) {
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Address', 'Beds', 'Baths', 'Sqft', 'Price', 'Sale Date']],
            body: comps.map(c => [
                c.address,
                c.beds || 'N/A',
                c.baths || 'N/A',
                c.sqft ? c.sqft.toLocaleString() : 'N/A',
                c.price ? `$${c.price.toLocaleString()}` : 'N/A',
                c.saleDate ? new Date(c.saleDate).toLocaleDateString() : 'N/A'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [42, 59, 77] },
        });
    }

    // 4. Add ROI Summary
    if (roiData) {
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['ROI Summary', '']],
            body: [
                ['Down Payment', `$${roiData.downPayment}`],
                ['Monthly Cash Flow', `$${roiData.cashFlow}`],
                ['Cap Rate', `${roiData.capRate}%`],
                ['Cash-on-Cash ROI', `${roiData.roi}%`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [42, 59, 77] },
        });
    }

    doc.save(`MyPropAI_Report_${subject.address.replace(/ /g, '_')}.pdf`);
  };

  return (
    <div className="text-center">
      <button
        onClick={generatePDF}
        // NEW: Redesigned button with new theme and icon
        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-blue hover:bg-sky-500 transition-colors duration-200"
      >
        <DownloadIcon className="h-5 w-5 mr-2" />
        Download Report as PDF
      </button>
    </div>
  );
};

export default ReportDownloader;
