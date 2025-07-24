import React, { useState } from 'react';
import { createProjectTask } from '../utils/api';

const AddTaskModal = ({ isOpen, onClose, onSuccess, investmentId, vendors = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    assignee: '',
    type: 'vendor',
    phase: '',
    reminderOn: '',
  });
  const [subtasks, setSubtasks] = useState([{ title: '', done: false }]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubtaskChange = (index, value) => {
    const updated = [...subtasks];
    updated[index].title = value;
    setSubtasks(updated);
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, { title: '', done: false }]);
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      assignee: '',
      type: 'vendor',
      phase: '',
      reminderOn: '',
    });
    setSubtasks([{ title: '', done: false }]);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { title, startDate, endDate } = formData;

    if (!title || !startDate || !endDate) {
      setError('Title, Start Date, and End Date are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createProjectTask({
        ...formData,
        investment: investmentId,
        subtasks: subtasks.filter(s => s.title.trim() !== ''),
      });
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl space-y-4">
        <h2 className="text-xl font-bold text-brand-gray-800">Add New Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-brand-gray-700">Task Title</label>
            <input name="title" type="text" value={formData.title} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-brand-gray-700">Description</label>
            <textarea name="description" rows={2} value={formData.description} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray-700">Start Date</label>
              <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray-700">End Date</label>
              <input name="endDate" type="date" value={formData.endDate} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-sm font-medium text-brand-gray-700">Reminder Date (Optional)</label>
            <input name="reminderOn" type="date" value={formData.reminderOn} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
          </div>

          {/* Type + Phase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray-700">Task Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
                <option value="vendor">Vendor</option>
                <option value="owner">Owner/Internal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray-700">Phase</label>
              <input name="phase" type="text" placeholder="e.g., Framing, Electrical" value={formData.phase} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-brand-gray-700">Assign To (Optional)</label>
            <select name="assignee" value={formData.assignee} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
              <option value="">Select a Vendor</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.name} ({v.trade})</option>)}
            </select>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium text-brand-gray-700">Subtasks (Optional)</label>
            {subtasks.map((sub, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={`Subtask ${idx + 1}`}
                value={sub.title}
                onChange={(e) => handleSubtaskChange(idx, e.target.value)}
                className="mt-1 block w-full border rounded-md p-2 mb-2"
              />
            ))}
            <button type="button" onClick={addSubtask} className="text-sm text-brand-turquoise hover:underline mt-1">
              + Add Subtask
            </button>
          </div>

          {/* Submit */}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={handleClose} disabled={isSubmitting} className="bg-white hover:bg-gray-100 text-gray-700 font-semibold px-4 py-2 rounded-md border border-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md">
              {isSubmitting ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
