import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { workspaces, mockBoards } from '../data/mockData';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { workspaceId } = useParams();
  const [activeView, setActiveView] = useState('Announcements');
  const [activeBoard, setActiveBoard] = useState(null);

  // Find the active workspace object
  const activeWorkspace = workspaceId 
    ? workspaces.find(w => w.id === workspaceId) 
    : null;

  // Get boards for the active workspace
  const boards = workspaceId ? (mockBoards[workspaceId] || []) : [];

  // Reset local workspace state when the workspace itself changes
  useEffect(() => {
    if (workspaceId) {
      setActiveView('Announcements');
    } else {
      setActiveView('Home');
      setActiveBoard(null);
    }
  }, [workspaceId]);

  return (
    <WorkspaceContext.Provider value={{
      activeWorkspace,
      workspaces,
      activeView,
      setActiveView,
      activeBoard,
      setActiveBoard,
      boards
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
