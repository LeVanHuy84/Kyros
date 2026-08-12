import { useEffect } from 'react';

const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

const getApiBaseUrl = (): string => import.meta.env.VITE_API_URL || '/api';

const pingBackendHealth = async (): Promise<void> => {
  try {
    await fetch(`${getApiBaseUrl()}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch {
    // Best-effort keep-alive only; never surface errors to the user.
  }
};

export const useBackendKeepAlive = (): void => {
  useEffect(() => {
    const ping = () => {
      pingBackendHealth();
    };

    ping();
    const interval = setInterval(ping, KEEP_ALIVE_INTERVAL_MS);
    document.addEventListener('visibilitychange', ping);
    window.addEventListener('focus', ping);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', ping);
      window.removeEventListener('focus', ping);
    };
  }, []);
};
