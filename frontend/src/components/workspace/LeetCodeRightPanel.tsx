import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Play,
  RotateCcw,
  Terminal,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import type { Drill, FunctionSpec, QuestionDetail, RunResult, TestCase, TraceStep } from '../../api/types'
import CodeEditor from '../CodeEditor'
import RunResults, { formatArgs } from '../RunResults'
import { Button, ErrorNote } from '../ui'
import ResizableSplit from './ResizableSplit'

interface Props {
  question: QuestionDetail
  activeTarget: string
  onSelectTarget: (target: string) => void
  code: string
  onChangeCode: (v: string) => void
  onResetCode: () => void
  onRun: (customArgs?: unknown) => void
  running: boolean
  result: RunResult | null
  error: string | null
  traceLine: number | null
  errorLine: number | null
  step?: TraceStep
  prevStep?: TraceStep
}

export default function LeetCodeRightPanel({
  question,
  activeTarget,
  onSelectTarget,
  code,
  onChangeCode,
  onResetCode,
  onRun,
  running,
  result,
  error,
  traceLine,
  errorLine,
  step,
  prevStep,
}: Props) {
  const content = question.content!
  const drills = content.drills ?? []

  // Resolve active spec & tests based on target ('main' or 'drill:0..2')
  let activeSpec: FunctionSpec = content.function
  let activeTests: TestCase[] = content.tests
  if (activeTarget.startsWith('drill:')) {
    const idx = Number(activeTarget.split(':')[1])
    const d: Drill | undefined = drills[idx]
    if (d) {
      activeSpec = d.function
      activeTests = d.tests
    }
  }

  const [consoleTab, setConsoleTab] = useState<'testcase' | 'result'>('testcase')
  const [selectedCase, setSelectedCase] = useState<number | 'custom'>(0)
  const [customJson, setCustomJson] = useState<string>(() =>
    JSON.stringify(content.tests[0]?.args ?? [], null, 2),
  )
  const [customErr, setCustomErr] = useState<string | null>(null)
  const [consoleCollapsed, setConsoleCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  // Switch to result tab automatically when a new result or error arrives
  const handleRunClick = () => {
    setConsoleCollapsed(false)
    setConsoleTab('result')
    onRun()
  }

  const handleRunCustom = () => {
    setCustomErr(null)
    try {
      const parsed = JSON.parse(customJson)
      setConsoleCollapsed(false)
      setConsoleTab('result')
      onRun(parsed)
    } catch {
      setCustomErr('Custom input must be valid JSON matching the parameter list.')
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  const topEditorPane = (
    <div className="flex h-full w-full flex-col overflow-hidden bg-void">
      {/* 36px LeetCode Editor Toolbar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-line bg-panel px-3 text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="rounded bg-panel-2 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan">
            {question.runner_type === 'sql_sqlite' ? 'SQLite' : 'Python 3'}
          </span>

          {drills.length > 0 && (
            <select
              value={activeTarget}
              onChange={(e) => onSelectTarget(e.target.value)}
              className="rounded-md border border-line bg-panel-2 px-2 py-0.5 font-mono text-[11px] text-chalk"
              aria-label="Target function"
            >
              <option value="main">Main: {content.function.name}()</option>
              {drills.map((d, i) => (
                <option key={d.title} value={`drill:${i}`}>
                  Drill {i + 1}: {d.function.name}()
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={copyCode}
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted hover:bg-panel-2 hover:text-chalk"
            title="Copy code"
          >
            {copied ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={onResetCode}
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted hover:bg-panel-2 hover:text-chalk"
            title="Reset to starter code"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Full-Height Monaco Editor */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <CodeEditor
          value={code}
          onChange={onChangeCode}
          language={question.runner_type === 'sql_sqlite' ? 'sql' : 'python'}
          traceLine={traceLine}
          errorLine={errorLine}
          onRun={handleRunClick}
          step={step}
          prevStep={prevStep}
        />
      </div>
    </div>
  )

  const bottomConsolePane = (
    <div className="flex h-full w-full flex-col overflow-hidden bg-panel">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-line bg-panel-2 px-3 text-xs select-none">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setConsoleCollapsed(false)
              setConsoleTab('testcase')
            }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium ${
              consoleTab === 'testcase' && !consoleCollapsed ? 'bg-panel-3 text-chalk font-semibold' : 'text-muted hover:text-chalk'
            }`}
          >
            <Terminal size={13} className="text-emerald" />
            <span>Testcase</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setConsoleCollapsed(false)
              setConsoleTab('result')
            }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium ${
              consoleTab === 'result' && !consoleCollapsed ? 'bg-panel-3 text-chalk font-semibold' : 'text-muted hover:text-chalk'
            }`}
          >
            <span>Test Result</span>
            {result && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                  result.passed ? 'bg-emerald/20 text-emerald' : 'bg-crimson/20 text-crimson'
                }`}
              >
                {result.passed ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                {result.passed_count}/{result.total_count}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setConsoleCollapsed((c) => !c)}
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted hover:bg-panel-3 hover:text-chalk"
        >
          <span>{consoleCollapsed ? 'Expand Console' : 'Hide Console'}</span>
          {consoleCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
      {!consoleCollapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5">
          {consoleTab === 'testcase' ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {activeTests.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCase(idx)}
                    className={`rounded-lg border px-2.5 py-1 font-mono text-xs ${
                      selectedCase === idx ? 'border-cyan/50 bg-cyan/15 font-semibold text-cyan' : 'border-line bg-panel-2 text-muted hover:text-chalk'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedCase('custom')}
                  className={`rounded-lg border px-2.5 py-1 font-mono text-xs ${
                    selectedCase === 'custom' ? 'border-amber/50 bg-amber/15 font-semibold text-amber' : 'border-line bg-panel-2 text-muted hover:text-chalk'
                  }`}
                >
                  + Custom Input
                </button>
              </div>

              {selectedCase === 'custom' ? (
                <div className="flex flex-col gap-2">
                  <label className="text-2xs text-muted">
                    Custom arguments JSON array for <code className="text-cyan">({activeSpec.params.map((p) => p.name).join(', ')})</code>:
                  </label>
                  <textarea
                    value={customJson}
                    onChange={(e) => setCustomJson(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-line bg-void p-2.5 font-mono text-xs text-chalk focus:border-cyan focus:outline-none"
                  />
                  {customErr && <ErrorNote message={customErr} />}
                  <div className="flex justify-end">
                    <Button className="h-7 px-3 text-xs" onClick={handleRunCustom} disabled={running}>
                      <Play size={12} />
                      <span>Run Custom Input</span>
                    </Button>
                  </div>
                </div>
              ) : (
                activeTests[selectedCase] && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="rounded-xl border border-line bg-void/80 p-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-muted mb-0.5">Input</div>
                      <div className="text-chalk">{formatArgs(activeTests[selectedCase].args, activeSpec)}</div>
                    </div>
                    <div className="rounded-xl border border-line bg-void/80 p-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-muted mb-0.5">Expected Output</div>
                      <div className="font-semibold text-emerald">{JSON.stringify(activeTests[selectedCase].expected)}</div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {error && <ErrorNote message={error} />}
              {result ? (
                <RunResults result={result} tests={activeTests} spec={activeSpec} />
              ) : (
                <div className="flex h-28 flex-col items-center justify-center text-center text-xs text-muted">
                  <p>Run your code to see test case results.</p>
                  <p className="mt-1 font-mono text-[11px] text-faint">Press Ctrl+Enter or click Run in the top bar.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <ResizableSplit
      direction="vertical"
      initialPrimaryPct={68}
      minPrimaryPct={25}
      maxPrimaryPct={90}
      storageKey="pf-lc-split-y"
      secondaryCollapsed={consoleCollapsed}
      secondaryCollapsedSizePx={36}
      first={topEditorPane}
      second={bottomConsolePane}
    />
  )
}
