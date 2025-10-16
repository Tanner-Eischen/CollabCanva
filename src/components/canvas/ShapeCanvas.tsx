import { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Line as KonvaLine } from 'react-konva'
import Konva from 'konva'
import type { ViewportTransform, ToolType, Shape } from '../../types/canvas'
import { DEFAULT_CANVAS_BOUNDS } from '../../types/canvas'
import type { SelectionBox as SelectionBoxType } from '../../types/selection'
import {
  createInitialSelectionBox,
  shapeIntersectsSelectionBox,
} from '../../types/selection'
import { useAuth } from '../../hooks/useAuth'
import { usePresence } from '../../hooks/usePresence'
import { useCanvas } from '../../hooks/useCanvas'
import { useGroups } from '../../hooks/useGroups'
import { useCanvasViewport } from '../../hooks/useCanvasViewport'
import { useShapeKeyboardShortcuts } from '../../hooks/useShapeKeyboardShortcuts'
import { simplifyPath } from '../../utils/pathHelpers'
import Cursor from '../Cursor'
import { SelectionBox } from '../shapes/SelectionBox'
import { QuickActionsPopup } from '../QuickActionsPopup'
import { TextEditor } from '../TextEditor'
import { ContextMenu } from '../ContextMenu'
import { AlignmentToolbar } from '../AlignmentToolbar'
import { ShapeRenderer } from './ShapeRenderer'

const CANVAS_BOUNDS = DEFAULT_CANVAS_BOUNDS

interface ShapeCanvasProps {
  selectedTool: ToolType
  onShapeSelect: (id: string | null) => void
  deleteTriggered?: number
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean, undo: () => void, redo: () => void) => void
  canvasId: string
  onViewportChange?: (viewport: ViewportTransform) => void
  onZoomChange?: (scale: number) => void
  onZoomControlsReady?: (zoomIn: () => void, zoomOut: () => void, zoomReset: () => void, zoomFit: () => void) => void
  snapToGrid?: boolean
  onColorSamplingReady?: (fn: (callback: (color: string) => void) => void) => void
}

