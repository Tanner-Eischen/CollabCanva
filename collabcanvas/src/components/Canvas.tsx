import { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Line } from 'react-konva'
import Konva from 'konva'
import type { ViewportTransform, ToolType } from '../types/canvas'
import {
  DEFAULT_CANVAS_CONFIG,
  DEFAULT_CANVAS_BOUNDS,
} from '../types/canvas'
import { useAuth } from '../hooks/useAuth'
import { usePresence } from '../hooks/usePresence'
import { useCanvas } from '../hooks/useCanvas'
import Cursor from './Cursor'
import Rectangle from './shapes/Rectangle'
import Circle from './shapes/Circle'
import TextShape from './shapes/TextShape'

const CANVAS_CONFIG = DEFAULT_CANVAS_CONFIG
const CANVAS_BOUNDS = DEFAULT_CANVAS_BOUNDS
const CANVAS_ID = import.meta.env.VITE_CANVAS_ID || 'default-canvas'

interface CanvasProps {
  selectedTool: ToolType
  onShapeSelect: (id: string | null) => void
  deleteTriggered?: number
}

export default function Canvas({
  selectedTool,
  onShapeSelect,
  deleteTriggered,
}: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const [viewport, setViewport] = useState<ViewportTransform>({
    x: 0,
    y: 0,
    scale: 1,
  })
  const [textInput, setTextInput] = useState<{
    x: number
    y: number
    value: string
  } | null>(null)

  // Hooks
  const { user } = useAuth()
  const { otherUsers, updateCursorPosition, updateSelection } = usePresence({
    userId: user?.uid || '',
    userName: user?.displayName || user?.email || 'Anonymous',
    canvasId: CANVAS_ID,
  })
  const {
    shapes,
    selectedId,
    addShape,
    addText,
    updateShape,
    deleteShape,
    setSelection,
  } = useCanvas({
    canvasId: CANVAS_ID,
    userId: user?.uid || '',
    enableSync: true,
  })

  // Calculate container dimensions (full viewport)
  const containerWidth = window.innerWidth
  const containerHeight = window.innerHeight

  // Sync selection to presence
  useEffect(() => {
    updateSelection(selectedId)
    onShapeSelect(selectedId)
  }, [selectedId, updateSelection, onShapeSelect])

  // Handle delete from parent toolbar
  useEffect(() => {
    if (deleteTriggered && deleteTriggered > 0 && selectedId) {
      deleteShape(selectedId)
    }
  }, [deleteTriggered, selectedId, deleteShape])

  // Keyboard shortcut for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        deleteShape(selectedId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, deleteShape])

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
    () => {
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
   * Handle canvas click for shape creation
   */
  const handleCanvasClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only create shapes if clicking on the stage itself (not on shapes)
      if (e.target !== e.target.getStage()) {
        return
      }

      const stage = stageRef.current
      if (!stage) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      // Convert screen coordinates to canvas coordinates
      const canvasX = (pointer.x - viewport.x) / viewport.scale
      const canvasY = (pointer.y - viewport.y) / viewport.scale

      // Handle shape creation based on selected tool
      if (selectedTool === 'rectangle') {
        addShape('rectangle', canvasX, canvasY)
      } else if (selectedTool === 'circle') {
        addShape('circle', canvasX, canvasY)
      } else if (selectedTool === 'text') {
        // Show text input for text tool
        setTextInput({ x: canvasX, y: canvasY, value: '' })
      } else if (selectedTool === 'select') {
        // Clear selection when clicking empty space
        setSelection(null)
      }
    },
    [selectedTool, viewport, addShape, setSelection]
  )

  /**
   * Handle text input submission
   */
  const handleTextSubmit = useCallback(() => {
    if (textInput && textInput.value.trim()) {
      addText(textInput.value, textInput.x, textInput.y)
    }
    setTextInput(null)
  }, [textInput, addText])

  /**
   * Handle text input cancel
   */
  const handleTextCancel = useCallback(() => {
    setTextInput(null)
  }, [])

  /**
   * Handle shape selection
   */
  const handleShapeSelect = useCallback(
    (shapeId: string) => {
      setSelection(shapeId)
    },
    [setSelection]
  )

  /**
   * Handle shape drag end
   */
  const handleShapeDragEnd = useCallback(
    (shapeId: string, x: number, y: number) => {
      updateShape(shapeId, { x, y })
    },
    [updateShape]
  )

  /**
   * Get user color for selection indicator
   */
  const getUserColor = useCallback(() => {
    // Return current user's color from presence (will be synced in PR-7)
    return '#3B82F6' // Default blue for now
  }, [])

  /**
   * Generate grid lines for visual reference
   */
  const generateGridLines = useCallback((): React.ReactNode[] => {
    const lines: React.ReactNode[] = []
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
    <div className="w-full h-screen bg-gray-100 overflow-hidden relative">
      <Stage
        ref={stageRef}
        width={containerWidth}
        height={containerHeight}
        draggable={selectedTool === 'select'}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
      >
        {/* Grid Layer - renders behind all shapes */}
        <Layer listening={false}>
          {generateGridLines()}
        </Layer>

        {/* Shapes Layer */}
        <Layer>
          {shapes.map((shape) => {
            const isSelected = shape.id === selectedId
            const userColor = getUserColor()

            if (shape.type === 'rectangle') {
              return (
                <Rectangle
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  isSelected={isSelected}
                  selectionColor={isSelected ? userColor : undefined}
                  onSelect={() => handleShapeSelect(shape.id)}
                  onDragEnd={(x, y) => handleShapeDragEnd(shape.id, x, y)}
                />
              )
            } else if (shape.type === 'circle') {
              return (
                <Circle
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  isSelected={isSelected}
                  selectionColor={isSelected ? userColor : undefined}
                  onSelect={() => handleShapeSelect(shape.id)}
                  onDragEnd={(x, y) => handleShapeDragEnd(shape.id, x, y)}
                />
              )
            } else if (shape.type === 'text' && shape.text) {
              return (
                <TextShape
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  text={shape.text}
                  width={shape.width}
                  height={shape.height}
                  isSelected={isSelected}
                  selectionColor={isSelected ? userColor : undefined}
                  onSelect={() => handleShapeSelect(shape.id)}
                  onDragEnd={(x, y) => handleShapeDragEnd(shape.id, x, y)}
                />
              )
            }
            return null
          })}
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

      {/* Text Input Overlay */}
      {textInput && (
        <div
          className="absolute bg-white border-2 border-blue-500 rounded shadow-lg p-2"
          style={{
            left: textInput.x * viewport.scale + viewport.x,
            top: textInput.y * viewport.scale + viewport.y,
            zIndex: 1000,
          }}
        >
          <input
            type="text"
            autoFocus
            value={textInput.value}
            onChange={(e) =>
              setTextInput({ ...textInput, value: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTextSubmit()
              } else if (e.key === 'Escape') {
                handleTextCancel()
              }
            }}
            onBlur={handleTextCancel}
            placeholder="Type text..."
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            style={{ width: '200px' }}
          />
          <div className="text-xs text-gray-500 mt-1">
            Press Enter to create, Esc to cancel
          </div>
        </div>
      )}
    </div>
  )
}

