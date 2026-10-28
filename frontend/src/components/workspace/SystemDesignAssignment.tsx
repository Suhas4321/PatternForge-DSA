import { ArrowRight, CheckCircle2, HelpCircle, Play, RotateCcw, XCircle } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../api/client'
import type { SystemDesignAssignmentSpec } from '../../lib/systemDesignAssignments'
import CodeEditor from '../CodeEditor'

interface Props {
  spec: SystemDesignAssignmentSpec
  stepNumber: number
  isCompleted: boolean
  onCompleted: (id: string) => void
  onNextLesson?: () => void
}

interface TestRunOutcome {
  label: string
  args: unknown[]
  expected: unknown
  actual: unknown
  passed: boolean
  error?: string | null
}

const DRAFT_PREFIX = 'pf_sysdesign_code_v1_'

export default function SystemDesignAssignment({
  spec,
  stepNumber,
  isCompleted,
  onCompleted,
  onNextLesson,
}: Props) {
  const [code, setCode] = useState<string>(() => {
    try {
      return localStorage.getItem(DRAFT_PREFIX + spec.id) || spec.starterCode
    } catch {
      return spec.starterCode
    }
  })
  const [running, setRunning] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [outcomes, setOutcomes] = useState<TestRunOutcome[] | null>(null)
  const [compileErr, setCompileErr] = useState<string | null>(null)

  const handleCodeChange = (next: string) => {
    setCode(next)
    try {
      localStorage.setItem(DRAFT_PREFIX + spec.id, next)
    } catch {
      /* ignore */
    }
  }

  const runAssignmentTests = async () => {
    setRunning(true)
    setCompileErr(null)
    const results: TestRunOutcome[] = []
    let allPassed = true

    try {
      for (const tc of spec.testCases) {
        const res = await api.playgroundRun({
          code,
          function_name: spec.functionName,
          args: tc.args,
        })
        const errObj = res.compile_error || res.fatal_error || res.error
        if (errObj) {
          allPassed = false
          results.push({
            label: tc.label,
            args: tc.args,
            expected: tc.expected,
            actual: null,
            passed: false,
            error: `${errObj.type}: ${errObj.message}`,
          })
        } else {
          const passed = JSON.stringify(res.output) === JSON.stringify(tc.expected)
          if (!passed) allPassed = false
          results.push({
            label: tc.label,
            args: tc.args,
            expected: tc.expected,
            actual: res.output,
            passed,
          })
        }
      }
      setOutcomes(results)
      if (allPassed && results.length > 0) {
        onCompleted(spec.id)
      }
    } catch (e) {
      setCompileErr((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  const allCurrentPassed = outcomes !== null && outcomes.length > 0 && outcomes.every((o) => o.passed)

  return (
    <section className="py-7 space-y-6 border-t border-line">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs">
            {stepNumber}
          </span>
          <span>Hands-On Lab: Worked Example → Your Coding Assignment</span>
        </h2>

        <span
          className={`rounded border px-2.5 py-0.5 font-mono text-xs font-medium ${
            isCompleted || allCurrentPassed
              ? 'border-emerald/40 bg-emerald/10 text-emerald'
              : 'border-line bg-panel text-muted'
          }`}
        >
          {isCompleted || allCurrentPassed ? '✓ Assignment Completed' : 'Assignment Required to Complete Lesson'}
        </span>
      </div>

      {/* PART A: SCENARIO 1 (WORKED EXAMPLE) */}
      <div className="rounded-md border border-line bg-panel p-5 space-y-3">
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
          Part A · {spec.workedExampleTitle}
        </div>
        <p className="text-sm leading-relaxed text-muted">{spec.workedExampleExplanation}</p>
        <pre className="overflow-x-auto rounded-md border border-line bg-panel-2 p-3.5 font-mono text-xs leading-relaxed text-chalk">
          {spec.workedExampleCode}
        </pre>
      </div>

      {/* PART B: SCENARIO 2 (USER HANDS-ON ASSIGNMENT) */}
      <div className="rounded-md border border-line bg-panel p-5 space-y-4">
        <div className="space-y-1">
          <div className="font-mono text-xs font-semibold uppercase tracking-wider text-chalk">
            Part B · {spec.scenarioTitle}
          </div>
          <p className="text-sm leading-relaxed text-muted">{spec.scenarioPrompt}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5 text-xs">
          <span className="font-mono text-muted">
            Function under test: <code className="text-chalk">{spec.functionName}()</code>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="inline-flex items-center gap-1 rounded border border-line bg-panel-2 px-2.5 py-1 text-muted hover:text-chalk"
            >
              <HelpCircle size={12} />
              <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCodeChange(spec.solutionCode)}
              className="rounded border border-line bg-panel-2 px-2.5 py-1 text-muted hover:text-chalk"
            >
              Load Reference Solution
            </button>
            <button
              type="button"
              onClick={() => {
                handleCodeChange(spec.starterCode)
                setOutcomes(null)
              }}
              className="inline-flex items-center gap-1 rounded border border-line bg-panel-2 px-2.5 py-1 text-muted hover:text-chalk"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {showHint && (
          <blockquote className="rounded-r-md border-l-[3px] border-muted/60 bg-panel-2 px-3.5 py-2.5 text-xs text-chalk">
            <strong className="font-semibold">Hint:</strong> {spec.hint}
          </blockquote>
        )}

        <div className="overflow-hidden rounded-md border border-line">
          <CodeEditor value={code} onChange={handleCodeChange} height={210} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={running}
            onClick={runAssignmentTests}
            className="inline-flex items-center gap-1.5 rounded-md bg-chalk px-4 py-2 text-xs font-semibold text-void hover:opacity-90 disabled:opacity-50"
          >
            <Play size={13} />
            <span>{running ? 'Running Automated Tests…' : 'Run & Verify Assignment'}</span>
          </button>

          {(isCompleted || allCurrentPassed) && onNextLesson && (
            <button
              type="button"
              onClick={onNextLesson}
              className="inline-flex items-center gap-1.5 rounded-md border border-chalk bg-panel-2 px-4 py-2 text-xs font-semibold text-chalk hover:bg-panel-3"
            >
              <span>Complete & Continue to Next Lesson</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {compileErr && (
          <div className="rounded-md border border-crimson/40 bg-crimson/10 p-3 font-mono text-xs text-crimson">
            {compileErr}
          </div>
        )}

        {outcomes && (
          <div className="overflow-hidden rounded-md border border-line">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-panel-2 font-semibold text-muted">
                  <th className="py-2 px-3">Scenario Test Case</th>
                  <th className="py-2 px-3">Expected</th>
                  <th className="py-2 px-3">Your Output</th>
                  <th className="py-2 px-3 w-24 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {outcomes.map((o, i) => (
                  <tr key={i}>
                    <td className="py-2.5 px-3 text-chalk font-medium">{o.label}</td>
                    <td className="py-2.5 px-3 font-mono text-muted">{JSON.stringify(o.expected)}</td>
                    <td className="py-2.5 px-3 font-mono text-chalk">
                      {o.error ? <span className="text-crimson">{o.error}</span> : JSON.stringify(o.actual)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {o.passed ? (
                        <span className="inline-flex items-center gap-1 text-emerald">
                          <CheckCircle2 size={13} /> Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-crimson">
                          <XCircle size={13} /> Fail
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}


