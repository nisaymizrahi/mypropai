import React, { useEffect, useState, useCallback } from 'react';
import {
  getUnitDocuments,
  uploadUnitDocument,
  deleteUnitDocument,
  getPropertyDocuments,
  uploadPropertyDocument,
  deletePropertyDocument,
} from '../utils/api';

const DocumentCard = ({ doc, onDelete }) => (
  <li className="flex justify-between items-center text-sm border-b py-1">
    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
      {doc.displayName}
    </a>
    <button onClick={() => onDelete(doc._id)} className="text-red-500 text-xs hover:underline">Delete</button>
  </li>
);

const UploadForm = ({ onUpload, isUploading, setIsUploading }) => {
  const [displayName, setDisplayName] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName || !file) {
      setError('Display name and file are required.');
      return;
    }
    setError('');
    setIsUploading(true);
    const formData = new FormData();
    formData.append('displayName', displayName);
    formData.append('file', file);

    try {
      await onUpload(formData);
      setDisplayName('');
      setFile(null);
      document.getElementById('doc-input')?.value = '';
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" className="w-full border rounded-md p-2" />
      <input id="doc-input" type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full text-sm" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={isUploading} className="w-full bg-brand-turquoise text-white py-2 rounded-md font-semibold disabled:opacity-50">
        {isUploading ? 'Uploading...' : 'Upload Document'}
      </button>
    </form>
  );
};

const UnitDocuments = ({ unit, sharedDocs, onRefresh }) => {
  const [unitDocs, setUnitDocs] = useState([]);

  const fetch = useCallback(async () => {
    try {
      const res = await getUnitDocuments(unit._id);
      setUnitDocs(res);
    } catch (err) {
      console.error('Failed to fetch unit docs', err);
    }
  }, [unit._id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleUpload = (formData) => uploadUnitDocument(unit._id, formData).then(fetch).then(onRefresh);
  const handleDelete = (id) => deleteUnitDocument(id).then(fetch).then(onRefresh);

  const relevantDocs = [
    ...(sharedDocs?.filter((doc) => doc.unit?.toString() === unit._id) || []),
    ...unitDocs
  ];

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 space-y-4">
      <h4 className="text-lg font-bold text-brand-gray-800">{unit.name}</h4>
      <UploadForm onUpload={handleUpload} />
      {relevantDocs.length > 0 ? (
        <ul className="space-y-1">{relevantDocs.map(doc => <DocumentCard key={doc._id} doc={doc} onDelete={handleDelete} />)}</ul>
      ) : (
        <p className="text-sm text-brand-gray-500">No documents uploaded yet.</p>
      )}
    </div>
  );
};

const DocumentsTab = ({ property }) => {
  const [propertyDocs, setPropertyDocs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPropertyDocs = useCallback(async () => {
    try {
      const res = await getPropertyDocuments(property._id);
      setPropertyDocs(res);
    } catch (err) {
      console.error('Failed to fetch property-level docs:', err);
    }
  }, [property._id]);

  useEffect(() => {
    fetchPropertyDocs();
  }, [fetchPropertyDocs]);

  const handleUpload = (formData) => uploadPropertyDocument(property._id, formData).then(fetchPropertyDocs);
  const handleDelete = (docId) => deletePropertyDocument(docId).then(fetchPropertyDocs);

  return (
    <div className="space-y-10">
      <div className="bg-white border rounded-lg p-6 shadow-sm space-y-4">
        <h3 className="text-2xl font-semibold text-brand-gray-800">📁 Property Documents</h3>
        <UploadForm onUpload={handleUpload} isUploading={isUploading} setIsUploading={setIsUploading} />
        {propertyDocs.length > 0 ? (
          <ul className="space-y-1">
            {propertyDocs.filter(doc => !doc.unit).map(doc => (
              <DocumentCard key={doc._id} doc={doc} onDelete={handleDelete} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-brand-gray-500">No property-level documents uploaded yet.</p>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">📂 Unit Folders</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {property.units?.map(unit => (
            <UnitDocuments key={unit._id} unit={unit} sharedDocs={propertyDocs} onRefresh={fetchPropertyDocs} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab;
