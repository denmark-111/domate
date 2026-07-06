import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Loader, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/index.js';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChatRealtime from '../../hooks/useChatRealtime';
import ConfirmModal from '../common/ConfirmModal';

const PAGE_SIZE = 20;

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

  // Scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && isAtBottomRef.current) {
      const el = messagesContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Handle incoming realtime messages
  const onNewMessage = useCallback((message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const onDeleteMessage = useCallback((messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);
 
  const { broadcastMessage, broadcastDelete } = useChatRealtime(activeWorkspace?.id, onNewMessage, onDeleteMessage);

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

  // loadMore is defined BEFORE handleScroll to avoid TDZ
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

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distanceFromBottom < 100;

    // Load more when scrolling to top
    if (el.scrollTop < 100 && hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [isLoadingMore, hasMore, loadMore]);

  // Subscribe to scroll events
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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
      const el = messagesContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [isLoading]);

  const handleSend = async (content) => {
    if (!activeWorkspace?.id) return;
    setIsSending(true);
    const res = await chatService.sendMessage(activeWorkspace.id, content);
    if (res.success) {
      setMessages((prev) => [...prev, res.data]);
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
      broadcastDelete(deletingMessageId);
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
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-secondary min-h-0">
        <div className="flex items-center gap-3 text-text-secondary">
          <Loader size={20} className="animate-spin" />
          <span className="text-sm font-medium">Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-secondary min-h-0">
      {/* Header */}
      <header className="shrink-0 px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-text">Chat</h1>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="shrink-0 mx-8 mb-2 p-3 bg-error-bg border border-error-border rounded-lg flex items-center gap-2 text-sm text-error-text">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto text-error-text/70 hover:text-error-text font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-8 py-4 min-h-0"
      >
        <div className="max-w-4xl mx-auto">
          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-3">
              <div className="flex items-center gap-2 text-text-secondary">
                <Loader size={14} className="animate-spin" />
                <span className="text-xs font-medium">Loading older messages...</span>
              </div>
            </div>
          )}

          {/* Has more indicator */}
          {!hasMore && messages.length > 0 && (
            <div className="text-center py-3">
              <span className="text-[10px] font-medium text-text-tertiary">
                Beginning of conversation
              </span>
            </div>
          )}

          {/* Messages list */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center mb-4 border border-border">
                <MessageSquare size={22} className="text-text-secondary" />
              </div>
              <h3 className="text-base font-semibold text-text mb-1">No messages yet</h3>
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