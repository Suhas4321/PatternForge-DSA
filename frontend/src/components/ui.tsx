import { ExternalLink } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Difficulty, Rust } from '../api/types'

export function Markdown({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className={`prose-forge ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}

const DIFF_STYLE: Record<Difficulty, string> = {
  Easy: 'text-emerald-hi border-emerald/40 bg-emerald/10',
  Medium: 'text-amber border-amber/40 bg-amber/10',
  Hard: 'text-crimson border-crimson/40 bg-crimson/10',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`rounded border px-1.5 py-px text-xs font-medium ${DIFF_STYLE[difficulty]}`}>{difficulty}</span>
  )
}

export function LeetCodeLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FFA116"
        d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"
      />
    </svg>
  )
}

/** Logo + #number linking straight to the problem on leetcode.com. */
export function LeetCodeLink({ lc, url, showLabel = false }: { lc: number; url: string; showLabel?: boolean }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-sm text-chalk hover:bg-white/[0.06]"
      title={`Open #${lc} on LeetCode`}
      onClick={(e) => e.stopPropagation()}
    >
      <LeetCodeLogo />
      <span>#{lc}</span>
      {showLabel && (
        <>
          <span className="font-sans text-muted">Open on LeetCode</span>
          <ExternalLink size={13} className="text-muted" />
        </>
      )}
    </a>
  )
}

export const RUST_META: Record<NonNullable<Rust>, { label: string; color: string; hint: string }> = {
  fresh: { label: 'Fresh', color: 'var(--color-emerald-hi)', hint: 'Practiced in the last 5 days' },
  dusty: { label: 'Dusty', color: 'var(--color-amber)', hint: '5+ days since you practiced this' },
  rusting: { label: 'Rusting', color: 'var(--color-rust)', hint: '10+ days: re-solve one soon' },
  rusted: { label: 'Rusted', color: 'var(--color-crimson)', hint: '21+ days: this pattern is fading' },
}

export function RustBadge({ rust }: { rust: Rust }) {
  if (!rust) return null
  const m = RUST_META[rust]
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: m.color }} title={m.hint}>
      <span className="h-2 w-2 rounded-full" style={{ background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
      {m.label}
    </span>
  )
}

/** Solid surface for reading and coding: never glass, so text stays crisp. */
export function Panel({ title, children, className = '', aside }: { title?: ReactNode; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-line bg-panel ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h3 className="text-sm font-semibold text-chalk">{title}</h3>
          {aside}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

/** Floating liquid-glass container (navigation, journey nodes, capsules). */
export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`liquid-glass rounded-2xl ${className}`}>{children}</div>
}

type ButtonVariant = 'primary' | 'emerald' | 'glass' | 'outline' | 'ghost'

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  // Translucent cyan → indigo glass with a bright specular top edge
  primary:
    'text-white font-semibold border border-cyan/40 bg-[linear-gradient(135deg,rgb(0_240_255/0.28),rgb(99_102_241/0.32))] ' +
    'shadow-[inset_0_1px_0_0_rgb(255_255_255/0.35),0_8px_24px_-10px_rgb(0_240_255/0.5)] ' +
    'hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.4),0_0_22px_-2px_rgb(0_240_255/0.45)] hover:border-cyan/60',
  emerald:
    'text-white font-semibold border border-emerald-hi/40 bg-[linear-gradient(135deg,rgb(16_185_129/0.32),rgb(52_211_153/0.18))] ' +
    'shadow-[inset_0_1px_0_0_rgb(255_255_255/0.35),0_8px_24px_-10px_rgb(16_185_129/0.5)] ' +
    'hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.4),0_0_22px_-2px_rgb(52_211_153/0.45)]',
  glass:
    'text-chalk border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.16)]',
  outline:
    'text-chalk border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.16)]',
  ghost: 'text-muted hover:text-chalk hover:bg-white/[0.05]',
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm backdrop-blur-md transition-[background-color,box-shadow,border-color,transform] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/** Miniature glass keycap, e.g. <Kbd keys={['Ctrl', 'Enter']} /> */
export function Kbd({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {keys.map((k) => (
        <kbd key={k} className="keycap">
          {k}
        </kbd>
      ))}
    </span>
  )
}

/** Circular progress ring (SVG). */
export function ProgressRing({ value, total, size = 44, stroke = 3.5, color = 'var(--color-cyan)', children }: {
  value: number
  total: number
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = total ? Math.min(1, value / total) : 0
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.8s ease', filter: pct ? `drop-shadow(0 0 4px ${color})` : undefined }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  )
}

/** 1–3 confidence stars from the Stage 4 rating. */
export function ConfidenceStars({ value }: { value: number | null }) {
  if (!value) return null
  return (
    <span className="inline-flex gap-0.5" aria-label={`Confidence ${value} of 3`}>
      {[1, 2, 3].map((i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
            fill={i <= value ? 'var(--color-gold)' : 'rgb(255 255 255 / 0.12)'}
          />
        </svg>
      ))}
    </span>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted" role="status">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      {label}
    </div>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return <div className="rounded-lg border border-crimson/40 bg-crimson/10 px-3 py-2 text-sm text-crimson">{message}</div>
}

export function formatRelative(iso: string | null): string {
  if (!iso) return 'never'
  const days = (Date.now() - new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).getTime()) / 86400000
  if (Math.abs(days) < 1) return days >= 0 ? 'today' : 'later today'
  const n = Math.round(Math.abs(days))
  return days >= 0 ? `${n} day${n === 1 ? '' : 's'} ago` : `in ${n} day${n === 1 ? '' : 's'}`
}
