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

  getInvitationById: async (id) => {
    try {
      const data = await apiCall(`/invitations/${id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getInvitationById:', error);
      return { success: false, error: error.message };
    }
  },

  acceptInvitation: async (id) => {
    try {
      const data = await apiCall(`/invitations/${id}/accept`, {
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

  declineInvitation: async (invitationId) => {
    try {
      const data = await apiCall(`/invitations/${invitationId}/decline`, {
        method: 'POST',
      });
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error in declineInvitation:', error);
      return { success: false, error: error.message };
    }
  },
};
