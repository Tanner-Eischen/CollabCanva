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
import { TileSetCommand, BulkTileCommand } from '../../commands/TileCommand'
import { TileStrokeCommand } from '../../commands/TileStrokeCommand'
import { TileFillCommand } from '../../commands/TileFillCommand'
import { exportTilemapJSON, generateExportFilename } from '../../services/tilemapExport'
import { DEFAULT_TILEMAP_PALETTE, hasSpriteAsset } from '../../constants/tilemapDefaults'
import { calculateTileVariant, calculateAutoTileUpdates } from '../../utils/autoTile'
import Cursor from '../Cursor'
import TilemapGrid from './TilemapGrid'
import TileRenderer from './TileRenderer'
import TilemapToolbar from './TilemapToolbar'
import TileStatusBar from './TileStatusBar'

interface TilemapCanvasProps {
  canvasId: string
  onViewportChange?: (viewport: ViewportTransform) => void
  onZoomChange?: (scale: number) => void
  onZoomControlsReady?: (zoomIn: () => void, zoomOut: () => void, zoomReset: () => void, zoomFit: () => void) => void
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean, undo: () => void, redo: () => void) => void
  onExportFunctionsReady?: (exportJSON: () => void, exportPNG: () => void) => void
}

const DEFAULT_PALETTE: PaletteColor[] = DEFAULT_TILEMAP_PALETTE

