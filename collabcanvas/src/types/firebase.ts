// Firebase Realtime Database Types

/**
 * Canvas object stored in Firebase
 * Path: canvas/objects/{objectId}
 */
export interface CanvasObject {
  t: 'r' | 'c' | 't' // type: rectangle, circle, text
  x: number // x position
  y: number // y position
  w: number // width (variable in Phase 2)
  h: number // height (variable in Phase 2)
  rot?: number // rotation in degrees (Phase 2)
  txt?: string // text content (text objects only)
  // NOTE: NO color property - all shapes blue #3B82F6
}

/**
 * User presence data stored in Firebase
 * Path: presence/{userId}
 */
export interface Presence {
  n: string // name
  cl: string // color (for cursor and selection indicators)
  c: [number, number] // cursor position [x, y]
  sel: string[] | null // selected object IDs (array for multi-select, null if none)
}

/**
 * Firebase User data
 */
export interface User {
  uid: string
  email: string | null
  displayName: string | null
}

/**
 * Canvas data structure in Firebase
 */
export interface CanvasData {
  objects: {
    [objectId: string]: CanvasObject
  }
}

/**
 * Presence data structure in Firebase
 */
export interface PresenceData {
  [userId: string]: Presence
}

