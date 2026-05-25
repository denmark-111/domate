import React, { useState } from 'react';
import AddTaskForm from './AddTaskForm';
import AddListForm from './AddListForm';

const TaskCard = ({ task }) => (
  <div className="bg-[var(--color-bg-card)] p-4 rounded-lg border border-[var(--color-border-primary)] shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
    <div className="flex gap-2 mb-3">
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
        task.label === 'Feature' ? 'bg-[var(--color-bg-blue-100)] text-[var(--color-text-blue-700)]' : 
        task.label === 'Bug' ? 'bg-[var(--color-bg-red-50)] text-[var(--color-text-red-700)]' : 
        'bg-[var(--color-bg-green-100)] text-[var(--color-text-green-700)]'
      }`}>
        {task.label}
      </span>
    </div>
    <p className="text-sm text-[var(--color-text-primary)] font-medium mb-4 group-hover:text-[var(--color-text-blue-600)] transition-colors">
      {task.title}
    </p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
        <span className="text-xs">💬 {task.comments}</span>
      </div>
      <div className="w-6 h-6 rounded-full bg-[var(--color-bg-blue-button)] border-2 border-[var(--color-bg-primary)] flex items-center justify-center text-[8px] text-white font-bold">
        {task.assigneeInitials}
      </div>
    </div>
  </div>
);

const Column = ({ title, tasks, onAddTask, isAddingTask, onCancelAddTask }) => (
  <div className="w-80 flex-shrink-0 flex flex-col gap-4">
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">{title}</h3>
        <span className="text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] px-2 py-1 rounded-full">{tasks.length}</span>
      </div>
      <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-tertiary)]">•••</button>
    </div>
    
    <div className="flex-1 flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
      
      {!isAddingTask ? (
        <button
          onClick={() => onAddTask(title)}
          className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] rounded-md border-2 border-dashed border-[var(--color-border-primary)] transition-colors"
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
    <section className="flex-1 overflow-x-auto p-8 bg-[var(--color-bg-secondary)]">
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
              className="w-full py-3 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg border-2 border-dashed border-[var(--color-border-gray-300)] text-[var(--color-text-secondary)] font-medium transition-colors"
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
