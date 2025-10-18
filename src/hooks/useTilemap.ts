/**
 * useTilemap Hook
 * Manages tilemap state with chunked Firebase sync and debounced writes
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../services/firebase'
import {
  subscribeToChunk,
  subscribeToMeta,
  setTile as _syncSetTile,
  setTiles as syncSetTiles,
  deleteTile as _syncDeleteTile,
  deleteTiles as syncDeleteTiles,
  getMeta,
  setMeta as syncSetMeta,
  initializeTilemap,
} from '../services/tilemap/tilemapSync'
import { floodFill } from '../services/tilemap/tileFill'
import { tilesetRegistry } from '../services/tilemap/tilesetRegistry'
import type {
  TileData,
  TilemapMeta,
  TileMode,
  ConnectionStatus,
  PaletteColor,
  coordToKey,
  keyToChunkCoord,
  getVisibleChunks,
} from '../types/tilemap'
import {
  coordToKey as _coordToKey,
  keyToChunkCoord as _keyToChunkCoord,
  getVisibleChunks as _getVisibleChunks,
  DEFAULT_TILEMAP_META,
  isValidTileCoord,
} from '../types/tilemap'

// Re-export for convenience
export type { coordToKey }

interface UseTilemapOptions {
  canvasId: string
  userId: string
  enableSync?: boolean
}

interface UseTilemapReturn {
  // State
  tiles: Map<string, TileData>
  meta: TilemapMeta
  isInitialized: boolean
  isConnected: boolean
  connectionStatus: ConnectionStatus
  
  // Tile operations
  setTile: (x: number, y: number, tile: TileData) => void
  getTile: (x: number, y: number) => TileData | undefined
  deleteTile: (x: number, y: number) => void
  clearAllTiles: () => void
  
  // Bulk operations (for paint strokes and fill)
  setTiles: (tiles: Array<{ x: number; y: number; tile: TileData }>) => void
  deleteTiles: (tiles: Array<{ x: number; y: number }>) => void
  fillTiles: (x: number, y: number, targetType: string, newType: string, newColor: string) => void
  
  // Metadata operations
  updateMeta: (updates: Partial<TilemapMeta>) => void
  
  // Chunk management
  loadVisibleChunks: (viewport: { x: number; y: number; width: number; height: number }) => void
  loadedChunks: Set<string>
  
  // Statistics
  getTileCount: () => number
  
  // Palette
  selectedPaletteIndex: number
  setSelectedPaletteIndex: (index: number) => void
  getSelectedTile: () => PaletteColor
  
  // Mode
  mode: TileMode
  setMode: (mode: TileMode) => void

  // Tileset registry
  tilesetRegistry: typeof tilesetRegistry
}

/**
 * Hook for managing tilemap state with Firebase sync
 * Implements chunked loading and debounced writes for performance
 */
