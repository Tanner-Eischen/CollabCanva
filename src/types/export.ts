/**
 * Export Types for Game Engine Export System
 * Supports multiple export formats: Godot, Unity, Phaser, Generic JSON
 */

/**
 * Supported export formats
 */
export type ExportFormat = 'generic' | 'godot' | 'unity' | 'phaser'

/**
 * Export file (part of export result)
 */
export interface ExportFile {
  name: string // file name (e.g., 'scene.tscn', 'tilemap.json')
  content: string | Blob // file content
  mimeType: string // e.g., 'text/plain', 'application/json', 'image/png'
  path?: string // optional path within export (for nested files)
}

/**
 * Export validation result
 */
export interface ExportValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  unsupportedFeatures: string[] // features that won't be exported
}

/**
 * Export result returned by exporters
 */
export interface ExportResult {
  success: boolean
  files: ExportFile[]
  warnings: string[]
  instructions: string // markdown instructions for importing in target engine
  metadata: ExportMetadata
}

/**
 * Export metadata
 */
export interface ExportMetadata {
  format: ExportFormat
  exportedAt: number
  canvasId: string
  canvasName: string
  version: string
  objectCount: number
  hasAnimations: boolean
  hasTilemap: boolean
  exportOptions: ExportOptions
}

/**
 * Base export options (common to all formats)
 */
export interface ExportOptions {
  format: ExportFormat
  includeAssets: boolean // include referenced assets
  prettyPrint: boolean // format JSON output
  includeDocumentation: boolean // include README/instructions
}

/**
 * Godot-specific export options
 */
export interface GodotExportOptions extends ExportOptions {
  format: 'godot'
  targetVersion: '3.x' | '4.x'
  includePhysics: boolean // add collision shapes
  nodeNamingScheme: 'descriptive' | 'simple' // e.g., "PlayerSprite" vs "Sprite2D"
  pixelsPerUnit: number // scaling factor
  includeAutoTiles: boolean // export tilemap auto-tiling config
}

/**
 * Unity-specific export options
 */
export interface UnityExportOptions extends ExportOptions {
  format: 'unity'
  targetVersion: string // e.g., '2021.3', '2022.3'
  pixelsPerUnit: number // Unity sprite import setting
  includeColliders: boolean // add BoxCollider2D, etc.
  generateMaterials: boolean // create material assets
  sortingLayerName: string // default sorting layer
}

/**
 * Phaser-specific export options
 */
export interface PhaserExportOptions extends ExportOptions {
  format: 'phaser'
  physicsEngine: 'arcade' | 'matter' | 'none'
  includeLoaders: boolean // add Phaser.Scene preload code
  minifyJSON: boolean // minify JSON output
  generateAtlas: boolean // create texture atlas
}

/**
 * Generic JSON export options
 */
export interface GenericExportOptions extends ExportOptions {
  format: 'generic'
  includeSchema: boolean // include JSON schema definition
  exportPNGLayers: boolean // export each layer as PNG
  exportResolution: number // scale factor for PNG export (1 = original, 2 = 2x)
  coordinateSystem: 'top-left' | 'center' // coordinate origin
}

/**
 * Generic JSON export format (engine-agnostic)
 */
export interface GenericCanvasExport {
  version: string // export format version
  metadata: {
    canvasId: string
    canvasName: string
    width: number
    height: number
    exportedAt: string // ISO timestamp
    exportedBy: string // user ID
    coordinateSystem: 'top-left' | 'center'
  }
  layers: GenericLayer[]
  tilemap?: GenericTilemap
  assets: GenericAsset[]
  animations: GenericAnimation[]
}

/**
 * Generic layer export
 */
export interface GenericLayer {
  id: string
  name: string
  zIndex: number
  visible: boolean
  opacity: number
  objects: GenericObject[]
}

/**
 * Generic object export
 */
export interface GenericObject {
  id: string
  type: string // 'rectangle', 'circle', 'sprite', etc.
  x: number
  y: number
  width: number
  height: number
  rotation: number // degrees
  fill?: string // RGBA hex
  stroke?: string // RGBA hex
  strokeWidth?: number
  // Shape-specific properties
  text?: string
  fontFamily?: string
  fontSize?: number
  // Sprite-specific
  spriteSheetId?: string
  animationId?: string
  flipX?: boolean
  flipY?: boolean
  // Path/polygon
  points?: number[]
  closed?: boolean
  // Custom properties
  [key: string]: any
}

/**
 * Generic tilemap export
 */
export interface GenericTilemap {
  width: number // in tiles
  height: number // in tiles
  tileWidth: number // in pixels
  tileHeight: number // in pixels
  layers: GenericTilemapLayer[]
  tilesets: GenericTileset[]
}

/**
 * Generic tilemap layer
 */
export interface GenericTilemapLayer {
  id: string
  name: string
  data: (number | null)[][] // 2D array: data[y][x] = tile index (null = empty)
  visible: boolean
  opacity: number
}

/**
 * Generic tileset export
 */
export interface GenericTileset {
  id: string
  name: string
  imageUrl: string // relative path or data URL
  tileWidth: number
  tileHeight: number
  tileCount: number
  columns: number
  spacing: number
  margin: number
  autoTileMapping?: { [bitmask: number]: number }
}

/**
 * Generic asset reference
 */
export interface GenericAsset {
  id: string
  name: string
  type: 'image' | 'spritesheet' | 'tileset'
  url: string // relative path or data URL
  width: number
  height: number
  metadata?: {
    frameWidth?: number
    frameHeight?: number
    frameCount?: number
    tileWidth?: number
    tileHeight?: number
    [key: string]: any
  }
}

/**
 * Generic animation export
 */
export interface GenericAnimation {
  id: string
  name: string
  spriteSheetId: string
  fps: number
  loop: boolean
  frames: GenericAnimationFrame[]
}

/**
 * Generic animation frame
 */
export interface GenericAnimationFrame {
  x: number // crop x
  y: number // crop y
  width: number
  height: number
  duration?: number // ms, overrides fps
}

/**
 * Export progress tracking
 */
export interface ExportProgress {
  stage: 'validating' | 'collecting' | 'converting' | 'packaging' | 'complete' | 'error'
  progress: number // 0-100
  message: string
  warnings: string[]
  errors: string[]
}

/**
 * Exporter interface (implemented by each format exporter)
 */
export interface Exporter {
  format: ExportFormat
  name: string
  description: string
  
  /**
   * Validate canvas before export
   */
  validate(canvasId: string): Promise<ExportValidation>
  
  /**
   * Export canvas to target format
   */
  export(canvasId: string, options: ExportOptions, onProgress?: (progress: ExportProgress) => void): Promise<ExportResult>
  
  /**
   * Get supported features for this exporter
   */
  getSupportedFeatures(): string[]
  
  /**
   * Get default options for this exporter
   */
  getDefaultOptions(): ExportOptions
}

