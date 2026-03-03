"use client"

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react"
import type {
  Template,
  TemplateState,
  TemplateAction,
  LandmarkConfig,
} from "./types"
import { MAX_LANDMARKS, DEFAULT_LANDMARK_CONFIG } from "./constants"

function createEmptyTemplate(): Template {
  return {
    templateId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    landmarks: {},
    globalComment: "",
  }
}

function templateReducer(state: TemplateState, action: TemplateAction): TemplateState {
  switch (action.type) {
    case "TOGGLE_LANDMARK": {
      const { landmarkId } = action
      const existing = state.template.landmarks[landmarkId]

      // If already enabled, select it for editing
      if (existing?.enabled) {
        return {
          ...state,
          selectedLandmarkId: state.selectedLandmarkId === landmarkId ? null : landmarkId,
        }
      }

      // Check max limit before enabling
      const enabledCount = Object.values(state.template.landmarks).filter(
        (c) => c.enabled
      ).length
      if (enabledCount >= MAX_LANDMARKS) {
        return state
      }

      // Enable with defaults
      const newLandmarks = {
        ...state.template.landmarks,
        [landmarkId]: { ...DEFAULT_LANDMARK_CONFIG },
      }

      return {
        ...state,
        template: { ...state.template, landmarks: newLandmarks },
        selectedLandmarkId: landmarkId,
      }
    }

    case "UPDATE_CONFIG": {
      const { landmarkId, config } = action
      const existing = state.template.landmarks[landmarkId]
      if (!existing) return state

      return {
        ...state,
        template: {
          ...state.template,
          landmarks: {
            ...state.template.landmarks,
            [landmarkId]: { ...existing, ...config },
          },
        },
      }
    }

    case "REMOVE_LANDMARK": {
      const { landmarkId } = action
      const { [landmarkId]: _, ...rest } = state.template.landmarks

      return {
        ...state,
        template: { ...state.template, landmarks: rest },
        selectedLandmarkId:
          state.selectedLandmarkId === landmarkId
            ? null
            : state.selectedLandmarkId,
      }
    }

    case "CLEAR_ALL": {
      return {
        template: createEmptyTemplate(),
        selectedLandmarkId: null,
      }
    }

    case "SET_GLOBAL_COMMENT": {
      return {
        ...state,
        template: { ...state.template, globalComment: action.comment },
      }
    }

    default:
      return state
  }
}

// --- Context ---

interface TemplateContextValue {
  state: TemplateState
  dispatch: (action: TemplateAction) => void
  enabledCount: number
  isAtLimit: boolean
  selectLandmark: (id: number | null) => void
  getConfig: (id: number) => LandmarkConfig | undefined
}

const TemplateContext = createContext<TemplateContextValue | null>(null)

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(templateReducer, {
    template: createEmptyTemplate(),
    selectedLandmarkId: null,
  })

  const enabledCount = Object.values(state.template.landmarks).filter(
    (c) => c.enabled
  ).length

  const isAtLimit = enabledCount >= MAX_LANDMARKS

  const selectLandmark = useCallback(
    (id: number | null) => {
      if (id === null) {
        dispatch({ type: "TOGGLE_LANDMARK", landmarkId: -1 }) // deselect hack
      }
      // We handle selection through TOGGLE_LANDMARK for existing,
      // or just set selectedLandmarkId for nav
    },
    []
  )

  const getConfig = useCallback(
    (id: number) => state.template.landmarks[id],
    [state.template.landmarks]
  )

  return (
    <TemplateContext value={{
      state,
      dispatch,
      enabledCount,
      isAtLimit,
      selectLandmark,
      getConfig,
    }}>
      {children}
    </TemplateContext>
  )
}

export function useTemplate(): TemplateContextValue {
  const ctx = useContext(TemplateContext)
  if (!ctx) throw new Error("useTemplate must be used within TemplateProvider")
  return ctx
}
