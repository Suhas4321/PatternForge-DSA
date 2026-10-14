import type { HeapObject, TraceStep, TraceValue } from '../api/types'

type Obj = Record<string, unknown>

export const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
export const isRef = (v: unknown): v is { $ref: number } => isObj(v) && '$ref' in v
export const isDict = (v: unknown): v is { $dict: [TraceValue, TraceValue][]; $kind?: string } =>
  isObj(v) && '$dict' in v
export const isSet = (v: unknown): v is { $set: TraceValue[] } => isObj(v) && '$set' in v
export const isTuple = (v: unknown): v is { $tuple: TraceValue[] } => isObj(v) && '$tuple' in v
export const isDeque = (v: unknown): v is { $deque: TraceValue[] } => isObj(v) && '$deque' in v

export const isPrimitive = (v: unknown): v is null | boolean | number | string =>
  v === null || ['boolean', 'number', 'string'].includes(typeof v) || (isObj(v) && ('$inf' in v || '$nan' in v))

/** Compact, Python-flavoured rendering of a traced value. */
export function formatValue(v: unknown, heap: Record<string, HeapObject> = {}, depth = 0): string {
  if (v === null) return 'None'
  if (typeof v === 'boolean') return v ? 'True' : 'False'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') return depth === 0 ? JSON.stringify(v) : `'${v}'`
  if (Array.isArray(v)) return `[${v.map((x) => formatValue(x, heap, depth + 1)).join(', ')}]`
  if (!isObj(v)) return String(v)
  if ('$inf' in v) return v.$inf === 1 ? 'inf' : '-inf'
  if ('$nan' in v) return 'nan'
  if ('$more' in v && Object.keys(v).length === 1) return `…+${v.$more}`
  if ('$repr' in v) return String(v.$repr)
  if (isTuple(v)) return `(${v.$tuple.map((x) => formatValue(x, heap, depth + 1)).join(', ')})`
  if (isSet(v)) return v.$set.length ? `{${v.$set.map((x) => formatValue(x, heap, depth + 1)).join(', ')}}` : 'set()'
  if (isDeque(v)) return `deque([${v.$deque.map((x) => formatValue(x, heap, depth + 1)).join(', ')}])`
  if (isDict(v))
    return `{${v.$dict.map(([k, x]) => `${formatValue(k, heap, depth + 1)}: ${formatValue(x, heap, depth + 1)}`).join(', ')}}`
  if (isRef(v)) {
    const obj = heap[String(v.$ref)]
    if (!obj) return `<ref ${v.$ref}>`
    return 'val' in obj.fields ? `${obj.type}(${formatValue(obj.fields.val, heap, depth + 1)})` : `<${obj.type}>`
  }
  return JSON.stringify(v)
}

export interface ScopedValue {
  value: TraceValue
  frameId: number
  func: string
}

/**
 * Variables visible at a step: innermost frame first, then enclosing frames for names the
 * inner frame doesn't define (so `res` from an outer method stays visible inside `dfs`).
 */
export function visibleLocals(step: TraceStep | undefined): Record<string, ScopedValue> {
  const out: Record<string, ScopedValue> = {}
  if (!step) return out
  for (let i = step.frames.length - 1; i >= 0; i--) {
    const f = step.frames[i]
    for (const [name, value] of Object.entries(f.locals)) {
      if (name in out) continue
      out[name] = { value, frameId: f.id, func: f.func }
      // Design problems keep their state on the instance: expose self.stack, self.cache, ...
      if (name === 'self' && isRef(value)) {
        const obj = step.heap[String(value.$ref)]
        for (const [field, fv] of Object.entries(obj?.fields ?? {})) {
          const key = `self.${field}`
          if (!(key in out)) out[key] = { value: fv, frameId: f.id, func: f.func }
        }
      }
    }
  }
  return out
}

/** Names whose value differs from the previous step (used to flash changes). */
export function changedNames(prev: TraceStep | undefined, cur: TraceStep | undefined): Set<string> {
  const changed = new Set<string>()
  if (!cur) return changed
  const a = visibleLocals(prev)
  const b = visibleLocals(cur)
  for (const [name, sv] of Object.entries(b)) {
    if (!(name in a) || JSON.stringify(a[name].value) !== JSON.stringify(sv.value)) changed.add(name)
  }
  return changed
}

/** Array-like cells for a value: lists, tuples, deques, and strings (as characters). */
export function asCells(v: unknown): unknown[] | null {
  if (typeof v === 'string') return [...v]
  if (Array.isArray(v)) return v
  if (isTuple(v)) return v.$tuple
  if (isDeque(v)) return v.$deque
  return null
}

export const POINTER_NAMES = [
  'i', 'j', 'l', 'r', 'left', 'right', 'lo', 'hi', 'low', 'high', 'mid', 'start', 'end',
  'slow', 'fast', 'read', 'write', 'w', 'p', 'q', 'idx', 'index', 'cur', 'curr', 'ptr', 'zero', 'two', 'one',
]
