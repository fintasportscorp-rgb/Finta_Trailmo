# Trailmo — Motion Tracking Template

A Next.js web application for motion tracking and pose analysis using MediaPipe.

## Tech Stack

- **Framework**: Next.js 16 (with Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Motion/Pose**: @mediapipe/tasks-vision
- **Package Manager**: pnpm

## Project Structure

- `app/` — Next.js app router pages and layouts
- `components/` — React components
  - `components/trailmo/` — Core app components (video upload, skeleton viewer, analysis, etc.)
  - `components/ui/` — shadcn/ui base components
- `lib/` — Utility modules (pose engine, landmark definitions, stores, types, i18n)
- `hooks/` — Custom React hooks
- `public/` — Static assets
- `styles/` — Global CSS

## Development

The dev server runs on port 5000 with host `0.0.0.0` to support the Replit proxy.

```bash
pnpm dev       # Start dev server on 0.0.0.0:5000
pnpm build     # Production build
pnpm start     # Start production server
```

## Deployment

Configured for autoscale deployment:
- Build: `pnpm run build`
- Run: `pnpm run start`
