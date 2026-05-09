import { useState, useEffect, useCallback, useRef } from 'react';

export interface ServiceInfo {
  id: string;
  serviceId: string;
  serviceName: string;
  numReplicas: number | null;
  region: string | null;
  source: string | null;
  builder: string | null;
  status: string | null;
  deployUrl: string | null;
  commitMessage: string | null;
  commitAuthor: string | null;
  domains: string[];
  isSleeping: boolean;
}

const SERVICES_URL = `${(window as any).__BACKEND_URL__ || ''}/api/services`;

export function useServices(trigger: number) {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    fetch(SERVICES_URL, { signal: ac.signal })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setServices([]); }
        else { setServices(data || []); }
        setLoading(false);
      })
      .catch((err: any) => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to fetch');
        setLoading(false);
      });
  }, []);

  useEffect(() => { refetch(); return () => abortRef.current?.abort(); }, [trigger]);

  return { services, loading, error, refetch };
}
