/**
 * TilemapLayer Component
 * Wrapper layer that combines grid and tile rendering
 * Conditionally mounted when in tilemap mode
 */

import { useEffect } from 'react'
import TilemapGrid from './TilemapGrid'
import TileRenderer from './TileRenderer'
import type { TileData } from '../../types/tilemap'

interface TilemapLayerProps {
  tiles: Map<string, TileData>
  tileSize: number
  showGrid: boolean
  previewTile?: { x: number; y: number; tile: TileData } | null
  viewportX: number
  viewportY: number
  viewportWidth: number
  viewportHeight: number
  onViewportChange?: (viewport: { x: number; y: number; width: number; height: number }) => void
}

/**
 * Combined tilemap layer
 * Renders grid overlay and tiles in a dedicated FastLayer
 * Positioned at z-index 1 (above background, below shapes)
 */
export default function TilemapLayer({
  tiles,
  tileSize,
  showGrid,
  previewTile,
  viewportX,
  viewportY,
  viewportWidth,
  viewportHeight,
  onViewportChange,
}: TilemapLayerProps) {
  // Notify parent of viewport changes for chunk loading
  useEffect(() => {
    if (onViewportChange) {
      onViewportChange({ x: viewportX, y: viewportY, width: viewportWidth, height: viewportHeight })
    }
  }, [viewportX, viewportY, viewportWidth, viewportHeight, onViewportChange])
  
  return (
    <>
      {/* Grid overlay */}
      <TilemapGrid
        tileSize={tileSize}
        viewportX={viewportX}
        viewportY={viewportY}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        visible={showGrid}
      />
      
      {/* Tiles */}
      <TileRenderer
        tiles={tiles}
        tileSize={tileSize}
        viewportX={viewportX}
        viewportY={viewportY}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        previewTile={previewTile}
      />
    </>
  )
}

