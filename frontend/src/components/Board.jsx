import React, { useState } from 'react';
import AddTaskForm from './AddTaskForm';
import AddListForm from './AddListForm';
import TaskModal from './TaskModal';

const TaskCard = ({ task, onClick }) => {
  const commentCount = Array.isArray(task.comments) ? task.comments.length : 0;
  
  return (
    <div 
      onClick={onClick}
      className="bg-bg-secondary p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex gap-2 mb-3 flex-wrap">
        {task.labels?.map((label) => (
          <span
            key={label.id}
            className="px-2 py-0.5 text-[10px] font-bold rounded uppercase text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
          </span>
        ))}
      </div>
      <p className="text-sm text-text font-medium mb-4 group-hover:text-text-accent transition-colors">
        {task.title}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="text-xs">💬 {commentCount}</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-button border-2 border-bg flex items-center justify-center text-[8px] text-white font-bold">
          {task.assigneeInitials}
        </div>
      </div>
    </div>
  );
};

const Column = ({ title, tasks, onAddTask, isAddingTask, onCancelAddTask, onTaskClick }) => (
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
        <TaskCard 
          key={task.id} 
          task={task} 
          onClick={() => onTaskClick(task)}
        />
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
        { 
          id: 1, 
          title: 'Define workspace data model', 
          labels: [
            { id: 1, name: 'Database', color: 'red' },
            { id: 2, name: 'Backend', color: 'orange' },
          ],
          description: 'Create comprehensive data model for workspace structure including users, permissions, and workspace settings.',
          dueDate: '2026-06-15',
          assigneeInitials: 'JD',
          assignedMembers: [{ id: 1, name: 'John Doe', initials: 'JD' }],
          attachments: [{ id: 1, name: 'workspace-schema.pdf', size: '245 KB' }],
          comments: [
            { id: 1, text: 'Let\'s discuss this in the next sprint planning', author: 'Sarah', time: '2 days ago' }
          ]
        },
        { 
          id: 2, 
          title: 'Fix sidebar overflow bug',  
          labels: [
            { id: 1, name: 'Frontend', color: 'blue' },
          ],
          description: 'The sidebar content overflows when there are many workspace items. Need to implement scrolling.',
          dueDate: '2026-05-31',
          assigneeInitials: 'JD',
          assignedMembers: [{ id: 1, name: 'John Doe', initials: 'JD' }],
          attachments: [],
          comments: []
        },
      ]
    },
    {
      title: 'In Progress',
      tasks: [
        { 
          id: 3, 
          title: 'Implement Kanban drag and drop', 
          labels: [
            { id: 1, name: 'Database', color: 'red' },
            { id: 2, name: 'Backend', color: 'orange' },
            { id: 3, name: 'Frontend', color: 'blue' },
          ],
          description: 'Add drag and drop functionality to move tasks between columns. Support for mobile touch events.',
          dueDate: '2026-06-20',
          assigneeInitials: 'AS',
          assignedMembers: [{ id: 2, name: 'Alex Smith', initials: 'AS' }],
          attachments: [{ id: 2, name: 'dnd-implementation.md', size: '128 KB' }],
          comments: [
            { id: 1, text: 'Consider using react-beautiful-dnd library', author: 'Dev Lead', time: '1 week ago' },
            { id: 2, text: 'Great suggestion! Already researched it', author: 'Alex Smith', time: '5 days ago' }
          ]
        },
      ]
    },
    {
      title: 'Done',
      tasks: [
        { 
          id: 4, 
          title: 'Initial layout implementation', 
          labels: [
            { id: 1, name: 'Frontend', color: 'blue' },
            { id: 2, name: 'Design', color: 'purple' },
          ],
          description: 'Set up the basic layout with Sidebar, Topbar, and main content area.',
          dueDate: '2026-05-20',
          assigneeInitials: 'JD',
          assignedMembers: [{ id: 1, name: 'John Doe', initials: 'JD' }],
          attachments: [],
          comments: [
            { id: 1, text: 'Looks great! Ready for the next phase', author: 'Project Manager', time: '10 days ago' }
          ]
        },
      ]
    }
  ]);

  const [addingTaskIn, setAddingTaskIn] = useState(null);
  const [showAddList, setShowAddList] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddTask = (columnTitle) => {
    setAddingTaskIn(columnTitle);
  };

  const handleCancelAddTask = () => {
    setAddingTaskIn(null);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskUpdate = (updatedTask) => {
    const newData = data.map(column => ({
      ...column,
      tasks: column.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    }));
    setData(newData);
    setSelectedTask(updatedTask);
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
    <>
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
              onTaskClick={handleTaskClick}
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

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleTaskUpdate}
      />
    </>
  );
};

export default Board;
