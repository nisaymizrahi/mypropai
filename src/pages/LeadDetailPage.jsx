import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeadDetails, analyzeLeadComps } from '../utils/api';

const LoadingSpinner = () => <div className="flex justify-center items-center p-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-turquoise"></div></div>;

const LeadDetailPage = () => {
    const { id } = useParams();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State for the analysis tool
    const [filters, setFilters] = useState({ radius: '0.5', saleDateMonths: '6' });
    const [report, setReport] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getLeadDetails(id);
            setLead(data);
        } catch (err) {
            setError(err.message || "Failed to load lead details.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        setReport('');
        setError('');
        try {
            const result = await analyzeLeadComps(id, filters);
            setReport(result.report);
        } catch (err) {
            setError(err.message || "Analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error && !report) return <p className="text-red-500 text-center p-4">{error}</p>;
    if (!lead) return <p className="text-center p-4">Lead not found.</p>;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <Link to="/leads" className="text-sm text-brand-blue hover:underline">&larr; Back to Leads Pipeline</Link>
                <h1 className="text-3xl font-bold text-brand-gray-900">Lead Analysis</h1>
                <p className="text-lg text-brand-gray-500 mt-1">{lead.address}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- Control Panel Column --- */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Comps Analysis</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Search Radius (miles)</label>
                                <input type="number" name="radius" value={filters.radius} onChange={handleFilterChange} className="mt-1 block w-full border rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Sold within last (months)</label>
                                <input type="number" name="saleDateMonths" value={filters.saleDateMonths} onChange={handleFilterChange} className="mt-1 block w-full border rounded-md p-2" />
                            </div>
                            {/* Add more filters here later if needed */}
                            <button onClick={handleRunAnalysis} disabled={isAnalyzing} className="w-full bg-brand-turquoise text-white font-semibold py-2 rounded-md disabled:opacity-50">
                                {isAnalyzing ? 'Analyzing...' : '🤖 Run AI Comps Analysis'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Report Column --- */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-lg shadow-sm border min-h-[300px]">
                        <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">AI Generated Report</h3>
                        {isAnalyzing && <LoadingSpinner />}
                        {error && !report && <p className="text-red-500">{error}</p>}
                        {report && (
                            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">{report}</pre>
                        )}
                        {!isAnalyzing && !report && <p className="text-gray-500">Run analysis to generate a report.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadDetailPage;