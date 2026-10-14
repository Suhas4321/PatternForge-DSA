import { motion } from 'motion/react'
import { useMemo } from 'react'
import type { HeapObject, TraceStep, TraceValue } from '../../api/types'
import { formatValue, isRef, visibleLocals } from '../../lib/trace'
import { ArrayRow, buildArrays, SidePanels } from './parts'
import type { VisualizerProps } from './types'

const LEVEL_H = 64
const NODE_R = 17
const SLOT_W = 46

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

function DataTree({ step, frameNodes }: { step: TraceStep; frameNodes: Map<string, string[]> }) {
  // Lay the tree out as it is at this step: when code swaps or re-links children (Invert Tree),
  // nodes slide to their new positions instead of keeping a stale layout.
  const layout = useMemo(() => layoutTrees([step]), [step])
  const heap = step.heap
  const ids = Object.keys(heap).filter((id) => isTreeNode(heap[id]) && layout.has(id))
  if (!ids.length) return null
  const maxX = Math.max(...ids.map((id) => layout.get(id)!.x))
  const maxY = Math.max(...ids.map((id) => layout.get(id)!.y))
  const pos = (id: string) => ({ cx: 24 + layout.get(id)!.x * SLOT_W, cy: 24 + layout.get(id)!.y * LEVEL_H })
  const activeId = [...frameNodes.entries()].find(([, names]) => names.includes('__active__'))?.[0]

  return (
    <svg width={48 + maxX * SLOT_W + 40} height={48 + maxY * LEVEL_H + 30} className="block">
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
              stroke="#3B4256"
              strokeWidth={1.5}
            />
          )
        }),
      )}
      {ids.map((id) => {
        const { cx, cy } = pos(id)
        const names = (frameNodes.get(id) ?? []).filter((n) => n !== '__active__')
        const active = id === activeId
        return (
          <g key={id}>
            <motion.circle
              initial={false}
              animate={{ cx, cy, fill: active ? 'rgba(0,240,255,0.25)' : names.length ? 'rgba(129,140,248,0.14)' : '#0F1220' }}
              r={NODE_R}
              stroke={active ? '#00F0FF' : names.length ? '#818CF8' : '#262B3D'}
              strokeWidth={active ? 2 : 1.4}
            />
            <motion.text initial={false} animate={{ x: cx, y: cy + 4 }} textAnchor="middle" className="fill-chalk font-mono text-[12px]">
              {formatValue(heap[id].fields.val, heap, 1)}
            </motion.text>
            {names.length > 0 && (
              <motion.text initial={false} animate={{ x: cx, y: cy + NODE_R + 13 }} textAnchor="middle" className="fill-sky font-mono text-[10px]">
                {names.slice(0, 2).join(', ')}
              </motion.text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ------------------------------------------------------------------------------------------
// Array heap (heapq list) drawn as a complete binary tree
// ------------------------------------------------------------------------------------------

function HeapTree({ name, items, heap }: { name: string; items: TraceValue[]; heap: Record<string, HeapObject> }) {
  if (!items.length) return <div className="font-mono text-xs text-faint">{name}: empty heap</div>
  const depth = Math.floor(Math.log2(items.length)) + 1
  const width = Math.max(1, 2 ** (depth - 1)) * SLOT_W + 20
  const pos = (i: number) => {
    const level = Math.floor(Math.log2(i + 1))
    const idx = i + 1 - 2 ** level
    const span = width / 2 ** level
    return { cx: span * idx + span / 2, cy: 22 + level * 56 }
  }
  return (
    <div>
      <div className="mb-1 font-mono text-xs text-muted">{name} as a heap (root = {items.length ? formatValue(items[0], heap, 1) : '…'})</div>
      <svg width={width} height={depth * 56 + 10} className="block">
        {items.map((_, i) =>
          i === 0 ? null : (
            <line key={`e${i}`} x1={pos(i).cx} y1={pos(i).cy} x2={pos((i - 1) >> 1).cx} y2={pos((i - 1) >> 1).cy} stroke="#3B4256" strokeWidth={1.4} />
          ),
        )}
        {items.map((v, i) => (
          <g key={i}>
            <circle cx={pos(i).cx} cy={pos(i).cy} r={NODE_R} fill={i === 0 ? 'rgba(0,240,255,0.2)' : '#0F1220'} stroke={i === 0 ? '#00F0FF' : '#262B3D'} strokeWidth={1.4} />
            <text x={pos(i).cx} y={pos(i).cy + 4} textAnchor="middle" className="fill-chalk font-mono text-[11px]">
              {formatValue(v, heap, 1).slice(0, 6)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Recursion call tree built from call/return events up to the current step
// ------------------------------------------------------------------------------------------

interface CallNode {
  frameId: number
  label: string
  children: CallNode[]
  returned?: string
  x: number
  depth: number
}

const MAX_CALLS = 120

function buildCallTree(steps: TraceStep[], index: number, rootFunc: string, keepRoot: boolean) {
  const roots: CallNode[] = []
  const byFrame = new Map<number, CallNode>()
  let total = 0
  for (let i = 0; i <= index && i < steps.length; i++) {
    const s = steps[i]
    const frame = s.frames[s.frames.length - 1]
    if (!frame) continue
    if (s.event === 'call') {
      total++
      if (!keepRoot && s.func === rootFunc && s.frames.length === 1) continue
      const args = Object.entries(frame.locals)
        .filter(([k]) => k !== 'self' && (!s.params || s.params.includes(k)))
        .map(([k, v]) => `${k}=${formatValue(v, s.heap, 1)}`)
        .join(', ')
      const node: CallNode = { frameId: frame.id, label: `${s.func}(${args.length > 28 ? args.slice(0, 27) + '…' : args})`, children: [], x: 0, depth: 0 }
      byFrame.set(frame.id, node)
      const parentFrame = s.frames[s.frames.length - 2]
      const parent = parentFrame ? byFrame.get(parentFrame.id) : undefined
      if (parent) parent.children.push(node)
      else roots.push(node)
    } else if (s.event === 'return') {
      const node = byFrame.get(frame.id)
      if (node) node.returned = formatValue(s.return_value, s.return_heap, 1)
    }
  }
  // tidy layout: leaves left to right, parents centred over children
  let leaf = 0
  const place = (n: CallNode, depth: number) => {
    n.depth = depth
    if (!n.children.length) n.x = leaf++
    else {
      n.children.forEach((c) => place(c, depth + 1))
      n.x = (n.children[0].x + n.children[n.children.length - 1].x) / 2
    }
  }
  roots.forEach((r) => place(r, 0))
  return { roots, count: byFrame.size, total }
}

function CallTree({ steps, index, step }: { steps: TraceStep[]; index: number; step: TraceStep }) {
  const rootFunc = steps[0]?.func ?? ''
  // Hide the outer LeetCode method when it only sets up a helper (dfs/backtrack); keep it when it
  // recurses itself (self.fib(n - 1)).
  const keepRoot = useMemo(
    () => steps.some((s) => s.event === 'call' && s.func === rootFunc && s.frames.length > 1),
    [steps, rootFunc],
  )
  const { roots, count } = useMemo(() => buildCallTree(steps, index, rootFunc, keepRoot), [steps, index, rootFunc, keepRoot])
  if (!roots.length) return null
  if (count > MAX_CALLS) {
    return <p className="text-xs text-ochre">{count} recursive calls so far: too many to draw. Try a smaller custom input.</p>
  }
  const all: CallNode[] = []
  const collect = (n: CallNode) => {
    all.push(n)
    n.children.forEach(collect)
  }
  roots.forEach(collect)
  const activeIds = new Set(step.frames.map((f) => f.id))
  const current = step.frames[step.frames.length - 1]?.id
  // Boxes shrink to fit the longest label so small call trees fit without scrolling.
  const longest = Math.max(...all.map((n) => Math.min(22, n.label.length)), ...all.map((n) => Math.min(16, (n.returned ?? '').length + 2)))
  const BOX_W = Math.max(64, Math.min(132, Math.round(longest * 6.3 + 14)))
  const COL_W = BOX_W + 8
  const ROW_H = 58
  const maxX = Math.max(...all.map((n) => n.x))
  const maxD = Math.max(...all.map((n) => n.depth))
  const px = (n: CallNode) => 8 + n.x * COL_W
  const py = (n: CallNode) => 8 + n.depth * ROW_H

  return (
    <div className="overflow-x-auto">
      <div className="mb-1 text-xs text-muted">Recursion tree (calls so far)</div>
      <svg width={maxX * COL_W + BOX_W + 16} height={maxD * ROW_H + 52} className="block">
        {all.flatMap((n) =>
          n.children.map((c) => (
            <line key={`${n.frameId}-${c.frameId}`} x1={px(n) + BOX_W / 2} y1={py(n) + 30} x2={px(c) + BOX_W / 2} y2={py(c)} stroke="#3B4256" strokeWidth={1.2} />
          )),
        )}
        {all.map((n) => {
          const isCurrent = n.frameId === current
          const onStack = activeIds.has(n.frameId)
          const done = n.returned !== undefined
          return (
            <g key={n.frameId}>
              <rect
                x={px(n)}
                y={py(n)}
                width={BOX_W}
                height={30}
                rx={6}
                fill={isCurrent ? 'rgba(0,240,255,0.2)' : onStack ? 'rgba(129,140,248,0.12)' : '#0F1220'}
                stroke={isCurrent ? '#00F0FF' : onStack ? '#818CF8' : done ? '#0F5B45' : '#262B3D'}
                strokeWidth={isCurrent ? 2 : 1.2}
              />
              <text x={px(n) + 6} y={py(n) + 19} className="fill-chalk font-mono text-[10px]">
                {n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label}
                <title>{n.label}</title>
              </text>
              {done && (
                <text x={px(n) + BOX_W / 2} y={py(n) + 43} textAnchor="middle" className="fill-verdigris font-mono text-[10px]">
                  → {n.returned!.length > 16 ? n.returned!.slice(0, 15) + '…' : n.returned}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ------------------------------------------------------------------------------------------

const HEAP_NAME = /heap|^pq$|^h$|minheap|maxheap/i

export default function TreeRecursionVisualizer({ step, prev, steps, index, config }: VisualizerProps) {
  const locals = visibleLocals(step)
  const prevLocals = visibleLocals(prev)
  const heap = step.heap

  // Which locals point at tree nodes; the innermost frame's node argument is "active".
  const frameNodes = new Map<string, string[]>()
  const nodeVars: string[] = []
  Object.entries(locals).forEach(([name, sv]) => {
    const id = refId(sv.value)
    if (!id || !isTreeNode(heap[id]) || name === 'self') return
    nodeVars.push(name)
    frameNodes.set(id, [...(frameNodes.get(id) ?? []), name])
  })
  const inner = step.frames[step.frames.length - 1]
  const activeName = inner && Object.keys(inner.locals).find((n) => isTreeNode(heap[refId(inner.locals[n]) ?? '']))
  if (activeName) {
    const id = refId(inner.locals[activeName])!
    frameNodes.set(id, [...(frameNodes.get(id) ?? []), '__active__'])
  }
  const hasTree = Object.values(heap).some(isTreeNode)

  const heapNames = [
    ...((config.heaps as string[] | undefined) ?? []),
    ...Object.keys(locals).filter((n) => HEAP_NAME.test(n) && Array.isArray(locals[n].value)),
  ].filter((n, i, a) => a.indexOf(n) === i && Array.isArray(locals[n]?.value))

  const isRecursive = steps.some((s) => s.frames.length > 1)
  const exclude = new Set([...nodeVars, ...heapNames])
  const { models, pointerNames } = buildArrays(locals, prevLocals, config, exclude)

  return (
    <div className="flex flex-col gap-5">
      {hasTree && (
        <div className="overflow-x-auto">
          <DataTree step={step} frameNodes={frameNodes} />
        </div>
      )}
      {heapNames.map((n) => (
        <HeapTree key={n} name={n} items={locals[n].value as TraceValue[]} heap={heap} />
      ))}
      {!hasTree && isRecursive && <CallTree steps={steps} index={index} step={step} />}
      {models.map((m) => (
        <ArrayRow key={m.name} model={m} heap={heap} />
      ))}
      {step.frames.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-faint">call stack</span>
          {step.frames.map((f, i) => (
            <span
              key={f.id}
              className={`rounded border px-1.5 py-0.5 font-mono ${i === step.frames.length - 1 ? 'border-forge text-forge' : 'border-line text-muted'}`}
            >
              {f.func}
            </span>
          ))}
        </div>
      )}
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
