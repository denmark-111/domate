import React, { useState, useEffect } from 'react';
import AddTaskForm from './AddTaskForm';
import AddListForm from './AddListForm';
import TaskModal from './TaskModal';
import { useWorkspace } from '../context/WorkspaceContext';
import { boardService, listService, taskService } from '../services/index.js';
import { Trash2, Edit3 } from 'lucide-react';

const TaskCard = ({ task, onClick, onDelete }) => {
  const commentCount = Array.isArray(task.comments) ? task.comments.length : 0;
  
  return (
    <div 
      onClick={onClick}
      className="bg-bg-secondary p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('Delete this task?')) onDelete?.(task.id);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
        title="Delete task"
      >
        <Trash2 size={14} />
      </button>
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

const Column = ({ id, title, tasks, onAddTask, isAddingTask, onCancelAddTask, onTaskClick, onSubmitTask, onDeleteList, onDeleteTask, onEditList }) => (
  <div className="w-80 flex-shrink-0 flex flex-col gap-4">
    <div className="flex items-center justify-between px-2 group/list">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">{title}</h3>
        <span className="text-xs font-medium text-text-secondary bg-bg-tertiary px-2 py-1 rounded-full">{tasks.length}</span>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onEditList({ id, title })}
          className="opacity-0 group-hover/list:opacity-100 p-1 text-blue-500 hover:bg-blue-50 rounded transition-all"
          title="Edit list"
        >
          <Edit3 size={14} />
        </button>
        <button 
          onClick={() => { if (confirm('Delete this list?')) onDeleteList(id); }}
          className="opacity-0 group-hover/list:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
          title="Delete list"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
    
    <div className="flex-1 flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onClick={() => onTaskClick(task)}
            onDelete={onDeleteTask}
          />
        ))}
      
      {!isAddingTask ? (
        <button
          onClick={() => onAddTask(id)}
          className="w-full py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded-md border-2 border-dashed border-border transition-colors"
        >
          + Add Task
        </button>
      ) : (
        <AddTaskForm
          columnTitle={title}
          onSubmit={(data) => {
            onSubmitTask(id, data);
            onCancelAddTask();
          }}
          onCancel={onCancelAddTask}
        />
      )}
    </div>
  </div>
);

