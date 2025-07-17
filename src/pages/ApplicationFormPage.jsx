import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { submitApplication } from '../utils/api';

const ApplicationFormPage = () => {
  const { unitId } = useParams();
  const [searchParams] = useSearchParams();
  const isNoUnit = searchParams.get("noUnit") === "true";

  const [unitInfo, setUnitInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    applicantInfo: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
    },
    residenceHistory: [{ address: '', rentAmount: '', duration: '' }],
    employmentHistory: [{ employer: '', position: '', monthlyIncome: '' }],
    agree: false,
  });

  useEffect(() => {
    const fetchUnitInfo = async () => {
      if (!unitId || isNoUnit) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/applications/public/${unitId}`);
        const data = await res.json();
        setUnitInfo(data);
      } catch {
        toast.error("Could not load unit info");
      } finally {
        setLoading(false);
      }
    };
    fetchUnitInfo();
  }, [unitId, isNoUnit]);

  const handleChange = (section, index, key, value) => {
    const updated = [...formData[section]];
    updated[index][key] = value;
    setFormData(prev => ({ ...prev, [section]: updated }));
  };

  const handleApplicantChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      applicantInfo: { ...prev.applicantInfo, [key]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agree) return toast.error("You must agree to the terms");

    try {
      const payload = {
        unitId: isNoUnit ? null : unitId,
        ...formData
      };
      await submitApplication(payload);
      window.location.href = "/apply/success";

    } catch (err) {
      toast.error(err.message || "Failed to submit application");
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <h1 className="text-2xl font-bold">
        {isNoUnit ? "Rental Application" : `Apply to ${unitInfo?.unitName}`}
      </h1>
      {unitInfo && (
        <>
          <p className="text-gray-600">{unitInfo.address}</p>
          <p className="text-sm text-gray-500">Application Fee: ${unitInfo.applicationFee}</p>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="space-y-2">
          <h2 className="font-semibold">Applicant Info</h2>
          {['fullName', 'email', 'phone', 'dateOfBirth'].map(field => (
            <input
              key={field}
              type={field === 'dateOfBirth' ? 'date' : 'text'}
              placeholder={field.replace(/([A-Z])/g, ' $1')}
              value={formData.applicantInfo[field]}
              onChange={e => handleApplicantChange(field, e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          ))}
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold">Residence History</h2>
          {formData.residenceHistory.map((item, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {['address', 'rentAmount', 'duration'].map(key => (
                <input
                  key={key}
                  type={key === 'rentAmount' ? 'number' : 'text'}
                  placeholder={key}
                  value={item[key]}
                  onChange={e => handleChange('residenceHistory', i, key, e.target.value)}
                  className="border p-2 rounded"
                  required
                />
              ))}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold">Employment History</h2>
          {formData.employmentHistory.map((item, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {['employer', 'position', 'monthlyIncome'].map(key => (
                <input
                  key={key}
                  type={key === 'monthlyIncome' ? 'number' : 'text'}
                  placeholder={key}
                  value={item[key]}
                  onChange={e => handleChange('employmentHistory', i, key, e.target.value)}
                  className="border p-2 rounded"
                  required
                />
              ))}
            </div>
          ))}
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.agree}
            onChange={(e) => setFormData(prev => ({ ...prev, agree: e.target.checked }))}
          />
          I certify the above info is accurate and agree to future screening.
        </label>

        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
          Submit Application
        </button>
      </form>
    </div>
  );
};

export default ApplicationFormPage;
