import type { LandmarkDefinition } from "./types"
import type { Locale } from "./i18n/translations"

/**
 * 33 MediaPipe Pose landmarks with anatomically correct positions
 * mapped to a 400x700 SVG viewBox (front-facing human).
 *
 * Positions are in absolute SVG coordinates.
 * Connections define which landmarks to draw bones between.
 */
export const LANDMARKS: LandmarkDefinition[] = [
  // --- Head (0 = selectable, 1-10 = hidden sub-landmarks for MediaPipe) ---
  { id: 0, name: "head", displayName: "Head", displayNameFr: "Tête", x: 200, y: 78, connections: [1, 4], region: "face" },
  { id: 1, name: "left_eye_inner", displayName: "Left Eye (Inner)", displayNameFr: "Œil gauche (intérieur)", x: 208, y: 68, connections: [2], region: "face", selectable: false },
  { id: 2, name: "left_eye", displayName: "Left Eye", displayNameFr: "Œil gauche", x: 215, y: 66, connections: [3], region: "face", selectable: false },
  { id: 3, name: "left_eye_outer", displayName: "Left Eye (Outer)", displayNameFr: "Œil gauche (extérieur)", x: 222, y: 68, connections: [7], region: "face", selectable: false },
  { id: 4, name: "right_eye_inner", displayName: "Right Eye (Inner)", displayNameFr: "Œil droit (intérieur)", x: 192, y: 68, connections: [5], region: "face", selectable: false },
  { id: 5, name: "right_eye", displayName: "Right Eye", displayNameFr: "Œil droit", x: 185, y: 66, connections: [6], region: "face", selectable: false },
  { id: 6, name: "right_eye_outer", displayName: "Right Eye (Outer)", displayNameFr: "Œil droit (extérieur)", x: 178, y: 68, connections: [8], region: "face", selectable: false },
  { id: 7, name: "left_ear", displayName: "Left Ear", displayNameFr: "Oreille gauche", x: 232, y: 74, connections: [], region: "face", selectable: false },
  { id: 8, name: "right_ear", displayName: "Right Ear", displayNameFr: "Oreille droite", x: 168, y: 74, connections: [], region: "face", selectable: false },
  { id: 9, name: "mouth_left", displayName: "Mouth (Left)", displayNameFr: "Bouche (gauche)", x: 210, y: 92, connections: [10], region: "face", selectable: false },
  { id: 10, name: "mouth_right", displayName: "Mouth (Right)", displayNameFr: "Bouche (droite)", x: 190, y: 92, connections: [], region: "face", selectable: false },

  // --- Torso (11-12, 23-24) ---
  { id: 11, name: "left_shoulder", displayName: "Left Shoulder", displayNameFr: "Épaule gauche", x: 268, y: 170, connections: [12, 13, 23], region: "torso" },
  { id: 12, name: "right_shoulder", displayName: "Right Shoulder", displayNameFr: "Épaule droite", x: 132, y: 170, connections: [14, 24], region: "torso" },

  // --- Left Arm (13, 15, 17, 19, 21) ---
  { id: 13, name: "left_elbow", displayName: "Left Elbow", displayNameFr: "Coude gauche", x: 310, y: 265, connections: [15], region: "left_arm" },
  { id: 14, name: "right_elbow", displayName: "Right Elbow", displayNameFr: "Coude droit", x: 90, y: 265, connections: [16], region: "right_arm" },
  { id: 15, name: "left_wrist", displayName: "Left Wrist", displayNameFr: "Poignet gauche", x: 330, y: 355, connections: [17, 19, 21], region: "left_arm" },
  { id: 16, name: "right_wrist", displayName: "Right Wrist", displayNameFr: "Poignet droit", x: 70, y: 355, connections: [18, 20, 22], region: "right_arm" },
  { id: 17, name: "left_pinky", displayName: "Left Pinky", displayNameFr: "Auriculaire gauche", x: 345, y: 385, connections: [], region: "left_arm" },
  { id: 18, name: "right_pinky", displayName: "Right Pinky", displayNameFr: "Auriculaire droit", x: 55, y: 385, connections: [], region: "right_arm" },
  { id: 19, name: "left_index", displayName: "Left Index", displayNameFr: "Index gauche", x: 340, y: 390, connections: [], region: "left_arm" },
  { id: 20, name: "right_index", displayName: "Right Index", displayNameFr: "Index droit", x: 60, y: 390, connections: [], region: "right_arm" },
  { id: 21, name: "left_thumb", displayName: "Left Thumb", displayNameFr: "Pouce gauche", x: 325, y: 378, connections: [], region: "left_arm" },
  { id: 22, name: "right_thumb", displayName: "Right Thumb", displayNameFr: "Pouce droit", x: 75, y: 378, connections: [], region: "right_arm" },

  // --- Hips (23-24) ---
  { id: 23, name: "left_hip", displayName: "Left Hip", displayNameFr: "Hanche gauche", x: 240, y: 360, connections: [24, 25], region: "torso" },
  { id: 24, name: "right_hip", displayName: "Right Hip", displayNameFr: "Hanche droite", x: 160, y: 360, connections: [26], region: "torso" },

  // --- Left Leg (25, 27, 29, 31) ---
  { id: 25, name: "left_knee", displayName: "Left Knee", displayNameFr: "Genou gauche", x: 248, y: 478, connections: [27], region: "left_leg" },
  { id: 26, name: "right_knee", displayName: "Right Knee", displayNameFr: "Genou droit", x: 152, y: 478, connections: [28], region: "right_leg" },
  { id: 27, name: "left_ankle", displayName: "Left Ankle", displayNameFr: "Cheville gauche", x: 252, y: 595, connections: [29, 31], region: "left_leg" },
  { id: 28, name: "right_ankle", displayName: "Right Ankle", displayNameFr: "Cheville droite", x: 148, y: 595, connections: [30, 32], region: "right_leg" },
  { id: 29, name: "left_heel", displayName: "Left Heel", displayNameFr: "Talon gauche", x: 244, y: 625, connections: [], region: "left_leg" },
  { id: 30, name: "right_heel", displayName: "Right Heel", displayNameFr: "Talon droit", x: 156, y: 625, connections: [], region: "right_leg" },
  { id: 31, name: "left_foot_index", displayName: "Left Foot Index", displayNameFr: "Orteil gauche", x: 264, y: 640, connections: [], region: "left_leg" },
  { id: 32, name: "right_foot_index", displayName: "Right Foot Index", displayNameFr: "Orteil droit", x: 136, y: 640, connections: [], region: "right_leg" },
]

/**
 * Get the localized display name for a landmark.
 */
export function getLocalizedName(lm: LandmarkDefinition, locale: Locale): string {
  return locale === "fr" ? lm.displayNameFr : lm.displayName
}

/**
 * Pre-computed set of unique bone connections as [fromId, toId] pairs
 * to avoid drawing duplicate lines.
 */
export const BONE_CONNECTIONS: [number, number][] = (() => {
  const seen = new Set<string>()
  const pairs: [number, number][] = []

  for (const landmark of LANDMARKS) {
    for (const targetId of landmark.connections) {
      const key = [Math.min(landmark.id, targetId), Math.max(landmark.id, targetId)].join("-")
      if (!seen.has(key)) {
        seen.add(key)
        pairs.push([landmark.id, targetId])
      }
    }
  }

  return pairs
})()

/** Get a landmark by its ID */
export function getLandmark(id: number): LandmarkDefinition | undefined {
  return LANDMARKS[id]
}

/** Group landmarks by body region */
export function getLandmarksByRegion() {
  const groups: Record<string, LandmarkDefinition[]> = {}
  for (const lm of LANDMARKS) {
    if (!groups[lm.region]) groups[lm.region] = []
    groups[lm.region].push(lm)
  }
  return groups
}
