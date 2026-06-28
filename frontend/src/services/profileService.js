import { apiCall } from './apiConfig.js';

export const profileService = {
  getProfile: async () => {
    try {
      const data = await apiCall('/users/me');
      return { success: true, data };
    } catch (error) {
      console.error('Error in getProfile:', error);
      return { success: false, error: error.message };
    }
  },

  updateProfile: async (profileData) => {
    try {
      const result = await apiCall('/users/me', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return { success: false, error: error.message };
    }
  },

  searchUsers: async (query) => {
    try {
      const data = await apiCall(`/users/search?q=${encodeURIComponent(query)}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return { success: false, error: error.message };
    }
  }
};
