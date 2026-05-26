import React, { useState } from 'react';
import AddTaskForm from './AddTaskForm';
import AddListForm from './AddListForm';

const TaskCard = ({ task }) => (
  <div className="bg-bg-secondary p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
    <div className="flex gap-2 mb-3">
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
        task.label === 'Feature' ? 'bg-label-feature-bg text-label-feature-text' : 
        task.label === 'Bug' ? 'bg-label-bug-bg text-label-bug-text' : 
        'bg-label-done-bg text-label-done-text'
      }`}>
        {task.label}
      </span>
    </div>
    <p className="text-sm text-text font-medium mb-4 group-hover:text-text-accent transition-colors">
      {task.title}
    </p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-text-secondary">
        <span className="text-xs">💬 {task.comments}</span>
      </div>
      <div className="w-6 h-6 rounded-full bg-button border-2 border-bg flex items-center justify-center text-[8px] text-white font-bold">
        {task.assigneeInitials}
      </div>
    </div>
  </div>
);

const Column = ({ title, tasks, onAddTask, isAddingTask, onCancelAddTask }) => (
  <div className="w-80 flex-shrink-0 flex flex-col gap-4">
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">{title}</h3>
        <span className="text-xs font-medium text-text-secondary bg-bg-tertiary px-2 py-1 rounded-full">{tasks.length}</span>
      </div>
      <button className="text-text-secondary hover:text-text-tertiary">•••</button>
    </div>
    
    <div className="flex-1 flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
      
      {!isAddingTask ? (
        <button
          onClick={() => onAddTask(title)}
          className="w-full py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded-md border-2 border-dashed border-border transition-colors"
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
    <section className="flex-1 overflow-x-auto p-8 bg-bg-secondary">
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
              className="w-full py-3 bg-bg-tertiary hover:bg-bg-tertiary rounded-lg border-2 border-dashed border-border text-text-secondary font-medium transition-colors"
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
