import { useState, useEffect, useMemo } from 'react';

export function useVirtualScroll({ containerRef, itemHeight, itemCount, overscan = 5 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };

    handleScroll();
    handleResize();

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  const { startIndex, endIndex, paddingTop, paddingBottom } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(itemCount, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);
    
    return {
      startIndex: start,
      endIndex: end,
      paddingTop: start * itemHeight,
      paddingBottom: (itemCount - end) * itemHeight,
    };
  }, [scrollTop, containerHeight, itemHeight, itemCount, overscan]);

  return { startIndex, endIndex, paddingTop, paddingBottom };
}
