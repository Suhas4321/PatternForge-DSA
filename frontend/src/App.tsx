import { BookMarked, FlaskConical, Map } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import BackupMenu from './components/BackupMenu'
import { ThemeToggle } from './components/effects'
import { GrimoireProvider, useGrimoire } from './lib/grimoire'

const itemClass = (active: boolean) =>
  `relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
    active ? 'text-chalk' : 'text-muted hover:text-chalk'
  }`

/** Dock item: lifts on hover; the active item gets a sliding pill behind it. */
function DockItem({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <motion.span whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }} className="relative block">
      {active && (
        <motion.span
          layoutId="dock-pill"
          className="absolute inset-0 rounded-full border border-line bg-panel-2"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      )}
      {children}
    </motion.span>
  )
}

function TopBar() {
  const openGrimoire = useGrimoire()
  const { pathname } = useLocation()
  const worldMatch = /^\/world\/(\d+)/.exec(pathname)
  const onJourney = pathname === '/' || pathname.startsWith('/world') || pathname.startsWith('/q/')
  return (
    <header className="no-print sticky top-3 z-40 mx-auto mt-3 flex w-[calc(100%-1.5rem)] max-w-[1500px] justify-center">
      <div className="liquid-glass flex h-12 w-full max-w-3xl items-center gap-2 rounded-full px-2.5">
        <Link to="/" className="flex items-center gap-2 rounded-full pr-2 pl-1">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          <span className="hidden font-plate text-lg font-semibold tracking-tight text-chalk min-[420px]:inline">PatternForge</span>
        </Link>
        <nav className="flex items-center gap-0.5">
          <DockItem active={onJourney}>
            <NavLink to="/" aria-label="Journey" className={() => itemClass(onJourney)}>
              <Map size={15} /> <span className="hidden sm:inline">Journey</span>
            </NavLink>
          </DockItem>
          <DockItem active={false}>
            <button
              aria-label="Open the Grimoire"
              className={itemClass(false)}
              onClick={() => openGrimoire(worldMatch ? Number(worldMatch[1]) : undefined)}
            >
              <BookMarked size={15} /> <span className="hidden sm:inline">Grimoire</span>
            </button>
          </DockItem>
          <DockItem active={pathname === '/playground'}>
            <NavLink to="/playground" aria-label="Playground" className={({ isActive }) => itemClass(isActive)}>
              <FlaskConical size={15} /> <span className="hidden sm:inline">Playground</span>
            </NavLink>
          </DockItem>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <BackupMenu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <GrimoireProvider>
      <div className="min-h-screen">
        <TopBar />
        <main>
          <Outlet />
        </main>
      </div>
    </GrimoireProvider>
  )
}
