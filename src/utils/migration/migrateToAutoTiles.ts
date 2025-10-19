/**
 * Auto-Tiles Migration Utility
 * Upgrades existing tilemaps to include auto-tile variants
 */

import { ref, get, update } from 'firebase/database'
import { db } from '../../services/firebase'
import { calculateTileVariant } from '../tilemap/autoTile'
import { tilesetRegistry } from '../../services/tilemap/tilesetRegistry'
import type { TileData, FirebaseTileData } from '../../types/tilemap'
import { coordToKey, keyToCoord, coordToChunk, chunkToKey } from '../../types/tilemap'

/**
 * Migration progress callback
 */
export interface MigrationProgress {
  phase: 'scanning' | 'calculating' | 'writing' | 'complete' | 'error'
  tilesProcessed: number
  totalTiles: number
  chunksProcessed: number
  totalChunks: number
  message: string
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean
  tilesUpdated: number
  chunksUpdated: number
  tilesSkipped: number
  errors: string[]
  durationMs: number
}

/**
 * Check if a tilemap needs migration
 * 
 * @param canvasId Canvas/tilemap ID
 * @returns True if migration needed (has tiles without variants)
 */
export async function needsMigration(canvasId: string): Promise<boolean> {
  try {
    // Check first chunk for tiles without variants
    const chunksRef = ref(db, `tilemaps/${canvasId}/chunks`)
    const snapshot = await get(chunksRef)
    
    if (!snapshot.exists()) {
      return false // No tiles at all
    }
    
    const chunks = snapshot.val()
    
    // Sample first few chunks
    const chunkKeys = Object.keys(chunks).slice(0, 3)
    
    for (const chunkKey of chunkKeys) {
      const tiles = chunks[chunkKey].tiles
      
      if (!tiles) continue
      
      // Check if any tiles are missing variants
      for (const tileKey in tiles) {
        const tile: FirebaseTileData = tiles[tileKey]
        
        // If tile type has sprite assets but no variant, needs migration
        if (tilesetRegistry.hasSpriteSync(tile.t) && tile.v === undefined) {
          return true
        }
      }
    }
    
    return false
  } catch (error) {
    console.error('Failed to check migration status:', error)
    return false
  }
}

/**
 * Migrate a tilemap to auto-tiles (add variants to all tiles)
 * 
 * @param canvasId Canvas/tilemap ID
 * @param chunkSize Chunk size (default: 16)
 * @param onProgress Progress callback
 * @param dryRun If true, calculate but don't write changes
 * @returns Migration result
 */
