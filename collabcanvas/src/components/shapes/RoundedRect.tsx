import { useRef, useEffect } from 'react'
import { Rect, Transformer } from 'react-konva'
import type Konva from 'konva'

interface RoundedRectProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  fill: string
  stroke?: string
  strokeWidth?: number
  cornerRadius: number // 0-50px
  isSelected: boolean
  selectionColor?: string
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onTransformEnd: (width: number, height: number, rotation: number, x: number, y: number) => void
}

/**
 * Rounded Rectangle shape component
 * Rectangle with adjustable corner radius (0-50px)
 * Supports fill, stroke, resize, and rotate
 */
export default function RoundedRect({
  id: _id,
  x,
  y,
  width,
  height,
  rotation = 0,
  fill,
  stroke,
  strokeWidth = 0,
  cornerRadius,
  isSelected,
  selectionColor,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
}: RoundedRectProps) {
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
      {/* Main Rounded Rectangle */}
      <Rect
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        cornerRadius={Math.max(0, Math.min(50, cornerRadius))}
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

