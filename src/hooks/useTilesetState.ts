/**
 * useTilesetState Hook
 * Manages tileset state for AI-driven operations
 * Handles active tileset, metadata caching, and material exploration
 */

import { useState, useCallback, useMemo } from 'react'
import { getAllMaterials, type TileResolutionContext } from '../services/ai/tileResolution'

export interface TilesetMetadata {
  id: string
  name: string
  tileSize?: number
  tileWidth?: number
  tileHeight?: number
  namedTiles?: Record<string, number>
  tileGroups?: Record<string, any>
  autoTileSystem?: 'blob16' | 'blob47' | 'wang' | string
  materials?: string[]
  themes?: string[]
  spriteSelections?: any[]
  analyzed?: boolean
}

export interface UseTilesetStateReturn {
  // State
  activeTilesetId: string | null
  activeTilesetMetadata: TilesetMetadata | null
  loadedTilesets: Map<string, TilesetMetadata>
  isLoading: boolean
  error: string | null

  // Actions
  setActiveTileset: (tilesetId: string, metadata: TilesetMetadata) => void
  unloadTileset: (tilesetId: string) => void
  clearCache: () => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void

  // Queries
  getMaterials: () => string[]
  getResolutionContext: () => TileResolutionContext | null
  getTilesetById: (id: string) => TilesetMetadata | null
}

/**
 * Manage tileset state for AI operations
 */
export function useTilesetState(): UseTilesetStateReturn {
  const [activeTilesetId, setActiveTilesetId] = useState<string | null>(null)
  const [activeTilesetMetadata, setActiveTilesetMetadata] = useState<TilesetMetadata | null>(null)
  const [loadedTilesets, setLoadedTilesets] = useState<Map<string, TilesetMetadata>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Set active tileset and cache metadata
   */
  const handleSetActiveTileset = useCallback((tilesetId: string, metadata: TilesetMetadata) => {
    setActiveTilesetId(tilesetId)
    setActiveTilesetMetadata(metadata)
    setLoadedTilesets((prev) => {
      const updated = new Map(prev)
      updated.set(tilesetId, metadata)
      return updated
    })
    setError(null)
  }, [])

  /**
   * Unload a tileset from cache
   */
  const handleUnloadTileset = useCallback((tilesetId: string) => {
    setLoadedTilesets((prev) => {
      const updated = new Map(prev)
      updated.delete(tilesetId)
      return updated
    })

    if (activeTilesetId === tilesetId) {
      setActiveTilesetId(null)
      setActiveTilesetMetadata(null)
    }
  }, [activeTilesetId])

  /**
   * Clear all cached tilesets
   */
  const handleClearCache = useCallback(() => {
    setLoadedTilesets(new Map())
    setActiveTilesetId(null)
    setActiveTilesetMetadata(null)
  }, [])

  /**
   * Get all materials from active tileset
   */
  const getMaterials = useCallback((): string[] => {
    if (!activeTilesetMetadata?.namedTiles) {
      return activeTilesetMetadata?.materials || []
    }

    const context: TileResolutionContext = {
      namedTiles: activeTilesetMetadata.namedTiles,
    }

    return getAllMaterials(context)
  }, [activeTilesetMetadata])

  /**
   * Get resolution context from active tileset
   */
  const getResolutionContext = useCallback((): TileResolutionContext | null => {
    if (!activeTilesetMetadata?.namedTiles) {
      return null
    }

    return {
      namedTiles: activeTilesetMetadata.namedTiles,
      autoTileSystem: activeTilesetMetadata.autoTileSystem,
      fallbackTile: 0,
    }
  }, [activeTilesetMetadata])

  /**
   * Get tileset metadata by ID
   */
  const getTilesetById = useCallback(
    (id: string): TilesetMetadata | null => {
      return loadedTilesets.get(id) || null
    },
    [loadedTilesets]
  )

  return useMemo(
    () => ({
      activeTilesetId,
      activeTilesetMetadata,
      loadedTilesets,
      isLoading,
      error,
      setActiveTileset: handleSetActiveTileset,
      unloadTileset: handleUnloadTileset,
      clearCache: handleClearCache,
      setError,
      setLoading: setIsLoading,
      getMaterials,
      getResolutionContext,
      getTilesetById,
    }),
    [
      activeTilesetId,
      activeTilesetMetadata,
      loadedTilesets,
      isLoading,
      error,
      handleSetActiveTileset,
      handleUnloadTileset,
      handleClearCache,
      getMaterials,
      getResolutionContext,
      getTilesetById,
    ]
  )
}
