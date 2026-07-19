import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { notificationIdParamSchema, listNotificationsSchema } from '../schemas/notificationSchema.js';
import { getMyNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../controllers/notificationController.js';

export const router = Router();

router.get('/', validate(listNotificationsSchema), asyncHandler(getMyNotifications));
router.get('/unread-count', asyncHandler(getUnreadCount));
router.put('/:notificationId/read', validate(notificationIdParamSchema), asyncHandler(markNotificationRead));
router.put('/read-all', asyncHandler(markAllNotificationsRead));
