# ORBIT // OPS — Deep-Space Logarithmic Radar & Live ISS/NASA Telemetry

[![CI](https://github.com/Nannidan/orbit-ops/actions/workflows/ci.yml/badge.svg)](https://github.com/Nannidan/orbit-ops/actions)
**Live Demo:** [https://orbit-ops-theta.vercel.app/](https://orbit-ops-theta.vercel.app/)

Real-time orbital and deep-space mission telemetry dashboard built with **React 19**, **TypeScript**, **SVG Data Visualization**, and **Tailwind CSS v4**.

---

## Architecture & Engineering Decisions

- **Logarithmic Deep-Space Radar (`src/components/SpaceVisuals.tsx`):** Maps spacecraft spanning 6 orders of magnitude—from Low Earth Orbit (ISS, Hubble) to the L2 Lagrange point (JWST) and interstellar space (Voyager 1 & 2, New Horizons)—onto a single interactive logarithmic SVG polar radar.
- **Live 5-Second ISS Polling & Dead-Reckoning (`src/hooks/useSpaceApis.ts`):** Streams real-time latitude, longitude, altitude, and velocity from `wheretheiss.at` alongside NASA Near-Earth Object (NEO) close-approach feeds and upcoming launch manifests.
- **Resilient Telemetry Fallbacks:** Graceful degradation and explicit status indicators ensure mission telemetry remains inspectable even during upstream API rate limits.

## Local Development

```bash
npm install
npm run dev
npm run lint
npm run build
```
