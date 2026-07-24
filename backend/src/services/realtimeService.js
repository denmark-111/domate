import supabaseAdmin from '../lib/supabaseAdmin.js';

export const broadcastChat = async (workspaceId, event, data) => {
  const channel = supabaseAdmin.channel(`workspace:${workspaceId}:chat`);
  await channel.httpSend(`chat:${event}`, data);
};

export const broadcastNotification = async (notification) => {
  const channel = supabaseAdmin.channel(`user:${notification.userId}:notifications`);
  await channel.httpSend('notification:new', notification);
};

export const broadcastAnnouncement = async (workspaceId, event, data) => {
  const channel = supabaseAdmin.channel(`workspace:${workspaceId}:announcements`);
  await channel.httpSend(`announcement:${event}`, data);
};
