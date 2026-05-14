import { AlertTriangle, X } from 'lucide-react';

export default function AlertBanner({ alerts, onDismiss }) {
  const critical = alerts.filter((a) => a.severity === 'critical' && !a.resolved);
  if (!critical.length) return null;

  return (
    <div className="space-y-2 animate-fade-in">
      {critical.slice(0, 3).map((alert) => (
        <div
          key={alert.id || alert.patient_id}
          className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 sos-ring"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-300">
              🚨 Critical Alert — Patient {alert.patient_id}
            </p>
            <p className="text-xs text-red-400/80 mt-0.5 truncate">{alert.message}</p>
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(alert.id)}
              className="text-red-400/60 hover:text-red-300 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
