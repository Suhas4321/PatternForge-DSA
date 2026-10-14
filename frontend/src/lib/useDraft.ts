import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

/** Editor contents for one target ('main' / 'drill:N'), autosaved to the backend after a pause. */
export function useDraft(slug: string, target: string, initial: string) {
  const [code, setCode] = useState(initial)
  const lastSaved = useRef(initial)

  useEffect(() => {
    setCode(initial)
    lastSaved.current = initial
  }, [slug, target, initial])

  useEffect(() => {
    if (code === lastSaved.current) return
    const t = setTimeout(() => {
      lastSaved.current = code
      api.saveDraft(slug, target, code).catch(() => {
        /* drafts are best-effort; the next run saves the code anyway */
      })
    }, 800)
    return () => clearTimeout(t)
  }, [code, slug, target])

  return [code, setCode] as const
}
