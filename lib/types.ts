export type TrackerType = "simple" | "trail"
export type TrackerColor = "red" | "orange" | "yellow" | "green"
export type Priority = 1 | 2 | 3 | 4 | 5

export interface LandmarkConfig {
  enabled: boolean
  trackerType: TrackerType
  color: TrackerColor
  priority: Priority
  note: string
}

export interface LandmarkDefinition {
  id: number
  name: string
  displayName: string
  displayNameFr: string
  /** x position as percentage (0-100) of SVG viewBox width */
  x: number
  /** y position as percentage (0-100) of SVG viewBox height */
  y: number
  /** IDs of connected landmarks for drawing bones */
  connections: number[]
  /** Body region for grouping */
  region: "face" | "torso" | "left_arm" | "right_arm" | "left_leg" | "right_leg"
  /** Whether this landmark is selectable in the skeleton UI (default true) */
  selectable?: boolean
}

export interface Template {
  templateId: string
  createdAt: string
  landmarks: Record<number, LandmarkConfig>
  globalComment: string
}

export type TemplateAction =
  | { type: "TOGGLE_LANDMARK"; landmarkId: number }
  | { type: "UPDATE_CONFIG"; landmarkId: number; config: Partial<LandmarkConfig> }
  | { type: "REMOVE_LANDMARK"; landmarkId: number }
  | { type: "CLEAR_ALL" }
  | { type: "SET_GLOBAL_COMMENT"; comment: string }

export interface TemplateState {
  template: Template
  selectedLandmarkId: number | null
}

// --- Phase 2: Analysis types ---

/** A single 3D landmark from MediaPipe (normalized 0-1) */
export interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility: number
}

/** All 33 landmarks for one frame */
export type FrameLandmarks = PoseLandmark[]

/** Pose detection results for a single video */
export interface VideoAnalysis {
  videoId: string
  fileName: string
  /** Blob URL for the uploaded video */
  blobUrl: string
  /** Video dimensions */
  width: number
  height: number
  /** Video duration in seconds */
  duration: number
  /** Frames per second */
  fps: number
  /** Per-frame landmark data (index = frame number) */
  frames: FrameLandmarks[]
  /** Average visibility score across all frames (0-1) */
  avgVisibility: number
}

export type AnalysisStatus =
  | "idle"
  | "uploading"
  | "initializing"
  | "processing"
  | "complete"
  | "error"

export interface VideoUploadItem {
  id: string
  file: File
  blobUrl: string
  /** 0-100 */
  progress: number
  status: AnalysisStatus
  error?: string
  analysis?: VideoAnalysis
}

export type ExportStatus = "idle" | "exporting" | "complete" | "error"

export interface ExportFile {
  name: string
  blob: Blob
  type: "original" | "sequenced"
}

export interface AnalysisState {
  /** Current app view */
  view: "template" | "analysis"
  videos: VideoUploadItem[]
  /** Overall status */
  status: AnalysisStatus
  /** Global progress 0-100 */
  globalProgress: number
  /** Whether the MediaPipe model is loaded */
  modelLoaded: boolean
  /** Export state */
  exportStatus: ExportStatus
  exportProgress: number
  exportFiles: ExportFile[]
  showExportView: boolean
  /** Video ID being previewed (null = none) */
  previewVideoId: string | null
}

export type AnalysisAction =
  | { type: "SET_VIEW"; view: AnalysisState["view"] }
  | { type: "ADD_VIDEOS"; items: VideoUploadItem[] }
  | { type: "REMOVE_VIDEO"; videoId: string }
  | { type: "CLEAR_VIDEOS" }
  | { type: "UPDATE_VIDEO"; videoId: string; updates: Partial<VideoUploadItem> }
  | { type: "SET_STATUS"; status: AnalysisStatus }
  | { type: "SET_GLOBAL_PROGRESS"; progress: number }
  | { type: "SET_MODEL_LOADED"; loaded: boolean }
  | { type: "SET_EXPORT_STATUS"; status: ExportStatus }
  | { type: "SET_EXPORT_PROGRESS"; progress: number }
  | { type: "ADD_EXPORT_FILE"; file: ExportFile }
  | { type: "CLEAR_EXPORTS" }
  | { type: "SET_EXPORT_VIEW"; show: boolean }
  | { type: "SET_PREVIEW_VIDEO"; videoId: string | null }
