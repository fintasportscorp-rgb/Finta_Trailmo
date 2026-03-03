"use client"

import { SkeletonSvg } from "./skeleton-svg"
import { useTemplate } from "@/lib/template-store"
import { MAX_LANDMARKS } from "@/lib/constants"
import { useTranslation } from "@/lib/i18n/i18n-context"

interface SkeletonViewerProps {
  onLandmarkClick: (id: number) => void
  className?: string
}

export function SkeletonViewer({ onLandmarkClick, className }: SkeletonViewerProps) {
  const { enabledCount, isAtLimit } = useTemplate()
  const { t } = useTranslation()

  return (
    <div className={`flex flex-col items-center ${className ?? ""}`}>
      {/* Counter */}
      <div className="flex w-full items-center justify-between px-4 py-2 md:px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {enabledCount}
            <span className="text-muted-foreground">
              {" / "}
              {MAX_LANDMARKS}
            </span>
          </span>
          <span className="text-xs text-muted-foreground">{t("skeleton.landmarks")}</span>
        </div>
        {isAtLimit && (
          <span className="text-xs font-medium text-tracker-orange">
            {t("skeleton.limitReached")}
          </span>
        )}
      </div>

      {/* SVG container */}
      <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden px-4 pb-4">
        <SkeletonSvg
          onLandmarkClick={onLandmarkClick}
          className="h-full max-h-[520px] w-full max-w-[340px] md:max-h-[600px] md:max-w-[380px]"
        />
      </div>
    </div>
  )
}
