export function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-[14px] bg-gradient-to-br from-[#2A4074] to-[#4169B0] opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 64 64" width="48" height="48">
            <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#loading-brand)" />
            <rect x="4" y="4" width="56" height="56" rx="14" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" />
            <text
              x="32" y="33" textAnchor="middle" dominantBaseline="central"
              fontSize="38" fontWeight="700" fill="#ffffff"
              fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
            >
              $
            </text>
            <defs>
              <linearGradient id="loading-brand" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2A4074" />
                <stop offset="1" stopColor="#4169B0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <span className="text-sm font-medium animate-pulse text-muted-foreground">{label}</span>
    </div>
  );
}
