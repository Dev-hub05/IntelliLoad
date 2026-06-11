import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Custom hook to stream real-time test run metrics via Server-Sent Events (SSE)
 * @param {string|null} testId - The active test run ID to stream
 * @returns {Object} { metrics, error, connected }
 */
export function useSSE(testId) {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!testId) {
      setMetrics(null);
      setConnected(false);
      return;
    }

    const streamUrl = `${API_BASE_URL}/tests/${testId}/stream`;
    console.log(`Subscribing to SSE stream for test: ${testId}`);

    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;
    setConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMetrics(data);
        setError(null);
      } catch (err) {
        console.error('Failed to parse SSE event data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      setError('Connection to metrics stream failed.');
      setConnected(false);
      eventSource.close();
    };

    return () => {
      if (eventSourceRef.current) {
        console.log(`Closing SSE stream for test: ${testId}`);
        eventSourceRef.current.close();
        setConnected(false);
      }
    };
  }, [testId]);

  return { metrics, error, connected };
}

export default useSSE;
