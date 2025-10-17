/**
 * Tilemap Painter Hook
 * Handles painting logic with auto-tile variant calculation
 */

import { useCallback, useRef } from 'react'
import type { TileData, TileMode } from '../types/tilemap'
import { coordToKey } from '../types/tilemap'
import { calculateTileVariant, calculateAutoTileUpdates } from '../utils/tilemap/autoTile'
import { hasSpriteAsset } from '../constants/tilemapDefaults'

export interface UseTilemapPainterOptions {
  mode: TileMode
  selectedTile: { type: string; color: string }
  tiles: Map<string, TileData>
  setTile: (x: number, y: number, tile: TileData) => void
  deleteTile: (x: number, y: number) => void
  fillTiles: (x: number, y: number, targetType: string, newType: string, newColor: string) => void
  onStrokeStart?: () => void
  onStrokeEnd?: (stroke: Array<{ x: number; y: number; oldTile: TileData | undefined; newTile: TileData }>) => void
}

export interface UseTilemapPainterReturn {
  handleMouseDown: (tileX: number, tileY: number) => void
  handleMouseMove: (tileX: number, tileY: number) => void
  handleMouseUp: () => void
  isPainting: boolean
}

/**
 * Hook for handling tilemap painting with auto-tiling
 * 
 * Features:
 * - Stamp: Place tiles with auto-calculated variants
 * - Erase: Remove tiles and update neighbor variants
 * - Fill: Flood fill with variant calculation
 * - Pick: Eyedropper to select tile from canvas
 * - Stroke tracking: For undo/redo bulk operations
 */
