import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { workspaceService, boardService, listService, taskService } from '../services/index.js';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { workspaceId } = useParams();
  const { isAuthenticated } = useAuth();
  
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [activeView, setActiveView] = useState('Overview');
  const [activeBoard, setActiveBoard] = useState(null);
  const [boards, setBoards] = useState([]);
  const [showCreateBoard, setShowCreateBoard] = useState(false);

  // Fetch workspaces on load or when auth changes
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (isAuthenticated) {
        setIsLoadingWorkspaces(true);
        const res = await workspaceService.getWorkspaces();
        if (res.success) {
          setWorkspaces(res.data);
        }
        setIsLoadingWorkspaces(false);
      } else {
        setWorkspaces([]);
        setIsLoadingWorkspaces(false);
      }
    };
    fetchWorkspaces();
  }, [isAuthenticated]);

  // Find the active workspace object
  const activeWorkspace = workspaceId 
    ? workspaces.find(w => w.id === workspaceId) 
    : null;

  // Reset local workspace state when the workspace itself changes
  useEffect(() => {
    if (workspaceId) {
      setActiveView('Overview');
      
      const fetchBoards = async () => {
        const res = await boardService.getWorkspaceBoards(workspaceId);
        if (res.success) {
          setBoards(res.data);
        } else {
          setBoards([]);
        }
      };
      if (isAuthenticated) {
        fetchBoards();
      }
    } else {
      setActiveView('Home');
      setActiveBoard(null);
      setBoards([]);
    }
  }, [workspaceId, isAuthenticated]);

  const createWorkspace = async (data) => {
    const res = await workspaceService.createWorkspace(data);
    if (res.success) {
      setWorkspaces(prev => [...prev, res.data]);
    }
    return res;
  };

  const updateWorkspace = async (id, data) => {
    const res = await workspaceService.updateWorkspace(id, data);
    if (res.success) {
      // API responds with the updated workspace inside res.data
      setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...res.data } : w));
    }
    return res;
  };

  const createBoard = async (workspaceId, data) => {
    const res = await boardService.createBoard(workspaceId, data);
    if (res.success) {
      setBoards(prev => [...prev, res.data]);
    }
    return res;
  };

  const updateBoard = async (boardId, data) => {
    const res = await boardService.updateBoard(boardId, data);
    if (res.success) {
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, ...res.data } : b));
    }
    return res;
  };

  const deleteBoard = async (boardId) => {
    const res = await boardService.deleteBoard(boardId);
    if (res.success) {
      setBoards(prev => prev.filter(b => b.id !== boardId));
    }
    return res;
  };

  const deleteWorkspace = async (id) => {
    const res = await workspaceService.deleteWorkspace(id);
    if (res.success) {
      setWorkspaces(prev => prev.filter(w => w.id !== id));
    }
    return res;
  };

  const updateList = async (listId, data) => {
    return await listService.updateList(listId, data);
  };

  const deleteList = async (listId) => {
    const res = await listService.deleteList(listId);
    return res;
  };

  const updateTask = async (taskId, data) => {
    return await taskService.updateTask(taskId, data);
  };

  const deleteTask = async (taskId) => {
    return await taskService.deleteTask(taskId);
  };

  const moveTask = async (taskId, data) => {
    return await taskService.moveTask(taskId, data);
  };

  return (
    <WorkspaceContext.Provider value={{
      activeWorkspace,
      workspaces,
      isLoadingWorkspaces,
      activeView,
      setActiveView,
      activeBoard,
      setActiveBoard,
      boards,
      showCreateBoard,
      setShowCreateBoard,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      createBoard,
      updateBoard,
      deleteBoard,
      updateList,
      deleteList,
      updateTask,
      deleteTask,
      moveTask
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
