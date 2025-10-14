import { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Line } from 'react-konva'
import Konva from 'konva'
import type { ViewportTransform, ToolType } from '../types/canvas'
import {
  DEFAULT_CANVAS_CONFIG,
  DEFAULT_CANVAS_BOUNDS,
} from '../types/canvas'
import type { SelectionBox as SelectionBoxType } from '../types/selection'
import {
  createInitialSelectionBox,
  shapeIntersectsSelectionBox,
} from '../types/selection'
import { useAuth } from '../hooks/useAuth'
import { usePresence } from '../hooks/usePresence'
import { useCanvas } from '../hooks/useCanvas'
import Cursor from './Cursor'
import Rectangle from './shapes/Rectangle'
import Circle from './shapes/Circle'
import TextShape from './shapes/TextShape'
import { SelectionBox } from './shapes/SelectionBox'
import { PropertiesPanel } from './PropertiesPanel'

const CANVAS_CONFIG = DEFAULT_CANVAS_CONFIG
const CANVAS_BOUNDS = DEFAULT_CANVAS_BOUNDS
const CANVAS_ID = import.meta.env.VITE_CANVAS_ID || 'default-canvas'

interface CanvasProps {
  selectedTool: ToolType
  onShapeSelect: (id: string | null) => void
  deleteTriggered?: number
  // PR-14: Expose undo/redo state to parent
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean, undo: () => void, redo: () => void) => void
}

