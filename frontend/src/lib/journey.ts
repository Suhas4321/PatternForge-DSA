import type { Progress, QuestionSummary, World } from '../api/types'

/** The 12-world skill tree: rows from top (foundation) to bottom (final citadel). */
export const TIERS: number[][] = [[1], [2, 4], [3, 5, 6], [7, 11], [8, 9, 10], [12]]

/** Parent → child prerequisites drawn as constellation paths. */
export const EDGES: [number, number][] = [
  [1, 2], [1, 4],
  [2, 3], [2, 5], [4, 6],
  [6, 7], [5, 7], [3, 11], [5, 11],
  [7, 8], [7, 9], [7, 10], [11, 8],
  [9, 12], [10, 12],
]

export const RANKS = [
  { min: 0, title: 'Novice Tracer' },
  { min: 15, title: 'Pointer Adept' },
  { min: 45, title: 'Recursion Architect' },
  { min: 90, title: 'Grandmaster' },
]

export function rankFor(solved: number) {
  let i = 0
  while (i + 1 < RANKS.length && solved >= RANKS[i + 1].min) i++
  return { title: RANKS[i].title, next: RANKS[i + 1] ?? null }
}

export type WorldState = 'mastered' | 'active' | 'open' | 'fog'

/**
 * mastered: every question solved. active: you've started it (or it holds your current quest).
 * open: a prerequisite world has progress, so it's the natural next step. fog: not reached yet
 * (still clickable — the fog is guidance, not a lock).
 */
export function worldState(w: World, worlds: World[], questWorldId: number | null): WorldState {
  if (w.total > 0 && w.solved === w.total) return 'mastered'
  const started = w.questions.some((q) => q.progress.status !== 'new')
  if (started || w.id === questWorldId) return 'active'
  const parents = EDGES.filter(([, c]) => c === w.id).map(([p]) => p)
  const parentProgress = parents.some((p) => (worlds.find((x) => x.id === p)?.solved ?? 0) > 0)
  return parents.length === 0 || parentProgress ? 'open' : 'fog'
}

export const isRusting = (w: World) => w.due > 0 || w.rust === 'rusting' || w.rust === 'rusted'

/** The question to work on next: a due review first, then anything in progress, then the next unsolved. */
export function currentQuest(worlds: World[]): { question: QuestionSummary; reason: 'review' | 'continue' | 'next' } | null {
  const all = worlds.flatMap((w) => w.questions)
  const due = all.find((q) => q.progress.status === 'review_due')
  if (due) return { question: due, reason: 'review' }
  const inProgress = all.find((q) => q.has_content && q.progress.status === 'in_progress')
  if (inProgress) return { question: inProgress, reason: 'continue' }
  const next = all.find((q) => q.has_content && !q.progress.solved)
  return next ? { question: next, reason: 'next' } : null
}

export const questUrl = (q: QuestionSummary) => `/q/${q.slug}${q.progress.status === 'review_due' ? '?mode=review' : ''}`

/** Which of the 4 stages a question has completed. */
export function stagesDone(p: Progress, drillCount = 3) {
  return {
    concept: p.quiz_passed || p.solved,
    drills: p.drills_passed.length >= drillCount || p.solved,
    arena: p.solved,
    pitch: p.confidence !== null,
  }
}
