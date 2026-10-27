import { BookOpen, Check, ExternalLink, HelpCircle, Lightbulb, Play, Sparkles, Terminal, X, Zap } from 'lucide-react'
import { useState } from 'react'
import type { QuestionContent } from '../../api/types'
import { Markdown } from '../ui'

interface Props {
  content: QuestionContent
  activeChapter: number
  collectedKeywords: Set<string>
  onToggleKeyword?: (keyword: string) => void
  onClose?: () => void
}

export default function ChapterRightPanel({
  content,
  activeChapter,
  collectedKeywords,
  onToggleKeyword,
  onClose,
}: Props) {
  const [revealedHintIndex, setRevealedHintIndex] = useState<number>(-1)
  const st = content.statement
  const c = content.concept
  const hints = content.hints || []
  const examples = st.examples || []

  return (
    <div className="flex flex-col h-full rounded-2xl border border-line bg-panel p-4 shadow-sm text-sm">
      {/* Panel Top Header */}
      <div className="flex items-center justify-between gap-2 border-b border-line pb-3 mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-cyan" />
          <h3 className="font-plate text-xs font-bold uppercase tracking-wider text-chalk">
            Context & Intelligence
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-2xs text-muted">Ch {activeChapter} / 6</span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted hover:text-chalk hover:bg-panel-2 transition-colors"
              title="Close panel"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 pr-1">
        {/* CHAPTER 1 & 2 CONTEXT: Examples */}
        {(activeChapter === 1 || activeChapter === 2) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-mono font-semibold uppercase text-faint flex items-center gap-1.5">
                <Terminal size={12} className="text-cyan" /> Ground Truth Examples
              </span>
              <span className="text-2xs font-mono text-muted">{Math.min(examples.length, 2)} of {examples.length}</span>
            </div>

            {examples.slice(0, 2).map((ex, i) => (
              <div key={i} className="rounded-xl border border-line bg-panel-2/60 p-3 font-mono text-xs">
                <div className="text-2xs font-semibold text-faint mb-1">Example {i + 1}</div>
                <div className="text-chalk/90 mb-1">
                  <span className="text-muted font-sans mr-1.5">Input:</span>
                  <span className="text-cyan font-mono">{ex.input}</span>
                </div>
                <div className="text-chalk/90 mb-1">
                  <span className="text-muted font-sans mr-1.5">Output:</span>
                  <span className="text-emerald font-mono font-bold">{ex.output}</span>
                </div>
                {ex.explanation && (
                  <div className="mt-2 text-2xs font-sans text-muted border-t border-line/40 pt-1.5 leading-relaxed">
                    {ex.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CHAPTER 3 CONTEXT: Signal Glossary */}
        {activeChapter === 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-mono font-semibold uppercase text-faint flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber" /> Signal Word Glossary
              </span>
              <span className="text-2xs font-mono text-muted">
                {collectedKeywords.size}/{st.trigger_keywords.length} found
              </span>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Click each keyword in the main text to capture it. These phrasing cues unlock the underlying pattern:
            </p>

            <div className="space-y-2">
              {st.trigger_keywords.map((kw) => {
                const isCollected = collectedKeywords.has(kw)
                return (
                  <div
                    key={kw}
                    onClick={() => onToggleKeyword?.(kw)}
                    className={`rounded-xl border p-2.5 text-xs transition-colors cursor-pointer ${
                      isCollected
                        ? 'border-emerald/50 bg-emerald/10 text-chalk'
                        : 'border-line/70 bg-panel-2/40 text-muted hover:border-line'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-semibold text-2xs">
                      <span className={isCollected ? 'text-emerald' : 'text-amber'}>"{kw}"</span>
                      {isCollected ? (
                        <span className="flex items-center gap-1 text-emerald text-caption">
                          <Check size={12} strokeWidth={3} /> Captured
                        </span>
                      ) : (
                        <span className="text-faint text-caption">Click to spot</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CHAPTER 4 CONTEXT: Constraints & Big-O Guide */}
        {activeChapter === 4 && (
          <div className="space-y-3">
            <span className="text-2xs font-mono font-semibold uppercase text-faint flex items-center gap-1.5">
              <HelpCircle size={12} className="text-cyan" /> Constraint Breakdown
            </span>
            <ul className="space-y-1.5">
              {st.constraints.map((cStr, idx) => (
                <li key={idx} className="rounded-lg border border-line/60 bg-panel-2/50 px-2.5 py-1.5 font-mono text-2xs text-chalk/90">
                  {cStr}
                </li>
              ))}
            </ul>

            {/* Quick Rule-of-Thumb Card */}
            <div className="rounded-xl border border-cyan/30 bg-cyan/[0.05] p-3 text-xs text-muted space-y-1.5">
              <div className="flex items-center gap-1.5 font-plate font-bold text-chalk text-2xs uppercase tracking-wider">
                <Zap size={12} className="text-cyan" />
                <span>Quick Rule of Thumb</span>
              </div>
              <ul className="space-y-1 font-mono text-caption text-chalk/90">
                <li className="flex items-center justify-between">
                  <span className="text-faint">N ≤ 10⁷:</span>
                  <span className="text-cyan font-bold">Needs O(N) or O(N log N)</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-faint">N ≤ 10³:</span>
                  <span className="text-amber font-bold">O(N²) is acceptable</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-faint">N ≤ 20:</span>
                  <span className="text-crimson font-bold">O(2ᴺ) or O(N!) Backtrack</span>
                </li>
              </ul>
            </div>

            {/* Video Tutorial Card */}
            <a
              href="https://www.youtube.com/watch?v=mV3wrLBbuuE"
              target="_blank"
              rel="noreferrer"
              className="group block rounded-xl border border-rose-500/30 bg-rose-500/[0.07] p-3 text-xs transition-all hover:bg-rose-500/12 hover:border-rose-500/50"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-2xs font-plate font-bold text-rose-400 uppercase tracking-wider">
                  <Play size={11} className="fill-current text-rose-400" />
                  <span>10-Min Video Tutorial</span>
                </span>
                <ExternalLink size={12} className="text-rose-400 opacity-70 group-hover:opacity-100" />
              </div>
              <p className="font-plate text-xs font-semibold text-chalk line-clamp-1">
                CS Dojo: Introduction to Big O Notation
              </p>
              <p className="mt-1 font-sans text-2xs text-muted leading-relaxed">
                Visual explanation of growth curves, constant factors, and hardware limits by Ex-Google engineer.
              </p>
            </a>

            <div className="rounded-xl border border-line bg-panel-2/40 p-3 text-xs text-muted leading-relaxed">
              <strong className="text-chalk block mb-1">Negative Numbers Trap:</strong>
              Notice if values can be negative. If negative values are allowed, sliding window (<code className="text-cyan font-mono">l, r</code>) fails because expanding the window is no longer monotonic! You must use Prefix Sum + Hash Map.
            </div>
          </div>
        )}

        {/* CHAPTER 5 CONTEXT: Pattern Matching */}
        {activeChapter === 5 && (
          <div className="space-y-3">
            <span className="text-2xs font-mono font-semibold uppercase text-faint flex items-center gap-1.5">
              <Lightbulb size={12} className="text-gold" /> Pattern Deduction Signals
            </span>
            <div className="rounded-xl border border-line bg-panel-2/50 p-3 text-xs text-muted space-y-2.5 leading-relaxed">
              <div>
                <strong className="text-chalk block mb-1">Trigger Phrases Spotted:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {st.trigger_keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 font-mono text-2xs text-cyan"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-line/40 pt-2">
                <strong className="text-chalk block mb-1">Why Brute Force Fails:</strong>
                <p className="font-mono text-2xs text-amber mb-1">{c.brute_force_complexity}</p>
                <Markdown>{c.brute_force}</Markdown>
              </div>
              <div className="border-t border-line/40 pt-2">
                <strong className="text-chalk block mb-1">Target Complexity Goal:</strong>
                <p className="font-mono text-2xs text-emerald">
                  Time: {content.solution.time.split(' — ')[0]} · Space: {content.solution.space.split(' — ')[0]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CHAPTER 6 CONTEXT: Problem it Solves */}
        {activeChapter === 6 && (
          <div className="space-y-3">
            <span className="text-2xs font-mono font-semibold uppercase text-faint flex items-center gap-1.5">
              <Terminal size={12} className="text-emerald" /> What It Solves
            </span>
            <div className="rounded-xl border border-line bg-panel-2/50 p-3 text-xs text-muted leading-relaxed">
              <Markdown>{c.problem_it_solves}</Markdown>
            </div>
            <div className="rounded-xl border border-line bg-panel-2/50 p-3 text-xs text-muted leading-relaxed">
              <strong className="text-chalk block mb-1">Production Applications:</strong>
              <Markdown>{c.real_world}</Markdown>
            </div>
          </div>
        )}

        {/* PROGRESSIVE HINTS DRAWER (Accessible anytime) */}
        {hints.length > 0 && (
          <div className="border-t border-line pt-3 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-mono font-semibold uppercase text-faint flex items-center gap-1.5">
                <Lightbulb size={13} className="text-amber" /> Progressive Hints
              </span>
              <span className="text-2xs font-mono text-muted">{hints.length} available</span>
            </div>

            <div className="space-y-2">
              {hints.map((hintText, hIdx) => {
                const isRevealed = revealedHintIndex >= hIdx
                return (
                  <div key={hIdx} className="rounded-xl border border-line/70 bg-panel-2/40 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-chalk text-2xs">Hint {hIdx + 1}</span>
                      {!isRevealed && (
                        <button
                          onClick={() => setRevealedHintIndex(hIdx)}
                          className="text-2xs font-medium text-cyan hover:underline"
                        >
                          Reveal
                        </button>
                      )}
                    </div>
                    {isRevealed ? (
                      <p className="mt-1.5 text-muted leading-relaxed">{hintText}</p>
                    ) : (
                      <p className="mt-1 text-2xs text-faint italic">Tap reveal to unlock progressive guidance.</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
