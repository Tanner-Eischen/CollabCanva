/**
 * Tilemap Sync Service
 * Handles Firebase CRUD operations for tilemap data with chunked structure
 */

import { ref, set, update, remove, onValue, off, serverTimestamp } from 'firebase/database'
import { db } from './firebase'
import type {
  TileData,
  TilemapMeta,
  FirebaseTileData,
  FirebaseTilemapMeta,
  ChunkCoordinate,
  coordToKey,
  chunkToKey,
  coordToChunk,
  keyToCoord,
} from '../types/tilemap'
import {
  coordToKey as _coordToKey,
  chunkToKey as _chunkToKey,
  coordToChunk as _coordToChunk,
  keyToCoord as _keyToCoord,
} from '../types/tilemap'

// Re-export coordinate helpers
export type { coordToKey, chunkToKey, coordToChunk, keyToCoord }

// ============================================================================
// Compression/Decompression
// ============================================================================

/**
 * Compress tile data for Firebase storage
 * Uses short keys to reduce bandwidth: t (type), c (color), v (variant), by (by user), ts (timestamp)
 */
function compressTile(tile: TileData, userId: string): FirebaseTileData {
  const compressed: FirebaseTileData = {
    t: tile.type,
    c: tile.color,
    by: userId,
    ts: Date.now(), // Will be replaced by serverTimestamp in actual write
  }
  
  // Add variant if present (auto-tiling)
  if (tile.variant !== undefined) {
    compressed.v = tile.variant
  }
  
  return compressed
}

/**
 * Decompress Firebase tile data to client format
 */
function decompressTile(data: FirebaseTileData): TileData {
  const tile: TileData = {
    type: data.t,
    color: data.c,
  }
  
  // Include variant if present (auto-tiling)
  if (data.v !== undefined) {
    tile.variant = data.v
  }
  
  // Include metadata if present
  if (data.by || data.ts) {
    tile.metadata = {}
    if (data.by) tile.metadata.lastEditedBy = data.by
    if (data.ts) tile.metadata.lastEditedAt = data.ts
  }
  
  return tile
}

// ============================================================================
// Metadata Operations
// ============================================================================

/**
 * Get tilemap metadata from Firebase
 */
export async function getMeta(canvasId: string): Promise<TilemapMeta | null> {
  try {
    const metaRef = ref(db, `tilemaps/${canvasId}/meta`)
    
    return new Promise((resolve) => {
      onValue(
        metaRef,
        (snapshot) => {
          const data = snapshot.val() as FirebaseTilemapMeta | null
          resolve(data)
        },
        { onlyOnce: true }
      )
    })
  } catch (error) {
    console.error('Failed to get tilemap meta:', error)
    return null
  }
}

/**
 * Set or update tilemap metadata in Firebase
 */
export async function setMeta(canvasId: string, meta: Partial<TilemapMeta>): Promise<void> {
  try {
    const metaRef = ref(db, `tilemaps/${canvasId}/meta`)
    await update(metaRef, meta)
  } catch (error) {
    console.error('Failed to set tilemap meta:', error)
    throw error
  }
}

/**
 * Initialize tilemap with default metadata
 */
export async function initializeTilemap(canvasId: string, meta: TilemapMeta): Promise<void> {
  try {
    const metaRef = ref(db, `tilemaps/${canvasId}/meta`)
    await set(metaRef, meta)
  } catch (error) {
    console.error('Failed to initialize tilemap:', error)
    throw error
  }
}

// ============================================================================
// Tile Operations
// ============================================================================

/**
 * Set a single tile in Firebase with chunk routing
 */
export async function setTile(
  canvasId: string,
  x: number,
  y: number,
  tile: TileData,
  userId: string,
  chunkSize: number = 16
): Promise<void> {
  try {
    // Calculate chunk coordinates
    const chunk = _coordToChunk(x, y, chunkSize)
    const chunkKey = _chunkToKey(chunk.cx, chunk.cy)
    const tileKey = _coordToKey(chunk.lx, chunk.ly)
    
    // Build Firebase path
    const tilePath = `tilemaps/${canvasId}/chunks/${chunkKey}/tiles/${tileKey}`
    const tileRef = ref(db, tilePath)
    
    // Compress and write
    const compressed = compressTile(tile, userId)
    // Use server timestamp for consistency
    const tileData = {
      ...compressed,
      ts: serverTimestamp() as any,
    }
    
    await set(tileRef, tileData)
  } catch (error) {
    console.error('Failed to set tile:', error)
    throw error
  }
}

