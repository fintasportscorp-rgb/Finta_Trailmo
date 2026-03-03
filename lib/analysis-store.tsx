"use client"

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react"
import type { AnalysisState, AnalysisAction, VideoUploadItem } from "./types"

const MAX_VIDEOS = 10

const initialState: AnalysisState = {
  view: "template",
  videos: [],
  status: "idle",
  globalProgress: 0,
  modelLoaded: false,
  exportStatus: "idle",
  exportProgress: 0,
  exportFiles: [],
  showExportView: false,
  previewVideoId: null,
}

function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.view }

    case "ADD_VIDEOS": {
      const remaining = MAX_VIDEOS - state.videos.length
      const toAdd = action.items.slice(0, remaining)
      return { ...state, videos: [...state.videos, ...toAdd] }
    }

    case "REMOVE_VIDEO":
      return {
        ...state,
        videos: state.videos.filter((v) => v.id !== action.videoId),
      }

    case "CLEAR_VIDEOS":
      // Revoke blob URLs
      for (const v of state.videos) {
        URL.revokeObjectURL(v.blobUrl)
      }
      return { ...state, videos: [], status: "idle", globalProgress: 0 }

    case "UPDATE_VIDEO":
      return {
        ...state,
        videos: state.videos.map((v) =>
          v.id === action.videoId ? { ...v, ...action.updates } : v
        ),
      }

    case "SET_STATUS":
      return { ...state, status: action.status }

    case "SET_GLOBAL_PROGRESS":
      return { ...state, globalProgress: action.progress }

    case "SET_MODEL_LOADED":
      return { ...state, modelLoaded: action.loaded }

    case "SET_EXPORT_STATUS":
      return { ...state, exportStatus: action.status }

    case "SET_EXPORT_PROGRESS":
      return { ...state, exportProgress: action.progress }

    case "ADD_EXPORT_FILE":
      return { ...state, exportFiles: [...state.exportFiles, action.file] }

    case "CLEAR_EXPORTS":
      return { ...state, exportStatus: "idle", exportProgress: 0, exportFiles: [], showExportView: false }

    case "SET_EXPORT_VIEW":
      return { ...state, showExportView: action.show }

    case "SET_PREVIEW_VIDEO":
      return { ...state, previewVideoId: action.videoId }

    default:
      return state
  }
}

// --- Context ---

interface AnalysisContextValue {
  state: AnalysisState
  dispatch: (action: AnalysisAction) => void
  addFiles: (files: File[]) => void
  videoCount: number
  isAtVideoLimit: boolean
  completedCount: number
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(analysisReducer, initialState)

  const videoCount = state.videos.length
  const isAtVideoLimit = videoCount >= MAX_VIDEOS
  const completedCount = state.videos.filter(
    (v) => v.status === "complete"
  ).length

  const addFiles = useCallback(
    (files: File[]) => {
      const validExtensions = [".mp4", ".mov", ".webm"]
      const maxSize = 100 * 1024 * 1024 // 100 MB

      const items: VideoUploadItem[] = files
        .filter((f) => {
          const ext = "." + f.name.split(".").pop()?.toLowerCase()
          return validExtensions.includes(ext) && f.size <= maxSize
        })
        .map((file) => ({
          id: crypto.randomUUID(),
          file,
          blobUrl: URL.createObjectURL(file),
          progress: 0,
          status: "idle" as const,
        }))

      if (items.length > 0) {
        dispatch({ type: "ADD_VIDEOS", items })
      }
    },
    []
  )

  return (
    <AnalysisContext value={{
      state,
      dispatch,
      addFiles,
      videoCount,
      isAtVideoLimit,
      completedCount,
    }}>
      {children}
    </AnalysisContext>
  )
}

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider")
  return ctx
}

export { MAX_VIDEOS }
