import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApplicationsForProperty } from '../utils/api';
import toast from 'react-hot-toast';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasProperty, setHasProperty] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const propertyId = localStorage.getItem("activePropertyId");
    if (!propertyId) {
      setHasProperty(false);
      return;
    }

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const res = await getApplicationsForProperty(propertyId);
        setApplications(res);
        setHasProperty(true);
      } catch (err) {
        toast.error(err.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <button
          onClick={() => navigate('/applications/send')}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Send Application
        </button>
      </div>

      {!hasProperty ? (
        <p className="text-gray-600">No property selected. Please choose or activate a property to view applications.</p>
      ) : loading ? (
        <p className="p-4">Loading applications...</p>
      ) : applications.length === 0 ? (
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
