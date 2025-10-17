/**
 * Animation Types for Sprite Animation System
 */

/**
 * Single animation frame
 * Defines which region of a sprite sheet to display
 */
export interface AnimationFrame {
  x: number // crop x coordinate in sprite sheet
  y: number // crop y coordinate in sprite sheet
  width: number // frame width
  height: number // frame height
  duration?: number // optional frame-specific duration in ms (overrides global fps)
}

/**
 * Animation definition
 */
export interface Animation {
  id: string // unique animation identifier
  userId: string // owner user ID
  canvasId?: string // optional canvas scope (null = global to user)
  name: string // user-friendly name (e.g., "walk_left", "attack")
  spriteSheetId: string // reference to the sprite sheet asset
  frames: AnimationFrame[] // ordered list of frames
  fps: number // frames per second (1-60, default: 12)
  loop: boolean // whether to loop the animation
  createdAt: number // timestamp
  updatedAt: number // timestamp
}

/**
 * Animation playback state (client-side only)
 */
export interface AnimationPlaybackState {
  animationId: string
  currentFrameIndex: number // 0-based index of current frame
  isPlaying: boolean // whether animation is playing
  elapsedTime: number // time elapsed in current frame (ms)
  loopCount: number // number of times animation has looped
}

/**
 * Animation preset template
 * Pre-defined animation layouts for common sprite sheet formats
 */
export interface AnimationPreset {
  id: string
  name: string // e.g., "8-Direction Walk Cycle"
  description: string
  frameLayout: {
    columns: number
    rows: number
    framesPerAnimation: number
  }
  animations: Array<{
    name: string // e.g., "walk_up"
    startFrame: number
    frameCount: number
  }>
}

/**
 * Animated sprite object for canvas
 * Extends the base Shape type
 */
export interface AnimatedSprite {
  id: string
  type: 'animatedSprite' // special type for animated objects
  x: number
  y: number
  width: number // display width (can scale)
  height: number // display height (can scale)
  rotation?: number
  animationId: string // reference to animation
  playbackState: AnimationPlaybackState
  scale?: number // sprite scaling factor (1 = original size)
  flipX?: boolean // flip horizontally
  flipY?: boolean // flip vertically
  visible?: boolean
  opacity?: number // 0-1
  zIndex?: number
  layerId?: string
}

/**
 * Animation timeline state (for editor UI)
 */
export interface AnimationTimelineState {
  selectedFrameIndex: number | null
  playheadPosition: number // current playback position (0-1)
  isPlaying: boolean
  zoom: number // timeline zoom level (1 = normal)
  snapToGrid: boolean
}

/**
 * Frame selection in sprite sheet selector
 */
export interface FrameSelection {
  x: number
  y: number
  width: number
  height: number
  spriteSheetId: string
}

/**
 * Animation export format
 * For exporting to game engines
 */
export interface AnimationExport {
  name: string
  spriteSheet: string // file path or URL
  frames: Array<{
    x: number
    y: number
    w: number
    h: number
  }>
  frameRate: number
  loop: boolean
}

/**
 * Animation validation result
 */
export interface AnimationValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  issues?: Array<{
    frameIndex: number
    message: string
  }>
}

/**
 * Common animation presets
 */
export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'single_row',
    name: 'Single Row Animation',
    description: 'All frames in a single horizontal row',
    frameLayout: { columns: 8, rows: 1, framesPerAnimation: 8 },
    animations: [{ name: 'default', startFrame: 0, frameCount: 8 }]
  },
  {
    id: 'four_direction',
    name: '4-Direction Walk Cycle',
    description: 'Up, Left, Down, Right (4 frames each)',
    frameLayout: { columns: 4, rows: 4, framesPerAnimation: 4 },
    animations: [
      { name: 'walk_up', startFrame: 0, frameCount: 4 },
      { name: 'walk_left', startFrame: 4, frameCount: 4 },
      { name: 'walk_down', startFrame: 8, frameCount: 4 },
      { name: 'walk_right', startFrame: 12, frameCount: 4 }
    ]
  },
  {
    id: 'eight_direction',
    name: '8-Direction Walk Cycle',
    description: 'Up, UpRight, Right, DownRight, Down, DownLeft, Left, UpLeft',
    frameLayout: { columns: 4, rows: 8, framesPerAnimation: 4 },
    animations: [
      { name: 'walk_up', startFrame: 0, frameCount: 4 },
      { name: 'walk_up_right', startFrame: 4, frameCount: 4 },
      { name: 'walk_right', startFrame: 8, frameCount: 4 },
      { name: 'walk_down_right', startFrame: 12, frameCount: 4 },
      { name: 'walk_down', startFrame: 16, frameCount: 4 },
      { name: 'walk_down_left', startFrame: 20, frameCount: 4 },
      { name: 'walk_left', startFrame: 24, frameCount: 4 },
      { name: 'walk_up_left', startFrame: 28, frameCount: 4 }
    ]
  }
]


