// Firebase Realtime Database Types

/**
 * Canvas object stored in Firebase
 * Path: canvas/objects/{objectId}
 */
export interface CanvasObject {
  t: 'r' | 'c' | 't' // type: rectangle, circle, text
  x: number // x position
  y: number // y position
  w: number // width (fixed 100 for rect/circle)
  h: number // height (fixed 100 for rect/circle)
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
  sel: string | null // currently selected object ID (null if none)
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

