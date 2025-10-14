import { useRef, useEffect } from 'react'
import { Rect, Transformer } from 'react-konva'
import type Konva from 'konva'
import { DEFAULT_CANVAS_CONFIG } from '../../types/canvas'

interface RectangleProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  isSelected: boolean
  selectionColor?: string
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onTransformEnd: (width: number, height: number, rotation: number, x: number, y: number) => void
}

/**
 * Rectangle shape component
 * Variable size, blue color (#3B82F6), with Transformer for resize/rotate
 * Supports multi-select highlighting
 */
export default function Rectangle({
  id: _id,
  x,
  y,
  width,
  height,
  rotation = 0,
  isSelected,
  selectionColor,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
}: RectangleProps) {
  const shapeRef = useRef<Konva.Rect>(null)
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

    // Reset scale to 1 and apply to width/height instead
    node.scaleX(1)
    node.scaleY(1)

    onTransformEnd(
      Math.max(10, node.width() * scaleX), // min width 10px
      Math.max(10, node.height() * scaleY), // min height 10px
      node.rotation(),
      node.x(),
      node.y()
    )
  }

  return (
    <>
      {/* Main Rectangle */}
      <Rect
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        rotation={rotation}
        fill={DEFAULT_CANVAS_CONFIG.defaultColor}
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

