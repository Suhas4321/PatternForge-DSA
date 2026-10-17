import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Progress, QuestionDetail } from '../api/types'
import VictoryModal from '../components/VictoryModal'
import AscensionBar, { type StageInfo } from '../components/workspace/AscensionBar'
import ChapterRightPanel from '../components/workspace/ChapterRightPanel'
import LeftRailStepper, { type ChapterMeta } from '../components/workspace/LeftRailStepper'
import StageArena from '../components/workspace/StageArena'
import StageConcept from '../components/workspace/StageConcept'
import StageDrills from '../components/workspace/StageDrills'
import StagePitch from '../components/workspace/StagePitch'
import { getCitadel } from '../lib/citadels'
import { Button, DifficultyBadge, ErrorNote, Kbd, LeetCodeLink, Spinner } from '../components/ui'

type Stage = 1 | 2 | 3 | 4

function unlocked(stage: Stage, p: Progress, drillCount: number, blind: boolean): boolean {
  const drillsDone = Array.from({ length: drillCount }, (_, i) => i).every((i) => p.drills_passed.includes(i))
  switch (stage) {
    case 1:
      return true
    case 2:
      return drillCount > 0 && (p.quiz_passed || p.solved)
    case 3:
      return blind || p.solved || (p.quiz_passed && drillsDone)
    case 4:
      return p.solved || p.studied_solution
  }
}

function firstIncomplete(p: Progress, drillCount: number, blind: boolean): Stage {
  if (blind) return 3
  if (p.solved || p.studied_solution) return 4
  if (!p.quiz_passed) return 1
  if (drillCount > 0 && !unlocked(3, p, drillCount, false)) return 2
  return 3
}

const STAGE_LABELS: Record<Stage, string> = {
  1: 'Decode Story',
  2: 'Forge Parts',
  3: 'Visualizer Arena',
  4: 'Interview Pitch',
}

