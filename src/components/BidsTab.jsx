import React, { useState, useEffect } from 'react';
import { getBidsForLead, importBid, deleteBid } from '../utils/api';
import toast from 'react-hot-toast';
import BidDetailModal from './BidDetailModal';

const BidsTab = ({ leadId }) => {
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
                        Upload an estimate (PDF or image). The AI will read it, extract the line items, and add it to the list below.
                    </p>
                    <div className="flex items-center gap-4">
                        <input id="bid-upload-input" type="file" onChange={handleFileChange} className="block w-full text-sm text-brand-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-turquoise-100 file:text-brand-turquoise-700 hover:file:bg-brand-turquoise-200"/>
                        <button onClick={handleImportBid} disabled={isImporting || !fileToUpload} className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50 flex-shrink-0">
                            {isImporting ? 'Analyzing...' : '🤖 Import with AI'}
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                     <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Uploaded Bids</h3>
                     <div className="space-y-3">
                        {loading ? <p>Loading bids...</p> : error ? <p className="text-red-500">{error}</p> : (
                            bids.length > 0 ? bids.map(bid => (
                                <div key={bid._id} className="flex justify-between items-center p-4 border rounded-lg hover:shadow-sm">
                                    <div>
                                        <p className="font-semibold">{bid.contractorName || 'Unknown Contractor'}</p>
                                        <p className="text-sm text-gray-500">Total: <span className="font-mono">${bid.totalAmount.toLocaleString()}</span></p>
                                    </div>
                                    <div className="space-x-4">
                                        <button onClick={() => handleViewDetails(bid)} className="font-semibold text-brand-turquoise hover:underline">View Details</button>
                                        <button onClick={() => handleDelete(bid._id)} className="text-red-500 hover:underline text-sm font-semibold">Delete</button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-brand-gray-500 py-8">No bids have been imported for this lead yet.</p>
                            )
                        )}
                     </div>
                </div>
            </div>
        </>
    );
};

export default BidsTab;