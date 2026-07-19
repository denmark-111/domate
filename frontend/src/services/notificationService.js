import { apiCall, API_BASE_URL, getAuthHeaders } from './apiConfig.js';

export const notificationService = {
  async getMyNotifications({ page = 1, limit = 20 } = {}) {
    const response = await fetch(`${API_BASE_URL}/notifications?page=${page}&limit=${limit}`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  async getUnreadCount() {
    const result = await apiCall('/notifications/unread-count');
    return result;
  },

  async markNotificationRead(notificationId) {
    return apiCall(`/notifications/${notificationId}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead() {
    return apiCall('/notifications/read-all', { method: 'PUT' });
  }
};
