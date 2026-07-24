import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const useAnnouncementRealtime = (workspaceId, onNewAnnouncement, onUpdateAnnouncement, onDeleteAnnouncement) => {
  useEffect(() => {
    if (!workspaceId) return;

    const channelName = `workspace:${workspaceId}:announcements`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'announcement:new' }, (payload) => {
        if (onNewAnnouncement) onNewAnnouncement(payload.payload);
      })
      .on('broadcast', { event: 'announcement:update' }, (payload) => {
        if (onUpdateAnnouncement) onUpdateAnnouncement(payload.payload);
      })
      .on('broadcast', { event: 'announcement:delete' }, (payload) => {
        if (onDeleteAnnouncement) onDeleteAnnouncement(payload.payload.id);
      });

    channel.subscribe((status) => {
      if (status !== 'subscribed') {
        console.warn(`Realtime channel ${channelName} status: ${status}`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, onNewAnnouncement, onUpdateAnnouncement, onDeleteAnnouncement]);
};

export default useAnnouncementRealtime;
