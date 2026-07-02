import { apiCall } from './apiConfig.js';

export const activityService = {
  logVisit: async (entityType, entityId) => {
    try {
      const data = await apiCall('/users/me/recent', {
        method: 'POST',
        body: JSON.stringify({ entityType, entityId }),
      });
      return { success: true, data };
    } catch (error) {
      console.error('Error in logVisit:', error);
      return { success: false, error: error.message };
    }
  },

  getRecent: async (limit = 5) => {
    try {
      const data = await apiCall(`/users/me/recent?limit=${limit}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in getRecent:', error);
      return { success: false, error: error.message };
    }
  },
};