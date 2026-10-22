import { motion } from 'motion/react'
import type { HeapObject } from '../../api/types'
import { asCells, formatValue, isObj, visibleLocals, type ScopedValue } from '../../lib/trace'
import { ArrayRow, buildArrays, SidePanels } from './parts'
import type { VisualizerProps } from './types'

const TABLE_NAMES = ['dp', 'table', 'memo', 'cache', 'f']

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
  const norm = (idx: Num[]) =>
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
      if (assign && assign[1] !== '=') reads.push(idx)
    } else reads.push(idx)
  }
  return { write, reads }
}

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

export default function DPTableVisualizer({ step, prev, config, code, narration }: VisualizerProps) {
  const locals = visibleLocals(step)
  const prevLocals = visibleLocals(prev)
  const heap = step.heap
  const name = [config.table as string | undefined, ...TABLE_NAMES].find(
    (n) => n && n in locals && asCells(locals[n].value),
  )

  if (!name) {
    const { models, pointerNames } = buildArrays(locals, prevLocals, config)
    return (
      <div className="flex flex-col gap-6 w-full max-w-full">
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

  // Derived or narrated formula
  const activeFormula = narration?.formula || (() => {
    if (write && reads.length >= 2 && !is2D) {
      const wIdx = write[0]
      const r0 = reads[0][0]
      const r1 = reads[1][0]
      const v0 = rows[0][r0]
      const v1 = rows[0][r1]
      const res = rows[0][wIdx]
      return `dp[${wIdx}] = dp[${r0}] + dp[${r1}] = ${v0} + ${v1} = ${res}`
    }
    return null
  })()

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* Prominent Formula Strip Banner */}
      {activeFormula && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-forge/40 bg-gradient-to-r from-forge/15 via-forge/5 to-surface-2/60 px-4 py-3 shadow-md"
        >
          <span className="rounded-md border border-forge/60 bg-forge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink shadow-sm">
            Recurrence
          </span>
          <span className="font-mono text-sm font-semibold text-chalk">
            {activeFormula}
          </span>
        </motion.div>
      )}

      {/* DP Table Container */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-line/50 bg-gradient-to-b from-surface-2/40 to-ink/60 p-4 shadow-inner">
        <div className="mb-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-chalk">{name}</span>
            <span className="text-2xs text-muted">
              {is2D ? `${rows.length} × ${width} table` : `${width} cells`}
            </span>
          </div>
          <div className="flex items-center gap-4 text-2xs text-muted/80">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-verdigris bg-verdigris/30" /> target (written)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-sky bg-sky/30" /> dependency (read)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-1.5 font-mono text-sm">
            <thead>
              <tr>
                {is2D && <th />}
                {Array.from({ length: width }, (_, c) => (
                  <th key={c} className="px-1 text-center font-normal">
                    {colLabels && <div className="text-xs text-forge font-semibold">{label(colLabels, c) || '·'}</div>}
                    <div className="text-2xs text-muted/70">[{c}]</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {is2D && (
                    <th className="pr-2 text-right font-normal">
                      {rowLabels && <span className="mr-1.5 text-xs text-forge font-semibold">{label(rowLabels, r) || '·'}</span>}
                      <span className="text-2xs text-muted/70">[{r}]</span>
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
                          animate={{
                            scale: changed ? [1.18, 0.96, 1] : 1,
                            backgroundColor: isWrite
                              ? 'rgba(16, 185, 129, 0.22)'
                              : isRead
                                ? 'rgba(56, 189, 248, 0.2)'
                                : '#131826',
                          }}
                          transition={{ duration: 0.4 }}
                          className={`relative flex h-11 min-w-12 items-center justify-center rounded-xl border px-2 text-sm font-semibold shadow-sm transition-all ${
                            isWrite
                              ? 'border-verdigris ring-2 ring-verdigris/50 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              : isRead
                                ? 'border-sky ring-2 ring-sky/40 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                                : 'border-line/70 text-chalk'
                          }`}
                        >
                          {/* Dependency Read Arrow */}
                          {isRead && (
                            <span className="absolute -top-1.5 right-1 text-2xs text-sky font-bold">
                              ↗
                            </span>
                          )}

                          {/* Write Target Pulsing Dot */}
                          {isWrite && (
                            <span className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full bg-verdigris shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                          )}

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
