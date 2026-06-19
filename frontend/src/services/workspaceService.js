import { apiCall } from './apiConfig.js';

export const workspaceService = {
  getWorkspaces: async () => {
    try {
      const data = await apiCall('/workspaces');
      return { success: true, data };
    } catch (error) {
      console.error('Error in getWorkspaces:', error);
      return { success: false, error: error.message };
    }
  },

  getWorkspaceById: async (id) => {
    try {
      const data = await apiCall(`/workspaces/${id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getWorkspaceById:', error);
      return { success: false, error: error.message };
    }
  },

  createWorkspace: async (data) => {
    try {
      const result = await apiCall('/workspaces', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { success: true, data: result, message: result.message };
    } catch (error) {
      console.error('Error in createWorkspace:', error);
      return { success: false, error: error.message };
    }
  },

  updateWorkspace: async (id, data) => {
    try {
      const result = await apiCall(`/workspaces/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return { success: true, data: result, message: result.message };
    } catch (error) {
      console.error('Error in updateWorkspace:', error);
      return { success: false, error: error.message };
    }
  },
};