import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Stage, Layer } from 'react-konva'
import Konva from 'konva'
import type { ViewportTransform } from '../../types/canvas'
import type { TileMode, PaletteColor, TileData } from '../../types/tilemap'
import { useAuth } from '../../hooks/useAuth'
import { usePresence } from '../../hooks/usePresence'
import { useCanvasViewport } from '../../hooks/useCanvasViewport'
import { useTilemap } from '../../hooks/useTilemap'
import { coordToKey } from '../../types/tilemap'
import { createHistoryManager } from '../../services/commandHistory'
import { TileSetCommand } from '../../commands/TileCommand'
import { TileStrokeCommand } from '../../commands/TileStrokeCommand'
import { TileFillCommand } from '../../commands/TileFillCommand'
import Cursor from '../Cursor'
import TilemapGrid from '../TilemapGrid'
import TileRenderer from '../TileRenderer'
import TilePalette from '../TilePalette'
import TileStatusBar from '../TileStatusBar'

interface TilemapCanvasProps {
  canvasId: string
  onViewportChange?: (viewport: ViewportTransform) => void
  onZoomChange?: (scale: number) => void
  onZoomControlsReady?: (zoomIn: () => void, zoomOut: () => void, zoomReset: () => void, zoomFit: () => void) => void
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean, undo: () => void, redo: () => void) => void
}

const DEFAULT_PALETTE: PaletteColor[] = [
  { type: 'grass', color: '#4ade80', name: 'Grass' },
  { type: 'dirt', color: '#92400e', name: 'Dirt' },
  { type: 'stone', color: '#6b7280', name: 'Stone' },
  { type: 'water', color: '#3b82f6', name: 'Water' },
  { type: 'sand', color: '#fbbf24', name: 'Sand' },
  { type: 'lava', color: '#ef4444', name: 'Lava' },
  { type: 'wood', color: '#78350f', name: 'Wood' },
  { type: 'metal', color: '#374151', name: 'Metal' },
  { type: 'ice', color: '#bfdbfe', name: 'Ice' },
]

