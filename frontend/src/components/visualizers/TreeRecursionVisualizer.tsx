import { motion, AnimatePresence } from 'motion/react'
import { useMemo } from 'react'
import type { HeapObject, TraceStep, TraceValue } from '../../api/types'
import { formatValue, isRef, visibleLocals } from '../../lib/trace'
import { ArrayRow, buildArrays, SidePanels } from './parts'
import type { VisualizerProps } from './types'

const LEVEL_H = 68
const NODE_R = 19
const SLOT_W = 52

const isTreeNode = (o: HeapObject | undefined) => !!o && 'left' in o.fields && 'right' in o.fields
const refId = (v: unknown) => (isRef(v) ? String(v.$ref) : null)

interface Placed {
  x: number
  y: number
}

// ------------------------------------------------------------------------------------------
// Binary tree layout: x = in-order position, y = depth (stable over the trace)
// ------------------------------------------------------------------------------------------

function layoutTrees(steps: TraceStep[]) {
  const placed = new Map<string, Placed>()
  let nextSlot = 0
  for (const s of steps) {
    const ids = Object.keys(s.heap).filter((id) => isTreeNode(s.heap[id]) && !placed.has(id))
    if (!ids.length) continue
    const children = new Set<string>()
    for (const id of Object.keys(s.heap)) {
      const o = s.heap[id]
      if (!isTreeNode(o)) continue
      for (const k of ['left', 'right']) {
        const c = refId(o.fields[k])
        if (c) children.add(c)
      }
    }
    const roots = ids.filter((id) => !children.has(id))
    const walk = (id: string | null, depth: number, seen: Set<string>) => {
      if (!id || !isTreeNode(s.heap[id]) || seen.has(id)) return
      seen.add(id)
      const o = s.heap[id]
      walk(refId(o.fields.left), depth + 1, seen)
      if (!placed.has(id)) placed.set(id, { x: nextSlot++, y: depth })
      walk(refId(o.fields.right), depth + 1, seen)
    }
    roots.forEach((r) => walk(r, 0, new Set()))
    ids.filter((id) => !placed.has(id)).forEach((id) => placed.set(id, { x: nextSlot++, y: 0 }))
  }
  return placed
}

/**
 * Responsive Scaled Tree with concentric entering/returning pulse rings.
 */