export async function migrateCanvas(
  canvasId: string,
  chunkSize: number = 16,
  onProgress?: (progress: MigrationProgress) => void,
  dryRun: boolean = false
): Promise<MigrationResult> {
  const startTime = Date.now()
  const errors: string[] = []
  
  try {
    // Phase 1: Load all tiles from Firebase
    onProgress?.({
      phase: 'scanning',
      tilesProcessed: 0,
      totalTiles: 0,
      chunksProcessed: 0,
      totalChunks: 0,
      message: 'Loading tilemap data...',
    })
    
    const chunksRef = ref(db, `tilemaps/${canvasId}/chunks`)
    const snapshot = await get(chunksRef)
    
    if (!snapshot.exists()) {
      return {
        success: true,
        tilesUpdated: 0,
        chunksUpdated: 0,
        tilesSkipped: 0,
        errors: ['No tiles found'],
        durationMs: Date.now() - startTime,
      }
    }
    
    const chunks = snapshot.val()
    const chunkKeys = Object.keys(chunks)
    
    // Phase 2: Build tile map for variant calculation
    onProgress?.({
      phase: 'calculating',
      tilesProcessed: 0,
      totalTiles: 0,
      chunksProcessed: 0,
      totalChunks: chunkKeys.length,
      message: 'Building tile map...',
    })
    
    const tileMap = new Map<string, TileData>()
    let totalTileCount = 0
    
    // Load all tiles into memory map
    chunkKeys.forEach((chunkKey) => {
      const tiles = chunks[chunkKey].tiles
      if (!tiles) return
      
      const { cx, cy } = (() => {
        const [x, y] = chunkKey.split('_').map(Number)
        return { cx: x, cy: y }
      })()
      
      Object.keys(tiles).forEach((tileKey) => {
        const firebaseTile: FirebaseTileData = tiles[tileKey]
        const { x: lx, y: ly } = keyToCoord(tileKey)
        
        // Convert to global coordinates
        const globalX = cx * chunkSize + lx
        const globalY = cy * chunkSize + ly
        const globalKey = coordToKey(globalX, globalY)
        
        // Decompress tile
        const tile: TileData = {
          type: firebaseTile.t,
          color: firebaseTile.c,
          variant: firebaseTile.v,
        }
        
        tileMap.set(globalKey, tile)
        totalTileCount++
      })
    })
    
    // Phase 3: Calculate variants for all tiles
    onProgress?.({
      phase: 'calculating',
      tilesProcessed: 0,
      totalTiles: totalTileCount,
      chunksProcessed: 0,
      totalChunks: chunkKeys.length,
      message: 'Calculating variants...',
    })
    
    const variantUpdates: Record<string, number> = {}
    let tilesProcessed = 0
    let tilesUpdated = 0
    let tilesSkipped = 0
    
    tileMap.forEach((tile, key) => {
      const { x, y } = keyToCoord(key)
      
      // Only update tiles that:
      // 1. Have sprite assets available
      // 2. Don't already have a variant
      if (tilesetRegistry.hasSpriteSync(tile.type) && tile.variant === undefined) {
        const variant = calculateTileVariant(x, y, tileMap, tile.type)
        
        // Build Firebase path
        const chunk = coordToChunk(x, y, chunkSize)
        const chunkKey = chunkToKey(chunk.cx, chunk.cy)
        const tileKey = coordToKey(chunk.lx, chunk.ly)
        const firebasePath = `chunks/${chunkKey}/tiles/${tileKey}/v`
        
        variantUpdates[firebasePath] = variant
        tilesUpdated++
      } else {
        tilesSkipped++
      }
      
      tilesProcessed++
      
      if (tilesProcessed % 100 === 0) {
        onProgress?.({
          phase: 'calculating',
          tilesProcessed,
          totalTiles: totalTileCount,
          chunksProcessed: 0,
          totalChunks: chunkKeys.length,
          message: `Calculated variants for ${tilesProcessed}/${totalTileCount} tiles...`,
        })
      }
    })
    
    // Phase 4: Write variants to Firebase
    if (!dryRun && tilesUpdated > 0) {
      onProgress?.({
        phase: 'writing',
        tilesProcessed: totalTileCount,
        totalTiles: totalTileCount,
        chunksProcessed: 0,
        totalChunks: chunkKeys.length,
        message: 'Writing variants to Firebase...',
      })
      
      const tilemapRef = ref(db, `tilemaps/${canvasId}`)
      await update(tilemapRef, variantUpdates)
    }
    
    // Complete
    const durationMs = Date.now() - startTime
    
    onProgress?.({
      phase: 'complete',
      tilesProcessed: totalTileCount,
      totalTiles: totalTileCount,
      chunksProcessed: chunkKeys.length,
      totalChunks: chunkKeys.length,
      message: `Migration complete! Updated ${tilesUpdated} tiles in ${(durationMs / 1000).toFixed(1)}s`,
    })
    
    return {
      success: true,
      tilesUpdated,
      chunksUpdated: chunkKeys.length,
      tilesSkipped,
      errors,
      durationMs,
    }
    
  } catch (error) {
    const errorMsg = `Migration failed: ${error}`
    console.error(errorMsg)
    errors.push(errorMsg)
    
    onProgress?.({
      phase: 'error',
      tilesProcessed: 0,
      totalTiles: 0,
      chunksProcessed: 0,
      totalChunks: 0,
      message: errorMsg,
    })
    
    return {
      success: false,
      tilesUpdated: 0,
      chunksUpdated: 0,
      tilesSkipped: 0,
      errors,
      durationMs: Date.now() - startTime,
    }
  }
}

/**
 * Get migration preview (dry run)
 */
export async function getMigrationPreview(
  canvasId: string,
  chunkSize: number = 16
): Promise<{ tilesNeedingMigration: number; totalTiles: number }> {
  const result = await migrateCanvas(canvasId, chunkSize, undefined, true)
  
  return {
    tilesNeedingMigration: result.tilesUpdated,
    totalTiles: result.tilesUpdated + result.tilesSkipped,
  }
}

