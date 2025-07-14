import React, { useState } from 'react';
import { generateAIDescription } from '../utils/api';

const AIWriterModal = ({ isOpen, onClose, onUseDescription, property }) => {
    const [keywords, setKeywords] = useState('');
    const [generatedDescription, setGeneratedDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = {
                propertyType: property.investment?.propertyType || 'property',
                beds: property.investment?.bedrooms || '',
                baths: property.investment?.bathrooms || '',
                keywords: keywords
            };
            const result = await generateAIDescription(data);
            setGeneratedDescription(result.description);
        } catch (err) {
            setError(err.message || 'Failed to generate description.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUseThis = () => {
        onUseDescription(generatedDescription);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl space-y-4">
                <h2 className="text-xl font-bold text-brand-gray-800">AI Description Writer</h2>
                <div>
                    <label className="block text-sm font-medium">Enter some keywords to focus on:</label>
                    <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g., quiet street, great natural light, new appliances" className="mt-1 block w-full border rounded-md p-2" />
                </div>
                <button onClick={handleGenerate} disabled={isLoading} className="bg-brand-turquoise text-white px-4 py-2 rounded-md disabled:opacity-50">
                    {isLoading ? 'Generating...' : '✨ Generate Description'}
                </button>

                {error && <p className="text-sm text-red-600 p-2">{error}</p>}
                
                {generatedDescription && (
                    <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold mb-2">Generated Description:</h4>
                        <textarea readOnly value={generatedDescription} rows="8" className="w-full p-2 border bg-gray-50 rounded-md"></textarea>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
                    <button onClick={handleUseThis} disabled={!generatedDescription} className="bg-brand-turquoise text-white px-4 py-2 rounded-md disabled:bg-opacity-50">
                        Use This Description
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIWriterModal;