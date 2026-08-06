import { apiCall, API_BASE_URL, getAuthHeaders } from './apiConfig.js';

export const workspaceService = {
  getWorkspaces: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', params.page);
      if (params.limit) query.set('limit', params.limit);
      const qs = query.toString();
      const endpoint = `/workspaces${qs ? '?' + qs : ''}`;

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
      
      if (!response.ok) {
        const body = await response.text().catch(() => null);
        throw new Error(body ? `API error: ${response.status} - ${body}` : `API error: ${response.status}`);
      }
      
      const json = await response.json();
      return { success: true, data: json.data, pagination: json.pagination };
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

  deleteWorkspace: async (id) => {
    try {
      const result = await apiCall(`/workspaces/${id}`, {
        method: 'DELETE',
      });
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error in deleteWorkspace:', error);
      return { success: false, error: error.message };
    }
  },
};
