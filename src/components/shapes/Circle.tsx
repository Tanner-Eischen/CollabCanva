import { useRef, useEffect } from 'react'
import { Circle as KonvaCircle, Transformer } from 'react-konva'
import type Konva from 'konva'

interface CircleProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  fill: string
  stroke?: string
  strokeWidth?: number
  isSelected: boolean
  selectionColor?: string
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onTransformEnd: (width: number, height: number, rotation: number, x: number, y: number) => void
  locked?: boolean
}

/**
 * Circle shape component
 * Variable size (ellipse), customizable colors, with Transformer for resize/rotate
 * Supports multi-select highlighting
 */
export default function Circle({
  id: _id,
  x,
  y,
  width,
  height,
  rotation = 0,
  fill,
  stroke,
  strokeWidth = 0,
  isSelected,
  selectionColor: _selectionColor,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
  locked = false,
}: CircleProps) {
  const shapeRef = useRef<Konva.Circle>(null)
  const trRef = useRef<Konva.Transformer>(null)

  const radiusX = width / 2
  const radiusY = height / 2

  // Attach transformer to shape when selected
  useEffect(() => {
    if (isSelected && !locked && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected, locked])

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

    const radius = node.radius()
    onTransformEnd(
      Math.max(10, radius * 2 * scaleX), // min width 10px
      Math.max(10, radius * 2 * scaleY), // min height 10px
      node.rotation(),
      node.x() - radius * scaleX, // adjust x for radius change
      node.y() - radius * scaleY  // adjust y for radius change
    )
  }

  return (
    <>
      {/* Main Circle (positioned at center, so offset by radius) */}
      <KonvaCircle
        ref={shapeRef}
        x={x + radiusX}
        y={y + radiusY}
        radiusX={radiusX}
        radiusY={radiusY}
        rotation={rotation}
        fill={fill}
        stroke={stroke || '#000000'}
        strokeWidth={strokeWidth || 0}
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

