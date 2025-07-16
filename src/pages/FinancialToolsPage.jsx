import React from 'react';
import FlipAnalyzer from '../components/FlipAnalyzer';
import RentalCalculator from '../components/RentalCalculator';
import MortgageCalculator from '../components/MortgageCalculator';

const FinancialToolsPage = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Financial Tools & Calculators</h1>
                <p className="text-lg text-gray-500 mt-1">
                    Analyze deals and forecast profits with these powerful calculators.
                </p>
            </div>
            
            <div className="space-y-8">
                <FlipAnalyzer />
                <RentalCalculator />
                <MortgageCalculator />
            </div>
        </div>
    );
};

export default FinancialToolsPage;