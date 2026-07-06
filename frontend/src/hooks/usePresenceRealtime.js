import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const usePresenceRealtime = (boardId, user) => {
  const channelRef = useRef(null);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    if (!boardId || !user?.id) return;

    const channelName = `board-presence:${boardId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const others = Object.entries(state)
        .filter(([key]) => key !== user.id)
        .map(([, value]) => {
          const data = Array.isArray(value) ? value[0] : value;
          return {
            userId: data.userId,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl,
          };
        });
      setActiveUsers(others);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: user.id,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          onlineAt: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setActiveUsers([]);
    };
  }, [boardId, user?.id]);

  return { activeUsers };
};

export default usePresenceRealtime;
