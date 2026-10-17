import { motion } from 'motion/react'
import { useMemo } from 'react'
import type { HeapObject, TraceStep } from '../../api/types'
import { formatValue, isRef, visibleLocals } from '../../lib/trace'
import { SidePanels } from './parts'
import type { VisualizerProps } from './types'

const NODE_W = 64
const NODE_H = 38
const COL = NODE_W + 44
const ROW = NODE_H + 84
const PAD_X = 16
const PAD_Y = 30
const LABEL_COLORS = ['#00F0FF', '#38BDF8', '#94A3B8', '#10B981', '#F59E0B', '#F8FAFC', '#F43F5E']

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
 * created later get new rows in creation order. With `layout: current` (e.g. LRU cache, where the
 * order itself is the point) the layout follows the list as it is at each step.
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
    return `M ${ca.x + NODE_W / 2} ${ca.y} L ${cb.x - NODE_W / 2 - 4} ${cb.y}`
  }
  if (a.row === b.row) {
    // Backward or long jumps on the same row curve below (next/prev) or above (random).
    const dir = kind === 'random' ? -1 : 1
    const lift = (22 + Math.abs(b.col - a.col) * 10) * dir
    const y0 = ca.y + (dir * NODE_H) / 2
    const y1 = cb.y + (dir * NODE_H) / 2 + (dir > 0 ? 4 : -4)
    return `M ${ca.x} ${y0} C ${ca.x} ${y0 + lift}, ${cb.x} ${y1 + lift}, ${cb.x} ${y1}`
  }
  const down = b.row > a.row
  const y0 = ca.y + ((down ? 1 : -1) * NODE_H) / 2
  const y1 = cb.y - ((down ? 1 : -1) * NODE_H) / 2 - (down ? 4 : -4)
  const mid = (y0 + y1) / 2
  return `M ${ca.x} ${y0} C ${ca.x} ${mid}, ${cb.x} ${mid}, ${cb.x} ${y1}`
}

export default function LinkedListVisualizer({ step, prev, steps, config }: VisualizerProps) {
  const layout = useLayout(steps, step, config.layout as string | undefined)
  const heap = step.heap
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
    list.push({ name, color: LABEL_COLORS[pointerNames.length % LABEL_COLORS.length] })
    labels.set(id, list)
  })

  const edges: { from: string; to: string; kind: 'next' | 'prev' | 'random' }[] = []
  for (const id of nodeIds) {
    const f = heap[id].fields
    for (const kind of ['next', 'prev', 'random'] as const) {
      const to = refId(f[kind])
      if (to && layout.has(to)) edges.push({ from: id, to, kind })
    }
  }

  const width = PAD_X * 2 + cols * COL
  const height = PAD_Y * 2 + rows * ROW - 30
  const nodeLabel = (o: HeapObject) =>
    'key' in o.fields ? `${formatValue(o.fields.key, heap, 1)}:${formatValue(o.fields.val, heap, 1)}` : formatValue(o.fields.val, heap, 1)

  return (
    <div className="flex flex-col gap-5">
      {nodeIds.length === 0 ? (
        <p className="text-sm text-muted">No list nodes in scope at this step.</p>
      ) : (
        <div className="overflow-x-auto">
          <svg width={width} height={height} className="block">
            <defs>
              {(['next', 'prev', 'random'] as const).map((k) => (
                <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={k === 'next' ? '#A3AAC2' : k === 'prev' ? '#38BDF8' : '#F59E0B'} />
                </marker>
              ))}
            </defs>
            {edges.map((e) => (
              <motion.path
                key={`${e.kind}-${e.from}`}
                initial={false}
                animate={{ d: arrowPath(layout.get(e.from)!, layout.get(e.to)!, e.kind) }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                fill="none"
                stroke={e.kind === 'next' ? '#A3AAC2' : e.kind === 'prev' ? '#38BDF8' : '#F59E0B'}
                strokeWidth={e.kind === 'next' ? 1.6 : 1.2}
                strokeDasharray={e.kind === 'next' ? undefined : '4 3'}
                markerEnd={`url(#arrow-${e.kind})`}
              />
            ))}
            {nodeIds.map((id) => {
              const p = layout.get(id)!
              const x = PAD_X + p.col * COL
              const y = PAD_Y + p.row * ROW
              const here = labels.get(id) ?? []
              const isNull = heap[id].fields.next === null
              return (
                <g key={id}>
                  <rect
                    x={x}
                    y={y}
                    width={NODE_W}
                    height={NODE_H}
                    rx={7}
                    fill={here.length ? 'rgba(0,240,255,0.12)' : '#0F1220'}
                    stroke={here.length ? '#00F0FF' : '#262B3D'}
                    strokeWidth={1.4}
                  />
                  <text x={x + NODE_W / 2} y={y + NODE_H / 2 + 5} textAnchor="middle" className="fill-chalk font-mono text-[13px]">
                    {nodeLabel(heap[id])}
                  </text>
                  {isNull && (
                    <text x={x + NODE_W + 6} y={y + NODE_H / 2 + 4} className="fill-faint font-mono text-[10px]">
                      None
                    </text>
                  )}
                  {here.map((l, i) => (
                    <text
                      key={l.name}
                      x={x + NODE_W / 2}
                      y={y + NODE_H + 16 + i * 13}
                      textAnchor="middle"
                      className="font-mono text-[11px] font-semibold"
                      fill={l.color}
                    >
                      {i === 0 ? '▲ ' : ''}
                      {l.name}
                    </text>
                  ))}
                </g>
              )
            })}
          </svg>
          <div className="mt-1 flex gap-4 text-2xs text-faint">
            <span>— next</span>
            {edges.some((e) => e.kind === 'prev') && <span className="text-sky">- - prev</span>}
            {edges.some((e) => e.kind === 'random') && <span className="text-amber">- - random</span>}
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
