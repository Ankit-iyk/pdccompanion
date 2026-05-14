import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { checkTelemetryAlerts } from '../services/alertService.js';

let _io = null;
export const setIO = (io) => { _io = io; };

export const postTelemetry = asyncHandler(async (req, res) => {
  const record = { ...req.body, created_at: new Date().toISOString() };

  if (supabase) {
    const { error } = await supabase.from('pd_telemetry').insert(record);
    if (error) throw new Error(error.message);
  }

  // Trigger threshold-based alerts
  await checkTelemetryAlerts(record, _io);

  // Broadcast via Socket.IO
  _io?.to(`patient:${record.patient_id}`).emit('telemetry', record);
  _io?.to('monitoring').emit('telemetry', record);

  res.status(201).json({ message: 'Telemetry recorded', data: record });
});

export const getTelemetry = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const limit = parseInt(req.query.limit) || 50;

  if (!supabase) {
    return res.json({ telemetry: [] }); // simulator provides realtime data
  }

  const { data, error } = await supabase
    .from('pd_telemetry')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  res.json({ telemetry: data.reverse() }); // chronological order
});
