"use client"

import { TemplateProvider, useTemplate } from "@/lib/template-store"
import { AnalysisProvider, useAnalysis } from "@/lib/analysis-store"
import { I18nProvider } from "@/lib/i18n/i18n-context"
import { Header } from "@/components/trailmo/header"
import { SkeletonViewer } from "@/components/trailmo/skeleton-viewer"
import { ResponsiveConfigPanel } from "@/components/trailmo/responsive-config-panel"
import { TemplateSummary } from "@/components/trailmo/template-summary"
import { ActionBar } from "@/components/trailmo/action-bar"
import { AnalysisView } from "@/components/trailmo/analysis-view"
import { VideoPreview } from "@/components/trailmo/video-preview"
import { Toaster } from "sonner"

function TrailmoApp() {
  const { dispatch } = useTemplate()
  const { state: analysisState } = useAnalysis()

  const handleLandmarkClick = (id: number) => {
    dispatch({ type: "TOGGLE_LANDMARK", landmarkId: id })
  }

  // Conditionally render based on current view
  if (analysisState.view === "analysis") {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <Header />
        <div className="flex-1 overflow-hidden">
          <AnalysisView />
        </div>
        {analysisState.previewVideoId && <VideoPreview />}
        <Toaster theme="dark" richColors />
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Skeleton area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <SkeletonViewer
            onLandmarkClick={handleLandmarkClick}
            className="flex-1 min-h-0"
          />
          <TemplateSummary onLandmarkSelect={handleLandmarkClick} />
          <ActionBar />
        </main>

        {/* Config panel - desktop side / mobile drawer */}
        <ResponsiveConfigPanel />
      </div>

      <Toaster theme="dark" richColors />
    </div>
  )
}

export default function Page() {
  return (
    <I18nProvider>
      <TemplateProvider>
        <AnalysisProvider>
          <TrailmoApp />
        </AnalysisProvider>
      </TemplateProvider>
    </I18nProvider>
  )
}
