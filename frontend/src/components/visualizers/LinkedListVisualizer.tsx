import { motion } from 'motion/react'
import { useMemo } from 'react'
import type { HeapObject, TraceStep } from '../../api/types'
import { formatValue, isRef, visibleLocals } from '../../lib/trace'
import { SidePanels } from './parts'
import type { VisualizerProps } from './types'

const NODE_W = 68
const NODE_H = 42
const COL = NODE_W + 48
const ROW = NODE_H + 92
const PAD_X = 24
const PAD_Y = 36

const POINTER_COLORS: Record<string, string> = {
  curr: 'var(--viz-accent, #00f0ff)',
  prev: 'var(--viz-compare, #818cf8)',
  next: 'var(--viz-sorted, #10b981)',
  head: '#f59e0b',
  dummy: '#94a3b8',
  slow: '#38bdf8',
  fast: '#ec4899',
}

type Pos = { row: number; col: number }

const isNode = (o: HeapObject | undefined) => !!o && 'next' in o.fields
const refId = (v: unknown) => (isRef(v) ? String(v.$ref) : null)

/** Lay out nodes as chains (heads = nodes nothing points to), one row per chain. */
function chainLayout(heap: Record<string, HeapObject>, order: string[], placed: Map<string, Pos>, startRow: number) {
  const nodes = order.filter((id) => isNode(heap[id]) && !placed.has(id))
  const pointedTo = new Set(nodes.map((id) => refId(heap[id].fields.next)).filter(Boolean) as string[])
  const heads = nodes.filter((id) => !pointedTo.has(id))
  let row = startRow
  const visit = (start: string) => {
    let col = 0
    let cur: string | null = start
    let used = false
    while (cur && heap[cur] && !placed.has(cur)) {
      placed.set(cur, { row, col: col++ })
      used = true
      cur = refId(heap[cur].fields.next)
    }
    if (used) row++
  }
  heads.forEach(visit)
  // Anything left is on a cycle with no head: start anywhere on it.
  nodes.filter((id) => !placed.has(id)).forEach(visit)
  return row
}

/**
 * Stable layout across the whole trace: the structure at the first step decides the rows, nodes
 * created later get new rows in creation order. With `layout: current` (e.g. LRU cache),
 * layout follows list order at each step.
 */
function useLayout(steps: TraceStep[], step: TraceStep, mode: string | undefined) {
  return useMemo(() => {
    const placed = new Map<string, Pos>()
    if (mode === 'current') {
      chainLayout(step.heap, Object.keys(step.heap).sort((a, b) => +a - +b), placed, 0)
      return placed
    }
    let row = 0
    for (const s of steps) {
      const ids = Object.keys(s.heap).filter((id) => !placed.has(id) && isNode(s.heap[id]))
      if (ids.length) row = chainLayout(s.heap, ids.sort((a, b) => +a - +b), placed, row)
    }
    return placed
  }, [steps, step, mode])
}

const center = (p: Pos) => ({ x: PAD_X + p.col * COL + NODE_W / 2, y: PAD_Y + p.row * ROW + NODE_H / 2 })

function arrowPath(a: Pos, b: Pos, kind: 'next' | 'prev' | 'random'): string {
  const ca = center(a)
  const cb = center(b)
  if (kind === 'next' && a.row === b.row && b.col === a.col + 1) {
    return `M ${ca.x + NODE_W / 2} ${ca.y} L ${cb.x - NODE_W / 2 - 5} ${cb.y}`
  }
  if (a.row === b.row) {
    // Backward or long jumps on the same row curve below (next/prev) or above (random).
    const dir = kind === 'random' ? -1 : 1
    const lift = (24 + Math.abs(b.col - a.col) * 12) * dir
    const y0 = ca.y + (dir * NODE_H) / 2
    const y1 = cb.y + (dir * NODE_H) / 2 + (dir > 0 ? 5 : -5)
    return `M ${ca.x} ${y0} C ${ca.x} ${y0 + lift}, ${cb.x} ${y1 + lift}, ${cb.x} ${y1}`
  }
  const down = b.row > a.row
  const y0 = ca.y + ((down ? 1 : -1) * NODE_H) / 2
  const y1 = cb.y - ((down ? 1 : -1) * NODE_H) / 2 - (down ? 5 : -5)
  const mid = (y0 + y1) / 2
  return `M ${ca.x} ${y0} C ${ca.x} ${mid}, ${cb.x} ${mid}, ${cb.x} ${y1}`
}

