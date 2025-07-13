import React, { useState, useMemo } from 'react';
import { uploadProjectDocument, deleteProjectDocument } from '../utils/api';

const DocumentsTab = ({ investmentId, documents, onUpdate }) => {
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('Contracts');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !displayName) {
      setError('Display Name and a file are required.');
      return;
    }
    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('investmentId', investmentId);
    formData.append('displayName', displayName);
    formData.append('category', category);
    formData.append('document', file);

    try {
      await uploadProjectDocument(formData);
      setDisplayName('');
      setCategory('Contracts');
      setFile(null);
      document.getElementById('doc-upload-input').value = null;
      onUpdate(); // Refresh data on parent
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDelete = async (docId) => {
      if (window.confirm('Are you sure you want to delete this document? This cannot be undone.')) {
          try {
              await deleteProjectDocument(docId);
              onUpdate();
          } catch (err) {
              alert(err.message || 'Failed to delete document.');
          }
      }
  };

  // Group documents by category for display
  const documentsByCategory = useMemo(() => {
    return documents.reduce((acc, doc) => {
      (acc[doc.category] = acc[doc.category] || []).push(doc);
      return acc;
    }, {});
  }, [documents]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Upload Form */}
      <div className="md:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
          <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Upload Document</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray-700">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g., Purchase Agreement" className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray-700">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                <option>Contracts</option>
                <option>Permits</option>
                <option>Invoices</option>
                <option>Photos</option>
                <option>Other</option>
              </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-gray-700">File</label>
                <input id="doc-upload-input" type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm" required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={isUploading} className="w-full bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50">
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </form>
        </div>
      </div>

      {/* Document List */}
      <div className="md:col-span-2">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
            <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Project Documents</h3>
            {Object.keys(documentsByCategory).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(documentsByCategory).map(([cat, docs]) => (
                        <div key={cat}>
                            <h4 className="font-bold text-brand-gray-700 border-b pb-2 mb-2">{cat}</h4>
                            <ul className="space-y-2">
                                {docs.map(doc => (
                                    <li key={doc._id} className="flex justify-between items-center p-2 rounded-md hover:bg-brand-gray-50">
                                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline font-medium">
                                            {doc.displayName}
                                        </a>
                                        <button onClick={() => handleDelete(doc._id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-brand-gray-500 py-8">No documents have been uploaded for this project.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab;