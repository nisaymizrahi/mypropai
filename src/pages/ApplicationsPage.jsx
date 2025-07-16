import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApplicationsForProperty } from '../utils/api';
import toast from 'react-hot-toast';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const propertyId = localStorage.getItem("activePropertyId"); // update if needed
        if (!propertyId) throw new Error("Missing property ID");
        const res = await getApplicationsForProperty(propertyId);
        setApplications(res);
      } catch (err) {
        toast.error(err.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) return <p className="p-4">Loading applications...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
      {applications.length === 0 ? (
        <p className="text-gray-600">No applications found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map(app => (
            <Link
              key={app._id}
              to={`/applications/${app._id}`}
              className="border rounded-lg p-4 hover:shadow transition"
            >
              <h2 className="font-semibold">{app.applicantInfo.fullName}</h2>
              <p className="text-sm text-gray-500">Unit: {app.unit.name}</p>
              <p className="text-sm text-gray-500">Status: {app.status}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
