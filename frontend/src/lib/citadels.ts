import curriculumData from './curriculum.json'

export interface Citadel {
  id: string
  name: string
  shortName: string
  numeral: string
  icon: string
  tagline: string
  description: string
  worldIds: number[]
  tiers: number[][]
  edges: [number, number][]
  themeColor: string
}

const CITADEL_ICONS: Record<string, string> = {
  dsa: '⚔️',
  python_data: '🐍',
  sql_dbms: '🗄️',
  os_concurrency: '⚡',
  backend_apis: '🌐',
  ai_resume: '🧠',
}

interface RawCitadel {
  id: string
  numeral: string
  name: string
  short_name: string
  accent: string
  tagline: string
  description: string
  tiers: number[][]
  edges: number[][]
}

export const PEAK_ACCENTS_DARK: Record<string, string> = {
  dsa: '#6EE7B7',
  python_data: '#F2B866',
  sql_dbms: '#67E8F9',
  os_concurrency: '#FB923C',
  backend_apis: '#FB7185',
  ai_resume: '#38BDF8',
}

export const PEAK_ACCENTS_LIGHT: Record<string, string> = {
  dsa: '#047857',
  python_data: '#B45309',
  sql_dbms: '#0E7490',
  os_concurrency: '#C2410C',
  backend_apis: '#BE123C',
  ai_resume: '#0284C7',
}

export const PEAK_ACCENTS: Record<string, string> = PEAK_ACCENTS_DARK

export function getCitadelAccent(citadelId: string, isLight = false): string {
  return isLight ? (PEAK_ACCENTS_LIGHT[citadelId] ?? '#047857') : (PEAK_ACCENTS_DARK[citadelId] ?? '#6EE7B7')
}

export const CITADELS: Citadel[] = (((curriculumData as unknown) as { citadels?: RawCitadel[] }).citadels || []).map((raw) => {
  const worldIds = raw.tiers.flat()
  const cssVarName = `--accent-${raw.id.replace(/_/g, '-')}`
  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.short_name,
    numeral: raw.numeral,
    icon: CITADEL_ICONS[raw.id] ?? '🏔️',
    tagline: raw.tagline,
    description: raw.description,
    worldIds,
    tiers: raw.tiers,
    edges: (raw.edges || []).map(([f, t]) => [f, t] as [number, number]),
    themeColor: `var(${cssVarName}, ${PEAK_ACCENTS_DARK[raw.id] ?? raw.accent})`,
  }
})

export function getCitadel(id?: string): Citadel {
  return CITADELS.find((c) => c.id === id) ?? CITADELS[0]
}

export function citadelForWorld(worldId: number): Citadel {
  return CITADELS.find((c) => c.worldIds.includes(worldId)) ?? CITADELS[0]
}
