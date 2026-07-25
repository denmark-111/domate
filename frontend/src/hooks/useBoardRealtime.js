import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const useBoardRealtime = (boardId, onBoardEvent) => {
  useEffect(() => {
    if (!boardId) return;

    const channelName = `board:${boardId}`;
    const channel = supabase.channel(channelName);

    const handleBroadcast = (payload) => {
      if (onBoardEvent && payload) {
        onBoardEvent(payload.event, payload.payload);
      }
    };

    channel.on('broadcast', { event: '*' }, handleBroadcast);

    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED' && status !== 'subscribed') {
        console.warn(`Realtime channel ${channelName} status: ${status}`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, onBoardEvent]);
};

export default useBoardRealtime;
