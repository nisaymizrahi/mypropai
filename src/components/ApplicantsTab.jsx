import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApplicationsForProperty } from '../utils/api';

const StatusBadge = ({ status }) => {
    const statusColors = {
        'Pending Payment': 'bg-yellow-100 text-yellow-800',
        'Pending Screening': 'bg-blue-100 text-blue-800',
        'Under Review': 'bg-purple-100 text-purple-800',
        'Approved': 'bg-green-100 text-green-800',
        'Denied': 'bg-red-100 text-red-800',
        'Withdrawn': 'bg-gray-100 text-gray-800',
    };
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[status] || 'bg-gray-100'}`}>
            {status}
        </span>
    );
};

const ApplicantsTab = ({ propertyId }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const data = await getApplicationsForProperty(propertyId);
                setApplications(data);
            } catch (error) {
                console.error("Failed to fetch applications:", error);
            } finally {
                setLoading(false);
            }
        };

        if (propertyId) {
            fetchApplications();
        }
    }, [propertyId]);

    if (loading) {
        return <div>Loading applications...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Rental Applications</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left p-3 font-semibold">Applicant</th>
                            <th className="text-left p-3 font-semibold">Unit</th>
                            <th className="text-left p-3 font-semibold">Status</th>
                            <th className="text-left p-3 font-semibold">Date Submitted</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {applications.length > 0 ? applications.map(app => (
                            <tr key={app._id} className="hover:bg-gray-50">
                                <td className="p-3 font-medium">{app.applicantInfo.fullName}</td>
                                <td className="p-3">{app.unit.name}</td>
                                <td className="p-3"><StatusBadge status={app.status} /></td>
                                <td className="p-3">{new Date(app.createdAt).toLocaleDateString()}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => navigate(`/applications/${app._id}`)} className="font-semibold text-brand-turquoise hover:underline">
                                        View Application
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center p-8 text-gray-500">
                                    No applications have been submitted for this property yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ApplicantsTab;