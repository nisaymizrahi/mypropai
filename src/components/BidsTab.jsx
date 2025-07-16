import React, { useState, useEffect, useMemo } from 'react';
import { getBidsForLead, importBid, deleteBid } from '../utils/api';
import toast from 'react-hot-toast';
import BidDetailModal from './BidDetailModal'; 
import BidComparisonTable from './BidComparisonTable'; // 1. IMPORT THE NEW COMPONENT

const BidsTab = ({ leadId, onUpdate }) => {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [fileToUpload, setFileToUpload] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedBid, setSelectedBid] = useState(null);

    const fetchBids = async () => {
        try {
            setLoading(true);
            const bidsData = await getBidsForLead(leadId);
            setBids(bidsData);
        } catch (err) {
            setError(err.message || 'Failed to fetch bids.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (leadId) {
            fetchBids();
        }
    }, [leadId]);

    const handleFileChange = (e) => {
        setFileToUpload(e.target.files[0]);
    };

    const handleImportBid = async () => {
        if (!fileToUpload) {
            toast.error('Please select a file to import.');
            return;
        }
        setIsImporting(true);
        const formData = new FormData();
        formData.append('leadId', leadId);
        formData.append('estimate', fileToUpload);
        
        const toastId = toast.loading('Importing and analyzing bid...');
        try {
            await importBid(formData);
            toast.success('Bid imported successfully!', { id: toastId });
            setFileToUpload(null);
            document.getElementById('bid-upload-input').value = null;
            fetchBids(); 
        } catch (err) {
            toast.error(err.message || 'Failed to import bid.', { id: toastId });
        } finally {
            setIsImporting(false);
        }
    };

    const handleDelete = async (bidId) => {
        if (window.confirm('Are you sure you want to delete this bid?')) {
            try {
                await deleteBid(bidId);
                toast.success('Bid deleted.');
                fetchBids();
            } catch (err) {
                toast.error(err.message || 'Failed to delete bid.');
            }
        }
    };

    const handleViewDetails = (bid) => {
        setSelectedBid(bid);
        setIsDetailModalOpen(true);
    };

    return (
        <>
            <BidDetailModal 
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                bid={selectedBid}
            />

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Import Contractor Bid</h3>
                    <p className="text-sm text-brand-gray-600 mb-4">
                        Upload a contractor's estimate (PDF or image). The AI will read the file, extract the line items, and add it to the comparison table below.
                    </p>
                    <div className="flex items-center gap-4">
                        <input id="bid-upload-input" type="file" onChange={handleFileChange} className="block w-full text-sm text-brand-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-turquoise-100 file:text-brand-turquoise-700 hover:file:bg-brand-turquoise-200"/>
                        <button onClick={handleImportBid} disabled={isImporting || !fileToUpload} className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50 flex-shrink-0">
                            {isImporting ? 'Analyzing...' : '🤖 Import with AI'}
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                     <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Bid Comparison</h3>
                        {loading ? <p>Loading bids...</p> : error ? <p className="text-red-500">{error}</p> : (
                            bids.length > 0 ? (
                                // 2. USE THE NEW COMPARISON TABLE
                                <BidComparisonTable bids={bids} />
                            ) : (
                                <p className="text-center text-brand-gray-500 py-8">No bids have been imported for this lead yet.</p>
                            )
                        )}
                </div>
            </div>
        </>
    );
};

export default BidsTab;