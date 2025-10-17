/**
 * TilemapLayer Component
 * Wrapper layer that combines grid and tile rendering
 * Conditionally mounted when in tilemap mode
 * Supports multi-layer rendering with parallax and z-ordering
 */

import { useEffect, useMemo } from 'react'
import TilemapGrid from './TilemapGrid'
import TileRenderer from './TileRenderer'
import type { TileData, TilemapMeta } from '../../types/tilemap'
import type { TileLayerMeta } from '../../types/tileLayer'
import { getVisibleLayers } from '../../types/tileLayer'
import { createLegacyGroundLayer } from '../../data/defaultLayers'

interface TilemapLayerProps {
  tiles: Map<string, TileData> | Map<string, Map<string, TileData>> // Single map (legacy) or map of maps (multi-layer)
  tileSize: number
  showGrid: boolean
  previewTile?: { x: number; y: number; tile: TileData; layerId?: string } | null
  viewportX: number
  viewportY: number
  viewportWidth: number
  viewportHeight: number
  onViewportChange?: (viewport: { x: number; y: number; width: number; height: number }) => void
  meta?: TilemapMeta // Tilemap metadata including layer configuration
}

/**
 * Combined tilemap layer
 * Renders grid overlay and tiles in dedicated layers
 * Supports multi-layer rendering with parallax and z-ordering
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
  meta,
}: TilemapLayerProps) {
  // Notify parent of viewport changes for chunk loading
  useEffect(() => {
    if (onViewportChange) {
      onViewportChange({ x: viewportX, y: viewportY, width: viewportWidth, height: viewportHeight })
    }
  }, [viewportX, viewportY, viewportWidth, viewportHeight, onViewportChange])
  
  // Determine if we're using multi-layer or legacy single-layer mode
  const isMultiLayer = useMemo(() => {
    if (!tiles || tiles.size === 0) return false
    // Check if tiles is a map of maps (multi-layer) or a simple map (legacy)
    const firstValue = tiles.values().next().value
    return firstValue instanceof Map
  }, [tiles])
  
  // Get layers configuration (with fallback to legacy ground layer)
  const layers = useMemo((): TileLayerMeta[] => {
    if (meta?.layers && meta.layers.length > 0) {
      return meta.layers
    }
    // Legacy mode: create a single ground layer
    return [createLegacyGroundLayer()]
  }, [meta])
  
  // Get visible layers sorted by z-index
  const visibleLayers = useMemo(() => {
    return getVisibleLayers(layers)
  }, [layers])
  
  // Convert tiles to layer-based structure
  const tilesByLayer = useMemo((): Map<string, Map<string, TileData>> => {
    if (isMultiLayer) {
      // Already in multi-layer format
      return tiles as Map<string, Map<string, TileData>>
    } else {
      // Legacy single-layer format - wrap in a map with default layer ID
      const legacyLayer = layers[0]
      const layerMap = new Map<string, Map<string, TileData>>()
      layerMap.set(legacyLayer.id, tiles as Map<string, TileData>)
      return layerMap
    }
  }, [tiles, isMultiLayer, layers])
  
  return (
    <>
      {/* Grid overlay - always on top of all tile layers */}
      <TilemapGrid
        tileSize={tileSize}
        viewportX={viewportX}
        viewportY={viewportY}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        visible={showGrid}
      />
      
      {/* Render all visible layers sorted by z-index (ascending) */}
      {visibleLayers.map((layer) => {
        const layerTiles = tilesByLayer.get(layer.id) || new Map<string, TileData>()
        
        // Determine if preview tile should be shown on this layer
        const layerPreviewTile = previewTile && 
          (previewTile.layerId === layer.id || (!previewTile.layerId && layer.z === 0))
          ? previewTile
          : null
        
        return (
          <TileRenderer
            key={layer.id}
            tiles={layerTiles}
            tileSize={tileSize}
            viewportX={viewportX}
            viewportY={viewportY}
            viewportWidth={viewportWidth}
            viewportHeight={viewportHeight}
            previewTile={layerPreviewTile}
            layer={layer}
          />
        )
      })}
    </>
  )
}

