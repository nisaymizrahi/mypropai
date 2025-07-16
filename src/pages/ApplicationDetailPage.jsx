import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApplicationDetails, updateApplicationStatus, initiateScreening } from '../utils/api';
import toast from 'react-hot-toast';

const LoadingSpinner = () => <div className="flex justify-center items-center p-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-turquoise"></div></div>;

const DetailSection = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const InfoPair = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-base text-gray-900">{value || 'N/A'}</p>
    </div>
);

const ApplicationDetailPage = () => {
    const { id } = useParams();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getApplicationDetails(id);
            setApplication(data);
        } catch (err) {
            setError(err.message || "Failed to load application details.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleStatusUpdate = async (status) => {
        setIsActionLoading(true);
        try {
            await updateApplicationStatus(id, { status });
            toast.success(`Application has been ${status.toLowerCase()}.`);
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Failed to update status.');
        } finally {
            setIsActionLoading(false);
        }
    };
    
    const handleRunScreening = async () => {
        setIsActionLoading(true);
        try {
            await initiateScreening(id);
            toast.success('Screening process initiated!');
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Failed to start screening.');
        } finally {
            setIsActionLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <p className="text-red-500 text-center p-4">{error}</p>;
    if (!application) return <p className="text-center p-4">Application not found.</p>;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <Link to={`/management/${application.property._id}`} className="text-sm text-brand-blue hover:underline">&larr; Back to Property</Link>
                <h1 className="text-3xl font-bold text-gray-900">Rental Application</h1>
                <p className="text-lg text-gray-500 mt-1">{application.applicantInfo.fullName} for {application.unit.name}</p>
            </div>

            {/* Action Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                <div>
                    <span className="text-sm font-medium">Status: </span>
                    <span className="font-bold">{application.status}</span>
                </div>
                <div className="flex gap-2">
                    {application.status === 'Pending Screening' && (
                        <button onClick={handleRunScreening} disabled={isActionLoading} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50">
                            {isActionLoading ? 'Starting...' : 'Run Screening'}
                        </button>
                    )}
                    {application.status === 'Under Review' && (
                        <>
                            <button onClick={() => handleStatusUpdate('Approved')} disabled={isActionLoading} className="bg-green-600 text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50">
                                {isActionLoading ? '...' : 'Approve'}
                            </button>
                             <button onClick={() => handleStatusUpdate('Denied')} disabled={isActionLoading} className="bg-red-600 text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50">
                                {isActionLoading ? '...' : 'Deny'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <DetailSection title="Applicant Information">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoPair label="Full Name" value={application.applicantInfo.fullName} />
                            <InfoPair label="Email" value={application.applicantInfo.email} />
                            <InfoPair label="Phone" value={application.applicantInfo.phone} />
                            <InfoPair label="Date of Birth" value={application.applicantInfo.dateOfBirth ? new Date(application.applicantInfo.dateOfBirth).toLocaleDateString() : 'N/A'} />
                        </div>
                    </DetailSection>
                    <DetailSection title="Residence History">
                        {application.residenceHistory.map((item, index) => (
                            <div key={index} className="pb-4 border-b last:border-b-0">
                                <h4 className="font-semibold text-gray-700">Previous Residence #{index+1}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                    <InfoPair label="Address" value={item.address} />
                                    <InfoPair label="Monthly Rent" value={item.rentAmount ? `$${item.rentAmount.toLocaleString()}` : 'N/A'} />
                                    <InfoPair label="Duration" value={item.duration} />
                                </div>
                            </div>
                        ))}
                    </DetailSection>
                     <DetailSection title="Employment History">
                        {application.employmentHistory.map((item, index) => (
                            <div key={index} className="pb-4 border-b last:border-b-0">
                                <h4 className="font-semibold text-gray-700">Employer #{index+1}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                    <InfoPair label="Employer" value={item.employer} />
                                    <InfoPair label="Position" value={item.position} />
                                    <InfoPair label="Gross Monthly Income" value={item.monthlyIncome ? `$${item.monthlyIncome.toLocaleString()}` : 'N/A'} />
                                </div>
                            </div>
                        ))}
                    </DetailSection>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <DetailSection title="Screening Reports">
                        <p className="text-sm text-gray-500">Screening reports from our provider will appear here once the process is complete.</p>
                        {/* Placeholder for when we integrate the real screening reports */}
                        {application.screeningReportId && (
                             <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="font-semibold text-blue-800">Screening In Progress</p>
                                <p className="text-sm text-blue-700">Report ID: {application.screeningReportId}</p>
                             </div>
                        )}
                    </DetailSection>
                </div>
            </div>
        </div>
    );
};

export default ApplicationDetailPage;