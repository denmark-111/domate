import { useEffect, useRef } from 'react';
import { MousePointer2 } from 'lucide-react';

const PeerCursorItem = ({ cursor }) => {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  return (
    <div
      className={`absolute pointer-events-none flex items-center gap-1.5 ${
        isMountedRef.current ? 'transition-transform duration-75 ease-linear will-change-transform' : ''
      }`}
      style={{
        transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`
      }}
    >
      <MousePointer2
        size={18}
        style={{ color: cursor.color, fill: cursor.color }}
        className="drop-shadow-md shrink-0"
      />
      <span
        className="px-2 py-0.5 rounded-full text-white text-[10px] font-semibold shadow-md whitespace-nowrap"
        style={{ backgroundColor: cursor.color }}
      >
        {cursor.fullName}
      </span>
    </div>
  );
};

const LiveCursorsOverlay = ({ cursors }) => {
  if (!cursors || Object.keys(cursors).length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {Object.entries(cursors).map(([userId, c]) => (
        <PeerCursorItem key={userId} cursor={c} />
      ))}
    </div>
  );
};

export default LiveCursorsOverlay;
