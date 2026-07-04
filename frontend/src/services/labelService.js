import { apiCall } from './apiConfig.js';

export const labelService = {
  getBoardLabels: async (boardId) => {
    try {
      const data = await apiCall(`/boards/${boardId}/labels`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getBoardLabels:', error);
      return { success: false, error: error.message };
    }
  },

  createBoardLabel: async (boardId, labelData) => {
    try {
      const result = await apiCall(`/boards/${boardId}/labels`, {
        method: 'POST',
        body: JSON.stringify(labelData),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in createBoardLabel:', error);
      return { success: false, error: error.message };
    }
  },

  updateBoardLabel: async (boardId, labelId, labelData) => {
    try {
      const result = await apiCall(`/boards/${boardId}/labels/${labelId}`, {
        method: 'PUT',
        body: JSON.stringify(labelData),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in updateBoardLabel:', error);
      return { success: false, error: error.message };
    }
  },

  deleteBoardLabel: async (boardId, labelId) => {
    try {
      await apiCall(`/boards/${boardId}/labels/${labelId}`, {
        method: 'DELETE',
      });
      return { success: true };
    } catch (error) {
      console.error('Error in deleteBoardLabel:', error);
      return { success: false, error: error.message };
    }
  },

  setTaskLabels: async (taskId, labelIds) => {
    try {
      const result = await apiCall(`/tasks/${taskId}/labels`, {
        method: 'PUT',
        body: JSON.stringify({ labelIds }),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in setTaskLabels:', error);
      return { success: false, error: error.message };
    }
  },

  getTaskLabels: async (taskId) => {
    try {
      const data = await apiCall(`/tasks/${taskId}/labels`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getTaskLabels:', error);
      return { success: false, error: error.message };
    }
  },
};
