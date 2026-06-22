import { apiCall } from './apiConfig.js';

export const boardService = {
  getWorkspaceBoards: async (workspaceId, { signal } = {}) => {
    try {
      const data = await apiCall(`/workspaces/${workspaceId}/boards`, { signal });
      return { success: true, data };
    } catch (error) {
      console.error('Error in getWorkspaceBoards:', error);
      return { success: false, error: error.message };
    }
  },

  getBoardById: async (boardId) => {
    try {
      const data = await apiCall(`/boards/${boardId}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getBoardById:', error);
      return { success: false, error: error.message };
    }
  },

  createBoard: async (workspaceId, data) => {
    try {
      const result = await apiCall(`/workspaces/${workspaceId}/boards`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in createBoard:', error);
      return { success: false, error: error.message };
    }
  },

  createList: async (boardId, data) => {
    try {
      const result = await apiCall(`/boards/${boardId}/lists`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in createList:', error);
      return { success: false, error: error.message };
    }
  },

  updateBoard: async (boardId, data) => {
    try {
      const result = await apiCall(`/boards/${boardId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in updateBoard:', error);
      return { success: false, error: error.message };
    }
  },

  deleteBoard: async (boardId) => {
    try {
      const result = await apiCall(`/boards/${boardId}`, {
        method: 'DELETE',
      });
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error in deleteBoard:', error);
      return { success: false, error: error.message };
    }
  },
};