export default function LinkedListVisualizer({ step, prev, steps, config, narration }: VisualizerProps) {
  const layout = useLayout(steps, step, config.layout as string | undefined)
  const heap = step.heap
  const prevHeap = prev?.heap || {}
  const locals = visibleLocals(step)
  const prevLocals = visibleLocals(prev)

  const nodeIds = Object.keys(heap).filter((id) => isNode(heap[id]) && layout.has(id))
  const rows = Math.max(1, ...[...layout.values()].map((p) => p.row + 1))
  const cols = Math.max(1, ...[...layout.values()].map((p) => p.col + 1))

  // Which variables point at which node
  const labels = new Map<string, { name: string; color: string }[]>()
  const pointerNames: string[] = []
  Object.entries(locals).forEach(([name, sv]) => {
    const id = refId(sv.value)
    if (!id || !isNode(heap[id]) || name === 'self') return
    pointerNames.push(name)
    const list = labels.get(id) ?? []
    const color = POINTER_COLORS[name] || '#38bdf8'
    list.push({ name, color })
    labels.set(id, list)
  })

  const edges: { from: string; to: string; kind: 'next' | 'prev' | 'random'; rewired: boolean }[] = []
  for (const id of nodeIds) {
    const f = heap[id].fields
    for (const kind of ['next', 'prev', 'random'] as const) {
      const to = refId(f[kind])
      if (to && layout.has(to)) {
        const prevTo = refId(prevHeap[id]?.fields?.[kind])
        const isRewired =
          (narration?.rewiredEdge?.from === id && narration?.rewiredEdge?.to === to) ||
          (prevHeap[id] && prevTo !== to)
        edges.push({ from: id, to, kind, rewired: Boolean(isRewired) })
      }
    }
  }

  const width = PAD_X * 2 + cols * COL
  const height = PAD_Y * 2 + rows * ROW - 20
  const nodeLabel = (o: HeapObject) =>
    'key' in o.fields ? `${formatValue(o.fields.key, heap, 1)}:${formatValue(o.fields.val, heap, 1)}` : formatValue(o.fields.val, heap, 1)

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {nodeIds.length === 0 ? (
        <p className="text-sm text-muted">No list nodes in scope at this step.</p>
      ) : (
        <div className="relative w-full overflow-hidden rounded-2xl border border-line/50 bg-gradient-to-b from-surface-2/40 to-ink/60 p-4 shadow-inner">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-w-full block select-none"
            style={{ maxHeight: '440px' }}
          >
            <defs>
              {(['next', 'prev', 'random'] as const).map((k) => (
                <marker
                  key={k}
                  id={`arrow-${k}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M 0 0 L 10 5 L 0 10 z"
                    fill={k === 'next' ? '#A3AAC2' : k === 'prev' ? '#38BDF8' : '#F59E0B'}
                  />
                </marker>
              ))}
              {/* Rewired Swap Arrowhead */}
              <marker
                id="arrow-rewired"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--viz-swap, #f43f5e)" />
              </marker>
            </defs>

            {/* Connecting Edges */}
            {edges.map((e) => {
              const fromPos = layout.get(e.from)!
              const toPos = layout.get(e.to)!
              const d = arrowPath(fromPos, toPos, e.kind)
              const strokeColor = e.rewired
                ? 'var(--viz-swap, #f43f5e)'
                : e.kind === 'next'
                  ? '#94A3B8'
                  : e.kind === 'prev'
                    ? '#38BDF8'
                    : '#F59E0B'

              return (
                <motion.path
                  key={`${e.kind}-${e.from}->${e.to}`}
                  initial={e.rewired ? { pathLength: 0, opacity: 0.4 } : false}
                  animate={{ d, pathLength: 1, opacity: 1 }}
                  transition={
                    e.rewired
                      ? { duration: 0.45, ease: 'easeOut' }
                      : { type: 'spring', stiffness: 260, damping: 30 }
                  }
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={e.rewired ? 2.5 : e.kind === 'next' ? 1.8 : 1.3}
                  strokeDasharray={e.rewired ? undefined : e.kind === 'next' ? undefined : '4 3'}
                  markerEnd={e.rewired ? 'url(#arrow-rewired)' : `url(#arrow-${e.kind})`}
                />
              )
            })}

            {/* Node Cards and Floating Wisps */}
            {nodeIds.map((id) => {
              const p = layout.get(id)!
              const x = PAD_X + p.col * COL
              const y = PAD_Y + p.row * ROW
              const here = labels.get(id) ?? []
              const isNull = heap[id].fields.next === null
              const isTargeted = here.length > 0

              return (
                <g key={id}>
                  {/* Floating Pointer Wisps Above Node */}
                  {here.map((l, i) => (
                    <g key={l.name} transform={`translate(${x + NODE_W / 2}, ${y - 18 - i * 18})`}>
                      {/* Glowing Wisp Orb */}
                      <circle cx={-18} cy={-2} r={4} fill={l.color} className="animate-pulse" />
                      <rect
                        x={-12}
                        y={-9}
                        width={l.name.length * 7 + 12}
                        height={15}
                        rx={4}
                        fill="rgba(15,18,32,0.92)"
                        stroke={l.color}
                        strokeWidth={1.2}
                      />
                      <text
                        x={-6}
                        y={2}
                        className="font-mono text-[9px] font-bold tracking-wide"
                        fill={l.color}
                      >
                        {l.name}
                      </text>
                    </g>
                  ))}

                  {/* 3D Depth Glass Node Card */}
                  <rect
                    x={x}
                    y={y}
                    width={NODE_W}
                    height={NODE_H}
                    rx={10}
                    fill={isTargeted ? 'rgba(0, 240, 255, 0.12)' : 'rgba(26, 31, 48, 0.85)'}
                    stroke={isTargeted ? 'var(--viz-accent, #00f0ff)' : '#2e354f'}
                    strokeWidth={isTargeted ? 2 : 1.4}
                    filter="drop-shadow(0 4px 10px rgba(0,0,0,0.35))"
                  />
                  {/* Inner Top Highlight */}
                  <line
                    x1={x + 8}
                    y1={y + 1.5}
                    x2={x + NODE_W - 8}
                    y2={y + 1.5}
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth={1}
                  />

                  {/* Node Value */}
                  <text
                    x={x + NODE_W / 2}
                    y={y + NODE_H / 2 + 5}
                    textAnchor="middle"
                    className="fill-chalk font-mono text-[14px] font-semibold"
                  >
                    {nodeLabel(heap[id])}
                  </text>

                  {/* None Indicator */}
                  {isNull && (
                    <g transform={`translate(${x + NODE_W + 8}, ${y + NODE_H / 2 + 4})`}>
                      <text className="fill-faint font-mono text-[10px] italic">
                        → None
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Legend Strip */}
          <div className="mt-3 flex flex-wrap items-center gap-5 text-2xs text-muted/80">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-muted/80 inline-block" /> next pointer
            </span>
            <span className="flex items-center gap-1.5 text-sky">
              <span className="h-0.5 w-4 border-t border-dashed border-sky inline-block" /> prev
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="h-0.5 w-4 bg-rose-500 inline-block" /> rewired link
            </span>
          </div>
        </div>
      )}

      <SidePanels
        locals={locals}
        prevLocals={prevLocals}
        heap={heap}
        config={config}
        exclude={new Set(pointerNames)}
      />
    </div>
  )
}
