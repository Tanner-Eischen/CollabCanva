/**
 * TilemapGrid Component
 * Renders a grid overlay for the tilemap editor
 * Uses FastLayer for optimal performance
 */

import { useMemo } from 'react'
import { Layer, Line } from 'react-konva'

interface TilemapGridProps {
  tileSize: number
  viewportX: number
  viewportY: number
  viewportWidth: number
  viewportHeight: number
  visible?: boolean
  opacity?: number
  color?: string
}

/**
 * Grid overlay component for tilemap editing
 * Only renders visible grid lines within the viewport for performance
 */
export default function TilemapGrid({
  tileSize,
  viewportX,
  viewportY,
  viewportWidth,
  viewportHeight,
  visible = true,
  opacity = 0.3,
  color = '#94a3b8', // slate-400
}: TilemapGridProps) {
  // Calculate grid lines to render (only visible ones)
  const gridLines = useMemo(() => {
    if (!visible) return { vertical: [], horizontal: [] }
    
    // Calculate visible tile range with padding
    const startX = Math.floor(viewportX / tileSize) * tileSize
    const endX = Math.ceil((viewportX + viewportWidth) / tileSize) * tileSize
    const startY = Math.floor(viewportY / tileSize) * tileSize
    const endY = Math.ceil((viewportY + viewportHeight) / tileSize) * tileSize
    
    const vertical: number[][] = []
    const horizontal: number[][] = []
    
    // Vertical lines (x-axis)
    for (let x = startX; x <= endX; x += tileSize) {
      if (x >= 0) { // Only positive coordinates
        vertical.push([x, Math.max(0, startY), x, endY])
      }
    }
    
    // Horizontal lines (y-axis)
    for (let y = startY; y <= endY; y += tileSize) {
      if (y >= 0) { // Only positive coordinates
        horizontal.push([Math.max(0, startX), y, endX, y])
      }
    }
    
    return { vertical, horizontal }
  }, [tileSize, viewportX, viewportY, viewportWidth, viewportHeight, visible])
  
  return (
    <Layer
      listening={false}
      perfectDrawEnabled={false}
      visible={visible}
    >
      {/* Vertical grid lines */}
      {gridLines.vertical.map((points, index) => (
        <Line
          key={`v-${index}`}
          points={points}
          stroke={color}
          strokeWidth={1}
          opacity={opacity}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}
      
      {/* Horizontal grid lines */}
      {gridLines.horizontal.map((points, index) => (
        <Line
          key={`h-${index}`}
          points={points}
          stroke={color}
          strokeWidth={1}
          opacity={opacity}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}
    </Layer>
  )
}

