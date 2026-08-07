import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { workspaceService, boardService, listService, taskService, invitationService, activityService } from '../services/index.js';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { workspaceId } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [failedWorkspaceId, setFailedWorkspaceId] = useState(null);
  const [boards, setBoards] = useState([]);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [myPendingInvitations, setMyPendingInvitations] = useState([]);
  const [isLoadingMyInvitations, setIsLoadingMyInvitations] = useState(false);

  // Synchronously determine if active workspace is loading for current route param
  const isWorkspaceLoading = Boolean(
    workspaceId &&
    isAuthenticated &&
    activeWorkspace?.id !== workspaceId &&
    failedWorkspaceId !== workspaceId
  );

  // Update document title
  useEffect(() => {
    if (activeWorkspace?.name) {
      document.title = activeWorkspace.name;
    } else {
      document.title = 'Domate';
    }
  }, [activeWorkspace?.name]);

  // Fetch active workspace and resources whenever workspaceId changes
  useEffect(() => {
    let cancelled = false;

    if (workspaceId && isAuthenticated) {
      if (activeWorkspace?.id !== workspaceId) {
        setInvitations([]);
      }

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
      setBoards([]);
      setInvitations([]);
    }
  }, [workspaceId, isAuthenticated, user?.id]);

  const updateWorkspace = async (id, data) => {
    const res = await workspaceService.updateWorkspace(id, data);
    if (res.success) {
      setActiveWorkspace(prev => prev?.id === id ? { ...prev, ...res.data } : prev);
    }
    return res;
  };

  const deleteWorkspace = async (id) => {
    const res = await workspaceService.deleteWorkspace(id);
    if (res.success) {
      setActiveWorkspace(prev => prev?.id === id ? null : prev);
    }
    return res;
  };

  const createBoard = async (wsId, data) => {
    const res = await boardService.createBoard(wsId, data);
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

  const createInvitation = async (wsId, emails) => {
    const res = await invitationService.createInvitations(wsId, emails);
    if (res.success) {
      const updated = await invitationService.getWorkspaceInvitations(wsId);
      if (updated.success) setInvitations(updated.data);
    }
    return res;
  };

  const revokeInvitation = async (invitationId) => {
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
    return await listService.deleteList(listId);
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
      boards,
      showCreateBoard,
      setShowCreateBoard,
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

export const useWorkspaceOptional = () => {
  return useContext(WorkspaceContext) || {};
};