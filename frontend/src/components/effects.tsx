/**
 * Visual building blocks from DESIGN_REFERENCES.md (Magic UI / Aceternity patterns, implemented
 * natively): BorderBeam, ShineBorder, DotPattern, NumberTicker, MagicCard, Stage, ThemeToggle.
 */
import { Moon, Sun } from 'lucide-react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { flushSync } from 'react-dom'

/** Light travelling around the border of its (relative, rounded) parent. */
export function BorderBeam({ duration = 6 }: { duration?: number }) {
  return <span aria-hidden="true" className="border-beam" style={{ animationDuration: `${duration}s` }} />
}

/** Animated gradient border, e.g. the World Boss frame. */
export function ShineBorder({ colors = ['#f59e0b', '#f43f5e', '#fbbf24'] }: { colors?: string[] }) {
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
export function Stage({ children, className = '', dots = true }: { children: ReactNode; className?: string; dots?: boolean }) {
  return (
    <div className={`stage relative overflow-hidden rounded-3xl ${className}`}>
      {dots && <DotPattern />}
      <div className="relative">{children}</div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Theme polarity
// ------------------------------------------------------------------------------------------

export type Theme = 'studio-contrast' | 'carbon-dark'
const STORAGE_KEY = 'pf-theme'

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme) || 'studio-contrast',
  )
  const setTheme = (t: Theme) => {
    document.documentElement.dataset.theme = t
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* private mode: theme just won't persist */
    }
    setThemeState(t)
  }
  return [theme, setTheme]
}

/** Sun/moon switch with a circular reveal from the button (View Transitions API when available). */
export function ThemeToggle() {
  const [theme, setTheme] = useTheme()
  const ref = useRef<HTMLButtonElement>(null)
  const reduce = useReducedMotion()
  const next: Theme = theme === 'studio-contrast' ? 'carbon-dark' : 'studio-contrast'

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
      aria-label={theme === 'studio-contrast' ? 'Switch to carbon dark' : 'Switch to studio contrast'}
      title={theme === 'studio-contrast' ? 'Carbon dark' : 'Studio contrast'}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel-2 text-muted transition-colors hover:text-chalk"
    >
      {theme === 'studio-contrast' ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  )
}
