/**
 * Visual building blocks from DESIGN_REFERENCES.md (Magic UI / Aceternity patterns, implemented
 * natively): BorderBeam, ShineBorder, DotPattern, NumberTicker, MagicCard, Stage, ThemeToggle.
 */
import { Moon, Sun } from 'lucide-react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { flushSync } from 'react-dom'

// ---------------------------------------------------------------------------
// Background effects control
// ---------------------------------------------------------------------------

export type BackgroundEffectLevel = 'off' | 'subtle' | 'full'
const BG_KEY = 'pf-bg-effects'

export function useBackgroundEffects(): { level: BackgroundEffectLevel; setLevel: (l: BackgroundEffectLevel) => void } {
  const [level, setLevelState] = useState<BackgroundEffectLevel>(() => {
    try {
      const stored = localStorage.getItem(BG_KEY)
      if (stored === 'off' || stored === 'subtle' || stored === 'full') return stored
    } catch { /* noop */ }
    return 'full'
  })

  const setLevel = (l: BackgroundEffectLevel) => {
    try { localStorage.setItem(BG_KEY, l) } catch { /* noop */ }
    setLevelState(l)
  }

  return { level, setLevel }
}


/** Light travelling around the border of its (relative, rounded) parent. */
export function BorderBeam({ duration = 6 }: { duration?: number }) {
  return <span aria-hidden="true" className="border-beam" style={{ animationDuration: `${duration}s` }} />
}

/** Animated gradient border, e.g. the World Boss frame. */
export function ShineBorder({ colors = ['var(--color-amber)', 'var(--color-crimson)', 'var(--color-gold)'] }: { colors?: string[] }) {
  return (
    <span
      aria-hidden="true"
      className="shine-border"
      style={{ backgroundImage: `radial-gradient(transparent, transparent, ${colors.join(', ')}, transparent, transparent)` }}
    />
  )
}

/** SVG dot grid filling its (relative) parent. */
export function DotPattern({ gap = 22, radius = 1.1, color = 'color-mix(in srgb, var(--color-chalk) 8%, transparent)', className = '' }: {
  gap?: number
  radius?: number
  color?: string
  className?: string
}) {
  const id = useId()
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
      <defs>
        <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse">
          <circle cx={gap / 2} cy={gap / 2} r={radius} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/** Counts up to `value` when scrolled into view. */
export function NumberTicker({ value, className = '' }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)
  useEffect(() => {
    if (!inView || reduce) {
      setShown(value)
      return
    }
    const controls = animate(0, value, { duration: 1.1, ease: 'easeOut', onUpdate: (v) => setShown(Math.round(v)) })
    return () => controls.stop()
  }, [inView, value, reduce])
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {shown}
    </span>
  )
}

/** Card with a spotlight that follows the cursor. */
export function MagicCard({ children, className = '', spotlight = 'rgb(0 240 255 / 0.14)', style }: {
  children: ReactNode
  className?: string
  spotlight?: string
  style?: CSSProperties
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
  }
  return (
    <div className={`relative overflow-hidden ${className}`} style={style} onMouseMove={onMove} onMouseLeave={() => setPos(null)}>
      {pos && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity"
          style={{ background: `radial-gradient(180px circle at ${pos.x}px ${pos.y}px, ${spotlight}, transparent 70%)` }}
        />
      )}
      {children}
    </div>
  )
}

