import { supabase } from '../config/supabase.js';

// ── Alert cooldown map ──────────────────────────────────────────────────────
// Prevents alert storms: same alert type per patient limited to once per 60s
const cooldowns = new Map(); // key: `${patientId}:${type}` → timestamp

function isOnCooldown(patientId, type, cooldownMs = 60_000) {
  const key = `${patientId}:${type}`;
  const last = cooldowns.get(key) || 0;
  if (Date.now() - last < cooldownMs) return true;
  cooldowns.set(key, Date.now());
  return false;
}

export const createAlert = async (alertData) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('pd_alerts')
      .insert(alertData)
      .select()
      .single();
    if (error) { console.error('[Alert] DB insert error:', error.message); return null; }
    return data;
  } catch (err) {
    console.error('[Alert] createAlert failed:', err.message);
    return null;
  }
};

// Auto-triggered alert based on telemetry thresholds
// Safe to call on every tick — cooldown map prevents spamming
export const checkTelemetryAlerts = async (telemetry, io) => {
  const { patient_id, heart_rate, tremor_score, fall_detected } = telemetry;

  if (fall_detected && !isOnCooldown(patient_id, 'FALL', 30_000)) {
    const alert = await createAlert({
      patient_id,
      type:     'FALL',
      severity: 'critical',
      message:  `Fall detected near bedroom. Immediate assistance required.`,
      resolved: false,
    });
    if (alert) {
      io?.to('monitoring').emit('new_alert', alert);
      io?.to(`patient:${patient_id}`).emit('new_alert', alert);
      io?.emit('sos_alert', { patientId: patient_id, alert });
      console.log(`🚨 [Alert] FALL detected for ${patient_id}`);
    }
  }

  if (heart_rate > 130 && !isOnCooldown(patient_id, 'HR')) {
    const alert = await createAlert({
      patient_id,
      type:     'HR',
      severity: 'high',
      message:  `Heart rate critically elevated at ${Math.round(heart_rate)} bpm.`,
      resolved: false,
    });
    if (alert) {
      io?.to('monitoring').emit('new_alert', alert);
      io?.to(`patient:${patient_id}`).emit('new_alert', alert);
    }
  }

  if (tremor_score > 0.85 && !isOnCooldown(patient_id, 'TREMOR')) {
    const alert = await createAlert({
      patient_id,
      type:     'TREMOR',
      severity: 'high',
      message:  `Severe tremor activity detected (score: ${tremor_score.toFixed(2)}).`,
      resolved: false,
    });
    if (alert) {
      io?.to('monitoring').emit('new_alert', alert);
      io?.to(`patient:${patient_id}`).emit('new_alert', alert);
    }
  }
};
