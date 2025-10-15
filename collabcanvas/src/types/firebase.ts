// Firebase Realtime Database Types

/**
 * Canvas object stored in Firebase
 * Path: canvas/objects/{objectId}
 */
export interface CanvasObject {
  t: 'r' | 'c' | 't' | 'l' | 'pg' | 'st' | 'rr' | 'p' // type: rectangle, circle, text, line, polygon, star, roundRect, path (Phase 3 PR-16, Phase 4 PR-21)
  x: number // x position
  y: number // y position
  w: number // width (variable in Phase 2)
  h: number // height (variable in Phase 2)
  rot?: number // rotation in degrees (Phase 2)
  txt?: string // text content (text objects only)
  // Phase 5 PR-25: Text formatting properties
  ff?: string // fontFamily (text only)
  fs?: number // fontSize (text only)
  fw?: 'normal' | 'bold' // fontWeight (text only)
  fst?: 'normal' | 'italic' // fontStyle (text only)
  ta?: 'left' | 'center' | 'right' // textAlign (text only)
  td?: '' | 'underline' | 'line-through' // textDecoration (text only)
  f?: string // fill color (RGBA hex, Phase 3)
  s?: string // stroke color (RGBA hex, Phase 3, optional)
  sw?: number // stroke width (Phase 3, optional)
  // Phase 3 PR-16: Advanced shapes
  pts?: number[] // [x1, y1, x2, y2] for line shapes, or path coordinates for freehand drawing
  arr?: { s?: boolean; e?: boolean } // arrows for lines (s=start, e=end)
  sides?: number // sides for polygon/star (3-12)
  cr?: number // corner radius for rounded rectangles (0-50)
  // Phase 3 PR-17: Z-Index
  z?: number // z-index for layering (timestamp)
  // Phase 4 PR-21: Path properties
  ten?: number // tension for path smoothing (0 = sharp, 0.5 = smooth)
  cls?: boolean // closed path
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

