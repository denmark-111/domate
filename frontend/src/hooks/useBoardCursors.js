import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const CURSOR_COLORS = [
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#10B981', // emerald
  '#F59E0B', // amber
  '#06B6D4', // cyan
  '#6366F1', // indigo
  '#F43F5E', // rose
  '#14B8A6'  // teal
];

const getUserColor = (userId) => {
  if (!userId) return CURSOR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
};

export const useBoardCursors = (boardId, user, containerRef) => {
  const [activeDragCursors, setActiveDragCursors] = useState({});
  const [lockedItems, setLockedItems] = useState({});
  const channelRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastBroadcastRef = useRef(0);
  const lockTimersRef = useRef({});
  const lastPointerPosRef = useRef({ x: null, y: null });

  const userColor = getUserColor(user?.id);

  // Continuously track mouse position relative to container so exact click position is known instantly on drag start
  useEffect(() => {
    const trackPointerPos = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      lastPointerPosRef.current = {
        x: Math.round(e.clientX - rect.left + containerRef.current.scrollLeft),
        y: Math.round(e.clientY - rect.top + containerRef.current.scrollTop)
      };
    };

    window.addEventListener('pointermove', trackPointerPos, { passive: true });
    return () => {
      window.removeEventListener('pointermove', trackPointerPos);
    };
  }, [containerRef]);

  const resetLockTimer = useCallback((itemId, userId) => {
    if (lockTimersRef.current[itemId]) {
      clearTimeout(lockTimersRef.current[itemId]);
    }

    // Safety timeout: auto-release after 15 seconds of COMPLETE inactivity/silence
    lockTimersRef.current[itemId] = setTimeout(() => {
      setLockedItems((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      setActiveDragCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      delete lockTimersRef.current[itemId];
    }, 15000);
  }, []);

  const setLockWithSafetyTimeout = useCallback((itemId, lockData) => {
    setLockedItems((prev) => ({
      ...prev,
      [itemId]: lockData
    }));
    resetLockTimer(itemId, lockData.userId);
  }, [resetLockTimer]);

  const clearLockTimer = useCallback((itemId) => {
    if (lockTimersRef.current[itemId]) {
      clearTimeout(lockTimersRef.current[itemId]);
      delete lockTimersRef.current[itemId];
    }
  }, []);

  // Heartbeat interval during active drag to keep peer lock active even if mouse is stationary
  const heartbeatIntervalRef = useRef(null);

  const startDragHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = setInterval(() => {
      if (isDraggingRef.current && channelRef.current && containerRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'cursor-move',
          payload: {
            userId: user?.id,
            heartbeat: true
          }
        });
      }
    }, 3000);
  }, [user?.id, containerRef]);

  const stopDragHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!boardId || !user?.id) return;

    const channelName = `board-cursors:${boardId}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } }
    });

    channel
      .on('broadcast', { event: 'drag-start' }, ({ payload }) => {
        if (!payload || payload.userId === user.id) return;
        const validX = payload.x != null && !isNaN(payload.x) ? payload.x : null;
        const validY = payload.y != null && !isNaN(payload.y) ? payload.y : null;
        setActiveDragCursors((prev) => ({
          ...prev,
          [payload.userId]: {
            x: validX,
            y: validY,
            color: payload.color,
            fullName: payload.fullName,
            itemId: payload.id,
            type: payload.type
          }
        }));
        setLockWithSafetyTimeout(payload.id, {
          userId: payload.userId,
          fullName: payload.fullName,
          color: payload.color,
          type: payload.type
        });
      })
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        if (!payload || payload.userId === user.id) return;
        setActiveDragCursors((prev) => {
          if (!prev[payload.userId]) return prev;
          const itemId = prev[payload.userId].itemId;
          if (itemId) {
            resetLockTimer(itemId, payload.userId);
          }
          if (payload.x == null || payload.y == null) return prev;
          return {
            ...prev,
            [payload.userId]: {
              ...prev[payload.userId],
              x: payload.x,
              y: payload.y
            }
          };
        });
      })
      .on('broadcast', { event: 'drag-end' }, ({ payload }) => {
        if (!payload || payload.userId === user.id) return;
        setActiveDragCursors((prev) => {
          const next = { ...prev };
          delete next[payload.userId];
          return next;
        });
        clearLockTimer(payload.id);
        setLockedItems((prev) => {
          const next = { ...prev };
          delete next[payload.id];
          return next;
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (!leftPresences || leftPresences.length === 0) return;
        const leftUserIds = new Set(leftPresences.map((p) => p.userId));
        setActiveDragCursors((prev) => {
          const next = { ...prev };
          leftUserIds.forEach((id) => delete next[id]);
          return next;
        });
        setLockedItems((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((itemId) => {
            if (leftUserIds.has(next[itemId].userId)) {
              clearLockTimer(itemId);
              delete next[itemId];
            }
          });
          return next;
        });
      });

    channel.subscribe();
    channelRef.current = channel;

    const currentLockTimers = lockTimersRef.current;

    return () => {
      stopDragHeartbeat();
      Object.keys(currentLockTimers).forEach((id) => clearTimeout(currentLockTimers[id]));
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [boardId, user?.id, clearLockTimer, setLockWithSafetyTimeout, resetLockTimer, stopDragHeartbeat]);

  // Global pointer move tracking while dragging
  useEffect(() => {
    const handleGlobalPointerMove = (e) => {
      if (!isDraggingRef.current || !containerRef.current || !channelRef.current) return;
      const now = Date.now();
      if (now - lastBroadcastRef.current < 50) return; // 50ms throttle (~20fps)
      lastBroadcastRef.current = now;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left + containerRef.current.scrollLeft);
      const y = Math.round(e.clientY - rect.top + containerRef.current.scrollTop);

      lastPointerPosRef.current = { x, y };

      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: {
          userId: user.id,
          x,
          y
        }
      });
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
    };
  }, [user?.id, containerRef]);

  const broadcastDragStart = useCallback((type, id, initialPos) => {
    if (!channelRef.current || !containerRef.current) return;
    isDraggingRef.current = true;
    startDragHeartbeat();

    let x = lastPointerPosRef.current.x;
    let y = lastPointerPosRef.current.y;

    if (x == null || y == null) {
      const rect = containerRef.current.getBoundingClientRect();
      if (initialPos && (initialPos.x != null || initialPos.y != null)) {
        x = Math.round((initialPos.x || 0) - rect.left + containerRef.current.scrollLeft);
        y = Math.round((initialPos.y || 0) - rect.top + containerRef.current.scrollTop);
      }
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'drag-start',
      payload: {
        userId: user.id,
        fullName: user.fullName || user.email,
        color: userColor,
        type,
        id,
        x,
        y
      }
    });
  }, [user, userColor, containerRef, startDragHeartbeat]);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current || !containerRef.current || !channelRef.current) return;
    const now = Date.now();
    if (now - lastBroadcastRef.current < 50) return;
    lastBroadcastRef.current = now;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left + containerRef.current.scrollLeft);
    const y = Math.round(e.clientY - rect.top + containerRef.current.scrollTop);

    lastPointerPosRef.current = { x, y };

    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor-move',
      payload: {
        userId: user.id,
        x,
        y
      }
    });
  }, [containerRef, user?.id]);

  const broadcastDragEnd = useCallback((type, id) => {
    isDraggingRef.current = false;
    stopDragHeartbeat();
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'drag-end',
      payload: { userId: user.id, type, id }
    });
  }, [user, stopDragHeartbeat]);

  return {
    activeDragCursors,
    lockedItems,
    userColor,
    handleMouseMove,
    broadcastDragStart,
    broadcastDragEnd
  };
};

export default useBoardCursors;

