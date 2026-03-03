"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { useAnalysis } from "@/lib/analysis-store"
import { useTemplate } from "@/lib/template-store"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { drawOverlayFrame } from "@/lib/overlay-renderer"
import { LANDMARKS, getLocalizedName } from "@/lib/landmarks"
import { TRACKER_COLORS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function VideoPreview() {
  const { state, dispatch } = useAnalysis()
  const { state: templateState } = useTemplate()
  const { t, locale } = useTranslation()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const [isReady, setIsReady] = useState(false)

  const video = state.videos.find((v) => v.id === state.previewVideoId)
  const analysis = video?.analysis
  const template = templateState.template

  const handleClose = useCallback(() => {
    dispatch({ type: "SET_PREVIEW_VIDEO", videoId: null })
  }, [dispatch])

  // Render loop: draw overlays in sync with video playback
  const renderFrame = useCallback(() => {
    const vid = videoRef.current
    const canvas = canvasRef.current
    if (!vid || !canvas || !analysis) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const fps = analysis.fps || 15
    const frameIndex = Math.min(
      Math.floor(vid.currentTime * fps),
      analysis.frames.length - 1
    )

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (frameIndex >= 0) {
      drawOverlayFrame(
        ctx,
        frameIndex,
        analysis.frames,
        template,
        canvas.width,
        canvas.height,
        fps
      )
    }

    animFrameRef.current = requestAnimationFrame(renderFrame)
  }, [analysis, template])

  useEffect(() => {
    if (!isReady || !analysis) return

    animFrameRef.current = requestAnimationFrame(renderFrame)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [isReady, renderFrame, analysis])

  const handleLoadedMetadata = useCallback(() => {
    const vid = videoRef.current
    const canvas = canvasRef.current
    if (!vid || !canvas) return

    canvas.width = vid.videoWidth
    canvas.height = vid.videoHeight
    setIsReady(true)
  }, [])

  if (!video || !analysis) return null

  // Collect annotations for the right panel
  const annotatedLandmarks = Object.entries(template.landmarks)
    .filter(([, c]) => c.enabled && c.note)
    .map(([id, config]) => ({
      id: Number(id),
      config,
      name: (LANDMARKS[Number(id)] ? getLocalizedName(LANDMARKS[Number(id)], locale) : null) ?? `Landmark ${id}`,
    }))
    .sort((a, b) => b.config.priority - a.config.priority)

  const hasAnnotations = annotatedLandmarks.length > 0 || template.globalComment

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95">
      <div className="flex w-full max-w-5xl flex-col gap-3 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t("preview.title")}
            </h3>
            <p className="text-xs text-muted-foreground">{analysis.fileName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
            aria-label={t("preview.close")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Video + Right annotation panel */}
        <div className="flex gap-0 overflow-hidden rounded-lg border border-border">
          {/* Video + Canvas overlay */}
          <div className="relative flex-1 bg-card">
            <video
              ref={videoRef}
              src={analysis.blobUrl}
              controls
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              className="block w-full"
              crossOrigin="anonymous"
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
          </div>

          {/* Right annotation panel */}
          {hasAnnotations && (
            <div className="w-[280px] shrink-0 border-l border-border bg-card/95 p-4 overflow-y-auto max-h-[70vh]">
              {template.globalComment && (
                <div className="mb-3">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Overall feedback
                  </p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {template.globalComment}
                  </p>
                </div>
              )}
              {annotatedLandmarks.length > 0 && (
                <div className="flex flex-col gap-3">
                  {annotatedLandmarks.map((lm) => (
                    <div key={lm.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: TRACKER_COLORS[lm.config.color].hex }}
                        />
                        <span className="text-sm font-semibold text-foreground">{lm.name}</span>
                        <span
                          className="text-xs font-semibold px-1 rounded"
                          style={{ color: TRACKER_COLORS[lm.config.color].hex }}
                        >
                          P{lm.config.priority}
                        </span>
                      </div>
                      {lm.config.note && (
                        <p className="text-xs text-muted-foreground leading-relaxed pl-[18px]">
                          {lm.config.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-4 text-[10px] text-muted-foreground/50 text-center">
                trailmo from fintalab.com
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
