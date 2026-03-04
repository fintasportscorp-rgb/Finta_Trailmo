import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4Target } from "mp4-muxer"
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmTarget } from "webm-muxer"
import { drawOverlayFrame } from "./overlay-renderer"
import { LANDMARKS, getLocalizedName } from "./landmarks"
import { TRACKER_COLORS } from "./constants"
import type { VideoAnalysis, Template } from "./types"
import type { Locale } from "./i18n/translations"

const WATERMARK = "trailmo from fintalab.com"

/** Width of the right-side annotation panel in the exported video */
const PANEL_WIDTH = 360

/**
 * Check if WebCodecs API is available in the browser.
 */
export function isWebCodecsSupported(): boolean {
  return (
    typeof VideoEncoder !== "undefined" &&
    typeof VideoFrame !== "undefined" &&
    typeof EncodedVideoChunk !== "undefined"
  )
}

interface ExportProgress {
  onProgress: (pct: number) => void
  signal?: AbortSignal
}

/** Yield to the main thread to prevent UI freeze */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Collect landmark annotation data from a template.
 */
function getAnnotatedLandmarks(template: Template, locale: Locale = "en") {
  return Object.entries(template.landmarks)
    .filter(([, c]) => c.enabled && c.note)
    .map(([id, config]) => ({
      id: Number(id),
      config,
      name: (LANDMARKS[Number(id)] ? getLocalizedName(LANDMARKS[Number(id)], locale) : null) ?? `Landmark ${id}`,
    }))
    .sort((a, b) => b.config.priority - a.config.priority)
}

/**
 * Draw a right-side annotation panel on the canvas.
 * The panel occupies the area from panelX to panelX + panelW, full height.
 */
function drawRightPanel(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  panelX: number,
  panelW: number,
  panelH: number,
  template: Template,
  globalComment?: string,
  locale: Locale = "en"
) {
  const enabledLandmarks = getAnnotatedLandmarks(template, locale)
  const hasAnnotations = enabledLandmarks.length > 0 || globalComment
  if (!hasAnnotations) {
    // Just draw dark background + watermark
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)"
    ctx.fillRect(panelX, 0, panelW, panelH)
    drawWatermark(ctx, panelX, panelW, panelH)
    return
  }

  // Dark panel background
  ctx.fillStyle = "rgba(0, 0, 0, 0.9)"
  ctx.fillRect(panelX, 0, panelW, panelH)

  // Subtle left border
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
  ctx.fillRect(panelX, 0, 1, panelH)

  const pad = 20
  let y = 28

  // Global comment
  if (globalComment) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
    ctx.font = "bold 12px sans-serif"
    ctx.textAlign = "left"
    ctx.fillText("OVERALL FEEDBACK", panelX + pad, y)
    y += 24

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
    ctx.font = "bold 16px sans-serif"
    const words = globalComment.split(" ")
    let line = ""
    for (const word of words) {
      const testLine = line + (line ? " " : "") + word
      if (ctx.measureText(testLine).width > panelW - pad * 2) {
        ctx.fillText(line, panelX + pad, y)
        line = word
        y += 22
      } else {
        line = testLine
      }
    }
    if (line) {
      ctx.fillText(line, panelX + pad, y)
      y += 22
    }
    y += 12
  }

  // Per-landmark annotations
  for (const lm of enabledLandmarks) {
    const colorHex = TRACKER_COLORS[lm.config.color].hex

    // Colored dot
    ctx.beginPath()
    ctx.arc(panelX + pad + 6, y - 5, 5, 0, Math.PI * 2)
    ctx.fillStyle = colorHex
    ctx.fill()

    // Landmark name
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 16px sans-serif"
    ctx.textAlign = "left"
    ctx.fillText(lm.name, panelX + pad + 18, y)

    const nameWidth = ctx.measureText(lm.name).width
    ctx.fillStyle = colorHex
    ctx.font = "bold 13px sans-serif"
    ctx.fillText(`P${lm.config.priority}`, panelX + pad + 18 + nameWidth + 10, y)

    y += 22

    // Note text
    if (lm.config.note) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.font = "14px sans-serif"
      const maxWidth = panelW - pad * 2 - 18
      const words = lm.config.note.split(" ")
      let line = ""
      for (const word of words) {
        const testLine = line + (line ? " " : "") + word
        if (ctx.measureText(testLine).width > maxWidth) {
          ctx.fillText(line, panelX + pad + 18, y)
          line = word
          y += 20
        } else {
          line = testLine
        }
      }
      if (line) {
        ctx.fillText(line, panelX + pad + 18, y)
        y += 20
      }
    }

    y += 10
  }

  drawWatermark(ctx, panelX, panelW, panelH)
}

