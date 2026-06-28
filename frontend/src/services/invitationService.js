import { apiCall } from './apiConfig.js';

export const invitationService = {
  createInvitations: async (workspaceId, emails) => {
    try {
      const data = await apiCall(`/workspaces/${workspaceId}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ emails }),
      });
      return { success: true, data, message: data.message };
    } catch (error) {
      console.error('Error in createInvitations:', error);
      return { success: false, error: error.message };
    }
  },

  getWorkspaceInvitations: async (workspaceId) => {
    try {
      const data = await apiCall(`/workspaces/${workspaceId}/invitations`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getWorkspaceInvitations:', error);
      return { success: false, error: error.message };
    }
  },

  getMyInvitations: async () => {
    try {
      const data = await apiCall('/invitations');
      return { success: true, data };
    } catch (error) {
      console.error('Error in getMyInvitations:', error);
      return { success: false, error: error.message };
    }
  },

  getInvitationByToken: async (token) => {
    try {
      const data = await apiCall(`/invitations/${token}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getInvitationByToken:', error);
      return { success: false, error: error.message };
    }
  },

  acceptInvitation: async (token) => {
    try {
      const data = await apiCall(`/invitations/${token}/accept`, {
        method: 'POST',
      });
      return { success: true, data, message: data.message };
    } catch (error) {
      console.error('Error in acceptInvitation:', error);
      return { success: false, error: error.message };
    }
  },

  revokeInvitation: async (invitationId) => {
    try {
      const data = await apiCall(`/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error in revokeInvitation:', error);
      return { success: false, error: error.message };
    }
  },
};
