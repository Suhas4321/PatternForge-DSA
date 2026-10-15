import { flushSync } from 'react-dom'

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }

/**
 * "Zoom into" navigation: the next page is revealed in a circle growing from `origin` (viewport
 * coordinates) while the current page scales up and blurs away behind it, like the theme toggle's
 * reveal. Falls back to a plain navigation without the View Transitions API or with reduced motion.
 */
export function zoomNavigate(go: () => void, origin: { x: number; y: number }) {
  const doc = document as ViewTransitionDoc
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const run = () => {
    go()
    window.scrollTo({ top: 0 })
  }
  if (!doc.startViewTransition || reduce) {
    run()
    return
  }
  const { x, y } = origin
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const easing = 'cubic-bezier(0.65, 0, 0.35, 1)'
  const transition = doc.startViewTransition(() => flushSync(run))
  transition.ready.then(() => {
    const root = document.documentElement
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 700, easing, pseudoElement: '::view-transition-new(root)' },
    )
    root.animate(
      {
        transform: ['scale(1)', 'scale(1.6)'],
        transformOrigin: [`${x}px ${y}px`, `${x}px ${y}px`],
        filter: ['blur(0px) brightness(1)', 'blur(4px) brightness(1.4)'],
        opacity: [1, 0.6],
      },
      { duration: 700, easing, pseudoElement: '::view-transition-old(root)' },
    )
  })
}
