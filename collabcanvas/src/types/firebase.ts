// Firebase Realtime Database Types

/**
 * Canvas object stored in Firebase
 * Path: canvas/objects/{objectId}
 */
export interface CanvasObject {
  t: 'r' | 'c' | 't' | 'l' | 'pg' | 'st' | 'rr' // type: rectangle, circle, text, line, polygon, star, roundRect (Phase 3 PR-16)
  x: number // x position
  y: number // y position
  w: number // width (variable in Phase 2)
  h: number // height (variable in Phase 2)
  rot?: number // rotation in degrees (Phase 2)
  txt?: string // text content (text objects only)
  f?: string // fill color (RGBA hex, Phase 3)
  s?: string // stroke color (RGBA hex, Phase 3, optional)
  sw?: number // stroke width (Phase 3, optional)
  // Phase 3 PR-16: Advanced shapes
  pts?: number[] // [x1, y1, x2, y2] for line shapes
  arr?: { s?: boolean; e?: boolean } // arrows for lines (s=start, e=end)
  sides?: number // sides for polygon/star (3-12)
  cr?: number // corner radius for rounded rectangles (0-50)
  // Phase 3 PR-17: Z-Index
  z?: number // z-index for layering (timestamp)
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

