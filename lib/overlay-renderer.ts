import type { FrameLandmarks, LandmarkConfig, Priority, Template } from "./types"
import {
  TRACKER_COLORS,
  RING_RADIUS_MIN,
  RING_RADIUS_MAX,
  RING_STROKE_MIN,
  RING_STROKE_MAX,
  TRAIL_WIDTH_MIN,
  TRAIL_WIDTH_MAX,
  TRAIL_OPACITY_MIN,
  TRAIL_OPACITY_MAX,
  TRAIL_WINDOW_SECONDS,
} from "./constants"

/**
 * Interpolate a value between min and max based on priority (1-5).
 */
function lerp(min: number, max: number, priority: Priority): number {
  return min + ((priority - 1) / 4) * (max - min)
}

/**
 * Draw a tracking ring around a landmark position.
 */
export function drawRing(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  colorHex: string,
  priority: Priority
) {
  const radius = lerp(RING_RADIUS_MIN, RING_RADIUS_MAX, priority)
  const strokeWidth = lerp(RING_STROKE_MIN, RING_STROKE_MAX, priority)

  // Outer glow
  ctx.beginPath()
  ctx.arc(x, y, radius + 2, 0, Math.PI * 2)
  ctx.strokeStyle = colorHex
  ctx.lineWidth = strokeWidth + 2
  ctx.globalAlpha = 0.25
  ctx.stroke()
  ctx.globalAlpha = 1.0

  // Main ring
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.strokeStyle = colorHex
  ctx.lineWidth = strokeWidth
  ctx.stroke()

  // Center dot
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, Math.PI * 2)
  ctx.fillStyle = "#ffffff"
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, y, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = colorHex
  ctx.fill()
}

/**
 * Draw the trail path from past positions leading up to the current frame.
 * Uses smooth quadratic bezier curves and fading opacity.
 * Only draws positions within the TRAIL_WINDOW_SECONDS time window.
 */
