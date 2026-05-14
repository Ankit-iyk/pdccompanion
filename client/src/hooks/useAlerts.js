import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { useSocket } from '../context/SocketContext.jsx';

export function useAlerts(patientId = 'all') {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, off }           = useSocket() || {};

  const fetchAlerts = useCallback(() => {
    api.get(`/alerts/${patientId}`)
      .then(({ data }) => setAlerts(data.alerts))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Real-time new alert injection
  useEffect(() => {
    if (!on) return;
    const handler = (alert) => {
      setAlerts((prev) => [alert, ...prev]);
    };
    on('new_alert', handler);
    return () => off?.('new_alert', handler);
  }, [on, off]);

  const resolve = async (id) => {
    await api.patch(`/alerts/${id}/resolve`);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
  };

  const unresolved = alerts.filter((a) => !a.resolved);

  return { alerts, unresolved, loading, resolve, refetch: fetchAlerts };
}
