import type { TrackerColor, Priority } from "./types"

export const MAX_LANDMARKS = 15

export const TRACKER_COLORS: Record<
  TrackerColor,
  { label: string; hex: string; hsl: string }
> = {
  red: { label: "Red", hex: "#ef4444", hsl: "0 84% 60%" },
  orange: { label: "Orange", hex: "#f97316", hsl: "25 95% 53%" },
  yellow: { label: "Yellow", hex: "#eab308", hsl: "48 96% 47%" },
  green: { label: "Green", hex: "#22c55e", hsl: "142 71% 45%" },
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: "Minimal",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Critical",
}

export const DEFAULT_LANDMARK_CONFIG = {
  enabled: true,
  trackerType: "simple" as const,
  color: "green" as const,
  priority: 3 as Priority,
  note: "",
}

/** SVG viewBox dimensions */
export const SVG_WIDTH = 400
export const SVG_HEIGHT = 700

/** Overlay rendering constants */
export const RING_RADIUS_MIN = 12
export const RING_RADIUS_MAX = 30
export const RING_STROKE_MIN = 2.5
export const RING_STROKE_MAX = 5.5
export const TRAIL_WIDTH_MIN = 2.5
export const TRAIL_WIDTH_MAX = 7
export const TRAIL_OPACITY_MIN = 0.3
export const TRAIL_OPACITY_MAX = 1.0

/** Trail time window in seconds (only show trail for this duration) */
export const TRAIL_WINDOW_SECONDS = 1.0
