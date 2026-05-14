import { supabase } from '../config/supabase.js';
import { checkTelemetryAlerts } from './alertService.js';
import { config } from '../config/env.js';

const PATIENTS = ['PD001', 'PD002', 'PD003'];

// Per-patient physiological state (random walk)
const state = {
  PD001: { hr: 78,  tremor: 0.35, temp: 36.8, lat: 19.0760, lng: 72.8777, tick: 0 },
  PD002: { hr: 82,  tremor: 0.52, temp: 37.0, lat: 28.7041, lng: 77.1025, tick: 0 },
  PD003: { hr: 71,  tremor: 0.28, temp: 36.5, lat: 12.9716, lng: 77.5946, tick: 0 },
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const walk  = (v, step, min, max) => clamp(v + (Math.random() - 0.5) * step * 2, min, max);
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

function generateTick(patientId) {
  const s = state[patientId];
  s.hr     = walk(s.hr,     3,    50,  150);
  s.tremor = walk(s.tremor, 0.06, 0,   1);
  s.temp   = walk(s.temp,   0.1,  35.5,38.5);

  // 1% chance of fall each tick (~every 3 min at 2s intervals)
  const fall_detected = Math.random() < 0.01;

  return {
    patient_id:    patientId,
    heart_rate:    round(s.hr, 1),
    tremor_score:  round(s.tremor, 2),
    temperature:   round(s.temp, 1),
    fall_detected,
    latitude:      round(s.lat + (Math.random() - 0.5) * 0.001, 6),
    longitude:     round(s.lng + (Math.random() - 0.5) * 0.001, 6),
    created_at:    new Date().toISOString(),
  };
}

async function saveToDB(data) {
  if (!supabase) return;
  try {
    await supabase.from('pd_telemetry').insert(data);
  } catch (err) {
    console.error('[Simulator] DB write failed:', err.message);
  }
}

export function startMockSimulator(io) {
  console.log('🤖 [Simulator] Starting for patients:', PATIENTS.join(', '));

  setInterval(async () => {
    for (const patientId of PATIENTS) {
      const data = generateTick(patientId);
      state[patientId].tick++;

      // Emit to patient-specific room
      io.to(`patient:${patientId}`).emit('telemetry', data);
      // Emit to global monitoring room (dashboard)
      io.to('monitoring').emit('telemetry', data);

      // Handle threshold alerts
      if (data.fall_detected || data.heart_rate > 130 || data.tremor_score > 0.85) {
        await checkTelemetryAlerts(data, io);
      }

      // Persist to DB every 5 ticks (10s) or on any event
      if (state[patientId].tick % 5 === 0 || data.fall_detected) {
        await saveToDB(data);
      }
    }
  }, config.simulator.intervalMs);
}
