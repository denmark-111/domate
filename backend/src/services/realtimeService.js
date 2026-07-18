import supabaseAdmin from '../lib/supabaseAdmin.js';

export const broadcastChatMessage = async (workspaceId, message) => {
  const channel = supabaseAdmin.channel(`workspace:${workspaceId}:chat`);
  await channel.httpSend('chat:new-message', message);
};

export const broadcastChatDelete = async (workspaceId, messageId) => {
  const channel = supabaseAdmin.channel(`workspace:${workspaceId}:chat`);
  await channel.httpSend('chat:delete-message', { messageId });
};