export default function Canvas({
  selectedTool,
  onShapeSelect,
  deleteTriggered,
  onUndoRedoChange,
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
  
  // NEW: Selection box state for drag-to-select
  const [selectionBox, setSelectionBox] = useState<SelectionBoxType>(
    createInitialSelectionBox()
  )
  const [isDrawingSelection, setIsDrawingSelection] = useState(false)
  
  // NEW: Track drag state for bulk move
  const isDraggingShapeRef = useRef(false)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null)

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
    selectedIds,
    addShape,
    addText,
    updateShape,
    deleteShape,
    setSelection,
    toggleSelection,
    selectMultiple,
    clearSelection,
    selectAll,
    bulkMove,
    bulkDelete,
    copySelected,
    paste,
    duplicateSelected,
    undo,
    redo,
    canUndo,
    canRedo,
    updateColors,
    getRecentColors,
    addRecentColor,
  } = useCanvas({
    canvasId: CANVAS_ID,
    userId: user?.uid || '',
    enableSync: true,
  })

  // Calculate container dimensions (full viewport)
  const containerWidth = window.innerWidth
  const containerHeight = window.innerHeight

  // Sync selection to presence (convert Set to array)
  useEffect(() => {
    const selectionArray = Array.from(selectedIds)
    updateSelection(selectionArray.length > 0 ? selectionArray : null)
    onShapeSelect(selectedId) // backward compatibility
  }, [selectedIds, selectedId, updateSelection, onShapeSelect])

  // Expose undo/redo to parent (PR-14)
  useEffect(() => {
    if (onUndoRedoChange) {
      onUndoRedoChange(canUndo, canRedo, undo, redo)
    }
  }, [canUndo, canRedo, undo, redo, onUndoRedoChange])

  // Handle delete from parent toolbar
  useEffect(() => {
    if (deleteTriggered && deleteTriggered > 0) {
      if (selectedIds.size > 0) {
        bulkDelete()
      } else if (selectedId) {
        deleteShape(selectedId)
      }
    }
  }, [deleteTriggered, selectedId, selectedIds, deleteShape, bulkDelete])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete/Backspace - delete selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        e.preventDefault()
        bulkDelete()
      }
      
      // Escape - clear selection
      if (e.key === 'Escape') {
        e.preventDefault()
        clearSelection()
      }
      
      // Cmd/Ctrl+A - select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        selectAll()
      }
      
      // Cmd/Ctrl+C - copy selected shapes (PR-13)
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedIds.size > 0) {
        e.preventDefault()
        copySelected()
      }
      
      // Cmd/Ctrl+V - paste shapes (PR-13)
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault()
        paste()
      }
      
      // Cmd/Ctrl+D - duplicate selected shapes (PR-13)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedIds.size > 0) {
        e.preventDefault()
        duplicateSelected()
      }
      
      // Cmd/Ctrl+Z - undo (PR-14)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z' && canUndo) {
        e.preventDefault()
        undo()
      }
      
      // Cmd/Ctrl+Shift+Z - redo (PR-14)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z' && canRedo) {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds, bulkDelete, clearSelection, selectAll, copySelected, paste, duplicateSelected, undo, redo, canUndo, canRedo])

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
   * Handle mouse down on stage - start selection box or shape creation
   */
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only handle if clicking on the stage itself (not on shapes)
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

      // Handle selection box start (only in select mode)
      if (selectedTool === 'select') {
        setIsDrawingSelection(true)
        setSelectionBox({
          startX: canvasX,
          startY: canvasY,
          currentX: canvasX,
          currentY: canvasY,
          visible: true,
        })
      }
    },
    [selectedTool, viewport]
  )

  /**
   * Handle mouse move on stage - update selection box
   */
  const handleStageMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Update selection box if drawing
      if (isDrawingSelection && selectedTool === 'select') {
        const stage = stageRef.current
        if (!stage) return

        const pointer = stage.getPointerPosition()
        if (!pointer) return

        const canvasX = (pointer.x - viewport.x) / viewport.scale
        const canvasY = (pointer.y - viewport.y) / viewport.scale

        setSelectionBox((prev) => ({
          ...prev,
          currentX: canvasX,
          currentY: canvasY,
        }))
      }

      // Also update cursor position
      handleMouseMove()
    },
    [isDrawingSelection, selectedTool, viewport, handleMouseMove]
  )

  /**
   * Handle mouse up on stage - complete selection box or shape creation
   */
  const handleStageMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current
      if (!stage) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const canvasX = (pointer.x - viewport.x) / viewport.scale
      const canvasY = (pointer.y - viewport.y) / viewport.scale

      // Handle selection box completion
      if (isDrawingSelection && selectedTool === 'select') {
        setIsDrawingSelection(false)
        
        // Find shapes that intersect with selection box
        const intersectingIds = shapes
          .filter((shape) => shapeIntersectsSelectionBox(shape, selectionBox))
          .map((shape) => shape.id)

        // Select the intersecting shapes
        if (intersectingIds.length > 0) {
          selectMultiple(intersectingIds)
        }

        // Hide selection box
        setSelectionBox((prev) => ({ ...prev, visible: false }))
        return
      }

      // Handle shape creation (only if not dragging selection box)
      if (!isDrawingSelection) {
        // Only create shapes if clicking on the stage itself
        if (e.target !== e.target.getStage()) {
          return
        }

        if (selectedTool === 'rectangle') {
          addShape('rectangle', canvasX, canvasY)
        } else if (selectedTool === 'circle') {
          addShape('circle', canvasX, canvasY)
        } else if (selectedTool === 'text') {
          setTextInput({ x: canvasX, y: canvasY, value: '' })
        } else if (selectedTool === 'select') {
          // Clear selection when clicking empty space (if not shift key)
          if (!e.evt.shiftKey) {
            clearSelection()
          }
        }
      }
    },
    [
      isDrawingSelection,
      selectedTool,
      viewport,
      selectionBox,
      shapes,
      selectMultiple,
      addShape,
      clearSelection,
    ]
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
   * Supports Shift+click for multi-select
   */
  const handleShapeSelect = useCallback(
    (shapeId: string, shiftKey: boolean) => {
      if (shiftKey) {
        // Shift+click: toggle selection
        toggleSelection(shapeId)
      } else {
        // Normal click: single select
        setSelection(shapeId)
      }
    },
    [setSelection, toggleSelection]
  )

  /**
   * Handle shape drag start
   */
  const handleShapeDragStart = useCallback(
    (shapeId: string, x: number, y: number) => {
      isDraggingShapeRef.current = true
      dragStartPosRef.current = { x, y }
      
      // If dragging a shape that's not selected, select it
      if (!selectedIds.has(shapeId)) {
        setSelection(shapeId)
      }
    },
    [selectedIds, setSelection]
  )

  /**
   * Handle shape drag end
   * Supports bulk move if multiple shapes are selected
   */
  const handleShapeDragEnd = useCallback(
    (shapeId: string, x: number, y: number) => {
      if (!dragStartPosRef.current) {
        return
      }

      const deltaX = x - dragStartPosRef.current.x
      const deltaY = y - dragStartPosRef.current.y

      // If multiple shapes are selected and this shape is one of them, bulk move
      if (selectedIds.size > 1 && selectedIds.has(shapeId)) {
        bulkMove(deltaX, deltaY)
      } else {
        // Single shape move
        updateShape(shapeId, { x, y })
      }

      isDraggingShapeRef.current = false
      dragStartPosRef.current = null
    },
    [selectedIds, bulkMove, updateShape]
  )

  /**
   * Handle shape transform end (resize/rotate)
   */
  const handleShapeTransformEnd = useCallback(
    (
      shapeId: string,
      width: number,
      height: number,
      rotation: number,
      x: number,
      y: number
    ) => {
      updateShape(shapeId, { width, height, rotation, x, y })
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
        draggable={selectedTool === 'select' && !isDrawingSelection}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onMouseMove={handleStageMouseMove}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
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
            const isSelected = selectedIds.has(shape.id)
            const userColor = getUserColor()

            if (shape.type === 'rectangle') {
              return (
                <Rectangle
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  rotation={shape.rotation}
                  fill={shape.fill}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  isSelected={isSelected}
                  selectionColor={isSelected ? userColor : undefined}
                  onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleShapeSelect(shape.id, e.evt.shiftKey)}
                  onDragStart={(x: number, y: number) => handleShapeDragStart(shape.id, x, y)}
                  onDragEnd={(x: number, y: number) => handleShapeDragEnd(shape.id, x, y)}
                  onTransformEnd={(w, h, r, x, y) => handleShapeTransformEnd(shape.id, w, h, r, x, y)}
                />
              )
            } else if (shape.type === 'circle') {
              return (
                <Circle
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  rotation={shape.rotation}
                  fill={shape.fill}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  isSelected={isSelected}
                  selectionColor={isSelected ? userColor : undefined}
                  onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleShapeSelect(shape.id, e.evt.shiftKey)}
                  onDragStart={(x: number, y: number) => handleShapeDragStart(shape.id, x, y)}
                  onDragEnd={(x: number, y: number) => handleShapeDragEnd(shape.id, x, y)}
                  onTransformEnd={(w, h, r, x, y) => handleShapeTransformEnd(shape.id, w, h, r, x, y)}
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
                  rotation={shape.rotation}
                  fill={shape.fill}
                  isSelected={isSelected}
                  selectionColor={isSelected ? userColor : undefined}
                  onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleShapeSelect(shape.id, e.evt.shiftKey)}
                  onDragStart={(x: number, y: number) => handleShapeDragStart(shape.id, x, y)}
                  onDragEnd={(x: number, y: number) => handleShapeDragEnd(shape.id, x, y)}
                  onTransformEnd={(w, h, r, x, y) => handleShapeTransformEnd(shape.id, w, h, r, x, y)}
                />
              )
            }
            return null
          })}
          
          {/* Selection Box for drag-to-select */}
          <SelectionBox selectionBox={selectionBox} />
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

      {/* Properties Panel (PR-15) */}
      <PropertiesPanel
        selectedShapes={Array.from(selectedIds).map(id => shapes.find(s => s.id === id)!).filter(Boolean)}
        onUpdateColors={(fill, stroke, strokeWidth) => updateColors(fill, stroke, strokeWidth)}
        recentColors={getRecentColors()}
      />
    </div>
  )
}