/**
 * Set multiple tiles in a single atomic operation (for fill tool)
 */
export async function setTiles(
  canvasId: string,
  tiles: Array<{ x: number; y: number; tile: TileData }>,
  userId: string,
  chunkSize: number = 16
): Promise<void> {
  try {
    // Build flat update object for atomic write
    const firebaseUpdates: Record<string, FirebaseTileData> = {}
    
    tiles.forEach(({ x, y, tile }) => {
      const chunk = _coordToChunk(x, y, chunkSize)
      const chunkKey = _chunkToKey(chunk.cx, chunk.cy)
      const tileKey = _coordToKey(chunk.lx, chunk.ly)
      const tilePath = `tilemaps/${canvasId}/chunks/${chunkKey}/tiles/${tileKey}`
      
      const compressed = compressTile(tile, userId)
      firebaseUpdates[tilePath] = {
        ...compressed,
        ts: Date.now(), // Use local timestamp for bulk operations
      }
    })
    
    // Perform atomic multi-path update
    const dbRef = ref(db)
    await update(dbRef, firebaseUpdates)
  } catch (error) {
    console.error('Failed to set tiles:', error)
    throw error
  }
}

/**
 * Delete a single tile from Firebase
 */
export async function deleteTile(
  canvasId: string,
  x: number,
  y: number,
  chunkSize: number = 16
): Promise<void> {
  try {
    // Calculate chunk coordinates
    const chunk = _coordToChunk(x, y, chunkSize)
    const chunkKey = _chunkToKey(chunk.cx, chunk.cy)
    const tileKey = _coordToKey(chunk.lx, chunk.ly)
    
    // Build Firebase path and delete
    const tilePath = `tilemaps/${canvasId}/chunks/${chunkKey}/tiles/${tileKey}`
    const tileRef = ref(db, tilePath)
    
    await remove(tileRef)
  } catch (error) {
    console.error('Failed to delete tile:', error)
    throw error
  }
}

/**
 * Delete multiple tiles in a single atomic operation
 */
export async function deleteTiles(
  canvasId: string,
  tiles: Array<{ x: number; y: number }>,
  chunkSize: number = 16
): Promise<void> {
  try {
    // Build flat update object with null values (deletes in Firebase)
    const firebaseUpdates: Record<string, null> = {}
    
    tiles.forEach(({ x, y }) => {
      const chunk = _coordToChunk(x, y, chunkSize)
      const chunkKey = _chunkToKey(chunk.cx, chunk.cy)
      const tileKey = _coordToKey(chunk.lx, chunk.ly)
      const tilePath = `tilemaps/${canvasId}/chunks/${chunkKey}/tiles/${tileKey}`
      
      firebaseUpdates[tilePath] = null
    })
    
    // Perform atomic multi-path delete
    const dbRef = ref(db)
    await update(dbRef, firebaseUpdates)
  } catch (error) {
    console.error('Failed to delete tiles:', error)
    throw error
  }
}

/**
 * Clear all tiles in a tilemap (preserves metadata)
 */
export async function clearAllTiles(canvasId: string): Promise<void> {
  try {
    const chunksRef = ref(db, `tilemaps/${canvasId}/chunks`)
    await remove(chunksRef)
  } catch (error) {
    console.error('Failed to clear all tiles:', error)
    throw error
  }
}

// ============================================================================
// Subscription Operations
// ============================================================================

/**
 * Subscribe to a single chunk of tiles
 * Returns unsubscribe function
 */
