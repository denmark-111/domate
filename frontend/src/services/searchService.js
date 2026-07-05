import { apiCall } from './apiConfig.js';

export const searchService = {
  searchMyStuff: async (query) => {
    try {
      const data = await apiCall(`/users/me/search?q=${encodeURIComponent(query)}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in searchMyStuff:', error);
      return { success: false, error: error.message };
    }
  },
};
