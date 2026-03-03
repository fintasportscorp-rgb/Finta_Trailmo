"use client"

import { useTemplate } from "@/lib/template-store"
import { LANDMARKS, getLocalizedName } from "@/lib/landmarks"
import { TRACKER_COLORS } from "@/lib/constants"
import { useTranslation } from "@/lib/i18n/i18n-context"
import type { TrackerColor, TrackerType, Priority } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, X, Trash2, CircleDot, Route } from "lucide-react"

export function LandmarkConfigPanel() {
  const { state, dispatch, getConfig } = useTemplate()
  const { selectedLandmarkId } = state
  const { t, locale } = useTranslation()

  if (selectedLandmarkId === null) {
    return <EmptyState />
  }

  const landmark = LANDMARKS[selectedLandmarkId]
  const config = getConfig(selectedLandmarkId)

  if (!landmark || !config) {
    return <EmptyState />
  }

  const updateConfig = (updates: Partial<typeof config>) => {
    dispatch({
      type: "UPDATE_CONFIG",
      landmarkId: selectedLandmarkId,
      config: updates,
    })
  }

  const priorityKey = `priority.${config.priority}` as "priority.1" | "priority.2" | "priority.3" | "priority.4" | "priority.5"

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-5 p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {getLocalizedName(landmark, locale)}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("config.landmark")} #{landmark.id} &middot;{" "}
              {landmark.region.replace("_", " ")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => dispatch({ type: "TOGGLE_LANDMARK", landmarkId: selectedLandmarkId })}
            aria-label={t("config.closePanel")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Tracker Type */}
        <div className="flex flex-col gap-2.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("config.trackerType")}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <TrackerTypeButton
              type="simple"
              isActive={config.trackerType === "simple"}
              onClick={() => updateConfig({ trackerType: "simple" })}
            />
            <TrackerTypeButton
              type="trail"
              isActive={config.trackerType === "trail"}
              onClick={() => updateConfig({ trackerType: "trail" })}
            />
          </div>
        </div>

        <Separator />

        {/* Color */}
        <div className="flex flex-col gap-2.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("config.color")}
          </Label>
          <div className="flex gap-2">
            {(Object.entries(TRACKER_COLORS) as [TrackerColor, typeof TRACKER_COLORS[TrackerColor]][]).map(
              ([key, val]) => (
                <button
                  key={key}
                  onClick={() => updateConfig({ color: key })}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all ${
                    config.color === key
                      ? "border-foreground scale-110"
                      : "border-transparent hover:border-muted-foreground/30"
                  }`}
                  aria-label={`${t("config.setColor")} ${t(`color.${key}` as "color.red" | "color.orange" | "color.yellow" | "color.green")}`}
                  aria-pressed={config.color === key}
                >
                  <div
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: val.hex }}
                  />
                  {config.color === key && (
                    <Check className="absolute h-3 w-3 text-foreground" />
                  )}
                </button>
              )
            )}
          </div>
        </div>

        <Separator />

        {/* Priority */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("config.priority")}
            </Label>
            <span className="text-xs font-medium text-foreground">
              {config.priority} &mdash; {t(priorityKey)}
            </span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[config.priority]}
            onValueChange={([v]) => updateConfig({ priority: v as Priority })}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{t("config.minimal")}</span>
            <span>{t("config.critical")}</span>
          </div>
        </div>

        <Separator />

        {/* Note */}
        <div className="flex flex-col gap-2.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("config.feedbackNote")}
          </Label>
          <Textarea
            placeholder={t("config.notePlaceholder")}
            value={config.note}
            onChange={(e) => updateConfig({ note: e.target.value })}
            className="min-h-[80px] resize-none text-sm"
          />
        </div>

        <Separator />

        {/* Remove */}
        <Button
          variant="ghost"
          className="justify-start text-destructive-foreground hover:text-destructive-foreground hover:bg-destructive/10"
          onClick={() => dispatch({ type: "REMOVE_LANDMARK", landmarkId: selectedLandmarkId })}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("config.removeLandmark")}
        </Button>
      </div>
    </ScrollArea>
  )
}

function TrackerTypeButton({
  type,
  isActive,
  onClick,
}: {
  type: TrackerType
  isActive: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  const Icon = type === "simple" ? CircleDot : Route
  const label = type === "simple" ? t("config.ring") : t("config.ringTrail")

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
        isActive
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
      }`}
      aria-pressed={isActive}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <CircleDot className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {t("config.noSelection")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          {t("config.noSelectionHint")}
        </p>
      </div>
    </div>
  )
}
