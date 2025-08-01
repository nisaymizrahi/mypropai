import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getAuthHeaders, runRecurringCharges, archiveLease } from '../utils/api';
import { API_BASE_URL } from '../config';
import AddTransactionModal from '../components/AddTransactionModal';
import CommunicationTab from '../components/CommunicationTab';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-turquoise"></div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="py-2">
    <p className="text-sm text-brand-gray-500">{label}</p>
    <p className="font-semibold text-brand-gray-800">{value}</p>
  </div>
);

const LeaseDetailPage = () => {
  const { leaseId } = useParams();
  const navigate = useNavigate();
  const { authenticated, loading: authLoading } = useAuth();

  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ledger');
  const [editTenant, setEditTenant] = useState({});
  const [editLeaseTerms, setEditLeaseTerms] = useState({});
  const [isRunningCharges, setIsRunningCharges] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const fetchLeaseDetails = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/management/leases/${leaseId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if(res.status === 404) navigate('/management', { replace: true });
        throw new Error('Failed to fetch lease details.');
      }
      const data = await res.json();
      setLease(data);
      if (!data.communications) {
        data.communications = [];
      }
      setEditTenant({ fullName: data.tenant.fullName, email: data.tenant.email, phone: data.tenant.phone || '' });
      setEditLeaseTerms({
        startDate: data.startDate.split('T')[0],
        endDate: data.endDate.split('T')[0],
        rentAmount: data.rentAmount,
        securityDeposit: data.securityDeposit,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [leaseId, navigate]);

  useEffect(() => {
    if (authenticated) {
      fetchLeaseDetails();
    }
  }, [fetchLeaseDetails, authenticated]);

  const handleTransactionAdded = () => {
    fetchLeaseDetails();
  };
  
  const handleCommunicationsUpdate = () => {
    fetchLeaseDetails();
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/management/leases/${leaseId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tenantUpdates: editTenant,
          leaseTermUpdates: editLeaseTerms
        })
      });
      if (!res.ok) throw new Error('Failed to save settings');
      await fetchLeaseDetails();
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRecurringDelete = async (index) => {
    const updated = lease.recurringCharges.filter((_, i) => i !== index);
    try {
      const res = await fetch(`${API_BASE_URL}/management/leases/${leaseId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recurringCharges: updated })
      });
      if (!res.ok) throw new Error('Failed to update recurring charges');
      await fetchLeaseDetails();
      toast.success('Recurring charge removed.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleClearAllRecurring = async () => {
    if (window.confirm('Are you sure you want to delete ALL recurring charges for this lease?')) {
        try {
          const res = await fetch(`${API_BASE_URL}/management/leases/${leaseId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ recurringCharges: [] })
          });
          if (!res.ok) throw new Error('Failed to clear recurring charges');
          await fetchLeaseDetails();
          toast.success('All recurring charges have been deleted.');
        } catch (err) {
          toast.error(err.message);
        }
    }
  };

  const handleRunRecurring = async () => {
    setIsRunningCharges(true);
    try {
      const result = await runRecurringCharges();
      toast.success(result.message || 'Recurring charges applied');
      await fetchLeaseDetails();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsRunningCharges(false);
    }
  };
  
  const handleSendInvite = async () => {
      setIsSendingInvite(true);
      try {
          const res = await fetch(`${API_BASE_URL}/management/leases/${leaseId}/send-invite`, {
              method: 'POST',
              headers: getAuthHeaders()
          });
          const data = await res.json();
          if (!res.ok) {
              throw new Error(data.msg || 'Failed to send invite.');
          }
          toast.success('Invitation sent successfully!');
      } catch (err) {
          toast.error(`Error: ${err.message}`);
      } finally {
          setIsSendingInvite(false);
      }
  };

  const handleArchiveLease = async () => {
    if (window.confirm("Are you sure you want to end and archive this lease? This will set the unit to 'Vacant' and cannot be undone.")) {
      try {
        await archiveLease(leaseId);
        toast.success('Lease archived successfully!');
        navigate(`/management/${lease.unit.property._id}`);
      } catch (error) {
        toast.error(error.message || "Failed to archive lease.");
      }
    }
  };

  if (authLoading || loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center p-4">{error}</p>;
  if (!lease) return <p className="text-center p-4">Lease not found.</p>;

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
  const currentBalance = lease.transactions.reduce((acc, t) => acc + t.amount, 0);

  const TabButton = ({ tabName, label }) => (
    <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 rounded-md font-semibold ${activeTab === tabName ? 'bg-brand-turquoise text-white' : 'bg-white border border-brand-gray-300 text-brand-gray-700'}`}>{label}</button>
  );

  return (
    <>
      <AddTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSuccess={handleTransactionAdded} leaseId={leaseId} recurringCharges={lease.recurringCharges || []} />

      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-brand-gray-900">Lease Details</h1>
            <p className="text-lg text-brand-gray-500 mt-1">{lease.unit.property.address} - {lease.unit.name}</p>
          </div>
          <button onClick={() => navigate(`/management/${lease.unit.property._id}`)} className="bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition">&larr; Back to Property</button>
        </div>
        
        <div className="flex gap-4 mb-6">
          <TabButton tabName="ledger" label="Ledger" />
          <TabButton tabName="communication" label="Communication" />
          <TabButton tabName="settings" label="Settings" />
        </div>

        {activeTab === 'ledger' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-gray-200">
                <h2 className="text-lg font-semibold text-brand-gray-800 border-b pb-2 mb-2">Lease Terms</h2>
                <DetailRow label="Start Date" value={formatDate(lease.startDate)} />
                <DetailRow label="End Date" value={formatDate(lease.endDate)} />
                <DetailRow label="Monthly Rent" value={`$${lease.rentAmount.toLocaleString()}`} />
                <DetailRow label="Security Deposit" value={`$${lease.securityDeposit.toLocaleString()}`} />
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-gray-200">
                <h2 className="text-lg font-semibold text-brand-gray-800 border-b pb-2 mb-2">Tenant Information</h2>
                <DetailRow label="Full Name" value={lease.tenant.fullName} />
                <DetailRow label="Email" value={lease.tenant.email} />
                <DetailRow label="Phone" value={lease.tenant.phone || 'N/A'} />
              </div>
            </div>
            <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-sm border border-brand-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-brand-gray-800">Financial Ledger</h2>
                <button onClick={() => setIsTransactionModalOpen(true)} className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md text-sm transition">Add Transaction</button>
              </div>
              <div className="flow-root"><div className="border-t border-brand-gray-200">{lease.transactions.length > 0 ? ([...lease.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (<div key={t._id} className="flex justify-between items-center py-3 border-b"><div><p className="font-medium text-brand-gray-800">{t.type}</p><p className="text-xs text-brand-gray-500">{formatDate(t.date)}</p></div><p className={`font-semibold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>))) : (<p className="text-center text-brand-gray-500 py-8">No transactions yet.</p>)}</div><div className="flex justify-between font-bold text-lg pt-3"><span>Current Balance:</span><span>${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div></div>
            </div>
          </div>
        )}
        
        {activeTab === 'communication' && (<CommunicationTab lease={lease} onUpdate={handleCommunicationsUpdate} />)}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-brand-gray-200">
              <h2 className="text-lg font-semibold mb-2">Tenant Portal Access</h2>
              <p className="text-sm text-brand-gray-600 mb-4">Click the button below to send an email invitation to <strong className="text-brand-gray-800">{lease.tenant.email}</strong>.</p>
              <button onClick={handleSendInvite} disabled={isSendingInvite} className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50 transition">{isSendingInvite ? 'Sending...' : 'Send Tenant Portal Invitation'}</button>
            </div>
            <div className="bg-white p-4 rounded-lg border border-brand-gray-200">
              <h2 className="text-lg font-semibold mb-4">Edit Lease Terms</h2>
              <div className="grid grid-cols-2 gap-4"><input type="date" value={editLeaseTerms.startDate} onChange={e => setEditLeaseTerms(p => ({ ...p, startDate: e.target.value }))} className="border p-2 rounded" /><input type="date" value={editLeaseTerms.endDate} onChange={e => setEditLeaseTerms(p => ({ ...p, endDate: e.target.value }))} className="border p-2 rounded" /><input type="number" value={editLeaseTerms.rentAmount} onChange={e => setEditLeaseTerms(p => ({ ...p, rentAmount: e.target.value }))} className="border p-2 rounded" placeholder="Monthly Rent" /><input type="number" value={editLeaseTerms.securityDeposit} onChange={e => setEditLeaseTerms(p => ({ ...p, securityDeposit: e.target.value }))} className="border p-2 rounded" placeholder="Security Deposit" /></div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-brand-gray-200">
              <h2 className="text-lg font-semibold mb-4">Edit Tenant Information</h2>
              <div className="grid grid-cols-2 gap-4"><input type="text" value={editTenant.fullName} onChange={e => setEditTenant(p => ({ ...p, fullName: e.target.value }))} className="border p-2 rounded" placeholder="Full Name" /><input type="email" value={editTenant.email} onChange={e => setEditTenant(p => ({ ...p, email: e.target.value }))} className="border p-2 rounded" placeholder="Email" /><input type="text" value={editTenant.phone} onChange={e => setEditTenant(p => ({ ...p, phone: e.target.value }))} className="border p-2 rounded" placeholder="Phone" /></div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-brand-gray-200">
              <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold">Manage Recurring Charges</h2><button onClick={handleRunRecurring} disabled={isRunningCharges} className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md hover:bg-brand-turquoise-600 disabled:opacity-50">{isRunningCharges ? 'Running...' : 'Run Charges Now'}</button></div>
              {lease.recurringCharges?.map((rc, idx) => (<div key={idx} className="flex justify-between items-center border-b py-2"><div><p className="text-sm font-medium">{rc.description}</p><p className="text-xs text-brand-gray-500">{rc.type}, Day {rc.dayOfMonth} - ${rc.amount / 100}</p></div><button onClick={() => handleRecurringDelete(idx)} className="text-red-600 hover:underline text-sm">Delete</button></div>))}
              {lease.recurringCharges?.length === 0 && <p className="text-sm text-brand-gray-500">No recurring charges set.</p>}
              {lease.recurringCharges?.length > 0 && (<button onClick={handleClearAllRecurring} className="mt-4 text-sm text-red-600 underline">Delete All Recurring Charges</button>)}
            </div>
            <button onClick={handleSaveSettings} className="bg-brand-turquoise text-white px-6 py-2 rounded-md font-semibold">Save Settings</button>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-6">
                <h2 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h2>
                <p className="text-sm text-red-700 mb-4">Ending a lease is permanent. It will mark this lease as inactive and set the unit's status to 'Vacant'.</p>
                <button onClick={handleArchiveLease} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md transition">End & Archive Lease</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LeaseDetailPage;