export function useTilemap(options: UseTilemapOptions): UseTilemapReturn {
  const { canvasId, userId, enableSync = true } = options
  
  // Core state
  const [tiles, setTiles] = useState<Map<string, TileData>>(new Map())
  const [meta, setMeta] = useState<TilemapMeta>(DEFAULT_TILEMAP_META)
  const [isInitialized, setIsInitialized] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected')
  
  // Chunk management
  const loadedChunksRef = useRef<Set<string>>(new Set())
  const [loadedChunks, setLoadedChunks] = useState<Set<string>>(new Set())
  const chunkUnsubscribes = useRef<Map<string, () => void>>(new Map())
  
  // Debounced writes queue
  const [pendingWrites, setPendingWrites] = useState<Map<string, { x: number; y: number; tile: TileData | null }>>(new Map())
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // UI state
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(0)
  const [mode, setMode] = useState<TileMode>('stamp')

  // Tileset registry management
  useEffect(() => {
    tilesetRegistry.setActiveTileset(meta.activeTilesetId ?? 'builtin-default')
  }, [meta.activeTilesetId])
  
  // ============================================================================
  // Connection Status Monitoring
  // ============================================================================
  
  useEffect(() => {
    const connectedRef = ref(db, '.info/connected')
    const unsubscribe = onValue(connectedRef, (snap) => {
      const connected = snap.val() as boolean
      setConnectionStatus(connected ? 'connected' : 'disconnected')
    })
    
    return unsubscribe
  }, [])
  
  // ============================================================================
  // Initialize Tilemap
  // ============================================================================
  
  useEffect(() => {
    if (!enableSync) return
    
    const initTilemap = async () => {
      try {
        // Check if tilemap exists
        const existingMeta = await getMeta(canvasId)
        
        if (existingMeta) {
          // Tilemap exists, load metadata
          setMeta(existingMeta)
        } else {
          // Initialize new tilemap
          await initializeTilemap(canvasId, DEFAULT_TILEMAP_META)
          setMeta(DEFAULT_TILEMAP_META)
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize tilemap:', error)
      }
    }
    
    initTilemap()
  }, [canvasId, enableSync])
  
  // ============================================================================
  // Subscribe to Metadata Changes
  // ============================================================================
  
  useEffect(() => {
    if (!enableSync || !isInitialized) return
    
    const unsubscribe = subscribeToMeta(canvasId, (newMeta) => {
      setMeta(newMeta)
    })
    
    return unsubscribe
  }, [canvasId, enableSync, isInitialized])
  
  // ============================================================================
  // Debounced Write System
  // ============================================================================
  
  useEffect(() => {
    if (pendingWrites.size === 0) return
    
    // Clear existing timer
    if (writeTimerRef.current) {
      clearTimeout(writeTimerRef.current)
    }
    
    // Set new timer for batch write
    writeTimerRef.current = setTimeout(async () => {
      if (!enableSync) {
        setPendingWrites(new Map())
        return
      }
      
      try {
        // Separate tiles to set and delete
        const tilesToSet: Array<{ x: number; y: number; tile: TileData }> = []
        const tilesToDelete: Array<{ x: number; y: number }> = []
        
        pendingWrites.forEach((entry) => {
          if (entry.tile === null) {
            tilesToDelete.push({ x: entry.x, y: entry.y })
          } else {
            tilesToSet.push({ x: entry.x, y: entry.y, tile: entry.tile })
          }
        })
        
        // Batch write to Firebase
        if (tilesToSet.length > 0) {
          await syncSetTiles(canvasId, tilesToSet, userId, meta.chunkSize)
        }
        if (tilesToDelete.length > 0) {
          await syncDeleteTiles(canvasId, tilesToDelete, meta.chunkSize)
        }
        
        // Clear pending writes
        setPendingWrites(new Map())
      } catch (error) {
        console.error('Failed to batch write tiles:', error)
        // Keep pending writes in queue on error (will retry)
      }
    }, 100) // 100ms batch window
    
    return () => {
      if (writeTimerRef.current) {
        clearTimeout(writeTimerRef.current)
      }
    }
  }, [pendingWrites, enableSync, canvasId, userId, meta.chunkSize])
  
  // ============================================================================
  // Chunk Loading
  // ============================================================================
  
  const loadVisibleChunks = useCallback(
    (viewport: { x: number; y: number; width: number; height: number }) => {
      if (!isInitialized) return
      
      // Get chunks that should be visible
      const visibleChunkKeys = _getVisibleChunks(
        viewport.x,
        viewport.y,
        viewport.width,
        viewport.height,
        meta.tileSize,
        meta.chunkSize
      )
      
      const visibleSet = new Set(visibleChunkKeys)
      
      // Unsubscribe from chunks that are no longer visible
      loadedChunksRef.current.forEach((chunkKey) => {
        if (!visibleSet.has(chunkKey)) {
          const unsub = chunkUnsubscribes.current.get(chunkKey)
          if (unsub) {
            unsub()
            chunkUnsubscribes.current.delete(chunkKey)
          }
        }
      })
      
      // Subscribe to new chunks
      visibleChunkKeys.forEach((chunkKey) => {
        if (!loadedChunksRef.current.has(chunkKey) && enableSync) {
          const { cx, cy } = _keyToChunkCoord(chunkKey)
          
          const unsub = subscribeToChunk(
            canvasId,
            cx,
            cy,
            {
              onTile: (x, y, tile) => {
                const key = _coordToKey(x, y)
                setTiles((prev) => {
                  const newTiles = new Map(prev)
                  newTiles.set(key, tile)
                  return newTiles
                })
              },
              onRemove: (x, y) => {
                const key = _coordToKey(x, y)
                setTiles((prev) => {
                  const newTiles = new Map(prev)
                  newTiles.delete(key)
                  return newTiles
                })
              },
            },
            meta.chunkSize
          )
          
          chunkUnsubscribes.current.set(chunkKey, unsub)
        }
      })
      
      // Update loaded chunks (both ref and state)
      loadedChunksRef.current = visibleSet
      setLoadedChunks(visibleSet)
    },
    [isInitialized, enableSync, canvasId, meta.tileSize, meta.chunkSize]
  )
  
  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      chunkUnsubscribes.current.forEach((unsub) => unsub())
      chunkUnsubscribes.current.clear()
    }
  }, [])
  
  // ============================================================================
  // Tile Operations
  // ============================================================================
  
  const setTileLocal = useCallback(
    (x: number, y: number, tile: TileData) => {
      // Validate coordinates
      if (!isValidTileCoord(x, y, meta)) {
        console.warn('Tile coordinates out of bounds:', x, y)
        return
      }
      
      const key = _coordToKey(x, y)
      
      // Optimistic update
      setTiles((prev) => {
        const newTiles = new Map(prev)
        newTiles.set(key, tile)
        return newTiles
      })
      
      // Add to pending writes queue
      setPendingWrites((prev) => {
        const newPending = new Map(prev)
        newPending.set(key, { x, y, tile })
        return newPending
      })
    },
    [meta]
  )
  
  const getTile = useCallback(
    (x: number, y: number): TileData | undefined => {
      const key = _coordToKey(x, y)
      return tiles.get(key)
    },
    [tiles]
  )
  
  const deleteTileLocal = useCallback(
    (x: number, y: number) => {
      const key = _coordToKey(x, y)
      
      // Optimistic update
      setTiles((prev) => {
        const newTiles = new Map(prev)
        newTiles.delete(key)
        return newTiles
      })
      
      // Add to pending writes queue (null indicates deletion)
      setPendingWrites((prev) => {
        const newPending = new Map(prev)
        newPending.set(key, { x, y, tile: null })
        return newPending
      })
    },
    []
  )
  
  const setTilesLocal = useCallback(
    (tilesToSet: Array<{ x: number; y: number; tile: TileData }>) => {
      // Optimistic update
      setTiles((prev) => {
        const newTiles = new Map(prev)
        tilesToSet.forEach(({ x, y, tile }) => {
          if (isValidTileCoord(x, y, meta)) {
            const key = _coordToKey(x, y)
            newTiles.set(key, tile)
          }
        })
        return newTiles
      })
      
      // Add all to pending writes queue
      setPendingWrites((prev) => {
        const newPending = new Map(prev)
        tilesToSet.forEach(({ x, y, tile }) => {
          if (isValidTileCoord(x, y, meta)) {
            const key = _coordToKey(x, y)
            newPending.set(key, { x, y, tile })
          }
        })
        return newPending
      })
    },
    [meta]
  )
  
  const deleteTilesLocal = useCallback(
    (tilesToDelete: Array<{ x: number; y: number }>) => {
      // Optimistic update
      setTiles((prev) => {
        const newTiles = new Map(prev)
        tilesToDelete.forEach(({ x, y }) => {
          const key = _coordToKey(x, y)
          newTiles.delete(key)
        })
        return newTiles
      })
      
      // Add all to pending writes queue
      setPendingWrites((prev) => {
        const newPending = new Map(prev)
        tilesToDelete.forEach(({ x, y }) => {
          const key = _coordToKey(x, y)
          newPending.set(key, { x, y, tile: null })
        })
        return newPending
      })
    },
    []
  )
  
  const clearAllTiles = useCallback(() => {
    setTiles(new Map())
    // Note: Actual Firebase deletion would need to be implemented separately
    // for clearAllTiles to avoid massive individual deletions
  }, [])
  
  const fillTilesLocal = useCallback(
    (x: number, y: number, targetType: string, newType: string, newColor: string) => {
      // Perform flood fill
      const fillResult = floodFill(
        tiles,
        x,
        y,
        { type: newType, color: newColor },
        meta.width || 256,
        meta.height || 256,
        1000 // Max tiles to fill at once
      )
      
      if (fillResult.tiles.length > 0) {
        // Apply the fill using bulk operation
        setTilesLocal(fillResult.tiles)
        
        if (fillResult.limitReached) {
          console.warn('Fill limit reached (1000 tiles). Large areas may require multiple fills.')
        }
      }
    },
    [tiles, meta, setTilesLocal]
  )
  
  // ============================================================================
  // Metadata Operations
  // ============================================================================
  
  const updateMeta = useCallback(
    async (updates: Partial<TilemapMeta>) => {
      try {
        // Optimistic update
        setMeta((prev) => ({ ...prev, ...updates }))
        
        // Sync to Firebase
        if (enableSync) {
          await syncSetMeta(canvasId, updates)
        }
      } catch (error) {
        console.error('Failed to update tilemap meta:', error)
        // Revert on error (would need to fetch current state)
      }
    },
    [canvasId, enableSync]
  )
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  const getTileCount = useCallback(() => {
    return tiles.size
  }, [tiles])
  
  const getSelectedTile = useCallback((): PaletteColor => {
    return meta.palette[selectedPaletteIndex] || meta.palette[0]
  }, [meta.palette, selectedPaletteIndex])
  
  // ============================================================================
  // Return Hook Interface
  // ============================================================================
  
  return {
    // State
    tiles,
    meta,
    isInitialized,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    
    // Tile operations
    setTile: setTileLocal,
    getTile,
    deleteTile: deleteTileLocal,
    clearAllTiles,
    
    // Bulk operations
    setTiles: setTilesLocal,
    deleteTiles: deleteTilesLocal,
    fillTiles: fillTilesLocal,
    
    // Metadata operations
    updateMeta,
    
    // Chunk management
    loadVisibleChunks,
    loadedChunks,
    
    // Statistics
    getTileCount,
    
    // Palette
    selectedPaletteIndex,
    setSelectedPaletteIndex,
    getSelectedTile,
    
    // Mode
    mode,
    setMode,

    // Tileset registry
    tilesetRegistry,
  }
}

