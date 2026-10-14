import { CheckCircle2, Lightbulb, Play, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../api/client'
import type { Drill, Progress, QuestionDetail, RunResult } from '../../api/types'
import { useDraft } from '../../lib/useDraft'
import CodeEditor from '../CodeEditor'
import RunResults, { formatArgs } from '../RunResults'
import { Button, ErrorNote, Kbd, Markdown } from '../ui'

const SKILL_LABEL = { setup: 'Setup and loop', core: 'Core move', edge: 'Edge cases' }

interface Props {
  question: QuestionDetail
  progress: Progress
  onProgress: (p: Progress) => void
  onContinue: () => void
}

export default function StageDrills({ question, progress, onProgress, onContinue }: Props) {
  const drills = question.content!.drills
  const firstOpen = drills.findIndex((_, i) => !progress.drills_passed.includes(i))
  const [active, setActive] = useState(firstOpen === -1 ? 0 : firstOpen)
  const allPassed = drills.every((_, i) => progress.drills_passed.includes(i))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {drills.map((d, i) => {
          const passed = progress.drills_passed.includes(i)
          return (
            <button
              key={d.title}
              onClick={() => setActive(i)}
              className={`liquid-glass flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                active === i ? 'border-cyan/50 bg-cyan/[0.08]' : 'hover:border-white/25'
              }`}
            >
              {passed ? (
                <CheckCircle2 size={16} className="text-emerald-hi" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-muted text-2xs">
                  {i + 1}
                </span>
              )}
              <span>
                <span className="block text-chalk">{d.title}</span>
                <span className="block text-xs text-muted">{SKILL_LABEL[d.skill]}</span>
              </span>
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted">
            {progress.drills_passed.length} of {drills.length} passed
          </span>
          <Button onClick={onContinue} disabled={!allPassed}>
            Open the arena
          </Button>
        </div>
      </div>

      <DrillWorkspace
        key={active}
        question={question}
        drill={drills[active]}
        index={active}
        passed={progress.drills_passed.includes(active)}
        onProgress={onProgress}
        onNext={active + 1 < drills.length ? () => setActive(active + 1) : undefined}
      />
    </div>
  )
}

function DrillWorkspace({
  question,
  drill,
  index,
  passed,
  onProgress,
  onNext,
}: {
  question: QuestionDetail
  drill: Drill
  index: number
  passed: boolean
  onProgress: (p: Progress) => void
  onNext?: () => void
}) {
  const target = `drill:${index}`
  const [code, setCode] = useDraft(question.slug, target, question.drafts[target] ?? drill.starter_code)
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  const run = async () => {
    setRunning(true)
    setError(null)
    try {
      const r = await api.run(question.slug, { code, target, visualize: false })
      setResult(r)
      onProgress(r.progress)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  const errorLine = result?.compile_error?.line ?? result?.results.find((r) => r.error?.line)?.error?.line ?? null

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-4">
        <div>
          <h3 className="font-plate text-lg font-semibold text-chalk">{drill.title}</h3>
          <p className="mt-1 text-sm text-forge">{drill.goal}</p>
        </div>
        <Markdown className="text-sm">{drill.instructions}</Markdown>
        <div>
          <h4 className="mb-1.5 text-xs text-muted">Tests</h4>
          <div className="flex flex-col gap-1 font-mono text-xs">
            {drill.tests.map((t, i) => (
              <div key={i} className="rounded bg-ink/60 px-2 py-1">
                <span className="text-chalk">{formatArgs(t.args, drill.function)}</span>
                <span className="text-faint"> → </span>
                <span className="text-verdigris">{JSON.stringify(t.expected)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {!showHint ? (
            <Button variant="ghost" className="self-start" onClick={() => setShowHint(true)}>
              <Lightbulb size={15} /> Show a hint
            </Button>
          ) : (
            <div className="rounded-md border border-ochre/30 bg-ochre/5 px-3 py-2 text-sm">
              <Markdown>{drill.hint}</Markdown>
            </div>
          )}
          {showSolution ? (
            <pre className="overflow-x-auto rounded-md border border-line bg-ink p-3 font-mono text-xs text-chalk">
              {drill.solution}
            </pre>
          ) : (
            <button className="self-start text-xs text-faint hover:text-muted" onClick={() => setShowSolution(true)}>
              Stuck for real? Reveal this drill's solution
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="h-72 overflow-hidden rounded-xl border border-line">
          <CodeEditor value={code} onChange={setCode} errorLine={errorLine} onRun={run} />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={run} disabled={running}>
            <Play size={15} /> {running ? 'Running' : 'Run drill'}
          </Button>
          <Button variant="ghost" onClick={() => setCode(drill.starter_code)} title="Reset to starter code">
            <RotateCcw size={15} /> Reset
          </Button>
          <span className="flex items-center gap-1 text-2xs text-faint"><Kbd keys={['Ctrl', 'Enter']} /> run</span>
          {passed && onNext && (
            <Button variant="outline" className="ml-auto" onClick={onNext}>
              Next drill
            </Button>
          )}
        </div>
        {error && <ErrorNote message={error} />}
        {result && <RunResults result={result} tests={drill.tests} spec={drill.function} />}
      </div>
    </div>
  )
}
