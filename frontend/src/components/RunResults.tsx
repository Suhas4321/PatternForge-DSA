import { CheckCircle2, Eye, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { FunctionSpec, RunResult, TestCase } from '../api/types'

export function formatArgs(args: unknown, spec: FunctionSpec): string {
  if (spec.kind === 'design' && args && typeof args === 'object' && 'ops' in args) {
    const { ops, args: a } = args as { ops: string[]; args: unknown[] }
    return ops.map((op, i) => `${op}(${(a[i] as unknown[]).map((x) => JSON.stringify(x)).join(', ')})`).join('\n')
  }
  if (!Array.isArray(args)) return JSON.stringify(args)
  return args.map((a, i) => `${spec.params[i]?.name ?? `arg${i}`} = ${JSON.stringify(a)}`).join(', ')
}

interface Props {
  result: RunResult
  tests: TestCase[]
  spec: FunctionSpec
  tracedIndex?: number | null
  onVisualize?: (index: number) => void
}

export default function RunResults({ result, tests, spec, tracedIndex, onVisualize }: Props) {
  const firstFail = result.results.find((r) => !r.passed)?.index ?? 0
  const [open, setOpen] = useState<number>(firstFail)

  if (result.compile_error) {
    const e = result.compile_error
    return (
      <div className="rounded-md border border-oxide/40 bg-oxide/10 p-3 font-mono text-sm text-oxide">
        {e.type}
        {e.line ? ` on line ${e.line}` : ''}: {e.message}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className={`text-sm font-semibold ${result.passed ? 'text-verdigris' : 'text-oxide'}`}>
        {result.custom
          ? result.passed
            ? 'Your output matches the reference solution on your input'
            : 'Your output differs from the reference solution on your input'
          : result.passed
            ? `All ${result.total_count} tests passed`
            : `${result.passed_count} of ${result.total_count} tests passed`}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {result.results.map((r) => (
          <button
            key={r.index}
            onClick={() => setOpen(r.index)}
            className={`flex items-center gap-1 rounded border px-2 py-0.5 text-xs ${
              open === r.index ? 'border-chalk/40 bg-panel-2' : 'border-line'
            } ${r.passed ? 'text-verdigris' : 'text-oxide'}`}
          >
            {r.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {result.custom ? 'Custom' : `Test ${r.index + 1}`}
          </button>
        ))}
      </div>
      {result.results
        .filter((r) => r.index === open)
        .map((r) => {
          const test = tests[r.index]
          return (
            <div key={r.index} className="rounded-md border border-line bg-ink/60 p-3 font-mono text-xs">
              {test?.note && <div className="mb-2 font-sans text-muted">{test.note}</div>}
              <Row label="Input" value={formatArgs(test?.args, spec)} />
              <Row label="Expected" value={JSON.stringify(r.expected)} />
              {r.error ? (
                <Row
                  label="Error"
                  value={`${r.error.type}${r.error.line ? ` (line ${r.error.line})` : ''}: ${r.error.message}`}
                  tone="text-oxide"
                />
              ) : (
                <Row label="Output" value={JSON.stringify(r.actual)} tone={r.passed ? 'text-verdigris' : 'text-oxide'} />
              )}
              {r.stdout && <Row label="Printed" value={r.stdout.trimEnd()} tone="text-muted" />}
              {onVisualize && !result.custom && (
                <button
                  onClick={() => onVisualize(r.index)}
                  disabled={tracedIndex === r.index}
                  className="mt-2 inline-flex items-center gap-1.5 font-sans text-xs text-sky hover:underline disabled:text-faint disabled:no-underline"
                >
                  <Eye size={13} />
                  {tracedIndex === r.index ? 'Shown in the visualizer' : 'Visualize this test'}
                </button>
              )}
            </div>
          )
        })}
    </div>
  )
}

function Row({ label, value, tone = 'text-chalk' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2 py-0.5">
      <span className="font-sans text-muted">{label}</span>
      <span className={`whitespace-pre-wrap break-all ${tone}`}>{value}</span>
    </div>
  )
}