export default function QuestionPage() {
  const { slug = '' } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const blind = search.get('mode') === 'review'
  const [question, setQuestion] = useState<QuestionDetail | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [stage, setStage] = useState<Stage>(1)
  const [error, setError] = useState<string | null>(null)
  const [justUnlocked, setJustUnlocked] = useState<Stage | null>(null)
  const [victory, setVictory] = useState<{ review: boolean } | null>(null)
  const unlockedRef = useRef<Set<Stage>>(new Set())
  const progressRef = useRef<Progress | null>(null)

  // Stage 1 chapters & intelligence panel state
  const [activeChapter, setActiveChapter] = useState<number>(() => {
    try {
      const s = localStorage.getItem(`pf-chapter-${slug}`)
      if (s) {
        const n = Number(s)
        if (n >= 1 && n <= 6) return n
      }
    } catch {
      /* noop */
    }
    return 1
  })

  // Left rail collapse state (default expanded in Stage 1, collapsed in Stages 2-4)
  const [isRailCollapsed, setIsRailCollapsed] = useState(false)

  // Right panel collapse state (open by default on >= 1536px, closed on < 1536px)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1536 : false,
  )
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)

  // Collected keywords state persisted per slug
  const [collectedKeywords, setCollectedKeywords] = useState<Set<string>>(() => {
    try {
      const s = localStorage.getItem(`pf-keywords-${slug}`)
      if (s) return new Set(JSON.parse(s))
    } catch {
      /* noop */
    }
    return new Set()
  })

  const toggleKeyword = useCallback(
    (kw: string) => {
      setCollectedKeywords((prev) => {
        const next = new Set(prev)
        if (next.has(kw)) next.delete(kw)
        else next.add(kw)
        try {
          localStorage.setItem(`pf-keywords-${slug}`, JSON.stringify(Array.from(next)))
        } catch {
          /* noop */
        }
        return next
      })
    },
    [slug],
  )

  useEffect(() => {
    setQuestion(null)
    setError(null)
    setVictory(null)
    setJustUnlocked(null)
    api
      .question(slug)
      .then((q) => {
        const drills = q.content?.drills.length ?? 0
        setQuestion(q)
        setProgress(q.progress)
        progressRef.current = q.progress
        unlockedRef.current = new Set(([1, 2, 3, 4] as Stage[]).filter((s) => unlocked(s, q.progress, drills, blind)))
        const asked = Number(search.get('stage')) as Stage
        const initialStage =
          asked >= 1 && asked <= 4 && unlocked(asked, q.progress, drills, blind)
            ? asked
            : firstIncomplete(q.progress, drills, blind)
        setStage(initialStage)
        setIsRailCollapsed(initialStage !== 1)
      })
      .catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, blind])

  const drillCount = question?.content?.drills.length ?? 0

  /** Every progress update from a stage: detect newly unlocked stages and completion. */
  const onProgress = useCallback(
    (p: Progress) => {
      const prev = progressRef.current
      if (prev && prev.confidence === null && p.confidence !== null) setVictory({ review: false })
      else if (prev && blind && p.confidence !== null && p.last_practiced_at !== prev.last_practiced_at)
        setVictory({ review: true })
      progressRef.current = p
      setProgress(p)
      const now = ([1, 2, 3, 4] as Stage[]).filter((s) => unlocked(s, p, drillCount, blind))
      const fresh = now.filter((s) => !unlockedRef.current.has(s))
      unlockedRef.current = new Set(now)
      if (fresh.length) setJustUnlocked(fresh[fresh.length - 1])
    },
    [drillCount, blind],
  )

  const go = useCallback(
    async (s: Stage) => {
      if (!question || !progress) return
      if ((s === 2 || s === 3) && !progress.quiz_passed && question.content && !blind) {
        onProgress(await api.patchProgress(slug, { concept_done: true, quiz_passed: true }))
      }
      setStage(s)
      if (s === 1) setIsRailCollapsed(false)
      else setIsRailCollapsed(true)
      if (justUnlocked !== null && s >= justUnlocked) setJustUnlocked(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [question, progress, blind, slug, justUnlocked, onProgress],
  )

  // Alt+1..4 switches to an unlocked stage
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || !progress || !question?.content) return
      const n = Number(e.key) as Stage
      if (n >= 1 && n <= 4 && unlocked(n, progress, drillCount, blind) && !(n === 2 && drillCount === 0)) {
        e.preventDefault()
        go(n)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [progress, question, drillCount, blind, go])

  if (error)
    return (
      <div className="shell p-8">
        <ErrorNote message={error} />
      </div>
    )
  if (!question || !progress)
    return (
      <div className="p-8">
        <Spinner />
      </div>
    )

  const content = question.content
  const citadel = getCitadel(question.citadel_id)
  const isBoss = question.position === question.world_total - 1
  const stages: StageInfo[] = ([1, 2, 3, 4] as Stage[])
    .filter((s) => !(s === 2 && drillCount === 0))
    .map((s) => ({
      id: s,
      label:
        s === 2
          ? `${STAGE_LABELS[2]} (${Math.min(progress.drills_passed.length, drillCount)}/${drillCount})`
          : STAGE_LABELS[s],
      unlocked: unlocked(s, progress, drillCount, blind),
      done:
        s === 1
          ? progress.quiz_passed || progress.solved
          : s === 2
            ? progress.drills_passed.length >= drillCount
            : s === 3
              ? progress.solved
              : progress.confidence !== null,
    }))
  const showAdvance = justUnlocked !== null && stage < justUnlocked

  // Stage 1 chapters metadata for the rail stepper
  const chapters: ChapterMeta[] = [
    { id: 1, title: 'The Story', done: activeChapter > 1, locked: false },
    { id: 2, title: 'What is Asked', done: activeChapter > 2, locked: false },
    { id: 3, title: 'Spot Signals', done: activeChapter > 3, locked: false },
    { id: 4, title: 'Constraints', done: activeChapter > 4, locked: false },
    { id: 5, title: 'Pick Pattern', done: activeChapter > 5, locked: !progress.quiz_passed && activeChapter < 5 },
    { id: 6, title: 'The Insight', done: Boolean(progress.quiz_passed), locked: !progress.quiz_passed && activeChapter < 6 },
  ]

  const handleSelectChapter = (chId: number) => {
    setActiveChapter(chId)
    const el = document.getElementById(`chapter-${chId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="shell flex flex-col gap-5 py-5">
      {/* Lesson Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <Link to={`/world/${question.world_id}`} className="text-muted hover:text-chalk">
            World {question.world_id}: {question.world_name}
          </Link>
          <nav className="flex items-center gap-1">
            {question.prev_slug && (
              <Link
                to={`/q/${question.prev_slug}`}
                className="rounded-lg p-1 text-muted hover:bg-chalk/[0.06] hover:text-chalk"
                aria-label="Previous question"
              >
                <ChevronLeft size={18} />
              </Link>
            )}
            {question.next_slug && (
              <Link
                to={`/q/${question.next_slug}`}
                className="rounded-lg p-1 text-muted hover:bg-chalk/[0.06] hover:text-chalk"
                aria-label="Next question"
              >
                <ChevronRight size={18} />
              </Link>
            )}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <LeetCodeLink lc={question.lc} url={question.leetcode_url} showLabel />
          <h1 className="font-plate text-2xl font-semibold text-chalk">{question.title}</h1>
          <DifficultyBadge difficulty={question.difficulty} />
          {isBoss && (
            <span className="rounded-full border border-crimson/45 bg-crimson/10 px-2.5 py-0.5 text-2xs font-semibold text-crimson">
              Final Trial
            </span>
          )}
        </div>
      </header>

      {/* Top Progress Bar: Displayed below 1280px (rail becomes top bar) and for quick stage navigation in Stages 2-4 */}
      {content && (
        <div className={`${stage === 1 ? 'xl:hidden' : ''} sticky top-[4.6rem] z-30 flex flex-wrap items-center gap-3`}>
          <AscensionBar stages={stages} current={stage} onSelect={(s) => go(s as Stage)} justUnlocked={justUnlocked} />
          <span className="hidden items-center gap-1.5 text-2xs text-faint lg:flex">
            <Kbd keys={['Alt', '1–4']} /> switch stage
          </span>
        </div>
      )}

      {/* Main Lesson Workspace */}
      {!content ? (
        <div className="card max-w-2xl rounded-2xl p-6">
          <h2 className="mb-2 text-lg font-semibold">This question's lesson isn't written yet</h2>
          <p className="text-sm text-muted">
            It's on the roadmap (patterns: {question.patterns.join(', ')}). You can still solve it on LeetCode now.
          </p>
          <div className="mt-4 flex gap-3">
            <LeetCodeLink lc={question.lc} url={question.leetcode_url} showLabel />
          </div>
        </div>
      ) : stage === 1 ? (
        /* STAGE 1: Three-zone reading layout (>= 1280px) */
        <div className="flex gap-6 items-start relative w-full">
          {/* 1. Left rail 220px sticky (collapsible) */}
          <aside
            className={`hidden xl:block shrink-0 sticky top-20 transition-all duration-300 ${
              isRailCollapsed ? 'w-14' : 'w-[220px]'
            }`}
          >
            <LeftRailStepper
              title={question.title}
              brickLayer={content.brick_layer}
              stages={stages}
              currentStage={stage}
              onSelectStage={(s) => go(s as Stage)}
              chapters={chapters}
              activeChapter={activeChapter}
              onSelectChapter={handleSelectChapter}
              isCollapsed={isRailCollapsed}
              onToggleCollapse={() => setIsRailCollapsed(!isRailCollapsed)}
              accentColor={citadel.themeColor}
              drillsCount={drillCount}
              drillsPassed={progress.drills_passed}
            />
          </aside>

          {/* 2. Centre: Scroll-snap container at .measure 68ch */}
          <main className="flex-1 min-w-0 max-w-[68ch] mx-auto w-full">
            <StageConcept
              slug={slug}
              content={content}
              progress={progress}
              onProgress={onProgress}
              onPassed={() => go(drillCount ? 2 : 3)}
              activeChapter={activeChapter}
              onChapterChange={setActiveChapter}
              collectedKeywords={collectedKeywords}
              onToggleKeyword={toggleKeyword}
            />
          </main>

          {/* 3. Right panel 320px sticky (collapsible, closed below 1536px) */}
          {isRightPanelOpen ? (
            <aside className="hidden xl:block w-[320px] shrink-0 sticky top-20 h-[calc(100vh-120px)] transition-all duration-300">
              <ChapterRightPanel
                content={content}
                activeChapter={activeChapter}
                collectedKeywords={collectedKeywords}
                onToggleKeyword={toggleKeyword}
                onClose={() => setIsRightPanelOpen(false)}
              />
            </aside>
          ) : (
            <aside className="hidden xl:block sticky top-20 shrink-0">
              <button
                type="button"
                onClick={() => setIsRightPanelOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-panel px-2.5 py-3 text-xs text-muted hover:text-chalk shadow-sm hover:border-muted transition-colors"
                title="Expand intelligence & context panel"
              >
                <BookOpen size={15} className="text-cyan" />
                <span className="[writing-mode:vertical-lr] font-mono text-2xs uppercase tracking-wider font-semibold">
                  Context & Examples
                </span>
              </button>
            </aside>
          )}

          {/* Below 1280px: Floating button to open bottom sheet */}
          <button
            type="button"
            onClick={() => setIsBottomSheetOpen(true)}
            className="xl:hidden fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full border border-line-strong bg-panel/95 px-4 py-2.5 text-xs font-semibold text-chalk shadow-2xl backdrop-blur-md hover:bg-panel-2"
          >
            <BookOpen size={14} className="text-cyan" />
            <span>Context & Examples</span>
          </button>

          {/* Below 1280px: Bottom Sheet Drawer */}
          <AnimatePresence>
            {isBottomSheetOpen && (
              <div
                className="xl:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm"
                onClick={() => setIsBottomSheetOpen(false)}
              >
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="w-full max-h-[80vh] rounded-t-3xl border-t border-line bg-panel p-4 shadow-2xl overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ChapterRightPanel
                    content={content}
                    activeChapter={activeChapter}
                    collectedKeywords={collectedKeywords}
                    onToggleKeyword={toggleKeyword}
                    onClose={() => setIsBottomSheetOpen(false)}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* STAGES 2 TO 4 (shell only): Render at full .shell width with the rail collapsed by default */
        <div className="flex gap-6 items-start relative w-full">
          <aside
            className={`hidden xl:block shrink-0 sticky top-20 transition-all duration-300 ${
              isRailCollapsed ? 'w-14' : 'w-[220px]'
            }`}
          >
            <LeftRailStepper
              title={question.title}
              brickLayer={content.brick_layer}
              stages={stages}
              currentStage={stage}
              onSelectStage={(s) => go(s as Stage)}
              chapters={chapters}
              activeChapter={activeChapter}
              onSelectChapter={handleSelectChapter}
              isCollapsed={isRailCollapsed}
              onToggleCollapse={() => setIsRailCollapsed(!isRailCollapsed)}
              accentColor={citadel.themeColor}
              drillsCount={drillCount}
              drillsPassed={progress.drills_passed}
            />
          </aside>

          <main className="flex-1 min-w-0 w-full">
            {stage === 2 ? (
              <StageDrills question={question} progress={progress} onProgress={onProgress} onContinue={() => go(3)} />
            ) : stage === 3 ? (
              <StageArena question={question} progress={progress} blind={blind} onProgress={onProgress} onContinue={() => go(4)} />
            ) : (
              <StagePitch question={question} progress={progress} onProgress={onProgress} />
            )}
          </main>
        </div>
      )}

      {/* Floating Advance Button */}
      <AnimatePresence>
        {showAdvance && (
          <motion.div
            className="fixed right-6 bottom-6 z-40"
            initial={{ y: 30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            <Button className="quest-pulse px-5 py-3 text-base" onClick={() => go(justUnlocked!)}>
              Advance to Stage {justUnlocked}: {STAGE_LABELS[justUnlocked!]} →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Celebration Modal */}
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
