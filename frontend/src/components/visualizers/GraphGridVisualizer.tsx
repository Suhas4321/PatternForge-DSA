import { motion } from 'motion/react'
import { useMemo, type ReactNode } from 'react'
import type { HeapObject, TraceStep, TraceValue } from '../../api/types'
import { asCells, formatValue, isDeque, isDict, isObj, isRef, isSet, isTuple, visibleLocals, type ScopedValue } from '../../lib/trace'
import { ArrayRow, buildArrays, describeChange, QueueConveyor, SidePanels } from './parts'
import type { VisualizerProps } from './types'

const CELL_PAIRS: [string, string][] = [
  ['r', 'c'], ['row', 'col'], ['i', 'j'], ['x', 'y'], ['nr', 'nc'],
]
const GRAPH_NAMES = ['adj', 'graph', 'g', 'adjacency', 'neighbors']
const EDGE_NAMES = ['edges', 'prerequisites', 'times', 'flights', 'connections']
const VISITED_NAMES = ['visited', 'seen', 'visit', 'done', 'reached']
const NODE_NAMES = ['node', 'cur', 'curr', 'u', 'course', 'word']
const DIST_NAMES = ['dist', 'distance', 'indegree', 'level', 'cost']

/** Distinct colours for grid values: land/fresh/visited marks etc. */
const VALUE_STYLES: Record<string, string> = {
  '1': 'bg-verdigris/35 border-verdigris/60',
  '0': 'bg-ink border-line',
  '2': 'bg-rust/45 border-rust',
  '#': 'bg-ochre/35 border-ochre/70',
  X: 'bg-orchid/30 border-orchid/60',
  O: 'bg-sky/25 border-sky/50',
}

const toKey = (v: unknown): string => {
  if (isTuple(v)) return v.$tuple.map(toKey).join(',')
  if (Array.isArray(v)) return v.map(toKey).join(',')
  return JSON.stringify(v)
}

function collection(v: unknown): unknown[] | null {
  if (isSet(v)) return v.$set
  if (isDict(v)) return v.$dict.map(([k]) => k)
  if (isDeque(v)) return v.$deque
  if (Array.isArray(v)) return v
  return null
}

const pickName = (configured: unknown, names: string[], locals: Record<string, ScopedValue>, ok: (v: TraceValue) => boolean) =>
  [configured as string | undefined, ...names].find((n) => n && n in locals && ok(locals[n].value))

// ------------------------------------------------------------------------------------------
// Grid view
// ------------------------------------------------------------------------------------------

