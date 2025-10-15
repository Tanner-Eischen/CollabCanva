/**
 * Tilemap Import Service
 * Imports tilemap data from JSON format
 * Supports both sparse and dense formats with validation
 */

import type { TileData, TilemapMeta, ExportedTilemap } from '../types/tilemap'
import { validateExportedData } from './tilemapExport'

/**
 * Result of tilemap import operation
 */
export interface ImportResult {
  success: boolean
  tiles: Map<string, TileData>
  meta: TilemapMeta
  tileCount: number
  error?: string
}

/**
 * Import tilemap from JSON string
 * Validates structure and converts to internal format
 * 
 * @param jsonString JSON string to parse
 * @returns Import result with tiles and metadata or error
 */
export function importTilemapJSON(jsonString: string): ImportResult {
  try {
    // Parse JSON
    const data = JSON.parse(jsonString) as ExportedTilemap
    
    // Validate structure
    if (!validateExportedData(data)) {
      return {
        success: false,
        tiles: new Map(),
        meta: data.meta, // Return partial meta if available
        tileCount: 0,
        error: 'Invalid tilemap JSON structure',
      }
    }
    
    // Check version compatibility
    if (data.version !== 1) {
      return {
        success: false,
        tiles: new Map(),
        meta: data.meta,
        tileCount: 0,
        error: `Unsupported tilemap version: ${data.version}. Expected version 1.`,
      }
    }
    
    // Convert to internal format
    const tiles = new Map<string, TileData>()
    
    if (data.format === 'sparse') {
      // Sparse format: { "x_y": tile, ... }
      const sparseData = data.tiles as Record<string, TileData>
      Object.entries(sparseData).forEach(([key, tile]) => {
        tiles.set(key, tile)
      })
    } else if (data.format === 'dense') {
      // Dense format: [[tile, tile, ...], [tile, tile, ...]]
      const denseData = data.tiles as (TileData | null)[][]
      denseData.forEach((row, y) => {
        row.forEach((tile, x) => {
          if (tile !== null) {
            const key = `${x}_${y}`
            tiles.set(key, tile)
          }
        })
      })
    } else {
      return {
        success: false,
        tiles: new Map(),
        meta: data.meta,
        tileCount: 0,
        error: `Unknown tilemap format: ${data.format}`,
      }
    }
    
    return {
      success: true,
      tiles,
      meta: data.meta,
      tileCount: tiles.size,
    }
  } catch (error) {
    return {
      success: false,
      tiles: new Map(),
      meta: null as any, // Will cause error if accessed
      tileCount: 0,
      error: error instanceof Error ? error.message : 'Failed to parse JSON',
    }
  }
}

/**
 * Import tilemap from File object
 * Reads file and imports tilemap data
 * 
 * @param file File object to read
 * @returns Promise with import result
 */
export async function importTilemapFromFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text()
    return importTilemapJSON(text)
  } catch (error) {
    return {
      success: false,
      tiles: new Map(),
      meta: null as any,
      tileCount: 0,
      error: error instanceof Error ? error.message : 'Failed to read file',
    }
  }
}

/**
 * Validate tile data for import
 * Checks if tile has required fields
 * 
 * @param tile Tile data to validate
 * @returns True if valid
 */
export function validateTileData(tile: any): tile is TileData {
  if (!tile || typeof tile !== 'object') return false
  if (typeof tile.type !== 'string') return false
  if (typeof tile.color !== 'string') return false
  return true
}

