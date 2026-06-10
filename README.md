# Finta Trailmo — Motion Analysis Platform

**Biomechanical assessment for coaches and sports scientists. Select landmarks, analyze movement, review with video.**

> Sports ecosystem: [fintalab.com](https://fintalab.com)

---

## What Is Finta Trailmo?

Finta Trailmo is an interactive motion analysis platform that turns movement observation into structured assessment. Practitioners click anatomical landmarks on a skeleton viewer to build a movement profile, then switch to analysis mode to review per-landmark data — optionally alongside recorded video.

The platform targets coaches, physiotherapists, biomechanics specialists, and sports scientists who need a systematic, repeatable framework for evaluating athletic movement quality — without requiring specialist motion capture hardware.

---

## Core Features

### Skeleton Viewer

| Feature | Description |
|---------|-------------|
| **Anatomical landmarks** | Clickable body points — toggle on/off to define the movement scope |
| **Template mode** | Pre-defined landmark sets for common assessment types |
| **Template summary** | Live panel showing selected points and associated metrics |
| **Action bar** | Workflow controls: start analysis, reset, save template |

### Analysis Mode

When the skeleton selection is confirmed, the interface switches to a full analysis view:

- **AnalysisView** — detailed per-landmark motion data
- **VideoPreview** — optional playback panel if a session recording is loaded
- Side-by-side layout on desktop; stacked on mobile

### Responsive Layout

| Breakpoint | Config panel behavior |
|------------|----------------------|
| Desktop | Persistent sidebar — always visible alongside the viewer |
| Mobile | Drawer overlay — slide-in on demand |

### State Architecture

Three context providers maintain independent state streams:

| Context | Manages |
|---------|---------|
| Template context | Selected landmarks, template definitions, active template |
| Analysis context | Session data, analysis results, video preview state |
| i18n context | Language selection, string keys |

Toast notifications (dark-themed) provide real-time feedback on actions.

---

## Use Cases

- **Coaching assessments** — evaluate movement quality at training sessions
- **Return-to-play screening** — systematic landmark review after injury
- **Talent identification** — repeatable movement templates for consistent athlete profiling
- **Remote analysis** — review recorded sessions with video + landmark overlay

---

## Project Structure

```
.
├── app/
│   ├── page.tsx            # Root layout — skeleton/analysis view toggle, provider wiring
│   └── layout.tsx          # App shell, metadata
├── components/
│   ├── SkeletonViewer/     # Anatomical landmark display and interaction
│   ├── AnalysisView/       # Motion data visualization
│   ├── VideoPreview/       # Video playback component
│   ├── ActionBar/          # Workflow controls
│   └── ConfigPanel/        # Sidebar/drawer configuration panel
├── hooks/                  # Custom React hooks for state and interaction
├── lib/                    # Utilities — landmark definitions, analysis helpers
├── styles/                 # Global CSS
├── public/                 # Static assets — skeleton SVGs, icons
├── next.config.mjs         # Next.js configuration
├── tsconfig.json           # TypeScript configuration
└── postcss.config.mjs      # PostCSS / Tailwind configuration
```

---

## Tech Stack

TypeScript · Next.js · React · CSS

---

## Running Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

---

## Links

| Resource | URL |
|----------|-----|
| Sports platform | [fintalab.com](https://fintalab.com) |
| GitHub | [fintasportscorp-rgb/Finta_Trailmo](https://github.com/fintasportscorp-rgb/Finta_Trailmo) |
