/**
 * Tile Fill Service
 * Implements flood-fill algorithm for tilemap editor
 * Uses breadth-first search (BFS) for 4-directional fill
 */

import type { TileData } from '../../types/tilemap'
import { coordToKey } from '../../types/tilemap'

/**
 * Result of a flood fill operation
 */
export interface FillResult {
  tiles: Array<{ x: number; y: number; tile: TileData }>
  count: number
  limitReached: boolean
}

/**
 * Flood fill algorithm using BFS
 * Fills contiguous tiles of the same type with a new tile
 * 
 * @param tiles Current tilemap state
 * @param startX Starting X coordinate
 * @param startY Starting Y coordinate
 * @param fillTile Tile to fill with
 * @param maxWidth Maximum width of tilemap (bounds checking)
 * @param maxHeight Maximum height of tilemap (bounds checking)
 * @param maxTiles Safety limit to prevent infinite fills (default: 1000)
 * @returns Array of tiles to change and whether limit was reached
 */
export function floodFill(
  tiles: Map<string, TileData>,
  startX: number,
  startY: number,
  fillTile: TileData,
  maxWidth: number,
  maxHeight: number,
  maxTiles: number = 1000
): FillResult {
  // Get the tile at the starting position
  const startKey = coordToKey(startX, startY)
  const startTile = tiles.get(startKey)
  
  // If there's no tile at start position, treat it as empty
  const targetType = startTile?.type || 'empty'
  const targetColor = startTile?.color || ''
  
  // If trying to fill with the same type/color, return empty result
  if (targetType === fillTile.type && targetColor === fillTile.color) {
    return { tiles: [], count: 0, limitReached: false }
  }
  
  // BFS queue and visited set
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }]
  const visited = new Set<string>()
  const result: Array<{ x: number; y: number; tile: TileData }> = []
  
  // 4-directional neighbors (up, down, left, right)
  const directions = [
    { dx: 0, dy: -1 },  // up
    { dx: 0, dy: 1 },   // down
    { dx: -1, dy: 0 },  // left
    { dx: 1, dy: 0 },   // right
  ]
  
  let limitReached = false
  
  // BFS loop
  while (queue.length > 0 && result.length < maxTiles) {
    const current = queue.shift()!
    const currentKey = coordToKey(current.x, current.y)
    
    // Skip if already visited
    if (visited.has(currentKey)) {
      continue
    }
    
    // Mark as visited
    visited.add(currentKey)
    
    // Check bounds
    if (current.x < 0 || current.x >= maxWidth || current.y < 0 || current.y >= maxHeight) {
      continue
    }
    
    // Check if this tile matches the target type/color
    const currentTile = tiles.get(currentKey)
    const currentType = currentTile?.type || 'empty'
    const currentColor = currentTile?.color || ''
    
    if (currentType !== targetType || currentColor !== targetColor) {
      continue
    }
    
    // Add this tile to the result
    result.push({
      x: current.x,
      y: current.y,
      tile: fillTile,
    })
    
    // Add neighbors to queue
    for (const dir of directions) {
      const nextX = current.x + dir.dx
      const nextY = current.y + dir.dy
      const nextKey = coordToKey(nextX, nextY)
      
      if (!visited.has(nextKey)) {
        queue.push({ x: nextX, y: nextY })
      }
    }
  }
  
  // Check if we hit the limit
  if (result.length >= maxTiles) {
    limitReached = true
  }
  
  return {
    tiles: result,
    count: result.length,
    limitReached,
  }
}

/**
 * Simple rectangular fill (for marquee fill tool in the future)
 * Fills a rectangular region with a tile
 * 
 * @param startX Starting X coordinate
 * @param startY Starting Y coordinate
 * @param endX Ending X coordinate
 * @param endY Ending Y coordinate
 * @param fillTile Tile to fill with
 * @returns Array of tiles to fill
 */
export function rectangularFill(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  fillTile: TileData
): Array<{ x: number; y: number; tile: TileData }> {
  const result: Array<{ x: number; y: number; tile: TileData }> = []
  
  // Ensure start is top-left, end is bottom-right
  const minX = Math.min(startX, endX)
  const maxX = Math.max(startX, endX)
  const minY = Math.min(startY, endY)
  const maxY = Math.max(startY, endY)
  
  // Fill rectangle
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      result.push({ x, y, tile: fillTile })
    }
  }
  
  return result
}

