import React, { useState, useEffect } from 'react';
import AddTaskForm from './AddTaskForm';
import AddListForm from './AddListForm';
import TaskModal from './TaskModal';
import { useWorkspace } from '../context/WorkspaceContext';
import { boardService } from '../lib/boardService';

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
        {task.name || task.title}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="text-xs">💬 {commentCount}</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-button border-2 border-bg flex items-center justify-center text-[8px] text-white font-bold">
          {task.assigneeInitials || '?'}
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
  const { activeBoard } = useWorkspace();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBoardData = async () => {
      if (activeBoard?.id) {
        setIsLoading(true);
        const res = await boardService.getBoardById(activeBoard.id);
        if (res.success && res.data) {
          // Map backend 'lists' to 'data' state format
          const formattedLists = (res.data.lists || []).map(list => ({
            id: list.id,
            title: list.name,
            tasks: list.tasks || []
          }));
          setData(formattedLists);
        } else {
          setData([]);
        }
        setIsLoading(false);
      }
    };
    fetchBoardData();
  }, [activeBoard]);

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
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-full text-text-secondary">
              Loading board...
            </div>
          ) : (
            data.map((col) => (
              <Column
                key={col.id || col.title}
                title={col.title}
                tasks={col.tasks}
                onAddTask={handleAddTask}
                isAddingTask={addingTaskIn === col.title}
                onCancelAddTask={handleCancelAddTask}
                onTaskClick={handleTaskClick}
              />
            ))
          )}
          
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
