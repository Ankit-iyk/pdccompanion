import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { MOCK_ALERTS } from '../utils/mockData.js';

export const createAlert = asyncHandler(async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database unavailable' });

  const { data, error } = await supabase
    .from('pd_alerts')
    .insert({ ...req.body, created_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  res.status(201).json({ alert: data });
});

export const getAlerts = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  if (!supabase) {
    const filtered = patientId === 'all'
      ? MOCK_ALERTS
      : MOCK_ALERTS.filter((a) => a.patient_id === patientId);
    return res.json({ alerts: filtered });
  }

  let query = supabase
    .from('pd_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (patientId !== 'all') query = query.eq('patient_id', patientId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  res.json({ alerts: data });
});

export const resolveAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!supabase) return res.json({ message: 'Resolved (mock mode)' });

  const { data, error } = await supabase
    .from('pd_alerts')
    .update({ resolved: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  res.json({ alert: data });
});
