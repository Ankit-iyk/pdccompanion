import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

const MAX_POINTS = 30; // sliding window size

// Returns live telemetry for ALL patients (monitoring room)
export function useLiveTelemetry() {
  const { on, off } = useSocket() || {};
  // Map of patientId -> latest reading
  const [latest, setLatest] = useState({});
  // Map of patientId -> array of last MAX_POINTS readings
  const [history, setHistory] = useState({});

  useEffect(() => {
    if (!on) return;
    const handler = (data) => {
      const pid = data.patient_id;
      setLatest((prev) => ({ ...prev, [pid]: data }));
      setHistory((prev) => {
        const arr = [...(prev[pid] || []), { ...data, time: new Date().toLocaleTimeString() }];
        return { ...prev, [pid]: arr.slice(-MAX_POINTS) };
      });
    };
    on('telemetry', handler);
    return () => off?.('telemetry', handler);
  }, [on, off]);

  return { latest, history };
}

// Returns live telemetry for a specific patient
export function usePatientTelemetry(patientId) {
  const { on, off, joinPatient, leavePatient } = useSocket() || {};
  const [data, setData]       = useState([]);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    if (!patientId || !joinPatient) return;
    joinPatient(patientId);
    const handler = (d) => {
      if (d.patient_id !== patientId) return;
      setCurrent(d);
      setData((prev) => [...prev, { ...d, time: new Date().toLocaleTimeString() }].slice(-MAX_POINTS));
    };
    on?.('telemetry', handler);
    return () => { off?.('telemetry', handler); leavePatient?.(patientId); };
  }, [patientId, on, off, joinPatient, leavePatient]);

  return { data, current };
}
