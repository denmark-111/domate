import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { workspaceService, boardService, listService, taskService, invitationService, activityService } from '../services/index.js';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { workspaceId } = useParams();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [workspacesPagination, setWorkspacesPagination] = useState(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [failedWorkspaceId, setFailedWorkspaceId] = useState(null);

  // Synchronously determine if the active workspace is loading for the current route param
  const isWorkspaceLoading = Boolean(
    workspaceId &&
    isAuthenticated &&
    activeWorkspace?.id !== workspaceId &&
    failedWorkspaceId !== workspaceId
  );

  const [activeView, setActiveView] = useState('Overview');
  const [activeBoard, setActiveBoard] = useState(null);
  const [boards, setBoards] = useState([]);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [myPendingInvitations, setMyPendingInvitations] = useState([]);
  const [isLoadingMyInvitations, setIsLoadingMyInvitations] = useState(false);

  const fetchWorkspaces = useCallback(async (page = 1) => {
    if (isAuthenticated) {
      if (page === 1) setIsLoadingWorkspaces(true);
      const res = await workspaceService.getWorkspaces({ page, limit: 10 });
      if (res.success && Array.isArray(res.data)) {
        setWorkspaces(prev => {
          const combined = page === 1 ? res.data : [...prev, ...res.data];
          const seen = new Set();
          return combined.filter(w => {
            if (seen.has(w.id)) return false;
            seen.add(w.id);
            return true;
          });
        });
        setWorkspacesPagination(res.pagination);
      } else {
        if (page === 1) setWorkspaces([]);
      }
      setIsLoadingWorkspaces(false);
    } else {
      setWorkspaces([]);
      setWorkspacesPagination(null);
      setIsLoadingWorkspaces(false);
    }
  }, [isAuthenticated]);

  // Fetch workspaces on load or when auth changes
  useEffect(() => {
    fetchWorkspaces(1);
  }, [fetchWorkspaces]);

  // Update page title based on active workspace name or default 'Domate'
  useEffect(() => {
    if (activeWorkspace?.name) {
      document.title = activeWorkspace.name;
    } else {
      document.title = 'Domate';
    }
  }, [activeWorkspace?.name]);

  // Log board visit whenever the active board changes to a non-null board
  useEffect(() => {
    if (activeBoard?.id && activeWorkspace) {
      activityService.logVisit('board', activeBoard.id);
    }
  }, [activeBoard?.id, activeWorkspace]);

  // Fetch active workspace by ID and workspace resources whenever workspaceId changes
  useEffect(() => {
    let cancelled = false;

    if (workspaceId && isAuthenticated) {
      if (activeWorkspace?.id !== workspaceId) {
        setActiveView('Overview');
        setActiveBoard(null);
        setInvitations([]);
      }

      // Log the workspace visit (fire-and-forget)
      activityService.logVisit('workspace', workspaceId);

      const controller = new AbortController();

      const loadWorkspaceAndDetails = async () => {
        const wsRes = await workspaceService.getWorkspaceById(workspaceId);
        if (cancelled) return;

        if (wsRes.success && wsRes.data) {
          setActiveWorkspace(wsRes.data);
          setFailedWorkspaceId(null);

          const isOwner =
            wsRes.data.memberships?.some((m) => m.role === 'OWNER' && m.user?.id === user?.id) ||
            wsRes.data.type === 'personal';

          const boardsPromise = boardService.getWorkspaceBoards(workspaceId, { signal: controller.signal });
          const invPromise = isOwner
            ? invitationService.getWorkspaceInvitations(workspaceId)
            : Promise.resolve({ success: true, data: [] });

          const [boardsRes, invRes] = await Promise.all([boardsPromise, invPromise]);
          if (cancelled) return;

          if (boardsRes.success && Array.isArray(boardsRes.data)) {
            setBoards(boardsRes.data);
            const selectBoardId = location.state?.selectBoardId;
            if (selectBoardId) {
              const boardToSelect = boardsRes.data.find(b => b.id === selectBoardId);
              if (boardToSelect) {
                setActiveBoard(boardToSelect);
                setActiveView('Board');
              }
              window.history.replaceState({}, document.title);
            }
          } else {
            setBoards([]);
          }

          if (invRes.success && Array.isArray(invRes.data)) {
            setInvitations(invRes.data);
          } else {
            setInvitations([]);
          }
        } else {
          setActiveWorkspace(null);
          setFailedWorkspaceId(workspaceId);
          setBoards([]);
          setInvitations([]);
        }
      };

      loadWorkspaceAndDetails();

      return () => {
        cancelled = true;
        controller.abort();
      };
    } else if (!workspaceId) {
      setActiveWorkspace(null);
      setFailedWorkspaceId(null);
      setActiveView('Home');
      setActiveBoard(null);
      setBoards([]);
      setInvitations([]);
    }
  }, [workspaceId, isAuthenticated]);

  // Handle navigation to a board within the same workspace (same URL, different state)
  useEffect(() => {
    const selectBoardId = location.state?.selectBoardId;
    if (selectBoardId && workspaceId && Array.isArray(boards)) {
      const boardToSelect = boards.find(b => b.id === selectBoardId);
      if (boardToSelect) {
        setActiveBoard(boardToSelect);
        setActiveView('Board');
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.selectBoardId, boards, workspaceId]);

  const createWorkspace = async (data) => {
    const res = await workspaceService.createWorkspace(data);
    if (res.success) {
      setWorkspaces(prev => [res.data, ...prev]);
      setWorkspacesPagination(prev => prev ? { ...prev, total: prev.total + 1 } : prev);
    }
    return res;
  };

  const updateWorkspace = async (id, data) => {
    const res = await workspaceService.updateWorkspace(id, data);
    if (res.success) {
      setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...res.data } : w));
      setActiveWorkspace(prev => prev?.id === id ? { ...prev, ...res.data } : prev);
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
      setWorkspacesPagination(prev => prev ? { ...prev, total: prev.total - 1 } : prev);
      setActiveWorkspace(prev => prev?.id === id ? null : prev);
    }
    return res;
  };

  const createInvitation = async (workspaceId, emails) => {
    const res = await invitationService.createInvitations(workspaceId, emails);
    if (res.success) {
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
      isWorkspaceLoading,
      isLoadingActiveWorkspace: isWorkspaceLoading,
      workspaces,
      workspacesPagination,
      fetchWorkspaces,
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