export default function TilemapCanvas({
  canvasId,
  onViewportChange,
  onZoomChange,
  onZoomControlsReady,
  onUndoRedoChange,
}: TilemapCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  
  // Command history manager
  const historyManager = useMemo(() => createHistoryManager(), [])
  
  // State
  const [tileMode, setTileMode] = useState<TileMode>('stamp')
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(0)
  const [tileSize, setTileSize] = useState(16)
  const [showGrid, setShowGrid] = useState(true)
  const [isPainting, setIsPainting] = useState(false)
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [lastPanPosition, setLastPanPosition] = useState<{ x: number; y: number } | null>(null)
  
  // Track stroke for bulk undo/redo
  const currentStrokeRef = useRef<Array<{ x: number; y: number; oldTile: TileData | undefined; newTile: TileData | null }>>([])
  
  const containerWidth = window.innerWidth
  const containerHeight = window.innerHeight

  // Viewport hook
  const {
    viewport,
    setViewport,
    handleWheel: baseHandleWheel,
    handleDragEnd,
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

  // Auth and presence
  const { user } = useAuth()
  const { otherUsers, updateCursorPosition } = usePresence({
    userId: user?.uid || '',
    userName: user?.displayName || user?.email || 'Anonymous',
    canvasId: canvasId,
  })

  // Tilemap hook
  const {
    tiles,
    meta,
    isConnected,
    connectionStatus,
    setTile,
    setTiles,
    deleteTile,
    deleteTiles,
    getTile,
    fillTiles,
    loadVisibleChunks,
  } = useTilemap({
    canvasId,
    userId: user?.uid || '',
  })

  // Load visible chunks whenever viewport changes
  useEffect(() => {
    if (!meta) return
    
    // Calculate viewport in canvas coordinates
    const viewportX = -viewport.x / viewport.scale
    const viewportY = -viewport.y / viewport.scale
    const viewportWidth = containerWidth / viewport.scale
    const viewportHeight = containerHeight / viewport.scale
    
    loadVisibleChunks({
      x: viewportX,
      y: viewportY,
      width: viewportWidth,
      height: viewportHeight,
    })
  }, [viewport.x, viewport.y, viewport.scale, containerWidth, containerHeight, meta, loadVisibleChunks])

  // Expose zoom controls - only on mount to avoid render-during-render
  useEffect(() => {
    if (onZoomControlsReady) {
      onZoomControlsReady(handleZoomIn, handleZoomOut, handleZoomReset, handleZoomFit)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Undo/Redo functions
  const handleUndo = useCallback(() => {
    historyManager.undo()
  }, [historyManager])

  const handleRedo = useCallback(() => {
    historyManager.redo()
  }, [historyManager])

  // Expose undo/redo state to parent
  useEffect(() => {
    if (onUndoRedoChange) {
      onUndoRedoChange(
        historyManager.canUndo(),
        historyManager.canRedo(),
        handleUndo,
        handleRedo
      )
    }
  }, [historyManager, onUndoRedoChange, handleUndo, handleRedo, tiles]) // Re-run when tiles change

  // Get current palette selection
  const selectedPalette = DEFAULT_PALETTE[selectedPaletteIndex]

  // Convert screen coordinates to tile coordinates
  const screenToTileCoords = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    const canvasX = (screenX - viewport.x) / viewport.scale
    const canvasY = (screenY - viewport.y) / viewport.scale
    const tileX = Math.floor(canvasX / tileSize)
    const tileY = Math.floor(canvasY / tileSize)
    return { x: tileX, y: tileY }
  }, [viewport, tileSize])

  // Handle painting/erasing tiles with command pattern
  const paintTileAt = useCallback((tileX: number, tileY: number, isStrokePainting: boolean = false) => {
    const oldTile = getTile(tileX, tileY)
    
    if (tileMode === 'stamp') {
      const newTile: TileData = {
        type: selectedPalette.type,
        color: selectedPalette.color,
      }
      
      // If we're stroke painting, accumulate changes
      if (isStrokePainting) {
        currentStrokeRef.current.push({ x: tileX, y: tileY, oldTile, newTile })
        setTile(tileX, tileY, newTile)
      } else {
        // Single click - create command immediately
        const command = new TileSetCommand(
          tileX,
          tileY,
          oldTile,
          newTile,
          setTile,
          deleteTile
        )
        historyManager.executeCommand(command)
      }
    } else if (tileMode === 'erase') {
      // If we're stroke erasing, accumulate changes
      if (isStrokePainting) {
        currentStrokeRef.current.push({ x: tileX, y: tileY, oldTile, newTile: null })
        deleteTile(tileX, tileY)
      } else {
        // Single click erase
        if (oldTile) {
          const command = new TileSetCommand(
            tileX,
            tileY,
            oldTile,
            oldTile, // Dummy new tile (will be deleted in undo)
            setTile,
            deleteTile
          )
          // Override execute to delete instead
          command.execute = () => deleteTile(tileX, tileY)
          command.redo = () => deleteTile(tileX, tileY)
          historyManager.executeCommand(command)
        }
      }
    } else if (tileMode === 'fill') {
      // Fill mode - uses flood fill algorithm
      const targetTileKey = coordToKey(tileX, tileY)
      const targetTile = tiles.get(targetTileKey)
      const targetType = targetTile?.type || 'empty'
      
      // Collect all tiles that would be filled
      const fillChanges: Array<{ x: number; y: number; oldTile: TileData | undefined; newTile: TileData | null }> = []
      
      // Perform flood fill (this will modify tiles directly)
      // We need to track which tiles were changed
      const tilesBefore = new Map(tiles)
      fillTiles(tileX, tileY, targetType, selectedPalette.type, selectedPalette.color)
      
      // Calculate changes by comparing before/after
      // Note: This is a simplified approach - ideally floodFill would return the changes
      // For now, we'll create a fill command
      const command = new TileFillCommand(
        tileX,
        tileY,
        fillChanges, // Empty for now, fill will be re-executed
        setTiles,
        deleteTiles
      )
      
      // Override execute to use fillTiles
      command.execute = () => {
        fillTiles(tileX, tileY, targetType, selectedPalette.type, selectedPalette.color)
      }
      command.undo = () => {
        // TODO: Proper undo for fill - need to track affected tiles
        console.warn('Fill undo not yet implemented')
      }
      
      historyManager.executeCommand(command)
    } else if (tileMode === 'pick') {
      // Eyedropper mode - pick the color at this tile (no undo needed)
      const tileKey = coordToKey(tileX, tileY)
      const tile = tiles.get(tileKey)
      if (tile) {
        const paletteIndex = DEFAULT_PALETTE.findIndex(p => p.type === tile.type)
        if (paletteIndex !== -1) {
          setSelectedPaletteIndex(paletteIndex)
        }
      }
      setTileMode('stamp')
    }
  }, [tileMode, selectedPalette, setTile, setTiles, deleteTile, deleteTiles, getTile, fillTiles, tiles, historyManager])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      // Spacebar: Enable pan mode
      if (e.key === ' ' && !isSpacePressed) {
        e.preventDefault()
        setIsSpacePressed(true)
        return
      }
      
      // Number keys 1-9: Select palette
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1
        if (index < DEFAULT_PALETTE.length) {
          e.preventDefault()
          setSelectedPaletteIndex(index)
        }
      }
      
      // B: Stamp/Brush mode
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        setTileMode('stamp')
      }
      
      // E: Erase mode
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        setTileMode('erase')
      }
      
      // F: Fill mode
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setTileMode('fill')
      }
      
      // I: Pick/Eyedropper mode
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        setTileMode('pick')
      }
      
      // G: Toggle grid
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault()
        setShowGrid(!showGrid)
      }
      
      // Ctrl+Z / Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      
      // Ctrl+Y / Cmd+Y OR Ctrl+Shift+Z / Cmd+Shift+Z: Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Spacebar: Disable pan mode
      if (e.key === ' ') {
        e.preventDefault()
        setIsSpacePressed(false)
        setLastPanPosition(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [showGrid, isSpacePressed, handleUndo, handleRedo])

  // Mouse handlers
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    const stage = stageRef.current
    if (stage) {
      baseHandleWheel(e, stage)
    }
  }, [baseHandleWheel])

  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current
    if (!stage) return

    // Only handle left mouse button
    if (e.evt.button !== 0) return

    const pointer = stage.getPointerPosition()
    if (!pointer) return

    // If spacebar is pressed, initialize panning (don't paint)
    if (isSpacePressed) {
      setLastPanPosition({ x: pointer.x, y: pointer.y })
      return
    }

    // Otherwise, start painting - clear stroke accumulator
    currentStrokeRef.current = []
    const { x: tileX, y: tileY } = screenToTileCoords(pointer.x, pointer.y)
    setIsPainting(true)
    
    // For fill mode, execute immediately (no stroke)
    if (tileMode === 'fill' || tileMode === 'pick') {
      paintTileAt(tileX, tileY, false)
    } else {
      // For stamp/erase, start stroke painting
      paintTileAt(tileX, tileY, true)
    }
  }, [screenToTileCoords, paintTileAt, isSpacePressed, tileMode])

  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current
    if (!stage) return

    const pointer = stage.getPointerPosition()
    if (!pointer) return

    // If spacebar is pressed, enable panning (no click required)
    if (isSpacePressed) {
      if (lastPanPosition) {
        // Pan is active - calculate delta and update viewport
        const dx = pointer.x - lastPanPosition.x
        const dy = pointer.y - lastPanPosition.y
        
        setViewport(prev => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy
        }))
      }
      // Always update last position when spacebar is pressed
      setLastPanPosition({ x: pointer.x, y: pointer.y })
      return
    }

    const { x: tileX, y: tileY } = screenToTileCoords(pointer.x, pointer.y)
    
    // Update hover tile for preview (don't show hover when spacebar is pressed)
    setHoverTile({ x: tileX, y: tileY })
    
    // Continue painting if mouse is down and spacebar is not pressed
    if (isPainting && tileMode !== 'fill' && tileMode !== 'pick') {
      paintTileAt(tileX, tileY, true) // Stroke painting
    }

    // Update presence cursor
    const canvasX = (pointer.x - viewport.x) / viewport.scale
    const canvasY = (pointer.y - viewport.y) / viewport.scale
    updateCursorPosition(canvasX, canvasY)
  }, [screenToTileCoords, isPainting, tileMode, paintTileAt, viewport, updateCursorPosition, isSpacePressed, lastPanPosition, setViewport])

  const handleStageMouseUp = useCallback(() => {
    // Finalize stroke painting - create command for all accumulated changes
    if (isPainting && currentStrokeRef.current.length > 0) {
      const command = new TileStrokeCommand(
        currentStrokeRef.current,
        setTiles,
        deleteTiles
      )
      historyManager.executeCommand(command)
      currentStrokeRef.current = []
    }
    
    setIsPainting(false)
    setLastPanPosition(null)
  }, [isPainting, setTiles, deleteTiles, historyManager])

  const handleStageMouseLeave = useCallback(() => {
    // Finalize stroke if mouse leaves canvas
    if (isPainting && currentStrokeRef.current.length > 0) {
      const command = new TileStrokeCommand(
        currentStrokeRef.current,
        setTiles,
        deleteTiles
      )
      historyManager.executeCommand(command)
      currentStrokeRef.current = []
    }
    
    setIsPainting(false)
    setHoverTile(null)
  }, [isPainting, setTiles, deleteTiles, historyManager])

  // Right-click to erase
  const handleContextMenu = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return

    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const { x: tileX, y: tileY } = screenToTileCoords(pointer.x, pointer.y)
    deleteTile(tileX, tileY)
  }, [screenToTileCoords, deleteTile])

  return (
    <div className="w-full h-full bg-gray-100 overflow-hidden relative flex flex-row">
      {/* Left Palette Panel */}
      <TilePalette
        palette={DEFAULT_PALETTE}
        selectedIndex={selectedPaletteIndex}
        onSelectIndex={setSelectedPaletteIndex}
        mode={tileMode}
        onModeChange={setTileMode}
        tileSize={tileSize}
        onTileSizeChange={setTileSize}
        tileCount={tiles.size}
        cursorPosition={hoverTile || undefined}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
      />

      <div className="flex-1 relative" style={{ cursor: lastPanPosition ? 'grabbing' : (isSpacePressed ? 'grab' : 'default') }}>
        <Stage
          ref={stageRef}
          width={containerWidth}
          height={containerHeight}
          draggable={false}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={handleStageMouseLeave}
          onContextMenu={handleContextMenu}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
        >
          {/* Grid Layer */}
          <TilemapGrid
            tileSize={tileSize}
            viewportX={-viewport.x / viewport.scale}
            viewportY={-viewport.y / viewport.scale}
            viewportWidth={containerWidth / viewport.scale}
            viewportHeight={containerHeight / viewport.scale}
            visible={showGrid}
          />

          {/* Tiles Layer */}
          <TileRenderer
            tiles={tiles}
            tileSize={tileSize}
            viewportX={-viewport.x / viewport.scale}
            viewportY={-viewport.y / viewport.scale}
            viewportWidth={containerWidth / viewport.scale}
            viewportHeight={containerHeight / viewport.scale}
            previewTile={hoverTile && tileMode === 'stamp' && !isPainting ? {
              x: hoverTile.x,
              y: hoverTile.y,
              tile: { type: selectedPalette.type, color: selectedPalette.color }
            } : null}
            showPreview={tileMode === 'stamp' && !isPainting}
          />

          {/* Cursors Layer */}
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
        
        {/* Status Bar */}
        <TileStatusBar
          cursorPosition={hoverTile || undefined}
          tileCount={tiles.size}
          mode={tileMode}
          tileSize={tileSize}
          zoom={viewport.scale}
          connectionStatus={connectionStatus}
        />
      </div>
    </div>
  )
}
