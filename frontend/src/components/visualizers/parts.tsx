import { AnimatePresence, motion } from 'motion/react'
import type { HeapObject, VizConfig } from '../../api/types'
import {
  asCells,
  formatValue,
  isDict,
  isPrimitive,
  isSet,
  POINTER_NAMES,
  type ScopedValue,
} from '../../lib/trace'

const POINTER_COLORS = ['#00F0FF', '#38BDF8', '#94A3B8', '#10B981', '#F59E0B', '#F8FAFC']
const RANGE_PAIRS: [string, string][] = [
  ['l', 'r'], ['left', 'right'], ['lo', 'hi'], ['low', 'high'], ['start', 'end'],
]

export interface ArrayModel {
  name: string
  cells: unknown[]
  prevCells: unknown[] | null
  pointers: { name: string; index: number; color: string }[]
  range: [number, number] | null
}

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v)

/**
 * Arrays to draw (configured first, then auto-detected lists and strings), with the integer
 * pointers and [lo..hi] range that point into them. `exclude` keeps variables another view owns
 * (e.g. the stack in StackQueueVisualizer) out of the array rows.
 */
export function buildArrays(
  locals: Record<string, ScopedValue>,
  prevLocals: Record<string, ScopedValue>,
  config: VizConfig,
  exclude: Set<string> = new Set(),
  autoPointers = true,
) {
  const preferred = (config.arrays ?? []).filter((n) => !exclude.has(n) && asCells(locals[n]?.value))
  const auto = Object.keys(locals).filter((n) => {
    if (preferred.includes(n) || exclude.has(n)) return false
    const cells = asCells(locals[n].value)
    return cells !== null && cells.length > 0 && cells.length <= 200 && typeof locals[n].value !== 'string'
  })
  const strings = Object.keys(locals).filter(
    (n) => !preferred.includes(n) && !exclude.has(n) && typeof locals[n].value === 'string' && (locals[n].value as string).length > 1,
  )
  const names = [...preferred, ...auto, ...strings].slice(0, 4)

  // Pointer specs: "i" (on the first array) or "j:other" (on a named array)
  const pointerSpecs: { name: string; on: string | null }[] = (config.pointers ?? []).map((p) => {
    const [name, on] = p.split(':')
    return { name, on: on ?? null }
  })
  const explicit = new Set(pointerSpecs.map((p) => p.name))
  const watched = new Set(config.watch ?? [])
  for (const n of autoPointers ? POINTER_NAMES : []) {
    if (!explicit.has(n) && !watched.has(n) && isInt(locals[n]?.value)) pointerSpecs.push({ name: n, on: null })
  }

  let colorIdx = 0
  const colorOf = new Map<string, string>()
  const color = (n: string) => {
    if (!colorOf.has(n)) colorOf.set(n, POINTER_COLORS[colorIdx++ % POINTER_COLORS.length])
    return colorOf.get(n)!
  }

  const models: ArrayModel[] = names.map((name, ai) => {
    const cells = asCells(locals[name].value)!
    const prevCells = prevLocals[name] ? asCells(prevLocals[name].value) : null
    const pointers = pointerSpecs
      .filter((p) => (p.on ? p.on === name : ai === 0) && isInt(locals[p.name]?.value))
      .map((p) => ({ name: p.name, index: locals[p.name].value as number, color: color(p.name) }))
      .filter((p) => p.index >= 0 && p.index <= cells.length)

    let range: [number, number] | null = null
    if (ai === 0) {
      // `window: null` in the config turns the range highlight off (e.g. binary search on the
      // answer, where lo/hi are values, not indices).
      const pair =
        'window' in config
          ? config.window
          : RANGE_PAIRS.find(([a, b]) => isInt(locals[a]?.value) && isInt(locals[b]?.value))
      if (pair && isInt(locals[pair[0]]?.value) && isInt(locals[pair[1]]?.value)) {
        range = [locals[pair[0]].value as number, locals[pair[1]].value as number]
      }
    }
    return { name, cells, prevCells, pointers, range }
  })
  return { models, pointerNames: new Set(pointerSpecs.map((p) => p.name)) }
}

