import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { workspaceService, boardService, listService, taskService, invitationService, activityService } from '../services/index.js';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { workspaceId } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [activeView, setActiveView] = useState('Overview');
  const [activeBoard, setActiveBoard] = useState(null);
  const [boards, setBoards] = useState([]);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [myPendingInvitations, setMyPendingInvitations] = useState([]);
  const [isLoadingMyInvitations, setIsLoadingMyInvitations] = useState(false);

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

  // Log board visit whenever the active board changes to a non-null board
  useEffect(() => {
    if (activeBoard?.id && activeWorkspace) {
      activityService.logVisit('board', activeBoard.id);
    }
  }, [activeBoard?.id, activeWorkspace]);

  // Log workspace visit and reset local workspace state when the workspace itself changes
  useEffect(() => {
    if (workspaceId) {
      setActiveView('Overview');
      setActiveBoard(null);

      // Log the workspace visit (fire-and-forget)
      activityService.logVisit('workspace', workspaceId);

      const controller = new AbortController();

      const fetchBoards = async () => {
        const res = await boardService.getWorkspaceBoards(workspaceId, { signal: controller.signal });
        if (res.success) {
          setBoards(res.data);
          // Check if navigation state has a board to auto-select
          const selectBoardId = location.state?.selectBoardId;
          if (selectBoardId) {
            const boardToSelect = res.data.find(b => b.id === selectBoardId);
            if (boardToSelect) {
              setActiveBoard(boardToSelect);
              setActiveView('Board');
            }
            // Clear the navigation state so it doesn't re-trigger
            window.history.replaceState({}, document.title);
          }
        } else {
          setBoards([]);
        }
      };
      if (isAuthenticated) {
        fetchBoards();
      }

      const fetchInvitations = async () => {
        setIsLoadingInvitations(true);
        const res = await invitationService.getWorkspaceInvitations(workspaceId);
        if (res.success) {
          setInvitations(res.data);
        } else {
          setInvitations([]);
        }
        setIsLoadingInvitations(false);
      };
      // Only the workspace owner can fetch/manage invitations
      if (activeWorkspace?.role === 'OWNER') {
        fetchInvitations();
      }

      return () => controller.abort();
    } else {
      setActiveView('Home');
      setActiveBoard(null);
      setBoards([]);
    }
  }, [workspaceId, isAuthenticated, activeWorkspace?.role]);

  // Handle navigation to a board within the same workspace (same URL, different state)
  useEffect(() => {
    const selectBoardId = location.state?.selectBoardId;
    if (selectBoardId && workspaceId) {
      const boardToSelect = boards.find(b => b.id === selectBoardId);
      if (boardToSelect) {
        setActiveBoard(boardToSelect);
        setActiveView('Board');
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.selectBoardId]);

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

  const createInvitation = async (workspaceId, emails) => {
    const res = await invitationService.createInvitations(workspaceId, emails);
    if (res.success) {
      // Refresh invitations list
      const updated = await invitationService.getWorkspaceInvitations(workspaceId);
      if (updated.success) setInvitations(updated.data);
    }
    return res;
  };

  const revokeInvitation = async (invitationId, workspaceId) => {
    const res = await invitationService.revokeInvitation(invitationId);
    if (res.success) {
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    }
    return res;
  };

  const fetchMyPendingInvitations = useCallback(async () => {
    setIsLoadingMyInvitations(true);
    const res = await invitationService.getMyInvitations();
    if (res.success) {
      setMyPendingInvitations(res.data);
    }
    setIsLoadingMyInvitations(false);
    return res;
  }, []);

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

  const setTaskAssignees = async (taskId, userIds) => {
    return await taskService.setTaskAssignees(taskId, userIds);
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
      invitations,
      isLoadingInvitations,
      myPendingInvitations,
      isLoadingMyInvitations,
      createInvitation,
      revokeInvitation,
      fetchMyPendingInvitations,
      createBoard,
      updateBoard,
      deleteBoard,
      updateList,
      deleteList,
      updateTask,
      setTaskAssignees,
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