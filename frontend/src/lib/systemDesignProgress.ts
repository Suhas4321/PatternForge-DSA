import { useEffect, useState } from 'react'

export const SYSTEM_DESIGN_STORAGE_KEY = 'pf_sysdesign_completed_v1'
export const SYSTEM_DESIGN_TOTAL_ASSIGNMENTS = 20
export const SYSTEM_DESIGN_PROGRESS_EVENT = 'pf_sysdesign_progress_updated'

export function getSystemDesignCompletedIds(): string[] {
  try {
    const raw = localStorage.getItem(SYSTEM_DESIGN_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function markSystemDesignCompleted(id: string): string[] {
  try {
    const current = getSystemDesignCompletedIds()
    if (current.includes(id)) return current
    const updated = [...current, id]
    localStorage.setItem(SYSTEM_DESIGN_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent(SYSTEM_DESIGN_PROGRESS_EVENT, { detail: { id, completedIds: updated } }))
    return updated
  } catch {
    return getSystemDesignCompletedIds()
  }
}

export function getSystemDesignStats() {
  const completedIds = getSystemDesignCompletedIds()
  const solved = completedIds.length
  const total = SYSTEM_DESIGN_TOTAL_ASSIGNMENTS
  const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0
  return {
    solved,
    total,
    pct,
    completedIds,
  }
}

export function useSystemDesignProgress() {
  const [stats, setStats] = useState(getSystemDesignStats)

  useEffect(() => {
    const sync = () => setStats(getSystemDesignStats())
    window.addEventListener(SYSTEM_DESIGN_PROGRESS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(SYSTEM_DESIGN_PROGRESS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return stats
}
