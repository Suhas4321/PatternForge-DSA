import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CITADELS, getCitadel } from '../lib/citadels'
import { useSystemDesignProgress } from '../lib/systemDesignProgress'

export default function CitadelSwitcher() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { solved: sysSolved, total: sysTotal } = useSystemDesignProgress()

  const isSystemDesign = pathname === '/system-design'
  const match = /^\/citadel\/([^/]+)/.exec(pathname)
  const currentCitadelId = match ? match[1] : 'dsa'
  const activeCitadel = getCitadel(currentCitadelId)

  // Close when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Switch Citadel Realm"
        className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-panel-2 px-2.5 text-xs font-medium text-chalk transition-all hover:border-cyan hover:bg-panel shadow-sm"
      >
        <span className="text-sm">{isSystemDesign ? '🏛️' : activeCitadel.icon}</span>
        <span className="font-plate font-semibold tracking-wide text-xs">
          Citadel {isSystemDesign ? 'VII' : activeCitadel.numeral}:
        </span>
        <span className="hidden sm:inline font-medium text-muted max-w-[130px] truncate">
          {isSystemDesign ? 'System Design' : activeCitadel.shortName}
        </span>
        <ChevronDown size={12} className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-line bg-panel p-2 shadow-2xl backdrop-blur-xl"
          >
            <div className="px-3 py-2 border-b border-line mb-1 flex items-center justify-between">
              <span className="text-2xs font-semibold uppercase tracking-wider text-muted">
                Select Engineering Citadel
              </span>
              <span className="text-2xs rounded-full bg-violet-500/15 px-2 py-0.5 font-medium text-violet-300">
                7 Realms Active
              </span>
            </div>

            <div className="flex flex-col gap-1 max-h-[380px] overflow-y-auto p-0.5">
              {CITADELS.map((citadel) => {
                const isActive = !isSystemDesign && citadel.id === activeCitadel.id
                return (
                  <button
                    key={citadel.id}
                    onClick={() => {
                      setOpen(false)
                      navigate(citadel.id === 'dsa' ? '/' : `/citadel/${citadel.id}`)
                    }}
                    className={`flex items-start gap-3 rounded-xl p-2.5 text-left transition-all ${
                      isActive
                        ? 'border border-cyan/40 bg-cyan/[0.08] shadow-sm'
                        : 'border border-transparent hover:border-line hover:bg-panel-2'
                    }`}
                  >
                    <span className="text-xl p-1 rounded-lg bg-panel-2 border border-line">
                      {citadel.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-plate text-xs font-bold text-muted">
                          Realm {citadel.numeral}
                        </span>
                        <span className="font-plate text-sm font-semibold text-chalk truncate">
                          {citadel.name}
                        </span>
                      </div>
                      <p className="text-2xs text-muted truncate mt-0.5">
                        {citadel.tagline}
                      </p>
                    </div>
                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px_var(--color-cyan)] mt-2 mr-1" />
                    )}
                  </button>
                )
              })}

              {/* Realm VII: System Design */}
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate('/system-design')
                }}
                className={`flex items-start gap-3 rounded-xl p-2.5 text-left transition-all ${
                  isSystemDesign
                    ? 'border border-violet-400/50 bg-violet-500/10 shadow-sm'
                    : 'border border-transparent hover:border-line hover:bg-panel-2'
                }`}
              >
                <span className="text-xl p-1 rounded-lg bg-panel-2 border border-line">
                  🏛️
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-plate text-xs font-bold text-violet-400">
                        Realm VII
                      </span>
                      <span className="font-plate text-sm font-semibold text-chalk truncate">
                        System Design & Architecture
                      </span>
                    </div>
                    <span className="font-mono text-2xs text-violet-300">
                      {sysSolved}/{sysTotal}
                    </span>
                  </div>
                  <p className="text-2xs text-muted truncate mt-0.5">
                    OOP/SOLID → Low-Level Design → 10 Distributed Systems
                  </p>
                </div>
                {isSystemDesign && (
                  <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)] mt-2 mr-1" />
                )}
              </button>
            </div>

            <div className="mt-2 pt-2 border-t border-line flex flex-col gap-1">
              <Link
                to="/resume-grill"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-2 rounded-xl p-2.5 text-xs font-medium text-chalk hover:bg-sky-500/[0.08] hover:border hover:border-sky-500/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-sky-400" />
                  <span className="font-plate font-semibold text-sky-400">Interactive Resume Defense Simulator</span>
                </div>
                <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-2xs text-sky-400 font-mono">
                  Suhas's Bullets
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
