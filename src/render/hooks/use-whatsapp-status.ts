import { useCallback, useEffect, useState } from "react";
import axios from "axios";

interface WhatsappStatus {
  authenticated: boolean;
  ready: boolean;
}

export function useWhatsappStatus() {
  const [status, setStatus] = useState<WhatsappStatus>({
    authenticated: false,
    ready: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await axios.get<WhatsappStatus>(
        "http://localhost:3000/whatsapp/status"
      );
      setStatus(response.data);
    } catch {
      setStatus({ authenticated: false, ready: false });
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
    isConnected: status.ready,
    isAuthenticated: status.authenticated,
    loading,
    refresh: fetchStatus,
  };
}
