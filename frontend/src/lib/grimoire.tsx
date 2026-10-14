import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import WorldCheatSheet from '../components/WorldCheatSheet'

const GrimoireContext = createContext<(worldId?: number) => void>(() => {})

/** Lets any page open the world cheat-sheet drawer: `const openGrimoire = useGrimoire()`. */
export function GrimoireProvider({ children }: { children: ReactNode }) {
  const [worldId, setWorldId] = useState<number | null>(null)
  const open = useCallback((id?: number) => setWorldId(id ?? 1), [])
  const close = useCallback(() => setWorldId(null), [])
  return (
    <GrimoireContext.Provider value={open}>
      {children}
      <WorldCheatSheet worldId={worldId} onWorldChange={setWorldId} onClose={close} />
    </GrimoireContext.Provider>
  )
}

export const useGrimoire = () => useContext(GrimoireContext)
