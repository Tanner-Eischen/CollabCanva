/**
 * Auto-Tiling Utilities
 * 4-Neighbor Bitmask Algorithm for tile variant selection
 * 
 * Performance: All operations are O(1) constant time
 */

import type { TileData } from '../../types/tilemap'
import { coordToKey } from '../../types/tilemap'

/**
 * Neighbor check result for 4-directional neighbors
 */
export interface Neighbors {
  north: boolean
  east: boolean
  south: boolean
  west: boolean
}

/**
 * Tile update instruction with coordinates and variant
 */
export interface TileUpdate {
  x: number
  y: number
  variant: number
}

/**
 * Get neighboring tiles and check if they match the target type
 * 
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param tiles Map of all tiles (keyed by "x_y")
 * @param targetType The tile type to match against
 * @returns Boolean flags for each cardinal direction
 * 
 * @performance O(1) - Constant time (4 map lookups)
 */
export function getNeighbors(
  x: number,
  y: number,
  tiles: Map<string, TileData>,
  targetType: string
): Neighbors {
  // Check all 4 cardinal directions
  const northKey = coordToKey(x, y - 1)
  const eastKey = coordToKey(x + 1, y)
  const southKey = coordToKey(x, y + 1)
  const westKey = coordToKey(x - 1, y)
  
  const northTile = tiles.get(northKey)
  const eastTile = tiles.get(eastKey)
  const southTile = tiles.get(southKey)
  const westTile = tiles.get(westKey)
  
  return {
    north: northTile?.type === targetType,
    east: eastTile?.type === targetType,
    south: southTile?.type === targetType,
    west: westTile?.type === targetType,
  }
}

/**
 * Calculate 4-bit bitmask from neighbor flags
 * 
 * Bit positions: NESW (North, East, South, West)
 * - North (bit 3): weight 8
 * - East  (bit 2): weight 4
 * - South (bit 1): weight 2
 * - West  (bit 0): weight 1
 * 
 * @param neighbors Boolean flags for each direction
 * @returns Bitmask value (0-15)
 * 
 * @performance O(1) - Constant time arithmetic
 * 
 * @example
 * // Tile with north and south neighbors (vertical corridor)
 * calculateBitmask({ north: true, east: false, south: true, west: false })
 * // Returns: 10 (binary: 1010)
 */
export function calculateBitmask(neighbors: Neighbors): number {
  const n = neighbors.north ? 8 : 0  // Bit 3
  const e = neighbors.east ? 4 : 0   // Bit 2
  const s = neighbors.south ? 2 : 0  // Bit 1
  const w = neighbors.west ? 1 : 0   // Bit 0
  
  return n + e + s + w
}

/**
 * Map 4-neighbor bitmask (0-15) to 3×3 grid position (0-8)
 * 
 * 3×3 Grid Layout:
 * [0:TL] [1:TC] [2:TR]
 * [3:ML] [4:MC] [5:MR]
 * [6:BL] [7:BC] [8:BR]
 * 
 * Bitmask: NESW (North=8, East=4, South=2, West=1)
 */
const BITMASK_TO_3X3_MAP: number[] = [
  4, // 0000 (no neighbors) -> center
  5, // 0001 (W) -> middle-right
  1, // 0010 (S) -> top-center
  2, // 0011 (S+W) -> top-right
  3, // 0100 (E) -> middle-left
  4, // 0101 (E+W) -> center
  0, // 0110 (E+S) -> top-left
  1, // 0111 (E+S+W) -> top-center
  7, // 1000 (N) -> bottom-center
  8, // 1001 (N+W) -> bottom-right
  4, // 1010 (N+S) -> center (vertical)
  5, // 1011 (N+S+W) -> middle-right
  6, // 1100 (N+E) -> bottom-left
  7, // 1101 (N+E+W) -> bottom-center
  3, // 1110 (N+E+S) -> middle-left
  4, // 1111 (all neighbors) -> center
]

/**
 * Get sprite variant index from bitmask (mapped to 3×3 grid)
 * 
 * @param bitmask The 4-neighbor bitmask (0-15)
 * @returns Sprite variant index (0-8 for 3×3 grid)
 * 
 * @performance O(1) - Array index lookup
 */
export function getVariantForBitmask(bitmask: number): number {
  // Clamp bitmask to valid range
  const clampedBitmask = Math.max(0, Math.min(15, bitmask))
  
  // Map to 3×3 grid position
  return BITMASK_TO_3X3_MAP[clampedBitmask]
}

/**
 * Calculate auto-tile variant for a single tile
 * 
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param tiles Map of all tiles
 * @param tileType Type of the tile to calculate for
 * @returns Variant number (0-8 for 3x3 grid position)
 * 
 * @performance O(1) - Combines O(1) operations
 */
export function calculateTileVariant(
  x: number,
  y: number,
  tiles: Map<string, TileData>,
  tileType: string
): number {
  const neighbors = getNeighbors(x, y, tiles, tileType)
  const bitmask = calculateBitmask(neighbors)
  
  // Map bitmask (0-15) to 3x3 grid variant (0-8)
  return getVariantForBitmask(bitmask)
}

