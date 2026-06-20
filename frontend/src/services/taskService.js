import { apiCall } from './apiConfig.js';

export const taskService = {
  getListTasks: async (listId) => {
    try {
      const data = await apiCall(`/lists/${listId}/tasks`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getListTasks:', error);
      return { success: false, error: error.message };
    }
  },

  getTaskById: async (taskId) => {
    try {
      const data = await apiCall(`/tasks/${taskId}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getTaskById:', error);
      return { success: false, error: error.message };
    }
  },

  createTask: async (listId, data) => {
    try {
      const result = await apiCall(`/lists/${listId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in createTask:', error);
      return { success: false, error: error.message };
    }
  },

  updateTask: async (taskId, data) => {
    try {
      const result = await apiCall(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in updateTask:', error);
      return { success: false, error: error.message };
    }
  },

  deleteTask: async (taskId) => {
    try {
      const result = await apiCall(`/tasks/${taskId}`, {
        method: 'DELETE',
      });
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error in deleteTask:', error);
      return { success: false, error: error.message };
    }
  },

  moveTask: async (taskId, data) => {
    try {
      const result = await apiCall(`/tasks/${taskId}/move`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in moveTask:', error);
      return { success: false, error: error.message };
    }
  },
};