/** Zone 3 theater stage: pitch-carbon frame with a dot pattern. */
export function Stage({ children, className = '', dots = true, style }: { children: ReactNode; className?: string; dots?: boolean; style?: CSSProperties }) {
  return (
    <div className={`stage relative overflow-hidden rounded-3xl ${className}`} style={style}>
      {dots && <DotPattern />}
      <div className="relative h-full flex flex-col">{children}</div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Theme polarity
// ------------------------------------------------------------------------------------------
// Theme polarity (3-way: Light / Dark / System)
// ------------------------------------------------------------------------------------------

export type ThemePreference = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'
export type Theme = 'dark' | 'light' | 'carbon-dark' | 'paper' | 'studio-contrast'
const STORAGE_KEY = 'pf-theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return 'dark'
}

function resolveStoredTheme(stored: string | null): { preference: ThemePreference; resolved: ResolvedTheme } {
  if (stored === 'light' || stored === 'paper' || stored === 'studio-contrast') {
    return { preference: 'light', resolved: 'light' }
  }
  if (stored === 'dark' || stored === 'carbon-dark') {
    return { preference: 'dark', resolved: 'dark' }
  }
  return { preference: 'system', resolved: getSystemTheme() }
}

export function useTheme(): [ResolvedTheme, (t: ThemePreference | Theme) => void, ThemePreference] {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return resolveStoredTheme(stored).preference
  })

  const [resolved, setResolvedState] = useState<ResolvedTheme>(() => {
    if (typeof document !== 'undefined') {
      const docTheme = document.documentElement.dataset.theme
      if (docTheme === 'light' || docTheme === 'paper' || docTheme === 'studio-contrast') return 'light'
      if (docTheme === 'dark' || docTheme === 'carbon-dark') return 'dark'
    }
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return resolveStoredTheme(stored).resolved
  })

  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem(STORAGE_KEY)
      const res = resolveStoredTheme(stored)
      setPreference(res.preference)
      setResolvedState(res.resolved)
    }
    window.addEventListener('pf-theme-changed', handler)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const onMediaChange = (e: MediaQueryListEvent) => {
      const currentStored = localStorage.getItem(STORAGE_KEY)
      if (!currentStored || currentStored === 'system') {
        const nextResolved: ResolvedTheme = e.matches ? 'light' : 'dark'
        document.documentElement.dataset.theme = nextResolved
        setResolvedState(nextResolved)
        window.dispatchEvent(new CustomEvent('pf-theme-changed', { detail: { preference: 'system', resolved: nextResolved } }))
      }
    }
    mediaQuery.addEventListener('change', onMediaChange)

    const observer = new MutationObserver(() => {
      const docTheme = document.documentElement.dataset.theme
      const curResolved: ResolvedTheme = (docTheme === 'light' || docTheme === 'paper' || docTheme === 'studio-contrast') ? 'light' : 'dark'
      setResolvedState(curResolved)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      window.removeEventListener('pf-theme-changed', handler)
      mediaQuery.removeEventListener('change', onMediaChange)
      observer.disconnect()
    }
  }, [])

  const setTheme = (t: ThemePreference | Theme) => {
    let pref: ThemePreference = 'system'
    if (t === 'light' || t === 'paper' || t === 'studio-contrast') pref = 'light'
    else if (t === 'dark' || t === 'carbon-dark') pref = 'dark'
    else if (t === 'system') pref = 'system'

    const nextResolved: ResolvedTheme = pref === 'system' ? getSystemTheme() : pref
    document.documentElement.dataset.theme = nextResolved
    try {
      localStorage.setItem(STORAGE_KEY, pref)
    } catch {
      /* private mode: won't persist */
    }
    setPreference(pref)
    setResolvedState(nextResolved)
    window.dispatchEvent(new CustomEvent('pf-theme-changed', { detail: { preference: pref, resolved: nextResolved } }))
  }

  return [resolved, setTheme, preference]
}

/** Clean 2-way toggle (Dark 🌙 <-> Light ☀️) with circular reveal view transition (no confusing Auto step) */
export function ThemeToggle() {
  const [resolved, setTheme] = useTheme()
  const ref = useRef<HTMLButtonElement>(null)
  const reduce = useReducedMotion()

  // Direct 2-way toggle: dark <-> light
  const nextPref: ThemePreference = resolved === 'dark' ? 'light' : 'dark'

  // the command palette asks for a switch through this event
  useEffect(() => {
    const onToggle = () => ref.current?.click()
    window.addEventListener('pf-toggle-theme', onToggle)
    return () => window.removeEventListener('pf-toggle-theme', onToggle)
  }, [])

  const toggle = () => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }
    if (!doc.startViewTransition || reduce || !ref.current) {
      setTheme(nextPref)
      return
    }
    const r = ref.current.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const t = doc.startViewTransition(() => flushSync(() => setTheme(nextPref)))
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 520, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
      )
    })
  }

  const label = resolved === 'light' ? 'Light Mode (Click for Dark)' : 'Dark Mode (Click for Light)'

  return (
    <button
      ref={ref}
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-panel-2 px-2.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-chalk"
    >
      {resolved === 'light' ? (
        <>
          <Sun size={14} className="text-amber shrink-0" />
          <span className="hidden lg:inline font-mono text-[11px] font-semibold tracking-tight uppercase text-amber">
            Light
          </span>
        </>
      ) : (
        <>
          <Moon size={14} className="text-cyan shrink-0" />
          <span className="hidden lg:inline font-mono text-[11px] font-semibold tracking-tight uppercase text-cyan">
            Dark
          </span>
        </>
      )}
    </button>
  )
}