/** Draw watermark at the bottom of a panel area */
function drawWatermark(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  panelX: number,
  panelW: number,
  panelH: number
) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)"
  ctx.font = "11px sans-serif"
  ctx.textAlign = "center"
  ctx.fillText(WATERMARK, panelX + panelW / 2, panelH - 12)
}

/**
 * Export annotated video with overlay + right-side annotation panel.
 * The exported video is wider than the original (video + panel).
 * Yields to main thread periodically to prevent UI freeze.
 */
export async function exportAnnotatedVideo(
  analysis: VideoAnalysis,
  template: Template,
  { onProgress, signal }: ExportProgress,
  globalComment?: string,
  locale: Locale = "en"
): Promise<Blob> {
  try {
    return await exportWithWebCodecs(analysis, template, { onProgress, signal }, globalComment, locale)
  } catch (e) {
    console.warn("WebCodecs export failed, falling back to MediaRecorder:", e)
    return await exportWithMediaRecorder(analysis, template, { onProgress, signal }, globalComment, locale)
  }
}

async function exportWithWebCodecs(
  analysis: VideoAnalysis,
  template: Template,
  { onProgress, signal }: ExportProgress,
  globalComment?: string,
  locale: Locale = "en"
): Promise<Blob> {
  const { width, height, fps, frames, blobUrl } = analysis
  const totalFrames = frames.length

  const hasAnnotations = getAnnotatedLandmarks(template, locale).length > 0 || globalComment
  const totalWidth = hasAnnotations ? width + PANEL_WIDTH : width

  const video = document.createElement("video")
  video.src = blobUrl
  video.muted = true
  video.playsInline = true
  video.crossOrigin = "anonymous"

  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve()
    video.onerror = () => reject(new Error("Failed to load video"))
  })

  const canvas = new OffscreenCanvas(totalWidth, height)
  const ctx = canvas.getContext("2d")!

  const codecCandidates = [
    { codec: "avc1.42001f", container: "mp4" as const },
    { codec: "avc1.4d001f", container: "mp4" as const },
    { codec: "avc1.640028", container: "mp4" as const },
    { codec: "vp8", container: "webm" as const },
    { codec: "vp09.00.10.08", container: "webm" as const },
  ]

  const bitrate = Math.min(totalWidth * height * 8, 10_000_000)
  let selectedCodec: string | null = null
  let selectedContainer: "mp4" | "webm" | null = null

  for (const { codec, container } of codecCandidates) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec,
        width: totalWidth,
        height,
        bitrate,
        framerate: fps,
      })
      if (support.supported) {
        selectedCodec = codec
        selectedContainer = container
        break
      }
    } catch {
      // Try next codec
    }
  }

  if (!selectedCodec || !selectedContainer) {
    throw new Error("No supported video codec found")
  }

  let muxer: { addVideoChunk: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => void; finalize: () => void; target: Mp4Target | WebmTarget }

  if (selectedContainer === "mp4") {
    const mp4 = new Mp4Muxer({
      target: new Mp4Target(),
      video: { codec: "avc", width: totalWidth, height },
      fastStart: "in-memory",
      firstTimestampBehavior: "offset",
    })
    muxer = mp4
  } else {
    const webm = new WebmMuxer({
      target: new WebmTarget(),
      video: { codec: selectedCodec.startsWith("vp09") ? "V_VP9" : "V_VP8", width: totalWidth, height },
      firstTimestampBehavior: "offset",
    })
    muxer = webm
  }

  let encoderError: Error | null = null

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      try {
        if (meta?.decoderConfig) {
          const dc = meta.decoderConfig
          if (!dc.colorSpace || typeof dc.colorSpace !== "object") {
            (dc as Record<string, unknown>).colorSpace = {
              primaries: "bt709",
              transfer: "bt709",
              matrix: "bt709",
              fullRange: false,
            }
          }
          muxer.addVideoChunk(chunk, meta)
        } else {
          muxer.addVideoChunk(chunk)
        }
      } catch (err) {
        encoderError = err instanceof Error ? err : new Error(String(err))
      }
    },
    error: (e) => {
      encoderError = e instanceof Error ? e : new Error(String(e))
    },
  })

  encoder.configure({
    codec: selectedCodec,
    width: totalWidth,
    height,
    bitrate,
    framerate: fps,
  })

  for (let i = 0; i < totalFrames; i++) {
    if (signal?.aborted) {
      encoder.close()
      throw new Error("Export cancelled")
    }
    if (encoderError) {
      encoder.close()
      throw encoderError
    }

    const frameTime = i / fps
    video.currentTime = frameTime

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Seek timeout")), 5000)
      video.onseeked = () => {
        clearTimeout(timeout)
        resolve()
      }
    })

    ctx.drawImage(video, 0, 0, width, height)
    drawOverlayFrame(ctx, i, frames, template, width, height, fps)

    if (hasAnnotations) {
      drawRightPanel(ctx, width, PANEL_WIDTH, height, template, globalComment, locale)
    }

    const videoFrame = new VideoFrame(canvas, {
      timestamp: Math.round(frameTime * 1_000_000),
    })

    const keyFrame = i % (fps * 2) === 0
    encoder.encode(videoFrame, { keyFrame })
    videoFrame.close()

    const pct = Math.round(((i + 1) / totalFrames) * 100)
    onProgress(pct)

    if (i % 5 === 0) await yieldToMain()
  }

  await encoder.flush()
  encoder.close()

  if (encoderError) throw encoderError

  muxer.finalize()

  const { buffer } = muxer.target as Mp4Target | WebmTarget
  const mimeType = selectedContainer === "mp4" ? "video/mp4" : "video/webm"
  return new Blob([buffer], { type: mimeType })
}

