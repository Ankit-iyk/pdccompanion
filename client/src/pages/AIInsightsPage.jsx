import { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react';
import { usePatients } from '../hooks/usePatients.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import api from '../services/api.js';
import { useEffect } from 'react';

const MOCK_PREDICTIONS = [
  { patient_id: 'PD001', prediction_type: 'tremor_severity',    confidence: 0.87, result: { label: 'Moderate-Severe', stage: 3, trend: 'worsening'  } },
  { patient_id: 'PD001', prediction_type: 'fall_risk',          confidence: 0.72, result: { label: 'High Risk',       score: 0.72, factors: ['gait instability', 'medication timing'] } },
  { patient_id: 'PD002', prediction_type: 'tremor_severity',    confidence: 0.91, result: { label: 'Severe',          stage: 4, trend: 'stable'     } },
  { patient_id: 'PD002', prediction_type: 'medication_response',confidence: 0.65, result: { label: 'Partial Response',recommendation: 'Consult neurologist for dosage adjustment' } },
  { patient_id: 'PD003', prediction_type: 'tremor_severity',    confidence: 0.84, result: { label: 'Mild-Moderate',   stage: 2, trend: 'improving'  } },
  { patient_id: 'PD003', prediction_type: 'fall_risk',          confidence: 0.41, result: { label: 'Low Risk',        score: 0.41, factors: ['good balance score'] } },
];

const MOCK_PATIENTS = [
  { id: 'PD001', name: 'Marcus Thompson',   avatar_initials: 'MT' },
  { id: 'PD002', name: 'Eleanor Rodriguez', avatar_initials: 'ER' },
  { id: 'PD003', name: 'James Chen',        avatar_initials: 'JC' },
];

const typeLabels = {
  tremor_severity:    '🧠 Tremor Severity',
  fall_risk:          '⚠️ Fall Risk',
  medication_response:'💊 Medication Response',
};

function TrendIcon({ trend }) {
  if (trend === 'worsening') return <TrendingDown className="w-4 h-4 text-red-400" />;
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-400" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct > 80 ? 'bg-green-500' : pct > 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8">{pct}%</span>
    </div>
  );
}

export default function AIInsightsPage() {
  const { patients } = usePatients();
  const [selected, setSelected] = useState('PD001');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayPatients = patients.length ? patients : MOCK_PATIENTS;

  useEffect(() => {
    setLoading(true);
    api.get(`/predictions/${selected}`)
      .then(({ data }) => setPredictions(data.predictions.length ? data.predictions : MOCK_PREDICTIONS.filter(p => p.patient_id === selected)))
      .catch(() => setPredictions(MOCK_PREDICTIONS.filter(p => p.patient_id === selected)))
      .finally(() => setLoading(false));
  }, [selected]);

  const patient = displayPatients.find((p) => p.id === selected) || displayPatients[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" /> AI Insights
          </h1>
          <p className="text-slate-500 text-sm mt-1">ML model predictions and clinical analysis</p>
        </div>
        {/* Patient selector */}
        <div className="relative">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-8 text-sm text-white focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            {displayPatients.map((p) => (
              <option key={p.id} value={p.id} className="bg-navy-700">{p.name || p.id}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Patient header */}
      {patient && (
        <div className="glass-card p-5 border border-purple-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center text-white font-bold">
            {patient.avatar_initials || patient.name?.slice(0,2)}
          </div>
          <div>
            <p className="font-semibold text-white">{patient.name || patient.id}</p>
            <p className="text-xs text-slate-500">
              {patient.age ? `Age ${patient.age} · ` : ''}Stage {patient.diagnosis_stage || '—'} Parkinson's
            </p>
          </div>
          <div className="ml-auto text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg">
            {predictions.length} predictions
          </div>
        </div>
      )}

      {/* Prediction cards */}
      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictions.map((pred, i) => (
            <div key={pred.id || i} className="glass-card p-5 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  {typeLabels[pred.prediction_type] || pred.prediction_type}
                </p>
                {pred.result?.trend && <TrendIcon trend={pred.result.trend} />}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white">{pred.result?.label || '—'}</span>
                {pred.result?.stage && (
                  <span className="text-xs text-slate-500">→ Stage {pred.result.stage}</span>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Confidence</p>
                <ConfidenceBar value={pred.confidence} />
              </div>

              {pred.result?.factors && (
                <div className="flex flex-wrap gap-1.5">
                  {pred.result.factors.map((f) => (
                    <span key={f} className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400">{f}</span>
                  ))}
                </div>
              )}

              {pred.result?.recommendation && (
                <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  💡 {pred.result.recommendation}
                </p>
              )}

              <p className="text-xs text-slate-600">
                {pred.created_at ? new Date(pred.created_at).toLocaleString() : 'Mock prediction'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
