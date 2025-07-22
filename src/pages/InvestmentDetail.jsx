import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getInvestment,
  deleteInvestment,
  getBudgetItems,
  getExpenses,
  getProjectTasks,
  getVendors,
  getProjectDocuments,
} from "../utils/api";
import FinancialsTab from "../components/FinancialsTab";
import ScheduleTab from "../components/ScheduleTab";
import DashboardTab from "../components/DashboardTab";
import DocumentsTab from "../components/DocumentsTab";
import TeamTab from "../components/TeamTab";
import DealPerformanceTab from "../components/DealPerformanceTab";

const PrimaryButton = ({ onClick, children, className = '', ...props }) => (
  <button onClick={onClick} className={`bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition ${className}`} {...props}>
    {children}
  </button>
);
const SecondaryButton = ({ onClick, children, className = '', ...props }) => (
  <button onClick={onClick} className={`bg-white hover:bg-gray-100 text-gray-700 font-semibold px-4 py-2 rounded-md border border-gray-300 transition ${className}`} {...props}>
    {children}
  </button>
);
const DangerButton = ({ onClick, children, className = '', ...props }) => (
  <button onClick={onClick} className={`bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md transition ${className}`} {...props}>
    {children}
  </button>
);
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-16">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-turquoise"></div>
  </div>
);

const StatBox = ({ label, value }) => (
  <div className="text-sm text-brand-gray-600">
    <div className="font-medium text-brand-gray-400">{label}</div>
    <div className="text-lg font-semibold text-brand-gray-800">{value}</div>
  </div>
);

const SettingsTab = ({ onDelete }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Settings</h3>
    <p className="text-sm text-gray-600 mb-4">
      Deleting a project is permanent and cannot be undone. This will remove all associated budget items, expenses, and other data.
    </p>
    <DangerButton onClick={onDelete}>Delete This Investment Project</DangerButton>
  </div>
);

const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        investmentData,
        budgetData,
        expenseData,
        taskData,
        vendorData,
        documentData,
      ] = await Promise.all([
        getInvestment(id),
        getBudgetItems(id),
        getExpenses(id),
        getProjectTasks(id),
        getVendors(),
        getProjectDocuments(id),
      ]);
      setInvestment(investmentData);
      setBudgetItems(budgetData);
      setExpenses(expenseData);
      setTasks(taskData);
      setVendors(vendorData);
      setDocuments(documentData);
    } catch (err) {
      console.error(err);
      setError("Failed to load project data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteInvestment = async () => {
    if (window.confirm("Are you sure you want to delete this entire investment? This action cannot be undone.")) {
      try {
        await deleteInvestment(id);
        navigate("/investments");
      } catch (err) {
        console.error("Delete investment error:", err);
        setError("Failed to delete investment.");
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;
  if (!investment) return null;

  const TabButton = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-shrink-0 px-3 py-2 font-semibold text-sm rounded-md ${activeTab === tabName ? 'bg-brand-turquoise text-white' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Project Hub</h1>
          <p className="text-base sm:text-lg text-gray-500 mt-1">{investment.address}</p>
        </div>
        <SecondaryButton onClick={() => navigate(`/investments/${id}/edit`)} className="w-full sm:w-auto">
          Edit Property Details
        </SecondaryButton>
      </div>

      {/* Cover Image + Status */}
      {investment.coverImage && (
        <img src={investment.coverImage} alt="Property" className="w-full h-64 object-cover rounded-lg border" />
      )}
      {investment.status && (
        <span className="inline-block bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-md border border-gray-300">
          {investment.status}
        </span>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Purchase Price" value={`$${investment.purchasePrice?.toLocaleString() || '—'}`} />
        <StatBox label="ARV" value={`$${investment.arv?.toLocaleString() || '—'}`} />
        <StatBox label="Rent Est." value={`$${investment.rentEstimate?.toLocaleString() || '—'}`} />
        <StatBox label="Progress" value={`${investment.progress || 0}%`} />
      </div>

      {/* Refinance Info */}
      {investment.refinanceDetails && (
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-brand-gray-800 mb-2">Refinance Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <StatBox label="New Loan" value={`$${investment.refinanceDetails.newLoanAmount || 0}`} />
            <StatBox label="Rate" value={`${investment.refinanceDetails.newInterestRate || 0}%`} />
            <StatBox label="Term" value={`${investment.refinanceDetails.newLoanTerm || 0} yrs`} />
            <StatBox label="New ARV" value={`$${investment.refinanceDetails.newArv || 0}`} />
          </div>
        </div>
      )}

      {/* Inspection Section */}
      {investment.inspectionNotes && (
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <h3 className="text-xl font-semibold text-brand-gray-800">Inspection Summary</h3>
          <p className="text-sm text-brand-gray-600 whitespace-pre-line">{investment.inspectionNotes.summary}</p>

          {(investment.inspectionNotes.issues || []).length > 0 && (
            <div className="mt-4 space-y-2">
              {investment.inspectionNotes.issues.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b pb-1">
                  <span>{item.title}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${item.severity === 'Critical' ? 'bg-red-100 text-red-700' : item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {item.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-2 overflow-x-auto">
        <TabButton tabName="dashboard" label="Dashboard" />
        <TabButton tabName="financials" label="Financials" />
        <TabButton tabName="performance" label="Performance" />
        <TabButton tabName="schedule" label="Schedule" />
        <TabButton tabName="documents" label="Documents" />
        <TabButton tabName="team" label="Team" />
        <TabButton tabName="settings" label="Settings" />
      </div>

      <div>
        {activeTab === 'dashboard' && <DashboardTab investment={investment} budgetItems={budgetItems} expenses={expenses} tasks={tasks} />}
        {activeTab === 'financials' && <FinancialsTab investment={investment} budgetItems={budgetItems} expenses={expenses} vendors={vendors} onUpdate={fetchData} />}
        {activeTab === 'performance' && <DealPerformanceTab investment={investment} budgetItems={budgetItems} expenses={expenses} />}
        {activeTab === 'schedule' && <ScheduleTab investment={investment} tasks={tasks} vendors={vendors} onUpdate={fetchData} />}
        {activeTab === 'documents' && <DocumentsTab property={investment} />}
        {activeTab === 'team' && <TeamTab vendors={vendors} onUpdate={fetchData} />}
        {activeTab === 'settings' && <SettingsTab onDelete={handleDeleteInvestment} />}
      </div>
    </div>
  );
};

export default InvestmentDetail;
