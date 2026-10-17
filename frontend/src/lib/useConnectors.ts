import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export interface Connector<K> {
  from: K
  to: K
  d: string
}

/**
 * Measures DOM nodes inside a container and returns SVG paths connecting them, recomputed on
 * resize. Layout stays plain CSS (so it wraps responsively); only the lines are computed.
 * `mode: 'vertical'` connects bottom-centre → top-centre with an S-curve.
 */
export function useConnectors<K extends string | number>(pairs: [K, K][], deps: unknown[] = []) {
  const containerRef = useRef<HTMLDivElement>(null)
  const nodes = useRef(new Map<K, HTMLElement>())
  const [paths, setPaths] = useState<Connector<K>[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })

  const register = useCallback(
    (key: K) => (el: HTMLElement | null) => {
      if (el) nodes.current.set(key, el)
      else nodes.current.delete(key)
    },
    [],
  )

  const measure = useCallback(() => {
    const box = containerRef.current?.getBoundingClientRect()
    if (!box) return
    const out: Connector<K>[] = []
    for (const [from, to] of pairs) {
      const a = nodes.current.get(from)?.getBoundingClientRect()
      const b = nodes.current.get(to)?.getBoundingClientRect()
      if (!a || !b) continue
      const x1 = a.left + a.width / 2 - box.left
      const x2 = b.left + b.width / 2 - box.left
      let y1: number
      let y2: number
      if (a.top > b.bottom) {
        // a is below b (bottom-to-top mountain flow)
        y1 = a.top - box.top
        y2 = b.bottom - box.top
      } else {
        // a is above b (top-to-bottom flow)
        y1 = a.bottom - box.top
        y2 = b.top - box.top
      }
      const my = (y1 + y2) / 2
      out.push({ from, to, d: `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}` })
    }
    setPaths(out)
    setSize({ w: box.width, h: box.height })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pairs)])

  useLayoutEffect(() => {
    measure()
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps])

  return { containerRef, register, paths, size }
}
