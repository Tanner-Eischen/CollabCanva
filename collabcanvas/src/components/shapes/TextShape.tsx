import { Text, Rect } from 'react-konva'
import type Konva from 'konva'
import { DEFAULT_CANVAS_CONFIG } from '../../types/canvas'

interface TextShapeProps {
  id: string
  x: number
  y: number
  text: string
  width: number
  height: number
  isSelected: boolean
  selectionColor?: string
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
}

/**
 * Text shape component
 * Blue color (#3B82F6), auto-sized to content, NO editing after creation
 * Supports multi-select highlighting
 */
export default function TextShape({
  id: _id,
  x,
  y,
  text,
  width,
  height,
  isSelected,
  selectionColor,
  onSelect,
  onDragStart,
  onDragEnd,
}: TextShapeProps) {
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
      {/* Main Text */}
      <Text
        x={x}
        y={y}
        text={text}
        fontSize={20}
        fontFamily="Arial, sans-serif"
        fill={DEFAULT_CANVAS_CONFIG.defaultColor}
        width={width}
        height={height}
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
          width={width}
          height={height}
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

