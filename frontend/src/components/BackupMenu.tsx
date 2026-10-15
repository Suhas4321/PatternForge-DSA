import { HardDriveDownload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { Button } from './ui'

type Status = Awaited<ReturnType<typeof api.backupStatus>>

export default function BackupMenu() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setMessage(null)
    api.backupStatus().then(setStatus).catch((e) => setMessage(e.message))
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const dump = async () => {
    try {
      await api.backupDump()
      setStatus(await api.backupStatus())
      setMessage('Backed up.')
    } catch (e) {
      setMessage((e as Error).message)
    }
  }

  const restore = async () => {
    if (!window.confirm('Replace all progress, pitches and drafts with the contents of the backup file?')) return
    try {
      const r = await api.backupRestore()
      setMessage(`Restored ${r.restored.progress} questions of progress. Reloading…`)
      setTimeout(() => window.location.reload(), 900)
    } catch (e) {
      setMessage((e as Error).message)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm text-muted hover:bg-chalk/[0.05] hover:text-chalk"
        aria-expanded={open}
        aria-label="Backup"
      >
        <HardDriveDownload size={16} /> <span className="hidden sm:inline">Backup</span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-3 w-80 card rounded-2xl p-4 shadow-2xl">
          <p className="text-sm text-chalk">Your progress is saved to a file after every change.</p>
          {status && (
            <p className="mt-2 font-mono text-xs break-all whitespace-pre-line text-muted">
              {status.exists ? `${status.path}\nlast written ${status.modified_at}` : 'No backup file yet.'}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={dump}>
              Back up now
            </Button>
            <Button variant="ghost" onClick={restore} disabled={!status?.exists}>
              Restore from file
            </Button>
          </div>
          {message && <p className="mt-2 text-xs text-muted">{message}</p>}
        </div>
      )}
    </div>
  )
}
