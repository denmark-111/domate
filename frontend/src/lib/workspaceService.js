import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${data?.session?.access_token}`,
    'Content-Type': 'application/json'
  };
};

export const workspaceService = {
  getWorkspaces: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/workspaces`, { headers });
      if (!response.ok) throw new Error('Failed to fetch workspaces');
      const result = await response.json();
      return { success: true, data: result.data || result };
    } catch (error) {
      console.error('Error in getWorkspaces:', error);
      return { success: false, error: error.message };
    }
  },

  getWorkspaceById: async (id) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch workspace');
      const result = await response.json();
      return { success: true, data: result.data || result };
    } catch (error) {
      console.error('Error in getWorkspaceById:', error);
      return { success: false, error: error.message };
    }
  },

  createWorkspace: async (data) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/workspaces`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create workspace');
      const result = await response.json();
      return { success: true, data: result.data, message: result.message };
    } catch (error) {
      console.error('Error in createWorkspace:', error);
      return { success: false, error: error.message };
    }
  },

  updateWorkspace: async (id, data) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update workspace');
      const result = await response.json();
      return { success: true, data: result.data, message: result.message };
    } catch (error) {
      console.error('Error in updateWorkspace:', error);
      return { success: false, error: error.message };
    }
  }
};
