import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Compass,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Rocket,
  Satellite,
  Search,
  Sparkles,
  Star,
  Timer,
} from 'lucide-react'
import {
  SPACECRAFT,
  computeLiveDistanceKm,
  formatDistance,
  formatLightTime,
  type DistanceUnit,
  type SpaceCategory,
} from './data/spacecraft'
import { useSpaceApis } from './hooks/useSpaceApis'
import { DeepSpaceRadar, IssGroundTrack } from './components/SpaceVisuals'

type FilterTab = 'all' | SpaceCategory | 'pinned'

function GitHubIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

export default function App() {
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [unit, setUnit] = useState<DistanceUnit>('km')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('voyager-1')
  const [issLive, setIssLive] = useState(true)
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem('orbit-ops-pinned')
      return saved ? (JSON.parse(saved) as string[]) : ['voyager-1', 'voyager-2']
    } catch {
      return ['voyager-1', 'voyager-2']
    }
  })

  const {
    iss,
    issTrail,
    issError,
    refetchIss,
    asteroids,
    asteroidsLoading,
    asteroidsError,
    refetchAsteroids,
    launches,
    launchesLoading,
    launchesError,
    refetchLaunches,
  } = useSpaceApis(issLive)

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('orbit-ops-pinned', JSON.stringify(pinned))
    } catch {
      return
    }
  }, [pinned])

  function togglePin(id: string) {
    setPinned((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const liveSpacecraft = useMemo(() => {
    return SPACECRAFT.map((craft) => {
      const km = computeLiveDistanceKm(craft, nowMs)
      return { ...craft, liveKm: km }
    })
  }, [nowMs])

  const filteredSpacecraft = useMemo(() => {
    const q = query.trim().toLowerCase()
    return liveSpacecraft.filter((craft) => {
      if (filter === 'pinned' && !pinned.includes(craft.id)) return false
      if (filter !== 'all' && filter !== 'pinned' && craft.category !== filter) return false
      if (!q) return true
      return (
        craft.name.toLowerCase().includes(q) ||
        craft.region.toLowerCase().includes(q) ||
        craft.agency.toLowerCase().includes(q)
      )
    })
  }, [filter, liveSpacecraft, pinned, query])

  const radarObjects = useMemo(() => {
    const list = liveSpacecraft.map((c) => ({
      id: c.id,
      name: c.name,
      km: c.liveKm,
      accent: c.accent,
    }))
    if (iss) {
      list.unshift({
        id: 'iss',
        name: 'ISS',
        km: iss.altitude,
        accent: '#34d399',
      })
    }
    return list
  }, [iss, liveSpacecraft])

  const activeCraft =
    liveSpacecraft.find((c) => c.id === selectedId) ??
    liveSpacecraft.find((c) => c.id === 'voyager-1') ??
    liveSpacecraft[0]

  return (
    <div className="min-h-dvh pb-16">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#040711]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <a
              href="https://portfolio-hub-44jc.vercel.app/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 font-mono text-xs font-medium text-slate-300 transition-colors hover:border-cyan-500/50 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-cyan-400" />
              <span>Portfolio</span>
            </a>
            <div className="h-5 w-px bg-slate-800" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
              <Satellite className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-mono text-lg font-bold tracking-tight text-white">
                ORBIT // OPS
              </h1>
              <p className="font-mono text-[11px] text-slate-400">
                LIVE SPACECRAFT, ISS &amp; NEAR-EARTH OBJECT TRACKER
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
              {(['km', 'au', 'mi'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold uppercase transition-colors ${
                    unit === u
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            <a
              href="https://github.com/Nannidan/orbit-ops"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 font-mono text-xs font-medium text-slate-300 transition-colors hover:border-cyan-500/50 hover:text-white"
              title="View Source on GitHub"
            >
              <GitHubIcon className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 pt-6 sm:px-6">
        {activeCraft && (
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-cyan-500/35 bg-gradient-to-br from-cyan-950/40 via-slate-950/90 to-slate-950/90 p-5 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-0.5 font-mono text-[11px] font-bold uppercase text-cyan-300">
                  <Radio className="h-3.5 w-3.5 animate-pulse" />
                  ACTIVE TELEMETRY LOCK // {activeCraft.name}
                </span>
                <span className="font-mono text-xs text-cyan-300/90">
                  {activeCraft.highlight}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="font-mono text-[10px] uppercase text-slate-400">Live Distance from Earth</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white sm:text-2xl">
                    {formatDistance(activeCraft.liveKm, unit)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase text-slate-400">One-Way Signal Delay</p>
                  <p className="mt-1 font-mono text-xl font-bold text-cyan-300 sm:text-2xl">
                    {formatLightTime(activeCraft.liveKm)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase text-slate-400">Heliocentric Velocity</p>
                  <p className="mt-1 font-mono text-xl font-bold text-violet-300 sm:text-2xl">
                    {activeCraft.speedKmPerSec.toFixed(2)} km/s
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/70 pt-2.5 font-mono text-[11px] text-slate-400">
                <span>
                  SECTOR: <strong className="text-slate-200">{activeCraft.region}</strong>
                </span>
                <span>
                  AGENCY: <strong className="text-slate-200">{activeCraft.agency}</strong> · LAUNCHED{' '}
                  {activeCraft.launched}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/85 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400">
                  <Activity className="h-4 w-4" />
                  ISS LIVE TELEMETRY
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIssLive((v) => !v)}
                    className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                    title={issLive ? 'Pause 5s polling' : 'Resume 5s polling'}
                  >
                    {issLive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void refetchIss()}
                    className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                    title="Refresh ISS position now"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <IssGroundTrack iss={iss} trail={issTrail} />
              </div>

              {issError ? (
                <p className="mt-2 font-mono text-xs text-rose-400">{issError}</p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs">
                  <div className="rounded-lg bg-slate-900/90 p-2">
                    <span className="block text-[10px] text-slate-400">ALT</span>
                    <span className="font-bold text-white">
                      {iss ? `${iss.altitude.toFixed(1)} km` : '---'}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-900/90 p-2">
                    <span className="block text-[10px] text-slate-400">SPEED</span>
                    <span className="font-bold text-emerald-300">
                      {iss ? `${Math.round(iss.velocity).toLocaleString()}` : '---'}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-900/90 p-2">
                    <span className="block text-[10px] text-slate-400">SUN</span>
                    <span className="font-bold uppercase text-amber-300">
                      {iss ? iss.visibility : '---'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <DeepSpaceRadar
          objects={radarObjects}
          selectedId={selectedId}
          onSelect={(id) => {
            if (id !== 'iss') setSelectedId(id)
          }}
        />

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'All Fleet' },
                  { id: 'interstellar', label: 'Interstellar' },
                  { id: 'deep-space', label: 'Deep Space' },
                  { id: 'earth-orbit', label: 'Earth Orbit' },
                  { id: 'pinned', label: `Watchlist (${pinned.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold transition-all ${
                    filter === tab.id
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Voyager, JWST, Kuiper..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/90 py-2 pr-3 pl-9 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {filteredSpacecraft.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-8 text-center font-mono text-sm text-slate-400">
              No spacecraft match your active filter.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSpacecraft.map((craft) => {
                const isPinned = pinned.includes(craft.id)
                const isSelected = selectedId === craft.id
                return (
                  <article
                    key={craft.id}
                    onClick={() => setSelectedId(craft.id)}
                    className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                      isSelected
                        ? 'border-cyan-400/70 bg-slate-900/95 shadow-[0_0_30px_-12px_rgba(34,211,238,0.45)]'
                        : 'border-slate-800/90 bg-slate-950/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: craft.accent }}
                        >
                          <Compass className="h-3 w-3" />
                          {craft.region}
                        </span>
                        <h2 className="mt-1 font-mono text-lg font-bold text-white">
                          {craft.name}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePin(craft.id)
                        }}
                        aria-label={isPinned ? 'Remove from watchlist' : 'Add to watchlist'}
                        className={`rounded-lg border p-1.5 transition-colors ${
                          isPinned
                            ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                            : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-200'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={isPinned ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div className="mt-4 space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 font-mono text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">DISTANCE</span>
                        <span className="font-bold text-white">
                          {formatDistance(craft.liveKm, unit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">LIGHT TIME</span>
                        <span className="font-bold text-cyan-300">
                          {formatLightTime(craft.liveKm)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">VELOCITY</span>
                        <span className="font-bold text-slate-200">
                          {craft.speedKmPerSec.toFixed(2)} km/s
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-slate-400">{craft.notes}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 font-mono text-[10px]">
                      <span className="text-slate-500">
                        {craft.agency} // {craft.launched}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${
                          craft.status === 'Active'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {craft.status}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/85 p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                  Today&apos;s Near-Earth Asteroids (NASA NeoWs)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => void refetchAsteroids()}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
              >
                <RefreshCw className={`h-3 w-3 ${asteroidsLoading ? 'animate-spin' : ''}`} />
                Sync
              </button>
            </div>

            {asteroidsLoading ? (
              <div className="mt-4 space-y-2.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 animate-pulse rounded-xl bg-slate-900/90" />
                ))}
              </div>
            ) : asteroidsError ? (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 font-mono text-xs text-rose-300">
                {asteroidsError}
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {asteroids.map((neo) => (
                  <div
                    key={neo.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3.5 py-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">{neo.name}</span>
                        {neo.hazardous && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                            <AlertTriangle className="h-3 w-3" />
                            PHA
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                        Max Ø {Math.round(neo.diameterMetersMax)}m · {Math.round(neo.velocityKmh).toLocaleString()} km/h
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="block text-xs font-bold text-amber-300">
                        {formatDistance(neo.missDistanceKm, unit)}
                      </span>
                      <span className="text-[10px] text-slate-500">MISS DISTANCE</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/85 p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-violet-400" />
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                  Upcoming Orbital Launches
                </h2>
              </div>
              <button
                type="button"
                onClick={() => void refetchLaunches()}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-slate-300 hover:border-violet-400 hover:text-violet-300"
              >
                <RefreshCw className={`h-3 w-3 ${launchesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {launchesLoading ? (
              <div className="mt-4 space-y-2.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 animate-pulse rounded-xl bg-slate-900/90" />
                ))}
              </div>
            ) : launchesError ? (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 font-mono text-xs text-rose-300">
                {launchesError}
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {launches.map((launch) => (
                  <div
                    key={launch.id}
                    className="rounded-xl border border-slate-800/80 bg-slate-900/60 px-3.5 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-xs font-bold text-white">{launch.name}</p>
                      <span className="shrink-0 rounded-full border border-violet-500/40 bg-violet-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-300">
                        {launch.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-400">
                      <span>{launch.provider}</span>
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <Timer className="h-3 w-3 text-cyan-400" />
                        {launch.net ? new Date(launch.net).toLocaleString() : 'Schedule TBD'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
