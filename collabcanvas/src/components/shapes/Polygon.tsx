import { useRef, useEffect } from 'react'
import { RegularPolygon, Transformer } from 'react-konva'
import type Konva from 'konva'

interface PolygonProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  fill: string
  stroke?: string
  strokeWidth?: number
  sides: number // 3-12 sides
  isSelected: boolean
  selectionColor?: string
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onTransformEnd: (width: number, height: number, rotation: number, x: number, y: number) => void
}

/**
 * Polygon shape component
 * Regular polygon with 3-12 sides
 * Auto-cached when >6 sides for performance
 */
export default function Polygon({
  id: _id,
  x,
  y,
  width,
  height,
  rotation = 0,
  fill,
  stroke,
  strokeWidth = 0,
  sides,
  isSelected,
  selectionColor,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
}: PolygonProps) {
  const shapeRef = useRef<Konva.RegularPolygon>(null)
  const trRef = useRef<Konva.Transformer>(null)

  // Calculate radius from width/height (use average)
  const radius = (width + height) / 4

  // Attach transformer to shape when selected
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  // Auto-cache for polygons with >6 sides (performance optimization)
  useEffect(() => {
    if (shapeRef.current && sides > 6) {
      shapeRef.current.cache()
    }
  }, [sides])

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    onDragStart(node.x(), node.y())
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    onDragEnd(node.x(), node.y())
  }

  const handleTransformEnd = () => {
    const node = shapeRef.current
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale to 1 and apply to radius instead
    node.scaleX(1)
    node.scaleY(1)

    // Calculate new width/height from scaled radius
    const newRadius = node.radius() * Math.max(scaleX, scaleY)
    const newWidth = newRadius * 2
    const newHeight = newRadius * 2

    onTransformEnd(
      Math.max(10, newWidth),
      Math.max(10, newHeight),
      node.rotation(),
      node.x(),
      node.y()
    )
  }

  return (
    <>
      {/* Main Polygon */}
      <RegularPolygon
        ref={shapeRef}
        x={x + radius}
        y={y + radius}
        sides={Math.max(3, Math.min(12, sides))}
        radius={radius}
        rotation={rotation}
        fill={fill}
        stroke={strokeWidth && strokeWidth > 0 ? stroke : undefined}
        strokeWidth={strokeWidth}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />

      {/* Transformer for resize/rotate handles */}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox
            }
            // Limit maximum size to canvas bounds
            if (newBox.width > 5000 || newBox.height > 5000) {
              return oldBox
            }
            return newBox
          }}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
          ]}
          rotateEnabled={true}
        />
      )}
    </>
  )
}

