import React, { useEffect, useState } from 'react';
import { uploadUnitDocument, getUnitDocuments, deleteUnitDocument } from '../utils/api';

const UnitDocuments = ({ unit }) => {
  const [docs, setDocs] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const fetchDocs = async () => {
    try {
      const data = await getUnitDocuments(unit._id);
      setDocs(data);
    } catch (err) {
      console.error('Failed to fetch docs', err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [unit._id]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !displayName) {
      setError('File and display name are required.');
      return;
    }
    setError('');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('displayName', displayName);
    formData.append('file', file);

    try {
      await uploadUnitDocument(unit._id, formData);
      setDisplayName('');
      setFile(null);
      fetchDocs();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await deleteUnitDocument(docId);
      fetchDocs();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    }
  };

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
      <h4 className="text-lg font-bold text-brand-gray-800">{unit.name}</h4>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input type="text" placeholder="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full border rounded-md p-2" />
        </div>
        <div>
          <input type="file" onChange={handleFileChange} className="w-full text-sm" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={isUploading} className="w-full bg-brand-turquoise text-white py-2 rounded-md font-semibold disabled:opacity-50">
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>

      <div>
        {docs.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {docs.map(doc => (
              <li key={doc._id} className="flex justify-between items-center text-sm border-b pb-1">
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                  {doc.displayName}
                </a>
                <button onClick={() => handleDelete(doc._id)} className="text-red-500 text-xs">Delete</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-brand-gray-500 mt-4">No documents yet.</p>
        )}
      </div>
    </div>
  );
};

const DocumentsTab = ({ property }) => {
  if (!property?.units?.length) return <p className="text-brand-gray-500">No units found.</p>;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-brand-gray-800">Documents by Unit</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {property.units.map(unit => (
          <UnitDocuments key={unit._id} unit={unit} />
        ))}
      </div>
    </div>
  );
};

export default DocumentsTab;
