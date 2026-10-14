import { motion } from 'motion/react'
import type { HeapObject } from '../../api/types'
import { asCells, formatValue, isObj, visibleLocals, type ScopedValue } from '../../lib/trace'
import { ArrayRow, buildArrays, SidePanels } from './parts'
import type { VisualizerProps } from './types'

const TABLE_NAMES = ['dp', 'table', 'memo', 'cache', 'f']

// ------------------------------------------------------------------------------------------
// Which cells does the current line read / write? Parse `dp[...]` subscripts on the line and
// evaluate the index expressions with the current variable values.
// ------------------------------------------------------------------------------------------

type Num = number | null

/** Tiny evaluator for index expressions: ints, names, + - * // % and parentheses. */
function evalIndex(expr: string, locals: Record<string, ScopedValue>): Num {
  const matched = expr.match(/\d+|[A-Za-z_]\w*|\/\/|[-+*%()]/g)
  if (!matched || matched.join('').length !== expr.replace(/\s+/g, '').length) return null
  const tokens: string[] = matched
  let pos = 0
  const peek = () => tokens[pos]
  const atom = (): Num => {
    const t = tokens[pos++]
    if (t === undefined) return null
    if (t === '(') {
      const v = sum()
      pos++ // ')'
      return v
    }
    if (t === '-') {
      const v = atom()
      return v === null ? null : -v
    }
    if (/^\d+$/.test(t)) return Number(t)
    const v = locals[t]?.value
    return typeof v === 'number' && Number.isInteger(v) ? v : null
  }
  const product = (): Num => {
    let v = atom()
    while (peek() === '*' || peek() === '//' || peek() === '%') {
      const op = tokens[pos++]
      const r = atom()
      if (v === null || r === null || (op !== '*' && r === 0)) return null
      v = op === '*' ? v * r : op === '//' ? Math.floor(v / r) : ((v % r) + r) % r
    }
    return v
  }
  function sum(): Num {
    let v = product()
    while (peek() === '+' || peek() === '-') {
      const op = tokens[pos++]
      const r = product()
      if (v === null || r === null) return null
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  const result = sum()
  return pos === tokens.length ? result : null
}

/** Splits `dp[a][b - 1]` occurrences on a line into index lists. */
function subscripts(line: string, name: string): { start: number; exprs: string[] }[] {
  const out: { start: number; exprs: string[] }[] = []
  const re = new RegExp(`(?<![\\w.])${name.replace('.', '\\.')}\\s*\\[`, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) {
    const exprs: string[] = []
    let i = m.index + m[0].length - 1
    while (line[i] === '[') {
      let depth = 0
      let j = i
      for (; j < line.length; j++) {
        if (line[j] === '[') depth++
        else if (line[j] === ']' && --depth === 0) break
      }
      exprs.push(line.slice(i + 1, j))
      i = j + 1
      while (line[i] === ' ') i++
    }
    out.push({ start: m.index, exprs })
  }
  return out
}

function lineAccess(code: string, lineNo: number, name: string, locals: Record<string, ScopedValue>, dims: number[]) {
  const line = code.split('\n')[lineNo - 1] ?? ''
  const subs = subscripts(line, name)
  const assign = /^\s*[^=!<>]*?(?<![=!<>])(=|\+=|-=|\*=|\|=|&=)(?!=)/.exec(line)
  const assignEnd = assign ? assign.index + assign[0].length : -1
  const norm = (idx: Num[], ) =>
    idx.length && idx.every((v, d) => v !== null && dims[d] !== undefined)
      ? idx.map((v, d) => ((v as number) < 0 ? (v as number) + dims[d] : (v as number)))
      : null
  let write: number[] | null = null
  const reads: number[][] = []
  for (const s of subs) {
    const idx = norm(s.exprs.map((e) => evalIndex(e, locals)))
    if (!idx) continue
    const onLeft = assign && s.start < assignEnd - assign[1].length
    if (onLeft && !write) {
      write = idx
      if (assign && assign[1] !== '=') reads.push(idx) // dp[i] += ... also reads dp[i]
    } else reads.push(idx)
  }
  return { write, reads }
}

// ------------------------------------------------------------------------------------------

function labelsOf(name: string | undefined, locals: Record<string, ScopedValue>): string[] | null {
  if (!name || !(name in locals)) return null
  const cells = asCells(locals[name].value)
  return cells ? cells.map((c) => formatValue(c, {}, 1).replace(/^'|'$/g, '')) : null
}

function cellText(v: unknown, heap: Record<string, HeapObject>) {
  if (v === true) return 'T'
  if (v === false) return 'F'
  if (isObj(v) && '$inf' in v) return v.$inf === 1 ? '∞' : '-∞'
  return formatValue(v, heap, 1)
}

export default function DPTableVisualizer({ step, prev, config, code }: VisualizerProps) {
  const locals = visibleLocals(step)
  const prevLocals = visibleLocals(prev)
  const heap = step.heap
  const name = [config.table as string | undefined, ...TABLE_NAMES].find(
    (n) => n && n in locals && asCells(locals[n].value),
  )

  if (!name) {
    const { models, pointerNames } = buildArrays(locals, prevLocals, config)
    return (
      <div className="flex flex-col gap-5">
        <p className="text-sm text-muted">The dp table appears once your code creates a list named dp (or table / memo).</p>
        {models.map((m) => (
          <ArrayRow key={m.name} model={m} heap={heap} />
        ))}
        <SidePanels locals={locals} prevLocals={prevLocals} heap={heap} config={config} exclude={new Set([...models.map((m) => m.name), ...pointerNames])} />
      </div>
    )
  }

  const raw = asCells(locals[name].value)!
  const is2D = raw.length > 0 && raw.every((r) => Array.isArray(r))
  const rows: unknown[][] = is2D ? (raw as unknown[][]) : [raw]
  const prevRaw = prevLocals[name] ? asCells(prevLocals[name].value) : null
  const prevRows: unknown[][] | null = prevRaw ? (is2D ? (prevRaw as unknown[][]) : [prevRaw]) : null
  const width = Math.max(...rows.map((r) => r.length))
  const dims = is2D ? [rows.length, width] : [width]
  const { write, reads } = step.event === 'line' ? lineAccess(code, step.line, name, locals, dims) : { write: null, reads: [] }
  const key = (r: number, c: number) => (is2D ? `${r},${c}` : `${c}`)
  const readSet = new Set(reads.map((idx) => idx.join(',')))
  const writeKey = write ? write.join(',') : null

  const offset = typeof config.label_offset === 'number' ? config.label_offset : 0
  const colLabels = labelsOf(config.col_labels as string | undefined, locals)
  const rowLabels = labelsOf(config.row_labels as string | undefined, locals)
  const label = (labels: string[] | null, i: number) => (labels ? (labels[i - offset] ?? '') : '')

  const { models, pointerNames } = buildArrays(locals, prevLocals, { ...config, window: null }, new Set([name]), false)

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-x-auto">
        <div className="mb-1.5 flex items-center gap-4 text-xs">
          <span className="font-mono text-muted">{name}</span>
          <span className="flex items-center gap-1.5 text-faint">
            <span className="h-2.5 w-2.5 rounded-sm border border-verdigris bg-verdigris/30" /> being written
          </span>
          <span className="flex items-center gap-1.5 text-faint">
            <span className="h-2.5 w-2.5 rounded-sm border border-sky bg-sky/25" /> read by this line
          </span>
        </div>
        <table className="border-separate border-spacing-1 font-mono text-sm">
          <thead>
            <tr>
              {is2D && <th />}
              {Array.from({ length: width }, (_, c) => (
                <th key={c} className="px-1 text-center font-normal">
                  {colLabels && <div className="text-xs text-forge">{label(colLabels, c) || '·'}</div>}
                  <div className="text-2xs text-faint">{c}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {is2D && (
                  <th className="pr-1 text-right font-normal">
                    {rowLabels && <span className="mr-1.5 text-xs text-forge">{label(rowLabels, r) || '·'}</span>}
                    <span className="text-2xs text-faint">{r}</span>
                  </th>
                )}
                {Array.from({ length: width }, (_, c) => {
                  const v = row[c]
                  const k = key(r, c)
                  const isWrite = k === writeKey
                  const isRead = readSet.has(k)
                  const changed = prevRows !== null && JSON.stringify(prevRows[r]?.[c]) !== JSON.stringify(v)
                  return (
                    <td key={c} className="p-0">
                      <motion.div
                        animate={{ backgroundColor: changed ? ['#0E4D57', '#0F1220'] : '#0F1220' }}
                        transition={{ duration: 0.7 }}
                        className={`flex h-10 min-w-11 items-center justify-center rounded-md border px-1.5 ${
                          isWrite
                            ? 'border-verdigris ring-2 ring-verdigris/40'
                            : isRead
                              ? 'border-sky ring-2 ring-sky/30'
                              : 'border-line'
                        }`}
                      >
                        {c < row.length ? cellText(v, heap) : ''}
                      </motion.div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {models.map((m) => (
        <ArrayRow key={m.name} model={m} heap={heap} />
      ))}
      <SidePanels
        locals={locals}
        prevLocals={prevLocals}
        heap={heap}
        config={config}
        exclude={new Set([name, ...models.map((m) => m.name), ...pointerNames])}
      />
    </div>
  )
}
