import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { MOCK_PREDICTIONS } from '../utils/mockData.js';

export const createPrediction = asyncHandler(async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database unavailable' });

  const { data, error } = await supabase
    .from('pd_ai_predictions')
    .insert({ ...req.body, created_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  res.status(201).json({ prediction: data });
});

export const getPredictions = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  if (!supabase) {
    const filtered = MOCK_PREDICTIONS.filter((p) => p.patient_id === patientId);
    return res.json({ predictions: filtered });
  }

  const { data, error } = await supabase
    .from('pd_ai_predictions')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  res.json({ predictions: data });
});