const Board = () => {
  const { activeBoard, updateTask, deleteTask, moveTask, updateList, deleteList, updateBoard } = useWorkspace();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBoardData = async () => {
      if (activeBoard?.id) {
        setIsLoading(true);
        const res = await boardService.getBoardById(activeBoard.id);
        if (res.success && res.data) {
          // Map backend 'lists' to 'data' state format
          const formattedLists = (res.data.lists || [])
            .sort((a, b) => a.position - b.position)
            .map(list => ({
              id: list.id,
              title: list.name,
              position: list.position,
              tasks: (list.tasks || []).sort((a, b) => a.position - b.position)
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
  const [editingListId, setEditingListId] = useState(null);
  const [listForm, setListForm] = useState({ name: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState(false);
  const [boardForm, setBoardForm] = useState({ name: '', description: '' });
  const [isSavingBoard, setIsSavingBoard] = useState(false);
  const [boardError, setBoardError] = useState('');

  const handleAddTask = (listId) => {
    setAddingTaskIn(listId);
  };

  const handleCancelAddTask = () => {
    setAddingTaskIn(null);
  };

  const handleSubmitTask = async (listId, taskData) => {
    const res = await taskService.createTask(listId, { name: taskData.title, description: '' });
    if (res.success) {
      const newTask = res.data;
      setData(prevData => prevData.map(col => {
        if (col.id === listId) {
          return {
            ...col,
            tasks: [...col.tasks, newTask].sort((a, b) => a.position - b.position)
          };
        }
        return col;
      }));
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskUpdate = async (updatedTask) => {
    const res = await updateTask(updatedTask.id, { name: updatedTask.name || updatedTask.title, description: updatedTask.description || '' });
    if (res.success) {
      const newData = data.map(column => ({
        ...column,
        tasks: column.tasks.map(t => t.id === updatedTask.id ? res.data : t)
      }));
      setData(newData);
      setSelectedTask(res.data);
    }
  };

  const startEditBoard = () => {
    setBoardForm({ name: activeBoard?.name || '', description: activeBoard?.description || '' });
    setEditingBoard(true);
    setBoardError('');
  };

  const handleSaveBoard = async (e) => {
    e.preventDefault();
    if (!boardForm.name.trim()) {
      setBoardError('Board name is required');
      return;
    }
    setIsSavingBoard(true);
    const res = await updateBoard(activeBoard.id, boardForm);
    if (res.success) {
      setEditingBoard(false);
    } else {
      setBoardError(res.error || 'Failed to update board');
    }
    setIsSavingBoard(false);
  };

  const handleAddList = async (listData) => {
    if (!activeBoard?.id) return;
    const res = await listService.createList(activeBoard.id, { name: listData.title });
    if (res.success) {
      const newList = {
        id: res.data.id,
        title: res.data.name,
        position: res.data.position,
        tasks: []
      };
      setData(prevData => [...prevData, newList].sort((a, b) => a.position - b.position));
      setShowAddList(false);
    }
  };

  const startEditList = (list) => {
    setEditingListId(list.id);
    setListForm({ name: list.title });
  };

  const handleSaveList = async (e) => {
    e.preventDefault();
    if (!listForm.name.trim()) return;
    const res = await updateList(editingListId, { name: listForm.name });
    if (res.success) {
      setData(prev => prev.map(col => col.id === editingListId ? { ...col, title: listForm.name } : col));
      setEditingListId(null);
    }
  };

  return (
    <>
      <section className="flex-1 overflow-x-auto bg-bg-secondary">
        <div className="p-8 border-b border-border">
          {!editingBoard ? (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-text mb-1">{activeBoard?.name}</h1>
                {activeBoard?.description && (
                  <p className="text-sm text-text-secondary line-clamp-2">{activeBoard.description}</p>
                )}
              </div>
              <button
                onClick={startEditBoard}
                className="flex items-center gap-2 px-4 py-2 bg-bg hover:bg-bg-tertiary border border-border rounded-lg text-sm font-bold text-text transition-colors shadow-sm"
              >
                Edit Board
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveBoard} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={boardForm.name}
                  onChange={(e) => setBoardForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-2xl font-extrabold text-text bg-bg-tertiary px-3 py-2 rounded border border-input-border outline-none focus:border-input-border-focus"
                  placeholder="Board name"
                  autoFocus
                />
              </div>
              <textarea
                value={boardForm.description}
                onChange={(e) => setBoardForm(prev => ({ ...prev, description: e.target.value }))}
                rows="2"
                className="w-full px-3 py-2 rounded border border-input-border bg-bg-tertiary text-sm text-text outline-none focus:border-input-border-focus resize-none"
                placeholder="Board description"
              />
              {boardError && (
                <div className="p-2 bg-error-bg border border-error-border rounded text-sm text-error-text">
                  {boardError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSavingBoard}
                  className="px-4 py-2 bg-button hover:bg-button-hover text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                >
                  {isSavingBoard ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBoard(false)}
                  className="px-4 py-2 bg-button-secondary text-button-secondary-text hover:bg-button-secondary-hover text-sm font-medium rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="flex gap-6 h-full p-8 pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-full text-text-secondary">
              Loading board...
            </div>
          ) : (
            data.map((col) => (
              <Column
                key={col.id || col.title}
                id={col.id}
                title={editingListId === col.id ? '...' : col.title}
                tasks={col.tasks}
                onAddTask={handleAddTask}
                isAddingTask={addingTaskIn === col.id}
                onCancelAddTask={handleCancelAddTask}
                onTaskClick={handleTaskClick}
                onSubmitTask={handleSubmitTask}
                onDeleteList={async (listId) => {
                  const res = await deleteList(listId);
                  if (res.success) {
                    setData(prev => prev.filter(c => c.id !== listId));
                  }
                }}
                onDeleteTask={async (taskId) => {
                  const res = await deleteTask(taskId);
                  if (res.success) {
                    setData(prevData => prevData.map(col => ({
                      ...col,
                      tasks: col.tasks.filter(t => t.id !== taskId)
                    })));
                  }
                }}
                onEditList={(list) => startEditList(list)}
              />
            ))
          )}
          
      {editingListId ? (
        <div className="w-80 flex-shrink-0">
          <form onSubmit={handleSaveList} className="bg-input-bg p-3 rounded-lg border-2 border-input-border space-y-3">
            <input
              type="text"
              value={listForm.name}
              onChange={(e) => setListForm({ name: e.target.value })}
              className="w-full px-3 py-2 rounded border border-input-border-light bg-bg outline-none focus:border-input-border-focus text-sm font-medium text-text"
              placeholder="List title..."
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-button hover:bg-button-hover text-white text-sm font-medium rounded transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingListId(null)}
                className="flex-1 px-4 py-2 bg-button-secondary text-button-secondary-text hover:bg-button-secondary-hover text-sm font-medium rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : !showAddList ? (
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
