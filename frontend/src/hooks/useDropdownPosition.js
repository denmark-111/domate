import { useState, useLayoutEffect, useCallback } from 'react';

/**
 * Custom hook to position fixed portal dropdowns dynamically within visible viewport bounds.
 * Prevents dropdowns from getting cut off on small screens or near screen edges.
 */
export function useDropdownPosition(triggerRef, isOpen, options = {}) {
  const { minWidth = 240, maxWidth = 320, margin = 12 } = options;

  const [style, setStyle] = useState({});

  const updatePosition = useCallback(() => {
    if (!triggerRef?.current || !isOpen) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const effectiveMaxWidth = Math.min(maxWidth, vw - margin * 2);
    const effectiveMinWidth = Math.min(minWidth, effectiveMaxWidth);

    // Keep dropdown horizontally within visible bounds
    const left = Math.max(margin, Math.min(rect.left, vw - effectiveMaxWidth - margin));

    const spaceBelow = vh - rect.bottom - margin - 6;
    const spaceAbove = rect.top - margin - 6;

    // Open upward if space below is less than 220px and space above is greater
    const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow;

    if (openUpward) {
      const availableHeight = Math.max(140, Math.min(380, spaceAbove));
      setStyle({
        position: 'fixed',
        zIndex: 100,
        bottom: `${vh - rect.top + 6}px`,
        left: `${left}px`,
        minWidth: `${effectiveMinWidth}px`,
        maxWidth: `${effectiveMaxWidth}px`,
        maxHeight: `${availableHeight}px`,
        overflowY: 'auto',
      });
    } else {
      const availableHeight = Math.max(140, Math.min(380, spaceBelow));
      setStyle({
        position: 'fixed',
        zIndex: 100,
        top: `${rect.bottom + 6}px`,
        left: `${left}px`,
        minWidth: `${effectiveMinWidth}px`,
        maxWidth: `${effectiveMaxWidth}px`,
        maxHeight: `${availableHeight}px`,
        overflowY: 'auto',
      });
    }
  }, [triggerRef, isOpen, minWidth, maxWidth, margin]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  return style;
}

export default useDropdownPosition;
