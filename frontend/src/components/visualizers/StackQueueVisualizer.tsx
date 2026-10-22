import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { HeapObject, VizConfig } from '../../api/types'
import { asCells, formatValue, isDeque, visibleLocals, type ScopedValue } from '../../lib/trace'
import { ArrayRow, buildArrays, describeChange, keyedItems, SidePanels } from './parts'
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

/**
 * 3D Inset Glass Tube for Stack visualization with physical drop/squash physics.
 */
function GlassTubeStack({
  name,
  items,
  change,
  into,
  heap,
}: {
  name: string
  items: unknown[]
  change: string | null
  into: unknown[] | null
  heap: Record<string, HeapObject>
}) {
  const hidden = Math.max(0, items.length - MAX_VISIBLE)
  const visible = items.slice(hidden)
  const keys = keyedItems(items).slice(hidden)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="font-semibold text-chalk">{name}</span>
        <span className="rounded bg-sky/10 px-1.5 py-0.5 text-2xs text-sky">size {items.length}</span>
      </div>

      {/* Glass Tube Container */}
      <div className="relative flex flex-col items-center">
        {/* Glowing Rim Mouth */}
        <div className="relative z-10 -mb-1 flex h-4 w-36 items-center justify-center rounded-t-xl border border-sky/40 bg-gradient-to-r from-sky/20 via-sky/40 to-sky/20 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
          <div className="h-1.5 w-24 rounded-full bg-sky/30 blur-[1px]" />
          <span className="absolute -top-3.5 right-1 font-mono text-[9px] uppercase tracking-wider text-sky/70">
            Open Rim
          </span>
        </div>

        {/* Inset Tube Cylinder */}
        <div className="relative flex min-h-56 w-36 flex-col-reverse items-stretch gap-1.5 overflow-hidden rounded-b-2xl border-x-2 border-b-2 border-sky/30 bg-gradient-to-b from-ink/90 via-sky/[0.04] to-surface-2/80 p-2 shadow-[inset_0_4px_24px_rgba(0,0,0,0.6),0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur-md">
          {/* Glass Highlights */}
          <div className="pointer-events-none absolute inset-y-0 left-1 w-1 bg-gradient-to-b from-white/15 via-white/5 to-transparent blur-[0.5px]" />
          <div className="pointer-events-none absolute inset-y-0 right-1 w-0.5 bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

          {/* Tube Floor Reflector */}
          <div className="pointer-events-none absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-sky/10 to-transparent" />

          <AnimatePresence initial={false}>
            {visible.map((v, i) => {
              const actualIdx = hidden + i
              const ref = referenced(v, into, heap)
              const top = i === visible.length - 1
              return (
                <motion.div
                  key={keys[i]}
                  layout
                  initial={{ opacity: 0, y: -48, scaleX: 0.85, scaleY: 1.25 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scaleX: [0.92, 1.08, 0.98, 1],
                    scaleY: [1.2, 0.9, 1.03, 1],
                  }}
                  exit={{
                    opacity: 0,
                    y: -56,
                    scaleX: 0.8,
                    scaleY: 1.3,
                    transition: { duration: 0.22 },
                  }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  className={`group relative flex h-10 items-center justify-between rounded-lg border px-2.5 font-mono text-sm shadow-md transition-all ${
                    top
                      ? 'border-forge bg-forge/20 text-chalk shadow-[0_0_12px_rgba(255,107,0,0.25)] ring-1 ring-forge/40'
                      : 'border-line/70 bg-panel/90 text-chalk/90 hover:border-line'
                  }`}
                >
                  {/* Left Index Indicator */}
                  <span className="font-mono text-[10px] text-muted/60">[{actualIdx}]</span>

                  {/* Element Value */}
                  <span className="font-semibold">{formatValue(v, heap, 1)}</span>

                  {/* Right Referenced Value (e.g. temperatures[index]) */}
                  {ref !== null && (
                    <span className="rounded bg-black/40 px-1 py-0.5 text-2xs text-amber font-mono">
                      → {ref}
                    </span>
                  )}

                  {/* TOP Badge Pill on Inner Block */}
                  {top && (
                    <span className="absolute -top-2 right-1.5 rounded-full border border-forge/60 bg-forge px-1.5 py-0.2 font-mono text-[8px] font-bold uppercase tracking-wider text-ink shadow-sm">
                      TOP
                    </span>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {hidden > 0 && (
            <div className="py-1 text-center font-mono text-2xs text-muted/80">+{hidden} below</div>
          )}

          {items.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <span className="font-mono text-xs text-muted/60">Empty Tube</span>
              <span className="text-[10px] text-faint">Awaiting push</span>
            </div>
          )}
        </div>

        {/* Tube Pedestal Base */}
        <div className="mt-1 h-2 w-40 rounded-full border-t border-sky/30 bg-gradient-to-r from-transparent via-sky/20 to-transparent blur-[1px]" />
      </div>

      <div className="h-4 font-mono text-xs font-medium text-forge">{change}</div>
    </div>
  )
}

/**
 * Modern Glass Conveyor Chute for Queue visualization.
 */
function GlassConveyorQueue({
  name,
  items,
  change,
  heap,
}: {
  name: string
  items: unknown[]
  change: string | null
  heap: Record<string, HeapObject>
}) {
  const hidden = Math.max(0, items.length - MAX_VISIBLE)
  const visible = items.slice(0, MAX_VISIBLE)
  const keys = keyedItems(items).slice(0, MAX_VISIBLE)

  return (
    <div className="flex flex-col items-start gap-2 max-w-full">
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="font-semibold text-chalk">{name}</span>
        <span className="rounded bg-verdigris/10 px-1.5 py-0.5 text-2xs text-verdigris">
          queue length {items.length}
        </span>
      </div>

      {/* Horizontal Conveyor Body */}
      <div className="relative flex max-w-full items-center overflow-x-auto rounded-2xl border border-line/60 bg-gradient-to-r from-surface-2/90 via-ink/90 to-surface-2/90 p-3 shadow-[inset_0_2px_16px_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.25)]">
        {/* Conveyor Chute Headers */}
        <div className="mr-3 flex flex-col items-center border-r border-line/60 pr-3">
          <span className="font-mono text-[9px] uppercase tracking-wider text-verdigris">FRONT</span>
          <span className="text-2xs text-muted">← OUT</span>
        </div>

        {/* Queue Items Row */}
        <div className="flex items-center gap-2 min-h-12">
          <AnimatePresence initial={false}>
            {visible.map((v, i) => {
              const isFront = i === 0
              return (
                <motion.div
                  key={keys[i]}
                  layout
                  initial={{ opacity: 0, x: 36, scale: 0.85 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -36, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className={`relative flex h-10 min-w-12 items-center justify-center rounded-lg border px-3 font-mono text-sm shadow-sm ${
                    isFront
                      ? 'border-verdigris bg-verdigris/20 text-chalk shadow-[0_0_12px_rgba(16,185,129,0.25)] ring-1 ring-verdigris/40'
                      : 'border-line/70 bg-panel/90 text-chalk'
                  }`}
                >
                  <span className="font-semibold">{formatValue(v, heap, 1)}</span>
                  <span className="absolute -bottom-3 text-[9px] text-muted/60">[{i}]</span>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {hidden > 0 && (
            <div className="px-2 font-mono text-2xs text-muted">+{hidden} more</div>
          )}

          {items.length === 0 && (
            <div className="px-6 py-2 font-mono text-xs text-muted/60">Queue Empty</div>
          )}
        </div>

        <div className="ml-3 flex flex-col items-center border-l border-line/60 pl-3">
          <span className="font-mono text-[9px] uppercase tracking-wider text-sky">REAR</span>
          <span className="text-2xs text-muted">IN ←</span>
        </div>
      </div>

      <div className="h-4 font-mono text-xs font-medium text-verdigris">{change}</div>
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
      <div className="flex flex-col gap-6 w-full max-w-full">
        {models.map((m) => (
          <ArrayRow key={m.name} model={m} heap={heap} />
        ))}
        {stacks.length + queues.length === 0 && (
          <p className="text-sm text-muted">
            No stack or queue in scope yet. It appears once your code creates one.
          </p>
        )}
        <div className="flex flex-wrap items-start justify-center sm:justify-start gap-10">
          {stacks.map((n) => (
            <GlassTubeStack
              key={n}
              name={n}
              items={cells(n, locals) ?? []}
              change={describeChange(cells(n, prevLocals), cells(n, locals) ?? [], heap, false)}
              into={stackValues[n] ? cells(stackValues[n], locals) : null}
              heap={heap}
            />
          ))}
          {queues.map((n) => (
            <GlassConveyorQueue
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
