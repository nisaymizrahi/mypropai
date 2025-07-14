import React from 'react';
import FlipAnalyzer from '../components/FlipAnalyzer';
import RentalCalculator from '../components/RentalCalculator'; // 1. IMPORT
import MortgageCalculator from '../components/MortgageCalculator'; // 2. IMPORT

const FinancialToolsPage = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-brand-gray-900">Financial Tools & Calculators</h1>
                <p className="text-lg text-brand-gray-500 mt-1">
                    Analyze deals and forecast profits with these powerful calculators.
                </p>
            </div>
            
            <div className="space-y-8">
                {/* 3. REPLACE THE PLACEHOLDERS WITH THE REAL COMPONENTS */}
                <FlipAnalyzer />
                <RentalCalculator />
                <MortgageCalculator />
            </div>
        </div>
    );
};

export default FinancialToolsPage;