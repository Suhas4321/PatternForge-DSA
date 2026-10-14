import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { HeapObject, VizConfig } from '../../api/types'
import { asCells, formatValue, isDeque, visibleLocals, type ScopedValue } from '../../lib/trace'
import { ArrayRow, buildArrays, describeChange, keyedItems, QueueConveyor, SidePanels } from './parts'
import type { VisualizerProps } from './types'


const STACK_NAME = /stack|^stk$|^st$/i
const QUEUE_NAME = /queue|^q$|^dq$/i
const MAX_VISIBLE = 12

function detect(locals: Record<string, ScopedValue>, config: VizConfig) {
  const configured = (key: 'stacks' | 'queues') =>
    ((config[key] as string[] | undefined) ?? []).filter((n) => asCells(locals[n]?.value))
  const stacks = configured('stacks')
  const queues = configured('queues')
  for (const [name, sv] of Object.entries(locals)) {
    if (stacks.includes(name) || queues.includes(name)) continue
    if (isDeque(sv.value) || (QUEUE_NAME.test(name) && Array.isArray(sv.value))) queues.push(name)
    else if (STACK_NAME.test(name) && Array.isArray(sv.value)) stacks.push(name)
  }
  return { stacks, queues }
}

/** Optional `stack_values: {stack: temperatures}` shows what each stored index points to. */
function referenced(value: unknown, into: unknown[] | null, heap: Record<string, HeapObject>) {
  if (!into || typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= into.length) return null
  return formatValue(into[value], heap, 1)
}

function StackView({ name, items, change, into, heap }: { name: string; items: unknown[]; change: string | null; into: unknown[] | null; heap: Record<string, HeapObject> }) {
  const hidden = Math.max(0, items.length - MAX_VISIBLE)
  const visible = items.slice(hidden)
  const keys = keyedItems(items).slice(hidden)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="font-mono text-xs text-muted">{name}</div>
      <div className="flex min-h-48 w-32 flex-col-reverse items-stretch gap-1 rounded-b-xl border-x-2 border-b-2 border-sky/40 bg-sky/5 p-1.5">
        <AnimatePresence initial={false}>
          {visible.map((v, i) => {
            const ref = referenced(v, into, heap)
            const top = i === visible.length - 1
            return (
              <motion.div
                key={keys[i]}
                layout
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className={`flex h-9 items-center justify-between rounded-md border px-2 font-mono text-sm ${
                  top ? 'border-forge bg-forge/15 text-chalk' : 'border-line bg-panel text-chalk'
                }`}
              >
                <span>{formatValue(v, heap, 1)}</span>
                {ref !== null && <span className="text-xs text-muted">{ref}</span>}
              </motion.div>
            )
          })}
        </AnimatePresence>
        {hidden > 0 && <div className="text-center text-2xs text-faint">+{hidden} below</div>}
        {items.length === 0 && <div className="py-2 text-center text-xs text-faint">empty</div>}
      </div>
      <div className="h-4 text-xs text-forge">{change}</div>
    </div>
  )
}

export default function StackQueueVisualizer({ step, prev, config }: VisualizerProps) {
  const locals = visibleLocals(step)
  const prevLocals = visibleLocals(prev)
  const heap = step.heap
  const { stacks, queues } = detect(locals, config)
  const owned = new Set([...stacks, ...queues])
  const { models, pointerNames } = buildArrays(locals, prevLocals, config, owned)
  const stackValues = (config.stack_values as Record<string, string> | undefined) ?? {}
  const cells = (n: string, src: Record<string, ScopedValue>) => (src[n] ? asCells(src[n].value) : null)

  return (
    <LayoutGroup>
      <div className="flex flex-col gap-5">
        {models.map((m) => (
          <ArrayRow key={m.name} model={m} heap={heap} />
        ))}
        {stacks.length + queues.length === 0 && (
          <p className="text-sm text-muted">No stack or queue in scope yet. It appears once your code creates one.</p>
        )}
        <div className="flex flex-wrap items-start gap-8">
          {stacks.map((n) => (
            <StackView
              key={n}
              name={n}
              items={cells(n, locals) ?? []}
              change={describeChange(cells(n, prevLocals), cells(n, locals) ?? [], heap, false)}
              into={stackValues[n] ? cells(stackValues[n], locals) : null}
              heap={heap}
            />
          ))}
          {queues.map((n) => (
            <QueueConveyor
              key={n}
              name={n}
              items={cells(n, locals) ?? []}
              change={describeChange(cells(n, prevLocals), cells(n, locals) ?? [], heap, true)}
              heap={heap}
            />
          ))}
        </div>
        <SidePanels
          locals={locals}
          prevLocals={prevLocals}
          heap={heap}
          config={config}
          exclude={new Set([...owned, ...models.map((m) => m.name), ...pointerNames])}
        />
      </div>
    </LayoutGroup>
  )
}
