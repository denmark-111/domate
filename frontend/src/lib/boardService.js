import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${data?.session?.access_token}`,
    'Content-Type': 'application/json'
  };
};

export const boardService = {
  getWorkspaceBoards: async (workspaceId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/boards`, { headers });
      if (!response.ok) throw new Error('Failed to fetch workspace boards');
      const result = await response.json();
      return { success: true, data: result.data || result };
    } catch (error) {
      console.error('Error in getWorkspaceBoards:', error);
      return { success: false, error: error.message };
    }
  },

  getBoardById: async (boardId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/boards/${boardId}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch board details');
      const result = await response.json();
      return { success: true, data: result.data || result };
    } catch (error) {
      console.error('Error in getBoardById:', error);
      return { success: false, error: error.message };
    }
  },

  createBoard: async (workspaceId, data) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/boards`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create board');
      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error in createBoard:', error);
      return { success: false, error: error.message };
    }
  },

  createList: async (boardId, data) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/boards/${boardId}/lists`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create list');
      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error in createList:', error);
      return { success: false, error: error.message };
    }
  },

  createTask: async (listId, data) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/lists/${listId}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create task');
      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error in createTask:', error);
      return { success: false, error: error.message };
    }
  }
};
