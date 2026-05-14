import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { usePatients } from '../hooks/usePatients.js';
import { useLiveTelemetry } from '../hooks/useTelemetry.js';
import PatientCard from '../components/PatientCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';

const MOCK_PATIENTS = [
  { id: 'PD001', name: 'Marcus Thompson',   age: 68, diagnosis_stage: 2, avatar_initials: 'MT', emergency_contact: '+91-98765-43210' },
  { id: 'PD002', name: 'Eleanor Rodriguez', age: 72, diagnosis_stage: 3, avatar_initials: 'ER', emergency_contact: '+91-98765-43211' },
  { id: 'PD003', name: 'James Chen',        age: 65, diagnosis_stage: 2, avatar_initials: 'JC', emergency_contact: '+91-98765-43212' },
];

const STAGE_LABELS = ['', 'Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Stage V'];

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { patients, loading } = usePatients();
  const { latest } = useLiveTelemetry();

  const displayPatients = patients.length ? patients : MOCK_PATIENTS;

  const filtered = displayPatients.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search);
    const matchFilter = filter === 'all' || String(p.diagnosis_stage) === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Patients</h1>
          <p className="text-slate-500 text-sm mt-1">{displayPatients.length} patients under monitoring</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or patient ID…"
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['all', '1', '2', '3', '4', '5'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                filter === s
                  ? 'bg-primary/20 border-primary/40 text-primary-light'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : STAGE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No patients found" message="Try adjusting your search or filter." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PatientCard key={p.id} patient={p} telemetry={latest[p.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
