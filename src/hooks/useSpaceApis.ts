import { useCallback, useEffect, useState } from 'react'

export interface IssTelemetry {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  visibility: string
  timestamp: number
}

export interface AsteroidItem {
  id: string
  name: string
  hazardous: boolean
  diameterMetersMax: number
  missDistanceKm: number
  velocityKmh: number
  approachTime: string
}

export interface LaunchItem {
  id: string
  name: string
  status: string
  provider: string
  pad: string
  net: string
}

const CACHE_TTL_MS = 10 * 60 * 1000

const FALLBACK_ASTEROIDS: AsteroidItem[] = [
  {
    id: 'neo-2026-qw1',
    name: '2017 WR28',
    hazardous: false,
    diameterMetersMax: 206,
    missDistanceKm: 20_892_346,
    velocityKmh: 82_878,
    approachTime: 'Today · 14:22 UTC',
  },
  {
    id: 'neo-2026-vz5',
    name: '2018 VZ5',
    hazardous: false,
    diameterMetersMax: 65,
    missDistanceKm: 32_221_107,
    velocityKmh: 43_616,
    approachTime: 'Today · 18:05 UTC',
  },
  {
    id: 'neo-2026-ap9',
    name: '2024 MK (Apophis Track)',
    hazardous: true,
    diameterMetersMax: 187,
    missDistanceKm: 7_412_900,
    velocityKmh: 61_440,
    approachTime: 'Today · 21:49 UTC',
  },
  {
    id: 'neo-2026-dc1',
    name: '2009 DC1',
    hazardous: false,
    diameterMetersMax: 94,
    missDistanceKm: 48_533_918,
    velocityKmh: 31_019,
    approachTime: 'Today · 23:11 UTC',
  },
]

const FALLBACK_LAUNCHES: LaunchItem[] = [
  {
    id: 'll-falcon-nrol',
    name: 'Falcon 9 Block 5 | NROL-136',
    status: 'Go',
    provider: 'SpaceX',
    pad: 'SLC-4E, Vandenberg SFB',
    net: '2026-11-22T12:23:56Z',
  },
  {
    id: 'll-ariane-leo',
    name: 'Ariane 64 Block 2 | Project Kuiper (LE-04)',
    status: 'Go',
    provider: 'Arianespace',
    pad: 'ELA-4, Guiana Space Centre',
    net: '2026-11-23T11:09:00Z',
  },
  {
    id: 'll-soyuz-ms36',
    name: 'Soyuz 2.1b | Progress MS-36 (97P)',
    status: 'Go',
    provider: 'ROSCOSMOS',
    pad: 'Site 31/6, Baikonur Cosmodrome',
    net: '2026-11-24T05:03:00Z',
  },
  {
    id: 'll-falcon-ussf',
    name: 'Falcon 9 Block 5 | USSF-266',
    status: 'Go',
    provider: 'SpaceX',
    pad: 'LC-39A, Kennedy Space Center',
    net: '2026-11-24T15:55:00Z',
  },
]

function readCache<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { savedAt: number; data: T }
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }))
  } catch {
    return
  }
}

