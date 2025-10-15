/**
 * Tilemap Export Service
 * Exports tilemap data to JSON format
 * Supports both sparse and dense formats
 */

import type { TileData, TilemapMeta, ExportedTilemap } from '../types/tilemap'

/**
 * Export tilemap to JSON format
 * Uses sparse format by default (efficient for sparse maps)
 * 
 * @param tiles Map of tiles to export
 * @param meta Tilemap metadata
 * @param exportedBy User email/ID
 * @param format Export format ('sparse' or 'dense')
 * @returns Exported tilemap object
 */
export function exportTilemapJSON(
  tiles: Map<string, TileData>,
  meta: TilemapMeta,
  exportedBy: string,
  format: 'sparse' | 'dense' = 'sparse'
): ExportedTilemap {
  const exportedAt = new Date().toISOString()
  const tileCount = tiles.size
  
  if (format === 'sparse') {
    // Sparse format: { "x_y": tile, ... }
    const sparseTiles: Record<string, TileData> = {}
    tiles.forEach((tile, key) => {
      sparseTiles[key] = tile
    })
    
    return {
      version: 1,
      meta,
      format: 'sparse',
      tiles: sparseTiles,
      exported_at: exportedAt,
      exported_by: exportedBy,
      tile_count: tileCount,
    }
  } else {
    // Dense format: [[tile, tile, ...], [tile, tile, ...]]
    const denseTiles: (TileData | null)[][] = []
    
    // Initialize 2D array
    for (let y = 0; y < meta.height; y++) {
      denseTiles[y] = []
      for (let x = 0; x < meta.width; x++) {
        const key = `${x}_${y}`
        const tile = tiles.get(key)
        denseTiles[y][x] = tile || null
      }
    }
    
    return {
      version: 1,
      meta,
      format: 'dense',
      tiles: denseTiles as any, // TypeScript doesn't like the union type here
      exported_at: exportedAt,
      exported_by: exportedBy,
      tile_count: tileCount,
    }
  }
}

/**
 * Generate a filename for the export
 * @param canvasName Canvas name (optional)
 * @returns Filename with timestamp
 */
export function generateExportFilename(canvasName?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const name = canvasName ? `${canvasName}-tilemap` : 'tilemap'
  return `${name}-${timestamp}.json`
}

/**
 * Validate exported tilemap data
 * Checks for required fields and structure
 * 
 * @param data Exported tilemap data
 * @returns True if valid, false otherwise
 */
export function validateExportedData(data: any): data is ExportedTilemap {
  if (!data || typeof data !== 'object') {
    return false
  }
  
  // Check required fields
  if (typeof data.version !== 'number') return false
  if (!data.meta || typeof data.meta !== 'object') return false
  if (data.format !== 'sparse' && data.format !== 'dense') return false
  if (!data.tiles) return false
  
  // Check meta fields
  const meta = data.meta
  if (typeof meta.tileSize !== 'number') return false
  if (typeof meta.width !== 'number') return false
  if (typeof meta.height !== 'number') return false
  if (typeof meta.chunkSize !== 'number') return false
  if (!Array.isArray(meta.palette)) return false
  if (typeof meta.version !== 'number') return false
  
  return true
}