async function exportWithMediaRecorder(
  analysis: VideoAnalysis,
  template: Template,
  { onProgress, signal }: ExportProgress,
  globalComment?: string,
  locale: Locale = "en"
): Promise<Blob> {
  const { width, height, fps, frames, blobUrl, duration } = analysis

  const hasAnnotations = getAnnotatedLandmarks(template, locale).length > 0 || globalComment
  const totalWidth = hasAnnotations ? width + PANEL_WIDTH : width

  const video = document.createElement("video")
  video.src = blobUrl
  video.muted = true
  video.playsInline = true
  video.crossOrigin = "anonymous"

  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve()
    video.onerror = () => reject(new Error("Failed to load video"))
  })

  const canvas = document.createElement("canvas")
  canvas.width = totalWidth
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  const stream = canvas.captureStream(fps)

  const mimeTypes = [
    "video/mp4",
    "video/mp4;codecs=avc1",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ]
  let selectedMime = ""
  for (const mime of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mime)) {
      selectedMime = mime
      break
    }
  }
  if (!selectedMime) {
    throw new Error("No supported video format found for recording")
  }

  const chunks: Blob[] = []
  const recorder = new MediaRecorder(stream, {
    mimeType: selectedMime,
    videoBitsPerSecond: Math.min(totalWidth * height * 4, 5_000_000),
  })

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const recorderDone = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })

  recorder.start(100)

  return new Promise<Blob>((resolve, reject) => {
    let aborted = false

    const onAbort = () => {
      aborted = true
      video.pause()
      recorder.stop()
      stream.getTracks().forEach((t) => t.stop())
      reject(new Error("Export cancelled"))
    }

    signal?.addEventListener("abort", onAbort, { once: true })

    const drawFrame = () => {
      if (aborted) return

      const currentTime = video.currentTime
      const pct = Math.round((currentTime / duration) * 100)
      onProgress(Math.min(pct, 99))

      ctx.drawImage(video, 0, 0, width, height)

      const frameIndex = Math.min(
        Math.floor(currentTime * fps),
        frames.length - 1
      )
      if (frameIndex >= 0) {
        drawOverlayFrame(ctx, frameIndex, frames, template, width, height, fps)
      }

      if (hasAnnotations) {
        drawRightPanel(ctx, width, PANEL_WIDTH, height, template, globalComment, locale)
      }

      if (!video.ended && !video.paused) {
        requestAnimationFrame(drawFrame)
      }
    }

    video.onplay = () => {
      drawFrame()
    }

    video.onended = async () => {
      onProgress(100)
      recorder.stop()
      stream.getTracks().forEach((t) => t.stop())
      signal?.removeEventListener("abort", onAbort)

      await recorderDone

      const outputMime = selectedMime.split(";")[0] || "video/webm"
      resolve(new Blob(chunks, { type: outputMime }))
    }

    video.currentTime = 0
    video.play().catch(reject)
  })
}

