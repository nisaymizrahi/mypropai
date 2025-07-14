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

// --- Reusable UI Components ---
const PrimaryButton = ({ onClick, children, className = '', ...props }) => <button onClick={onClick} className={`bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition ${className}`} {...props}>{children}</button>;
const SecondaryButton = ({ onClick, children, className = '', ...props }) => <button onClick={onClick} className={`bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition ${className}`} {...props}>{children}</button>;
const DangerButton = ({ onClick, children, className = '', ...props }) => <button onClick={onClick} className={`bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-md transition ${className}`} {...props}>{children}</button>;
const LoadingSpinner = () => <div className="flex justify-center items-center p-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-turquoise"></div></div>;

// --- Tab Components ---
const SettingsTab = ({ onDelete }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
        <h3 className="text-lg font-semibold text-brand-gray-800 mb-4">Project Settings</h3>
        <p className="text-sm text-brand-gray-600 mb-4">
            Deleting a project is permanent and cannot be undone. This will remove all associated budget items, expenses, and other data.
        </p>
        <DangerButton onClick={onDelete}>Delete This Investment Project</DangerButton>
    </div>
);


// --- Main Investment Detail Page Component ---
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
  if (error) return <div className="p-6 text-red-600 text-center">{error}</div>;
  if (!investment) return null;

  const TabButton = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-3 py-2 font-semibold text-sm rounded-md ${activeTab === tabName ? 'bg-brand-turquoise text-white' : 'text-brand-gray-600 hover:bg-brand-gray-100'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-brand-gray-900">Project Hub</h1>
            <p className="text-brand-gray-500">{investment.address}</p>
        </div>
        <SecondaryButton onClick={() => navigate(`/investments/${id}/edit`)}>Edit Property Details</SecondaryButton>
      </div>

      <div className="bg-white p-2 rounded-lg shadow-sm border border-brand-gray-200 flex items-center space-x-2 overflow-x-auto">
        <TabButton tabName="dashboard" label="Dashboard" />
        <TabButton tabName="financials" label="Financials" />
        <TabButton tabName="schedule" label="Schedule" />
        <TabButton tabName="documents" label="Documents" />
        <TabButton tabName="team" label="Team" />
        <TabButton tabName="settings" label="Settings" />
      </div>

      <div>
        {activeTab === 'dashboard' && 
            <DashboardTab 
                investment={investment}
                budgetItems={budgetItems}
                expenses={expenses}
                tasks={tasks}
            />
        }
        {activeTab === 'financials' && 
            <FinancialsTab 
                investment={investment}
                budgetItems={budgetItems} 
                expenses={expenses} 
                vendors={vendors}
                onUpdate={fetchData}
            />
        }
        {activeTab === 'schedule' && 
            <ScheduleTab 
                investment={investment}
                tasks={tasks} 
                vendors={vendors}
                onUpdate={fetchData}
            />
        }
        {activeTab === 'documents' && 
            <DocumentsTab 
                investmentId={investment._id}
                documents={documents}
                onUpdate={fetchData}
            />
        }
        {activeTab === 'team' && 
            <TeamTab 
                vendors={vendors} 
                onUpdate={fetchData}
            />
        }
        {activeTab === 'settings' && <SettingsTab onDelete={handleDeleteInvestment} />}
      </div>
    </div>
  );
};

export default InvestmentDetail;
