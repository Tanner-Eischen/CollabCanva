/**
 * Tilemap Sync Service
 * Handles Firebase CRUD operations for tilemap data with chunked structure
 * Supports multi-layer architecture with backward compatibility
 */

import { ref, set, update, remove, onValue, off, serverTimestamp } from 'firebase/database'
import { db } from '../firebase'
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
} from '../../types/tilemap'
import {
  coordToKey as _coordToKey,
  chunkToKey as _chunkToKey,
  coordToChunk as _coordToChunk,
  keyToCoord as _keyToCoord,
} from '../../types/tilemap'
import type { TileLayerMeta } from '../../types/tileLayer'
import { createLegacyGroundLayer } from '../../data/defaultLayers'

// Re-export coordinate helpers
export type { coordToKey, chunkToKey, coordToChunk, keyToCoord }

// ============================================================================
// Compression/Decompression
// ============================================================================

/**
 * Compress tile data for Firebase storage
 * Uses short keys to reduce bandwidth: t (type), c (color), v (variant), a (animation), by (by user), ts (timestamp)
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
  
  // Add animationId if present (animated tiles)
  if (tile.animationId !== undefined) {
    compressed.a = tile.animationId
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
  
  // Include animationId if present (animated tiles)
  if (data.a !== undefined) {
    tile.animationId = data.a
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
// Layer Operations
// ============================================================================

/**
 * Get layers from metadata, with fallback to legacy ground layer
 */
export function getLayersOrDefault(meta: TilemapMeta | null): TileLayerMeta[] {
  if (meta?.layers && meta.layers.length > 0) {
    return meta.layers
  }
  // Backward compatibility: create legacy ground layer
  return [createLegacyGroundLayer()]
}

/**
 * Update layers in metadata
 */
export async function updateLayers(canvasId: string, layers: TileLayerMeta[]): Promise<void> {
  try {
    const metaRef = ref(db, `tilemaps/${canvasId}/meta/layers`)
    await set(metaRef, layers)
  } catch (error) {
    console.error('Failed to update layers:', error)
    throw error
  }
}

/**
 * Add a new layer to the tilemap
 */
export async function addLayer(canvasId: string, layer: TileLayerMeta): Promise<void> {
  try {
    const meta = await getMeta(canvasId)
    const currentLayers = getLayersOrDefault(meta)
    const updatedLayers = [...currentLayers, layer]
    await updateLayers(canvasId, updatedLayers)
  } catch (error) {
    console.error('Failed to add layer:', error)
    throw error
  }
}

/**
 * Remove a layer from the tilemap (and optionally delete all its tiles)
 */
export async function removeLayer(
  canvasId: string,
  layerId: string,
  deleteTiles: boolean = false
): Promise<void> {
  try {
    // Update metadata
    const meta = await getMeta(canvasId)
    const currentLayers = getLayersOrDefault(meta)
    const updatedLayers = currentLayers.filter(l => l.id !== layerId)
    await updateLayers(canvasId, updatedLayers)
    
    // Optionally delete all tiles in the layer
    if (deleteTiles) {
      const layerRef = ref(db, `tilemaps/${canvasId}/layers/${layerId}`)
      await remove(layerRef)
    }
  } catch (error) {
    console.error('Failed to remove layer:', error)
    throw error
  }
}

/**
 * Update a single layer's metadata
 */
export async function updateLayer(canvasId: string, layerId: string, updates: Partial<TileLayerMeta>): Promise<void> {
  try {
    const meta = await getMeta(canvasId)
    const currentLayers = getLayersOrDefault(meta)
    const updatedLayers = currentLayers.map(layer =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    )
    await updateLayers(canvasId, updatedLayers)
  } catch (error) {
    console.error('Failed to update layer:', error)
    throw error
  }
}

// ============================================================================
// Tile Operations
// ============================================================================

/**
 * Build Firebase path for a tile
 * Supports both legacy (no layers) and new multi-layer structure
 */
function getTilePath(
  canvasId: string,
  chunkKey: string,
  tileKey: string,
  layerId?: string
): string {
  if (layerId) {
    // New multi-layer structure
    return `tilemaps/${canvasId}/layers/${layerId}/chunks/${chunkKey}/tiles/${tileKey}`
  } else {
    // Legacy structure (backward compatibility)
    return `tilemaps/${canvasId}/chunks/${chunkKey}/tiles/${tileKey}`
  }
}