/**
 * Generate a PNG summary sheet with skeleton silhouette + all annotations.
 */
export async function generateSummaryPNGAsync(
  analysis: VideoAnalysis,
  template: Template,
  globalComment?: string,
  locale: Locale = "en"
): Promise<Blob> {
  const w = 1200
  const h = 900
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext("2d")!

  // Dark background
  ctx.fillStyle = "#0d0d14"
  ctx.fillRect(0, 0, w, h)

  // Title
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 22px sans-serif"
  ctx.textAlign = "left"
  ctx.fillText("Trailmo - Motion Analysis Summary", 32, 40)

  ctx.fillStyle = "rgba(255,255,255,0.5)"
  ctx.font = "13px sans-serif"
  ctx.fillText(analysis.fileName, 32, 62)
  ctx.fillText(
    `${analysis.width}x${analysis.height} | ${analysis.duration.toFixed(1)}s | ${analysis.fps} fps | ${analysis.frames.length} frames`,
    32,
    80
  )

  // --- Draw skeleton with trails in the left area ---
  const skeletonArea = { x: 32, y: 100, w: 500, h: 700 }

  // Draw bones
  ctx.strokeStyle = "rgba(255,255,255,0.12)"
  ctx.lineWidth = 1.5
  for (const lm of LANDMARKS) {
    for (const connId of lm.connections) {
      const other = LANDMARKS[connId]
      if (!other) continue
      const x1 = skeletonArea.x + (lm.x / 400) * skeletonArea.w
      const y1 = skeletonArea.y + (lm.y / 700) * skeletonArea.h
      const x2 = skeletonArea.x + (other.x / 400) * skeletonArea.w
      const y2 = skeletonArea.y + (other.y / 700) * skeletonArea.h
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }

  const lastFrame = analysis.frames.length - 1

  const enabledLandmarks = Object.entries(template.landmarks)
    .filter(([, c]) => c.enabled)
    .map(([id, config]) => ({
      id: Number(id),
      config,
      name: (LANDMARKS[Number(id)] ? getLocalizedName(LANDMARKS[Number(id)], locale) : null) ?? `Landmark ${id}`,
    }))
    .sort((a, b) => b.config.priority - a.config.priority)

  // Draw trail paths
  for (const lm of enabledLandmarks) {
    if (lm.config.trackerType !== "trail") continue
    const colorHex = TRACKER_COLORS[lm.config.color].hex
    ctx.strokeStyle = colorHex
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    ctx.beginPath()
    let started = false
    for (let f = Math.max(0, lastFrame - 15); f <= lastFrame; f++) {
      const fd = analysis.frames[f]
      if (!fd || !fd[lm.id] || fd[lm.id].visibility < 0.3) continue
      const x = skeletonArea.x + fd[lm.id].x * skeletonArea.w
      const y = skeletonArea.y + fd[lm.id].y * skeletonArea.h
      if (!started) {
        ctx.moveTo(x, y)
        started = true
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
    ctx.globalAlpha = 1.0
  }

  // Draw landmark dots
  for (const lm of enabledLandmarks) {
    const colorHex = TRACKER_COLORS[lm.config.color].hex
    const svgDef = LANDMARKS[lm.id]
    if (!svgDef) continue
    const x = skeletonArea.x + (svgDef.x / 400) * skeletonArea.w
    const y = skeletonArea.y + (svgDef.y / 700) * skeletonArea.h

    ctx.beginPath()
    ctx.arc(x, y, 10, 0, Math.PI * 2)
    ctx.strokeStyle = colorHex
    ctx.lineWidth = 2.5
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = colorHex
    ctx.fill()
  }

  // --- Right side: annotations ---
  const annotArea = { x: 560, y: 100, w: 608 }
  let ay = annotArea.y

  if (globalComment) {
    ctx.fillStyle = "rgba(255,255,255,0.15)"
    const gcHeight = Math.ceil(globalComment.length / 55) * 20 + 24
    roundRect(ctx, annotArea.x, ay, annotArea.w, gcHeight, 8)
    ctx.fill()

    ctx.fillStyle = "rgba(255,255,255,0.5)"
    ctx.font = "bold 11px sans-serif"
    ctx.textAlign = "left"
    ctx.fillText("OVERALL FEEDBACK", annotArea.x + 14, ay + 18)

    ctx.fillStyle = "#ffffff"
    ctx.font = "13px sans-serif"
    const words = globalComment.split(" ")
    let line = ""
    let ly = ay + 38
    for (const word of words) {
      const test = line + (line ? " " : "") + word
      if (ctx.measureText(test).width > annotArea.w - 28) {
        ctx.fillText(line, annotArea.x + 14, ly)
        line = word
        ly += 20
      } else {
        line = test
      }
    }
    if (line) ctx.fillText(line, annotArea.x + 14, ly)
    ay += gcHeight + 16
  }

  for (const lm of enabledLandmarks) {
    const colorHex = TRACKER_COLORS[lm.config.color].hex
    const cardH = lm.config.note ? 64 : 40

    ctx.fillStyle = "rgba(255,255,255,0.08)"
    roundRect(ctx, annotArea.x, ay, annotArea.w, cardH, 6)
    ctx.fill()

    ctx.fillStyle = colorHex
    roundRect(ctx, annotArea.x, ay, 4, cardH, 2)
    ctx.fill()

    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 14px sans-serif"
    ctx.textAlign = "left"
    ctx.fillText(lm.name, annotArea.x + 16, ay + 20)

    const nw = ctx.measureText(lm.name).width
    ctx.fillStyle = colorHex
    ctx.font = "11px sans-serif"
    ctx.fillText(`P${lm.config.priority}`, annotArea.x + 16 + nw + 10, ay + 20)

    if (lm.config.note) {
      ctx.fillStyle = "rgba(255,255,255,0.7)"
      ctx.font = "12px sans-serif"
      let noteText = lm.config.note
      if (ctx.measureText(noteText).width > annotArea.w - 32) {
        while (ctx.measureText(noteText + "...").width > annotArea.w - 32 && noteText.length > 0) {
          noteText = noteText.slice(0, -1)
        }
        noteText += "..."
      }
      ctx.fillText(noteText, annotArea.x + 16, ay + 44)
    }

    ay += cardH + 8
  }

  // Watermark
  ctx.fillStyle = "rgba(255,255,255,0.25)"
  ctx.font = "12px sans-serif"
  ctx.textAlign = "right"
  ctx.fillText(WATERMARK, w - 20, h - 16)

  return await canvas.convertToBlob({ type: "image/png" })
}

/** Helper to draw a rounded rectangle path */
function roundRect(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
