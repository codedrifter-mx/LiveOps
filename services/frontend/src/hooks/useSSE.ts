import { useState, useEffect } from 'react';
const SSE_URL = `${(window as any).__BACKEND_URL__ || ''}/api/events/stream`;
export interface IncidentEvent { id: string; type: 'incident' | 'recovery'; service: string; status: 'down' | 'healthy'; errorRate?: string; impactedUsers?: number; timestamp: string; lastHealthy?: string; }
export function useSSE() {
  const [lastEvent, setLastEvent] = useState<IncidentEvent | null>(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const es = new EventSource(SSE_URL);
    es.onopen = () => setConnected(true);
    es.onmessage = (e) => { try { setLastEvent(JSON.parse(e.data)); } catch {} };
    es.onerror = () => { setConnected(false); es.close(); };
    return () => es.close();
  }, []);
  return { lastEvent, connected };
}
