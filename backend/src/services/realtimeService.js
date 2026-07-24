import supabaseAdmin from '../lib/supabaseAdmin.js';

export const broadcastChatMessage = async (workspaceId, message) => {
  const channel = supabaseAdmin.channel(`workspace:${workspaceId}:chat`);
  await channel.httpSend('chat:new-message', message);
};

export const broadcastChatDelete = async (workspaceId, messageId) => {
  const channel = supabaseAdmin.channel(`workspace:${workspaceId}:chat`);
  await channel.httpSend('chat:delete-message', { messageId });
};

export const broadcastNotification = async (notification) => {
  const channel = supabaseAdmin.channel(`user:${notification.userId}:notifications`);
  await channel.httpSend('notification:new', notification);
};

export const broadcastAnnouncement = async (workspaceId, event, data) => {
  const channel = supabaseAdmin.channel(`workspace:${workspaceId}:announcements`);
  await channel.httpSend(`announcement:${event}`, data);
};
