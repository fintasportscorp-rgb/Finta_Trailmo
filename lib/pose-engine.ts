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

// We dynamically import to avoid SSR issues
let PoseLandmarkerClass: any = null
let FilesetResolverClass: any = null
let landmarkerInstance: any = null

/**
 * Initialize the MediaPipe PoseLandmarker (idempotent - only loads once)
 */
export async function initPoseLandmarker(
  onProgress?: (msg: string) => void
): Promise<void> {
  if (landmarkerInstance) return

  onProgress?.("Loading MediaPipe WASM runtime...")

  // Dynamic import to prevent SSR bundling
  const vision = await import("@mediapipe/tasks-vision")
  PoseLandmarkerClass = vision.PoseLandmarker
  FilesetResolverClass = vision.FilesetResolver

  onProgress?.("Downloading pose detection model...")

  const filesetResolver = await FilesetResolverClass.forVisionTasks(WASM_CDN)

  // Try GPU first, fall back to CPU
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
 * Strategy: use a hidden <video> element + requestVideoFrameCallback (or fallback
 * to seek-based processing) to extract frames, then run PoseLandmarker.detectForVideo().
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
  const targetFps = 15 // Process at 15 fps (trade-off speed vs accuracy)
  const totalFrames = Math.ceil(meta.duration * targetFps)
  const frameInterval = 1 / targetFps

  const frames: FrameLandmarks[] = []
  let totalVisibility = 0
  let visibilityCount = 0

  // Create a video element for frame extraction
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

  // Seek-based frame extraction
  for (let i = 0; i < totalFrames; i++) {
    if (abortSignal?.aborted) {
      video.remove()
      throw new Error("Processing aborted")
    }

    const seekTime = i * frameInterval
    if (seekTime > meta.duration) break

    // Seek to the target time
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked)
        resolve()
      }
      video.addEventListener("seeked", onSeeked)
      video.currentTime = seekTime
    })

    // Run pose detection on this frame
    const timestampMs = seekTime * 1000
    try {
      const result = landmarkerInstance.detectForVideo(video, timestampMs)

      if (result.landmarks && result.landmarks.length > 0) {
        // Take the first (and only) pose
        const poseLandmarks: PoseLandmark[] = result.landmarks[0].map(
          (lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility ?? 0,
          })
        )
        frames.push(poseLandmarks)

        // Track visibility
        const frameVisibility =
          poseLandmarks.reduce((sum, lm) => sum + lm.visibility, 0) /
          poseLandmarks.length
        totalVisibility += frameVisibility
        visibilityCount++
      } else {
        // No pose detected in this frame - push empty
        frames.push([])
      }
    } catch {
      // Detection failed for this frame - push empty
      frames.push([])
    }

    const progress = Math.round(((i + 1) / totalFrames) * 100)
    onProgress?.(progress, i + 1, totalFrames)
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
