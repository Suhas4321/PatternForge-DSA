import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  ScrollText,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Progress, QuestionDetail, RunResult, Trace } from '../api/types'
import { ThemeToggle } from '../components/effects'
import { Button, DifficultyBadge, ErrorNote, LeetCodeLink, Spinner } from '../components/ui'
import VictoryModal from '../components/VictoryModal'
import { usePlayback } from '../components/visualizers/stage/usePlayback'
import DataStructurePrimer from '../components/workspace/DataStructurePrimer'
import InterviewAnswerPlaybook from '../components/workspace/InterviewAnswerPlaybook'
import LeetCodeLeftPanel, { type LeftTab } from '../components/workspace/LeetCodeLeftPanel'
import LeetCodeRightPanel from '../components/workspace/LeetCodeRightPanel'
import ResizableSplit from '../components/workspace/ResizableSplit'
import { useGrimoire } from '../lib/grimoire'
import { precomputeTraceNarration } from '../lib/narrator/index.ts'
import { useDraft } from '../lib/useDraft'

export default function QuestionPage() {
  const { slug = '' } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const openGrimoire = useGrimoire()
  const blind = search.get('mode') === 'review'

  const [question, setQuestion] = useState<QuestionDetail | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [victory, setVictory] = useState<{ review: boolean } | null>(null)
  const progressRef = useRef<Progress | null>(null)

  const [leftTab, setLeftTab] = useState<LeftTab>(() => {
    const st = Number(search.get('stage'))
    if (st === 2) return 'drills'
    return 'description'
  })
  const [workspaceStep, setWorkspaceStep] = useState<'learn' | 'code' | 'interview'>(() => {
    const st = Number(search.get('stage'))
    if (st === 1) return 'learn'
    if (st === 4) return 'interview'
    return 'code'
  })
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [activeTarget, setActiveTarget] = useState<string>('main')

  // Execution & Trace state
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [trace, setTrace] = useState<Trace | null>(null)
  const [tracedCode, setTracedCode] = useState<string>('')
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    setQuestion(null)
    setError(null)
    setVictory(null)
    setResult(null)
    setRunError(null)
    setTrace(null)
    setStepIndex(0)
    setPlaying(false)
    setActiveTarget('main')

    api
      .question(slug)
      .then((q) => {
        setQuestion(q)
        setProgress(q.progress)
        progressRef.current = q.progress
        setTracedCode(q.content?.solution?.code || q.content?.starter_code || '')
      })
      .catch((e) => setError(e.message))

    // Preload demo trace so the Visualizer tab is immediately interactive
    api
      .demoTrace(slug)
      .then((res) => {
        if (res.trace?.steps?.length) {
          setTrace((prev) => prev ?? res.trace)
        }
      })
      .catch(() => {})
  }, [slug, blind])

  const onProgress = useCallback(
    (p: Progress) => {
      const prev = progressRef.current
      if (prev && prev.confidence === null && p.confidence !== null) setVictory({ review: false })
      else if (prev && blind && p.confidence !== null && p.last_practiced_at !== prev.last_practiced_at)
        setVictory({ review: true })
      progressRef.current = p
      setProgress(p)
    },
    [blind],
  )

  // Compute initial starter/draft code for activeTarget
  const initialCode = useMemo(() => {
    if (!question?.content) return ''
    if (activeTarget.startsWith('drill:')) {
      const idx = Number(activeTarget.split(':')[1])
      const d = question.content.drills[idx]
      return question.drafts[activeTarget] ?? d?.starter_code ?? ''
    }
    if (blind) return question.content.starter_code
    return question.drafts.main ?? question.content.starter_code
  }, [question, activeTarget, blind])

  const [code, setCode] = useDraft(slug, activeTarget, initialCode)

  const resetCode = () => {
    if (!question?.content) return
    if (activeTarget.startsWith('drill:')) {
      const idx = Number(activeTarget.split(':')[1])
      setCode(question.content.drills[idx]?.starter_code ?? '')
    } else {
      setCode(question.content.starter_code)
    }
  }

  const runCode = async (customArgs?: unknown, switchToViz = false) => {
    if (!question?.content) return
    setRunning(true)
    setRunError(null)
    setPlaying(false)
    try {
      const r = await api.run(slug, {
        code,
        target: activeTarget,
        visualize: true,
        custom_args: customArgs,
      })
      setResult(r)
      onProgress(r.progress)
      if (r.trace && r.trace.steps && r.trace.steps.length > 0) {
        setTrace(r.trace)
        setTracedCode(code)
        setStepIndex(0)
        if (switchToViz) {
          setLeftCollapsed(false)
          setLeftTab('visualizer')
          setPlaying(true)
        }
      }
      if (r.passed && activeTarget === 'main' && !r.custom) {
        try {
          confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } })
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      setRunError((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  const playback = usePlayback({
    trace,
    index: stepIndex,
    onIndex: setStepIndex,
    playing,
    onPlaying: setPlaying,
    speed,
    onSpeed: setSpeed,
  })

  const narrations = useMemo(() => {
    if (!trace?.steps?.length || !question?.content) return []
    return precomputeTraceNarration(trace.steps, trace.line_info, question.content.viz, question.visualizer)
  }, [trace, question])

  if (error) {
    return (
      <div className="p-8">
        <ErrorNote message={error} />
      </div>
    )
  }
  if (!question || !progress) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-void">
        <Spinner label="Loading workspace" />
      </div>
    )
  }

  const content = question.content
  const isBoss = question.position === question.world_total - 1
  const steps = playback.steps
  const curStep = steps[stepIndex]
  const prevStep = stepIndex > 0 ? steps[stepIndex - 1] : undefined
  const traceLine = curStep?.line ?? null
  const errorLine =
    result?.compile_error?.line ??
    result?.fatal_error?.line ??
    result?.results.find((r) => r.error?.line)?.error?.line ??
    null

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-void text-chalk">
      {/* 42px Slim LeetCode Top Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-line bg-panel px-3 select-none">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={`/world/${question.world_id}`}
            className="flex items-center gap-1 rounded-lg border border-line bg-panel-2 px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-chalk"
            title={`Back to World ${question.world_id}: ${question.world_name}`}
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">World {question.world_id}</span>
          </Link>

          <div className="flex items-center gap-0.5">
            {question.prev_slug && (
              <Link
                to={`/q/${question.prev_slug}`}
                className="rounded p-1 text-muted hover:bg-panel-2 hover:text-chalk"
                title="Previous question"
              >
                <ChevronLeft size={16} />
              </Link>
            )}
            {question.next_slug && (
              <Link
                to={`/q/${question.next_slug}`}
                className="rounded p-1 text-muted hover:bg-panel-2 hover:text-chalk"
                title="Next question"
              >
                <ChevronRight size={16} />
              </Link>
            )}
          </div>

          <LeetCodeLink lc={question.lc} url={question.leetcode_url} />
          <h1 className="truncate font-plate text-sm font-bold text-chalk sm:text-base">{question.title}</h1>
          <DifficultyBadge difficulty={question.difficulty} />
        </div>

        <div className="flex items-center gap-2">
          {/* 3-Step Pedagogical Switcher: 1. Data Structure & Concept -> 2. Code Terminal -> 3. Interview Guide */}
          <div className="inline-flex items-center rounded-md border border-line bg-panel-2 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setWorkspaceStep('learn')}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                workspaceStep === 'learn' ? 'bg-panel-3 text-chalk font-semibold' : 'text-muted hover:text-chalk'
              }`}
            >
              1. Data Structure & Concept
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceStep('code')}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                workspaceStep === 'code' ? 'bg-panel-3 text-chalk font-semibold' : 'text-muted hover:text-chalk'
              }`}
            >
              2. Code Terminal
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceStep('interview')}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                workspaceStep === 'interview' ? 'bg-panel-3 text-chalk font-semibold' : 'text-muted hover:text-chalk'
              }`}
            >
              3. Interview Guide
            </button>
          </div>


          {workspaceStep === 'code' && (
            <>
              <Button
                className="h-7 px-3 text-xs font-semibold"
                onClick={() => runCode(undefined, false)}
                disabled={running}
              >
                <Play size={13} />
                <span>{running ? 'Running…' : 'Run'}</span>
              </Button>
              <Button
                variant="outline"
                className="hidden h-7 border-cyan/40 bg-cyan/10 px-3 text-xs font-semibold text-cyan hover:bg-cyan/20 sm:inline-flex"
                onClick={() => runCode(undefined, true)}
                disabled={running}
              >
                <Eye size={13} />
                <span>Run & Visualize</span>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLeftCollapsed((c) => !c)}
            className="flex h-7 items-center gap-1 rounded-lg border border-line bg-panel-2 px-2 text-xs text-muted hover:text-chalk"
            title={leftCollapsed ? 'Show Problem Panel' : 'Maximize Editor (Hide Left Panel)'}
          >
            {leftCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            <span className="hidden md:inline">{leftCollapsed ? 'Show Panel' : 'Full Editor'}</span>
          </button>
          <button
            type="button"
            onClick={() => openGrimoire(question.world_id)}
            className="hidden h-7 items-center gap-1 rounded-lg border border-line bg-panel-2 px-2 text-xs text-muted hover:text-chalk sm:flex"
            title="Open World Cheat-Sheet (Grimoire)"
          >
            <ScrollText size={13} />
            <span className="hidden lg:inline">Grimoire</span>
          </button>
          <ThemeToggle />
        </div>
      </header>
      {!content ? (
        <div className="p-8">
          <ErrorNote message="This question's content is not yet available." />
        </div>
      ) : workspaceStep === 'learn' ? (
        <div className="flex-1 min-h-0 w-full overflow-y-auto bg-void">
          <DataStructurePrimer
            question={question}
            steps={steps}
            stepIndex={stepIndex}
            onSeek={setStepIndex}
            playing={playing}
            onTogglePlay={playback.togglePlay}
            onStepForward={playback.stepForward}
            onStepBackward={playback.stepBackward}
            onJumpFirst={playback.jumpFirst}
            onJumpLast={playback.jumpLast}
            speed={speed}
            onSpeedChange={setSpeed}
            narration={narrations[stepIndex]}
            onProceedToCode={() => setWorkspaceStep('code')}
          />
        </div>
      ) : workspaceStep === 'interview' ? (
        <div className="flex-1 min-h-0 w-full overflow-y-auto bg-void">
          <InterviewAnswerPlaybook
            question={question}
            progress={progress}
            onProgress={onProgress}
            onOpenTerminal={() => setWorkspaceStep('code')}
          />
        </div>
      ) : (

        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <ResizableSplit
            direction="horizontal"
            initialPrimaryPct={45}
            minPrimaryPct={22}
            maxPrimaryPct={76}
            storageKey="pf-lc-split-x"
            primaryCollapsed={leftCollapsed}
            first={
              <LeetCodeLeftPanel
                question={question}
                progress={progress}
                onProgress={onProgress}
                activeTab={leftTab}
                onTabChange={setLeftTab}
                activeTarget={activeTarget}
                onSelectTarget={setActiveTarget}
                steps={steps}
                stepIndex={stepIndex}
                onSeek={setStepIndex}
                playing={playing}
                onTogglePlay={playback.togglePlay}
                onStepForward={playback.stepForward}
                onStepBackward={playback.stepBackward}
                onJumpFirst={playback.jumpFirst}
                onJumpLast={playback.jumpLast}
                speed={speed}
                onSpeedChange={setSpeed}
                narration={narrations[stepIndex]}
                tracedCode={tracedCode}
                currentCode={code}
                onOpenInterviewGuide={() => setWorkspaceStep('interview')}
              />
            }
            second={
              <LeetCodeRightPanel
                question={question}
                activeTarget={activeTarget}
                onSelectTarget={setActiveTarget}
                code={code}
                onChangeCode={setCode}
                onResetCode={resetCode}
                onRun={(customArgs) => runCode(customArgs, false)}
                running={running}
                result={result}
                error={runError}
                traceLine={traceLine}
                errorLine={errorLine}
                step={curStep}
                prevStep={prevStep}
              />
            }
          />
        </div>
      )}

      <VictoryModal
        open={victory !== null}
        title={question.title}
        boss={isBoss}
        review={victory?.review ?? false}
        confidence={progress.confidence}
        nextReviewAt={progress.next_review_at}
        onNext={question.next_slug ? () => navigate(`/q/${question.next_slug}`) : undefined}
        onWorld={() => navigate(`/world/${question.world_id}`)}
        onClose={() => setVictory(null)}
      />
    </div>
  )
}
