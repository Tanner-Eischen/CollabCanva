/**
 * Path Component (PR-21)
 * Konva Line component for freehand drawing with pencil and pen tools
 */

import { useRef, useEffect } from 'react'
import { Line, Transformer } from 'react-konva'
import type Konva from 'konva'

interface PathProps {
  id: string
  points: number[] // [x1, y1, x2, y2, ...]
  stroke: string
  strokeWidth: number
  tension?: number // 0 = sharp (pencil), 0.5 = smooth (pen)
  closed?: boolean
  isSelected: boolean
  selectionColor?: string
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onTransformEnd: (points: number[], x: number, y: number) => void
}

/**
 * Path shape component for freehand drawing
 * Renders as Konva Line with tension control
 */
export default function Path({
  id: _id,
  points,
  stroke,
  strokeWidth,
  tension = 0,
  closed = false,
  isSelected,
  selectionColor: _selectionColor,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
}: PathProps) {
  const shapeRef = useRef<Konva.Line>(null)
  const trRef = useRef<Konva.Transformer>(null)

  // Attach transformer to shape when selected
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

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

    // Reset scale to 1 and apply to points instead
    node.scaleX(1)
    node.scaleY(1)

    // Scale the points
    const currentPoints = node.points()
    const scaledPoints = currentPoints.map((point, index) => {
      if (index % 2 === 0) {
        // x coordinate
        return point * scaleX
      } else {
        // y coordinate
        return point * scaleY
      }
    })

    onTransformEnd(scaledPoints, node.x(), node.y())
  }

  return (
    <>
      {/* Main Path */}
      <Line
        ref={shapeRef}
        points={points}
        stroke={stroke}
        strokeWidth={strokeWidth}
        tension={tension}
        closed={closed}
        lineCap="round"
        lineJoin="round"
        bezier={tension > 0}
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

