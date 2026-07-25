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
    <form onSubmit={handleSubmit} className="border-t border-border bg-bg-secondary px-4 sm:px-8 py-4">
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
          className="flex-1 px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text placeholder-text-tertiary resize-none outline-none focus:border-input-border-focus transition-colors"
          style={{ minHeight: '42px', maxHeight: '120px' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            const border = e.target.offsetHeight - e.target.clientHeight;
            e.target.style.height = Math.min(e.target.scrollHeight + border, 120) + 'px';
          }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="shrink-0 px-4 py-2.5 bg-button hover:bg-button-hover disabled:bg-button/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
          style={{ minHeight: '42px' }}
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