export function ArrayRow({ model, heap }: { model: ArrayModel; heap: Record<string, HeapObject> }) {
  const { name, cells, prevCells, pointers, range } = model
  const slots = Math.max(cells.length, ...pointers.map((p) => p.index + 1))
  const labels = cells.map((c) => formatValue(c, heap, 1))
  // Cells grow with their content (long numbers, nested lists) up to a cap; all cells in a row
  // share one width so the window overlay can be positioned by index.
  const longest = Math.max(1, ...labels.map((l) => l.length))
  const cellRem = Math.min(12, Math.max(3, longest * 0.55 + 1))
  const pitch = cellRem + 0.25
  return (
    <div className="min-w-0">
      <div className="mb-1.5 font-mono text-xs text-muted">{name}</div>
      <div className="overflow-x-auto pb-1">
        <div className="relative inline-flex gap-1 pt-1">
          {range && range[0] <= range[1] && range[0] < slots && (
            <motion.div
              className="pointer-events-none absolute rounded-md border-2 border-verdigris/80 bg-verdigris/10"
              initial={false}
              animate={{
                left: `calc(${range[0] * pitch}rem - 3px)`,
                width: `calc(${(Math.min(range[1], slots - 1) - range[0] + 1) * pitch - 0.25}rem + 6px)`,
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              style={{ top: 0, height: '3.25rem' }}
            />
          )}
          {Array.from({ length: slots }, (_, i) => {
            const exists = i < cells.length
            const changed = exists && prevCells !== null && JSON.stringify(prevCells[i]) !== JSON.stringify(cells[i])
            const here = pointers.filter((p) => p.index === i)
            return (
              <div key={i} className="flex shrink-0 flex-col items-center" style={{ width: `${cellRem}rem` }}>
                <motion.div
                  className={`relative flex h-11 w-full items-center justify-center rounded-md border font-mono text-sm ${
                    exists ? 'border-line bg-panel' : 'border-dashed border-line/60 text-faint'
                  }`}
                  animate={{ backgroundColor: changed ? ['#0E4D57', '#0F1220'] : exists ? '#0F1220' : 'rgba(0,0,0,0)' }}
                  transition={{ duration: 0.7 }}
                  title={exists ? formatValue(cells[i], heap) : 'past the end'}
                >
                  <span className="truncate px-1">{exists ? labels[i] : '·'}</span>
                </motion.div>
                <div className="mt-0.5 font-mono text-2xs text-faint">{i}</div>
                <div className="flex min-h-5 flex-col items-center gap-0.5">
                  {here.map((p) => (
                    <motion.div
                      key={p.name}
                      layoutId={`ptr-${name}-${p.name}`}
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="flex flex-col items-center leading-none"
                      style={{ color: p.color }}
                    >
                      <span className="text-2xs">▲</span>
                      <span className="font-mono text-xs font-semibold">{p.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function MapPanel({ name, value, prevValue, heap }: { name: string; value: unknown; prevValue: unknown; heap: Record<string, HeapObject> }) {
  const prevKeys = new Map<string, string>()
  if (isDict(prevValue)) for (const [k, v] of prevValue.$dict) prevKeys.set(JSON.stringify(k), JSON.stringify(v))
  if (isSet(prevValue)) for (const k of prevValue.$set) prevKeys.set(JSON.stringify(k), '')

  const rows: { key: string; val: string | null; fresh: boolean }[] = isDict(value)
    ? value.$dict.map(([k, v]) => ({
        key: formatValue(k, heap, 1),
        val: formatValue(v, heap, 1),
        fresh: prevKeys.get(JSON.stringify(k)) !== JSON.stringify(v),
      }))
    : isSet(value)
      ? value.$set.map((k) => ({ key: formatValue(k, heap, 1), val: null, fresh: !prevKeys.has(JSON.stringify(k)) }))
      : []
  const kind = isDict(value) ? (value.$kind ?? 'dict') : 'set'

  return (
    <div className="min-w-40 rounded-md border border-line bg-panel/80">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-3 py-1.5">
        <span className="font-mono text-xs text-chalk">{name}</span>
        <span className="text-2xs text-faint">
          {kind}, {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>
      <div className="max-h-48 overflow-y-auto px-1 py-1 font-mono text-xs">
        {rows.length === 0 && <div className="px-2 py-1 text-faint">empty</div>}
        {rows.map((r) => (
          <motion.div
            key={`${r.key}=${r.val}`}
            initial={r.fresh ? { backgroundColor: 'rgba(0,240,255,0.35)' } : false}
            animate={{ backgroundColor: 'rgba(0,240,255,0)' }}
            transition={{ duration: 0.9 }}
            className="flex justify-between gap-4 rounded px-2 py-0.5"
          >
            <span className="text-sky">{r.key}</span>
            {r.val !== null && <span className="text-chalk">{r.val}</span>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/** Hash maps / sets and the remaining scalar variables, shown beside the main drawing. */
export function SidePanels({
  locals,
  prevLocals,
  heap,
  config,
  exclude,
}: {
  locals: Record<string, ScopedValue>
  prevLocals: Record<string, ScopedValue>
  heap: Record<string, HeapObject>
  config: VizConfig
  exclude: Set<string>
}) {
  const mapNames = [
    ...(config.maps ?? []).filter((n) => n in locals && !exclude.has(n)),
    ...Object.keys(locals).filter(
      (n) =>
        !(config.maps ?? []).includes(n) &&
        !exclude.has(n) &&
        (isDict(locals[n].value) || isSet(locals[n].value)),
    ),
  ]
  const watchOrder = [...(config.watch ?? []), ...Object.keys(locals)]
  const watch = [...new Set(watchOrder)].filter(
    (n) => n in locals && !exclude.has(n) && !mapNames.includes(n) && isPrimitive(locals[n].value),
  )
  const prevWatch = (n: string) => (prevLocals[n] ? JSON.stringify(prevLocals[n].value) : undefined)

  if (mapNames.length === 0 && watch.length === 0) return null
  return (
    <div className="flex flex-wrap items-start gap-3">
      {mapNames.map((n) => (
        <MapPanel key={n} name={n} value={locals[n].value} prevValue={prevLocals[n]?.value} heap={heap} />
      ))}
      {watch.length > 0 && (
        <div className="rounded-md border border-line bg-panel/80 px-3 py-2">
          <div className="mb-1 text-2xs text-faint">variables</div>
          <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 font-mono text-xs">
            {watch.map((n) => {
              const changed = prevWatch(n) !== JSON.stringify(locals[n].value)
              return (
                <div key={n} className="contents">
                  <span className="text-muted">{n}</span>
                  <span className={changed ? 'text-forge' : 'text-chalk'}>{formatValue(locals[n].value, heap)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/** "pushed 73" / "popped 71, 69" by comparing with the previous step. */
export function describeChange(prev: unknown[] | null, cur: unknown[], heap: Record<string, HeapObject>, queue: boolean) {
  if (!prev) return null
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  if (queue) {
    let removed = 0
    while (removed < prev.length && !same(prev.slice(removed), cur.slice(0, prev.length - removed))) removed++
    const added = cur.slice(prev.length - removed)
    const parts = []
    if (removed) parts.push(`dequeued ${prev.slice(0, removed).map((v) => formatValue(v, heap, 1)).join(', ')}`)
    if (added.length) parts.push(`enqueued ${added.map((v) => formatValue(v, heap, 1)).join(', ')}`)
    return parts.join(', ') || null
  }
  let common = 0
  while (common < prev.length && common < cur.length && same(prev[common], cur[common])) common++
  const popped = prev.slice(common).reverse()
  const pushed = cur.slice(common)
  const parts = []
  if (popped.length) parts.push(`popped ${popped.map((v) => formatValue(v, heap, 1)).join(', ')}`)
  if (pushed.length) parts.push(`pushed ${pushed.map((v) => formatValue(v, heap, 1)).join(', ')}`)
  return parts.join(', ') || null
}


/** Stable React keys for list items (value + occurrence), so push/pop animate per item. */
export function keyedItems(items: unknown[]) {
  const seen = new Map<string, number>()
  return items.map((v) => {
    const k = JSON.stringify(v)
    const n = seen.get(k) ?? 0
    seen.set(k, n + 1)
    return `${k}#${n}`
  })
}


/** Horizontal conveyor queue (front on the left), shared by the stack and graph visualizers. */
export function QueueConveyor({ name, items, change, heap }: { name: string; items: unknown[]; change: string | null; heap: Record<string, HeapObject> }) {
  const keys = keyedItems(items)
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="font-mono text-xs text-muted">{name}</div>
      <div className="flex items-center gap-2">
        <span className="text-2xs text-faint">front</span>
        <div className="flex min-h-12 min-w-24 items-center gap-1 overflow-x-auto rounded-md border-y-2 border-sky/40 bg-sky/5 px-1.5 py-1">
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((v, i) => (
              <motion.div
                key={keys[i]}
                layout
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className={`flex h-9 min-w-10 items-center justify-center rounded-md border px-2 font-mono text-sm ${
                  i === 0 ? 'border-forge bg-forge/15' : 'border-line bg-panel'
                }`}
              >
                {formatValue(v, heap, 1)}
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && <span className="px-2 text-xs text-faint">empty</span>}
        </div>
        <span className="text-2xs text-faint">back</span>
      </div>
      <div className="h-4 text-xs text-forge">{change}</div>
    </div>
  )
}

