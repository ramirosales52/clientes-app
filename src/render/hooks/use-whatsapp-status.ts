import { useCallback, useEffect, useState } from "react";
import { api } from "@render/lib/api";

interface WhatsappStatus {
  authenticated: boolean;
  ready: boolean;
  connected: boolean;
}

export function useWhatsappStatus() {
  const [status, setStatus] = useState<WhatsappStatus>({
    authenticated: false,
    ready: false,
    connected: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get<WhatsappStatus>("/whatsapp/status");
      setStatus(response.data);
    } catch {
      setStatus({ authenticated: false, ready: false, connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Polling cada 10 segundos
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    isConnected: status.connected,
    isAuthenticated: status.authenticated,
    loading,
    refresh: fetchStatus,
  };
}