function GridView({ name, grid, prevGrid, cell, marks, queued, heap }: {
  name: string
  grid: unknown[][]
  prevGrid: unknown[][] | null
  cell: [number, number] | null
  marks: Set<string>
  queued: Set<string>
  heap: Record<string, HeapObject>
}) {
  const numeric = grid.flat().every((v) => typeof v === 'number')
  const values = grid.flat().filter((v): v is number => typeof v === 'number')
  const max = Math.max(1, ...values)
  const isHeights = numeric && new Set(values).size > 3
  return (
    <div>
      <div className="mb-1.5 font-mono text-xs text-muted">{name}</div>
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(...grid.map((r) => r.length))}, 2.5rem)` }}>
        {grid.flatMap((row, r) =>
          row.map((v, c) => {
            const k = `${r},${c}`
            const current = cell && cell[0] === r && cell[1] === c
            const changed = prevGrid && JSON.stringify(prevGrid[r]?.[c]) !== JSON.stringify(v)
            const text = formatValue(v, heap, 1).replace(/^'|'$/g, '')
            const style = isHeights ? 'border-line' : (VALUE_STYLES[text] ?? 'bg-panel border-line')
            const heat = isHeights ? { backgroundColor: `rgba(129,140,248,${0.08 + (0.5 * (v as number)) / max})` } : undefined
            return (
              <motion.div
                key={k}
                initial={false}
                animate={{ scale: changed ? [1.15, 1] : 1 }}
                className={`relative flex h-10 w-10 items-center justify-center rounded-md border font-mono text-xs ${style} ${
                  current ? 'ring-2 ring-forge' : ''
                }`}
                style={heat}
              >
                {text}
                {marks.has(k) && <span className="absolute top-0.5 right-1 h-1.5 w-1.5 rounded-full bg-verdigris" />}
                {queued.has(k) && <span className="absolute bottom-0.5 left-1 h-1.5 w-1.5 rounded-full bg-sky" />}
              </motion.div>
            )
          }),
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Node-link graph view
// ------------------------------------------------------------------------------------------

interface GraphModel {
  nodes: string[]
  labels: Map<string, string>
  edges: { from: string; to: string; weight?: string }[]
  /** Optional split into two clusters (Clone Graph: originals left, copies right). */
  groups?: Map<string, 0 | 1>
}

function fromAdjacency(v: unknown, heap: Record<string, HeapObject>): GraphModel | null {
  const entries: [string, unknown][] = isDict(v)
    ? v.$dict.map(([k, x]) => [toKey(k), x])
    : Array.isArray(v)
      ? v.map((x, i) => [String(i), x])
      : []
  if (!entries.length) return null
  const nodes = new Set<string>()
  const labels = new Map<string, string>()
  const edges: GraphModel['edges'] = []
  for (const [k, list] of entries) {
    nodes.add(k)
    labels.set(k, k.replace(/^"|"$/g, ''))
    const items = collection(list)
    if (!items) continue
    for (const item of items) {
      // neighbours are ids, or (neighbour, weight) pairs
      const pair = isTuple(item) ? item.$tuple : Array.isArray(item) ? item : null
      const to = toKey(pair ? pair[0] : item)
      nodes.add(to)
      if (!labels.has(to)) labels.set(to, to.replace(/^"|"$/g, ''))
      edges.push({ from: k, to, weight: pair && pair.length > 1 ? formatValue(pair[1], heap, 1) : undefined })
    }
  }
  return { nodes: [...nodes], labels, edges }
}

function fromEdgeList(v: unknown, heap: Record<string, HeapObject>): GraphModel | null {
  const list = asCells(v)
  if (!list || !list.length || !list.every((e) => Array.isArray(e) && e.length >= 2)) return null
  const nodes = new Set<string>()
  const edges: GraphModel['edges'] = []
  for (const e of list as unknown[][]) {
    const [a, b] = [toKey(e[0]), toKey(e[1])]
    nodes.add(a)
    nodes.add(b)
    edges.push({ from: a, to: b, weight: e.length > 2 ? formatValue(e[2], heap, 1) : undefined })
  }
  const labels = new Map([...nodes].map((n) => [n, n.replace(/^"|"$/g, '')]))
  return { nodes: [...nodes].sort((x, y) => Number(x) - Number(y) || x.localeCompare(y)), labels, edges }
}

/**
 * Graph made of node objects with a `neighbors` field (Clone Graph). Nodes that existed at the
 * first step are the originals; nodes created later are copies, drawn as a second cluster.
 */
function fromObjects(heap: Record<string, HeapObject>, originals: Set<string>): GraphModel | null {
  const ids = Object.keys(heap).filter((id) => 'neighbors' in heap[id].fields)
  if (!ids.length) return null
  const edges: GraphModel['edges'] = []
  for (const id of ids) {
    const ns = heap[id].fields.neighbors
    if (Array.isArray(ns)) for (const n of ns) if (isRef(n) && ids.includes(String(n.$ref))) edges.push({ from: id, to: String(n.$ref) })
  }
  const groups = new Map(ids.map((id) => [id, originals.has(id) ? 0 : 1] as [string, 0 | 1]))
  const labels = new Map(ids.map((id) => [id, formatValue(heap[id].fields.val, heap, 1) + (groups.get(id) ? '′' : '')]))
  const byVal = (a: string, b: string) => Number(heap[a].fields.val) - Number(heap[b].fields.val)
  return { nodes: ids.sort(byVal), labels, edges, groups: [...groups.values()].includes(1) ? groups : undefined }
}

function useCircleLayout(steps: TraceStep[], nodes: string[], groups?: Map<string, 0 | 1>) {
  // Nodes sit on a circle (or two side-by-side circles when the graph has two clusters).
  return useMemo(() => {
    const clusters: string[][] = groups
      ? [nodes.filter((id) => groups.get(id) !== 1), nodes.filter((id) => groups.get(id) === 1)]
      : [[...new Set(nodes)]]
    const largest = Math.max(1, ...clusters.map((c) => c.length))
    const radius = Math.max(groups ? 75 : 95, largest * 14)
    const pos = new Map<string, { x: number; y: number }>()
    clusters.forEach((cluster, ci) => {
      const cx = radius + 40 + ci * (2 * radius + 70)
      cluster.forEach((id, i) => {
        const a = (2 * Math.PI * i) / Math.max(cluster.length, 1) - Math.PI / 2
        pos.set(id, { x: cx + radius * Math.cos(a), y: radius + 30 + radius * Math.sin(a) })
      })
    })
    return { pos, size: { w: clusters.length * (2 * radius + 70) + 10, h: 2 * radius + 70 } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, nodes.join('|'), groups ? [...groups.entries()].join('|') : ''])
}

function GraphView({ model, steps, current, visited, queued, dist, heap }: {
  model: GraphModel
  steps: TraceStep[]
  current: Set<string>
  visited: Set<string>
  queued: Set<string>
  dist: Map<string, string>
  heap: Record<string, HeapObject>
}) {
  const { pos, size } = useCircleLayout(steps, model.nodes, model.groups)
  const pairSet = new Set(model.edges.map((e) => `${e.from}>${e.to}`))
  const R = 16
  void heap
  return (
    <svg width={size.w} height={size.h} className="block">
      <defs>
        <marker id="g-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#6B7290" />
        </marker>
      </defs>
      {model.edges.map((e, i) => {
        const a = pos.get(e.from)
        const b = pos.get(e.to)
        if (!a || !b || e.from === e.to) return null
        const both = pairSet.has(`${e.to}>${e.from}`)
        if (both && e.from > e.to) return null // undirected: draw once
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy) || 1
        const x2 = b.x - (dx / len) * (R + 3)
        const y2 = b.y - (dy / len) * (R + 3)
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={x2} y2={y2} stroke="#3B4256" strokeWidth={1.4} markerEnd={both ? undefined : 'url(#g-arrow)'} />
            {e.weight && (
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" className="fill-ochre font-mono text-[10px]">
                {e.weight}
              </text>
            )}
          </g>
        )
      })}
      {model.nodes.map((id) => {
        const p = pos.get(id)!
        const isCur = current.has(id)
        const isVisited = visited.has(id)
        return (
          <g key={id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={R}
              fill={isCur ? 'rgba(0,240,255,0.3)' : isVisited ? 'rgba(16,185,129,0.3)' : '#0F1220'}
              stroke={isCur ? '#00F0FF' : queued.has(id) ? '#818CF8' : isVisited ? '#10B981' : '#262B3D'}
              strokeWidth={isCur || queued.has(id) ? 2 : 1.4}
            />
            <text x={p.x} y={p.y + 4} textAnchor="middle" className="fill-chalk font-mono text-[11px]">
              {(model.labels.get(id) ?? id).slice(0, 5)}
            </text>
            {dist.has(id) && (
              <text x={p.x} y={p.y + R + 12} textAnchor="middle" className="fill-sky font-mono text-[10px]">
                {dist.get(id)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ------------------------------------------------------------------------------------------

export default function GraphGridVisualizer({ step, prev, steps, config }: VisualizerProps) {
  const locals = visibleLocals(step)
  const prevLocals = visibleLocals(prev)
  const heap = step.heap

  const isGrid = (v: TraceValue) => {
    const rows = asCells(v)
    return !!rows && rows.length > 0 && rows.every((r) => Array.isArray(r) && r.every((x) => !Array.isArray(x) && !isObj(x)))
  }
  const gridName = pickName(config.grid, [], locals, isGrid) ?? Object.keys(locals).find((n) => isGrid(locals[n].value) && asCells(locals[n].value)!.length > 1 && (asCells(locals[n].value)![0] as unknown[]).length > 1 && !GRAPH_NAMES.includes(n) && !EDGE_NAMES.includes(n))

  const owned = new Set<string>()
  let content: ReactNode = null

  // Highlights shared by both views
  const visitedName = pickName(undefined, [...((config.visited as string[] | undefined) ?? []), ...VISITED_NAMES], locals, (v) => collection(v) !== null)
  const visitedKeys = new Set((visitedName ? collection(locals[visitedName].value) ?? [] : []).map(toKey))
  const queueName = Object.keys(locals).find((n) => isDeque(locals[n].value) || (/queue|^q$/i.test(n) && Array.isArray(locals[n].value)))
  const queuedKeys = new Set((queueName ? collection(locals[queueName].value) ?? [] : []).map((v) => {
    const t = isTuple(v) ? v.$tuple : Array.isArray(v) ? v : null
    return t && t.length >= 2 && typeof t[0] === 'number' ? `${t[0]},${t[1]}` : toKey(t ? t[0] : v)
  }))

  if (gridName) {
    owned.add(gridName)
    const pair = (config.cell as [string, string] | undefined) ?? CELL_PAIRS.find(([a, b]) => typeof locals[a]?.value === 'number' && typeof locals[b]?.value === 'number')
    const cell: [number, number] | null =
      pair && typeof locals[pair[0]]?.value === 'number' && typeof locals[pair[1]]?.value === 'number'
        ? [locals[pair[0]].value as number, locals[pair[1]].value as number]
        : null
    if (pair) pair.forEach((n) => owned.add(n))
    const marks = new Set([...visitedKeys].map((k) => k.replace(/[[\]]/g, '')))
    content = (
      <GridView
        name={gridName}
        grid={asCells(locals[gridName].value) as unknown[][]}
        prevGrid={prevLocals[gridName] ? (asCells(prevLocals[gridName].value) as unknown[][]) : null}
        cell={cell}
        marks={marks}
        queued={queuedKeys}
        heap={heap}
      />
    )
  } else {
    const graphName = pickName(config.graph, GRAPH_NAMES, locals, (v) => isDict(v) || Array.isArray(v))
    const edgeName = pickName(config.edges, EDGE_NAMES, locals, (v) => Array.isArray(v))
    const model =
      (graphName && fromAdjacency(locals[graphName].value, heap)) ||
      (edgeName && fromEdgeList(locals[edgeName].value, heap)) ||
      fromObjects(heap, new Set(Object.keys(steps[0]?.heap ?? {})))
    if (graphName) owned.add(graphName)
    if (edgeName) owned.add(edgeName)
    if (model) {
      const current = new Set<string>()
      for (const n of [config.node as string | undefined, ...NODE_NAMES]) {
        if (!n || !(n in locals)) continue
        const v = locals[n].value
        current.add(isRef(v) ? String(v.$ref) : toKey(v))
        break
      }
      // object graphs: highlight the nodes each variable points at
      if (!graphName && !edgeName) {
        Object.entries(locals).forEach(([n, sv]) => {
          if (isRef(sv.value) && heap[String(sv.value.$ref)] && NODE_NAMES.includes(n)) current.add(String(sv.value.$ref))
        })
      }
      const distName = pickName(config.dist, DIST_NAMES, locals, (v) => collection(v) !== null)
      const dist = new Map<string, string>()
      if (distName) {
        owned.add(distName)
        const v = locals[distName].value
        if (isDict(v)) v.$dict.forEach(([k, x]) => dist.set(toKey(k), formatValue(x, heap, 1)))
        else asCells(v)?.forEach((x, i) => dist.set(String(i), formatValue(x, heap, 1)))
      }
      content = (
        <div>
          <div className="mb-1 flex flex-wrap gap-4 text-2xs text-faint">
            {graphName && <span className="font-mono text-xs text-muted">{graphName}</span>}
            <span><span className="text-forge">●</span> current</span>
            <span><span className="text-verdigris">●</span> {visitedName ?? 'visited'}</span>
            {queueName && <span><span className="text-sky">○</span> in {queueName}</span>}
            {distName && <span className="text-sky">numbers below nodes: {distName}</span>}
            {model.groups && <span>left: original graph, right: your copies (′)</span>}
          </div>
          <GraphView model={model} steps={steps} current={current} visited={visitedKeys} queued={queuedKeys} dist={dist} heap={heap} />
        </div>
      )
    }
  }

  if (queueName) owned.add(queueName)
  const { models, pointerNames } = buildArrays(locals, prevLocals, { ...config, window: null }, owned, false)
  const queueItems = queueName ? (collection(locals[queueName].value) ?? []) : []
  const prevQueue = queueName && prevLocals[queueName] ? collection(prevLocals[queueName].value) : null

  return (
    <div className="flex flex-col gap-5">
      {content ?? <p className="text-sm text-muted">No grid or graph in scope at this step.</p>}
      {queueName && (
        <QueueConveyor name={queueName} items={queueItems} change={describeChange(prevQueue, queueItems, heap, true)} heap={heap} />
      )}
      {models.map((m) => (
        <ArrayRow key={m.name} model={m} heap={heap} />
      ))}
      <SidePanels
        locals={locals}
        prevLocals={prevLocals}
        heap={heap}
        config={config}
        exclude={new Set([...owned, ...models.map((m) => m.name), ...pointerNames])}
      />
    </div>
  )
}
