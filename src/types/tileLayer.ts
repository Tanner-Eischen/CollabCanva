/**
 * Tile Layer Type Definitions
 * Defines the structure for multi-layer tilemap system
 */

// ============================================================================
// Layer Configuration
// ============================================================================

/**
 * Parallax offset configuration for a layer
 * Used to create depth effect by moving layers at different speeds
 */
export interface ParallaxConfig {
  /** Horizontal parallax factor (0 = no movement, 1 = normal, <1 = slower, >1 = faster) */
  x: number
  /** Vertical parallax factor (0 = no movement, 1 = normal, <1 = slower, >1 = faster) */
  y: number
}

/**
 * Metadata for a single tile layer
 * Supports z-ordering, visibility toggles, and parallax scrolling
 */
export interface TileLayerMeta {
  /** Unique identifier for the layer */
  id: string
  
  /** Human-readable layer name */
  name: string
  
  /** Z-index for rendering order (lower = background, higher = foreground) */
  z: number
  
  /** Whether the layer is currently visible */
  visible: boolean
  
  /** Optional parallax scrolling configuration for depth effect */
  parallax?: ParallaxConfig
  
  /** Optional layer opacity (0-1, default: 1) */
  opacity?: number
  
  /** Optional layer description for documentation */
  description?: string
  
  /** Whether the layer is locked from editing (default: false) */
  locked?: boolean
}

// ============================================================================
// Layer Type Presets
// ============================================================================

/**
 * Common layer types used in game development
 */
export const LayerType = {
  GROUND: 'ground',
  PROPS: 'props',
  COLLISION: 'collision',
  DECALS: 'decals',
  BACKGROUND: 'background',
  FOREGROUND: 'foreground',
  LIGHTING: 'lighting',
  ENTITIES: 'entities',
} as const

export type LayerTypeValue = (typeof LayerType)[keyof typeof LayerType]

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate that a layer has all required fields
 */
export function isValidLayer(layer: any): layer is TileLayerMeta {
  return (
    typeof layer === 'object' &&
    typeof layer.id === 'string' &&
    typeof layer.name === 'string' &&
    typeof layer.z === 'number' &&
    typeof layer.visible === 'boolean'
  )
}

/**
 * Validate parallax configuration
 */
export function isValidParallax(parallax: any): parallax is ParallaxConfig {
  return (
    typeof parallax === 'object' &&
    typeof parallax.x === 'number' &&
    typeof parallax.y === 'number'
  )
}

/**
 * Sort layers by z-index (ascending order)
 */
export function sortLayersByZ(layers: TileLayerMeta[]): TileLayerMeta[] {
  return [...layers].sort((a, b) => a.z - b.z)
}

/**
 * Get visible layers sorted by z-index
 */
export function getVisibleLayers(layers: TileLayerMeta[]): TileLayerMeta[] {
  return sortLayersByZ(layers.filter(layer => layer.visible))
}

/**
 * Find layer by ID
 */
export function findLayerById(layers: TileLayerMeta[], id: string): TileLayerMeta | undefined {
  return layers.find(layer => layer.id === id)
}

/**
 * Apply parallax offset to viewport position
 * @param viewportPos Original viewport position (x or y)
 * @param parallaxFactor Parallax factor from layer config
 * @returns Adjusted position for parallax effect
 */
export function applyParallax(viewportPos: number, parallaxFactor: number): number {
  // Factor of 1 = normal movement (no parallax)
  // Factor < 1 = slower movement (background effect)
  // Factor > 1 = faster movement (foreground effect)
  return viewportPos * parallaxFactor
}

