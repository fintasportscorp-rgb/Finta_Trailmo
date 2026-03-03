"use client"

import { useTemplate } from "@/lib/template-store"
import { LANDMARKS, getLocalizedName } from "@/lib/landmarks"
import { TRACKER_COLORS } from "@/lib/constants"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Badge } from "@/components/ui/badge"
import { Route } from "lucide-react"

interface TemplateSummaryProps {
  onLandmarkSelect: (id: number) => void
}

export function TemplateSummary({ onLandmarkSelect }: TemplateSummaryProps) {
  const { state } = useTemplate()
  const configuredLandmarks = Object.entries(state.template.landmarks)
    .filter(([, c]) => c.enabled)
    .map(([id, config]) => ({
      id: Number(id),
      landmark: LANDMARKS[Number(id)],
      config,
    }))

  const { t, locale } = useTranslation()

  if (configuredLandmarks.length === 0) return null

  return (
    <div className="border-t border-border">
      <div className="px-4 py-3 md:px-6">
        <h3 className="mb-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("summary.configured")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {configuredLandmarks.map(({ id, landmark, config }) => {
            const color = TRACKER_COLORS[config.color]
            return (
              <button
                key={id}
                onClick={() => onLandmarkSelect(id)}
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs transition-colors hover:bg-accent"
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="font-medium text-card-foreground">
                  {getLocalizedName(landmark, locale)}
                </span>
                <Badge
                  variant="secondary"
                  className="h-4 px-1 text-[10px]"
                >
                  P{config.priority}
                </Badge>
                {config.trackerType === "trail" && (
                  <Route className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
