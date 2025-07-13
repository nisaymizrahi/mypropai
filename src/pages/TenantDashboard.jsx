import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTenantLeaseDetails, submitTenantCommunication, logoutTenant } from '../utils/api';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-turquoise"></div>
    </div>
);

const TenantDashboard = () => {
    const navigate = useNavigate();
    const [leaseData, setLeaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('financials');

    // State for the communication form
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('General Inquiry');
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState('');

    const fetchLeaseData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getTenantLeaseDetails();
            setLeaseData(data);
        } catch (err) {
            setError(err.message || 'Could not load your lease information.');
            // If token is invalid or expired, log out the user
            if (err.message.includes('authorized') || err.message.includes('token')) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaseData();
    }, [fetchLeaseData]);

    const handleLogout = () => {
        logoutTenant();
        navigate('/tenant-login');
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!subject || !category) {
            setFormMessage('Please provide a subject and category.');
            return;
        }
        setIsSubmitting(true);
        setFormMessage('');

        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('category', category);
        formData.append('notes', notes);
        if (file) {
            formData.append('attachment', file);
        }

        try {
            await submitTenantCommunication(formData);
            setFormMessage('Your request has been sent successfully!');
            // Clear the form
            setSubject('');
            setCategory('General Inquiry');
            setNotes('');
            setFile(null);
            document.getElementById('tenant-attachment-input').value = null;
        } catch (err) {
            setFormMessage(err.message || 'There was an error sending your request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="p-6 text-red-600 text-center">{error}</div>;
    if (!leaseData) return <div className="p-6 text-center">No lease information found.</div>;

    const currentBalance = leaseData.transactions.reduce((acc, t) => acc + t.amount, 0);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

    return (
        <div className="min-h-screen bg-brand-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-brand-gray-900">Tenant Portal</h1>
                        <p className="text-sm text-brand-gray-500">{leaseData.unit.property.address} - {leaseData.unit.name}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition text-sm"
                    >
                        Log Out
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-b border-gray-200 mb-4">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('financials')} className={`${activeTab === 'financials' ? 'border-brand-turquoise text-brand-turquoise-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Financials & Ledger
                            </button>
                            <button onClick={() => setActiveTab('request')} className={`${activeTab === 'request' ? 'border-brand-turquoise text-brand-turquoise-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Submit a Request
                            </button>
                        </nav>
                    </div>

                    {activeTab === 'financials' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
                            <div className="flex justify-between items-baseline mb-4">
                                <h2 className="text-lg font-semibold text-brand-gray-800">Financial Ledger</h2>
                                <p className="text-lg font-bold">Current Balance: 
                                    <span className={currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </p>
                            </div>
                            <div className="border-t border-brand-gray-200">
                                {leaseData.transactions.length > 0 ? (
                                    [...leaseData.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (
                                    <div key={t._id} className="flex justify-between items-center py-3 border-b">
                                        <div>
                                            <p className="font-medium text-brand-gray-800">{t.type}</p>
                                            <p className="text-xs text-brand-gray-500">{formatDate(t.date)}</p>
                                        </div>
                                        <p className={`font-semibold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    ))
                                ) : (
                                    <p className="text-center text-brand-gray-500 py-8">No transactions yet.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'request' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
                            <h2 className="text-lg font-semibold text-brand-gray-800 mb-4">Submit a Request</h2>
                            <form onSubmit={handleSubmitRequest} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-gray-700">Category</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2">
                                        <option>General Inquiry</option>
                                        <option>Maintenance</option>
                                        <option>Personal Message</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-gray-700">Subject</label>
                                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-gray-700">Details</label>
                                    <textarea rows="4" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-gray-700">Attachment (optional)</label>
                                    <input id="tenant-attachment-input" type="file" onChange={(e) => setFile(e.target.files[0])} className="mt-1 block w-full text-sm text-brand-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-turquoise-100 file:text-brand-turquoise-700 hover:file:bg-brand-turquoise-200" />
                                </div>
                                {formMessage && <p className="text-sm text-center p-2 bg-brand-gray-100 rounded-md">{formMessage}</p>}
                                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50">
                                    {isSubmitting ? 'Sending...' : 'Send Request'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TenantDashboard;