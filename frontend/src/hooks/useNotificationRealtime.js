import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const useNotificationRealtime = (userId, onNewNotification) => {
  useEffect(() => {
    if (!userId) return;

    const channelName = `user:${userId}:notifications`;

    const channel = supabase.channel(channelName);

    channel.on(
      'broadcast',
      { event: 'notification:new' },
      (payload) => {
        if (onNewNotification) {
          onNewNotification(payload.payload);
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
  }, [userId, onNewNotification]);
};

export default useNotificationRealtime;
