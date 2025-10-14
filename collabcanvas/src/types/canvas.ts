// Canvas-specific TypeScript Types

/**
 * 2D Position coordinates
 */
export interface Position {
  x: number
  y: number
}

/**
 * Viewport transformation state for pan and zoom
 */
export interface ViewportTransform {
  x: number // pan offset X
  y: number // pan offset Y
  scale: number // zoom scale (1 = 100%, 0.5 = 50%, 2 = 200%)
}

/**
 * Shape types supported by the canvas
 * Phase 3 PR-16: Added line, polygon, star, roundRect
 */
export type ShapeType = 'rectangle' | 'circle' | 'text' | 'line' | 'polygon' | 'star' | 'roundRect'

/**
 * Client-side representation of a canvas shape
 * This extends the Firebase CanvasObject with additional client-side properties
 */
export interface Shape {
  id: string // unique identifier (generated client-side)
  type: ShapeType // shape type
  x: number // x position
  y: number // y position
  width: number // width (now variable in Phase 2)
  height: number // height (now variable in Phase 2)
  rotation?: number // rotation in degrees (0-360) - Phase 2
  text?: string // text content (text shapes only)
  // Phase 3: Color properties (PR-15)
  fill: string // fill color (RGBA hex format, e.g., #3B82F6FF)
  stroke?: string // stroke color (RGBA hex format, optional)
  strokeWidth?: number // stroke width in pixels (0-20, optional)
  // Phase 3: Line shape properties (PR-16)
  points?: number[] // [x1, y1, x2, y2] for line shapes
  arrows?: { start?: boolean; end?: boolean } // arrow options for lines
  // Phase 3: Polygon/Star properties (PR-16)
  sides?: number // number of sides for polygon (3-12) or points for star (3-12)
  // Phase 3: Rounded rectangle properties (PR-16)
  cornerRadius?: number // corner radius for rounded rectangles (0-50px)
}

/**
 * Canvas configuration constants
 */
export interface CanvasConfig {
  width: number // canvas width
  height: number // canvas height
  gridSpacing: number // grid line spacing in pixels
  defaultShapeSize: number // default shape size (100px)
  defaultColor: string // default shape color (#3B82F6)
  minScale: number // minimum zoom scale
  maxScale: number // maximum zoom scale
}

/**
 * Tool types for the canvas toolbar
 * Phase 3 PR-16: Added line, polygon, star, roundRect
 */
export type ToolType = 'select' | 'rectangle' | 'circle' | 'text' | 'delete' | 'line' | 'polygon' | 'star' | 'roundRect'

/**
 * Canvas bounds for enforcing hard boundaries
 */
export interface CanvasBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/**
 * Default canvas configuration
 */
export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 5000,
  height: 5000,
  gridSpacing: 50,
  defaultShapeSize: 100,
  defaultColor: '#3B82F6', // blue
  minScale: 0.1, // 10% minimum zoom
  maxScale: 3, // 300% maximum zoom
}

/**
 * Default canvas bounds (5000x5000px)
 */
export const DEFAULT_CANVAS_BOUNDS: CanvasBounds = {
  minX: 0,
  minY: 0,
  maxX: 5000,
  maxY: 5000,
}

