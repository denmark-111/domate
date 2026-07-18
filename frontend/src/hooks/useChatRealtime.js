import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const useChatRealtime = (workspaceId, onNewMessage, onDeleteMessage) => {
  useEffect(() => {
    if (!workspaceId) return;

    const channelName = `workspace:${workspaceId}:chat`;

    const channel = supabase.channel(channelName);

    channel.on(
      'broadcast',
      { event: 'chat:new-message' },
      (payload) => {
        if (onNewMessage) {
          onNewMessage(payload.payload);
        }
      }
    );

    channel.on(
      'broadcast',
      { event: 'chat:delete-message' },
      (payload) => {
        if (onDeleteMessage) {
          onDeleteMessage(payload.payload.messageId);
        }
      }
    );

    channel.subscribe((status) => {
      if (status !== 'subscribed') {
        console.warn(`Realtime channel ${channelName} status: ${status}`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, onNewMessage, onDeleteMessage]);
};

export default useChatRealtime;
