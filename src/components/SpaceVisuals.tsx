import { ONE_LIGHT_DAY_KM } from '../data/spacecraft'
import type { IssTelemetry } from '../hooks/useSpaceApis'

interface RadarObject {
  id: string
  name: string
  km: number
  accent: string
}

interface DeepSpaceRadarProps {
  objects: RadarObject[]
  selectedId: string
  onSelect: (id: string) => void
}

const MIN_LOG = Math.log10(350)
const MAX_LOG = Math.log10(38_000_000_000)

function kmToPercent(km: number): number {
  const clamped = Math.max(350, Math.min(38_000_000_000, km))
  const ratio = (Math.log10(clamped) - MIN_LOG) / (MAX_LOG - MIN_LOG)
  return 6 + ratio * 88
}

export function DeepSpaceRadar({ objects, selectedId, onSelect }: DeepSpaceRadarProps) {
  const lightDayX = kmToPercent(ONE_LIGHT_DAY_KM)

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
            Logarithmic Deep-Space Telemetry Strip
          </p>
          <p className="text-xs text-slate-400">
            Click any spacecraft beacon from LEO (420 km) out past 1 Light-Day (25.9B km)
          </p>
        </div>
        <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
          LOG10 SCALE // LIVE
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox="0 0 800 138" className="h-36 w-full min-w-[540px]">
          <line x1="40" y1="74" x2="760" y2="74" stroke="rgba(148,163,184,0.28)" strokeWidth="2" />

          {[
            { label: 'LEO', km: 420 },
            { label: 'L2 (1.5M km)', km: 1_500_000 },
            { label: '1 AU', km: 149_597_871 },
            { label: 'Kuiper', km: 9_980_000_000 },
          ].map((tick) => {
            const x = (kmToPercent(tick.km) / 100) * 800
            return (
              <g key={tick.label}>
                <line x1={x} y1="68" x2={x} y2="80" stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
                <text
                  x={x}
                  y="118"
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                >
                  {tick.label}
                </text>
              </g>
            )
          })}

          <g>
            <line
              x1={(lightDayX / 100) * 800}
              y1="22"
              x2={(lightDayX / 100) * 800}
              y2="102"
              stroke="#22d3ee"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x={(lightDayX / 100) * 800}
              y="15"
              textAnchor="middle"
              fill="#22d3ee"
              fontSize="10"
              fontWeight="700"
              fontFamily="ui-monospace, monospace"
            >
              1 LIGHT-DAY
            </text>
          </g>

          <circle cx="48" cy="74" r="9" fill="#0ea5e9" stroke="#bae6fd" strokeWidth="2" />
          <text
            x="48"
            y="100"
            textAnchor="middle"
            fill="#bae6fd"
            fontSize="10"
            fontFamily="ui-monospace, monospace"
          >
            EARTH
          </text>

          {objects.map((obj, idx) => {
            const x = (kmToPercent(obj.km) / 100) * 800
            const selected = obj.id === selectedId
            const labelY = idx % 2 === 0 ? 46 : 96
            return (
              <g
                key={obj.id}
                onClick={() => onSelect(obj.id)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
              >
                {selected && (
                  <circle cx={x} cy="74" r="13" fill="none" stroke={obj.accent} strokeWidth="2" opacity="0.65" />
                )}
                <circle
                  cx={x}
                  cy="74"
                  r={selected ? 7 : 5}
                  fill={obj.accent}
                  stroke="#040711"
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={labelY}
                  textAnchor="middle"
                  fill={selected ? '#ffffff' : '#cbd5e1'}
                  fontSize="10"
                  fontWeight={selected ? '700' : '500'}
                  fontFamily="ui-monospace, monospace"
                >
                  {obj.name.replace('James Webb Space Telescope', 'JWST').replace('Hubble Space Telescope', 'Hubble').replace('Parker Solar Probe', 'Parker')}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

interface IssGroundTrackProps {
  iss: IssTelemetry | null
  trail: Array<[number, number]>
}

export function IssGroundTrack({ iss, trail }: IssGroundTrackProps) {
  const project = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * 360,
    ((90 - lat) / 180) * 180,
  ]

  const [issX, issY] = iss ? project(iss.longitude, iss.latitude) : [180, 90]

  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-[#050b14]">
      <svg viewBox="0 0 360 180" className="h-44 w-full">
        {[-120, -60, 0, 60, 120].map((lon) => {
          const [x] = project(lon, 0)
          return (
            <line
              key={lon}
              x1={x}
              y1="0"
              x2={x}
              y2="180"
              stroke="rgba(52,211,153,0.12)"
              strokeWidth="0.7"
            />
          )
        })}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const [, y] = project(0, lat)
          return (
            <line
              key={lat}
              x1="0"
              y1={y}
              x2="360"
              y2={y}
              stroke={lat === 0 ? 'rgba(52,211,153,0.28)' : 'rgba(52,211,153,0.12)'}
              strokeWidth={lat === 0 ? '1' : '0.7'}
            />
          )
        })}

        {trail.map(([lon, lat], idx) => {
          const [x, y] = project(lon, lat)
          const opacity = (idx + 1) / trail.length
          return <circle key={`${lon}-${lat}-${idx}`} cx={x} cy={y} r="1.8" fill="#34d399" opacity={opacity * 0.7} />
        })}

        {iss && (
          <g>
            <circle cx={issX} cy={issY} r="11" fill="rgba(52,211,153,0.18)" stroke="#34d399" strokeWidth="1" />
            <circle cx={issX} cy={issY} r="4" fill="#34d399" />
            <line x1={issX - 16} y1={issY} x2={issX + 16} y2={issY} stroke="#34d399" strokeWidth="0.7" opacity="0.6" />
            <line x1={issX} y1={issY - 16} x2={issX} y2={issY + 16} stroke="#34d399" strokeWidth="0.7" opacity="0.6" />
          </g>
        )}
      </svg>

      <div className="pointer-events-none absolute right-2 bottom-1.5 rounded bg-slate-950/80 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
        {iss ? `LAT ${iss.latitude.toFixed(2)}° // LON ${iss.longitude.toFixed(2)}°` : 'ACQUIRING SIGNAL...'}
      </div>
    </div>
  )
}
