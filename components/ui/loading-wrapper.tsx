import React, { useEffect, useRef } from 'react';

const LoadingWrapper: React.FC<{
  children: React.ReactNode;
  onLoad: () => void;
}> = ({ children, onLoad }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Set up MutationObserver to detect DOM changes
    const observer = new MutationObserver(() => {
      // Clear existing stability timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Set a new timeout to check for stability (500ms of no mutations)
      timeoutRef.current = setTimeout(() => {
        onLoad(); // Chart is stable, call onLoad
        observer.disconnect(); // Stop observing
      }, 500);
    });

    // Observe the chart container for all relevant changes
    observer.observe(chartRef.current, {
      childList: true,      // Detect additions/removals of child nodes
      attributes: true,     // Detect attribute changes
      characterData: true,  // Detect text content changes
      subtree: true,        // Monitor the entire subtree
    });

    // Fallback timeout to ensure onLoad is called if no mutations occur
    fallbackTimeoutRef.current = setTimeout(() => {
      onLoad(); // Force display after 2 seconds
      observer.disconnect();
    }, 2000);

    // Cleanup on unmount or when rendering completes
    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
    };
  }, [onLoad]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }}>{children}</div>;
};

export default LoadingWrapper;