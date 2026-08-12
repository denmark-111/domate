import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Loader, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/index.js';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
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

  const { typingUsers, sendTyping, sendStopTyping } = useChatRealtime(
    activeWorkspace?.id,
    onNewMessage,
    onDeleteMessage,
    user
  );

  // Scroll to bottom when new messages arrive or typing status changes (only if already at bottom)
  useEffect(() => {
    if ((messages.length > prevMessageCountRef.current || typingUsers.length > 0) && isAtBottomRef.current) {
      const el = messagesContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, typingUsers.length]);

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
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = pageData.filter((m) => !existingIds.has(m.id));
        return [...newMessages, ...prev];
      });
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
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest min-h-0">
        <div className="flex items-center gap-3 text-secondary">
          <Loader size={20} className="animate-spin" />
          <span className="text-sm font-medium">Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface dark:bg-background min-h-0">

      {/* Error banner */}
      {error && (
        <div className="shrink-0 mx-4 sm:mx-8 my-2 p-3 bg-error-container border border-error rounded-DEFAULT flex items-center gap-2 text-xs text-on-error-container font-medium">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto text-on-error-container/80 hover:text-on-error-container font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 py-4 min-h-0 bg-surface dark:bg-background"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-3">
              <div className="flex items-center gap-2 text-secondary">
                <Loader size={14} className="animate-spin text-primary" />
                <span className="font-mono-label text-xs font-medium">Loading older messages...</span>
              </div>
            </div>
          )}

          {/* Date Separator / Beginning of conversation */}
          {!hasMore && messages.length > 0 && (
            <div className="flex items-center justify-center relative w-full my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-b border-outline-variant"></div>
              </div>
              <div className="relative bg-surface-container-lowest px-4 font-mono-label text-[11px] font-bold uppercase tracking-wider text-secondary">
                BEGINNING OF CHAT
              </div>
            </div>
          )}

          {/* Messages list */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-DEFAULT bg-surface-container-low flex items-center justify-center mb-4 border border-outline-variant">
                <MessageSquare size={22} className="text-secondary" />
              </div>
              <h3 className="font-headline-md text-base font-bold text-on-surface mb-1">No messages yet</h3>
              <p className="font-body-sm text-secondary text-sm max-w-md">
                Start the conversation by sending a message below.
              </p>
              <TypingIndicator typingUsers={typingUsers} />
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
              <TypingIndicator typingUsers={typingUsers} />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0">
        <ChatInput
          onSend={handleSend}
          isLoading={isSending}
          onTyping={sendTyping}
          onStopTyping={sendStopTyping}
        />
      </div>

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