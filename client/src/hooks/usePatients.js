import { useState, useEffect } from 'react';
import api from '../services/api.js';

export function usePatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    api.get('/patients')
      .then(({ data }) => setPatients(data.patients))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load patients'))
      .finally(() => setLoading(false));
  }, []);

  return { patients, loading, error };
}

export function usePatient(id) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/patients/${id}`)
      .then(({ data }) => setPatient(data.patient))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load patient'))
      .finally(() => setLoading(false));
  }, [id]);

  return { patient, loading, error };
}
