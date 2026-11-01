# DRISHTI Mission Console

An ISRO-inspired mission control dashboard concept for AI-driven exoplanet candidate detection — built as an interactive, single-page web app that walks through a full transit-detection pipeline: raw photometry → signal processing → event detection → AI classification → model fitting → statistical inference → final verdict.

> All mission data (light curves, transit events, MCMC samples, classification scores) is synthetically generated in the browser for demo purposes. There is no backend, live telescope feed, or trained ML model behind it — it's a UI/UX simulation of what such a console could look like.

## Overview

The console frames a single demo target — **KIC 8462852**, observed over Kepler Quarter 14 — and walks it through a simulated pipeline called **DRISHTI-Net 2.4**, presented across nine tabs:

| Tab | What it shows |
| --- | --- |
| **Overview** | KPI strip (orbital period, transit depth, SNR, confidence, BLS power) + light curve and classification snapshot |
| **Raw Signal** | Unprocessed photometric flux with noise and stellar trends |
| **Processed** | Detrended signal with raw/processed toggle overlays and highlighted transit windows |
| **Events** | Detected transit events from a Box Least Squares search |
| **AI Classification** | Simulated 7-head CNN+Transformer ensemble output, with inference metadata (params, latency, calibration, drift) |
| **Model Fit** | Observed vs. predicted flux using a Mandel-Agol transit model + Gaussian Process detrending, with χ², RMS residual, and BIC |
| **MCMC** | Posterior sample scatter (period × depth) from a simulated 4-chain, 40k-sample run |
| **Verdict** | Final classification card (Strong Candidate / Review / False Positive) with a recommendation and risk summary |
| **Export** | Client-side export of results as CSV, a text mission report, and an SVG figure |

The footer ties it together with the project's full name: *Detection of Repeating Inter-Stellar Habitable Transit Indicators*.

## Tech Stack

- **[TanStack Start](https://tanstack.com/start)** (React 19) with file-based routing via **TanStack Router**
- **TypeScript** + **Vite**
- **Tailwind CSS v4**
- **shadcn/ui** components on top of **Radix UI**
- **Recharts** for the light curve, model fit, and MCMC visualizations
- **Sonner** for toast notifications
- Scaffolded and synced with **[Lovable](https://lovable.dev)**

## Project Structure

```
src/
├── routes/
│   ├── __root.tsx      # App shell, error/404 boundaries
│   └── index.tsx        # The entire mission console (single route, "/")
├── components/ui/        # shadcn/ui primitives
├── hooks/                 # Shared hooks (e.g. use-mobile)
├── lib/                   # Utils + error reporting
├── server.ts / start.ts   # TanStack Start server entry points
└── styles.css             # Global styles + theme tokens
```

## Getting Started

This project uses [Bun](https://bun.sh) (a `bun.lock` is committed), but npm/pnpm/yarn work too.

```bash
# Install dependencies
bun install
# or: npm install

# Start the dev server
bun dev
# or: npm run dev

# Build for production
bun run build
# or: npm run build

# Preview the production build
bun run preview
# or: npm run preview
```

## Scripts

| Command | Description |
| --- | --- |
| `dev` | Run the Vite dev server |
| `build` | Production build |
| `build:dev` | Development-mode build |
| `preview` | Preview the production build locally |
| `lint` | Run ESLint |
| `format` | Format the codebase with Prettier |


## Demo-data and verification note

DRISHTI is a browser-side mission-console simulation. Its light curves, transit events, model-fit values, posterior samples and classifier output are generated for the interactive demonstration; they are not a live Kepler/NASA feed and do not represent a trained or validated exoplanet-detection model. Keep this distinction visible in screenshots, presentations and future documentation.

For local development, use the committed Bun lockfile:

```bash
bun install
bun dev
bun run build
```

The package also defines `lint` and `format` scripts. Report the commands actually run when documenting a release.
