import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createAlert = async (alertData) => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('pd_alerts').insert(alertData).select().single();
  if (error) throw new Error(error.message);
  return data;
};

// Auto-triggered alert based on telemetry thresholds
export const checkTelemetryAlerts = async (telemetry, io) => {
  if (!supabase) return;
  const { patient_id, heart_rate, tremor_score, fall_detected } = telemetry;

  if (fall_detected) {
    const alert = await createAlert({
      patient_id,
      type: 'FALL',
      severity: 'critical',
      message: `Fall detected for patient ${patient_id}. Immediate assistance required.`,
      resolved: false,
    });
    io?.emit('new_alert', alert);
    io?.emit('sos_alert', { patientId: patient_id, alert });
  }

  if (heart_rate > 130) {
    const alert = await createAlert({
      patient_id,
      type: 'HR',
      severity: 'high',
      message: `Heart rate critically elevated: ${heart_rate} bpm for patient ${patient_id}.`,
      resolved: false,
    });
    io?.emit('new_alert', alert);
  }

  if (tremor_score > 0.85) {
    const alert = await createAlert({
      patient_id,
      type: 'TREMOR',
      severity: 'high',
      message: `Severe tremor detected (score: ${tremor_score}) for patient ${patient_id}.`,
      resolved: false,
    });
    io?.emit('new_alert', alert);
  }
};
