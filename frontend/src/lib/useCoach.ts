import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { CoachStatus } from '../api/types'

let cached: Promise<CoachStatus> | null = null

/** Whether an AI provider is configured in backend/.env (fetched once per page load). */
export function useCoachStatus(): CoachStatus | null {
  const [status, setStatus] = useState<CoachStatus | null>(null)
  useEffect(() => {
    cached ??= api.coachStatus().catch(() => ({ enabled: false, provider: null, model: null }))
    cached.then(setStatus)
  }, [])
  return status
}
