import type { CheatSheet, CoachReply, CoachStatus, Pitch, Progress, QuestionDetail, ReviewQueue, RunResult, World } from './types'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(0, 'Backend is not reachable. Start it with ./run.sh (or uvicorn on port 8010).')
  }
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') message = body.detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

const json = (body: unknown) => JSON.stringify(body)

export const api = {
  worlds: () => request<World[]>('/api/worlds'),
  review: () => request<ReviewQueue>('/api/review'),
  question: (slug: string) => request<QuestionDetail>(`/api/questions/${slug}`),
  run: (
    slug: string,
    body: { code: string; target: string; visualize?: boolean; trace_test_index?: number; custom_args?: unknown },
  ) => request<RunResult>(`/api/questions/${slug}/run`, { method: 'POST', body: json(body) }),
  saveDraft: (slug: string, target: string, code: string) =>
    request<void>(`/api/questions/${slug}/draft`, { method: 'PUT', body: json({ target, code }) }),
  patchProgress: (
    slug: string,
    patch: Partial<Pick<Progress, 'concept_done' | 'quiz_passed' | 'studied_solution' | 'hints_used'>>,
  ) => request<Progress>(`/api/questions/${slug}/progress`, { method: 'PATCH', body: json(patch) }),
  rate: (slug: string, confidence: number) =>
    request<Progress>(`/api/questions/${slug}/confidence`, { method: 'POST', body: json({ confidence }) }),
  savePitch: (slug: string, pitch: Pitch) =>
    request<Pitch>(`/api/questions/${slug}/pitch`, { method: 'PUT', body: json(pitch) }),
  backupStatus: () =>
    request<{ path: string; exists: boolean; modified_at: string | null; size_bytes: number }>('/api/backup/status'),
  backupDump: () => request<{ path: string }>('/api/backup/dump', { method: 'POST' }),
  cheatsheet: (worldId: number) => request<CheatSheet>(`/api/worlds/${worldId}/cheatsheet`),
  coachStatus: () => request<CoachStatus>('/api/coach/status'),
  askCoach: (slug: string, body: { mode: 'hint' | 'pitch'; code: string; pitch?: Pitch }) =>
    request<CoachReply>(`/api/questions/${slug}/ask-coach`, { method: 'POST', body: json(body) }),
  backupRestore: () => request<{ restored: Record<string, number> }>('/api/backup/restore', { method: 'POST' }),
}
