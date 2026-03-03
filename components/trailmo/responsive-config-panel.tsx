"use client"

import { useIsMobile } from "@/components/ui/use-mobile"
import { LandmarkConfigPanel } from "./landmark-config-panel"
import { useTemplate } from "@/lib/template-store"
import { useTranslation } from "@/lib/i18n/i18n-context"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { LANDMARKS, getLocalizedName } from "@/lib/landmarks"

export function ResponsiveConfigPanel() {
  const isMobile = useIsMobile()
  const { state, dispatch } = useTemplate()
  const { t, locale } = useTranslation()
  const { selectedLandmarkId } = state

  const landmark =
    selectedLandmarkId !== null ? LANDMARKS[selectedLandmarkId] : null

  if (isMobile) {
    return (
      <Drawer
        open={selectedLandmarkId !== null}
        onOpenChange={(open) => {
          if (!open && selectedLandmarkId !== null) {
            dispatch({ type: "TOGGLE_LANDMARK", landmarkId: selectedLandmarkId })
          }
        }}
      >
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>
              {landmark ? getLocalizedName(landmark, locale) : t("config.configureLandmark")}
            </DrawerTitle>
            <DrawerDescription>
              {t("config.setTracking")}
            </DrawerDescription>
          </DrawerHeader>
          <LandmarkConfigPanel />
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: fixed side panel
  return (
    <aside className="hidden w-[360px] shrink-0 border-l border-border md:flex md:flex-col">
      <LandmarkConfigPanel />
    </aside>
  )
}
