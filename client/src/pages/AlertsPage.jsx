import { useState } from 'react';
import { Bell, CheckCircle, Filter } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import toast from 'react-hot-toast';

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function AlertsPage() {
  const [filter, setFilter]   = useState('all');
  const [showResolved, setShowResolved] = useState(false);
  const { alerts, loading, resolve } = useAlerts();

  const handleResolve = async (id) => {
    await resolve(id);
    toast.success('Alert resolved');
  };

  const displayed = alerts
    .filter((a) => {
      const sevMatch = filter === 'all' || a.severity === filter;
      const resMatch = showResolved ? true : !a.resolved;
      return sevMatch && resMatch;
    })
    .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical' && !a.resolved).length,
    high:     alerts.filter((a) => a.severity === 'high'     && !a.resolved).length,
    medium:   alerts.filter((a) => a.severity === 'medium'   && !a.resolved).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
        <p className="text-slate-500 text-sm mt-1">
          {alerts.filter((a) => !a.resolved).length} active alerts across all patients
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {[['critical', counts.critical], ['high', counts.high], ['medium', counts.medium]].map(([sev, count]) => (
          <div key={sev} className={`badge-${sev} px-4 py-2 text-sm`}>
            {count} {sev}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-slate-500" />
        {['all', 'critical', 'high', 'medium', 'low'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all capitalize ${
              filter === s
                ? 'bg-primary/20 border-primary/40 text-primary-light'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => setShowResolved(!showResolved)}
          className={`ml-auto px-3 py-1.5 rounded-xl text-xs border transition-all ${
            showResolved ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-slate-400'
          }`}
        >
          {showResolved ? '✓ Showing resolved' : 'Show resolved'}
        </button>
      </div>

      {/* Alert list */}
      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : displayed.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts" message="All clear! No alerts match your current filter." />
      ) : (
        <div className="space-y-3">
          {displayed.map((alert, i) => (
            <div
              key={alert.id || i}
              className={`glass-card p-4 border flex items-start gap-4 transition-all animate-fade-in
                ${!alert.resolved && alert.severity === 'critical' ? 'border-red-500/30' : 'border-white/5'}`}
            >
              <span className={`badge-${alert.severity} shrink-0 mt-0.5`}>{alert.severity}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{alert.message}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">Patient {alert.patient_id}</span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-500 uppercase">{alert.type}</span>
                  {alert.created_at && (
                    <span className="text-xs text-slate-600">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              {!alert.resolved && (
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-medium transition-all shrink-0"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolve
                </button>
              )}
              {alert.resolved && (
                <span className="text-xs text-green-400 shrink-0">✓ Resolved</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
