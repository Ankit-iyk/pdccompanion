import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { useSocket } from '../context/SocketContext.jsx';

export function useAlerts(patientId = 'all') {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, off }           = useSocket() || {};

  const fetchAlerts = useCallback(() => {
    const endpoint = patientId === 'all' ? '/alerts/all' : `/alerts/${patientId}`;
    api.get(endpoint)
      .then(({ data }) => setAlerts(data.alerts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Real-time new alert injection — filtered by patientId when on detail page
  useEffect(() => {
    if (!on) return;
    const handler = (alert) => {
      if (!alert) return;
      // Only inject if global view OR alert matches this patient
      if (patientId !== 'all' && alert.patient_id !== patientId) return;
      setAlerts((prev) => {
        // Prevent duplicate injection (same id already in list)
        if (alert.id && prev.some((a) => a.id === alert.id)) return prev;
        return [alert, ...prev];
      });
    };
    on('new_alert', handler);
    return () => off?.('new_alert', handler);
  }, [on, off, patientId]);

  // Safe resolve — guards against undefined id (real-time injected alerts before DB confirms)
  const resolve = async (id) => {
    if (!id) return;
    await api.patch(`/alerts/${id}/resolve`);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
  };

  const unresolved = alerts.filter((a) => !a.resolved);

  return { alerts, unresolved, loading, resolve, refetch: fetchAlerts };
}
