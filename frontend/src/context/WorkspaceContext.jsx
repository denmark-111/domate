import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { mockBoards } from '../data/mockData';
import { workspaceService } from '../lib/workspaceService';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { workspaceId } = useParams();
  const { isAuthenticated } = useAuth();
  
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [activeView, setActiveView] = useState('Announcements');
  const [activeBoard, setActiveBoard] = useState(null);
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

  // Get boards for the active workspace
  const boards = workspaceId ? (mockBoards[workspaceId] || ['Development', 'Marketing', 'Product Roadmap']) : [];

  // Reset local workspace state when the workspace itself changes
  useEffect(() => {
    if (workspaceId) {
      setActiveView('Announcements');
    } else {
      setActiveView('Home');
      setActiveBoard(null);
    }
  }, [workspaceId]);

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
      updateWorkspace
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
