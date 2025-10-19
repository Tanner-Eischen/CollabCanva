/**
 * Collision Shape Editor
 * Allows users to define collision shapes for game objects
 * PR-31: Physics Preview System
 */

import React, { useState, useEffect } from 'react'
import { Circle, Rect, Line } from 'react-konva'
import type Konva from 'konva'

export type CollisionShapeType = 'box' | 'circle' | 'polygon'

export interface CollisionShape {
  type: CollisionShapeType
  x: number // offset from sprite center
  y: number // offset from sprite center
  width?: number // for box
  height?: number // for box
  radius?: number // for circle
  points?: number[] // for polygon [x1, y1, x2, y2, ...]
}

interface CollisionEditorProps {
  shapeId: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  collision?: CollisionShape
  visible: boolean
  onUpdate: (collision: CollisionShape) => void
}

/**
 * CollisionEditor component
 * Visual editor for defining collision shapes on sprites
 */
export default function CollisionEditor({
  shapeId: _shapeId,
  x,
  y,
  width,
  height,
  rotation = 0,
  collision,
  visible,
  onUpdate,
}: CollisionEditorProps) {
  const [editMode, setEditMode] = useState<CollisionShapeType>('box')
  const [localCollision, setLocalCollision] = useState<CollisionShape>(
    collision || {
      type: 'box',
      x: 0,
      y: 0,
      width,
      height,
    }
  )

  useEffect(() => {
    if (collision) {
      setLocalCollision(collision)
      setEditMode(collision.type)
    }
  }, [collision])

  if (!visible) return null

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    const updated: CollisionShape = {
      ...localCollision,
      x: node.x() - x,
      y: node.y() - y,
    }
    setLocalCollision(updated)
  }

  const handleDragEnd = () => {
    onUpdate(localCollision)
  }

  const handleTransform = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as any
    
    if (localCollision.type === 'box') {
      const updated: CollisionShape = {
        ...localCollision,
        width: Math.abs(node.width() * node.scaleX()),
        height: Math.abs(node.height() * node.scaleY()),
      }
      setLocalCollision(updated)
      onUpdate(updated)
      
      // Reset scale
      node.scaleX(1)
      node.scaleY(1)
    } else if (localCollision.type === 'circle') {
      const updated: CollisionShape = {
        ...localCollision,
        radius: Math.abs(node.radius() * node.scaleX()),
      }
      setLocalCollision(updated)
      onUpdate(updated)
      
      // Reset scale
      node.scaleX(1)
      node.scaleY(1)
    }
  }

  // Render collision shape based on type
  if (localCollision.type === 'box') {
    return (
      <Rect
        x={x + (localCollision.x || 0)}
        y={y + (localCollision.y || 0)}
        width={localCollision.width || width}
        height={localCollision.height || height}
        rotation={rotation}
        stroke="#10b981" // green
        strokeWidth={2}
        dash={[5, 5]}
        fill="rgba(16, 185, 129, 0.1)"
        draggable
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransform}
      />
    )
  }

  if (localCollision.type === 'circle') {
    const radius = localCollision.radius || Math.min(width, height) / 2
    return (
      <Circle
        x={x + (localCollision.x || 0)}
        y={y + (localCollision.y || 0)}
        radius={radius}
        stroke="#10b981" // green
        strokeWidth={2}
        dash={[5, 5]}
        fill="rgba(16, 185, 129, 0.1)"
        draggable
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransform}
      />
    )
  }

  if (localCollision.type === 'polygon' && localCollision.points) {
    // Render polygon as series of lines
    const points = localCollision.points
    const lines: React.ReactElement[] = []
    
    for (let i = 0; i < points.length; i += 2) {
      const nextIndex = (i + 2) % points.length
      lines.push(
        <Line
          key={i}
          points={[
            x + points[i],
            y + points[i + 1],
            x + points[nextIndex],
            y + points[nextIndex + 1],
          ]}
          stroke="#10b981"
          strokeWidth={2}
          dash={[5, 5]}
        />
      )
    }
    
    return <>{lines}</>
  }

  return null
}


