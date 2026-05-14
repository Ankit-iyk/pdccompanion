// Reusable skeleton shimmer blocks — uses .skeleton CSS class from index.css

function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="h-4 w-56" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-5 border border-white/5 space-y-3">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-8 w-16" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5 border border-white/5">
          <SkeletonBlock className="h-4 w-32 mb-4" />
          <SkeletonBlock className="h-52 w-full" />
        </div>
        <div className="glass-card p-5 border border-white/5 space-y-3">
          <SkeletonBlock className="h-4 w-28 mb-4" />
          {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-14 w-full" />)}
        </div>
      </div>
      {/* Patient cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-5 border border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-11 h-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SkeletonBlock className="h-9" />
              <SkeletonBlock className="h-9" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PatientDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="w-9 h-9 rounded-xl" />
        <SkeletonBlock className="w-14 h-14 rounded-2xl" />
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-4 border border-white/5 space-y-2">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-7 w-24" />
          </div>
        ))}
      </div>
      <div className="glass-card p-5 border border-white/5">
        <SkeletonBlock className="h-4 w-32 mb-4" />
        <SkeletonBlock className="h-52 w-full" />
      </div>
    </div>
  );
}

export function AlertsSkeleton() {
  return (
    <div className="space-y-3 animate-fade-in">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="glass-card p-4 border border-white/5 flex items-center gap-4">
          <SkeletonBlock className="h-6 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-3 w-1/3" />
          </div>
          <SkeletonBlock className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
