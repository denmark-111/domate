import { apiCall, API_BASE_URL, getAuthHeaders } from './apiConfig.js';

export const announcementService = {
  getWorkspaceAnnouncements: async (workspaceId, { page = 1, limit = 20 } = {}) => {
    try {
      const params = new URLSearchParams();
      if (page && page !== 1) params.set('page', String(page));
      if (limit !== 20) params.set('limit', String(limit));
      const qs = params.toString();
      const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/announcements${qs ? `?${qs}` : ''}`, {
        headers: await getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      return { success: true, data: json };
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