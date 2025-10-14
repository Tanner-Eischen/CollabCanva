import { Rect } from 'react-konva'
import type Konva from 'konva'
import { DEFAULT_CANVAS_CONFIG } from '../../types/canvas'

interface RectangleProps {
  id: string
  x: number
  y: number
  isSelected: boolean
  selectionColor?: string
  onSelect: () => void
  onDragEnd: (x: number, y: number) => void
}

/**
 * Rectangle shape component
 * Fixed 100x100px, blue color (#3B82F6), NO transformer/resize
 */
export default function Rectangle({
  id,
  x,
  y,
  isSelected,
  selectionColor,
  onSelect,
  onDragEnd,
}: RectangleProps) {
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

