import React, { useState } from 'react';
import { deleteVendor } from '../utils/api';
import AddVendorModal from './AddVendorModal';
import EditVendorModal from './EditVendorModal';

const TeamTab = ({ vendors, onUpdate }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const handleOpenEditModal = (vendor) => {
    setEditingVendor(vendor);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (vendorId) => {
    if (window.confirm('Are you sure you want to delete this vendor? This will not delete their associated expenses, only unlink them.')) {
      try {
        await deleteVendor(vendorId);
        onUpdate();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <>
      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={onUpdate}
      />
      <EditVendorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={onUpdate}
        vendor={editingVendor}
      />

      <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-brand-gray-800">Project Team & Vendors</h3>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md">
            Add Vendor
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-brand-gray-50">
              <tr>
                <th className="text-left p-3 font-semibold">Name</th>
                <th className="text-left p-3 font-semibold">Trade</th>
                <th className="text-left p-3 font-semibold">Contact</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vendors.length > 0 ? vendors.map(vendor => (
                <tr key={vendor._id} className="hover:bg-brand-gray-50">
                  <td className="p-3 font-medium">{vendor.name}</td>
                  <td className="p-3 text-brand-gray-600">{vendor.trade}</td>
                  <td className="p-3 text-brand-gray-600">
                    <div>{vendor.contactInfo?.email}</div>
                    <div>{vendor.contactInfo?.phone}</div>
                  </td>
                  <td className="p-3 text-right space-x-4">
                    <button onClick={() => handleOpenEditModal(vendor)} className="text-blue-600 hover:underline font-semibold">Edit</button>
                    <button onClick={() => handleDelete(vendor._id)} className="text-red-500 hover:underline font-semibold">Delete</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-brand-gray-500">No vendors have been added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TeamTab;