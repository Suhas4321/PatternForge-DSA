import { BookMarked, FlaskConical, Map } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import BackupMenu from './components/BackupMenu'
import { GrimoireProvider, useGrimoire } from './lib/grimoire'

function TopBar() {
  const openGrimoire = useGrimoire()
  const { pathname } = useLocation()
  const worldMatch = /^\/world\/(\d+)/.exec(pathname)
  const nav = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
      isActive ? 'bg-white/[0.08] text-chalk glass-edge' : 'text-muted hover:text-chalk hover:bg-white/[0.04]'
    }`
  return (
    <header className="no-print sticky top-3 z-40 mx-auto mt-3 w-[calc(100%-1.5rem)] max-w-[1500px]">
      <div className="liquid-glass flex h-12 items-center gap-3 rounded-2xl px-3">
        <Link to="/" className="flex items-center gap-2 pr-2">
          <img src="/favicon.svg" alt="" className="h-6 w-6" />
          <span className="hidden font-plate text-lg font-semibold tracking-tight text-chalk min-[420px]:inline">PatternForge</span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={nav} aria-label="Journey">
            <Map size={15} /> <span className="hidden sm:inline">Journey</span>
          </NavLink>
          <button
            aria-label="Open the Grimoire"
            className={nav({ isActive: false })}
            onClick={() => openGrimoire(worldMatch ? Number(worldMatch[1]) : undefined)}
          >
            <BookMarked size={15} /> <span className="hidden sm:inline">Grimoire</span>
          </button>
          <NavLink to="/playground" className={nav} aria-label="Playground">
            <FlaskConical size={15} /> <span className="hidden sm:inline">Playground</span>
          </NavLink>
        </nav>
        <div className="ml-auto">
          <BackupMenu />
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <GrimoireProvider>
      <div className="aurora" aria-hidden="true" />
      <div className="relative z-10 min-h-screen">
        <TopBar />
        <main>
          <Outlet />
        </main>
      </div>
    </GrimoireProvider>
  )
}
