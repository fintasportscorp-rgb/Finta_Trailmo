"use client"

import { useCallback, useRef, useState } from "react"
import { useAnalysis } from "@/lib/analysis-store"
import { useTemplate } from "@/lib/template-store"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { initPoseLandmarker, processVideo, isModelReady } from "@/lib/pose-engine"
import {
  isWebCodecsSupported,
  exportAnnotatedVideo,
  generateSummaryPNGAsync,
} from "@/lib/video-export"
import { LANDMARKS, getLocalizedName } from "@/lib/landmarks"
import { TRACKER_COLORS } from "@/lib/constants"
import { VideoUploadZone, VideoFileList } from "./video-upload"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Loader2, Play, CheckCircle2, AlertCircle, Eye, Download, Image } from "lucide-react"
import { toast } from "sonner"
import type { VideoAnalysis, Template } from "@/lib/types"

export function AnalysisView() {
  const { state, dispatch } = useAnalysis()
  const { enabledCount } = useTemplate()
  const { t } = useTranslation()
  const abortRef = useRef<AbortController | null>(null)

  const isIdle = state.status === "idle"
  const isProcessing =
    state.status === "initializing" || state.status === "processing"
  const isComplete = state.status === "complete"
  const isError = state.status === "error"
  const hasVideos = state.videos.length > 0

  const handleStartAnalysis = useCallback(async () => {
    if (state.videos.length === 0) return

    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    try {
      dispatch({ type: "SET_STATUS", status: "initializing" })
      dispatch({ type: "SET_GLOBAL_PROGRESS", progress: 0 })

      if (!isModelReady()) {
        await initPoseLandmarker(() => {
          dispatch({ type: "SET_GLOBAL_PROGRESS", progress: 5 })
        })
        dispatch({ type: "SET_MODEL_LOADED", loaded: true })
      }

      if (signal.aborted) return

      dispatch({ type: "SET_STATUS", status: "processing" })

      const totalVideos = state.videos.length

      for (let i = 0; i < totalVideos; i++) {
        if (signal.aborted) break

        const video = state.videos[i]
        dispatch({
          type: "UPDATE_VIDEO",
          videoId: video.id,
          updates: { status: "processing", progress: 0 },
        })

        try {
          const analysis = await processVideo(
            video.id,
            video.file.name,
            video.blobUrl,
            (progress) => {
              dispatch({
                type: "UPDATE_VIDEO",
                videoId: video.id,
                updates: { progress },
              })
              const globalProgress = Math.round(
                ((i * 100 + progress) / (totalVideos * 100)) * 100
              )
              dispatch({
                type: "SET_GLOBAL_PROGRESS",
                progress: globalProgress,
              })
            },
            signal
          )

          dispatch({
            type: "UPDATE_VIDEO",
            videoId: video.id,
            updates: {
              status: "complete",
              progress: 100,
              analysis,
            },
          })

          if (analysis.avgVisibility < 0.4) {
            toast.warning(t("analysis.lowVisWarn", { name: video.file.name }), {
              description: t("analysis.lowVisDesc"),
            })
          }
        } catch (err) {
          if (signal.aborted) break
          const errorMsg = err instanceof Error ? err.message : "Unknown error"
          dispatch({
            type: "UPDATE_VIDEO",
            videoId: video.id,
            updates: { status: "error", error: errorMsg },
          })
        }
      }

      if (!signal.aborted) {
        dispatch({ type: "SET_STATUS", status: "complete" })
        dispatch({ type: "SET_GLOBAL_PROGRESS", progress: 100 })
        toast.success(t("analysis.completeToast"), {
          description: t("analysis.completeDesc", {
            count: String(totalVideos),
            s: totalVideos !== 1 ? "s" : "",
          }),
        })
      }
    } catch (err) {
      if (!signal.aborted) {
        dispatch({ type: "SET_STATUS", status: "error" })
        toast.error(t("analysis.failedToast"), {
          description:
            err instanceof Error ? err.message : t("analysis.failedDesc"),
        })
      }
    }
  }, [state.videos, dispatch, t])

  const handleAbort = useCallback(() => {
    abortRef.current?.abort()
    dispatch({ type: "SET_STATUS", status: "idle" })
    dispatch({ type: "SET_GLOBAL_PROGRESS", progress: 0 })
    for (const v of state.videos) {
      if (v.status === "processing" || v.status === "initializing") {
        dispatch({
          type: "UPDATE_VIDEO",
          videoId: v.id,
          updates: { status: "idle", progress: 0 },
        })
      }
    }
    toast.info(t("analysis.cancelled"))
  }, [dispatch, state.videos, t])

  const handleBack = useCallback(() => {
    if (isProcessing) return
    dispatch({ type: "SET_VIEW", view: "template" })
  }, [dispatch, isProcessing])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleBack}
          disabled={isProcessing}
          aria-label={t("analysis.backToTemplate")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground">
            {t("analysis.title")}
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {t("analysis.landmarksConfigured", {
              count: String(enabledCount),
              s: enabledCount !== 1 ? "s" : "",
            })}
          </p>
        </div>
        {isProcessing && (
          <Badge variant="secondary" className="gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("analysis.processing")}
          </Badge>
        )}
        {isComplete && (
          <Badge
            variant="secondary"
            className="gap-1.5 border-tracker-green/30 text-tracker-green"
          >
            <CheckCircle2 className="h-3 w-3" />
            {t("analysis.complete")}
          </Badge>
        )}
        {isError && (
          <Badge variant="destructive" className="gap-1.5">
            <AlertCircle className="h-3 w-3" />
            {t("analysis.errorBadge")}
          </Badge>
        )}
      </div>

      {/* Global progress bar */}
      {isProcessing && (
        <div className="px-4 py-2 md:px-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">
              {state.status === "initializing"
                ? t("analysis.loadingModel")
                : t("analysis.analyzingVideos", { pct: String(state.globalProgress) })}
            </span>
          </div>
          <Progress value={state.globalProgress} />
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-6 p-3 sm:p-4 md:p-6">
          {(isIdle || isComplete || isError) && <VideoUploadZone />}
          <VideoFileList />
          {isComplete && <AnalysisResults />}
        </div>
      </ScrollArea>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 sm:px-4 py-3 md:px-6">
        {isProcessing ? (
          <>
            <span className="text-xs text-muted-foreground min-w-0 truncate">
              {t("analysis.videosDone", {
                done: String(state.videos.filter((v) => v.status === "complete").length),
                total: String(state.videos.length),
              })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAbort}
              className="shrink-0 text-destructive-foreground hover:bg-destructive/10"
            >
              {t("analysis.cancelBtn")}
            </Button>
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground min-w-0 truncate">
              {t("analysis.videosReady", {
                count: String(state.videos.length),
                s: state.videos.length !== 1 ? "s" : "",
              })}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                disabled={!hasVideos || isProcessing}
                onClick={handleStartAnalysis}
              >
                {isComplete ? (
                  <>
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                    {t("analysis.reAnalyze")}
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                    {t("analysis.startAnalysis")}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function AnalysisResults() {
  const { state, dispatch } = useAnalysis()
  const { state: templateState, dispatch: templateDispatch } = useTemplate()
  const { t } = useTranslation()
  const completed = state.videos.filter((v) => v.status === "complete")

  if (completed.length === 0) return null

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {t("results.title")}
      </h3>

      {/* Global feedback comment */}
      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {t("results.globalComment")}
        </label>
        <textarea
          className="mt-1.5 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          rows={3}
          placeholder={t("results.globalCommentPlaceholder")}
          value={templateState.template.globalComment}
          onChange={(e) =>
            templateDispatch({ type: "SET_GLOBAL_COMMENT", comment: e.target.value })
          }
        />
      </div>

      {/* Video result cards */}
      <div className="flex flex-col gap-4">
        {completed.map((v) => {
          const a = v.analysis
          if (!a) return null
          return (
            <VideoResultCard
              key={v.id}
              analysis={a}
              template={templateState.template}
              onPreview={() => dispatch({ type: "SET_PREVIEW_VIDEO", videoId: v.id })}
            />
          )
        })}
      </div>
    </div>
  )
}

function VideoResultCard({
  analysis,
  template,
  onPreview,
}: {
  analysis: VideoAnalysis
  template: Template
  onPreview: () => void
}) {
  const { t, locale } = useTranslation()
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadPct, setDownloadPct] = useState(0)

  const framesWithPose = analysis.frames.filter((f) => f.length > 0).length
  const detectionRate = Math.round((framesWithPose / analysis.frames.length) * 100)

  const enabledLandmarks = Object.entries(template.landmarks)
    .filter(([, c]) => c.enabled)
    .map(([id, config]) => ({
      id: Number(id),
      config,
      name: (LANDMARKS[Number(id)] ? getLocalizedName(LANDMARKS[Number(id)], locale) : null) ?? `Landmark ${id}`,
    }))
    .sort((a, b) => b.config.priority - a.config.priority)

  const handleDownloadVideo = useCallback(async () => {
    if (!isWebCodecsSupported()) {
      toast.error(t("export.unsupported"))
      return
    }
    setDownloading("video")
    setDownloadPct(0)
    try {
      const blob = await exportAnnotatedVideo(
        analysis,
        template,
        {
          onProgress: (pct) => setDownloadPct(pct),
        },
        template.globalComment || undefined,
        locale
      )
      const safeName = analysis.fileName.replace(/\.[^.]+$/, "")
      const ext = blob.type === "video/webm" ? "webm" : "mp4"
      downloadBlob(blob, `trailmo_${safeName}.${ext}`)
      toast.success(t("results.downloadReady"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed")
    } finally {
      setDownloading(null)
      setDownloadPct(0)
    }
  }, [analysis, template, t, locale])

  const handleDownloadPNG = useCallback(async () => {
    setDownloading("png")
    try {
      const blob = await generateSummaryPNGAsync(
        analysis,
        template,
        template.globalComment || undefined,
        locale
      )
      const safeName = analysis.fileName.replace(/\.[^.]+$/, "")
      downloadBlob(blob, `trailmo_${safeName}_summary.png`)
      toast.success(t("results.downloadReady"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed")
    } finally {
      setDownloading(null)
    }
  }, [analysis, template, t, locale])

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Video header */}
      <div className="px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate min-w-0">{analysis.fileName}</p>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={onPreview}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("results.preview")}</span>
            </Button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            {t("results.resolution")}:{" "}
            <span className="text-foreground">{analysis.width}x{analysis.height}</span>
          </span>
          <span>
            {t("results.duration")}:{" "}
            <span className="text-foreground">{analysis.duration.toFixed(1)}s</span>
          </span>
          <span>
            {t("results.frames")}:{" "}
            <span className="text-foreground">{analysis.frames.length}</span>
          </span>
          <span>
            {t("results.detection")}:{" "}
            <span
              className={
                detectionRate >= 80
                  ? "text-tracker-green"
                  : detectionRate >= 50
                    ? "text-tracker-yellow"
                    : "text-tracker-orange"
              }
            >
              {detectionRate}%
            </span>
          </span>
          <span>
            {t("results.visibility")}:{" "}
            <span
              className={
                analysis.avgVisibility >= 0.6
                  ? "text-tracker-green"
                  : analysis.avgVisibility >= 0.4
                    ? "text-tracker-yellow"
                    : "text-tracker-orange"
              }
            >
              {(analysis.avgVisibility * 100).toFixed(0)}%
            </span>
          </span>
          <span>
            {t("results.fps")}:{" "}
            <span className="text-foreground">{analysis.fps}</span>
          </span>
        </div>

        {/* Landmark annotation summary */}
        {enabledLandmarks.some((lm) => lm.config.note) && (
          <div className="mt-3 flex flex-col gap-1">
            {enabledLandmarks
              .filter((lm) => lm.config.note)
              .map((lm) => (
                <div key={lm.id} className="flex items-start gap-2 text-xs">
                  <span
                    className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: TRACKER_COLORS[lm.config.color].hex }}
                  />
                  <span className="text-foreground font-medium">{lm.name}</span>
                  <span className="text-muted-foreground">{lm.config.note}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Download bar */}
      <div className="border-t border-border px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleDownloadVideo}
          disabled={downloading !== null}
        >
          {downloading === "video" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {downloadPct > 0 ? `${downloadPct}%` : t("export.generating")}
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              {t("results.downloadVideo")}
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleDownloadPNG}
          disabled={downloading !== null}
        >
          {downloading === "png" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Image className="h-3.5 w-3.5" />
          )}
          {t("results.downloadPNG")}
        </Button>
      </div>
    </div>
  )
}
