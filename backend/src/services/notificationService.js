import prisma from '../client.js';
import { broadcastNotification } from './realtimeService.js';

export async function createNotifications({ userIds, actorId, type, data }) {
  if (userIds.length === 0) return;

  const notifications = await prisma.notification.createManyAndReturn({
    data: userIds.map(userId => ({
      userId,
      actorId,
      type,
      data
    })),
    include: {
      actor: {
        select: { id: true, fullName: true, avatarUrl: true }
      }
    }
  });

  for (const notification of notifications) {
    broadcastNotification(notification).catch(() => {});
  }
}

export async function createNotificationsForWorkspaceMembers({ workspaceId, type, data, excludeUserId, actorId }) {
  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {})
    },
    select: { userId: true }
  });

  if (members.length === 0) return [];

  const notifications = await prisma.notification.createManyAndReturn({
    data: members.map(m => ({
      userId: m.userId,
      actorId,
      type,
      data
    })),
    include: {
      actor: {
        select: { id: true, fullName: true, avatarUrl: true }
      }
    }
  });

  for (const notification of notifications) {
    broadcastNotification(notification).catch(() => {});
  }
}

export async function getNotifications({ userId, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        actor: {
          select: { id: true, fullName: true, avatarUrl: true }
        }
      }
    }),
    prisma.notification.count({ where: { userId } })
  ]);

  return {
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + notifications.length < total
    }
  };
}

export async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: { userId, readAt: null }
  });
}

export async function markAsRead({ notificationId, userId }) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId }
  });

  if (!notification) return null;

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() }
  });
}

export async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() }
  });
}
