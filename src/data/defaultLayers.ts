/**
 * Default Layer Definitions
 * Provides pre-configured layers for common game development scenarios
 */

import type { TileLayerMeta } from '../types/tileLayer'

// ============================================================================
// Default Layer Configurations
// ============================================================================

/**
 * Default ground layer - the main playable surface
 * Z-index: 0 (base layer)
 * No parallax (moves with camera normally)
 */
export const DEFAULT_GROUND_LAYER: TileLayerMeta = {
  id: 'ground',
  name: 'Ground',
  z: 0,
  visible: true,
  opacity: 1,
  description: 'Main ground layer for terrain and platforms',
  locked: false,
}

/**
 * Default props layer - decorative objects and interactive elements
 * Z-index: 10 (above ground)
 * No parallax (moves with camera normally)
 */
export const DEFAULT_PROPS_LAYER: TileLayerMeta = {
  id: 'props',
  name: 'Props',
  z: 10,
  visible: true,
  opacity: 1,
  description: 'Decorative objects, foliage, and interactive elements',
  locked: false,
}

/**
 * Default collision layer - invisible collision detection
 * Z-index: 20 (above props)
 * No parallax (moves with camera normally)
 */
export const DEFAULT_COLLISION_LAYER: TileLayerMeta = {
  id: 'collision',
  name: 'Collision',
  z: 20,
  visible: false, // Usually invisible during gameplay
  opacity: 0.5,
  description: 'Collision boundaries and invisible walls',
  locked: false,
}

/**
 * Default decals layer - surface details and effects
 * Z-index: 5 (between ground and props)
 * No parallax (moves with camera normally)
 */
export const DEFAULT_DECALS_LAYER: TileLayerMeta = {
  id: 'decals',
  name: 'Decals',
  z: 5,
  visible: true,
  opacity: 1,
  description: 'Surface details, cracks, stains, and overlays',
  locked: false,
}

/**
 * Background layer with parallax - distant scenery
 * Z-index: -10 (behind everything)
 * Parallax: 0.5x (moves slower for depth effect)
 */
export const DEFAULT_BACKGROUND_LAYER: TileLayerMeta = {
  id: 'background',
  name: 'Background',
  z: -10,
  visible: true,
  parallax: { x: 0.5, y: 0.5 },
  opacity: 0.8,
  description: 'Distant background scenery with parallax scrolling',
  locked: false,
}

/**
 * Far background layer - sky and distant mountains
 * Z-index: -20 (farthest back)
 * Parallax: 0.3x (moves much slower for maximum depth)
 */
export const DEFAULT_FAR_BACKGROUND_LAYER: TileLayerMeta = {
  id: 'far-background',
  name: 'Far Background',
  z: -20,
  visible: true,
  parallax: { x: 0.3, y: 0.3 },
  opacity: 0.6,
  description: 'Farthest background layer (sky, distant mountains)',
  locked: false,
}

/**
 * Foreground layer with parallax - close objects
 * Z-index: 30 (in front of everything)
 * Parallax: 1.5x (moves faster for depth effect)
 */
export const DEFAULT_FOREGROUND_LAYER: TileLayerMeta = {
  id: 'foreground',
  name: 'Foreground',
  z: 30,
  visible: true,
  parallax: { x: 1.5, y: 1.5 },
  opacity: 0.9,
  description: 'Foreground elements with parallax (leaves, branches)',
  locked: false,
}

// ============================================================================
// Layer Presets
// ============================================================================

/**
 * Basic preset - just ground and props
 * Ideal for simple platformers or top-down games
 */
export const BASIC_LAYERS: TileLayerMeta[] = [
  DEFAULT_GROUND_LAYER,
  DEFAULT_PROPS_LAYER,
]

/**
 * Standard preset - ground, props, collision, and decals
 * Recommended for most 2D games
 */
export const STANDARD_LAYERS: TileLayerMeta[] = [
  DEFAULT_GROUND_LAYER,
  DEFAULT_DECALS_LAYER,
  DEFAULT_PROPS_LAYER,
  DEFAULT_COLLISION_LAYER,
]

/**
 * Full preset - all layers including parallax backgrounds and foreground
 * For games with depth and visual richness
 */
export const FULL_LAYERS: TileLayerMeta[] = [
  DEFAULT_FAR_BACKGROUND_LAYER,
  DEFAULT_BACKGROUND_LAYER,
  DEFAULT_GROUND_LAYER,
  DEFAULT_DECALS_LAYER,
  DEFAULT_PROPS_LAYER,
  DEFAULT_COLLISION_LAYER,
  DEFAULT_FOREGROUND_LAYER,
]

/**
 * Platform preset - optimized for platformer games
 */
export const PLATFORM_LAYERS: TileLayerMeta[] = [
  DEFAULT_BACKGROUND_LAYER,
  DEFAULT_GROUND_LAYER,
  DEFAULT_PROPS_LAYER,
  DEFAULT_FOREGROUND_LAYER,
]

// ============================================================================
// Default Export
// ============================================================================

/**
 * Default layer configuration (standard preset)
 * Used when initializing a new tilemap
 */
export const DEFAULT_LAYERS = STANDARD_LAYERS

/**
 * Get default layers based on preset name
 */
export function getLayerPreset(preset: 'basic' | 'standard' | 'full' | 'platform'): TileLayerMeta[] {
  switch (preset) {
    case 'basic':
      return BASIC_LAYERS
    case 'standard':
      return STANDARD_LAYERS
    case 'full':
      return FULL_LAYERS
    case 'platform':
      return PLATFORM_LAYERS
    default:
      return STANDARD_LAYERS
  }
}

/**
 * Create a legacy fallback ground layer for backward compatibility
 * Used when loading old tilemaps without layer information
 */
export function createLegacyGroundLayer(): TileLayerMeta {
  return {
    ...DEFAULT_GROUND_LAYER,
    description: 'Legacy ground layer (auto-created for backward compatibility)',
  }
}

