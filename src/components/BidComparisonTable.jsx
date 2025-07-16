import React, { useMemo } from 'react';

const BidComparisonTable = ({ bids }) => {

    const { tableData, optimizedTotal, potentialSavings } = useMemo(() => {
        if (!bids || bids.length === 0) {
            return { tableData: [], optimizedTotal: 0, potentialSavings: 0 };
        }

        const allItems = {};
        
        bids.forEach(bid => {
            bid.items.forEach(item => {
                if (!allItems[item.description]) {
                    allItems[item.description] = { description: item.description };
                }
            });
        });

        bids.forEach((bid, bidIndex) => {
            Object.keys(allItems).forEach(desc => {
                const foundItem = bid.items.find(i => i.description === desc);
                allItems[desc][`bid_${bidIndex}`] = foundItem ? foundItem.cost : null;
            });
        });

        let newOptimizedTotal = 0;
        const data = Object.values(allItems);
        
        // Calculate the lowest cost for each row and the optimized total
        data.forEach(row => {
            let minCost = Infinity;
            bids.forEach((_, bidIndex) => {
                const cost = row[`bid_${bidIndex}`];
                if (cost !== null && cost < minCost) {
                    minCost = cost;
                }
            });
            row.optimizedCost = minCost === Infinity ? null : minCost;
            if (row.optimizedCost) {
                newOptimizedTotal += row.optimizedCost;
            }
        });
        
        // Find the lowest total bid to calculate savings against
        const lowestTotalBid = Math.min(...bids.map(b => b.totalAmount));
        const newPotentialSavings = lowestTotalBid - newOptimizedTotal;

        return { tableData: data, optimizedTotal: newOptimizedTotal, potentialSavings: newPotentialSavings };

    }, [bids]);
    
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-brand-gray-50">
                    <tr>
                        <th className="text-left p-3 font-semibold w-1/3">Task / Line Item</th>
                        {bids.map((bid, index) => (
                            <th key={bid._id} className="text-right p-3 font-semibold">
                                {bid.contractorName || `Bid #${index + 1}`}
                            </th>
                        ))}
                        {/* 1. ADD NEW HEADER FOR THE OPTIMIZED COLUMN */}
                        <th className="text-right p-3 font-semibold bg-green-100 text-green-800">Optimized Bid</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {tableData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-brand-gray-50">
                            <td className="p-3 font-medium">{row.description}</td>
                            {bids.map((bid, bidIndex) => {
                                const cost = row[`bid_${bidIndex}`];
                                return (
                                    <td key={bid._id} className="p-3 text-right font-mono">
                                        {cost !== null ? `$${cost.toLocaleString()}` : '—'}
                                    </td>
                                );
                            })}
                             {/* 2. ADD THE CELL FOR THE OPTIMIZED COST */}
                            <td className="p-3 text-right font-mono font-bold text-green-600 bg-green-50">
                                {row.optimizedCost !== null ? `$${row.optimizedCost.toLocaleString()}` : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
                 <tfoot className="border-t-2 font-bold">
                    <tr>
                        <td className="p-3 text-left">Total</td>
                        {bids.map(bid => (
                            <td key={bid._id} className="p-3 text-right font-mono">
                                ${bid.totalAmount.toLocaleString()}
                            </td>
                        ))}
                        {/* 3. ADD THE TOTAL FOR THE OPTIMIZED COLUMN */}
                        <td className="p-3 text-right font-mono text-green-600 bg-green-100">
                            ${optimizedTotal.toLocaleString()}
                        </td>
                    </tr>
                    {/* 4. ADD THE POTENTIAL SAVINGS ROW */}
                    {potentialSavings > 0 && (
                        <tr className="bg-green-100">
                            <td colSpan={bids.length + 1} className="p-3 text-right font-semibold text-green-800">
                                Potential Savings
                            </td>
                            <td className="p-3 text-right font-bold text-green-800">
                                ${potentialSavings.toLocaleString()}
                            </td>
                        </tr>
                    )}
                </tfoot>
            </table>
        </div>
    );
};

export default BidComparisonTable;