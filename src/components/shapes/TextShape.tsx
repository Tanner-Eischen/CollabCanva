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
  // PR-25: Text formatting properties
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right'
  textDecoration?: '' | 'underline' | 'line-through'
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onTransformEnd: (width: number, height: number, rotation: number, x: number, y: number) => void
  onDoubleClick?: () => void // PR-25: Double-click to edit
  locked?: boolean
}

/**
 * Text shape component (PR-25: Enhanced with text formatting)
 * Customizable color, font properties, editable on double-click
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
  fontFamily = 'Inter, sans-serif',
  fontSize = 20,
  fontWeight = 'normal',
  fontStyle = 'normal',
  textAlign = 'left',
  textDecoration = '',
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
  onDoubleClick,
  locked = false,
}: TextShapeProps) {
  const shapeRef = useRef<Konva.Text>(null)
  const trRef = useRef<Konva.Transformer>(null)

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
      {/* Main Text - PR-25: Now with font properties and double-click */}
      <Text
        ref={shapeRef}
        x={x}
        y={y}
        text={text}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontStyle={`${fontStyle} ${fontWeight}`} // Konva combines style and weight
        textDecoration={textDecoration}
        align={textAlign}
        fill={fill}
        width={width}
        rotation={rotation}
        draggable={!locked}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick}
        onDblTap={onDoubleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />

      {/* Transformer for width resize only (no rotation for text) - Figma style (PR-20) */}
      {isSelected && !locked && (
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