export function subscribeToChunk(
  canvasId: string,
  chunkX: number,
  chunkY: number,
  callbacks: {
    onTile?: (x: number, y: number, tile: TileData) => void
    onRemove?: (x: number, y: number) => void
  },
  chunkSize: number = 16
): () => void {
  const chunkKey = _chunkToKey(chunkX, chunkY)
  const chunkRef = ref(db, `tilemaps/${canvasId}/chunks/${chunkKey}/tiles`)
  
  // Track previous state to detect changes
  let previousTiles = new Map<string, FirebaseTileData>()
  
  const handleValue = (snapshot: any) => {
    const data = snapshot.val() as { [key: string]: FirebaseTileData } | null
    const currentTiles = new Map<string, FirebaseTileData>()
    
    if (data) {
      Object.entries(data).forEach(([tileKey, tileData]) => {
        currentTiles.set(tileKey, tileData)
      })
    }
    
    // Detect creates and updates
    currentTiles.forEach((tileData, tileKey) => {
      const { x: lx, y: ly } = _keyToCoord(tileKey)
      const x = chunkX * chunkSize + lx
      const y = chunkY * chunkSize + ly
      
      if (!previousTiles.has(tileKey) || 
          JSON.stringify(previousTiles.get(tileKey)) !== JSON.stringify(tileData)) {
        // New tile or tile updated
        if (callbacks.onTile) {
          const tile = decompressTile(tileData)
          callbacks.onTile(x, y, tile)
        }
      }
    })
    
    // Detect deletes
    previousTiles.forEach((_, tileKey) => {
      if (!currentTiles.has(tileKey)) {
        // Tile was deleted
        const { x: lx, y: ly } = _keyToCoord(tileKey)
        const x = chunkX * chunkSize + lx
        const y = chunkY * chunkSize + ly
        
        if (callbacks.onRemove) {
          callbacks.onRemove(x, y)
        }
      }
    })
    
    previousTiles = currentTiles
  }
  
  onValue(chunkRef, handleValue)
  
  // Return unsubscribe function
  return () => {
    off(chunkRef, 'value', handleValue)
  }
}

/**
 * Subscribe to multiple chunks
 * Returns map of chunk keys to unsubscribe functions
 */
export function subscribeToChunks(
  canvasId: string,
  chunkKeys: string[],
  callbacks: {
    onTile?: (x: number, y: number, tile: TileData) => void
    onRemove?: (x: number, y: number) => void
  },
  chunkSize: number = 16
): Map<string, () => void> {
  const unsubscribes = new Map<string, () => void>()
  
  chunkKeys.forEach((chunkKey) => {
    // Parse chunk key "cx_cy"
    const [cx, cy] = chunkKey.split('_').map(Number)
    const unsub = subscribeToChunk(canvasId, cx, cy, callbacks, chunkSize)
    unsubscribes.set(chunkKey, unsub)
  })
  
  return unsubscribes
}

/**
 * Subscribe to tilemap metadata changes
 */
export function subscribeToMeta(
  canvasId: string,
  onMetaChange: (meta: TilemapMeta) => void
): () => void {
  const metaRef = ref(db, `tilemaps/${canvasId}/meta`)
  
  const handleValue = (snapshot: any) => {
    const data = snapshot.val() as FirebaseTilemapMeta | null
    if (data) {
      onMetaChange(data)
    }
  }
  
  onValue(metaRef, handleValue)
  
  // Return unsubscribe function
  return () => {
    off(metaRef, 'value', handleValue)
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all tiles in a specific chunk (one-time read)
 */
export async function getChunkTiles(
  canvasId: string,
  chunkX: number,
  chunkY: number,
  chunkSize: number = 16
): Promise<Map<string, TileData>> {
  try {
    const chunkKey = _chunkToKey(chunkX, chunkY)
    const chunkRef = ref(db, `tilemaps/${canvasId}/chunks/${chunkKey}/tiles`)
    
    return new Promise((resolve) => {
      onValue(
        chunkRef,
        (snapshot) => {
          const data = snapshot.val() as { [key: string]: FirebaseTileData } | null
          const tiles = new Map<string, TileData>()
          
          if (data) {
            Object.entries(data).forEach(([tileKey, tileData]) => {
              const { x: lx, y: ly } = _keyToCoord(tileKey)
              const x = chunkX * chunkSize + lx
              const y = chunkY * chunkSize + ly
              const globalKey = _coordToKey(x, y)
              
              tiles.set(globalKey, decompressTile(tileData))
            })
          }
          
          resolve(tiles)
        },
        { onlyOnce: true }
      )
    })
  } catch (error) {
    console.error('Failed to get chunk tiles:', error)
    return new Map()
  }
}

/**
 * Check if a tilemap exists for a canvas
 */
export async function tilemapExists(canvasId: string): Promise<boolean> {
  const meta = await getMeta(canvasId)
  return meta !== null
}

