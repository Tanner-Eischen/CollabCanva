import { useRef, useEffect } from 'react'
import { Star as KonvaStar, Transformer } from 'react-konva'
import type Konva from 'konva'

interface StarProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  fill: string
  stroke?: string
  strokeWidth?: number
  sides: number // 3-12 points (referred to as "points" in UI but stored as sides)
  isSelected: boolean
  selectionColor?: string
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onTransformEnd: (width: number, height: number, rotation: number, x: number, y: number) => void
  locked?: boolean
}

/**
 * Star shape component
 * Star with 3-12 points
 * Auto-cached when >6 points for performance
 */
export default function Star({
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
  selectionColor: _selectionColor,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
  locked = false,
}: StarProps) {
  const shapeRef = useRef<Konva.Star>(null)
  const trRef = useRef<Konva.Transformer>(null)

  // Calculate outer and inner radius from width/height
  const outerRadius = (width + height) / 4
  const innerRadius = outerRadius * 0.5 // Inner radius is 50% of outer

  // Attach transformer to shape when selected
  useEffect(() => {
    if (isSelected && !locked && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected, locked])

  // Auto-cache for stars with >6 points (performance optimization)
  useEffect(() => {
    if (shapeRef.current && sides > 6) {
      shapeRef.current.cache()
    }
  }, [sides])

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (locked) return
    const node = e.target
    onDragStart(node.x(), node.y())
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (locked) return
    const node = e.target
    onDragEnd(node.x(), node.y())
  }

  const handleTransformEnd = () => {
    if (locked) return
    const node = shapeRef.current
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale to 1 and apply to radius instead
    node.scaleX(1)
    node.scaleY(1)

    // Calculate new width/height from scaled radius
    const newOuterRadius = node.outerRadius() * Math.max(scaleX, scaleY)
    const newWidth = newOuterRadius * 2
    const newHeight = newOuterRadius * 2

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
      {/* Main Star */}
      <KonvaStar
        ref={shapeRef}
        x={x + outerRadius}
        y={y + outerRadius}
        numPoints={Math.max(3, Math.min(12, sides))}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        rotation={rotation}
        fill={fill}
        stroke={strokeWidth && strokeWidth > 0 ? stroke : undefined}
        strokeWidth={strokeWidth}
        draggable={!locked}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />

      {/* Transformer for resize/rotate handles - Figma style (PR-20) */}
      {isSelected && !locked && (
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
          borderStroke="#6366F1"
          borderStrokeWidth={2}
          anchorFill="#FFFFFF"
          anchorStroke="#6366F1"
          anchorStrokeWidth={2}
          anchorSize={8}
          anchorCornerRadius={2}
        />
      )}
    </>
  )
}

