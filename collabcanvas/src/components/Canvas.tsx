import { useRef, useState, useCallback } from 'react'
import { Stage, Layer, Line } from 'react-konva'
import Konva from 'konva'
import {
  ViewportTransform,
  DEFAULT_CANVAS_CONFIG,
  DEFAULT_CANVAS_BOUNDS,
} from '../types/canvas'
import { useAuth } from '../hooks/useAuth'
import { usePresence } from '../hooks/usePresence'
import Cursor from './Cursor'

const CANVAS_CONFIG = DEFAULT_CANVAS_CONFIG
const CANVAS_BOUNDS = DEFAULT_CANVAS_BOUNDS
const CANVAS_ID = import.meta.env.VITE_CANVAS_ID || 'default-canvas'

export default function Canvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const [viewport, setViewport] = useState<ViewportTransform>({
    x: 0,
    y: 0,
    scale: 1,
  })

  // Auth and presence hooks
  const { user } = useAuth()
  const { otherUsers, updateCursorPosition } = usePresence({
    userId: user?.uid || 'anonymous',
    userName: user?.displayName || user?.email || 'Anonymous',
    canvasId: CANVAS_ID,
  })

  // Calculate container dimensions (full viewport)
  const containerWidth = window.innerWidth
  const containerHeight = window.innerHeight

  /**
   * Handle mouse wheel for zoom functionality
   */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()

      const stage = stageRef.current
      if (!stage) return

      const oldScale = viewport.scale
      const pointer = stage.getPointerPosition()
      if (!pointer) return

      // Calculate new scale based on wheel direction
      const scaleBy = 1.05
      const newScale =
        e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

      // Clamp scale to min/max values
      const clampedScale = Math.max(
        CANVAS_CONFIG.minScale,
        Math.min(CANVAS_CONFIG.maxScale, newScale)
      )

      // Calculate new position to zoom towards mouse pointer
      const mousePointTo = {
        x: (pointer.x - viewport.x) / oldScale,
        y: (pointer.y - viewport.y) / oldScale,
      }

      const newX = pointer.x - mousePointTo.x * clampedScale
      const newY = pointer.y - mousePointTo.y * clampedScale

      setViewport({
        x: newX,
        y: newY,
        scale: clampedScale,
      })
    },
    [viewport]
  )

  /**
   * Handle drag end for pan functionality with boundary enforcement
   */
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target as Konva.Stage
    const newX = stage.x()
    const newY = stage.y()
    const scale = stage.scaleX()

    // Calculate visible canvas boundaries
    const visibleWidth = containerWidth / scale
    const visibleHeight = containerHeight / scale

    // Enforce hard boundaries - prevent panning beyond canvas edges
    const clampedX = Math.min(
      0,
      Math.max(newX, containerWidth - CANVAS_BOUNDS.maxX * scale)
    )
    const clampedY = Math.min(
      0,
      Math.max(newY, containerHeight - CANVAS_BOUNDS.maxY * scale)
    )

    // Only update if boundaries were exceeded
    if (clampedX !== newX || clampedY !== newY) {
      stage.position({ x: clampedX, y: clampedY })
    }

    setViewport({
      x: clampedX,
      y: clampedY,
      scale,
    })
  }, [])

  /**
   * Handle mouse move for cursor position tracking
   */
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current
      if (!stage) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      // Convert screen coordinates to canvas coordinates
      const canvasX = (pointer.x - viewport.x) / viewport.scale
      const canvasY = (pointer.y - viewport.y) / viewport.scale

      // Update cursor position (throttled to 20Hz in usePresence)
      updateCursorPosition(canvasX, canvasY)
    },
    [viewport, updateCursorPosition]
  )

  /**
   * Generate grid lines for visual reference
   */
  const generateGridLines = useCallback(() => {
    const lines: JSX.Element[] = []
    const spacing = CANVAS_CONFIG.gridSpacing

    // Vertical lines
    for (let x = 0; x <= CANVAS_BOUNDS.maxX; x += spacing) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, CANVAS_BOUNDS.maxY]}
          stroke="#E5E7EB"
          strokeWidth={1}
          listening={false}
        />
      )
    }

    // Horizontal lines
    for (let y = 0; y <= CANVAS_BOUNDS.maxY; y += spacing) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, CANVAS_BOUNDS.maxX, y]}
          stroke="#E5E7EB"
          strokeWidth={1}
          listening={false}
        />
      )
    }

    return lines
  }, [])

  return (
    <div className="w-full h-screen bg-gray-100 overflow-hidden">
      <Stage
        ref={stageRef}
        width={containerWidth}
        height={containerHeight}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onMouseMove={handleMouseMove}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
      >
        {/* Grid Layer - renders behind all shapes */}
        <Layer listening={false}>
          {generateGridLines()}
        </Layer>

        {/* Shapes Layer - will be populated in future PRs */}
        <Layer>
          {/* Shapes will be added here in PR-6 */}
        </Layer>

        {/* Cursors Layer - render other users' cursors */}
        <Layer listening={false}>
          {Array.from(otherUsers.entries()).map(([userId, presence]) => (
            <Cursor
              key={userId}
              x={presence.c[0]}
              y={presence.c[1]}
              userName={presence.n}
              color={presence.cl}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

