import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const useChatRealtime = (workspaceId, onNewMessage, onDeleteMessage, user) => {
  const channelRef = useRef(null);
  const typingTimeoutsRef = useRef({});
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (!workspaceId) return;

    const channelName = `workspace:${workspaceId}:chat`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    const clearUserTyping = (userId) => {
      if (!userId) return;
      if (typingTimeoutsRef.current[userId]) {
        clearTimeout(typingTimeoutsRef.current[userId]);
        delete typingTimeoutsRef.current[userId];
      }
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    channel.on(
      'broadcast',
      { event: 'chat:new-message' },
      (payload) => {
        if (payload?.payload?.authorId) {
          clearUserTyping(payload.payload.authorId);
        }
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

    channel.on(
      'broadcast',
      { event: 'chat:typing' },
      (payload) => {
        const typingData = payload?.payload;
        if (!typingData || !typingData.userId || typingData.userId === user?.id) return;

        const { userId, fullName, avatarUrl } = typingData;

        if (typingTimeoutsRef.current[userId]) {
          clearTimeout(typingTimeoutsRef.current[userId]);
        }

        typingTimeoutsRef.current[userId] = setTimeout(() => {
          delete typingTimeoutsRef.current[userId];
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        }, 3500);

        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === userId)) {
            return prev.map((u) => (u.userId === userId ? { userId, fullName, avatarUrl } : u));
          }
          return [...prev, { userId, fullName, avatarUrl }];
        });
      }
    );

    channel.on(
      'broadcast',
      { event: 'chat:stop-typing' },
      (payload) => {
        const typingData = payload?.payload;
        if (typingData?.userId) {
          clearUserTyping(typingData.userId);
        }
      }
    );

    channel.subscribe((status) => {
      if (status !== 'subscribed' && status !== 'SUBSCRIBED') {
        console.warn(`Realtime channel ${channelName} status: ${status}`);
      }
    });

    return () => {
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
      setTypingUsers([]);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [workspaceId, onNewMessage, onDeleteMessage, user?.id]);

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !user?.id) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat:typing',
      payload: {
        userId: user.id,
        fullName: user.fullName || user.email || 'Someone',
        avatarUrl: user.avatarUrl || null,
      },
    });
  }, [user]);

  const sendStopTyping = useCallback(() => {
    if (!channelRef.current || !user?.id) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat:stop-typing',
      payload: {
        userId: user.id,
      },
    });
  }, [user]);

  return { typingUsers, sendTyping, sendStopTyping };
};

export default useChatRealtime;

