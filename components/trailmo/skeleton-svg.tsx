"use client"

import { LANDMARKS, BONE_CONNECTIONS, getLocalizedName } from "@/lib/landmarks"
import { TRACKER_COLORS, SVG_WIDTH, SVG_HEIGHT } from "@/lib/constants"
import { useTemplate } from "@/lib/template-store"
import { useTranslation } from "@/lib/i18n/i18n-context"
import type { LandmarkDefinition } from "@/lib/types"
import type { Locale } from "@/lib/i18n/translations"

/** Only landmarks with selectable !== false are shown in the UI */
const SELECTABLE_LANDMARKS = LANDMARKS.filter((lm) => lm.selectable !== false)

/** Hide bone connections where both endpoints are non-selectable face landmarks */
const VISIBLE_BONES = BONE_CONNECTIONS.filter(([fromId, toId]) => {
  const from = LANDMARKS[fromId]
  const to = LANDMARKS[toId]
  if (!from || !to) return false
  // Hide bones entirely within the hidden face sub-landmarks
  if (from.selectable === false && to.selectable === false) return false
  return true
})

interface SkeletonSvgProps {
  onLandmarkClick: (id: number) => void
  className?: string
}

export function SkeletonSvg({ onLandmarkClick, className }: SkeletonSvgProps) {
  const { state, getConfig, isAtLimit } = useTemplate()
  const { locale } = useTranslation()
  const { selectedLandmarkId } = state

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className={className}
      role="img"
      aria-label="Human body skeleton. Click a landmark to configure tracking."
    >
      <defs>
        {/* Glow filter for selected landmarks */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Trail glow filter */}
        <filter id="trail-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Bones */}
      <g aria-hidden="true">
        {VISIBLE_BONES.map(([fromId, toId]) => {
          const from = LANDMARKS[fromId]
          const to = LANDMARKS[toId]
          if (!from || !to) return null

          const fromConfig = getConfig(fromId)
          const toConfig = getConfig(toId)
          const isActive = fromConfig?.enabled || toConfig?.enabled

          return (
            <line
              key={`bone-${fromId}-${toId}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isActive ? "var(--color-muted-foreground)" : "var(--color-skeleton-bone)"}
              strokeWidth={isActive ? 2.5 : 1.5}
              strokeLinecap="round"
              opacity={isActive ? 0.7 : 0.35}
            />
          )
        })}
      </g>

      {/* Landmarks (only selectable ones) */}
      <g>
        {SELECTABLE_LANDMARKS.map((landmark) => (
          <LandmarkCircle
            key={landmark.id}
            landmark={landmark}
            isSelected={selectedLandmarkId === landmark.id}
            config={getConfig(landmark.id)}
            isAtLimit={isAtLimit}
            locale={locale}
            onClick={() => onLandmarkClick(landmark.id)}
          />
        ))}
      </g>
    </svg>
  )
}

interface LandmarkCircleProps {
  landmark: LandmarkDefinition
  isSelected: boolean
  config: ReturnType<ReturnType<typeof useTemplate>["getConfig"]>
  isAtLimit: boolean
  locale: Locale
  onClick: () => void
}

function LandmarkCircle({
  landmark,
  isSelected,
  config,
  isAtLimit,
  locale,
  onClick,
}: LandmarkCircleProps) {
  const isEnabled = config?.enabled ?? false
  const trackerColor = config?.color ?? "green"
  const priority = config?.priority ?? 3
  const hasTrail = config?.trackerType === "trail"

  // Ring radius scales with priority
  const baseRadius = 5
  const ringRadius = isEnabled ? baseRadius + priority * 2.2 : baseRadius
  const ringStrokeWidth = isEnabled ? 1.5 + priority * 0.4 : 0

  const colorHex = isEnabled
    ? TRACKER_COLORS[trackerColor].hex
    : "var(--color-skeleton-joint)"

  const canClick = isEnabled || !isAtLimit

  return (
    <g
      onClick={canClick ? onClick : undefined}
      style={{ cursor: canClick ? "pointer" : "not-allowed" }}
      role="button"
      tabIndex={canClick ? 0 : -1}
      aria-label={`${getLocalizedName(landmark, locale)}${isEnabled ? ` - ${trackerColor}, priority ${priority}` : ""}`}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && canClick) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <title>{getLocalizedName(landmark, locale)}</title>

      {/* Outer ring for enabled landmarks */}
      {isEnabled && (
        <>
          <circle
            cx={landmark.x}
            cy={landmark.y}
            r={ringRadius}
            fill="none"
            stroke={colorHex}
            strokeWidth={ringStrokeWidth}
            opacity={isSelected ? 1 : 0.7}
            filter={isSelected ? "url(#glow)" : undefined}
          >
            {isSelected && (
              <animate
                attributeName="r"
                values={`${ringRadius};${ringRadius + 3};${ringRadius}`}
                dur="1.5s"
                repeatCount="indefinite"
              />
            )}
          </circle>

          {/* Trail indicator: bold animated outer ring */}
          {hasTrail && (
            <>
              {/* Glow halo behind trail ring */}
              <circle
                cx={landmark.x}
                cy={landmark.y}
                r={ringRadius + 6}
                fill="none"
                stroke={colorHex}
                strokeWidth={3}
                opacity={0.2}
                filter="url(#trail-glow)"
              />
              {/* Animated dashed trail ring */}
              <circle
                cx={landmark.x}
                cy={landmark.y}
                r={ringRadius + 6}
                fill="none"
                stroke={colorHex}
                strokeWidth={2}
                strokeDasharray="5 4"
                opacity={0.7}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;18"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}
        </>
      )}

      {/* Hover ring */}
      <circle
        cx={landmark.x}
        cy={landmark.y}
        r={isEnabled ? ringRadius + 8 : baseRadius + 6}
        fill="transparent"
        stroke="transparent"
        className="hover:stroke-muted-foreground/20"
        strokeWidth={2}
      />

      {/* Core dot */}
      <circle
        cx={landmark.x}
        cy={landmark.y}
        r={isEnabled ? baseRadius + 1 : baseRadius}
        fill={isEnabled ? colorHex : "var(--color-skeleton-joint)"}
        stroke={isSelected ? "var(--color-foreground)" : "transparent"}
        strokeWidth={isSelected ? 1.5 : 0}
        opacity={isEnabled ? 1 : 0.5}
      />
    </g>
  )
}
