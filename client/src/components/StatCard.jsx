export default function StatCard({ label, value, icon: Icon, color = 'blue', sub, pulse = false }) {
  const colors = {
    blue:   { bg: 'bg-blue-500/10',   icon: 'text-blue-400',   border: 'border-blue-500/20'   },
    amber:  { bg: 'bg-amber-500/10',  icon: 'text-amber-400',  border: 'border-amber-500/20'  },
    green:  { bg: 'bg-emerald-500/10',icon: 'text-emerald-400',border: 'border-emerald-500/20'},
    red:    { bg: 'bg-red-500/10',    icon: 'text-red-400',    border: 'border-red-500/20'    },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`glass-card p-5 border ${c.border} flex items-start gap-4 animate-fade-in transition-all hover:scale-[1.01]`}>
      <div className={`p-3 rounded-xl ${c.bg} shrink-0 ${pulse ? 'sos-ring' : ''}`}>
        <Icon className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
