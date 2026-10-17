import { BookMarked, Compass, FlaskConical, HardDriveDownload, MoreHorizontal, ShieldCheck, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../api/client'
import { useBackgroundEffects, type BackgroundEffectLevel } from './effects'
import { Button } from './ui'
import { GlassSurface } from './vendor/vsrc/glass-surface'

type Status = Awaited<ReturnType<typeof api.backupStatus>>

interface MoreMenuProps {
  onOpenGrimoire: () => void
}

export default function MoreMenu({ onOpenGrimoire }: MoreMenuProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const { level: bgLevel, setLevel: setBgLevel } = useBackgroundEffects()

  // Close when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', onDocClick)
      setMessage(null)
      api.backupStatus().then(setStatus).catch((e) => setMessage(e.message))
    }
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const dump = async () => {
    try {
      await api.backupDump()
      setStatus(await api.backupStatus())
      setMessage('Backup complete.')
    } catch (e) {
      setMessage((e as Error).message)
    }
  }

  const restore = async () => {
    if (!window.confirm('Replace all progress, pitches and drafts with the contents of the backup file?')) return
    try {
      const r = await api.backupRestore()
      setMessage(`Restored ${r.restored.progress} questions. Reloading…`)
      setTimeout(() => window.location.reload(), 900)
    } catch (e) {
      setMessage((e as Error).message)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="More navigation and options"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-panel-2 text-muted transition-colors hover:border-line-strong hover:text-chalk"
      >
        <MoreHorizontal size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <GlassSurface asChild glass={{ scale: -64, mapBlur: 10, blur: 16 }}>
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 z-50 w-76 rounded-2xl border border-line bg-panel/90 p-3 shadow-2xl backdrop-blur-xl"
            >
              {/* Mobile / Tablet nav links (hidden on desktop lg: >=1024px) */}
              <div className="lg:hidden flex flex-col gap-1 pb-2 border-b border-line mb-2">
                <span className="px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-faint">
                  Navigation
                </span>
                <Link
                  to="/resume-grill"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    pathname === '/resume-grill'
                      ? 'bg-panel-2 text-chalk font-semibold'
                      : 'text-muted hover:bg-panel-2 hover:text-chalk'
                  }`}
                >
                  <ShieldCheck size={14} className="text-[var(--accent-ai-resume,#38BDF8)]" />
                  <span>Resume Grill</span>
                </Link>
              <button
                onClick={() => {
                  setOpen(false)
                  onOpenGrimoire()
                }}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-panel-2 hover:text-chalk transition-colors text-left"
              >
                <BookMarked size={14} />
                <span>Grimoire (Revision Sheets)</span>
              </button>
              <Link
                to="/finder"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  pathname === '/finder'
                    ? 'bg-panel-2 text-chalk font-semibold'
                    : 'text-muted hover:bg-panel-2 hover:text-chalk'
                }`}
              >
                <Compass size={14} />
                <span>Pattern Finder</span>
              </Link>
              <Link
                to="/playground"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  pathname === '/playground'
                    ? 'bg-panel-2 text-chalk font-semibold'
                    : 'text-muted hover:bg-panel-2 hover:text-chalk'
                }`}
              >
                <FlaskConical size={14} />
                <span>Playground</span>
              </Link>
            </div>

            {/* Background Effects */}
            <div className="flex flex-col gap-2 pb-2 border-b border-line mb-2">
              <div className="flex items-center gap-1.5 px-2 text-2xs font-semibold uppercase tracking-wider text-faint">
                <Sparkles size={12} />
                <span>Background Effects</span>
              </div>
              <div className="flex gap-1.5 px-1">
                {(['off', 'subtle', 'full'] as BackgroundEffectLevel[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setBgLevel(opt)}
                    className={`flex-1 rounded-lg py-1 text-xs font-medium transition-colors capitalize ${
                      bgLevel === opt
                        ? 'bg-panel-2 text-chalk border border-line-strong'
                        : 'text-muted hover:bg-panel-2 hover:text-chalk border border-transparent'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Backup & System Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 px-2 text-2xs font-semibold uppercase tracking-wider text-faint">
                <HardDriveDownload size={12} />
                <span>Local Snapshot Backup</span>
              </div>
              <p className="px-2 text-xs text-muted leading-relaxed">
                Save or restore your code drafts, pitches, and quest completion history.
              </p>
              {status && (
                <p className="px-2 font-mono text-caption text-faint break-all leading-snug">
                  {status.exists ? `${status.path}\nSaved: ${status.modified_at}` : 'No local backup yet.'}
                </p>
              )}
              <div className="flex items-center gap-2 px-1 pt-1">
                <Button variant="outline" className="text-xs h-7 px-2.5 flex-1" onClick={dump}>
                  Back up now
                </Button>
                <Button
                  variant="ghost"
                  className="text-xs h-7 px-2.5 flex-1 text-muted hover:text-chalk"
                  onClick={restore}
                  disabled={!status?.exists}
                >
                  Restore
                </Button>
              </div>
              {message && <p className="px-2 text-2xs text-cyan">{message}</p>}
            </div>
          </motion.div>
        </GlassSurface>
      )}
    </AnimatePresence>
    </div>
  )
}
