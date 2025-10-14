import { useRef, useEffect } from 'react'
import { Text, Transformer } from 'react-konva'
import type Konva from 'konva'

interface TextShapeProps {
  id: string
  x: number
  y: number
  text: string
  width: number
  height: number
  rotation?: number
  fill: string
  isSelected: boolean
  selectionColor?: string
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onTransformEnd: (width: number, height: number, rotation: number, x: number, y: number) => void
}

/**
 * Text shape component
 * Customizable color (fill only, no stroke), auto-sized to content, NO editing after creation
 * Resizable (width) but NO rotation
 * Supports multi-select highlighting
 */
export default function TextShape({
  id: _id,
  x,
  y,
  text,
  width,
  height: _height,
  rotation = 0,
  fill,
  isSelected,
  selectionColor: _selectionColor,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
}: TextShapeProps) {
  const shapeRef = useRef<Konva.Text>(null)
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

    // Reset scale to 1 and apply to width instead
    node.scaleX(1)
    node.scaleY(1)

    // Text height auto-adjusts based on content and width
    onTransformEnd(
      Math.max(50, node.width() * scaleX), // min width 50px
      node.height(), // auto-calculated by Konva
      0, // no rotation for text
      node.x(),
      node.y()
    )
  }

  return (
    <>
      {/* Main Text */}
      <Text
        ref={shapeRef}
        x={x}
        y={y}
        text={text}
        fontSize={20}
        fontFamily="Arial, sans-serif"
        fill={fill}
        width={width}
        rotation={rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />

      {/* Transformer for width resize only (no rotation for text) - Figma style (PR-20) */}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum width
            if (newBox.width < 50) {
              return oldBox
            }
            // Limit maximum width to canvas bounds
            if (newBox.width > 5000) {
              return oldBox
            }
            return newBox
          }}
          enabledAnchors={[
            'middle-left',
            'middle-right',
          ]}
          rotateEnabled={false}
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

