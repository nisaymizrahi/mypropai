import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    getUnitDetails, 
    updateListingDetails, 
    addListingPhotos, 
    deleteListingPhoto,
    generateAIDescription 
} from '../utils/api';

const LoadingSpinner = () => <div className="flex justify-center items-center p-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-turquoise"></div></div>;

// AI Writer Modal Component
const AIWriterModal = ({ isOpen, onClose, onUseDescription, unit }) => {
    const [keywords, setKeywords] = useState('');
    const [generatedDescription, setGeneratedDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = {
                propertyType: 'Apartment/Unit',
                beds: unit?.beds || '',
                baths: unit?.baths || '',
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


const masterAmenityList = [
    'In-unit Laundry', 'Parking Available', 'Pets Allowed', 'Dishwasher',
    'Air Conditioning', 'Balcony/Patio', 'Hardwood Floors', 'Elevator',
    'Fitness Center', 'Swimming Pool', 'Storage Unit', 'Furnished'
];

const UnitListingPage = () => {
    const { unitId } = useParams();
    const navigate = useNavigate();

    const [unit, setUnit] = useState(null);
    const [details, setDetails] = useState({ headline: '', description: '', amenities: [], rent: '' });
    const [filesToUpload, setFilesToUpload] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [showSyndication, setShowSyndication] = useState(false);
    
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const unitData = await getUnitDetails(unitId);
            setUnit(unitData);
            setDetails({
                headline: unitData.listingDetails?.headline || '',
                description: unitData.listingDetails?.description || '',
                amenities: unitData.listingDetails?.amenities || [],
                rent: unitData.listingDetails?.rent || unitData.currentLease?.rentAmount || ''
            });
        } catch (err) {
            setError(err.message || "Failed to load unit details.");
        } finally {
            setLoading(false);
        }
    }, [unitId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleChange = (e) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleAmenityChange = (amenity) => {
        const newAmenities = details.amenities.includes(amenity)
            ? details.amenities.filter(a => a !== amenity)
            : [...details.amenities, amenity];
        setDetails(prev => ({ ...prev, amenities: newAmenities }));
    };

    const handleSaveDetails = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            // Include rent in the details to be saved
            await updateListingDetails(unitId, { ...details, rent: Number(details.rent) });
            setMessage('Details saved successfully!');
            fetchData();
        } catch (error) {
            setMessage(error.message || 'Failed to save details.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handlePhotoUpload = async () => {
        if (filesToUpload.length === 0) return;
        setIsSaving(true);
        const formData = new FormData();
        for (const file of filesToUpload) {
            formData.append('photos', file);
        }
        try {
            await addListingPhotos(unitId, formData);
            setMessage('Photos uploaded successfully!');
            document.getElementById('photo-upload-input').value = null;
            fetchData();
        } catch (error) {
            setMessage(error.message || 'Failed to upload photos.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeletePhoto = async (photoId) => {
        if(window.confirm('Are you sure?')) {
            try {
                await deleteListingPhoto(unitId, photoId);
                fetchData();
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const handleUseAiDescription = (description) => {
        setDetails(prev => ({ ...prev, description }));
    };

    const fullDescriptionForSyndication = useMemo(() => {
        let fullText = details.description;
        if (details.amenities.length > 0) {
            fullText += '\n\nKey Amenities:\n' + details.amenities.map(a => `• ${a}`).join('\n');
        }
        return fullText;
    }, [details]);

    if (loading) return <LoadingSpinner />;
    if (error) return <p className="text-red-500 text-center p-4">{error}</p>;
    if (!unit) return <p className="text-center p-4">Unit not found.</p>;

    return (
        <>
            <AIWriterModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} onUseDescription={handleUseAiDescription} unit={unit} />
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <Link to={`/management/${unit.property?._id}`} className="text-sm text-brand-blue hover:underline">&larr; Back to Property</Link>
                    <h1 className="text-3xl font-bold text-brand-gray-900">Listing Hub: {unit.name}</h1>
                    <p className="text-lg text-brand-gray-500 mt-1">{unit.property?.address}</p>
                </div>
                
                {/* ✅ ADDED FULL UI HERE */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-brand-gray-800">Listing Details</h3>
                            <button onClick={handleSaveDetails} disabled={isSaving} className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50">
                                {isSaving ? 'Saving...' : 'Save Details'}
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium">Headline</label><input name="headline" value={details.headline} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" placeholder="e.g., Charming 2-Bedroom Apartment!" /></div>
                                <div><label className="block text-sm font-medium">Asking Rent ($)</label><input name="rent" type="number" value={details.rent} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" placeholder="e.g., 2200" /></div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center"><label className="block text-sm font-medium">Description</label><button onClick={() => setIsAiModalOpen(true)} className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-1 rounded-md hover:bg-purple-200">✨ Generate with AI</button></div>
                                <textarea name="description" value={details.description} onChange={handleChange} rows="6" className="mt-1 block w-full border rounded-md p-2" placeholder="Describe the property..."></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Amenities</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{masterAmenityList.map(amenity => (<label key={amenity} className="flex items-center space-x-2"><input type="checkbox" checked={details.amenities.includes(amenity)} onChange={() => handleAmenityChange(amenity)} className="h-4 w-4 text-brand-turquoise rounded" /><span className="text-sm">{amenity}</span></label>))}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Marketing Photos</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(unit.listingDetails?.photos || []).map(photo => (<div key={photo._id} className="relative group"><img src={photo.url} alt="Listing" className="w-full h-32 object-cover rounded-md"/><button onClick={() => handleDeletePhoto(photo._id)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity">&times;</button></div>))}
                        </div>
                        <div className="mt-4 border-t pt-4"><label className="block text-sm font-medium">Upload New Photos</label><input id="photo-upload-input" type="file" multiple onChange={(e) => setFilesToUpload(e.target.files)} className="mt-1 block w-full text-sm" /><button onClick={handlePhotoUpload} disabled={isSaving || filesToUpload.length === 0} className="mt-2 bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50">{isSaving ? 'Uploading...' : 'Upload'}</button></div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center"><h3 className="text-xl font-semibold">Syndication Helper</h3><button onClick={() => setShowSyndication(!showSyndication)} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md">{showSyndication ? 'Hide' : '🚀 Prepare for Listing'}</button></div>
                        {showSyndication && (<div className="mt-4 border-t pt-4 space-y-4"><p className="text-sm text-brand-gray-600">Use the buttons below to copy your formatted listing details, then paste them into the listing sites.</p><div><label className="block text-sm font-medium">Listing Headline</label><div className="flex items-center gap-2"><textarea readOnly value={details.headline} className="mt-1 block w-full border bg-gray-50 rounded-md p-2" rows="1"/><button onClick={() => navigator.clipboard.writeText(details.headline)} className="text-sm p-2 border rounded-md hover:bg-gray-100">Copy</button></div></div><div><label className="block text-sm font-medium">Full Description & Amenities</label><div className="flex items-center gap-2"><textarea readOnly value={fullDescriptionForSyndication} className="mt-1 block w-full border bg-gray-50 rounded-md p-2" rows="10"/><button onClick={() => navigator.clipboard.writeText(fullDescriptionForSyndication)} className="text-sm p-2 border rounded-md hover:bg-gray-100">Copy</button></div></div><div className="flex items-center gap-4 pt-4"><a href="https://www.zillow.com/rental-manager/listing/create" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Post to Zillow</a><a href="https://www.facebook.com/marketplace/create/rental" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Post to Facebook</a><a href="https://www.apartments.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Post to Apartments.com</a></div></div>)}
                    </div>

                    {message && <p className="text-sm text-center p-2 bg-brand-gray-100 rounded-md">{message}</p>}
                </div>
            </div>
        </>
    );
};

export default UnitListingPage;
