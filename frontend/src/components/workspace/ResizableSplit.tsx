import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

interface ResizableSplitProps {
  /** 'horizontal' = Left / Right panes; 'vertical' = Top / Bottom panes */
  direction: 'horizontal' | 'vertical'
  /** Initial percentage (0..100) for the first pane */
  initialPrimaryPct?: number
  minPrimaryPct?: number
  maxPrimaryPct?: number
  storageKey?: string
  /** Optional: collapse the first pane (e.g. hide left problem panel) */
  primaryCollapsed?: boolean
  /** Optional: collapse the second pane (e.g. minimize bottom console to a 36px bar) */
  secondaryCollapsed?: boolean
  secondaryCollapsedSizePx?: number
  first: ReactNode
  second: ReactNode
  className?: string
}

export default function ResizableSplit({
  direction,
  initialPrimaryPct = 48,
  minPrimaryPct = 20,
  maxPrimaryPct = 80,
  storageKey,
  primaryCollapsed = false,
  secondaryCollapsed = false,
  secondaryCollapsedSizePx = 36,
  first,
  second,
  className = '',
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [pct, setPct] = useState<number>(() => {
    if (storageKey) {
      try {
        const saved = Number(localStorage.getItem(storageKey))
        if (!Number.isNaN(saved) && saved >= minPrimaryPct && saved <= maxPrimaryPct) {
          return saved
        }
      } catch {
        /* ignore */
      }
    }
    return initialPrimaryPct
  })
  const [dragging, setDragging] = useState(false)

  const updatePct = useCallback(
    (next: number) => {
      const clamped = Math.min(maxPrimaryPct, Math.max(minPrimaryPct, Math.round(next * 10) / 10))
      setPct(clamped)
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, String(clamped))
        } catch {
          /* ignore */
        }
      }
    },
    [maxPrimaryPct, minPrimaryPct, storageKey],
  )

  useEffect(() => {
    if (!dragging) return

    const onPointerMove = (e: PointerEvent) => {
      const box = containerRef.current?.getBoundingClientRect()
      if (!box) return
      if (direction === 'horizontal') {
        const next = ((e.clientX - box.left) / Math.max(1, box.width)) * 100
        updatePct(next)
      } else {
        const next = ((e.clientY - box.top) / Math.max(1, box.height)) * 100
        updatePct(next)
      }
    }

    const onPointerUp = () => {
      setDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [direction, dragging, updatePct])

  const isHoriz = direction === 'horizontal'

  if (primaryCollapsed) {
    return (
      <div ref={containerRef} className={`flex h-full w-full overflow-hidden ${isHoriz ? 'flex-row' : 'flex-col'} ${className}`}>
        <div className="h-full w-full flex-1 min-w-0 min-h-0 overflow-hidden">{second}</div>
      </div>
    )
  }

  if (secondaryCollapsed) {
    return (
      <div ref={containerRef} className={`flex h-full w-full overflow-hidden ${isHoriz ? 'flex-row' : 'flex-col'} ${className}`}>
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">{first}</div>
        <div
          style={isHoriz ? { width: `${secondaryCollapsedSizePx}px` } : { height: `${secondaryCollapsedSizePx}px` }}
          className="shrink-0 overflow-hidden border-t border-line bg-panel"
        >
          {second}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`flex h-full w-full overflow-hidden ${isHoriz ? 'flex-row' : 'flex-col'} ${className}`}
    >
      {/* First Pane */}
      <div
        style={isHoriz ? { width: `${pct}%` } : { height: `${pct}%` }}
        className="min-w-0 min-h-0 shrink-0 overflow-hidden"
      >
        {first}
      </div>

      {/* Draggable Gutter Handle (LeetCode style) */}
      <div
        role="separator"
        aria-orientation={isHoriz ? 'vertical' : 'horizontal'}
        title="Drag to resize · Double-click to reset"
        onPointerDown={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDoubleClick={() => updatePct(initialPrimaryPct)}
        className={`group relative z-20 flex shrink-0 items-center justify-center bg-line transition-colors select-none ${
          isHoriz ? 'w-1.5 cursor-col-resize hover:bg-cyan/60' : 'h-1.5 cursor-row-resize hover:bg-cyan/60'
        } ${dragging ? 'bg-cyan !opacity-100' : ''}`}
      >
        {/* Center grip pill */}
        <span
          className={`rounded-full bg-muted/60 transition-colors group-hover:bg-chalk ${
            isHoriz ? 'h-7 w-0.5' : 'h-0.5 w-7'
          } ${dragging ? 'bg-chalk' : ''}`}
        />
      </div>

      {/* Second Pane */}
      <div className="flex-1 min-w-0 min-h-0 overflow-hidden">{second}</div>
    </div>
  )
}
