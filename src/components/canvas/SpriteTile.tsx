/**
 * SpriteTile Component
 * Renders a single tile using a sprite sheet with variant-based cropping
 */

import { useEffect, useState } from 'react'
import { Image as KonvaImage, Rect } from 'react-konva'
import { useSprite } from '../../hooks/useSpriteCache'

interface SpriteTileProps {
  x: number                 // World X position (pixels)
  y: number                 // World Y position (pixels)
  tileSize: number          // Rendered tile size (16, 32, etc.)
  tilePath: string          // URL to individual tile image
  color?: string            // Fallback color if sprite fails to load
  opacity?: number          // Tile opacity
}

/**
 * Sprite Tile Renderer
 * 
 * Renders a tile from an individual tile image file.
 * Falls back to colored rectangle if image fails to load.
 * 
 * @performance
 * - Individual tile images are cached (no redundant loads)
 * - Scales tiles efficiently (16x16 → 32x32, etc.)
 */
export default function SpriteTile({
  x,
  y,
  tileSize,
  tilePath,
  color = '#888888',
  opacity = 1,
}: SpriteTileProps) {
  const image = useSprite(tilePath)
  const [isLoading, setIsLoading] = useState(!image)
  const [hasError, setHasError] = useState(false)
  
  useEffect(() => {
    if (image) {
      setIsLoading(false)
      setHasError(false)
    }
  }, [image])
  
  // Show loading/error fallback (colored rectangle)
  if (isLoading || hasError || !image) {
    return (
      <Rect
        x={x}
        y={y}
        width={tileSize}
        height={tileSize}
        fill={color}
        opacity={opacity * 0.7}
        stroke={color}
        strokeWidth={0.5}
      />
    )
  }
  
  // Render tile image
  return (
    <KonvaImage
      x={x}
      y={y}
      width={tileSize}
      height={tileSize}
      image={image}
      opacity={opacity}
      // Pixelated scaling for crisp pixel art
      imageSmoothingEnabled={false}
    />
  )
}

