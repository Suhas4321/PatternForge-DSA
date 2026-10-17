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
    return 'subtle'
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

export type Theme = 'carbon-dark' | 'paper'
const STORAGE_KEY = 'pf-theme'

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) as string | null) : null
    if (stored === 'paper' || stored === 'studio-contrast') return 'paper'
    if (stored === 'carbon-dark') return 'carbon-dark'
    const docTheme = typeof document !== 'undefined' ? document.documentElement.dataset.theme : null
    if (docTheme === 'paper' || docTheme === 'studio-contrast') return 'paper'
    return 'carbon-dark'
  })

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<Theme>
      if (custom.detail) {
        setThemeState(custom.detail)
      } else {
        const docTheme = (document.documentElement.dataset.theme as string)
        const current = (docTheme === 'paper' || docTheme === 'studio-contrast') ? 'paper' : 'carbon-dark'
        setThemeState(current)
      }
    }
    window.addEventListener('pf-theme-changed', handler)

    const observer = new MutationObserver(() => {
      const docTheme = (document.documentElement.dataset.theme as string)
      const current = (docTheme === 'paper' || docTheme === 'studio-contrast') ? 'paper' : 'carbon-dark'
      setThemeState(current)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      window.removeEventListener('pf-theme-changed', handler)
      observer.disconnect()
    }
  }, [])

  const setTheme = (t: Theme) => {
    document.documentElement.dataset.theme = t
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* private mode: theme just won't persist */
    }
    setThemeState(t)
    window.dispatchEvent(new CustomEvent('pf-theme-changed', { detail: t }))
  }
  return [theme, setTheme]
}

/** Sun/moon switch with a circular reveal from the button (View Transitions API when available). */
export function ThemeToggle() {
  const [theme, setTheme] = useTheme()
  const ref = useRef<HTMLButtonElement>(null)
  const reduce = useReducedMotion()
  const next: Theme = theme === 'carbon-dark' ? 'paper' : 'carbon-dark'

  // the command palette asks for a switch through this event
  useEffect(() => {
    const onToggle = () => ref.current?.click()
    window.addEventListener('pf-toggle-theme', onToggle)
    return () => window.removeEventListener('pf-toggle-theme', onToggle)
  }, [])

  const toggle = () => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }
    if (!doc.startViewTransition || reduce || !ref.current) {
      setTheme(next)
      return
    }
    const r = ref.current.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const t = doc.startViewTransition(() => flushSync(() => setTheme(next)))
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 520, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
      )
    })
  }

  return (
    <button
      ref={ref}
      onClick={toggle}
      aria-label={theme === 'carbon-dark' ? 'Switch to paper light' : 'Switch to carbon dark'}
      title={theme === 'carbon-dark' ? 'Paper light' : 'Carbon dark'}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel-2 text-muted transition-colors hover:text-chalk"
    >
      {theme === 'carbon-dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
