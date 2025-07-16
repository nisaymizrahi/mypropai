import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicApplicationDetails, submitApplication, createApplicationPaymentIntent } from '../utils/api';
import toast from 'react-hot-toast';

const LoadingSpinner = () => <div className="flex justify-center items-center p-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-turquoise"></div></div>;

const ApplicationFormPage = () => {
    const { unitId } = useParams();
    const [unitInfo, setUnitInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);

    const [applicantInfo, setApplicantInfo] = useState({ fullName: '', email: '', phone: '' });
    const [residenceHistory, setResidenceHistory] = useState([{ address: '', rentAmount: '', duration: '', reasonForLeaving: '' }]);
    const [employmentHistory, setEmploymentHistory] = useState([{ employer: '', position: '', monthlyIncome: '', duration: '' }]);

    useEffect(() => {
        const fetchUnitInfo = async () => {
            try {
                const data = await getPublicApplicationDetails(unitId);
                setUnitInfo(data);
            } catch (err) {
                setError('Could not load application details. The link may be invalid.');
            } finally {
                setLoading(false);
            }
        };
        fetchUnitInfo();
    }, [unitId]);
    
    // Handlers for dynamic form sections
    const handleHistoryChange = (index, event, type) => {
        const list = type === 'residence' ? [...residenceHistory] : [...employmentHistory];
        list[index][event.target.name] = event.target.value;
        type === 'residence' ? setResidenceHistory(list) : setEmploymentHistory(list);
    };

    const addHistoryItem = (type) => {
        const newItem = type === 'residence' ? { address: '', rentAmount: '', duration: '', reasonForLeaving: '' } : { employer: '', position: '', monthlyIncome: '', duration: '' };
        type === 'residence' ? setResidenceHistory([...residenceHistory, newItem]) : setEmploymentHistory([...employmentHistory, newItem]);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        toast.loading('Submitting application...');
        
        const applicationData = {
            unitId,
            applicantInfo,
            residenceHistory,
            employmentHistory
        };

        try {
            const newApplication = await submitApplication(applicationData);
            
            // Step 2: Simulate creating the payment intent
            await createApplicationPaymentIntent(newApplication._id);
            
            toast.dismiss();
            toast.success('Application submitted successfully!');
            setSubmissionSuccess(true);
        } catch (err) {
            toast.dismiss();
            toast.error(err.message || "Failed to submit application.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-center p-8 text-red-600">{error}</div>;

    if (submissionSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-xl mx-auto text-center bg-white p-10 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold text-brand-turquoise mb-4">Thank You!</h1>
                    <p className="text-gray-600">Your application has been submitted successfully. The property manager will review your information and be in touch shortly regarding the next steps for payment and screening.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-center text-gray-900">Rental Application</h1>
                <p className="text-center text-gray-600 mt-2">For: {unitInfo?.address} - {unitInfo?.unitName}</p>
                
                <form onSubmit={handleSubmit} className="mt-8 bg-white p-8 rounded-lg shadow-md space-y-8">
                    {/* Applicant Info */}
                    <section>
                        <h2 className="text-xl font-semibold border-b pb-2 mb-4">Personal Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">Full Name</label><input type="text" value={applicantInfo.fullName} onChange={(e) => setApplicantInfo({...applicantInfo, fullName: e.target.value})} required className="mt-1 p-2 w-full border rounded-md"/></div>
                            <div><label className="block text-sm font-medium">Email Address</label><input type="email" value={applicantInfo.email} onChange={(e) => setApplicantInfo({...applicantInfo, email: e.target.value})} required className="mt-1 p-2 w-full border rounded-md"/></div>
                            <div><label className="block text-sm font-medium">Phone Number</label><input type="tel" value={applicantInfo.phone} onChange={(e) => setApplicantInfo({...applicantInfo, phone: e.target.value})} required className="mt-1 p-2 w-full border rounded-md"/></div>
                        </div>
                    </section>

                    {/* Residence History */}
                    <section>
                        <h2 className="text-xl font-semibold border-b pb-2 mb-4">Residence History</h2>
                        {residenceHistory.map((residence, index) => (
                             <div key={index} className="space-y-2 border-b last:border-b-0 pb-4 mb-4">
                                <h3 className="font-semibold text-sm">Previous Residence #{index + 1}</h3>
                                <input name="address" value={residence.address} onChange={(e) => handleHistoryChange(index, e, 'residence')} placeholder="Address" className="p-2 w-full border rounded-md" />
                                <input name="rentAmount" type="number" value={residence.rentAmount} onChange={(e) => handleHistoryChange(index, e, 'residence')} placeholder="Monthly Rent" className="p-2 w-full border rounded-md" />
                                <input name="duration" value={residence.duration} onChange={(e) => handleHistoryChange(index, e, 'residence')} placeholder="Duration (e.g., 2 years)" className="p-2 w-full border rounded-md" />
                             </div>
                        ))}
                    </section>

                    {/* Employment History */}
                    <section>
                        <h2 className="text-xl font-semibold border-b pb-2 mb-4">Employment History</h2>
                        {employmentHistory.map((job, index) => (
                            <div key={index} className="space-y-2 border-b last:border-b-0 pb-4 mb-4">
                               <h3 className="font-semibold text-sm">Employer #{index + 1}</h3>
                               <input name="employer" value={job.employer} onChange={(e) => handleHistoryChange(index, e, 'employment')} placeholder="Employer" className="p-2 w-full border rounded-md" />
                               <input name="position" value={job.position} onChange={(e) => handleHistoryChange(index, e, 'employment')} placeholder="Position" className="p-2 w-full border rounded-md" />
                               <input name="monthlyIncome" type="number" value={job.monthlyIncome} onChange={(e) => handleHistoryChange(index, e, 'employment')} placeholder="Gross Monthly Income" className="p-2 w-full border rounded-md" />
                            </div>
                        ))}
                    </section>
                    
                    <div className="pt-6 border-t">
                         <p className="text-xs text-gray-500 mb-4">By submitting this application, you authorize the property manager to conduct a background and credit check. An application fee of ${unitInfo?.applicationFee || '0'} will be required after submission.</p>
                         <button type="submit" disabled={isSubmitting} className="w-full bg-brand-turquoise text-white font-bold py-3 px-4 rounded-md disabled:opacity-50">
                             {isSubmitting ? 'Submitting...' : 'Submit Application'}
                         </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplicationFormPage;
