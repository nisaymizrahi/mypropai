import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../utils/api';
import toast from 'react-hot-toast';

const SendApplicationPage = () => {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    const fetchUnits = async () => {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://mypropai-server.onrender.com';
      try {
        const res = await fetch(`${baseURL}/api/management/units/vacant`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Response not OK');
        const data = await res.json();
        setUnits(data);
      } catch (err) {
        setApiError(true);
        toast.error('Failed to load vacant units. You can still send a general application.');
      }
    };
    fetchUnits();
  }, []);

  const generateLink = () => {
    const base = window.location.origin;
    if (selectedUnit === 'none' || apiError) {
      setGeneratedLink(`${base}/apply?noUnit=true`);
    } else if (selectedUnit) {
      setGeneratedLink(`${base}/apply/${selectedUnit}`);
    } else {
      toast.error('Please select a unit or "None"');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Send Rental Application</h1>

      <div>
        <label className="block text-sm font-medium text-gray-700">Select a vacant unit</label>
        <select
          className="mt-1 block w-full border rounded p-2"
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
        >
          <option value="">-- Choose a unit --</option>
          {units.map(unit => (
            <option key={unit._id} value={unit._id}>
              {unit.property.address} - {unit.name}
            </option>
          ))}
          <option value="none">Send application without selecting a unit</option>
        </select>
      </div>

      <button
        onClick={generateLink}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
      >
        Generate Application Link
      </button>

      {generatedLink && (
        <div className="space-y-2">
          <input
            type="text"
            value={generatedLink}
            readOnly
            className="w-full border p-2 rounded bg-gray-50"
          />
          <button
            onClick={copyToClipboard}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
          >
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
};

export default SendApplicationPage;
