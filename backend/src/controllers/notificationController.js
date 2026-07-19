import * as notificationService from '../services/notificationService.js';

export const getMyNotifications = async (req, res) => {
  const userId = req.supabase.user.id;
  const { page = 1, limit = 20 } = req.validated.query || {};

  const result = await notificationService.getNotifications({ userId, page, limit });

  res.status(200).json(result);
};

export const getUnreadCount = async (req, res) => {
  const userId = req.supabase.user.id;

  const count = await notificationService.getUnreadCount(userId);

  res.status(200).json({ data: { count } });
};

export const markNotificationRead = async (req, res) => {
  const userId = req.supabase.user.id;
  const { notificationId } = req.validated.params;

  const notification = await notificationService.markAsRead({ notificationId, userId });

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  res.status(200).json({ message: 'Marked as read', data: notification });
};

export const markAllNotificationsRead = async (req, res) => {
  const userId = req.supabase.user.id;

  await notificationService.markAllAsRead(userId);

  res.status(200).json({ message: 'All notifications marked as read' });
};
