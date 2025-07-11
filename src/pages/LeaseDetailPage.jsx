import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTokenHeader } from '../utils/api';
import { API_BASE_URL } from '../config';
import AddTransactionModal from '../components/AddTransactionModal';

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

    const fetchLeaseDetails = useCallback(async () => {
        setLoading(true); // Always set loading true before fetch
        try {
            const res = await fetch(`${API_BASE_URL}/management/leases/${leaseId}`, {
                headers: getTokenHeader(),
            });
            if (!res.ok) {
                throw new Error('Failed to fetch lease details.');
            }
            const data = await res.json();
            setLease(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [leaseId]); // ✅ Removed `loading` from dependency array

    useEffect(() => {
        fetchLeaseDetails();
    }, [fetchLeaseDetails]);

    const handleTransactionAdded = () => {
        fetchLeaseDetails();
    };

    if (authLoading) {
        return <LoadingSpinner />;
    }

    if (!authenticated) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <p className="text-red-500 text-center p-4">{error}</p>;
    }

    if (!lease) {
        return <p className="text-center p-4">Lease not found.</p>;
    }

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
    const currentBalance = lease.transactions.reduce((acc, t) => acc + t.amount, 0);

    return (
        <>
            <AddTransactionModal 
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                onSuccess={handleTransactionAdded}
                leaseId={leaseId}
            />

            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-gray-900">Lease Details</h1>
                        <p className="text-lg text-brand-gray-500 mt-1">
                            {lease.unit.property.address} - {lease.unit.name}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(`/management/${lease.unit.property._id}`)}
                        className="bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition"
                    >
                        &larr; Back to Property
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Lease & Tenant Details Column */}
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

                    {/* Financial Ledger Column */}
                    <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-sm border border-brand-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-brand-gray-800">Financial Ledger</h2>
                            <button onClick={() => setIsTransactionModalOpen(true)} className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md text-sm transition">
                                Add Transaction
                            </button>
                        </div>

                        <div className="flow-root">
                            <div className="border-t border-brand-gray-200">
                                {lease.transactions.length > 0 ? (
                                    lease.transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (
                                        <div key={t._id} className="flex justify-between items-center py-3 border-b">
                                            <div>
                                                <p className="font-medium text-brand-gray-800">{t.type}</p>
                                                <p className="text-xs text-brand-gray-500">{formatDate(t.date)}</p>
                                            </div>
                                            <p className={`font-semibold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-brand-gray-500 py-8">No transactions yet.</p>
                                )}
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-3">
                                <span>Current Balance:</span>
                                <span>${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LeaseDetailPage;
