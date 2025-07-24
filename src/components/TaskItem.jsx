import React from 'react';
import { format } from 'date-fns';
import { updateTask } from '../utils/api';

const TaskItem = ({ task, onUpdate }) => {
  const statusColor = {
    'Not Started': 'gray',
    'In Progress': 'yellow',
    'Complete': 'green',
    'Blocked': 'red',
    'On Hold': 'orange'
  };

  const handleStatusCycle = async () => {
    const statusFlow = ['Not Started', 'In Progress', 'Complete'];
    const currentIndex = statusFlow.indexOf(task.status);
    const nextStatus = statusFlow[(currentIndex + 1) % statusFlow.length];
    await updateTask(task._id, { status: nextStatus });
    onUpdate();
  };

  return (
    <div className="border rounded-md p-4 shadow-sm space-y-2 bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-lg">{task.title}</h4>
          <p className="text-sm text-gray-500">{task.description || '—'}</p>
        </div>
        <button
          onClick={handleStatusCycle}
          className={`text-xs font-semibold px-3 py-1 rounded-full border`}
          style={{ borderColor: statusColor[task.status], color: statusColor[task.status] }}
        >
          {task.status}
        </button>
      </div>
      <div className="text-sm text-gray-500">
        {format(new Date(task.startDate), 'MMM d')} → {format(new Date(task.endDate), 'MMM d')}
      </div>
    </div>
  );
};

export default TaskItem;
