import React from 'react';

const BidDetailModal = ({ isOpen, onClose, bid }) => {
    if (!isOpen || !bid) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-brand-gray-800">{bid.contractorName || 'Bid Details'}</h2>
                        <p className="text-sm text-brand-gray-500">Total Amount: <span className="font-semibold">${bid.totalAmount.toLocaleString()}</span></p>
                    </div>
                    <button onClick={onClose} className="text-2xl font-bold">&times;</button>
                </div>

                <div className="overflow-y-auto max-h-[60vh] border-t">
                    <table className="min-w-full text-sm">
                        <thead className="bg-brand-gray-50 sticky top-0">
                            <tr>
                                <th className="text-left p-3 font-semibold">Description</th>
                                <th className="text-right p-3 font-semibold w-32">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {bid.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-3">{item.description}</td>
                                    <td className="p-3 text-right font-mono">${item.cost.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md border">Close</button>
                </div>
            </div>
        </div>
    );
};

export default BidDetailModal;