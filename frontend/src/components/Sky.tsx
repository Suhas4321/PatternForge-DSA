import { useEffect, useRef, useState } from 'react'
import { useBackgroundEffects, useTheme } from './effects'
import Galaxy from './vendor/react-bits/Galaxy'
import Aurora from './vendor/react-bits/Aurora'

export interface SkyProps {
  variant: 'galaxy' | 'aurora'
  /** Accent colour (hex or CSS var, e.g. '#6EE7B7' or 'var(--accent-dsa)') */
  accent?: string
  className?: string
}

// Module-level guardrail: ensures only ONE WebGL canvas is mounted across the entire app
let activeSkyInstanceId: string | null = null

export default function Sky({
  variant,
  accent = 'var(--accent-dsa, #6EE7B7)',
  className = '',
}: SkyProps) {
  const instanceIdRef = useRef<string>(`sky-${Math.random().toString(36).substring(2, 9)}`)
  const { level } = useBackgroundEffects()
  const [theme] = useTheme()
  const isPaper = theme === 'paper'

  const [isClient, setIsClient] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isDocHidden, setIsDocHidden] = useState(false)
  const [hasWebGLSlot, setHasWebGLSlot] = useState(false)

  // Resolve accent to computed color string for WebGL canvas consumption
  const [resolvedAccent, setResolvedAccent] = useState<string>(() => {
    if (typeof document !== 'undefined' && accent.startsWith('var(')) {
      const varName = accent.slice(4, -1).split(',')[0].trim()
      const computed = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      if (computed) return computed
    }
    return accent.startsWith('var(') ? (theme === 'paper' ? '#047857' : '#6EE7B7') : accent
  })

  useEffect(() => {
    if (accent.startsWith('var(')) {
      const varName = accent.slice(4, -1).split(',')[0].trim()
      const computed = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      setResolvedAccent(computed || (isPaper ? '#047857' : '#6EE7B7'))
    } else {
      setResolvedAccent(accent)
    }
  }, [accent, isPaper, theme])

  useEffect(() => {
    setIsClient(true)
    const checkMotion = () => {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    }
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMotion()
    checkViewport()

    // Claim WebGL slot if available
    const myId = instanceIdRef.current
    if (!activeSkyInstanceId || activeSkyInstanceId === myId) {
      activeSkyInstanceId = myId
      setHasWebGLSlot(true)
    }

    const onResize = () => checkViewport()
    const onVisibility = () => setIsDocHidden(document.hidden)

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      if (activeSkyInstanceId === myId) {
        activeSkyInstanceId = null
      }
    }
  }, [])

  // WebGL limits & guardrails:
  // 1. Off if level is 'off'
  // 2. Off if reduced motion preferred
  // 3. Off if mobile viewport < 768px
  // 4. Off if another WebGL canvas is active
  const canRunWebGL =
    isClient &&
    level !== 'off' &&
    !reducedMotion &&
    !isMobile &&
    hasWebGLSlot

  const isPaused = isDocHidden

  // Dynamic CSS color mixing for atmospheric glows and mountain ridge
  const accentGlow1 = `color-mix(in srgb, ${resolvedAccent} ${isPaper ? '10%' : '14%'}, transparent)`
  const accentGlow2 = `color-mix(in srgb, ${resolvedAccent} ${isPaper ? '7%' : '9%'}, transparent)`
  const mountainFill1 = isPaper
    ? `color-mix(in srgb, #DCD8CB 92%, ${resolvedAccent} 8%)`
    : `color-mix(in srgb, var(--surface-0, #090A0F) 92%, ${resolvedAccent} 8%)`
  const mountainFill2 = isPaper
    ? `color-mix(in srgb, #EAE6D9 94%, ${resolvedAccent} 6%)`
    : `color-mix(in srgb, var(--surface-0, #090A0F) 96%, ${resolvedAccent} 4%)`
  const mountainStroke = isPaper ? 'rgba(20, 20, 19, 0.10)' : 'rgba(255, 255, 255, 0.06)'

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none rounded-[inherit] ${className}`}
      style={{ zIndex: 0 }}
    >
      {/* 1. Base Static Gradient Glow (rendered in all modes for instant, zero-jank background) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: isPaper
            ? `
            radial-gradient(circle at 50% 12%, ${accentGlow1} 0%, transparent 70%),
            radial-gradient(circle at 15% 80%, ${accentGlow2} 0%, transparent 55%),
            radial-gradient(circle at 50% 50%, transparent 60%, rgba(220, 216, 205, 0.25) 100%)
          `
            : `
            radial-gradient(circle at 50% 12%, ${accentGlow1} 0%, transparent 70%),
            radial-gradient(circle at 15% 80%, ${accentGlow2} 0%, transparent 55%),
            radial-gradient(circle at 50% 50%, transparent 60%, rgba(9, 10, 15, 0.75) 100%)
          `,
        }}
      />

      {/* 2. WebGL Canvas: Galaxy or Aurora from React Bits */}
      {canRunWebGL && (
        <div className="absolute inset-0 h-full w-full">
          {variant === 'galaxy' ? (
            <Galaxy
              starColors={
                isPaper
                  ? [resolvedAccent, '#334155', '#475569', '#64748B']
                  : [resolvedAccent, '#F8FAFC', '#94A3B8', '#64748B']
              }
              density={level === 'subtle' ? 0.65 : 1.1}
              speed={level === 'subtle' ? 0.45 : 0.85}
              opacity={level === 'subtle' ? (isPaper ? 0.4 : 0.5) : (isPaper ? 0.65 : 0.8)}
              transparent
              lightMode={isPaper}
              disableAnimation={isPaused}
              className="h-full w-full"
            />
          ) : (
            <Aurora
              colorStops={
                isPaper
                  ? [resolvedAccent, '#DDD9CD', '#F3F2EC']
                  : [resolvedAccent, '#181B22', '#090A0F']
              }
              amplitude={level === 'subtle' ? 0.75 : 1.25}
              blend={0.5}
              speed={level === 'subtle' ? 0.4 : 0.75}
              opacity={level === 'subtle' ? 0.4 : 0.7}
              paused={isPaused}
              className="h-full w-full"
            />
          )}
        </div>
      )}

      {/* 3. Static 2-layer mountain silhouette SVG at the bottom edge */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full pointer-events-none"
        style={{ height: 'min(38%, 180px)', minHeight: '90px' }}
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
      >
        {/* Layer 1: Distant background mountain ridge */}
        <path
          d="M0,220 L0,130 L140,82 L290,135 L430,68 L580,128 L740,55 L890,122 L1030,62 L1190,134 L1330,76 L1440,118 L1440,220 Z"
          fill={mountainFill2}
          stroke={mountainStroke}
          strokeWidth="1"
          opacity="0.9"
        />
        {/* Layer 2: Foreground mountain ridge */}
        <path
          d="M0,220 L0,165 L180,112 L340,168 L490,98 L670,160 L830,90 L980,155 L1120,105 L1290,166 L1440,120 L1440,220 Z"
          fill={mountainFill1}
          stroke={mountainStroke}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}
