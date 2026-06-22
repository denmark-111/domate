import { apiCall } from './apiConfig.js';

export const listService = {
  getBoardLists: async (boardId) => {
    try {
      const data = await apiCall(`/boards/${boardId}/lists`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getBoardLists:', error);
      return { success: false, error: error.message };
    }
  },

  getListById: async (listId) => {
    try {
      const data = await apiCall(`/lists/${listId}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getListById:', error);
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

  updateList: async (listId, data) => {
    try {
      const result = await apiCall(`/lists/${listId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in updateList:', error);
      return { success: false, error: error.message };
    }
  },

  deleteList: async (listId) => {
    try {
      const result = await apiCall(`/lists/${listId}`, {
        method: 'DELETE',
      });
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error in deleteList:', error);
      return { success: false, error: error.message };
    }
  },
};