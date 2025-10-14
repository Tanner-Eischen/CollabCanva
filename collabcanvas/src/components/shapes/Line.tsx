import { useRef, useEffect } from 'react'
import { Line as KonvaLine, Arrow, Transformer } from 'react-konva'
import type Konva from 'konva'

interface LineProps {
  id: string
  points: number[] // [x1, y1, x2, y2]
  fill: string // used for line color
  stroke?: string
  strokeWidth?: number
  arrows?: { start?: boolean; end?: boolean }
  isSelected: boolean
  selectionColor?: string
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onTransformEnd: (points: number[], x: number, y: number) => void
}

/**
 * Line shape component
 * Supports optional start/end arrows
 * Transformable with Transformer
 */
export default function Line({
  id: _id,
  points,
  fill,
  stroke,
  strokeWidth = 2,
  arrows,
  isSelected,
  selectionColor,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
}: LineProps) {
  const shapeRef = useRef<Konva.Line | Konva.Arrow>(null)
  const trRef = useRef<Konva.Transformer>(null)

  // Calculate position from points (use first point as position)
  const x = points[0]
  const y = points[1]
  
  // Convert absolute points to relative points
  const relativePoints = [0, 0, points[2] - points[0], points[3] - points[1]]

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

    // Reset scale
    node.scaleX(1)
    node.scaleY(1)

    // Get current points and scale them
    const currentPoints = (node as any).points() || relativePoints
    const newPoints = [
      currentPoints[0],
      currentPoints[1],
      currentPoints[2] * scaleX,
      currentPoints[3] * scaleY,
    ]

    // Convert back to absolute coordinates
    const absPoints = [
      node.x() + newPoints[0],
      node.y() + newPoints[1],
      node.x() + newPoints[2],
      node.y() + newPoints[3],
    ]

    onTransformEnd(absPoints, node.x(), node.y())
  }

  // Determine if we should use Arrow or Line component
  const hasArrows = arrows?.start || arrows?.end

  return (
    <>
      {hasArrows ? (
        <Arrow
          ref={shapeRef as any}
          x={x}
          y={y}
          points={relativePoints}
          stroke={fill}
          strokeWidth={strokeWidth}
          fill={fill}
          pointerAtBeginning={arrows.start}
          pointerAtEnding={arrows.end}
          pointerLength={10}
          pointerWidth={10}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />
      ) : (
        <KonvaLine
          ref={shapeRef as any}
          x={x}
          y={y}
          points={relativePoints}
          stroke={fill}
          strokeWidth={strokeWidth}
          lineCap="round"
          lineJoin="round"
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />
      )}

      {/* Transformer for line endpoints */}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Allow any size for lines
            return newBox
          }}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
          ]}
          rotateEnabled={false}
        />
      )}
    </>
  )
}

