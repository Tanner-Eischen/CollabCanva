/**
 * TileRenderer Component
 * Efficiently renders tiles with viewport culling
 * Supports both sprite and colored tile rendering
 */

import { useMemo } from 'react'
import { Layer, Rect } from 'react-konva'
import type { TileData } from '../../types/tilemap'
import { coordToKey } from '../../types/tilemap'
import { getTilePath, hasSpriteAsset } from '../../constants/tilemapDefaults'
import SpriteTile from '../canvas/SpriteTile'

interface TileRendererProps {
  tiles: Map<string, TileData>
  tileSize: number
  viewportX: number
  viewportY: number
  viewportWidth: number
  viewportHeight: number
  previewTile?: { x: number; y: number; tile: TileData } | null
  showPreview?: boolean
}

/**
 * Tile renderer with viewport culling
 * Only renders tiles visible in the current viewport for performance
 */
export default function TileRenderer({
  tiles,
  tileSize,
  viewportX,
  viewportY,
  viewportWidth,
  viewportHeight,
  previewTile,
  showPreview = true,
}: TileRendererProps) {
  // Calculate visible tiles with viewport culling
  const visibleTiles = useMemo(() => {
    const visible: Array<{ key: string; x: number; y: number; tile: TileData }> = []
    
    // Calculate visible tile range with some padding
    const padding = 2 // Extra tiles outside viewport
    const startX = Math.max(0, Math.floor(viewportX / tileSize) - padding)
    const endX = Math.ceil((viewportX + viewportWidth) / tileSize) + padding
    const startY = Math.max(0, Math.floor(viewportY / tileSize) - padding)
    const endY = Math.ceil((viewportY + viewportHeight) / tileSize) + padding
    
    // Iterate through tiles and filter visible ones
    tiles.forEach((tile, key) => {
      const [xStr, yStr] = key.split('_')
      const x = parseInt(xStr, 10)
      const y = parseInt(yStr, 10)
      
      // Check if tile is in visible range
      if (x >= startX && x <= endX && y >= startY && y <= endY) {
        visible.push({ key, x, y, tile })
      }
    })
    
    return visible
  }, [tiles, tileSize, viewportX, viewportY, viewportWidth, viewportHeight])
  
  return (
    <Layer
      listening={false}
      perfectDrawEnabled={false}
    >
      {/* Render visible tiles */}
      {visibleTiles.map(({ key, x, y, tile }) => {
        const hasSprite = hasSpriteAsset(tile.type)
        
        // Render sprite tile if available, otherwise colored rect
        if (hasSprite && tile.variant !== undefined) {
          // Clamp variant to valid range (0-8) to handle old data
          const clampedVariant = Math.max(0, Math.min(8, tile.variant))
          const tilePath = getTilePath(tile.type, clampedVariant)
          return (
            <SpriteTile
              key={key}
              x={x * tileSize}
              y={y * tileSize}
              tileSize={tileSize}
              tilePath={tilePath}
              color={tile.color}
              opacity={1}
            />
          )
        }
        
        // Fallback to colored rectangle (backwards compatible)
        return (
          <Rect
            key={key}
            x={x * tileSize}
            y={y * tileSize}
            width={tileSize}
            height={tileSize}
            fill={tile.color}
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth={1}
            listening={false}
            perfectDrawEnabled={false}
          />
        )
      })}
      
      {/* Render preview tile (ghost) */}
      {showPreview && previewTile && (() => {
        const hasSprite = hasSpriteAsset(previewTile.tile.type)
        
        // Render sprite preview if available
        if (hasSprite && previewTile.tile.variant !== undefined) {
          // Clamp variant to valid range (0-8)
          const clampedVariant = Math.max(0, Math.min(8, previewTile.tile.variant))
          const tilePath = getTilePath(previewTile.tile.type, clampedVariant)
          return (
            <SpriteTile
              key="preview"
              x={previewTile.x * tileSize}
              y={previewTile.y * tileSize}
              tileSize={tileSize}
              tilePath={tilePath}
              color={previewTile.tile.color}
              opacity={0.5}
            />
          )
        }
        
        // Fallback to colored preview
        return (
          <Rect
            key="preview"
            x={previewTile.x * tileSize}
            y={previewTile.y * tileSize}
            width={tileSize}
            height={tileSize}
            fill={previewTile.tile.color}
            opacity={0.5}
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[4, 4]}
            listening={false}
            perfectDrawEnabled={false}
          />
        )
      })()}
    </Layer>
  )
}

