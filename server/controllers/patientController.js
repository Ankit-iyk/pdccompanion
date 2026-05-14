import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { MOCK_PATIENTS, MOCK_DEVICES } from '../utils/mockData.js';

export const getPatients = asyncHandler(async (req, res) => {
  if (!supabase) return res.json({ patients: MOCK_PATIENTS });

  const { data, error } = await supabase
    .from('pd_patients')
    .select('*, pd_devices(*)');

  if (error) throw new Error(error.message);
  res.json({ patients: data });
});

export const getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!supabase) {
    const patient = MOCK_PATIENTS.find((p) => p.id === id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    const devices = MOCK_DEVICES.filter((d) => d.patient_id === id);
    return res.json({ patient: { ...patient, devices } });
  }

  const { data, error } = await supabase
    .from('pd_patients')
    .select('*, pd_devices(*)')
    .eq('id', id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Patient not found' });
  res.json({ patient: data });
});
