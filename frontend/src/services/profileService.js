import { apiCall } from './apiConfig.js';

export const profileService = {
  getProfile: async () => {
    try {
      const data = await apiCall('/profile');
      return { success: true, data };
    } catch (error) {
      console.error('Error in getProfile:', error);
      return { success: false, error: error.message };
    }
  },

  updateProfile: async (profileData) => {
    try {
      const result = await apiCall('/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return { success: false, error: error.message };
    }
  }
};
