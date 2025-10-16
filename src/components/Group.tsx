/**
 * Group Component (PR-19)
 * Konva Group wrapper that renders all member shapes together
 * Supports dragging entire group and selection indication
 */

import { useRef, useEffect } from 'react'
import { Group as KonvaGroup, Rect } from 'react-konva'
import type Konva from 'konva'

interface GroupProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  isSelected: boolean
  selectionColor?: string
  locked?: boolean
  visible?: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  children: React.ReactNode
}

/**
 * Group component that renders a collection of shapes as a single unit
 * Shows dashed bounding box when selected
 * Handles drag for entire group
 */
export default function Group({
  id: _id,
  x,
  y,
  width,
  height,
  rotation = 0,
  isSelected,
  selectionColor = '#6366F1',
  locked = false,
  visible = true,
  onSelect,
  onDragStart,
  onDragEnd,
  children,
}: GroupProps) {
  const groupRef = useRef<Konva.Group>(null)

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.getLayer()?.batchDraw()
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

  if (!visible) {
    return null
  }

  return (
    <KonvaGroup
      ref={groupRef}
      x={x}
      y={y}
      rotation={rotation}
      draggable={!locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Render children (member shapes) */}
      {children}

      {/* Selection indicator - dashed bounding box */}
      {isSelected && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          stroke={selectionColor}
          strokeWidth={2}
          dash={[10, 5]}
          fill="transparent"
          listening={false} // Don't intercept mouse events
        />
      )}

      {/* Locked indicator - small lock icon position */}
      {locked && (
        <Rect
          x={width - 20}
          y={-20}
          width={16}
          height={16}
          fill="#EF4444"
          cornerRadius={2}
          listening={false}
        />
      )}
    </KonvaGroup>
  )
}

