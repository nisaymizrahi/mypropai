import React, { useState, useEffect } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import AddTaskModal from './AddTaskModal';
import TaskItem from './TaskItem';

const formatTasksForGantt = (tasks) => {
  if (!tasks?.length) return [];
  return tasks.map(task => ({
    start: new Date(task.startDate),
    end: new Date(task.endDate),
    name: task.title,
    id: task._id,
    type: 'task',
    progress: task.status === 'Complete' ? 100 : 0,
    isDisabled: false,
  }));
};

const ScheduleTab = ({ investment, tasks, vendors, onUpdate }) => {
  const [view, setView] = useState(ViewMode.Week);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [ganttTasks, setGanttTasks] = useState([]);

  useEffect(() => {
    setGanttTasks(formatTasksForGantt(tasks));
  }, [tasks]);

  return (
    <>
      <AddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={onUpdate}
        investmentId={investment._id}
        vendors={vendors}
      />

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-brand-gray-800">Schedule and Tasks</h3>
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-2">
              <button className="text-xs px-2 py-1 border rounded-md" onClick={() => setView(ViewMode.Day)}>Day</button>
              <button className="text-xs px-2 py-1 border rounded-md" onClick={() => setView(ViewMode.Week)}>Week</button>
              <button className="text-xs px-2 py-1 border rounded-md" onClick={() => setView(ViewMode.Month)}>Month</button>
            </div>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="bg-brand-turquoise text-white px-4 py-2 rounded-md font-semibold"
            >
              + Add Task
            </button>
          </div>
        </div>

        {ganttTasks.length > 0 ? (
          <div className="gantt-container overflow-x-auto">
            <Gantt
              tasks={ganttTasks}
              viewMode={view}
              listCellWidth="150px"
              columnWidth={view === ViewMode.Month ? 300 : 150}
              barProgressColor="#14B8A6"
              barProgressSelectedColor="#0F766E"
              arrowColor="gray"
            />
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No tasks scheduled yet.</p>
        )}

        {/* Task List */}
        <div>
          <h4 className="text-lg font-semibold mb-2">All Tasks</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map(task => (
              <TaskItem key={task._id} task={task} onUpdate={onUpdate} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ScheduleTab;
