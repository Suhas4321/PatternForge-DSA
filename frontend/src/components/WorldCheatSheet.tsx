import { BookMarked, Printer, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { CheatSheet } from '../api/types'
import { Button, ConfidenceStars, DifficultyBadge, ErrorNote, LeetCodeLink, Markdown, Spinner } from './ui'

const WORLD_NAMES = [
  'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack', 'Binary Search', 'Linked Lists',
  'Trees', 'Heaps', 'Backtracking', 'Graphs', 'Greedy & Intervals', 'Dynamic Programming',
]

/** Input size → the complexity it allows: the constraint cheat-codes. */
const CHEAT_CODES: [string, string, string][] = [
  ['N ≤ 12', 'O(N!)', 'permutations'],
  ['N ≤ 20', 'O(2^N)', 'backtracking, bitmask subsets'],
  ['N ≤ 500', 'O(N³)', 'interval / triple-loop DP'],
  ['N ≤ 5·10³', 'O(N²)', 'pairwise DP, nested loops'],
  ['N ≤ 10⁵ – 10⁶', 'O(N log N) or O(N)', 'sorting, heaps, binary search, two pointers, hashing'],
  ['N up to 10⁹ (value range)', 'O(log N)', 'binary search on the answer, math'],
]

const PITCH_LINES: [keyof CheatSheet['solved'][number]['pitch'], string][] = [
  ['brute_force', 'Brute force'],
  ['trigger', 'Trigger'],
  ['intuition', 'Optimal idea'],
  ['complexity', 'Complexity'],
]

interface Props {
  worldId: number | null
  onWorldChange: (id: number) => void
  onClose: () => void
}

export default function WorldCheatSheet({ worldId, onWorldChange, onClose }: Props) {
  const [sheet, setSheet] = useState<CheatSheet | null>(null)
  const [error, setError] = useState<string | null>(null)
  const open = worldId !== null

  useEffect(() => {
    if (worldId === null) return
    setSheet(null)
    setError(null)
    api.cheatsheet(worldId).then(setSheet).catch((e) => setError(e.message))
  }, [worldId])

  useEffect(() => {
    if (!open) return
    document.body.classList.add('sheet-open')
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('sheet-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="no-print absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label="World cheat-sheet"
            className="print-sheet absolute top-0 right-0 flex h-full w-full max-w-3xl flex-col border-l border-line bg-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <header className="liquid-glass no-print flex items-center gap-3 rounded-none border-x-0 border-t-0 px-5 py-3">
              <BookMarked size={18} className="text-cyan" />
              <h2 className="font-plate text-lg font-semibold">Pattern Grimoire</h2>
              <select
                value={worldId ?? 1}
                onChange={(e) => onWorldChange(Number(e.target.value))}
                className="ml-2 rounded-lg border border-chalk/[0.12] bg-chalk/[0.04] px-2 py-1 text-sm text-chalk"
                aria-label="World"
              >
                {WORLD_NAMES.map((n, i) => (
                  <option key={n} value={i + 1}>
                    {i + 1}. {n}
                  </option>
                ))}
              </select>
              <div className="ml-auto flex items-center gap-1">
                <Button variant="glass" onClick={() => window.print()} disabled={!sheet}>
                  <Printer size={15} /> Print
                </Button>
                <Button variant="ghost" onClick={onClose} aria-label="Close">
                  <X size={17} />
                </Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {error && <ErrorNote message={error} />}
              {!sheet && !error && <Spinner />}
              {sheet && (
                <article className="flex flex-col gap-8">
                  <section>
                    <p className="text-xs text-faint">World {sheet.world_id}, 10-minute revision sheet</p>
                    <h3 className="font-plate text-2xl font-semibold">{sheet.name}</h3>
                    <p className="mt-1 text-muted italic">{sheet.tagline}</p>
                    <p className="mt-3 max-w-[70ch] text-chalk">{sheet.core_idea}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {sheet.triggers.map((t) => (
                        <span key={t} className="rounded-full border border-cyan/30 bg-cyan/[0.07] px-2.5 py-0.5 text-xs text-cyan">
                          {t}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="mb-2 text-sm font-semibold">Constraint cheat-codes</h4>
                    <table className="w-full text-sm">
                      <tbody>
                        {CHEAT_CODES.map(([n, c, what]) => (
                          <tr key={n} className="border-b border-line">
                            <td className="py-1.5 pr-4 font-mono text-xs text-muted">{n}</td>
                            <td className="py-1.5 pr-4 font-mono text-xs text-cyan">{c}</td>
                            <td className="py-1.5 text-xs text-muted">{what}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>

                  <section>
                    <h4 className="mb-2 text-sm font-semibold">Every pattern in this world</h4>
                    <div className="flex flex-col divide-y divide-line rounded-xl border border-line">
                      {sheet.patterns.map((p) => (
                        <div key={p.slug} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[13rem_1fr]">
                          <div>
                            <div className="text-sm font-medium">{p.title}</div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="font-mono text-2xs text-faint">#{p.lc}</span>
                              <DifficultyBadge difficulty={p.difficulty} />
                            </div>
                          </div>
                          <div className="text-xs">
                            <div className="text-muted">
                              <span className="text-faint">Spot it: </span>
                              {p.trigger_keywords.join(', ')}
                            </div>
                            <div className="mt-0.5 font-mono text-emerald-hi">
                              {p.time.split(' — ')[0]} time, {p.space.split(' — ')[0]} space
                            </div>
                            <Markdown className="mt-1 line-clamp-3 text-muted">{p.key_insight}</Markdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="mb-2 text-sm font-semibold">Your pitches and working code</h4>
                    {sheet.solved.length === 0 ? (
                      <p className="text-sm text-muted">
                        Nothing here yet. Each question you solve in this world adds its 4-line pitch and your working
                        code to this sheet.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {sheet.solved.map((s) => (
                          <div key={s.slug} className="break-inside-avoid rounded-xl border border-line bg-ink/60 p-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <LeetCodeLink lc={s.lc} url={`https://leetcode.com/problems/${s.slug}/`} />
                              <Link to={`/q/${s.slug}?stage=4`} onClick={onClose} className="font-semibold hover:text-cyan">
                                {s.title}
                              </Link>
                              <ConfidenceStars value={s.confidence} />
                              <span className="ml-auto font-mono text-xs text-emerald-hi">{s.time.split(' — ')[0]}</span>
                            </div>
                            <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-[7rem_1fr]">
                              {PITCH_LINES.map(([key, label]) => (
                                <div key={key} className="contents">
                                  <dt className="text-faint">{label}</dt>
                                  <dd className={s.pitch[key] ? 'text-chalk' : 'text-faint italic'}>
                                    {(s.pitch[key] as string) || 'not written yet'}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                            <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-ink p-3 font-mono text-xs leading-relaxed">
                              {s.code}
                            </pre>
                            {s.code_source !== 'passing_submission' && (
                              <p className="mt-1 text-2xs text-faint">
                                {s.code_source === 'draft' ? 'Your latest draft' : 'Reference solution (you studied it)'}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </article>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
