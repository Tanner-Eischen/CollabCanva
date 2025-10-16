/**
 * Tileset Asset Manifest
 * Kenney.nl Micro Roguelike sprite assets configuration
 * 
 * License: CC0 (Public Domain)
 * Source: https://kenney.nl/assets/micro-roguelike
 */

/**
 * Auto-tile sprite set configuration
 */
export interface TilesetAsset {
  id: string
  name: string
  spriteSheet: string       // Path to sprite sheet image
  tileSize: number          // Size of each tile in pixels (8x8)
  variantCount: number      // Number of variants (16 for 4-neighbor bitmask)
  variantMap: number[]      // Maps bitmask (0-15) to sprite index
}

/**
 * Bitmask to sprite index mapping
 * 
 * 4-Neighbor Bitmask Format: NESW (North, East, South, West)
 * - 1 = neighbor of same type exists
 * - 0 = no neighbor or different type
 * 
 * Examples:
 * - 0000 (0):  Island tile (no neighbors)
 * - 1111 (15): Center tile (all neighbors match)
 * - 0101 (5):  Vertical corridor (East + West)
 * - 1010 (10): Horizontal corridor (North + South)
 * 
 * Sequential mapping: bitmask value directly maps to sprite index
 */
const SEQUENTIAL_VARIANT_MAP: number[] = [
  0,   // 0000 - Island
  1,   // 0001 - West edge
  2,   // 0010 - South edge
  3,   // 0011 - South-West corner
  4,   // 0100 - East edge
  5,   // 0101 - Vertical (E+W)
  6,   // 0110 - South-East corner
  7,   // 0111 - South T-junction
  8,   // 1000 - North edge
  9,   // 1001 - North-West corner
  10,  // 1010 - Horizontal (N+S)
  11,  // 1011 - West T-junction
  12,  // 1100 - North-East corner
  13,  // 1101 - North T-junction
  14,  // 1110 - East T-junction
  15,  // 1111 - Center (all neighbors)
]

/**
 * Kenney Micro Roguelike Tilesets
 * 
 * All tilesets use 16x16px tiles with 16 variants for 4-neighbor auto-tiling.
 * Sequential variant mapping provides optimal performance (O(1) lookup).
 */
export const KENNEY_TILESETS: Record<string, TilesetAsset> = {
  grass: {
    id: 'grass',
    name: 'Grass Terrain',
    spriteSheet: '/assets/tilesets/grass.png',
    tileSize: 16,
    variantCount: 16,
    variantMap: SEQUENTIAL_VARIANT_MAP,
  },
  
  water: {
    id: 'water',
    name: 'Water Liquid',
    spriteSheet: '/assets/tilesets/water.png',
    tileSize: 16,
    variantCount: 16,
    variantMap: SEQUENTIAL_VARIANT_MAP,
  },
  
  stone: {
    id: 'stone',
    name: 'Stone Walls',
    spriteSheet: '/assets/tilesets/stone.png',
    tileSize: 16,
    variantCount: 16,
    variantMap: SEQUENTIAL_VARIANT_MAP,
  },
  
  dirt: {
    id: 'dirt',
    name: 'Dirt Ground',
    spriteSheet: '/assets/tilesets/dirt.png',
    tileSize: 16,
    variantCount: 16,
    variantMap: SEQUENTIAL_VARIANT_MAP,
  },
}

/**
 * Get tileset asset by ID
 */
export function getTilesetAsset(id: string): TilesetAsset | undefined {
  return KENNEY_TILESETS[id]
}

/**
 * Get all available tileset IDs
 */
export function getAvailableTilesets(): string[] {
  return Object.keys(KENNEY_TILESETS)
}

/**
 * Check if a tileset exists
 */
export function hasTileset(id: string): boolean {
  return id in KENNEY_TILESETS
}