export function useTilemapPainter(options: UseTilemapPainterOptions): UseTilemapPainterReturn {
  const {
    mode,
    selectedTile,
    tiles,
    setTile,
    deleteTile,
    fillTiles,
    onStrokeStart,
    onStrokeEnd,
  } = options
  
  const isPaintingRef = useRef(false)
  const lastTileRef = useRef<{ x: number; y: number } | null>(null)
  const currentStrokeRef = useRef<Array<{ x: number; y: number; oldTile: TileData | undefined; newTile: TileData }>>([])
  
  /**
   * Calculate and place a tile with auto-tiling variant
   */
  const placeTileWithVariant = useCallback(
    (x: number, y: number) => {
      const { type, color } = selectedTile
      
      // Calculate variant if sprite assets available
      let variant: number | undefined
      if (hasSpriteAsset(type)) {
        variant = calculateTileVariant(x, y, tiles, type)
      }
      
      // Create tile data
      const newTile: TileData = {
        type,
        color,
        variant,
      }
      
      // Place tile
      const key = coordToKey(x, y)
      const oldTile = tiles.get(key)
      setTile(x, y, newTile)
      
      // Track for stroke (undo/redo)
      currentStrokeRef.current.push({ x, y, oldTile, newTile })
      
      // Update neighbor variants if using sprites
      if (hasSpriteAsset(type)) {
        updateNeighborVariants(x, y, type)
      }
    },
    [selectedTile, tiles, setTile]
  )
  
  /**
   * Update variants of neighboring tiles
   */
  const updateNeighborVariants = useCallback(
    (x: number, y: number, tileType: string) => {
      // Get updates for neighbors
      const updates = calculateAutoTileUpdates(x, y, tiles, tileType)
      
      // Apply variant updates to neighbors (skip center, already placed)
      updates.forEach((update) => {
        if (update.x === x && update.y === y) return // Skip center
        
        const key = coordToKey(update.x, update.y)
        const existingTile = tiles.get(key)
        
        if (existingTile) {
          // Update existing tile's variant
          setTile(update.x, update.y, {
            ...existingTile,
            variant: update.variant,
          })
        }
      })
    },
    [tiles, setTile]
  )
  
  /**
   * Erase a tile and update neighbors
   */
  const eraseTileWithVariantUpdate = useCallback(
    (x: number, y: number) => {
      const key = coordToKey(x, y)
      const oldTile = tiles.get(key)
      
      if (!oldTile) return // Nothing to erase
      
      // Delete tile
      deleteTile(x, y)
      
      // Track for stroke
      currentStrokeRef.current.push({
        x,
        y,
        oldTile,
        newTile: { type: '', color: '' }, // Placeholder for deleted
      })
      
      // Update neighbor variants if old tile had sprites
      if (hasSpriteAsset(oldTile.type)) {
        updateNeighborVariantsAfterDelete(x, y, oldTile.type)
      }
    },
    [tiles, deleteTile]
  )
  
  /**
   * Update neighbor variants after tile deletion
   */
  const updateNeighborVariantsAfterDelete = useCallback(
    (x: number, y: number, deletedType: string) => {
      // Check all 4 neighbors
      const neighborPositions = [
        { x: x, y: y - 1 },  // North
        { x: x + 1, y: y },  // East
        { x: x, y: y + 1 },  // South
        { x: x - 1, y: y },  // West
      ]
      
      neighborPositions.forEach((pos) => {
        const key = coordToKey(pos.x, pos.y)
        const neighborTile = tiles.get(key)
        
        if (neighborTile && hasSpriteAsset(neighborTile.type)) {
          // Recalculate neighbor's variant (tile at x,y is now deleted)
          const variant = calculateTileVariant(pos.x, pos.y, tiles, neighborTile.type)
          setTile(pos.x, pos.y, {
            ...neighborTile,
            variant,
          })
        }
      })
    },
    [tiles, setTile]
  )
  
  /**
   * Handle mouse down - start painting
   */
  const handleMouseDown = useCallback(
    (tileX: number, tileY: number) => {
      isPaintingRef.current = true
      lastTileRef.current = { x: tileX, y: tileY }
      currentStrokeRef.current = []
      
      if (onStrokeStart) {
        onStrokeStart()
      }
      
      // Execute tool action
      switch (mode) {
        case 'stamp':
          placeTileWithVariant(tileX, tileY)
          break
          
        case 'erase':
          eraseTileWithVariantUpdate(tileX, tileY)
          break
          
        case 'fill':
          // Get target tile type
          const targetKey = coordToKey(tileX, tileY)
          const targetTile = tiles.get(targetKey)
          const targetType = targetTile?.type || ''
          
          // Don't fill if clicking same type
          if (targetType === selectedTile.type) break
          
          // Execute fill (handled by useTilemap hook)
          fillTiles(tileX, tileY, targetType, selectedTile.type, selectedTile.color)
          break
          
        case 'pick':
          // Eyedropper handled at component level (sets selectedTile)
          break
      }
    },
    [mode, selectedTile, tiles, placeTileWithVariant, eraseTileWithVariantUpdate, fillTiles, onStrokeStart]
  )
  
  /**
   * Handle mouse move - continuous painting
   */
  const handleMouseMove = useCallback(
    (tileX: number, tileY: number) => {
      if (!isPaintingRef.current) return
      
      // Check if moved to new tile
      const lastTile = lastTileRef.current
      if (lastTile && lastTile.x === tileX && lastTile.y === tileY) {
        return // Still on same tile
      }
      
      lastTileRef.current = { x: tileX, y: tileY }
      
      // Only stamp and erase support continuous painting
      if (mode === 'stamp') {
        placeTileWithVariant(tileX, tileY)
      } else if (mode === 'erase') {
        eraseTileWithVariantUpdate(tileX, tileY)
      }
    },
    [mode, placeTileWithVariant, eraseTileWithVariantUpdate]
  )
  
  /**
   * Handle mouse up - finish painting
   */
  const handleMouseUp = useCallback(() => {
    if (isPaintingRef.current && onStrokeEnd && currentStrokeRef.current.length > 0) {
      onStrokeEnd(currentStrokeRef.current)
    }
    
    isPaintingRef.current = false
    lastTileRef.current = null
    currentStrokeRef.current = []
  }, [onStrokeEnd])
  
  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isPainting: isPaintingRef.current,
  }
}