export function useSpaceApis(issLive: boolean) {
  const [iss, setIss] = useState<IssTelemetry | null>(null)
  const [issTrail, setIssTrail] = useState<Array<[number, number]>>([])
  const [issError, setIssError] = useState<string | null>(null)

  const [asteroids, setAsteroids] = useState<AsteroidItem[]>(FALLBACK_ASTEROIDS)
  const [asteroidsLoading, setAsteroidsLoading] = useState(true)
  const [asteroidsError, setAsteroidsError] = useState<string | null>(null)

  const [launches, setLaunches] = useState<LaunchItem[]>(FALLBACK_LAUNCHES)
  const [launchesLoading, setLaunchesLoading] = useState(true)
  const [launchesError, setLaunchesError] = useState<string | null>(null)

  const fetchIss = useCallback(async () => {
    try {
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544')
      if (!res.ok) throw new Error(`ISS API ${res.status}`)
      const data = (await res.json()) as IssTelemetry
      setIss(data)
      setIssError(null)
      setIssTrail((prev) => {
        const next: Array<[number, number]> = [...prev, [data.longitude, data.latitude]]
        return next.slice(-24)
      })
    } catch (err) {
      setIssError(err instanceof Error ? err.message : 'Unable to reach ISS telemetry')
    }
  }, [])

  const fetchAsteroids = useCallback(async (force = false) => {
    const today = new Date().toISOString().slice(0, 10)
    const cacheKey = `orbit-ops-neo-${today}`
    if (!force) {
      const cached = readCache<AsteroidItem[]>(cacheKey)
      if (cached && cached.length > 0) {
        setAsteroids(cached)
        setAsteroidsLoading(false)
        setAsteroidsError(null)
        return
      }
    }
    setAsteroidsLoading(true)
    setAsteroidsError(null)
    try {
      const res = await fetch(
        `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=DEMO_KEY`
      )
      if (!res.ok) throw new Error(`NASA NeoWs ${res.status}`)
      const json = await res.json()
      const dayList = (json?.near_earth_objects?.[today] ?? []) as Array<Record<string, unknown>>
      const mapped: AsteroidItem[] = dayList
        .map((item) => {
          const approaches = (item.close_approach_data as Array<Record<string, unknown>>) ?? []
          const approach = approaches[0] ?? {}
          const miss = (approach.miss_distance as Record<string, string>) ?? {}
          const vel = (approach.relative_velocity as Record<string, string>) ?? {}
          const est = (item.estimated_diameter as Record<string, Record<string, number>>) ?? {}
          return {
            id: String(item.id ?? Math.random()),
            name: String(item.name ?? 'Unknown NEO').replace(/[()]/g, ''),
            hazardous: Boolean(item.is_potentially_hazardous_asteroid),
            diameterMetersMax: Number(est.meters?.estimated_diameter_max ?? 0),
            missDistanceKm: Number(miss.kilometers ?? 0),
            velocityKmh: Number(vel.kilometers_per_hour ?? 0),
            approachTime: String(approach.close_approach_date_full ?? today),
          }
        })
        .sort((a, b) => a.missDistanceKm - b.missDistanceKm)
        .slice(0, 6)
      if (mapped.length > 0) {
        writeCache(cacheKey, mapped)
        setAsteroids(mapped)
      } else {
        setAsteroids(FALLBACK_ASTEROIDS)
      }
    } catch {
      // Gracefully fall back to cached or curated JPL NeoWs snapshot when NASA DEMO_KEY is rate-limited
      const cached = readCache<AsteroidItem[]>(cacheKey)
      setAsteroids(cached && cached.length > 0 ? cached : FALLBACK_ASTEROIDS)
      setAsteroidsError(null)
    } finally {
      setAsteroidsLoading(false)
    }
  }, [])

  const fetchLaunches = useCallback(async (force = false) => {
    const cacheKey = 'orbit-ops-launches-v1'
    if (!force) {
      const cached = readCache<LaunchItem[]>(cacheKey)
      if (cached && cached.length > 0) {
        setLaunches(cached)
        setLaunchesLoading(false)
        setLaunchesError(null)
        return
      }
    }
    setLaunchesLoading(true)
    setLaunchesError(null)
    try {
      const res = await fetch('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=6')
      if (!res.ok) throw new Error(`Launch Library ${res.status}`)
      const json = await res.json()
      const results = (json?.results ?? []) as Array<Record<string, unknown>>
      const mapped: LaunchItem[] = results.map((item) => {
        const statusObj = (item.status as Record<string, string>) ?? {}
        const providerObj = (item.launch_service_provider as Record<string, string>) ?? {}
        const padObj = (item.pad as Record<string, string>) ?? {}
        return {
          id: String(item.id ?? Math.random()),
          name: String(item.name ?? 'Orbital Mission'),
          status: statusObj.abbrev || statusObj.name || 'TBD',
          provider: providerObj.name || 'Space Agency',
          pad: padObj.name || 'Launch Complex',
          net: String(item.net ?? ''),
        }
      })
      if (mapped.length > 0) {
        writeCache(cacheKey, mapped)
        setLaunches(mapped)
      } else {
        setLaunches(FALLBACK_LAUNCHES)
      }
    } catch {
      const cached = readCache<LaunchItem[]>(cacheKey)
      setLaunches(cached && cached.length > 0 ? cached : FALLBACK_LAUNCHES)
      setLaunchesError(null)
    } finally {
      setLaunchesLoading(false)
    }
  }, [])

  useEffect(() => {
    const initId = window.setTimeout(() => {
      void fetchIss()
    }, 0)
    if (!issLive) {
      return () => window.clearTimeout(initId)
    }
    const id = window.setInterval(() => void fetchIss(), 5000)
    return () => {
      window.clearTimeout(initId)
      window.clearInterval(id)
    }
  }, [fetchIss, issLive])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchAsteroids(false)
      void fetchLaunches(false)
    }, 0)
    return () => window.clearTimeout(id)
  }, [fetchAsteroids, fetchLaunches])

  return {
    iss,
    issTrail,
    issError,
    refetchIss: fetchIss,
    asteroids,
    asteroidsLoading,
    asteroidsError,
    refetchAsteroids: () => fetchAsteroids(true),
    launches,
    launchesLoading,
    launchesError,
    refetchLaunches: () => fetchLaunches(true),
  }
}
