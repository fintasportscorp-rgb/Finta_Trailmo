"use client"

import { useCallback, useState } from "react"
import { useAnalysis, MAX_VIDEOS } from "@/lib/analysis-store"
import { useTranslation } from "@/lib/i18n/i18n-context"
import type { VideoUploadItem } from "@/lib/types"
import { Upload, FileVideo, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function VideoUploadZone() {
  const { addFiles, videoCount, isAtVideoLimit } = useAnalysis()
  const { t } = useTranslation()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      if (fileArray.length === 0) return

      const remaining = MAX_VIDEOS - videoCount
      if (remaining <= 0) {
        toast.error(t("upload.maxError", { max: String(MAX_VIDEOS) }))
        return
      }

      const validExtensions = ["mp4", "mov", "webm"]
      const maxSize = 100 * 1024 * 1024

      const valid: File[] = []
      const rejected: string[] = []

      for (const file of fileArray) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
        if (!validExtensions.includes(ext)) {
          rejected.push(`${file.name}: unsupported format`)
        } else if (file.size > maxSize) {
          rejected.push(`${file.name}: exceeds 100 MB`)
        } else {
          valid.push(file)
        }
      }

      if (rejected.length > 0) {
        toast.error(t("upload.rejected"), {
          description: rejected.slice(0, 3).join(", "),
        })
      }

      if (valid.length > remaining) {
        toast.warning(t("upload.onlyMore", { count: String(remaining), s: remaining !== 1 ? "s" : "", x: remaining !== 1 ? "v" : "t" }))
      }

      addFiles(valid.slice(0, remaining))
    },
    [addFiles, videoCount, t]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files)
        e.target.value = ""
      }
    },
    [handleFiles]
  )

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 sm:px-6 py-8 sm:py-10 transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : isAtVideoLimit
              ? "border-muted cursor-not-allowed opacity-50"
              : "border-border hover:border-muted-foreground/40 cursor-pointer"
        }`}
        onClick={() => {
          if (!isAtVideoLimit) {
            document.getElementById("video-upload-input")?.click()
          }
        }}
        role="button"
        tabIndex={isAtVideoLimit ? -1 : 0}
        aria-label="Drop video files or click to browse"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isAtVideoLimit) {
            e.preventDefault()
            document.getElementById("video-upload-input")?.click()
          }
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-center max-w-full px-1">
          <p className="text-sm font-medium text-foreground break-words">
            {isAtVideoLimit
              ? t("upload.limitReached")
              : t("upload.dropOrBrowse")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground break-words">
            {t("upload.hint", { max: String(MAX_VIDEOS) })}
          </p>
        </div>
        <input
          id="video-upload-input"
          type="file"
          accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
          multiple
          onChange={handleInputChange}
          className="sr-only"
          disabled={isAtVideoLimit}
        />
      </div>

      {/* Recommendation */}
      <div className="flex items-start gap-2.5 rounded-lg bg-card px-3 sm:px-3.5 py-2.5 border border-border min-w-0">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tracker-yellow" />
        <p className="text-xs text-muted-foreground leading-relaxed break-words min-w-0">
          {t("upload.recommendation")}
        </p>
      </div>
    </div>
  )
}

export function VideoFileList() {
  const { state, dispatch } = useAnalysis()
  const { t } = useTranslation()
  const { videos } = state

  if (videos.length === 0) return null

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("upload.videos")} ({videos.length}/{MAX_VIDEOS})
        </h3>
        {videos.length > 1 && state.status === "idle" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => dispatch({ type: "CLEAR_VIDEOS" })}
          >
            {t("upload.removeAll")}
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {videos.map((v) => (
          <VideoFileItem key={v.id} video={v} />
        ))}
      </div>
    </div>
  )
}

function VideoFileItem({ video }: { video: VideoUploadItem }) {
  const { dispatch, state } = useAnalysis()
  const { t } = useTranslation()
  const isProcessing = state.status === "processing" || state.status === "initializing"

  const fileSizeMB = (video.file.size / (1024 * 1024)).toFixed(1)

  return (
    <div className="flex items-center gap-3 rounded-lg bg-card border border-border px-3 py-2.5">
      <FileVideo className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{video.file.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground">
            {fileSizeMB} MB
          </span>
          {video.status === "processing" && (
            <span className="text-[11px] text-primary font-medium">
              {video.progress}%
            </span>
          )}
          {video.status === "complete" && (
            <span className="text-[11px] text-tracker-green font-medium">
              {t("upload.done")}
            </span>
          )}
          {video.status === "error" && (
            <span className="text-[11px] text-destructive-foreground font-medium">
              {t("upload.error")}
            </span>
          )}
          {video.analysis && video.analysis.avgVisibility < 0.4 && (
            <span className="text-[11px] text-tracker-orange font-medium">
              {t("upload.lowVisibility")}
            </span>
          )}
        </div>
        {/* Progress bar */}
        {video.status === "processing" && (
          <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${video.progress}%` }}
            />
          </div>
        )}
      </div>
      {!isProcessing && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            URL.revokeObjectURL(video.blobUrl)
            dispatch({ type: "REMOVE_VIDEO", videoId: video.id })
          }}
          aria-label={`Remove ${video.file.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