function DataTree({
  step,
  steps,
  frameNodes,
}: {
  step: TraceStep
  steps: TraceStep[]
  frameNodes: Map<string, string[]>
}) {
  const layout = useMemo(() => layoutTrees(steps.length ? steps : [step]), [steps, step])
  const heap = step.heap
  const ids = Object.keys(heap).filter((id) => isTreeNode(heap[id]) && layout.has(id))
  if (!ids.length) return null

  const maxX = Math.max(...ids.map((id) => layout.get(id)!.x))
  const maxY = Math.max(...ids.map((id) => layout.get(id)!.y))
  const width = 48 + maxX * SLOT_W + 48
  const height = 48 + maxY * LEVEL_H + 36

  const pos = (id: string) => ({
    cx: 32 + layout.get(id)!.x * SLOT_W,
    cy: 32 + layout.get(id)!.y * LEVEL_H,
  })
  const activeId = [...frameNodes.entries()].find(([, names]) => names.includes('__active__'))?.[0]

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-line/50 bg-gradient-to-b from-surface-2/40 to-ink/60 p-4 shadow-inner">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-w-full block select-none"
        style={{ maxHeight: '420px' }}
      >
        {/* Tree Branch Edges */}
        {ids.flatMap((id) =>
          (['left', 'right'] as const).map((k) => {
            const c = refId(heap[id].fields[k])
            if (!c || !layout.has(c)) return null
            const a = pos(id)
            const b = pos(c)
            return (
              <motion.line
                key={`${id}-${k}`}
                initial={false}
                animate={{ x1: a.cx, y1: a.cy, x2: b.cx, y2: b.cy }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                stroke="#475569"
                strokeWidth={1.8}
              />
            )
          }),
        )}

        {/* Tree Nodes with Depth and Concentric Pulse Rings */}
        {ids.map((id) => {
          const { cx, cy } = pos(id)
          const names = (frameNodes.get(id) ?? []).filter((n) => n !== '__active__')
          const active = id === activeId

          return (
            <g key={id}>
              {/* Concentric Entering/Active Ring */}
              {active && (
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={NODE_R + 7}
                  fill="none"
                  stroke="var(--viz-accent, #00f0ff)"
                  strokeWidth={1.5}
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                />
              )}

              {/* Node Body with Glass Depth */}
              <motion.circle
                initial={false}
                animate={{
                  cx,
                  cy,
                  fill: active
                    ? 'rgba(0,240,255,0.25)'
                    : names.length
                      ? 'rgba(129,140,248,0.18)'
                      : '#131826',
                }}
                r={NODE_R}
                stroke={active ? 'var(--viz-accent, #00f0ff)' : names.length ? '#818cf8' : '#334155'}
                strokeWidth={active ? 2.2 : 1.5}
                filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))"
              />

              {/* Value Text */}
              <motion.text
                initial={false}
                animate={{ x: cx, y: cy + 4.5 }}
                textAnchor="middle"
                className="fill-chalk font-mono text-[13px] font-semibold"
              >
                {formatValue(heap[id].fields.val, heap, 1)}
              </motion.text>

              {/* Variable labels */}
              {names.length > 0 && (
                <motion.text
                  initial={false}
                  animate={{ x: cx, y: cy + NODE_R + 14 }}
                  textAnchor="middle"
                  className="fill-sky font-mono text-[10px] font-bold"
                >
                  {names.slice(0, 2).join(', ')}
                </motion.text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/**
 * Complete Binary Tree & Array side by side for Priority Queue / Heap.
 */
function HeapTree({
  name,
  items,
  heap,
}: {
  name: string
  items: TraceValue[]
  heap: Record<string, HeapObject>
}) {
  if (!items.length) return <div className="font-mono text-xs text-muted/60">{name}: empty heap</div>

  const depth = Math.floor(Math.log2(items.length)) + 1
  const width = Math.max(1, 2 ** (depth - 1)) * SLOT_W + 40
  const height = depth * 58 + 20

  const pos = (i: number) => {
    const level = Math.floor(Math.log2(i + 1))
    const idx = i + 1 - 2 ** level
    const span = width / 2 ** level
    return { cx: span * idx + span / 2, cy: 26 + level * 56 }
  }

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6 w-full rounded-2xl border border-line/50 bg-surface-2/40 p-4 shadow-inner">
      {/* Left: Heap Tree Representation */}
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="mb-2 font-mono text-xs text-muted">
          <span className="font-semibold text-chalk">{name}</span> as Binary Heap (root = min)
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-w-full block select-none"
          style={{ maxHeight: '280px' }}
        >
          {items.map((_, i) =>
            i === 0 ? null : (
              <line
                key={`e${i}`}
                x1={pos(i).cx}
                y1={pos(i).cy}
                x2={pos((i - 1) >> 1).cx}
                y2={pos((i - 1) >> 1).cy}
                stroke="#475569"
                strokeWidth={1.5}
              />
            ),
          )}
          {items.map((v, i) => {
            const isRoot = i === 0
            const p = pos(i)
            return (
              <g key={i}>
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={NODE_R}
                  fill={isRoot ? 'rgba(0,240,255,0.22)' : '#131826'}
                  stroke={isRoot ? 'var(--viz-accent, #00f0ff)' : '#334155'}
                  strokeWidth={isRoot ? 2 : 1.4}
                />
                <text
                  x={p.cx}
                  y={p.cy + 4.5}
                  textAnchor="middle"
                  className="fill-chalk font-mono text-[12px] font-semibold"
                >
                  {formatValue(v, heap, 1).slice(0, 5)}
                </text>
                <text x={p.cx} y={p.cy - NODE_R - 3} textAnchor="middle" className="fill-faint font-mono text-[9px]">
                  [{i}]
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Right: Heap Underlying Array */}
      <div className="flex flex-col items-center lg:items-start min-w-[220px]">
        <div className="mb-2 font-mono text-xs text-muted">Array Storage: [0 .. {items.length - 1}]</div>
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-ink/70 border border-line/60">
          {items.map((v, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center rounded-lg border px-2.5 py-1.5 font-mono text-xs ${
                i === 0
                  ? 'border-forge bg-forge/15 text-chalk ring-1 ring-forge/40'
                  : 'border-line/70 bg-panel text-chalk'
              }`}
            >
              <span className="font-semibold">{formatValue(v, heap, 1)}</span>
              <span className="text-[9px] text-muted/70">[{i}]</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Traversal Order Banner Strip
// ------------------------------------------------------------------------------------------

function TraversalStrip({ visited }: { visited: string[] }) {
  if (visited.length === 0) return null
  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-line/60 bg-gradient-to-r from-surface-2/80 via-ink/80 to-surface-2/80 px-3.5 py-2 text-xs">
      <span className="font-mono text-muted whitespace-nowrap">Traversal Order:</span>
      <div className="flex items-center gap-1.5 overflow-x-auto font-mono">
        {visited.map((v, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="rounded bg-sky/15 px-2 py-0.5 text-sky font-semibold border border-sky/30">
              {v}
            </span>
            {i < visited.length - 1 && <span className="text-muted/60">→</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Side Call Stack Panel
// ------------------------------------------------------------------------------------------

function CallStackPanel({ frames }: { frames: TraceStep['frames'] }) {
  if (frames.length <= 1) return null
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line/60 bg-surface-2/60 p-3">
      <div className="flex items-center justify-between text-2xs text-muted font-mono uppercase tracking-wider">
        <span>Call Stack</span>
        <span>depth {frames.length}</span>
      </div>
      <div className="flex flex-col-reverse gap-1.5">
        <AnimatePresence initial={false}>
          {frames.map((f, i) => {
            const isTop = i === frames.length - 1
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 font-mono text-xs ${
                  isTop
                    ? 'border-forge bg-forge/20 text-chalk shadow-[0_0_10px_rgba(255,107,0,0.2)] ring-1 ring-forge/40'
                    : 'border-line/60 bg-ink/70 text-muted'
                }`}
              >
                <span className="font-semibold">{f.func}()</span>
                <span className="text-2xs text-muted/70">level {i + 1}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function TreeRecursionVisualizer({
  step,
  prev,
  steps,
  index,
  config,
}: VisualizerProps) {
  const locals = visibleLocals(step)
  const prevLocals = visibleLocals(prev)
  const heap = step.heap

  // Which locals point at tree nodes; innermost frame's node argument is active
  const frameNodes = new Map<string, string[]>()
  const nodeVars: string[] = []
  Object.entries(locals).forEach(([name, sv]) => {
    const id = refId(sv.value)
    if (!id || !isTreeNode(heap[id]) || name === 'self') return
    nodeVars.push(name)
    frameNodes.set(id, [...(frameNodes.get(id) ?? []), name])
  })
  const inner = step.frames[step.frames.length - 1]
  const activeName =
    inner && Object.keys(inner.locals).find((n) => isTreeNode(heap[refId(inner.locals[n]) ?? '']))
  if (activeName) {
    const id = refId(inner.locals[activeName])!
    frameNodes.set(id, [...(frameNodes.get(id) ?? []), '__active__'])
  }
  const hasTree = Object.values(heap).some(isTreeNode)

  const heapNames = [
    ...((config.heaps as string[] | undefined) ?? []),
    ...Object.keys(locals).filter((n) => /heap|^pq$|^h$|minheap|maxheap/i.test(n) && Array.isArray(locals[n].value)),
  ].filter((n, i, a) => a.indexOf(n) === i && Array.isArray(locals[n]?.value))

  // Compute traversal order so far
  const visitedTraversal = useMemo(() => {
    const visited: string[] = []
    const seen = new Set<string>()
    for (let i = 0; i <= index && i < steps.length; i++) {
      const s = steps[i]
      const curInner = s.frames[s.frames.length - 1]
      if (!curInner) continue
      for (const [, v] of Object.entries(curInner.locals)) {
        const tid = refId(v)
        if (tid && s.heap[tid] && isTreeNode(s.heap[tid])) {
          const val = formatValue(s.heap[tid].fields.val, s.heap, 1)
          const key = `${tid}:${val}`
          if (!seen.has(key) && s.event === 'call') {
            seen.add(key)
            visited.push(val)
          }
        }
      }
    }
    return visited
  }, [steps, index])

  const exclude = new Set([...nodeVars, ...heapNames])
  const { models, pointerNames } = buildArrays(locals, prevLocals, config, exclude)

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* Traversal Order Banner Strip */}
      <TraversalStrip visited={visitedTraversal} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="flex flex-col gap-5 w-full overflow-hidden">
          {hasTree && <DataTree step={step} steps={steps} frameNodes={frameNodes} />}
          {heapNames.map((n) => (
            <HeapTree key={n} name={n} items={locals[n].value as TraceValue[]} heap={heap} />
          ))}
          {models.map((m) => (
            <ArrayRow key={m.name} model={m} heap={heap} />
          ))}
        </div>

        {/* Side Call Stack */}
        <CallStackPanel frames={step.frames} />
      </div>

      <SidePanels
        locals={locals}
        prevLocals={prevLocals}
        heap={heap}
        config={config}
        exclude={new Set([...exclude, ...models.map((m) => m.name), ...pointerNames])}
      />
    </div>
  )
}
