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
  s.temp   = walk(s.temp,   0.1,  35.5, 38.5);

  // ~1% chance of fall per tick (~every 3 min at 2s intervals)
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
    source:        'simulator', // hardware compatibility tag
  };
}

// ── Unified telemetry pipeline ──────────────────────────────────────────────
// All telemetry (simulator OR MQTT) flows through this function.
// This is the single integration point for the hardware team.
export async function processTelemetry(data, io) {
  // 1. Broadcast via Socket.IO
  io.to(`patient:${data.patient_id}`).emit('telemetry', data);
  io.to('monitoring').emit('telemetry', data);

  // 2. Check thresholds → auto-generate alerts
  if (data.fall_detected || data.heart_rate > 130 || data.tremor_score > 0.85) {
    await checkTelemetryAlerts(data, io);
  }
}

async function saveToDB(data) {
  if (!supabase) return;
  try {
    await supabase.from('pd_telemetry').insert(data);
  } catch (err) {
    console.error('[Simulator] DB write failed:', err.message);
  }
}

// ── Simulator (interval ref stored for cleanup) ─────────────────────────────
let _intervalRef = null;

export function startMockSimulator(io) {
  // Prevent double-interval on hot-reload (node --watch)
  if (_intervalRef) {
    clearInterval(_intervalRef);
    _intervalRef = null;
  }

  console.log('🤖 [Simulator] Starting for patients:', PATIENTS.join(', '));

  _intervalRef = setInterval(async () => {
    for (const patientId of PATIENTS) {
      const data = generateTick(patientId);
      state[patientId].tick++;

      await processTelemetry(data, io);

      // Persist to DB every 5 ticks (10s) or on a fall event
      if (state[patientId].tick % 5 === 0 || data.fall_detected) {
        await saveToDB(data);
      }
    }
  }, config.simulator.intervalMs);
}

export function stopMockSimulator() {
  if (_intervalRef) {
    clearInterval(_intervalRef);
    _intervalRef = null;
    console.log('🤖 [Simulator] Stopped.');
  }
}

// Trigger a one-off manual fall event for demo purposes
export function triggerDemoFall(io, patientId = 'PD001') {
  const data = {
    ...generateTick(patientId),
    fall_detected: true,
    source: 'demo_trigger',
  };
  processTelemetry(data, io);
  saveToDB(data);
  console.log(`🚨 [Demo] Manual fall triggered for ${patientId}`);
  return data;
}
