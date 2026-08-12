import { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';

const ChatInput = ({ onSend, isLoading, onTyping, onStopTyping }) => {
  const [content, setContent] = useState('');
  const inputRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const stopTypingTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stopTypingTimerRef.current) {
        clearTimeout(stopTypingTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);

    const trimmed = val.trim();
    if (!trimmed) {
      if (stopTypingTimerRef.current) {
        clearTimeout(stopTypingTimerRef.current);
        stopTypingTimerRef.current = null;
      }
      onStopTyping?.();
      return;
    }

    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      onTyping?.();
      lastTypingSentRef.current = now;
    }

    if (stopTypingTimerRef.current) {
      clearTimeout(stopTypingTimerRef.current);
    }
    stopTypingTimerRef.current = setTimeout(() => {
      onStopTyping?.();
      stopTypingTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    if (inputRef.current && !content) {
      inputRef.current.style.height = 'auto';
    }
  }, [content]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    if (stopTypingTimerRef.current) {
      clearTimeout(stopTypingTimerRef.current);
      stopTypingTimerRef.current = null;
    }
    onStopTyping?.();

    try {
      await onSend(trimmed);
      setContent('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
      inputRef.current?.focus();
    } catch {
      // Error handled by parent
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-outline-variant bg-surface-container-lowest px-4 sm:px-8 py-4">
      <div className="max-w-4xl mx-auto flex gap-3 items-end">
        <textarea
          ref={inputRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (stopTypingTimerRef.current) {
              clearTimeout(stopTypingTimerRef.current);
              stopTypingTimerRef.current = null;
            }
            onStopTyping?.();
          }}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT text-sm font-body-md text-on-surface placeholder:text-outline resize-none outline-none focus:border-primary transition-colors"
          style={{ minHeight: '44px', maxHeight: '140px' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            const border = e.target.offsetHeight - e.target.clientHeight;
            e.target.style.height = Math.min(e.target.scrollHeight + border, 140) + 'px';
          }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="shrink-0 px-4 py-2.5 bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-on-primary rounded-DEFAULT transition-opacity flex items-center gap-2 font-label-caps text-xs font-bold uppercase"
          style={{ minHeight: '44px' }}
        >
          {isLoading ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          Send
        </button>
      </div>
    </form>
  );
};

export default ChatInput;

