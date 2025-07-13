import React, { useState, useEffect } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import AddTaskModal from './AddTaskModal'; // 1. IMPORT THE NEW MODAL

// A helper function to format your task data for the Gantt chart component
const formatTasksForGantt = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return [];
  }
  return tasks.map(task => ({
    start: new Date(task.startDate),
    end: new Date(task.endDate),
    name: task.title,
    id: task._id,
    type: 'task',
    progress: 50, // Placeholder
    isDisabled: false,
  }));
};

// 2. ACCEPT NEW PROPS: investment, vendors, onUpdate
const ScheduleTab = ({ investment, tasks, vendors, onUpdate }) => {
  const [view, setView] = useState(ViewMode.Week);
  const [ganttTasks, setGanttTasks] = useState([]);
  // 3. ADD STATE TO MANAGE THE MODAL
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    setGanttTasks(formatTasksForGantt(tasks));
  }, [tasks]);

  let columnWidth = 65;
  if (view === ViewMode.Year) {
    columnWidth = 350;
  } else if (view === ViewMode.Month) {
    columnWidth = 300;
  } else if (view === ViewMode.Week) {
    columnWidth = 250;
  }

  return (
    <>
        {/* 4. RENDER THE MODAL */}
        <AddTaskModal 
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            onSuccess={onUpdate}
            investmentId={investment._id}
            vendors={vendors}
        />

        <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-brand-gray-800">Project Schedule</h3>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <button className="text-sm px-3 py-1 border rounded-md" onClick={() => setView(ViewMode.Day)}>Day</button>
                        <button className="text-sm px-3 py-1 border rounded-md" onClick={() => setView(ViewMode.Week)}>Week</button>
                        <button className="text-sm px-3 py-1 border rounded-md" onClick={() => setView(ViewMode.Month)}>Month</button>
                    </div>
                    {/* 5. WIRE UP THE BUTTON */}
                    <button 
                        onClick={() => setIsTaskModalOpen(true)}
                        className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition"
                    >
                        Add New Task
                    </button>
                </div>
            </div>
            
            {ganttTasks.length > 0 ? (
                <div className="gantt-container">
                    <Gantt
                        tasks={ganttTasks}
                        viewMode={view}
                        listCellWidth={"155px"}
                        columnWidth={columnWidth}
                        barFill={60}
                        barProgressColor="#14B8A6"
                        barProgressSelectedColor="#0F766E"
                        arrowColor="gray"
                    />
                </div>
            ) : (
                <p className="text-center text-brand-gray-500 py-8">No schedule tasks have been added yet.</p>
            )}
        </div>
    </>
  );
};

export default ScheduleTab;