export function drawTrail(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  positions: Array<{ x: number; y: number } | null>,
  colorHex: string,
  priority: Priority,
  currentFrame: number,
  fps: number = 15
) {
  if (currentFrame < 1) return

  const lineWidth = lerp(TRAIL_WIDTH_MIN, TRAIL_WIDTH_MAX, priority)

  // Limit to trail window
  const windowFrames = Math.ceil(fps * TRAIL_WINDOW_SECONDS)
  const startFrame = Math.max(0, currentFrame - windowFrames)

  // Collect valid positions within the window
  const validPositions: Array<{ x: number; y: number; index: number }> = []
  for (let i = startFrame; i <= currentFrame; i++) {
    const pos = positions[i]
    if (pos) validPositions.push({ ...pos, index: i })
  }

  if (validPositions.length < 2) return

  // Draw glow layer (wider, low opacity)
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.lineWidth = lineWidth + 4
  ctx.strokeStyle = colorHex
  ctx.globalAlpha = 0.15

  ctx.beginPath()
  ctx.moveTo(validPositions[0].x, validPositions[0].y)
  for (let i = 1; i < validPositions.length; i++) {
    const prev = validPositions[i - 1]
    const curr = validPositions[i]
    const mx = (prev.x + curr.x) / 2
    const my = (prev.y + curr.y) / 2
    ctx.quadraticCurveTo(prev.x, prev.y, mx, my)
  }
  const last = validPositions[validPositions.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.stroke()

  // Draw main trail with per-segment fading opacity
  ctx.lineWidth = lineWidth
  for (let i = 1; i < validPositions.length; i++) {
    const prev = validPositions[i - 1]
    const curr = validPositions[i]

    const t = validPositions.length > 1 ? i / (validPositions.length - 1) : 1
    const opacity = TRAIL_OPACITY_MIN + t * (TRAIL_OPACITY_MAX - TRAIL_OPACITY_MIN)

    const mx = (prev.x + curr.x) / 2
    const my = (prev.y + curr.y) / 2

    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.quadraticCurveTo(prev.x, prev.y, mx, my)
    ctx.lineTo(curr.x, curr.y)
    ctx.strokeStyle = colorHex
    ctx.globalAlpha = opacity
    ctx.stroke()
  }

  ctx.globalAlpha = 1.0
}

/**
 * Draw all overlay elements for a single frame onto a canvas.
 * frames: per-frame landmark arrays from VideoAnalysis.
 * template: the user's template configuration.
 */
export function drawOverlayFrame(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  frameIndex: number,
  frames: FrameLandmarks[],
  template: Template,
  videoWidth: number,
  videoHeight: number,
  fps: number = 15
) {
  const currentFrameLandmarks = frames[frameIndex]
  if (!currentFrameLandmarks || currentFrameLandmarks.length === 0) return

  // Iterate through all enabled landmarks in the template
  for (const [idStr, config] of Object.entries(template.landmarks)) {
    if (!config.enabled) continue

    const landmarkId = Number(idStr)
    const lm = currentFrameLandmarks[landmarkId]
    if (!lm || lm.visibility < 0.3) continue

    const x = lm.x * videoWidth
    const y = lm.y * videoHeight
    const colorHex = TRACKER_COLORS[config.color].hex

    // Draw trail first (behind ring)
    if (config.trackerType === "trail") {
      const positions: Array<{ x: number; y: number } | null> = []
      for (let f = 0; f <= frameIndex; f++) {
        const frameLandmarks = frames[f]
        if (frameLandmarks && frameLandmarks[landmarkId] && frameLandmarks[landmarkId].visibility >= 0.3) {
          positions.push({
            x: frameLandmarks[landmarkId].x * videoWidth,
            y: frameLandmarks[landmarkId].y * videoHeight,
          })
        } else {
          positions.push(null)
        }
      }
      drawTrail(ctx, positions, colorHex, config.priority, frameIndex, fps)
    }

    // Draw ring on top
    drawRing(ctx, x, y, colorHex, config.priority)
  }
}

/**
 * Draw overlay for the sequenced video (black background) for a single landmark.
 * Shows the ring at the current frame position + full trail + text overlay.
 */
export function drawSequencedFrame(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  frameIndex: number,
  frames: FrameLandmarks[],
  landmarkId: number,
  config: LandmarkConfig,
  canvasWidth: number,
  canvasHeight: number,
  landmarkName: string,
  fps: number = 15
) {
  // Black background
  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  const colorHex = TRACKER_COLORS[config.color].hex

  const currentFrameLandmarks = frames[frameIndex]
  const lm = currentFrameLandmarks?.[landmarkId]

  // Collect all positions for the trail
  const positions: Array<{ x: number; y: number } | null> = []
  for (let f = 0; f <= frameIndex; f++) {
    const frameLandmarks = frames[f]
    if (frameLandmarks && frameLandmarks[landmarkId] && frameLandmarks[landmarkId].visibility >= 0.3) {
      positions.push({
        x: frameLandmarks[landmarkId].x * canvasWidth,
        y: frameLandmarks[landmarkId].y * canvasHeight,
      })
    } else {
      positions.push(null)
    }
  }

  // Draw trail
  if (config.trackerType === "trail") {
    drawTrail(ctx, positions, colorHex, config.priority, frameIndex, fps)
  }

  // Draw ring at current position
  if (lm && lm.visibility >= 0.3) {
    const x = lm.x * canvasWidth
    const y = lm.y * canvasHeight
    drawRing(ctx, x, y, colorHex, config.priority)
  }

  // Text overlay at top
  ctx.globalAlpha = 1.0
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 24px sans-serif"
  ctx.textAlign = "left"
  ctx.fillText(landmarkName, 20, 40)

  ctx.font = "16px sans-serif"
  ctx.fillStyle = colorHex
  ctx.fillText(`P${config.priority}`, 20, 65)

  if (config.note) {
    ctx.fillStyle = "rgba(255,255,255,0.8)"
    ctx.font = "14px sans-serif"
    // Word-wrap the note
    const words = config.note.split(" ")
    let line = ""
    let y = 90
    for (const word of words) {
      const testLine = line + (line ? " " : "") + word
      const metrics = ctx.measureText(testLine)
      if (metrics.width > canvasWidth - 40) {
        ctx.fillText(line, 20, y)
        line = word
        y += 20
      } else {
        line = testLine
      }
    }
    if (line) ctx.fillText(line, 20, y)
  }
}
