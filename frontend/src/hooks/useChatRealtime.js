import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const useChatRealtime = (workspaceId, onNewMessage) => {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!workspaceId) return;

    const channelName = `workspace-chat:${workspaceId}`;

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false, // don't receive our own broadcasts (we add locally after POST)
        },
      },
    });

    channel.on(
      'broadcast',
      { event: 'new-message' },
      (payload) => {
        if (onNewMessage) {
          onNewMessage(payload.payload);
        }
      }
    );

    channel.subscribe((status) => {
      if (status !== 'subscribed') {
        console.warn(`Realtime channel ${channelName} status: ${status}`);
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [workspaceId, onNewMessage]);

  const broadcastMessage = useCallback((message) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new-message',
        payload: message,
      });
    }
  }, []);

  return { broadcastMessage };
};

export default useChatRealtime;
