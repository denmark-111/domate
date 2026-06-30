import { apiCall, API_BASE_URL, getAuthHeaders } from './apiConfig.js';

export const chatService = {
  getWorkspaceMessages: async (workspaceId, { page = 1, limit = 50 } = {}) => {
    try {
      const params = new URLSearchParams();
      if (page && page !== 1) params.set('page', String(page));
      if (limit !== 50) params.set('limit', String(limit));
      const qs = params.toString();
      const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/chat${qs ? `?${qs}` : ''}`, {
        headers: await getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      return { success: true, data: json };
    } catch (error) {
      console.error('Error in getWorkspaceMessages:', error);
      return { success: false, error: error.message };
    }
  },

  sendMessage: async (workspaceId, content) => {
    try {
      const result = await apiCall(`/workspaces/${workspaceId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return { success: false, error: error.message };
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const result = await apiCall(`/chat/${messageId}`, {
        method: 'DELETE',
      });
      return { success: true, message: result?.message ?? 'Message deleted successfully' };
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      return { success: false, error: error.message };
    }
  },
};
