import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Loader, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/index.js';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChatRealtime from '../../hooks/useChatRealtime';
import ConfirmModal from '../common/ConfirmModal';

const PAGE_SIZE = 50;

const ChatList = () => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isSending, setIsSending] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevMessageCountRef = useRef(0);
  const prevScrollHeightRef = useRef(0);
  const isAtBottomRef = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);
  const pageRef = useRef(1);

  // Keep refs in sync with state for use in scroll callback
  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
    hasMoreRef.current = hasMore;
    pageRef.current = page;
  }, [isLoadingMore, hasMore, page]);

  // Track if user is scrolled to bottom
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distanceFromBottom < 100;

    // Load more when scrolling to top
    if (el.scrollTop < 100 && hasMoreRef.current && !isLoadingMoreRef.current) {
      loadMore();
    }
  }, []);

  // Subscribe to scroll events
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Handle incoming realtime messages
  const onNewMessage = useCallback((message) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const { broadcastMessage } = useChatRealtime(activeWorkspace?.id, onNewMessage);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    setIsLoading(true);
    setError('');
    const res = await chatService.getWorkspaceMessages(activeWorkspace.id, { page: 1, limit: PAGE_SIZE });
    if (res.success) {
      const pageData = res.data?.data ?? res.data ?? [];
      setMessages(pageData);
      setHasMore(Boolean(res.data?.pagination?.hasMore));
      setPage(1);
    } else {
      setError(res.error || 'Failed to load messages');
    }
    setIsLoading(false);
  }, [activeWorkspace?.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const loadMore = useCallback(async () => {
    if (!activeWorkspace?.id || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setError('');
    const nextPage = page + 1;
    const res = await chatService.getWorkspaceMessages(activeWorkspace.id, {
      page: nextPage,
      limit: PAGE_SIZE,
    });
    if (res.success) {
      const pageData = res.data?.data ?? res.data ?? [];
      setMessages((prev) => [...pageData, ...prev]);
      setHasMore(Boolean(res.data?.pagination?.hasMore));
      setPage(nextPage);
    } else {
      setError(res.error || 'Failed to load more messages');
    }
    setIsLoadingMore(false);
  }, [activeWorkspace?.id, isLoadingMore, hasMore, page]);

  // After loading more, maintain scroll position

  useEffect(() => {
    if (isLoadingMore && messagesContainerRef.current) {
      prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
    }
  }, [isLoadingMore]);

  useEffect(() => {
    if (!isLoadingMore && prevScrollHeightRef.current > 0 && messagesContainerRef.current) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      if (diff > 0) {
        messagesContainerRef.current.scrollTop = diff;
      }
      prevScrollHeightRef.current = 0;
    }
  }, [isLoadingMore, messages]);

  // Initial scroll to bottom after first load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [isLoading]);

  const handleSend = async (content) => {
    if (!activeWorkspace?.id) return;
    setIsSending(true);
    const res = await chatService.sendMessage(activeWorkspace.id, content);
    if (res.success) {
      // Add to local state immediately
      setMessages((prev) => [...prev, res.data]);
      // Broadcast to other clients
      broadcastMessage(res.data);
    } else {
      throw new Error(res.error || 'Failed to send message');
    }
    setIsSending(false);
  };

  const handleDelete = async () => {
    if (!deletingMessageId) return;
    setIsDeleting(true);
    const res = await chatService.deleteMessage(deletingMessageId);
    if (res.success) {
      setMessages((prev) => prev.filter((m) => m.id !== deletingMessageId));
      setShowDeleteConfirm(false);
      setDeletingMessageId(null);
    } else {
      setError(res.error || 'Failed to delete message');
    }
    setIsDeleting(false);
  };

  const openDeleteConfirm = (messageId) => {
    setDeletingMessageId(messageId);
    setShowDeleteConfirm(true);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg">
        <div className="flex items-center gap-3 text-text-secondary">
          <Loader size={24} className="animate-spin" />
          <span className="text-sm font-medium">Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-bg-secondary/50 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-text flex items-center gap-2">
              <MessageSquare className="text-text-secondary" />
              Chat
            </h1>
            <p className="text-xs text-text-tertiary mt-0.5">
              Workspace conversation
            </p>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="shrink-0 px-8 py-3 bg-error-bg border-b border-error-border flex items-center gap-3 text-sm text-error-text">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto text-error-text/70 hover:text-error-text font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-8 py-6"
      >
        <div className="max-w-4xl mx-auto">
          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-text-secondary">
                <Loader size={16} className="animate-spin" />
                <span className="text-xs font-medium">Loading older messages...</span>
              </div>
            </div>
          )}

          {/* Has more indicator */}
          {!hasMore && messages.length > 0 && (
            <div className="text-center py-4">
              <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                Beginning of conversation
              </span>
            </div>
          )}

          {/* Messages list */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-text mb-2">No messages yet</h3>
              <p className="text-text-secondary text-sm max-w-md">
                Start the conversation by sending a message below.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwnMessage={message.authorId === user?.id}
                  onDelete={openDeleteConfirm}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} isLoading={isSending} />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingMessageId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmLabel="Delete Message"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ChatList;
