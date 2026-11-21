export type SpaceCategory = 'interstellar' | 'deep-space' | 'earth-orbit'
export type DistanceUnit = 'km' | 'au' | 'mi'

export interface SpacecraftProfile {
  id: string
  name: string
  agency: string
  category: SpaceCategory
  status: 'Active' | 'Silent / Coasting'
  region: string
  launched: string
  baseKmFromEarth: number
  speedKmPerSec: number
  oscillateKm?: number
  oscillatePeriodSec?: number
  accent: string
  highlight: string
  notes: string
}

export const EPOCH_MS = Date.UTC(2026, 10, 21, 0, 0, 0)
export const AU_KM = 149_597_870.7
export const LIGHT_SPEED_KMS = 299_792.458
export const ONE_LIGHT_DAY_KM = 25_902_068_371

export const SPACECRAFT: SpacecraftProfile[] = [
  {
    id: 'voyager-1',
    name: 'Voyager 1',
    agency: 'NASA / JPL',
    category: 'interstellar',
    status: 'Active',
    region: 'Interstellar Medium (Ophiuchus)',
    launched: '1977-09-05',
    baseKmFromEarth: 25_910_000_000,
    speedKmPerSec: 16.918,
    accent: '#22d3ee',
    highlight: 'Passed 1 Full Light-Day on Nov 18, 2026',
    notes: 'Most distant human-made object in history. Still transmitting magnetometer & plasma wave data via Deep Space Network.',
  },
  {
    id: 'voyager-2',
    name: 'Voyager 2',
    agency: 'NASA / JPL',
    category: 'interstellar',
    status: 'Active',
    region: 'Interstellar Medium (Pavo)',
    launched: '1977-08-20',
    baseKmFromEarth: 21_690_000_000,
    speedKmPerSec: 15.263,
    accent: '#38bdf8',
    highlight: 'Only spacecraft to visit Uranus & Neptune',
    notes: 'Entered interstellar space in Nov 2018. Traveling south of the ecliptic plane toward a 1 light-day milestone in 2035.',
  },
  {
    id: 'pioneer-10',
    name: 'Pioneer 10',
    agency: 'NASA Ames',
    category: 'interstellar',
    status: 'Silent / Coasting',
    region: 'Outer Heliosphere (Taurus)',
    launched: '1972-03-03',
    baseKmFromEarth: 20_920_000_000,
    speedKmPerSec: 11.86,
    accent: '#94a3b8',
    highlight: 'First probe to cross the Asteroid Belt',
    notes: 'Last radio signal received in January 2003. Continues coasting outward carrying the gold-anodized Pioneer Plaque.',
  },
  {
    id: 'new-horizons',
    name: 'New Horizons',
    agency: 'NASA / JHUAPL',
    category: 'deep-space',
    status: 'Active',
    region: 'Kuiper Belt',
    launched: '2006-01-19',
    baseKmFromEarth: 9_981_642_062,
    speedKmPerSec: 13.574,
    accent: '#a78bfa',
    highlight: 'Pluto & Arrokoth Flyby Explorer',
    notes: 'Active heliophysics and Kuiper Belt dust/solar-wind observatory heading toward the heliopause.',
  },
  {
    id: 'parker-solar',
    name: 'Parker Solar Probe',
    agency: 'NASA / JHUAPL',
    category: 'deep-space',
    status: 'Active',
    region: 'Inner Heliosphere / Solar Corona',
    launched: '2018-08-12',
    baseKmFromEarth: 148_500_000,
    speedKmPerSec: 122.4,
    oscillateKm: 42_000_000,
    oscillatePeriodSec: 7_603_200,
    accent: '#fb923c',
    highlight: 'Fastest human-made object ever built',
    notes: 'Dives repeatedly through the Sun corona, reaching speeds up to ~192 km/s at perihelion.',
  },
  {
    id: 'jwst',
    name: 'James Webb Space Telescope',
    agency: 'NASA / ESA / CSA',
    category: 'deep-space',
    status: 'Active',
    region: 'Sun–Earth L2 Halo Orbit',
    launched: '2021-12-25',
    baseKmFromEarth: 1_500_000,
    speedKmPerSec: 0.28,
    oscillateKm: 180_000,
    oscillatePeriodSec: 15_552_000,
    accent: '#facc15',
    highlight: '6.5m Infrared Deep-Field Observatory',
    notes: 'Stationed ~1.5 million km beyond Earth at Lagrange Point 2, shielded from solar heat by a 5-layer sunshield.',
  },
  {
    id: 'hubble',
    name: 'Hubble Space Telescope',
    agency: 'NASA / ESA',
    category: 'earth-orbit',
    status: 'Active',
    region: 'Low Earth Orbit (~525 km)',
    launched: '1990-04-24',
    baseKmFromEarth: 525,
    speedKmPerSec: 7.59,
    oscillateKm: 8,
    oscillatePeriodSec: 5700,
    accent: '#34d399',
    highlight: '36+ Years of Continuous Orbital Science',
    notes: 'Completes an orbit around Earth roughly every 95 minutes capturing ultraviolet and visible-light deep space imagery.',
  },
]

export function computeLiveDistanceKm(craft: SpacecraftProfile, nowMs: number): number {
  const elapsedSec = (nowMs - EPOCH_MS) / 1000
  if (craft.oscillateKm && craft.oscillatePeriodSec) {
    const phase = (elapsedSec / craft.oscillatePeriodSec) * Math.PI * 2
    return Math.max(200, craft.baseKmFromEarth + Math.sin(phase) * craft.oscillateKm)
  }
  return Math.max(0, craft.baseKmFromEarth + elapsedSec * craft.speedKmPerSec)
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  if (unit === 'au') {
    const au = km / AU_KM
    return `${au < 0.01 ? au.toFixed(6) : au.toFixed(4)} AU`
  }
  if (unit === 'mi') {
    const mi = km * 0.621371
    return `${Math.round(mi).toLocaleString()} mi`
  }
  return `${Math.round(km).toLocaleString()} km`
}

export function formatLightTime(km: number): string {
  const totalSec = km / LIGHT_SPEED_KMS
  if (totalSec < 60) {
    return `${totalSec.toFixed(2)}s`
  }
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = Math.floor(totalSec % 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`
  }
  if (hours > 0) {
    return `${hours}h ${pad(mins)}m ${pad(secs)}s`
  }
  return `${mins}m ${pad(secs)}s`
}