/**
 * Calculate auto-tile updates for a tile and its neighbors
 * 
 * When a tile is placed or removed, this tile AND its 4 neighbors
 * may need their variants recalculated.
 * 
 * @param x Tile X coordinate (center tile)
 * @param y Tile Y coordinate (center tile)
 * @param tiles Current tile map
 * @param newType Type being placed (or null if removing)
 * @returns Array of tile updates with new variants
 * 
 * @performance O(1) - Fixed 5 tiles maximum (center + 4 neighbors)
 */
export function calculateAutoTileUpdates(
  x: number,
  y: number,
  tiles: Map<string, TileData>,
  newType: string | null
): TileUpdate[] {
  const updates: TileUpdate[] = []
  
  // If placing a tile, calculate its variant
  if (newType !== null) {
    const variant = calculateTileVariant(x, y, tiles, newType)
    updates.push({ x, y, variant })
  }
  
  // Check all 4 neighbors and recalculate their variants if they exist
  const neighborPositions = [
    { x: x, y: y - 1 },  // North
    { x: x + 1, y: y },  // East
    { x: x, y: y + 1 },  // South
    { x: x - 1, y: y },  // West
  ]
  
  neighborPositions.forEach((pos) => {
    const key = coordToKey(pos.x, pos.y)
    const neighborTile = tiles.get(key)
    
    if (neighborTile) {
      // Recalculate variant for this neighbor
      const variant = calculateTileVariant(pos.x, pos.y, tiles, neighborTile.type)
      updates.push({ x: pos.x, y: pos.y, variant })
    }
  })
  
  return updates
}

/**
 * Calculate auto-tile updates for multiple tiles (batch operation)
 * 
 * Used for bulk operations like fill tool or paint strokes.
 * Ensures each tile is only updated once even if it's a neighbor
 * of multiple changed tiles.
 * 
 * @param changedTiles Array of tiles that changed
 * @param tiles Current tile map
 * @returns Deduplicated array of tile updates
 * 
 * @performance O(n) where n is number of changed tiles + their neighbors
 */
export function calculateBatchAutoTileUpdates(
  changedTiles: Array<{ x: number; y: number; type: string | null }>,
  tiles: Map<string, TileData>
): TileUpdate[] {
  const updateMap = new Map<string, TileUpdate>()
  
  // Calculate updates for each changed tile and its neighbors
  changedTiles.forEach(({ x, y, type }) => {
    const tileUpdates = calculateAutoTileUpdates(x, y, tiles, type)
    
    // Merge into update map (deduplicates)
    tileUpdates.forEach((update) => {
      const key = coordToKey(update.x, update.y)
      updateMap.set(key, update)
    })
  })
  
  return Array.from(updateMap.values())
}

/**
 * Get all 16 bitmask combinations with descriptions
 * Useful for debugging and visualization
 */
export const BITMASK_DESCRIPTIONS: Record<number, string> = {
  0:  'Island (no neighbors)',
  1:  'West edge',
  2:  'South edge',
  3:  'Southwest corner',
  4:  'East edge',
  5:  'Vertical corridor (E+W)',
  6:  'Southeast corner',
  7:  'South T-junction',
  8:  'North edge',
  9:  'Northwest corner',
  10: 'Horizontal corridor (N+S)',
  11: 'West T-junction',
  12: 'Northeast corner',
  13: 'North T-junction',
  14: 'East T-junction',
  15: 'Center (all neighbors)',
}

/**
 * Get human-readable description for a bitmask
 */
export function getBitmaskDescription(bitmask: number): string {
  return BITMASK_DESCRIPTIONS[bitmask] || 'Unknown'
}

/**
 * Debug: Get bitmask as binary string (NESW format)
 * 
 * @example
 * formatBitmask(10) // Returns: "1010" (N=1, E=0, S=1, W=0)
 */
export function formatBitmask(bitmask: number): string {
  return bitmask.toString(2).padStart(4, '0')
}

/**
 * Debug: Get detailed info about a tile's auto-tiling state
 */
export interface TileAutoTileInfo {
  neighbors: Neighbors
  bitmask: number
  bitmaskBinary: string
  variant: number
  description: string
}

/**
 * Get detailed auto-tiling information for debugging
 */
export function getTileAutoTileInfo(
  x: number,
  y: number,
  tiles: Map<string, TileData>,
  tileType: string
): TileAutoTileInfo {
  const neighbors = getNeighbors(x, y, tiles, tileType)
  const bitmask = calculateBitmask(neighbors)
  
  return {
    neighbors,
    bitmask,
    bitmaskBinary: formatBitmask(bitmask),
    variant: bitmask, // Sequential mapping
    description: getBitmaskDescription(bitmask),
  }
}

/**
 * Calculate auto-tile updates for procedurally generated terrain
 * Optimized for bulk terrain generation - processes entire tilemap at once
 * 
 * @param tiles Array of tiles with full TileData
 * @param tileMap Temporary map containing all tiles (for neighbor lookup)
 * @returns Array of variant updates
 * 
 * @performance O(n) where n is number of tiles
 */
export function calculateProceduralAutoTileUpdates(
  tiles: Array<{ x: number; y: number; tile: TileData }>,
  tileMap: Map<string, TileData>
): TileUpdate[] {
  const updates: TileUpdate[] = []
  
  // Calculate variant for each tile based on same-type neighbors
  for (const { x, y, tile } of tiles) {
    const variant = calculateTileVariant(x, y, tileMap, tile.type)
    updates.push({ x, y, variant })
  }
  
  return updates
}

