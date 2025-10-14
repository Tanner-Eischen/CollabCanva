import { Rect } from 'react-konva'
import type Konva from 'konva'
import { DEFAULT_CANVAS_CONFIG } from '../../types/canvas'

interface RectangleProps {
  id: string
  x: number
  y: number
  isSelected: boolean
  selectionColor?: string
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
}

/**
 * Rectangle shape component
 * Fixed 100x100px, blue color (#3B82F6), NO transformer/resize
 * Supports multi-select highlighting
 */
export default function Rectangle({
  id: _id,
  x,
  y,
  isSelected,
  selectionColor,
  onSelect,
  onDragStart,
  onDragEnd,
}: RectangleProps) {
  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    onDragStart(node.x(), node.y())
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    onDragEnd(node.x(), node.y())
  }

  return (
    <>
      {/* Main Rectangle */}
      <Rect
        x={x}
        y={y}
        width={DEFAULT_CANVAS_CONFIG.defaultShapeSize}
        height={DEFAULT_CANVAS_CONFIG.defaultShapeSize}
        fill={DEFAULT_CANVAS_CONFIG.defaultColor}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />

      {/* Selection Indicator (bounding box in user's color) */}
      {isSelected && selectionColor && (
        <Rect
          x={x}
          y={y}
          width={DEFAULT_CANVAS_CONFIG.defaultShapeSize}
          height={DEFAULT_CANVAS_CONFIG.defaultShapeSize}
          stroke={selectionColor}
          strokeWidth={3}
          fill="transparent"
          listening={false}
          dash={[5, 5]}
        />
      )}
    </>
  )
}

