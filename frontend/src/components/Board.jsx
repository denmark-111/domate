import React, { useState } from 'react';
import AddTaskForm from './AddTaskForm';
import AddListForm from './AddListForm';

const TaskCard = ({ task }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
    <div className="flex gap-2 mb-3">
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
        task.label === 'Feature' ? 'bg-blue-100 text-blue-700' : 
        task.label === 'Bug' ? 'bg-red-100 text-red-700' : 
        'bg-green-100 text-green-700'
      }`}>
        {task.label}
      </span>
    </div>
    <p className="text-sm text-gray-800 font-medium mb-4 group-hover:text-blue-600 transition-colors">
      {task.title}
    </p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-400">
        <span className="text-xs">💬 {task.comments}</span>
      </div>
      <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
        {task.assigneeInitials}
      </div>
    </div>
  </div>
);

const Column = ({ title, tasks, onAddTask, isAddingTask, onCancelAddTask }) => (
  <div className="w-80 flex-shrink-0 flex flex-col gap-4">
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">{title}</h3>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{tasks.length}</span>
      </div>
      <button className="text-gray-400 hover:text-gray-600">•••</button>
    </div>
    
    <div className="flex-1 flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
      
      {!isAddingTask ? (
        <button
          onClick={() => onAddTask(title)}
          className="w-full py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-md border-2 border-dashed border-gray-200 transition-colors"
        >
          + Add Task
        </button>
      ) : (
        <AddTaskForm
          columnTitle={title}
          onSubmit={(data) => {
            console.log('Adding task:', data);
            onCancelAddTask();
          }}
          onCancel={onCancelAddTask}
        />
      )}
    </div>
  </div>
);

const Board = () => {
  const [data, setData] = useState([
    {
      title: 'To Do',
      tasks: [
        { id: 1, title: 'Define workspace data model', label: 'Feature', comments: 2, assigneeInitials: 'JD' },
        { id: 2, title: 'Fix sidebar overflow bug', label: 'Bug', comments: 0, assigneeInitials: 'JD' },
      ]
    },
    {
      title: 'In Progress',
      tasks: [
        { id: 3, title: 'Implement Kanban drag and drop', label: 'Feature', comments: 5, assigneeInitials: 'AS' },
      ]
    },
    {
      title: 'Done',
      tasks: [
        { id: 4, title: 'Initial layout implementation', label: 'Feature', comments: 1, assigneeInitials: 'JD' },
      ]
    }
  ]);

  const [addingTaskIn, setAddingTaskIn] = useState(null);
  const [showAddList, setShowAddList] = useState(false);

  const handleAddTask = (columnTitle) => {
    setAddingTaskIn(columnTitle);
  };

  const handleCancelAddTask = () => {
    setAddingTaskIn(null);
  };

  const handleAddList = (listData) => {
    const newList = {
      title: listData.title,
      tasks: []
    };
    setData([...data, newList]);
    setShowAddList(false);
  };

  return (
    <section className="flex-1 overflow-x-auto p-8 bg-gray-50/50">
      <div className="flex gap-6 h-full">
        {data.map((col) => (
          <Column
            key={col.title}
            title={col.title}
            tasks={col.tasks}
            onAddTask={handleAddTask}
            isAddingTask={addingTaskIn === col.title}
            onCancelAddTask={handleCancelAddTask}
          />
        ))}
        
        {!showAddList ? (
          <div className="w-80 flex-shrink-0">
            <button
              onClick={() => setShowAddList(true)}
              className="w-full py-3 bg-gray-100/50 hover:bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 font-medium transition-colors"
            >
              + Add List
            </button>
          </div>
        ) : (
          <AddListForm
            onSubmit={handleAddList}
            onCancel={() => setShowAddList(false)}
          />
        )}
      </div>
    </section>
  );
};

export default Board;