export default function ShapeCanvas({
  selectedTool,
  onShapeSelect,
  deleteTriggered,
  onUndoRedoChange,
  canvasId,
  onViewportChange,
  onZoomChange,
  onZoomControlsReady,
  snapToGrid: snapToGridProp = false,
  onColorSamplingReady,
}: ShapeCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const isDraggingShapeRef = useRef(false)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const isTransformingShapeRef = useRef(false)
  const lastMouseDownWasOnShapeRef = useRef(false)
  
  // UI State
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null)
  const [selectionBox, setSelectionBox] = useState<SelectionBoxType>(createInitialSelectionBox())
  const [isDrawingSelection, setIsDrawingSelection] = useState(false)
  const [isDrawingPath, setIsDrawingPath] = useState(false)
  const [currentPathPoints, setCurrentPathPoints] = useState<number[]>([])
  const [isDrawingLine, setIsDrawingLine] = useState(false)
  const [lineStartPoint, setLineStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [linePreviewEnd, setLinePreviewEnd] = useState<{ x: number; y: number } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false })
  const [isColorSamplingMode, setIsColorSamplingMode] = useState(false)
  const [colorSampleCallback, setColorSampleCallback] = useState<((color: string) => void) | null>(null)
  const [editingText, setEditingText] = useState<{
    id: string
    text: string
    screenX: number
    screenY: number
    width: number
    shape: Shape
  } | null>(null)
  const [showQuickActions, setShowQuickActions] = useState(false)
  
  const snapToGrid = snapToGridProp
  const SNAP_GRID_SIZE = 20
  
  const containerWidth = window.innerWidth
  const containerHeight = window.innerHeight

  // Viewport hook
  const {
    viewport,
    handleWheel: baseHandleWheel,
    handleDragEnd: baseHandleDragEnd,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleZoomFit,
  } = useCanvasViewport({
    containerWidth,
    containerHeight,
    onViewportChange,
    onZoomChange,
  })

  // Canvas hooks
  const { user } = useAuth()
  const { otherUsers, updateCursorPosition, updateSelection } = usePresence({
    userId: user?.uid || '',
    userName: user?.displayName || user?.email || 'Anonymous',
    canvasId: canvasId,
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
    addLine,
    addPolygon,
    addStar,
    addRoundedRect,
    addPath,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    sortShapesByZIndex,
    alignSelected,
    distributeSelectedHorizontally,
    distributeSelectedVertically,
    centerSelectedInCanvas,
  } = useCanvas({
    canvasId: canvasId,
    userId: user?.uid || '',
    enableSync: true,
  })

  const {
    groups,
    createGroup,
    ungroup,
    isShapeInGroup,
    calculateBounds,
  } = useGroups({
    canvasId: canvasId,
    userId: user?.uid || '',
    enableSync: true,
  })

  // Helper functions
  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16).toUpperCase()
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }
  
  const snapToGridCoord = useCallback((coord: number): number => {
    if (!snapToGrid) return coord
    return Math.round(coord / SNAP_GRID_SIZE) * SNAP_GRID_SIZE
  }, [snapToGrid])
  
  const sampleColorFromStage = (x: number, y: number) => {
    const stage = stageRef.current
    if (!stage) return null
    
    const layers = stage.getLayers()
    if (layers.length < 2) return null
    
    const layer = layers[1]
    const canvas = layer.getCanvas()._canvas as HTMLCanvasElement
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return null
    
    try {
      const pixelData = ctx.getImageData(x, y, 1, 1).data
      const hex = rgbToHex(pixelData[0], pixelData[1], pixelData[2])
      const alpha = Math.round((pixelData[3] / 255) * 255).toString(16).padStart(2, '0').toUpperCase()
      return hex + alpha
    } catch (error) {
      console.error('Error sampling color:', error)
      return null
    }
  }
  
  const enableColorSampling = useCallback((callback: (color: string) => void) => {
    setIsColorSamplingMode(true)
    setColorSampleCallback(() => callback)
  }, [])
  
  const cancelColorSampling = () => {
    setIsColorSamplingMode(false)
    setColorSampleCallback(null)
  }
  
  const handleTextDoubleClick = (shape: Shape) => {
    const stage = stageRef.current
    if (!stage) return
    
    const stageBox = stage.container().getBoundingClientRect()
    const screenX = stageBox.left + shape.x * viewport.scale + viewport.x
    const screenY = stageBox.top + shape.y * viewport.scale + viewport.y
    
    setEditingText({
      id: shape.id,
      text: shape.text || '',
      screenX,
      screenY,
      width: shape.width * viewport.scale,
      shape,
    })
  }
  
  const handleTextSave = (newText: string) => {
    if (editingText) {
      updateShape(editingText.id, { text: newText })
    }
    setEditingText(null)
  }
  
  const handleTextEditorCancel = () => {
    setEditingText(null)
  }

  // Keyboard shortcuts hook
  useShapeKeyboardShortcuts({
    selectedIds,
    groups,
    canUndo,
    canRedo,
    isColorSamplingMode,
    bulkDelete,
    clearSelection,
    selectAll,
    copySelected,
    paste,
    duplicateSelected,
    undo,
    redo,
    createGroup,
    ungroup,
    cancelColorSampling,
  })

  // Effects
  useEffect(() => {
    const selectionArray = Array.from(selectedIds)
    updateSelection(selectionArray.length > 0 ? selectionArray : null)
    onShapeSelect(selectedId)
  }, [selectedIds, selectedId, updateSelection, onShapeSelect])

  useEffect(() => {
    if (onUndoRedoChange) {
      onUndoRedoChange(canUndo, canRedo, undo, redo)
    }
  }, [canUndo, canRedo, undo, redo, onUndoRedoChange])
  
  // Expose zoom controls - only on mount to avoid render-during-render
  useEffect(() => {
    if (onZoomControlsReady) {
      onZoomControlsReady(handleZoomIn, handleZoomOut, handleZoomReset, handleZoomFit)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Expose color sampling - only on mount to avoid render-during-render
  useEffect(() => {
    if (onColorSamplingReady) {
      onColorSamplingReady(enableColorSampling)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (deleteTriggered && deleteTriggered > 0) {
      if (selectedIds.size > 0) {
        bulkDelete()
      } else if (selectedId) {
        deleteShape(selectedId)
      }
    }
  }, [deleteTriggered, selectedId, selectedIds, deleteShape, bulkDelete])

  useEffect(() => {
    if (selectedTool !== 'line' && isDrawingLine) {
      setIsDrawingLine(false)
      setLineStartPoint(null)
      setLinePreviewEnd(null)
    }
  }, [selectedTool, isDrawingLine])

  useEffect(() => {
    if (selectedIds.size === 0) {
      setShowQuickActions(false)
    }
  }, [selectedIds])

  // Mouse handlers
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    const stage = stageRef.current
    if (stage) {
      baseHandleWheel(e, stage)
    }
  }, [baseHandleWheel])

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current
      if (!stage) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      if (isColorSamplingMode && colorSampleCallback) {
        const sampledColor = sampleColorFromStage(pointer.x, pointer.y)
        if (sampledColor) {
          colorSampleCallback(sampledColor)
        }
        cancelColorSampling()
        return
      }
      
      lastMouseDownWasOnShapeRef.current = e.target !== stage
      if (e.target !== stage) return

      const canvasX = (pointer.x - viewport.x) / viewport.scale
      const canvasY = (pointer.y - viewport.y) / viewport.scale

      if (selectedTool === 'line') {
        if (!isDrawingLine) {
          setIsDrawingLine(true)
          setLineStartPoint({ x: snapToGridCoord(canvasX), y: snapToGridCoord(canvasY) })
          setLinePreviewEnd({ x: snapToGridCoord(canvasX), y: snapToGridCoord(canvasY) })
          clearSelection()
          return
        } else {
          if (lineStartPoint) {
            addLine(lineStartPoint.x, lineStartPoint.y, snapToGridCoord(canvasX), snapToGridCoord(canvasY))
            setIsDrawingLine(false)
            setLineStartPoint(null)
            setLinePreviewEnd(null)
          }
          return
        }
      }
      
      if (selectedTool === 'pencil' || selectedTool === 'pen') {
        setIsDrawingPath(true)
        setCurrentPathPoints([canvasX, canvasY])
        clearSelection()
        return
      }

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
    [selectedTool, viewport, clearSelection, isColorSamplingMode, colorSampleCallback, cancelColorSampling, snapToGridCoord, isDrawingLine, lineStartPoint, addLine]
  )

  const handleStageMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current
      if (!stage) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const canvasX = (pointer.x - viewport.x) / viewport.scale
      const canvasY = (pointer.y - viewport.y) / viewport.scale

      if (isDrawingLine && selectedTool === 'line' && lineStartPoint) {
        setLinePreviewEnd({ x: canvasX, y: canvasY })
      }
      
      if (isDrawingPath && (selectedTool === 'pencil' || selectedTool === 'pen')) {
        setCurrentPathPoints((prev) => {
          const lastX = prev[prev.length - 2]
          const lastY = prev[prev.length - 1]
          const distance = Math.sqrt((canvasX - lastX) ** 2 + (canvasY - lastY) ** 2)
          const minDistance = selectedTool === 'pen' ? 3 : 6
          if (distance >= minDistance) {
            return [...prev, canvasX, canvasY]
          }
          return prev
        })
        return
      }

      if (isDrawingSelection && selectedTool === 'select') {
        setSelectionBox((prev) => ({
          ...prev,
          currentX: canvasX,
          currentY: canvasY,
        }))
      }

      updateCursorPosition(canvasX, canvasY)
    },
    [isDrawingPath, isDrawingSelection, selectedTool, viewport, updateCursorPosition, isDrawingLine, lineStartPoint]
  )

  const handleStageMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isDrawingPath && (selectedTool === 'pencil' || selectedTool === 'pen')) {
        setIsDrawingPath(false)
        if (currentPathPoints.length >= 4) {
          const isPen = selectedTool === 'pen'
          const tension = isPen ? 0.5 : 0
          const simplificationTolerance = isPen ? 2 : 6
          const simplified = simplifyPath(currentPathPoints, simplificationTolerance)
          addPath(simplified, tension)
        }
        setCurrentPathPoints([])
        return
      }
      
      const stage = stageRef.current
      if (!stage) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const canvasX = (pointer.x - viewport.x) / viewport.scale
      const canvasY = (pointer.y - viewport.y) / viewport.scale

      if (isDrawingSelection && selectedTool === 'select') {
        setIsDrawingSelection(false)
        const intersectingIds = shapes
          .filter((shape) => shapeIntersectsSelectionBox(shape, selectionBox))
          .map((shape) => shape.id)
        if (intersectingIds.length > 0) {
          selectMultiple(intersectingIds)
        }
        setSelectionBox((prev) => ({ ...prev, visible: false }))
        return
      }

      if (!isDrawingSelection) {
        if (isDraggingShapeRef.current || isTransformingShapeRef.current) {
          isTransformingShapeRef.current = false
          return
        }
        if (lastMouseDownWasOnShapeRef.current) {
          lastMouseDownWasOnShapeRef.current = false
          return
        }
        if (e.target !== e.target.getStage()) return

        const snappedX = snapToGridCoord(canvasX)
        const snappedY = snapToGridCoord(canvasY)

        if (selectedTool === 'rectangle') {
          addShape('rectangle', snappedX, snappedY)
        } else if (selectedTool === 'circle') {
          addShape('circle', snappedX, snappedY)
        } else if (selectedTool === 'text') {
          setTextInput({ x: snappedX, y: snappedY, value: '' })
        } else if (selectedTool === 'roundRect') {
          addRoundedRect(snappedX, snappedY, 10)
        } else if (selectedTool === 'polygon') {
          addPolygon(snappedX, snappedY, 5)
        } else if (selectedTool === 'star') {
          addStar(snappedX, snappedY, 5)
        } else if (selectedTool === 'select' && !e.evt.shiftKey) {
          clearSelection()
          setShowQuickActions(false)
        }
      }
    },
    [isDrawingPath, isDrawingSelection, selectedTool, viewport, currentPathPoints, selectionBox, shapes, selectMultiple, addShape, addPath, clearSelection, snapToGridCoord, addRoundedRect, addPolygon, addStar]
  )

  const handleShapeSelect = useCallback(
    (shapeId: string, shiftKey: boolean) => {
      if (shiftKey) {
        toggleSelection(shapeId)
      } else {
        setSelection(shapeId)
      }
      setContextMenu({ x: 0, y: 0, visible: false })
    },
    [setSelection, toggleSelection]
  )

  const handleContextMenu = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault()
    setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, visible: true })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu({ x: 0, y: 0, visible: false })
  }, [])

  const handleShapeDragStart = useCallback(
    (shapeId: string, x: number, y: number) => {
      isDraggingShapeRef.current = true
      dragStartPosRef.current = { x, y }
      if (!selectedIds.has(shapeId)) {
        setSelection(shapeId)
      }
    },
    [selectedIds, setSelection]
  )

  const handleShapeDragEnd = useCallback(
    (shapeId: string, x: number, y: number) => {
      if (!dragStartPosRef.current) return

      const snappedX = snapToGridCoord(x)
      const snappedY = snapToGridCoord(y)
      const deltaX = snappedX - dragStartPosRef.current.x
      const deltaY = snappedY - dragStartPosRef.current.y

      if (selectedIds.size > 1 && selectedIds.has(shapeId)) {
        bulkMove(deltaX, deltaY)
      } else {
        updateShape(shapeId, { x: snappedX, y: snappedY })
      }

      isDraggingShapeRef.current = false
      dragStartPosRef.current = null
    },
    [selectedIds, bulkMove, updateShape, snapToGridCoord]
  )

  const handleShapeTransformEnd = useCallback(
    (shapeId: string, width: number, height: number, rotation: number, x: number, y: number) => {
      updateShape(shapeId, { width, height, rotation, x, y })
    },
    [updateShape]
  )

  const DotGrid = useCallback(() => {
    return (
      <KonvaLine
        points={[]}
        listening={false}
        perfectDrawEnabled={false}
        hitStrokeWidth={0}
        sceneFunc={(context) => {
          const spacing = 20
          const dotRadius = 1.2
          context.fillStyle = '#D1D5DB'
          for (let x = 0; x <= CANVAS_BOUNDS.maxX; x += spacing) {
            for (let y = 0; y <= CANVAS_BOUNDS.maxY; y += spacing) {
              context.beginPath()
              context.arc(x, y, dotRadius, 0, Math.PI * 2)
              context.fill()
            }
          }
        }}
      />
    )
  }, [])

  return (
    <div className="w-full h-full bg-gray-100 overflow-hidden relative flex flex-col">
      <AlignmentToolbar
        visible={selectedIds.size >= 2}
        selectedCount={selectedIds.size}
        onAlign={(type) => alignSelected(type)}
        onDistributeHorizontally={() => distributeSelectedHorizontally()}
        onDistributeVertically={() => distributeSelectedVertically()}
        onCenterInCanvas={() => centerSelectedInCanvas(containerWidth, containerHeight)}
      />

      <div className="flex-1 relative">
        <Stage
          ref={stageRef}
          width={containerWidth}
          height={containerHeight}
          draggable={selectedTool === 'hand'}
          onWheel={handleWheel}
          onDragEnd={baseHandleDragEnd}
          onMouseMove={handleStageMouseMove}
          onMouseDown={handleStageMouseDown}
          onMouseUp={handleStageMouseUp}
          onContextMenu={handleContextMenu}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
        >
          <Layer listening={false} perfectDrawEnabled={false}>
            <DotGrid />
          </Layer>

          <Layer>
            <ShapeRenderer
              shapes={shapes}
              groups={groups}
              selectedIds={selectedIds}
              viewport={viewport}
              containerWidth={containerWidth}
              containerHeight={containerHeight}
              isDrawingLine={isDrawingLine}
              lineStartPoint={lineStartPoint}
              linePreviewEnd={linePreviewEnd}
              isDrawingPath={isDrawingPath}
              currentPathPoints={currentPathPoints}
              selectedTool={selectedTool}
              sortShapesByZIndex={sortShapesByZIndex}
              isShapeInGroup={(id) => !!isShapeInGroup(id)}
              calculateBounds={calculateBounds}
              handleShapeSelect={handleShapeSelect}
              handleShapeDragStart={handleShapeDragStart}
              handleShapeDragEnd={handleShapeDragEnd}
              handleShapeTransformEnd={handleShapeTransformEnd}
              handleTextDoubleClick={handleTextDoubleClick}
              updateShape={updateShape}
              dragStartPosRef={dragStartPosRef}
            />
            <SelectionBox selectionBox={selectionBox} />
          </Layer>

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
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && textInput.value.trim()) {
                  addText(textInput.value, textInput.x, textInput.y)
                  setTextInput(null)
                } else if (e.key === 'Escape') {
                  setTextInput(null)
                }
              }}
              onBlur={() => setTextInput(null)}
              placeholder="Type text..."
              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              style={{ width: '200px' }}
            />
            <div className="text-xs text-gray-500 mt-1">Press Enter to create, Esc to cancel</div>
          </div>
        )}

        {editingText && (
          <TextEditor
            initialText={editingText.text}
            x={editingText.screenX}
            y={editingText.screenY}
            width={editingText.width}
            fontFamily={editingText.shape.fontFamily}
            fontSize={editingText.shape.fontSize}
            fontWeight={editingText.shape.fontWeight}
            fontStyle={editingText.shape.fontStyle}
            textAlign={editingText.shape.textAlign}
            fill={editingText.shape.fill}
            onSave={handleTextSave}
            onCancel={handleTextEditorCancel}
          />
        )}

        {showQuickActions && selectedIds.size > 0 && (() => {
          const selectedShape = shapes.find(s => selectedIds.has(s.id))
          if (!selectedShape) return null
          return (
            <QuickActionsPopup
              screenX={selectedShape.x * viewport.scale + viewport.x + (selectedShape.width || 0) * viewport.scale}
              screenY={selectedShape.y * viewport.scale + viewport.y}
              selectedCount={selectedIds.size}
              canGroup={selectedIds.size >= 2}
              onBringToFront={() => bringToFront()}
              onSendToBack={() => sendToBack()}
              onBringForward={() => bringForward()}
              onSendBackward={() => sendBackward()}
              onGroup={() => createGroup(Array.from(selectedIds))}
              onUngroup={() => {
                const firstSelected = Array.from(selectedIds)[0]
                if (firstSelected) ungroup(firstSelected)
              }}
              onDuplicate={() => duplicateSelected()}
              onDelete={() => bulkDelete()}
              onClose={() => setShowQuickActions(false)}
            />
          )
        })()}

        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          visible={contextMenu.visible}
          onClose={closeContextMenu}
          hasSelection={selectedIds.size > 0}
          canCopy={selectedIds.size > 0}
          canPaste={true}
          selectedCount={selectedIds.size}
          onBringToFront={() => bringToFront()}
          onBringForward={() => bringForward()}
          onSendBackward={() => sendBackward()}
          onSendToBack={() => sendToBack()}
          onCopy={copySelected}
          onPaste={paste}
          onDuplicate={duplicateSelected}
          onDelete={bulkDelete}
          onAlign={(type) => alignSelected(type)}
          onDistributeHorizontally={() => distributeSelectedHorizontally()}
          onDistributeVertically={() => distributeSelectedVertically()}
          onCenterInCanvas={() => centerSelectedInCanvas(containerWidth, containerHeight)}
        />
      </div>
    </div>
  )
}
