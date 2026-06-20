import React, { useState, useEffect } from 'react';
import AddListForm from './AddListForm';
import TaskModal from './TaskModal';
import ListColumn from './ListColumn';
import { useWorkspace } from '../../context/WorkspaceContext';
import { boardService, listService, taskService } from '../../services/index.js';
import { Info } from 'lucide-react';

const Board = () => {
  const { activeBoard, setActiveBoard, updateTask, deleteTask, moveTask, updateList, deleteList, updateBoard } = useWorkspace();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBoardData = async () => {
      if (activeBoard?.id) {
        setIsLoading(true);
        const res = await boardService.getBoardById(activeBoard.id);
        if (res.success && res.data) {
          const formattedLists = (res.data.lists || [])
            .sort((a, b) => a.position - b.position)
            .map((list) => ({
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
  }, [activeBoard?.id]);

  const [addingTaskIn, setAddingTaskIn] = useState(null);
  const [showAddList, setShowAddList] = useState(false);
  const [editingListId, setEditingListId] = useState(null);
  const [listForm, setListForm] = useState({ name: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isBoardDetailOpen, setIsBoardDetailOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState(false);
  const [boardForm, setBoardForm] = useState({ name: '', description: '' });
  const [isSavingBoard, setIsSavingBoard] = useState(false);
  const [boardError, setBoardError] = useState('');

  useEffect(() => {
    setEditingBoard(false);
    setEditingListId(null);
    setBoardError('');
    setIsBoardDetailOpen(false);
  }, [activeBoard?.id]);

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
      setData((prevData) =>
        prevData.map((col) => {
          if (col.id === listId) {
            return {
              ...col,
              tasks: [...col.tasks, newTask].sort((a, b) => a.position - b.position)
            };
          }
          return col;
        })
      );
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskUpdate = async (updatedTask) => {
    const res = await updateTask(updatedTask.id, { name: updatedTask.name || updatedTask.title, description: updatedTask.description || '' });
    if (res.success) {
      const newData = data.map((column) => ({
        ...column,
        tasks: column.tasks.map((t) => (t.id === updatedTask.id ? res.data : t))
      }));
      setData(newData);
      setSelectedTask(res.data);
    }
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
      setData((prevData) => [...prevData, newList].sort((a, b) => a.position - b.position));
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
      setData((prev) => prev.map((col) => (col.id === editingListId ? { ...col, title: listForm.name } : col)));
      setEditingListId(null);
    }
  };

  const openBoardDetail = () => {
    setBoardForm({ name: activeBoard?.name || '', description: activeBoard?.description || '' });
    setEditingBoard(false);
    setBoardError('');
    setIsBoardDetailOpen(true);
  };

  const closeBoardDetail = () => {
    setIsBoardDetailOpen(false);
    setEditingBoard(false);
    setBoardError('');
  };

  const handleBoardDetailBackdropPointerDown = (e) => {
    if (e.target === e.currentTarget) {
      closeBoardDetail();
    }
  };

  const handleSaveBoardFromModal = async (e) => {
    e.preventDefault();
    if (!boardForm.name.trim()) {
      setBoardError('Board name is required');
      return;
    }
    setIsSavingBoard(true);
    const res = await updateBoard(activeBoard.id, boardForm);
    if (res.success) {
      setActiveBoard({ ...activeBoard, ...res.data });
      setIsBoardDetailOpen(false);
      setEditingBoard(false);
    } else {
      setBoardError(res.error || 'Failed to update board');
    }
    setIsSavingBoard(false);
  };

  return (
    <>
      <section className="flex-1 min-h-0 flex flex-col overflow-x-auto overflow-y-auto bg-bg-secondary">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            Loading board...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
              <h1 className="text-lg font-extrabold text-text">{activeBoard?.name}</h1>
              <button
                onClick={openBoardDetail}
                className="p-2 bg-bg hover:bg-bg-tertiary border border-border rounded-lg text-text transition-colors shadow-sm"
                title="Board Details"
              >
                <Info size={20} />
              </button>
            </div>
            <div className="flex gap-6 flex-1 min-h-0 p-4 pt-4">
              {data.map((col) => (
                <ListColumn
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
                    await deleteList(listId);
                    setData((prev) => prev.filter((c) => c.id !== listId));
                  }}
                  onDeleteTask={async (taskId) => {
                    await deleteTask(taskId);
                    setData((prevData) =>
                      prevData.map((col) => ({
                        ...col,
                        tasks: col.tasks.filter((t) => t.id !== taskId)
                      }))
                    );
                  }}
                  onEditList={(list) => startEditList(list)}
                />
              ))}

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
                <AddListForm onSubmit={handleAddList} onCancel={() => setShowAddList(false)} />
              )}
            </div>
          </>
        )}
      </section>

      {isBoardDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onPointerDown={handleBoardDetailBackdropPointerDown}>
          <div className="bg-bg border border-border rounded-xl shadow-xl w-full max-w-lg mx-4">
            {!editingBoard ? (
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-text">{activeBoard?.name}</h2>
                  {activeBoard?.description ? (
                    <p className="mt-2 text-sm text-text-secondary whitespace-pre-wrap">{activeBoard.description}</p>
                  ) : (
                    <p className="mt-2 text-sm text-text-tertiary italic">No description provided</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingBoard(true)}
                    className="px-4 py-2 bg-button hover:bg-button-hover text-white text-sm font-medium rounded transition-colors"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={closeBoardDetail}
                    className="px-4 py-2 bg-button-secondary text-button-secondary-text hover:bg-button-secondary-hover text-sm font-medium rounded transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveBoardFromModal} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Board Name</label>
                  <input
                    type="text"
                    value={boardForm.name}
                    onChange={(e) => setBoardForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full text-lg font-extrabold text-text bg-bg-tertiary px-3 py-2 rounded border border-input-border outline-none focus:border-input-border-focus"
                    placeholder="Board name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <textarea
                    value={boardForm.description}
                    onChange={(e) => setBoardForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows="4"
                    className="w-full px-3 py-2 rounded border border-input-border bg-bg-tertiary text-sm text-text outline-none focus:border-input-border-focus resize-none"
                    placeholder="Board description"
                  />
                </div>
                {boardError && (
                  <div className="p-2 bg-error-bg border border-error-border rounded text-sm text-error-text">
                    {boardError}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingBoard}
                    className="px-4 py-2 bg-button hover:bg-button-hover text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                  >
                    {isSavingBoard ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBoard(false);
                      setBoardError('');
                    }}
                    className="px-4 py-2 bg-button-secondary text-button-secondary-text hover:bg-button-secondary-hover text-sm font-medium rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <TaskModal task={selectedTask} isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onUpdate={handleTaskUpdate} />
    </>
  );
};

export default Board;
