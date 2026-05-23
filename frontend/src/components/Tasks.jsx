import React from 'react';
import { useNavigate } from 'react-router-dom';

const Tasks = () => {
  const navigate = useNavigate();
  const tasks = [
    { title: 'Update project documentation', ws: 'Product Team', board: 'Development', due: 'Today' },
    { title: 'Buy groceries', ws: 'Personal Tasks', board: 'Daily Routine', due: 'Tomorrow' },
    { title: 'Prepare marketing slides', ws: 'Product Team', board: 'Marketing', due: 'In 2 days' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Your Unified Task List</h1>
            <p className="text-gray-500">All tasks assigned to you across all workspaces.</p>
          </div>
          
          <div className="space-y-4">
            {tasks.map((t, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-500 transition-colors">
                <div className="flex items-center gap-4">
                  <input type="checkbox" className="w-5 h-5 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{t.ws}</span>
                      <span className="text-[10px] font-medium text-gray-400">•</span>
                      <span className="text-[10px] font-medium text-gray-500">{t.board}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-400 group-hover:text-blue-600 transition-colors">{t.due}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
};

export default Tasks;
