import { z } from 'zod';

export const notificationIdParamSchema = z.object({
  params: z.object({
    notificationId: z.string().uuid('Invalid notification ID format')
  })
});

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
  })
});
