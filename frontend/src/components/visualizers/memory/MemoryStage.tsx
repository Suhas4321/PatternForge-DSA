import { ArrowRight, Box, Layers } from 'lucide-react'
import type { HeapObject, TraceStep, TraceValue } from '../../../api/types'
import { formatValue, isRef } from '../../../lib/trace'

interface MemoryStageProps {
  step?: TraceStep
  prevStep?: TraceStep
}

function collectRefs(val: TraceValue | undefined, out: Set<string> = new Set()): Set<string> {
  if (!val || typeof val !== 'object') return out
  if (isRef(val)) {
    out.add(String(val.$ref))
    return out
  }
  if (Array.isArray(val)) {
    val.forEach((v) => collectRefs(v, out))
    return out
  }
  if ('$tuple' in val && Array.isArray(val.$tuple)) val.$tuple.forEach((v) => collectRefs(v, out))
  else if ('$set' in val && Array.isArray(val.$set)) val.$set.forEach((v) => collectRefs(v, out))
  else if ('$deque' in val && Array.isArray(val.$deque)) val.$deque.forEach((v) => collectRefs(v, out))
  else if ('$dict' in val && Array.isArray(val.$dict)) {
    val.$dict.forEach(([k, v]) => {
      collectRefs(k, out)
      collectRefs(v, out)
    })
  }
  return out
}

function renderFieldValue(val: TraceValue, heap: Record<string, HeapObject>) {
  if (isRef(val)) {
    const id = String(val.$ref)
    const obj = heap[id]
    const label = obj?.fields?.val !== undefined ? `${obj.type}(${obj.fields.val})` : `#${id}`
    return (
      <span className="inline-flex items-center gap-1 rounded border border-cyan/40 bg-cyan/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-cyan">
        <ArrowRight size={10} />
        <span>ref {label}</span>
      </span>
    )
  }
  return <span className="text-chalk">{formatValue(val, heap, 1)}</span>
}

export default function MemoryStage({ step }: MemoryStageProps) {
  if (!step) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center font-mono text-xs text-muted">
        <Layers size={22} className="mb-2 text-faint" />
        <p>Run your code to inspect live stack frames and heap-allocated objects.</p>
      </div>
    )
  }

  const frames = step.frames ?? []
  const heap = step.heap ?? {}
  const heapEntries = Object.entries(heap)
  const activeFrame = frames[frames.length - 1]
  const activeRefs = new Set<string>()
  if (activeFrame) {
    Object.values(activeFrame.locals).forEach((v) => collectRefs(v, activeRefs))
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 overflow-y-auto p-3 font-mono text-xs sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-line pb-1.5">
          <span className="flex items-center gap-1.5 text-2xs font-bold uppercase text-cyan">
            <Layers size={12} /> Call Stack ({frames.length})
          </span>
          <span className="text-[11px] text-faint">Line {step.line}</span>
        </div>
        {frames.map((frame, idx) => {
          const isTop = idx === frames.length - 1
          const entries = Object.entries(frame.locals).filter(([k]) => k !== 'self')
          return (
            <div
              key={`${frame.func}-${idx}`}
              className={`rounded-xl border p-2.5 ${isTop ? 'border-cyan/50 bg-panel-2' : 'border-line bg-panel/60 opacity-80'}`}
            >
              <div className="mb-1.5 flex items-center justify-between border-b border-line/60 pb-1">
                <span className="font-bold text-chalk">{frame.func}()</span>
                <span className="text-[10px] font-semibold uppercase text-cyan">{isTop ? 'Active' : `Depth ${idx}`}</span>
              </div>
              <div className="flex flex-col gap-1">
                {entries.map(([varName, val]) => (
                  <div key={varName} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-muted">{varName}</span>
                    <div className="truncate">{renderFieldValue(val, heap)}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-line pb-1.5">
          <span className="flex items-center gap-1.5 text-2xs font-bold uppercase text-emerald">
            <Box size={12} /> Heap Objects ({heapEntries.length})
          </span>
          <span className="text-[11px] text-faint">Heap</span>
        </div>
        {heapEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-4 text-center text-2xs text-faint">
            No heap objects (`ListNode`, `TreeNode`, `GraphNode`) allocated at this step.
          </div>
        ) : (
          heapEntries.map(([id, obj]) => (
            <div
              key={id}
              className={`rounded-xl border p-2.5 ${activeRefs.has(id) ? 'border-emerald/50 bg-emerald/[0.07]' : 'border-line bg-panel-2/80'}`}
            >
              <div className="mb-1.5 flex items-center justify-between border-b border-line/50 pb-1 text-[11px]">
                <span className="font-bold text-emerald">
                  {obj.type} <span className="font-normal text-faint">#{id}</span>
                </span>
                {activeRefs.has(id) && (
                  <span className="rounded-full bg-emerald/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald">
                    Active Ref
                  </span>
                )}
              </div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-[11px]">
                {Object.entries(obj.fields).map(([field, fval]) => (
                  <div key={field} className="contents">
                    <span className="text-faint">.{field}</span>
                    <div className="truncate">{renderFieldValue(fval, heap)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
