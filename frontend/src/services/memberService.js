import { apiCall, API_BASE_URL, getAuthHeaders } from './apiConfig.js';

export const memberService = {
  getWorkspaceMembers: async (workspaceId) => {
    try {
      const data = await apiCall(`/workspaces/${workspaceId}/members`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getWorkspaceMembers:', error);
      return { success: false, error: error.message };
    }
  },
};
