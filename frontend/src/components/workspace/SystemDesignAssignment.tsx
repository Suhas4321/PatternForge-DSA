import {
  ArrowRight,
  CheckCircle2,
  Code2,
  HelpCircle,
  Maximize2,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { api } from '../../api/client'
import type { SystemDesignAssignmentSpec } from '../../lib/systemDesignAssignments'
import { markSystemDesignCompleted } from '../../lib/systemDesignProgress'
import ChatGPTCodeBlock from '../ChatGPTCodeBlock'
import CodeEditor from '../CodeEditor'
import SystemDesignFullscreenIDE from './SystemDesignFullscreenIDE'

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
  const [isFullscreen, setIsFullscreen] = useState(false)

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
        markSystemDesignCompleted(spec.id)
      }
    } catch (e) {
      setCompileErr((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  const allCurrentPassed = outcomes !== null && outcomes.length > 0 && outcomes.every((o) => o.passed)
  const hasPassed = isCompleted || allCurrentPassed

  if (isFullscreen) {
    return (
      <SystemDesignFullscreenIDE
        spec={spec}
        stepNumber={stepNumber}
        code={code}
        onCodeChange={handleCodeChange}
        running={running}
        onRunTests={runAssignmentTests}
        outcomes={outcomes}
        compileErr={compileErr}
        hasPassed={hasPassed}
        onClose={() => setIsFullscreen(false)}
        onNextLesson={onNextLesson}
        onReset={() => {
          handleCodeChange(spec.starterCode)
          setOutcomes(null)
        }}
      />
    )
  }

  return (
    <section className="py-8 space-y-6 border-t border-line">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-violet-500/15 font-mono text-xs font-semibold text-violet-600 dark:text-violet-400">
            {stepNumber}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-chalk">
              Hands-On Lab: Worked Example → Your Coding Assignment
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Implement the architectural pattern in Python. Pass all unit verification tests to complete the lesson.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-3 py-0.5 font-mono text-xs font-semibold ${
              hasPassed
                ? 'border-emerald/40 bg-emerald/10 text-emerald'
                : 'border-line bg-panel text-muted'
            }`}
          >
            {hasPassed ? '✓ Lesson Completed' : 'Pending Verification'}
          </span>
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel-2 px-3 py-1 text-xs font-medium text-chalk hover:bg-panel-3 hover:border-violet-400/40 transition-colors"
            title="Expand into Fullscreen Split IDE"
          >
            <Maximize2 size={13} className="text-violet-600 dark:text-violet-400" />
            <span>Fullscreen IDE</span>
          </button>
        </div>
      </div>

      {/* PART A: SCENARIO 1 (WORKED EXAMPLE with ChatGPT Code Block) */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-2xs uppercase tracking-wider font-semibold text-muted">
            Part A · {spec.workedExampleTitle}
          </span>
          <span className="text-2xs text-muted font-mono">Reference Pattern</span>
        </div>
        <p className="text-sm leading-relaxed text-muted">{spec.workedExampleExplanation}</p>
        <ChatGPTCodeBlock
          code={spec.workedExampleCode}
          language="python"
          title="Worked Reference Pattern"
        />
      </div>

      {/* PART B: SCENARIO 2 (USER CODING ASSIGNMENT) */}
      <div className="space-y-4 pt-4 border-t border-line">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-2xs uppercase tracking-wider font-semibold text-violet-600 dark:text-violet-400">
              Part B · {spec.scenarioTitle}
            </span>
            <span className="font-mono text-2xs text-muted">
              Target: <code className="text-chalk font-semibold">{spec.functionName}()</code>
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted">{spec.scenarioPrompt}</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border-x border-t border-line bg-panel-2 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2 text-muted font-mono">
            <Code2 size={13} className="text-violet-400" />
            <span>Python 3 Workspace</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="inline-flex items-center gap-1 rounded border border-line bg-panel px-2.5 py-1 text-muted hover:text-chalk"
            >
              <HelpCircle size={12} />
              <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCodeChange(spec.solutionCode)}
              className="rounded border border-line bg-panel px-2.5 py-1 text-muted hover:text-chalk"
            >
              Load Reference Solution
            </button>
            <button
              type="button"
              onClick={() => {
                handleCodeChange(spec.starterCode)
                setOutcomes(null)
              }}
              className="inline-flex items-center gap-1 rounded border border-line bg-panel px-2.5 py-1 text-muted hover:text-chalk"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="inline-flex items-center gap-1 rounded border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20"
            >
              <Maximize2 size={12} />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>

        {showHint && (
          <blockquote className="border-l-[3px] border-amber-500 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200 shadow-xs">
            <strong className="font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">Architecture Hint:</strong>
            {spec.hint}
          </blockquote>
        )}

        {/* Generous 460px Editor (No tiny 210px box!) */}
        <div className="overflow-hidden rounded-b-lg border border-line shadow-inner">
          <CodeEditor value={code} onChange={handleCodeChange} height={460} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            disabled={running}
            onClick={runAssignmentTests}
            className="inline-flex items-center gap-2 rounded-md bg-emerald px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            <Play size={14} />
            <span>{running ? 'Running Automated Verification…' : 'Run & Verify Assignment'}</span>
          </button>

          {hasPassed && onNextLesson && (
            <button
              type="button"
              onClick={onNextLesson}
              className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-violet-500 active:scale-95 transition-all"
            >
              <span>Lesson Solved! Continue to Next Lesson</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {compileErr && (
          <div className="rounded-md border border-crimson/40 bg-crimson/10 p-3.5 font-mono text-xs text-crimson">
            {compileErr}
          </div>
        )}

        {outcomes && (
          <div className="overflow-hidden rounded-md border border-line bg-panel">
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


