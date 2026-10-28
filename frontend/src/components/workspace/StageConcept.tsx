import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, Eye, Lock, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../../api/client'
import type { Progress, QuestionContent, Trace, VisualizerKind } from '../../api/types'
import { precomputeTraceNarration } from '../../lib/narrator/index.ts'
import { Button, Markdown } from '../ui'
import VisualizerHost from '../visualizers/VisualizerHost'
import ConstraintsCheatWidget from './ConstraintsCheatWidget'
import Quiz from './Quiz'

interface Props {
  slug: string
  visualizer?: VisualizerKind
  content: QuestionContent
  progress: Progress
  onProgress: (p: Progress) => void
  onPassed: () => void
  activeChapter?: number
  onChapterChange?: (ch: number) => void
  collectedKeywords?: Set<string>
  onToggleKeyword?: (kw: string) => void
}

export default function StageConcept({
  slug,
  visualizer,
  content,
  progress,
  onProgress,
  onPassed,
  activeChapter: controlledActiveChapter,
  onChapterChange,
  collectedKeywords: controlledCollectedKeywords,
  onToggleKeyword: controlledOnToggleKeyword,
}: Props) {
  const [constraintOk, setConstraintOk] = useState(progress.quiz_passed)
  const [patternOk, setPatternOk] = useState(progress.quiz_passed)
  const [cleanToggleCh1, setCleanToggleCh1] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState<{ brute: boolean; insight: boolean; realWorld: boolean; solves: boolean }>({
    brute: true,
    insight: true,
    realWorld: true,
    solves: true,
  })

  // Internal state for keywords if not controlled
  const [internalCollected, setInternalCollected] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`pf-keywords-${slug}`)
      if (stored) return new Set(JSON.parse(stored))
    } catch {
      /* noop */
    }
    return new Set()
  })

  const collectedKeywords = controlledCollectedKeywords ?? internalCollected

  const toggleKeyword = useCallback(
    (kw: string) => {
      if (controlledOnToggleKeyword) {
        controlledOnToggleKeyword(kw)
        return
      }
      setInternalCollected((prev) => {
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
    [controlledOnToggleKeyword, slug],
  )

  const collectAllKeywords = useCallback(() => {
    const all = new Set(content.statement.trigger_keywords)
    if (controlledOnToggleKeyword) {
      all.forEach((kw) => controlledOnToggleKeyword(kw))
    } else {
      setInternalCollected(all)
      try {
        localStorage.setItem(`pf-keywords-${slug}`, JSON.stringify(Array.from(all)))
      } catch {
        /* noop */
      }
    }
  }, [content.statement.trigger_keywords, controlledOnToggleKeyword, slug])

  // Active chapter state with localStorage resume
  const [localActiveChapter, setLocalActiveChapter] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`pf-chapter-${slug}`)
      if (saved) {
        const parsed = Number(saved)
        if (parsed >= 1 && parsed <= 6) return parsed
      }
    } catch {
      /* noop */
    }
    return 1
  })

  const activeChapter = controlledActiveChapter ?? localActiveChapter

  const setActiveChapter = useCallback(
    (ch: number) => {
      setLocalActiveChapter(ch)
      try {
        localStorage.setItem(`pf-chapter-${slug}`, String(ch))
      } catch {
        /* noop */
      }
      onChapterChange?.(ch)
    },
    [onChapterChange, slug],
  )

  const st = content.statement
  const c = content.concept
  const chapterContainerRef = useRef<HTMLDivElement>(null)
  const chapterRefs = useRef<Record<number, HTMLElement | null>>({})

  // Determine visualizer & fetch live demo trace for DSA lessons
  const vizKind: VisualizerKind =
    (content.viz?.kind as VisualizerKind | undefined) ||
    visualizer ||
    ((content as unknown as { visualizer?: VisualizerKind }).visualizer ?? 'array_pointer')

  const [demoTrace, setDemoTrace] = useState<Trace | null>(null)
  const [demoIndex, setDemoIndex] = useState(0)
  const [demoPlaying, setDemoPlaying] = useState(false)
  const [demoSpeed, setDemoSpeed] = useState(1)

  useEffect(() => {
    setDemoTrace(null)
    setDemoIndex(0)
    setDemoPlaying(false)
    if (content.concept_trace) return
    api
      .demoTrace(slug)
      .then((res) => {
        if (res.trace && res.trace.steps && res.trace.steps.length > 0) {
          setDemoTrace(res.trace)
        }
      })
      .catch(() => {})
  }, [slug, content.concept_trace])

  const demoSteps = demoTrace?.steps ?? []
  const demoNarration = useMemo(
    () => (demoSteps.length > 0 ? precomputeTraceNarration(demoSteps, demoTrace?.line_info, content.viz, vizKind) : []),
    [demoSteps, demoTrace?.line_info, content.viz, vizKind],
  )

  useEffect(() => {
    if (!demoPlaying || demoSteps.length === 0) return
    if (demoIndex >= demoSteps.length - 1) {
      setDemoPlaying(false)
      return
    }
    const id = window.setTimeout(() => setDemoIndex((i) => Math.min(demoSteps.length - 1, i + 1)), Math.round(700 / demoSpeed))
    return () => window.clearTimeout(id)
  }, [demoPlaying, demoIndex, demoSteps.length, demoSpeed])

  const showConceptVisualizer = Boolean(content.concept_trace || content.visual_demo || demoSteps.length > 0)

  // Save progress when both quizzes are solved
  useEffect(() => {
    if (constraintOk && patternOk && !progress.quiz_passed) {
      api.patchProgress(slug, { concept_done: true, quiz_passed: true }).then(onProgress).catch(() => {})
    }
  }, [constraintOk, patternOk, progress.quiz_passed, slug, onProgress])

  // Scroll to chapter
  const scrollToChapter = useCallback((ch: number) => {
    const el = chapterRefs.current[ch]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveChapter(ch)
    }
  }, [setActiveChapter])

  // Resume on initial mount if saved in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`pf-chapter-${slug}`)
      if (saved) {
        const parsed = Number(saved)
        if (parsed > 1 && parsed <= 6) {
          window.setTimeout(() => {
            const el = chapterRefs.current[parsed]
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 150)
        }
      }
    } catch {
      /* noop */
    }
  }, [slug])

  // IntersectionObserver to sync active chapter on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
            const id = Number(entry.target.getAttribute('data-chapter-id'))
            if (id && id >= 1 && id <= 6) {
              setActiveChapter(id)
            }
          }
        }
      },
      { threshold: [0.45, 0.75] },
    )

    const refs = Object.values(chapterRefs.current)
    refs.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [setActiveChapter])

  // Keyboard navigation: ArrowDown / ArrowRight / ArrowUp / ArrowLeft
  const canGoToChapter = useCallback(
    (ch: number) => {
      if (ch === 1 || ch === 2 || ch === 3 || ch === 4) return true
      if (ch === 5) return constraintOk
      if (ch === 6) return constraintOk && patternOk
      return false
    },
    [constraintOk, patternOk],
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const next = Math.min(6, activeChapter + 1)
        if (next !== activeChapter && canGoToChapter(next)) {
          e.preventDefault()
          scrollToChapter(next)
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const prev = Math.max(1, activeChapter - 1)
        if (prev !== activeChapter) {
          e.preventDefault()
          scrollToChapter(prev)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeChapter, canGoToChapter, scrollToChapter])

  // Tokenize statement.clean with interactive collectible trigger keywords for Chapter 3
  const renderedKeywordsText = useMemo(() => {
    const keywords = st.trigger_keywords.filter(Boolean)
    if (!keywords.length) return <span>{st.clean}</span>

    const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const re = new RegExp(`(${escaped.join('|')})`, 'gi')
    const parts = st.clean.split(re)

    return parts.map((part, idx) => {
      const matchKw = keywords.find((k) => k.toLowerCase() === part.toLowerCase())
      if (matchKw) {
        const isCollected = collectedKeywords.has(matchKw)
        return (
          <button
            key={idx}
            type="button"
            onClick={() => toggleKeyword(matchKw)}
            className={`inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
              isCollected
                ? 'border border-emerald/60 bg-emerald/20 text-emerald shadow-[0_0_10px_-2px_rgba(16,185,129,0.4)]'
                : 'border border-amber/50 bg-amber/15 text-amber hover:bg-amber/25 animate-pulse'
            }`}
            title={isCollected ? 'Signal captured!' : 'Click to capture signal'}
          >
            {isCollected ? <Check size={12} strokeWidth={3} /> : <Sparkles size={11} />}
            <span>{part}</span>
          </button>
        )
      }
      return <span key={idx}>{part}</span>
    })
  }, [st.clean, st.trigger_keywords, collectedKeywords, toggleKeyword])

  return (
    <div
      ref={chapterContainerRef}
      className="scroll-snap-container flex flex-col gap-8 w-full"
      style={{ scrollSnapType: 'y proximity' }}
    >
      {/* ========================================================================= */}
      {/* CHAPTER 1: The Story (oa_story at --text-lead)                            */}
      {/* ========================================================================= */}
      {st.oa_story && (
        <section
          id="chapter-1"
          data-chapter-id={1}
          ref={(el) => {
            chapterRefs.current[1] = el
          }}
          style={{ minHeight: 'calc(100vh - 220px)', scrollSnapAlign: 'start' }}
          className="flex flex-col justify-center py-10 border-b border-line/30"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-[68ch] mx-auto space-y-6"
          >
            {/* Chapter Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xs uppercase tracking-wider text-cyan font-bold">
                  Chapter 1 of 6
                </span>
                <span className="text-line-strong">·</span>
                <span className="text-2xs font-semibold text-muted">The Story</span>
              </div>
              <button
                type="button"
                onClick={() => setCleanToggleCh1(!cleanToggleCh1)}
                className="text-2xs font-medium px-2.5 py-1 rounded-full border border-line bg-panel-2 text-muted hover:text-chalk transition-colors"
              >
                {cleanToggleCh1 ? 'View OA Story' : 'Clean version'}
              </button>
            </div>

            <h2 className="font-plate text-2xl font-bold tracking-tight text-chalk">
              {cleanToggleCh1 ? 'Core LeetCode Statement' : 'The Real-World Scenario'}
            </h2>

            {/* Story text with --text-lead (19px, line-height 1.6) */}
            <div
              className="prose-forge text-chalk"
              style={{ fontSize: 'var(--text-lead, 19px)', lineHeight: 'var(--lh-lead, 1.6)' }}
            >
              {cleanToggleCh1 ? (
                <div className="rounded-2xl border border-line bg-panel-2/60 p-5 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{st.clean}</ReactMarkdown>
                </div>
              ) : (
                <div className="leading-relaxed space-y-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{st.oa_story}</ReactMarkdown>
                </div>
              )}
            </div>

            <p className="text-xs text-faint italic">
              Strip the story away: what is actually being asked? Switch to clean version to check yourself.
            </p>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-2xs text-muted font-mono">Press ↓ or click continue</span>
              <Button onClick={() => scrollToChapter(2)} className="px-5 py-2 text-xs font-semibold">
                <span>Continue to Core Problem</span>
                <ArrowDown size={14} className="ml-1.5" />
              </Button>
            </div>
          </motion.div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CHAPTER 2: What is really asked (statement.clean; examples in panel)     */}
      {/* ========================================================================= */}
      <section
        id="chapter-2"
        data-chapter-id={2}
        ref={(el) => {
          chapterRefs.current[2] = el
        }}
        style={{ minHeight: 'calc(100vh - 220px)', scrollSnapAlign: 'start' }}
        className="flex flex-col justify-center py-10 border-b border-line/30"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-[68ch] mx-auto space-y-6"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xs uppercase tracking-wider text-cyan font-bold">
              Chapter 2 of 6
            </span>
            <span className="text-line-strong">·</span>
            <span className="text-2xs font-semibold text-muted">What is Really Asked</span>
          </div>

          <h2 className="font-plate text-2xl font-bold tracking-tight text-chalk">
            Deconstruct the Specification
          </h2>

          <div
            className="rounded-2xl border border-line bg-panel p-6 leading-relaxed text-chalk"
            style={{ fontSize: 'var(--text-body, 17px)', lineHeight: 'var(--lh-body, 1.6)' }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{st.clean}</ReactMarkdown>
          </div>

          {/* Context helper notice */}
          <div className="rounded-xl border border-line/70 bg-panel-2/50 p-4 text-xs text-muted flex items-start gap-3">
            <span className="text-base shrink-0">💡</span>
            <div>
              <strong className="text-chalk block mb-0.5">Ground Truth Examples pinned to Right Panel</strong>
              The first two test inputs and outputs are available in the right intelligence panel for continuous reference while reading.
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => scrollToChapter(1)} className="text-xs text-muted">
              <ArrowUp size={14} className="mr-1" />
              <span>Previous</span>
            </Button>
            <Button onClick={() => scrollToChapter(3)} className="px-5 py-2 text-xs font-semibold">
              <span>Continue to Spot Signals</span>
              <ArrowDown size={14} className="ml-1.5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* CHAPTER 3: Spot the signals (trigger_keywords highlighted & collectible)  */}
      {/* ========================================================================= */}
      {st.trigger_keywords && st.trigger_keywords.length > 0 && (
        <section
          id="chapter-3"
          data-chapter-id={3}
          ref={(el) => {
            chapterRefs.current[3] = el
          }}
          style={{ minHeight: 'calc(100vh - 220px)', scrollSnapAlign: 'start' }}
          className="flex flex-col justify-center py-10 border-b border-line/30"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-[68ch] mx-auto space-y-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xs uppercase tracking-wider text-cyan font-bold">
                  Chapter 3 of 6
                </span>
                <span className="text-line-strong">·</span>
                <span className="text-2xs font-semibold text-muted">Spot the Signals</span>
              </div>
              <span className="font-mono text-2xs font-semibold px-2 py-0.5 rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
                {collectedKeywords.size} / {st.trigger_keywords.length} Signals Captured
              </span>
            </div>

            <h2 className="font-plate text-2xl font-bold tracking-tight text-chalk">
              Interactive Signal Collection
            </h2>

            <p className="text-sm text-muted">
              Highlighted phrases are the trigger words that point to the pattern. Tap each word in the statement below to capture it:
            </p>

            <div
              className="rounded-2xl border border-line bg-panel p-6 leading-relaxed text-chalk"
              style={{ fontSize: 'var(--text-body, 17px)', lineHeight: 'var(--lh-body, 1.6)' }}
            >
              {renderedKeywordsText}
            </div>

            {/* Keyword chips strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {st.trigger_keywords.map((kw) => {
                const isCollected = collectedKeywords.has(kw)
                return (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => toggleKeyword(kw)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-colors ${
                      isCollected
                        ? 'border border-emerald/50 bg-emerald/15 text-emerald'
                        : 'border border-line bg-panel-2 text-muted hover:border-muted'
                    }`}
                  >
                    {isCollected ? <Check size={12} strokeWidth={3} /> : <Sparkles size={11} />}
                    <span>{kw}</span>
                  </button>
                )
              })}
              {collectedKeywords.size < st.trigger_keywords.length && (
                <button
                  type="button"
                  onClick={collectAllKeywords}
                  className="text-2xs font-medium text-cyan hover:underline ml-2"
                >
                  Collect all
                </button>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button variant="ghost" onClick={() => scrollToChapter(2)} className="text-xs text-muted">
                <ArrowUp size={14} className="mr-1" />
                <span>Previous</span>
              </Button>
              <Button onClick={() => scrollToChapter(4)} className="px-5 py-2 text-xs font-semibold">
                <span>Continue to Constraints</span>
                <ArrowDown size={14} className="ml-1.5" />
              </Button>
            </div>
          </motion.div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CHAPTER 4: Constraints & Telemetry Widget & Quiz (Two-Column Split Layout) */}
      {/* ========================================================================= */}
      <section
        id="chapter-4"
        data-chapter-id={4}
        ref={(el) => {
          chapterRefs.current[4] = el
        }}
        style={{ minHeight: 'calc(100vh - 220px)', scrollSnapAlign: 'start' }}
        className="flex flex-col justify-center py-10 border-b border-line/30 w-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-6xl mx-auto space-y-6"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xs uppercase tracking-wider text-cyan font-bold">
              Chapter 4 of 6
            </span>
            <span className="text-line-strong">·</span>
            <span className="text-2xs font-semibold text-muted">Constraints & Big-O Bounds</span>
          </div>

          <h2 className="font-plate text-2xl font-bold tracking-tight text-chalk">
            Read the Constraints Before You Code
          </h2>

          {/* Two-Column Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Noisy OA prompt context & Raw Constraints & Quiz */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Context Prompt Card */}
              <div className="rounded-2xl border border-line bg-panel p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-2xs font-mono font-bold uppercase tracking-wider text-faint">
                    Online Assessment Excerpt
                  </h4>
                  <span className="font-mono text-caption text-cyan">Signal Telemetry</span>
                </div>
                <div className="text-xs text-chalk leading-relaxed bg-panel-2/70 p-3.5 rounded-xl border border-line/70">
                  <p className="line-clamp-4 italic text-muted">
                    "{st.oa_story || st.clean}"
                  </p>
                </div>

                <div>
                  <h4 className="text-2xs font-mono font-semibold uppercase text-faint mb-2">
                    Raw Problem Constraints
                  </h4>
                  <ul className="flex flex-col gap-1.5 font-mono text-xs text-muted">
                    {st.constraints.map((cStr, idx) => (
                      <li key={idx} className="flex items-center gap-2 bg-panel-2/40 px-2.5 py-1.5 rounded-lg border border-line/50">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan shrink-0 animate-pulse" />
                        <span className="text-chalk font-semibold">{cStr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Constraint Checkpoint Quiz (Gated) */}
              <div className="rounded-2xl border border-line bg-panel p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-chalk">
                    Checkpoint: What do the constraints allow?
                  </h4>
                  {constraintOk && (
                    <span className="flex items-center gap-1 text-2xs font-semibold text-emerald">
                      <Check size={12} strokeWidth={3} /> Correct Answer
                    </span>
                  )}
                </div>
                <Quiz quiz={content.constraint_quiz} solved={constraintOk} onSolved={() => setConstraintOk(true)} />
              </div>
            </div>

            {/* Right Column: High-Precision Hardware Telemetry Panel */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <ConstraintsCheatWidget constraints={st.constraints} />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => scrollToChapter(3)} className="text-xs text-muted">
              <ArrowUp size={14} className="mr-1" />
              <span>Previous</span>
            </Button>
            <div className="flex items-center gap-3">
              {!constraintOk && (
                <span className="text-2xs text-faint flex items-center gap-1 font-mono">
                  <Lock size={12} /> Answer quiz to unlock Chapter 5
                </span>
              )}
              <Button
                onClick={() => scrollToChapter(5)}
                disabled={!constraintOk}
                className="px-5 py-2 text-xs font-semibold"
              >
                <span>Continue to Pattern Match</span>
                <ArrowDown size={14} className="ml-1.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* CHAPTER 5: Pick the Pattern (pattern_quiz; gated)                         */}
      {/* ========================================================================= */}
      <section
        id="chapter-5"
        data-chapter-id={5}
        ref={(el) => {
          chapterRefs.current[5] = el
        }}
        style={{ minHeight: 'calc(100vh - 220px)', scrollSnapAlign: 'start' }}
        className="flex flex-col justify-center py-10 border-b border-line/30"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-[68ch] mx-auto space-y-6"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xs uppercase tracking-wider text-cyan font-bold">
              Chapter 5 of 6
            </span>
            <span className="text-line-strong">·</span>
            <span className="text-2xs font-semibold text-muted">Pick the Pattern</span>
          </div>

          <h2 className="font-plate text-2xl font-bold tracking-tight text-chalk">
            Select the Architectural Pattern
          </h2>

          <div className="rounded-2xl border border-line bg-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-chalk">
                Which pattern fits these signals?
              </h4>
              <Link to="/finder" className="text-2xs font-semibold text-sky-400 hover:underline flex items-center gap-1">
                Not sure? Use the Pattern Finder →
              </Link>
            </div>
            <Quiz quiz={content.pattern_quiz} solved={patternOk} onSolved={() => setPatternOk(true)} />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => scrollToChapter(4)} className="text-xs text-muted">
              <ArrowUp size={14} className="mr-1" />
              <span>Previous</span>
            </Button>
            <div className="flex items-center gap-3">
              {!patternOk && (
                <span className="text-2xs text-faint flex items-center gap-1">
                  <Lock size={12} /> Answer quiz to unlock Chapter 6
                </span>
              )}
              <Button
                onClick={() => scrollToChapter(6)}
                disabled={!patternOk}
                className="px-5 py-2 text-xs font-semibold"
              >
                <span>Continue to Core Insight</span>
                <ArrowDown size={14} className="ml-1.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* CHAPTER 6: The Insight (3 accordions + start forging CTA)                 */}
      {/* ========================================================================= */}
      <section
        id="chapter-6"
        data-chapter-id={6}
        ref={(el) => {
          chapterRefs.current[6] = el
        }}
        style={{ minHeight: 'calc(100vh - 220px)', scrollSnapAlign: 'start' }}
        className="flex flex-col justify-center py-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-[68ch] mx-auto space-y-6"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xs uppercase tracking-wider text-cyan font-bold">
              Chapter 6 of 6
            </span>
            <span className="text-line-strong">·</span>
            <span className="text-2xs font-semibold text-muted">The Core Insight</span>
          </div>

          <h2 className="font-plate text-2xl font-bold tracking-tight text-chalk">
            Why This Pattern Exists
          </h2>

          <div className="space-y-3">
            {/* Accordion 1: Why brute force fails */}
            <div className="rounded-2xl border border-line bg-panel overflow-hidden">
              <button
                type="button"
                onClick={() => setAccordionOpen((prev) => ({ ...prev, brute: !prev.brute }))}
                className="flex items-center justify-between w-full p-4 text-left font-plate font-semibold text-chalk hover:bg-panel-2 transition-colors"
              >
                <span>Why brute force fails</span>
                {accordionOpen.brute ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {accordionOpen.brute && (
                <div className="p-4 pt-0 border-t border-line/40 text-sm text-muted space-y-2">
                  <Markdown>{c.brute_force}</Markdown>
                  <p className="font-mono text-xs text-oxide font-semibold">{c.brute_force_complexity}</p>
                </div>
              )}
            </div>

            {/* Accordion 2: The key insight */}
            <div className="rounded-2xl border border-emerald/50 bg-emerald/[0.05] overflow-hidden">
              <button
                type="button"
                onClick={() => setAccordionOpen((prev) => ({ ...prev, insight: !prev.insight }))}
                className="flex items-center justify-between w-full p-4 text-left font-plate font-bold text-emerald hover:bg-emerald/[0.08] transition-colors"
              >
                <span>The key insight</span>
                {accordionOpen.insight ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {accordionOpen.insight && (
                <div className="p-4 pt-0 border-t border-emerald/30 text-sm text-chalk leading-relaxed">
                  <Markdown>{c.key_insight}</Markdown>
                </div>
              )}
            </div>

            {/* Accordion 3: Where you will see it in real systems */}
            <div className="rounded-2xl border border-line bg-panel overflow-hidden">
              <button
                type="button"
                onClick={() => setAccordionOpen((prev) => ({ ...prev, realWorld: !prev.realWorld }))}
                className="flex items-center justify-between w-full p-4 text-left font-plate font-semibold text-chalk hover:bg-panel-2 transition-colors"
              >
                <span>Where you'll see it in real systems</span>
                {accordionOpen.realWorld ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {accordionOpen.realWorld && (
                <div className="p-4 pt-0 border-t border-line/40 text-sm text-muted leading-relaxed">
                  <Markdown>{c.real_world}</Markdown>
                </div>
              )}
            </div>

            {/* What it solves (Preserving 100% of original Stage 1 content) */}
            <div className="rounded-2xl border border-line bg-panel overflow-hidden">
              <button
                type="button"
                onClick={() => setAccordionOpen((prev) => ({ ...prev, solves: !prev.solves }))}
                className="flex items-center justify-between w-full p-4 text-left font-plate font-semibold text-chalk hover:bg-panel-2 transition-colors"
              >
                <span>What it solves</span>
                {accordionOpen.solves ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {accordionOpen.solves && (
                <div className="p-4 pt-0 border-t border-line/40 text-sm text-muted leading-relaxed">
                  <Markdown>{c.problem_it_solves}</Markdown>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Visual Simulator if configured or Demo Trace loaded */}
          {showConceptVisualizer && (
            <div className="rounded-2xl border border-line bg-panel p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="flex items-center gap-1.5 font-medium text-cyan">
                  <Eye size={14} /> Interactive Step-by-Step Mechanism Simulation
                </span>
                <span className="text-2xs font-mono">Stage 1: Visualize First, Code Second</span>
              </div>
              <div className="stage rounded-xl overflow-hidden border border-line">
                {demoSteps.length > 0 ? (
                  <VisualizerHost
                    kind={vizKind}
                    title={content.viz?.title || 'Optimal Pattern Execution Preview'}
                    timeComplexity={content.viz?.complexity?.time || content.solution?.time?.split(' — ')[0]}
                    spaceComplexity={content.viz?.complexity?.space || content.solution?.space?.split(' — ')[0]}
                    step={demoSteps[demoIndex] ?? demoSteps[0]}
                    prev={demoIndex > 0 ? demoSteps[demoIndex - 1] : undefined}
                    steps={demoSteps}
                    index={demoIndex}
                    config={content.viz || {}}
                    code={content.solution?.code || ''}
                    narration={demoNarration[demoIndex]}
                    caption={demoNarration[demoIndex]?.caption}
                    why={demoNarration[demoIndex]?.why}
                    comparisons={demoNarration[demoIndex]?.counters.comparisons}
                    swaps={demoNarration[demoIndex]?.counters.swaps}
                    writes={demoNarration[demoIndex]?.counters.writes}
                    playing={demoPlaying}
                    onTogglePlay={() => {
                      if (demoIndex >= demoSteps.length - 1 && !demoPlaying) setDemoIndex(0)
                      setDemoPlaying((p) => !p)
                    }}
                    onStepForward={() => setDemoIndex((i) => Math.min(demoSteps.length - 1, i + 1))}
                    onStepBackward={() => setDemoIndex((i) => Math.max(0, i - 1))}
                    onJumpFirst={() => setDemoIndex(0)}
                    onJumpLast={() => setDemoIndex(Math.max(0, demoSteps.length - 1))}
                    onSeek={setDemoIndex}
                    speed={demoSpeed}
                    onSpeedChange={setDemoSpeed}
                  />
                ) : (
                  <VisualizerHost
                    kind={vizKind || 'sql_pipeline'}
                    step={{
                      event: 'pipeline_step',
                      line: 1,
                      func: 'concept_demo',
                      depth: 0,
                      frames: [],
                      heap: {},
                      sql_state: content.concept_trace?.sql_state,
                      df_state: content.concept_trace?.df_state,
                      concurrency_state: content.concept_trace?.concurrency_state,
                      http_state: content.concept_trace?.http_state,
                      blueprint_state: content.concept_trace?.blueprint_state,
                    }}
                    steps={[]}
                    index={0}
                    config={content.viz || {}}
                    code={content.solution?.code || ''}
                  />
                )}
              </div>
            </div>
          )}

          {/* Final Advance CTA: Start forging */}
          <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => scrollToChapter(5)} className="text-xs text-muted">
              <ArrowUp size={14} className="mr-1" />
              <span>Previous chapter</span>
            </Button>
            <div className="flex items-center gap-3">
              {!(constraintOk && patternOk) && (
                <span className="text-2xs text-faint">Complete both quizzes to forge.</span>
              )}
              <Button
                onClick={onPassed}
                disabled={!(constraintOk && patternOk)}
                className="quest-pulse px-6 py-3 text-sm font-semibold"
              >
                <span>{content.drills.length ? 'Start forging micro-drills' : 'Start forging in arena'}</span>
                <span className="ml-1">→</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
