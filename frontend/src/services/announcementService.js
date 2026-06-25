import { apiCall } from './apiConfig.js';

export const announcementService = {
  getWorkspaceAnnouncements: async (workspaceId) => {
    try {
      const data = await apiCall(`/workspaces/${workspaceId}/announcements`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getWorkspaceAnnouncements:', error);
      return { success: false, error: error.message };
    }
  },

  getAnnouncementById: async (announcementId) => {
    try {
      const data = await apiCall(`/announcements/${announcementId}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getAnnouncementById:', error);
      return { success: false, error: error.message };
    }
  },

  createAnnouncement: async (workspaceId, announcementData) => {
    try {
      const result = await apiCall(`/workspaces/${workspaceId}/announcements`, {
        method: 'POST',
        body: JSON.stringify(announcementData),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in createAnnouncement:', error);
      return { success: false, error: error.message };
    }
  },

  updateAnnouncement: async (announcementId, announcementData) => {
    try {
      const result = await apiCall(`/announcements/${announcementId}`, {
        method: 'PUT',
        body: JSON.stringify(announcementData),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in updateAnnouncement:', error);
      return { success: false, error: error.message };
    }
  },

  deleteAnnouncement: async (announcementId) => {
    try {
      const result = await apiCall(`/announcements/${announcementId}`, {
        method: 'DELETE',
      });
      return { success: true, message: result?.message ?? 'Announcement deleted successfully' };
    } catch (error) {
      console.error('Error in deleteAnnouncement:', error);
      return { success: false, error: error.message };
    }
  },
};