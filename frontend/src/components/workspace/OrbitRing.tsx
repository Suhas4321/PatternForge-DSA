interface OrbitRingProps {
  size?: number
  strokeWidth?: number
  className?: string
}

export default function OrbitRing({ size = 18, strokeWidth = 2, className = '' }: OrbitRingProps) {
  const radius = (size - strokeWidth * 2) / 2
  const center = size / 2

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Running code"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="animate-spin text-accent">
        {/* Track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeOpacity={0.25}
        />
        {/* Animated arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={`${radius * 2} ${radius * 4}`}
          strokeLinecap="round"
        />
        {/* Orbiting dot */}
        <circle
          cx={center + radius}
          cy={center}
          r={strokeWidth * 0.9}
          fill="currentColor"
          className="drop-shadow-[0_0_4px_currentColor]"
        />
      </svg>
    </div>
  )
}
