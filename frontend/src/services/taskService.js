import { apiCall, API_BASE_URL, getAuthHeaders } from './apiConfig.js';

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

  // --- Comment endpoints ---

  getComments: async (taskId, page = 1, limit = 50) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments?page=${page}&limit=${limit}`, { headers });
      if (!response.ok) {
        const body = await response.text().catch(() => null);
        throw new Error(body ? `API error: ${response.status} - ${body}` : `API error: ${response.status}`);
      }
      const json = await response.json();
      return { success: true, data: json };
    } catch (error) {
      console.error('Error in getComments:', error);
      return { success: false, error: error.message };
    }
  },

  createComment: async (taskId, content) => {
    try {
      const result = await apiCall(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in createComment:', error);
      return { success: false, error: error.message };
    }
  },

  deleteComment: async (commentId) => {
    try {
      const result = await apiCall(`/comments/${commentId}`, {
        method: 'DELETE',
      });
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error in deleteComment:', error);
      return { success: false, error: error.message };
    }
  },
};
