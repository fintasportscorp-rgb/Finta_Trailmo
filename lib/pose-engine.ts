/**
 * MediaPipe Pose Detection Engine (browser-only via WASM)
 *
 * Uses @mediapipe/tasks-vision PoseLandmarker in VIDEO mode.
 * The WASM + model files are loaded from the JSDelivr CDN.
 */

import type { FrameLandmarks, PoseLandmark, VideoAnalysis } from "./types"

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
const MODEL_CDN =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"

let PoseLandmarkerClass: any = null
let FilesetResolverClass: any = null
let landmarkerInstance: any = null

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function adaptiveFps(durationSeconds: number): number {
  if (durationSeconds <= 10) return 15
  if (durationSeconds <= 30) return 10
  if (durationSeconds <= 60) return 8
  return 5
}

/**
 * Initialize the MediaPipe PoseLandmarker (idempotent - only loads once)
 */
export async function initPoseLandmarker(
  onProgress?: (msg: string) => void
): Promise<void> {
  if (landmarkerInstance) return

  onProgress?.("Loading MediaPipe WASM runtime...")

  const vision = await import("@mediapipe/tasks-vision")
  PoseLandmarkerClass = vision.PoseLandmarker
  FilesetResolverClass = vision.FilesetResolver

  onProgress?.("Downloading pose detection model...")

  const filesetResolver = await FilesetResolverClass.forVisionTasks(WASM_CDN)

  try {
    landmarkerInstance = await PoseLandmarkerClass.createFromOptions(
      filesetResolver,
      {
        baseOptions: {
          modelAssetPath: MODEL_CDN,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      }
    )
  } catch (gpuErr) {
    console.warn("GPU delegate failed, falling back to CPU:", gpuErr)
    landmarkerInstance = await PoseLandmarkerClass.createFromOptions(
      filesetResolver,
      {
        baseOptions: {
          modelAssetPath: MODEL_CDN,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      }
    )
  }

  onProgress?.("Pose model ready")
}

/**
 * Get video metadata (dimensions, duration, fps) by loading it into a hidden video element
 */
function getVideoMeta(
  blobUrl: string
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.muted = true
    video.preload = "metadata"
    video.playsInline = true
    video.crossOrigin = "anonymous"

    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      })
      video.remove()
    }
    video.onerror = () => {
      reject(new Error("Failed to load video metadata"))
      video.remove()
    }
    video.src = blobUrl
  })
}

/**
 * Process a single video through MediaPipe PoseLandmarker frame-by-frame.
 *
 * Strategy: use a hidden <video> element with seek-based processing
 * to extract frames, then run PoseLandmarker.detectForVideo().
 * Yields to main thread periodically to prevent UI freeze/crash.
 */
export async function processVideo(
  videoId: string,
  fileName: string,
  blobUrl: string,
  onProgress?: (progress: number, frameIdx: number, totalFrames: number) => void,
  abortSignal?: AbortSignal
): Promise<VideoAnalysis> {
  if (!landmarkerInstance) {
    throw new Error("PoseLandmarker not initialized. Call initPoseLandmarker() first.")
  }

  const meta = await getVideoMeta(blobUrl)
  const targetFps = adaptiveFps(meta.duration)
  const totalFrames = Math.ceil(meta.duration * targetFps)
  const frameInterval = 1 / targetFps

  const frames: FrameLandmarks[] = []
  let totalVisibility = 0
  let visibilityCount = 0
  let consecutiveErrors = 0
  const MAX_CONSECUTIVE_ERRORS = 15

  const video = document.createElement("video")
  video.muted = true
  video.playsInline = true
  video.preload = "auto"
  video.crossOrigin = "anonymous"
  video.src = blobUrl

  await new Promise<void>((resolve, reject) => {
    video.oncanplaythrough = () => resolve()
    video.onerror = () => reject(new Error("Failed to load video"))
    video.load()
  })

  for (let i = 0; i < totalFrames; i++) {
    if (abortSignal?.aborted) {
      video.remove()
      throw new Error("Processing aborted")
    }

    const seekTime = i * frameInterval
    if (seekTime > meta.duration) break

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          video.removeEventListener("seeked", onSeeked)
          reject(new Error("Seek timeout"))
        }, 5000)

        const onSeeked = () => {
          clearTimeout(timeout)
          video.removeEventListener("seeked", onSeeked)
          resolve()
        }
        video.addEventListener("seeked", onSeeked)
        video.currentTime = seekTime
      })
    } catch {
      frames.push([])
      consecutiveErrors++
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.warn(`Too many consecutive seek errors at frame ${i}, stopping early`)
        break
      }
      continue
    }

    const timestampMs = seekTime * 1000
    try {
      const result = landmarkerInstance.detectForVideo(video, timestampMs)

      if (result.landmarks && result.landmarks.length > 0) {
        const poseLandmarks: PoseLandmark[] = result.landmarks[0].map(
          (lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility ?? 0,
          })
        )
        frames.push(poseLandmarks)

        const frameVisibility =
          poseLandmarks.reduce((sum, lm) => sum + lm.visibility, 0) /
          poseLandmarks.length
        totalVisibility += frameVisibility
        visibilityCount++
        consecutiveErrors = 0
      } else {
        frames.push([])
      }
    } catch (err) {
      console.warn(`Detection failed at frame ${i}:`, err)
      frames.push([])
      consecutiveErrors++
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.warn(`Too many consecutive detection errors at frame ${i}, stopping early`)
        break
      }
    }

    const progress = Math.round(((i + 1) / totalFrames) * 100)
    onProgress?.(progress, i + 1, totalFrames)

    if (i % 3 === 0) await yieldToMain()
  }

  video.remove()

  const avgVisibility = visibilityCount > 0 ? totalVisibility / visibilityCount : 0

  return {
    videoId,
    fileName,
    blobUrl,
    width: meta.width,
    height: meta.height,
    duration: meta.duration,
    fps: targetFps,
    frames,
    avgVisibility,
  }
}

/**
 * Check if the model is already initialized
 */
export function isModelReady(): boolean {
  return landmarkerInstance !== null
}

/**
 * Dispose of the PoseLandmarker instance to free memory
 */
export function disposePoseLandmarker(): void {
  if (landmarkerInstance) {
    landmarkerInstance.close()
    landmarkerInstance = null
  }
}