/**
 * Set a single tile in Firebase with chunk routing
 * @param layerId Optional layer ID. If omitted, uses legacy path for backward compatibility
 */
export async function setTile(
  canvasId: string,
  x: number,
  y: number,
  tile: TileData,
  userId: string,
  chunkSize: number = 16,
  layerId?: string
): Promise<void> {
  try {
    // Calculate chunk coordinates
    const chunk = _coordToChunk(x, y, chunkSize)
    const chunkKey = _chunkToKey(chunk.cx, chunk.cy)
    const tileKey = _coordToKey(chunk.lx, chunk.ly)
    
    // Build Firebase path
    const tilePath = getTilePath(canvasId, chunkKey, tileKey, layerId)
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
 * @param layerId Optional layer ID. If omitted, uses legacy path for backward compatibility
 */
export async function setTiles(
  canvasId: string,
  tiles: Array<{ x: number; y: number; tile: TileData }>,
  userId: string,
  chunkSize: number = 16,
  layerId?: string
): Promise<void> {
  try {
    // Build flat update object for atomic write
    const firebaseUpdates: Record<string, FirebaseTileData> = {}
    
    tiles.forEach(({ x, y, tile }) => {
      const chunk = _coordToChunk(x, y, chunkSize)
      const chunkKey = _chunkToKey(chunk.cx, chunk.cy)
      const tileKey = _coordToKey(chunk.lx, chunk.ly)
      const tilePath = getTilePath(canvasId, chunkKey, tileKey, layerId)
      
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
 * @param layerId Optional layer ID. If omitted, uses legacy path for backward compatibility
 */
export async function deleteTile(
  canvasId: string,
  x: number,
  y: number,
  chunkSize: number = 16,
  layerId?: string
): Promise<void> {
  try {
    // Calculate chunk coordinates
    const chunk = _coordToChunk(x, y, chunkSize)
    const chunkKey = _chunkToKey(chunk.cx, chunk.cy)
    const tileKey = _coordToKey(chunk.lx, chunk.ly)
    
    // Build Firebase path and delete
    const tilePath = getTilePath(canvasId, chunkKey, tileKey, layerId)
    const tileRef = ref(db, tilePath)
    
    await remove(tileRef)
  } catch (error) {
    console.error('Failed to delete tile:', error)
    throw error
  }
}

/**
 * Delete multiple tiles in a single atomic operation
 * @param layerId Optional layer ID. If omitted, uses legacy path for backward compatibility
 */
export async function deleteTiles(
  canvasId: string,
  tiles: Array<{ x: number; y: number }>,
  chunkSize: number = 16,
  layerId?: string
): Promise<void> {
  try {
    // Build flat update object with null values (deletes in Firebase)
    const firebaseUpdates: Record<string, null> = {}
    
    tiles.forEach(({ x, y }) => {
      const chunk = _coordToChunk(x, y, chunkSize)
      const chunkKey = _chunkToKey(chunk.cx, chunk.cy)
      const tileKey = _coordToKey(chunk.lx, chunk.ly)
      const tilePath = getTilePath(canvasId, chunkKey, tileKey, layerId)
      
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
 * Clears both legacy chunks and all layer chunks
 */
export async function clearAllTiles(canvasId: string): Promise<void> {
  try {
    // Clear legacy chunks
    const legacyChunksRef = ref(db, `tilemaps/${canvasId}/chunks`)
    await remove(legacyChunksRef)
    
    // Clear all layer chunks
    const layersRef = ref(db, `tilemaps/${canvasId}/layers`)
    await remove(layersRef)
  } catch (error) {
    console.error('Failed to clear all tiles:', error)
    throw error
  }
}

/**
 * Clear all tiles in a specific layer
 */
export async function clearLayerTiles(canvasId: string, layerId: string): Promise<void> {
  try {
    const layerRef = ref(db, `tilemaps/${canvasId}/layers/${layerId}`)
    await remove(layerRef)
  } catch (error) {
    console.error('Failed to clear layer tiles:', error)
    throw error
  }
}

// ============================================================================
// Subscription Operations
// ============================================================================

/**
 * Subscribe to a single chunk of tiles
 * Returns unsubscribe function
 * @param layerId Optional layer ID. If omitted, uses legacy path for backward compatibility
 */
export function subscribeToChunk(
  canvasId: string,
  chunkX: number,
  chunkY: number,
  callbacks: {
    onTile?: (x: number, y: number, tile: TileData) => void
    onRemove?: (x: number, y: number) => void
  },
  chunkSize: number = 16,
  layerId?: string
): () => void {
  const chunkKey = _chunkToKey(chunkX, chunkY)
  const chunkPath = layerId
    ? `tilemaps/${canvasId}/layers/${layerId}/chunks/${chunkKey}/tiles`
    : `tilemaps/${canvasId}/chunks/${chunkKey}/tiles`
  const chunkRef = ref(db, chunkPath)
  
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
 * @param layerId Optional layer ID. If omitted, uses legacy path for backward compatibility
 */
export function subscribeToChunks(
  canvasId: string,
  chunkKeys: string[],
  callbacks: {
    onTile?: (x: number, y: number, tile: TileData) => void
    onRemove?: (x: number, y: number) => void
  },
  chunkSize: number = 16,
  layerId?: string
): Map<string, () => void> {
  const unsubscribes = new Map<string, () => void>()
  
  chunkKeys.forEach((chunkKey) => {
    // Parse chunk key "cx_cy"
    const [cx, cy] = chunkKey.split('_').map(Number)
    const unsub = subscribeToChunk(canvasId, cx, cy, callbacks, chunkSize, layerId)
    unsubscribes.set(chunkKey, unsub)
  })
  
  return unsubscribes
}

/**
 * Subscribe to all layers' chunks
 * Returns map of layer IDs to their chunk unsubscribe maps
 */
export function subscribeToAllLayers(
  canvasId: string,
  layers: TileLayerMeta[],
  chunkKeys: string[],
  callbacks: {
    onTile?: (layerId: string, x: number, y: number, tile: TileData) => void
    onRemove?: (layerId: string, x: number, y: number) => void
  },
  chunkSize: number = 16
): Map<string, Map<string, () => void>> {
  const layerUnsubscribes = new Map<string, Map<string, () => void>>()
  
  layers.forEach((layer) => {
    const layerCallbacks = {
      onTile: callbacks.onTile ? (x: number, y: number, tile: TileData) => 
        callbacks.onTile!(layer.id, x, y, tile) : undefined,
      onRemove: callbacks.onRemove ? (x: number, y: number) => 
        callbacks.onRemove!(layer.id, x, y) : undefined,
    }
    
    const unsubscribes = subscribeToChunks(canvasId, chunkKeys, layerCallbacks, chunkSize, layer.id)
    layerUnsubscribes.set(layer.id, unsubscribes)
  })
  
  return layerUnsubscribes
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
 * @param layerId Optional layer ID. If omitted, uses legacy path for backward compatibility
 */
export async function getChunkTiles(
  canvasId: string,
  chunkX: number,
  chunkY: number,
  chunkSize: number = 16,
  layerId?: string
): Promise<Map<string, TileData>> {
  try {
    const chunkKey = _chunkToKey(chunkX, chunkY)
    const chunkPath = layerId
      ? `tilemaps/${canvasId}/layers/${layerId}/chunks/${chunkKey}/tiles`
      : `tilemaps/${canvasId}/chunks/${chunkKey}/tiles`
    const chunkRef = ref(db, chunkPath)
    
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
 * Get all tiles across all layers for specific chunks
 * Returns a map of layer IDs to their tile maps
 */
export async function getAllLayerTiles(
  canvasId: string,
  layers: TileLayerMeta[],
  chunkKeys: string[],
  chunkSize: number = 16
): Promise<Map<string, Map<string, TileData>>> {
  const layerTiles = new Map<string, Map<string, TileData>>()
  
  // Fetch tiles for each layer in parallel
  await Promise.all(
    layers.map(async (layer) => {
      const tiles = new Map<string, TileData>()
      
      // Fetch all chunks for this layer in parallel
      await Promise.all(
        chunkKeys.map(async (chunkKey) => {
          const [cx, cy] = chunkKey.split('_').map(Number)
          const chunkTiles = await getChunkTiles(canvasId, cx, cy, chunkSize, layer.id)
          
          // Merge chunk tiles into layer tiles
          chunkTiles.forEach((tile, key) => {
            tiles.set(key, tile)
          })
        })
      )
      
      layerTiles.set(layer.id, tiles)
    })
  )
  
  return layerTiles
}

/**
 * Check if a tilemap exists for a canvas
 */
export async function tilemapExists(canvasId: string): Promise<boolean> {
  const meta = await getMeta(canvasId)
  return meta !== null
}

