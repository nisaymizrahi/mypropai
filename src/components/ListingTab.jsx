import React, { useState, useEffect, useMemo } from 'react';
import { updateListingDetails, addListingPhotos, deleteListingPhoto } from '../utils/api';
import AIWriterModal from './AIWriterModal';

const masterAmenityList = [
    'In-unit Laundry', 'Parking Available', 'Pets Allowed', 'Dishwasher',
    'Air Conditioning', 'Balcony/Patio', 'Hardwood Floors', 'Elevator',
    'Fitness Center', 'Swimming Pool', 'Storage Unit', 'Furnished'
];

const ListingTab = ({ property, onUpdate }) => {
    const [details, setDetails] = useState({ headline: '', description: '', amenities: [] });
    const [photos, setPhotos] = useState([]);
    const [filesToUpload, setFilesToUpload] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    // 1. ADD STATE FOR SYNDICATION HELPER
    const [showSyndication, setShowSyndication] = useState(false);

    useEffect(() => {
        if (property?.listingDetails) {
            setDetails({
                headline: property.listingDetails.headline || '',
                description: property.listingDetails.description || '',
                amenities: property.listingDetails.amenities || []
            });
            setPhotos(property.listingDetails.photos || []);
        }
    }, [property]);

    const handleChange = (e) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };
    
    const handleAmenityChange = (amenity) => {
        const currentAmenities = details.amenities;
        const newAmenities = currentAmenities.includes(amenity)
            ? currentAmenities.filter(a => a !== amenity)
            : [...currentAmenities, amenity];
        
        setDetails(prev => ({ ...prev, amenities: newAmenities }));
    };

    const handleSaveDetails = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            await updateListingDetails(property._id, details);
            setMessage('Details saved successfully!');
        } catch (error) {
            setMessage(error.message || 'Failed to save details.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async () => {
        if (filesToUpload.length === 0) return;
        setIsSaving(true);
        setMessage('');
        const formData = new FormData();
        for (let i = 0; i < filesToUpload.length; i++) {
            formData.append('photos', filesToUpload[i]);
        }
        try {
            await addListingPhotos(property._id, formData);
            setMessage('Photos uploaded successfully!');
            setFilesToUpload([]);
            document.getElementById('photo-upload-input').value = null;
            onUpdate();
        } catch (error) {
            setMessage(error.message || 'Failed to upload photos.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeletePhoto = async (photoId) => {
        if(window.confirm('Are you sure you want to delete this photo?')) {
            try {
                await deleteListingPhoto(property._id, photoId);
                onUpdate();
            } catch (error) {
                alert(error.message || 'Failed to delete photo.');
            }
        }
    };

    const handleUseAiDescription = (description) => {
        setDetails(prev => ({ ...prev, description }));
    };

    // 2. PREPARE THE FULL DESCRIPTION FOR SYNDICATION
    const fullDescriptionForSyndication = useMemo(() => {
        let fullText = details.description;
        if (details.amenities.length > 0) {
            fullText += '\n\nAmenities:\n' + details.amenities.map(a => `- ${a}`).join('\n');
        }
        return fullText;
    }, [details]);

    return (
        <>
            <AIWriterModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} onUseDescription={handleUseAiDescription} property={property} />

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-brand-gray-800">Listing Details</h3>
                        <button onClick={handleSaveDetails} disabled={isSaving} className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Details'}
                        </button>
                    </div>
                    {/* ... (forms remain the same) ... */}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Marketing Photos</h3>
                    {/* ... (photo gallery remains the same) ... */}
                </div>
                
                {/* 3. NEW SYNDICATION HELPER SECTION */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-brand-gray-800">Syndication Helper</h3>
                        <button onClick={() => setShowSyndication(!showSyndication)} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md">
                           {showSyndication ? 'Hide Helper' : '🚀 Prepare for Listing'}
                        </button>
                    </div>
                    {showSyndication && (
                        <div className="mt-4 border-t pt-4 space-y-4">
                            <p className="text-sm text-brand-gray-600">Use the buttons below to copy your formatted listing details, then paste them into the listing sites.</p>
                            <div>
                                <label className="block text-sm font-medium">Listing Headline</label>
                                <div className="flex items-center gap-2">
                                    <textarea readOnly value={details.headline} className="mt-1 block w-full border bg-gray-50 rounded-md p-2" rows="1"/>
                                    <button onClick={() => navigator.clipboard.writeText(details.headline)} className="text-sm p-2 border rounded-md hover:bg-gray-100">Copy</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Full Description & Amenities</label>
                                 <div className="flex items-center gap-2">
                                    <textarea readOnly value={fullDescriptionForSyndication} className="mt-1 block w-full border bg-gray-50 rounded-md p-2" rows="10"/>
                                    <button onClick={() => navigator.clipboard.writeText(fullDescriptionForSyndication)} className="text-sm p-2 border rounded-md hover:bg-gray-100">Copy</button>
                                </div>
                            </div>
                             <div className="flex items-center gap-4 pt-4">
                                <a href="https://www.zillow.com/rental-manager/listing/create" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Post to Zillow</a>
                                <a href="https://www.facebook.com/marketplace/create/rental" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Post to Facebook</a>
                                <a href="https://www.apartments.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Post to Apartments.com</a>
                            </div>
                        </div>
                    )}
                </div>

                {message && <p className="text-sm text-center p-2 bg-brand-gray-100 rounded-md">{message}</p>}
            </div>
        </>
    );
};

export default ListingTab;