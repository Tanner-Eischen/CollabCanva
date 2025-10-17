/**
 * TileRenderer Component
 * Efficiently renders tiles with viewport culling
 * Supports both sprite and colored tile rendering
 * Supports multi-layer rendering with parallax
 * Performance optimized with React.memo and Konva settings
 */

import React, { useMemo } from 'react'
import { Layer, Rect } from 'react-konva'
import type { TileData } from '../../types/tilemap'
import type { TileLayerMeta } from '../../types/tileLayer'
import { applyParallax } from '../../types/tileLayer'
import { coordToKey } from '../../types/tilemap'
import { getTilePath, hasSpriteAsset } from '../../constants/tilemapDefaults'
import SpriteTile from '../canvas/SpriteTile'
import AnimatedTile from '../canvas/AnimatedTile'

interface TileRendererProps {
  tiles: Map<string, TileData>
  tileSize: number
  viewportX: number
  viewportY: number
  viewportWidth: number
  viewportHeight: number
  previewTile?: { x: number; y: number; tile: TileData } | null
  showPreview?: boolean
  layer?: TileLayerMeta // Optional layer metadata for parallax and opacity
}

/**
 * Tile renderer with viewport culling
 * Only renders tiles visible in the current viewport for performance
 * Memoized to prevent unnecessary re-renders
 */
function TileRenderer({
  tiles,
  tileSize,
  viewportX,
  viewportY,
  viewportWidth,
  viewportHeight,
  previewTile,
  showPreview = true,
  layer,
}: TileRendererProps) {
  // Apply parallax offset to viewport if layer has parallax config
  const { parallaxOffsetX, parallaxOffsetY, layerOpacity } = useMemo(() => {
    if (layer?.parallax) {
      return {
        parallaxOffsetX: viewportX - applyParallax(viewportX, layer.parallax.x),
        parallaxOffsetY: viewportY - applyParallax(viewportY, layer.parallax.y),
        layerOpacity: layer.opacity ?? 1,
      }
    }
    return {
      parallaxOffsetX: 0,
      parallaxOffsetY: 0,
      layerOpacity: layer?.opacity ?? 1,
    }
  }, [layer, viewportX, viewportY])

  // Calculate visible tiles with viewport culling (accounting for parallax)
  const visibleTiles = useMemo(() => {
    const visible: Array<{ key: string; x: number; y: number; tile: TileData }> = []
    
    // Adjust viewport for parallax when calculating culling
    const effectiveViewportX = viewportX - parallaxOffsetX
    const effectiveViewportY = viewportY - parallaxOffsetY
    
    // Calculate visible tile range with some padding
    const padding = 2 // Extra tiles outside viewport
    const startX = Math.max(0, Math.floor(effectiveViewportX / tileSize) - padding)
    const endX = Math.ceil((effectiveViewportX + viewportWidth) / tileSize) + padding
    const startY = Math.max(0, Math.floor(effectiveViewportY / tileSize) - padding)
    const endY = Math.ceil((effectiveViewportY + viewportHeight) / tileSize) + padding
    
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
  }, [tiles, tileSize, viewportX, viewportY, viewportWidth, viewportHeight, parallaxOffsetX, parallaxOffsetY])
  
  return (
    <Layer
      listening={false}
      perfectDrawEnabled={false}
      hitGraphEnabled={false} // Disable hit detection for better performance
      imageSmoothingEnabled={false} // Faster rendering for pixel art
      opacity={layerOpacity}
      // Apply parallax offset to the entire layer
      x={parallaxOffsetX}
      y={parallaxOffsetY}
    >
      {/* Render visible tiles */}
      {visibleTiles.map(({ key, x, y, tile }) => {
        // Render animated tile if animation ID present
        if (tile.animationId) {
          return (
            <AnimatedTile
              key={key}
              x={x * tileSize}
              y={y * tileSize}
              tileSize={tileSize}
              animationId={tile.animationId}
              color={tile.color}
              opacity={1}
              isPlaying={true}
            />
          )
        }
        
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
        // Render animated preview if animation ID present
        if (previewTile.tile.animationId) {
          return (
            <AnimatedTile
              key="preview"
              x={previewTile.x * tileSize}
              y={previewTile.y * tileSize}
              tileSize={tileSize}
              animationId={previewTile.tile.animationId}
              color={previewTile.tile.color}
              opacity={0.5}
              isPlaying={true}
            />
          )
        }
        
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

/**
 * Export memoized version to prevent unnecessary re-renders
 * Only re-render if tiles, viewport, or layer changes
 */
export default React.memo(TileRenderer, (prevProps, nextProps) => {
  // Only re-render if these specific props changed
  return (
    prevProps.tiles === nextProps.tiles &&
    Math.floor(prevProps.viewportX / prevProps.tileSize) === Math.floor(nextProps.viewportX / nextProps.tileSize) &&
    Math.floor(prevProps.viewportY / prevProps.tileSize) === Math.floor(nextProps.viewportY / nextProps.tileSize) &&
    prevProps.viewportWidth === nextProps.viewportWidth &&
    prevProps.viewportHeight === nextProps.viewportHeight &&
    prevProps.layer?.id === nextProps.layer?.id &&
    prevProps.layer?.visible === nextProps.layer?.visible &&
    prevProps.layer?.opacity === nextProps.layer?.opacity &&
    prevProps.previewTile === nextProps.previewTile
  )
})