export default function TilemapCanvas({
  canvasId,
  onViewportChange,
  onZoomChange,
  onZoomControlsReady,
  onUndoRedoChange,
  onExportFunctionsReady,
}: TilemapCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  
  // Command history manager
  const historyManager = useMemo(() => createHistoryManager(), [])
  
  // State
  const [tileMode, setTileMode] = useState<TileMode>('stamp')
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<number | undefined>(undefined)
  const [plainColor, setPlainColor] = useState<string>('#ffffff')
  const [autoTilingEnabled, setAutoTilingEnabled] = useState<boolean>(true)
  const [brushSize, setBrushSize] = useState<number>(1) // 1x1, 2x2, 3x3, etc.
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

  // Export functions
  const handleExportJSON = useCallback(() => {
    const exported = exportTilemapJSON(tiles, meta, user?.email || 'anonymous')
    const filename = generateExportFilename(canvasId)
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [tiles, meta, user?.email, canvasId])

  const handleExportPNG = useCallback(() => {
    if (!stageRef.current) return
    
    // Export the stage as PNG
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 })
    const a = document.createElement('a')
    a.href = uri
    a.download = `${canvasId}-tilemap.png`
    a.click()
  }, [canvasId])

  // Expose export functions to parent
  useEffect(() => {
    if (onExportFunctionsReady) {
      onExportFunctionsReady(handleExportJSON, handleExportPNG)
    }
  }, [onExportFunctionsReady, handleExportJSON, handleExportPNG])

  // Get current palette selection
  const selectedPalette = DEFAULT_PALETTE[selectedPaletteIndex]
  const isPlainTile = selectedPalette?.type === 'plain'
  const effectiveColor = isPlainTile ? plainColor : selectedPalette?.color

  // Convert screen coordinates to tile coordinates
  const screenToTileCoords = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    const canvasX = (screenX - viewport.x) / viewport.scale
    const canvasY = (screenY - viewport.y) / viewport.scale
    const tileX = Math.floor(canvasX / tileSize)
    const tileY = Math.floor(canvasY / tileSize)
    return { x: tileX, y: tileY }
  }, [viewport, tileSize])

  // Get all tiles affected by the brush at a given position
  const getBrushTiles = useCallback((centerX: number, centerY: number): Array<{x: number, y: number}> => {
    const tiles: Array<{x: number, y: number}> = []
    const offset = Math.floor(brushSize / 2)
    
    for (let dy = 0; dy < brushSize; dy++) {
      for (let dx = 0; dx < brushSize; dx++) {
        tiles.push({
          x: centerX - offset + dx,
          y: centerY - offset + dy
        })
      }
    }
    
    return tiles
  }, [brushSize])

  // Handle painting/erasing tiles with command pattern
  const paintTileAt = useCallback((tileX: number, tileY: number, isStrokePainting: boolean = false) => {
    const affectedTiles = getBrushTiles(tileX, tileY)
    
    if (tileMode === 'stamp') {
      // Collect changes for all tiles in brush
      const changes: Array<{x: number, y: number, oldTile: TileData | undefined, newTile: TileData}> = []
      
      // Paint all tiles in the brush area
      affectedTiles.forEach(({x, y}) => {
        const oldTile = getTile(x, y)
        
        // Calculate variant if this tile type has sprite assets
        let variant: number | undefined
        if (hasSpriteAsset(selectedPalette.type)) {
          if (autoTilingEnabled) {
            // Auto-tiling: calculate based on neighbors
            variant = calculateTileVariant(x, y, tiles, selectedPalette.type)
          } else {
            // Manual mode: use selected variant or default to center (variant 4)
            variant = selectedVariant !== undefined ? selectedVariant : 4
          }
        }
        
        const newTile: TileData = {
          type: selectedPalette.type,
          color: effectiveColor,
          variant,
        }
        
        changes.push({x, y, oldTile, newTile})
        
        // Only update tiles immediately during stroke (for visual feedback)
        if (isStrokePainting) {
          setTile(x, y, newTile)
        }
      })
      
      // Collect neighbor variant updates if auto-tiling is enabled
      const neighborUpdates: Array<{x: number, y: number, oldTile: TileData, newTile: TileData}> = []
      if (autoTilingEnabled && hasSpriteAsset(selectedPalette.type)) {
        affectedTiles.forEach(({x, y}) => {
          const updates = calculateAutoTileUpdates(x, y, tiles, selectedPalette.type)
          updates.forEach(update => {
            const existingTile = getTile(update.x, update.y)
            if (existingTile && !affectedTiles.some(t => t.x === update.x && t.y === update.y)) {
              // Only update neighbors, not the tiles we just painted
              neighborUpdates.push({
                x: update.x,
                y: update.y,
                oldTile: existingTile,
                newTile: { ...existingTile, variant: update.variant }
              })
              
              // Apply immediately during stroke for visual feedback
              if (isStrokePainting) {
                setTile(update.x, update.y, { ...existingTile, variant: update.variant })
              }
            }
          })
        })
      }
      
      // Handle undo/redo
      if (isStrokePainting) {
        // Add both painted tiles and neighbor updates to stroke
        changes.forEach(change => {
          currentStrokeRef.current.push({ x: change.x, y: change.y, oldTile: change.oldTile, newTile: change.newTile })
        })
        neighborUpdates.forEach(update => {
          currentStrokeRef.current.push({ x: update.x, y: update.y, oldTile: update.oldTile, newTile: update.newTile })
        })
      } else {
        // Single click - combine painted tiles and neighbor updates
        const allChanges = [...changes, ...neighborUpdates]
        if (allChanges.length === 1) {
          const change = allChanges[0]
          const command = new TileSetCommand(change.x, change.y, change.oldTile, change.newTile, setTile, deleteTile)
          historyManager.executeCommand(command)
        } else {
          const command = new BulkTileCommand(allChanges, setTile, deleteTile)
          historyManager.executeCommand(command)
        }
      }
    } else if (tileMode === 'erase') {
      // Erase all tiles in brush area
      const changes: Array<{x: number, y: number, oldTile: TileData | undefined}> = []
      
      affectedTiles.forEach(({x, y}) => {
        const oldTile = getTile(x, y)
        if (oldTile) {
          changes.push({x, y, oldTile})
          
          // Apply immediately during stroke
          if (isStrokePainting) {
            deleteTile(x, y)
          }
        }
      })
      
      // Collect neighbor variant updates if auto-tiling is enabled
      const neighborUpdates: Array<{x: number, y: number, oldTile: TileData, newTile: TileData}> = []
      affectedTiles.forEach(({x, y}) => {
        const oldTile = getTile(x, y)
        if (oldTile && autoTilingEnabled && hasSpriteAsset(oldTile.type)) {
          const updates = calculateAutoTileUpdates(x, y, tiles, null)
          updates.forEach(update => {
            const existingTile = getTile(update.x, update.y)
            if (existingTile) {
              neighborUpdates.push({
                x: update.x,
                y: update.y,
                oldTile: existingTile,
                newTile: { ...existingTile, variant: update.variant }
              })
              
              // Apply immediately during stroke
              if (isStrokePainting) {
                setTile(update.x, update.y, { ...existingTile, variant: update.variant })
              }
            }
          })
        }
      })
      
      // Handle undo/redo
      if (isStrokePainting) {
        changes.forEach(change => {
          currentStrokeRef.current.push({ x: change.x, y: change.y, oldTile: change.oldTile, newTile: null })
        })
        neighborUpdates.forEach(update => {
          currentStrokeRef.current.push({ x: update.x, y: update.y, oldTile: update.oldTile, newTile: update.newTile })
        })
      } else {
        // Single click erase - combine deletions and neighbor updates
        const allChanges: Array<{x: number, y: number, oldTile: TileData | undefined, newTile: TileData | null}> = [
          ...changes.map(c => ({...c, newTile: null as null})),
          ...neighborUpdates.map(u => ({x: u.x, y: u.y, oldTile: u.oldTile as TileData | undefined, newTile: u.newTile as TileData | null}))
        ]
        
        if (allChanges.length > 0) {
          const command = new TileStrokeCommand(allChanges, setTiles, deleteTiles)
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
  }, [tileMode, selectedPalette, selectedVariant, effectiveColor, autoTilingEnabled, brushSize, getBrushTiles, setTile, setTiles, deleteTile, deleteTiles, getTile, fillTiles, tiles, historyManager])

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
    <div className="w-full h-full bg-gray-100 overflow-hidden flex flex-row">
      {/* Left Toolbar */}
      <TilemapToolbar
        mode={tileMode}
        onModeChange={setTileMode}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        autoTilingEnabled={autoTilingEnabled}
        onToggleAutoTiling={() => {
          setAutoTilingEnabled(!autoTilingEnabled)
          // Clear selected variant when enabling auto-tiling
          if (!autoTilingEnabled) {
            setSelectedVariant(undefined)
          }
        }}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        canUndo={historyManager.canUndo()}
        canRedo={historyManager.canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        palette={DEFAULT_PALETTE}
        selectedIndex={selectedPaletteIndex}
        onSelectIndex={setSelectedPaletteIndex}
        selectedVariant={selectedVariant}
        onVariantChange={setSelectedVariant}
        plainColor={plainColor}
        onPlainColorChange={setPlainColor}
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
      </div>

      {/* Status Bar - Fixed at bottom */}
      <TileStatusBar
        cursorPosition={hoverTile || undefined}
        tileCount={tiles.size}
        mode={tileMode}
        tileSize={tileSize}
        zoom={viewport.scale}
        connectionStatus={connectionStatus}
      />
    </div>
  )
}
