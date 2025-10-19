import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Stage, Layer } from 'react-konva'
import Konva from 'konva'
import type { ViewportTransform } from '../../types/canvas'
import type { TileMode, PaletteColor, TileData } from '../../types/tilemap'
import type { TileLayerMeta } from '../../types/tileLayer'
import { useAuth } from '../../hooks/useAuth'
import { usePresence } from '../../hooks/usePresence'
import { useCanvasViewport } from '../../hooks/useCanvasViewport'
import { useTilemap } from '../../hooks/useTilemap'
import { coordToKey } from '../../types/tilemap'
import { createHistoryManager } from '../../services/canvas/commandHistory'
import { TileSetCommand, BulkTileCommand } from '../../commands/tile/TileCommand'
import { TileStrokeCommand } from '../../commands/tile/TileStrokeCommand'
import { TileFillCommand } from '../../commands/tile/TileFillCommand'
import { exportTilemapJSON, generateExportFilename } from '../../services/tilemap/tilemapExport'
import { DEFAULT_TILEMAP_PALETTE } from '../../constants/tilemapDefaults'
import { calculateTileVariant, calculateAutoTileUpdates } from '../../utils/tilemap/autoTile'
import { updateLayer as updateLayerInFirebase } from '../../services/tilemap/tilemapSync'
import { useLayerContext } from '../../hooks/useLayerManagement'
import { AIOrchestratorProvider, useAIOrchestrator } from '../../hooks/useAIOrchestrator'
import { useAssetLibrary } from '../../hooks/useAssetLibrary'
import { PRESENCE_BAR_HEIGHT, TILE_STATUS_BAR_HEIGHT, HUD_SAFE_MARGIN } from '../../constants/layout'
import { tilesetRegistry } from '../../services/tilemap/tilesetRegistry'
import Cursor from '../Cursor'
import TilemapGrid from './TilemapGrid'
import TileRenderer from './TileRenderer'
import TileStatusBar from './TileStatusBar'
import TilePalette from '../panels/TilePalette'
import LayerPanelTilemap from './LayerPanelTilemap'
import AIQuickActionsPanel, { generateTilemapQuickActions } from '../ai/AIQuickActionsPanel'

interface TilemapCanvasProps {
  canvasId: string
  onViewportChange?: (viewport: ViewportTransform) => void
  onZoomChange?: (scale: number) => void
  onZoomControlsReady?: (zoomIn: () => void, zoomOut: () => void, zoomReset: () => void, zoomFit: () => void) => void
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean, undo: () => void, redo: () => void) => void
  onExportFunctionsReady?: (exportJSON: () => void, exportPNG: () => void) => void
  // Tilemap state passed from parent
  tileMode: TileMode
  onTileModeChange: (mode: TileMode) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  autoTilingEnabled: boolean
  onAutoTilingToggle: () => void
  showGrid: boolean
  onGridToggle: () => void
  selectedPaletteIndex: number
  onPaletteIndexChange: (index: number) => void
  selectedVariant?: number
  onVariantChange?: (variant: number | undefined) => void
  plainColor: string
  onPlainColorChange: (color: string) => void
  aiChat?: React.ReactNode // Optional AI chat component to render inline in status bar
}

const DEFAULT_PALETTE: PaletteColor[] = DEFAULT_TILEMAP_PALETTE

function TilemapCanvasInner({
  canvasId,
  onViewportChange,
  onZoomChange,
  onZoomControlsReady,
  onUndoRedoChange,
  onExportFunctionsReady,
  tileMode,
  onTileModeChange,
  brushSize,
  onBrushSizeChange,
  autoTilingEnabled,
  onAutoTilingToggle,
  showGrid,
  onGridToggle,
  selectedPaletteIndex,
  onPaletteIndexChange,
  selectedVariant,
  onVariantChange,
  plainColor,
  onPlainColorChange,
  aiChat,
}: TilemapCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  
  // Command history manager
  const historyManager = useMemo(() => createHistoryManager(), [])
  
  // State (only keep internal state, not toolbar-controlled state)
  const [tileSize, setTileSize] = useState(16)
  const [isPainting, setIsPainting] = useState(false)
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanLocked, setIsPanLocked] = useState(false)
  const [lastPanPosition, setLastPanPosition] = useState<{ x: number; y: number } | null>(null)
  const [showAIActions, setShowAIActions] = useState(false)
  const [showAdvancedAIPanel, setShowAdvancedAIPanel] = useState(false)
  const [advancedPrompt, setAdvancedPrompt] = useState('')
  
  // Track stroke for bulk undo/redo
  const currentStrokeRef = useRef<Array<{ x: number; y: number; oldTile: TileData | undefined; newTile: TileData | null }>>([])
  
  const isPanMode = isSpacePressed || isPanLocked

  const containerWidth = window.innerWidth
  const containerHeight = Math.max(0, window.innerHeight - (PRESENCE_BAR_HEIGHT + TILE_STATUS_BAR_HEIGHT))
  const topOffset = PRESENCE_BAR_HEIGHT + HUD_SAFE_MARGIN

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

  // Layer management
  const { setLayers, activeLayerId, setActiveLayer, togglePanel } = useLayerContext()

  // AI Orchestration
  const { previewTiles, executeAICommand, isExecuting, error: aiError, registerTileState } = useAIOrchestrator()
  const { getAssetAIContext } = useAssetLibrary({
    userId: user?.uid || 'anonymous',
    enableSync: Boolean(user?.uid)
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

  const tilesRef = useRef(tiles)
  useEffect(() => {
    tilesRef.current = tiles
  }, [tiles])

  const quickActionsPreview = useMemo(() => {
    if (!meta) return []

    const layers = meta.layers ?? []
    return generateTilemapQuickActions(meta, tiles.size, layers, null).slice(0, 5)
  }, [meta, tiles])

  useEffect(() => {
    return registerTileState({
      getTileMap: () => tilesRef.current,
      isAutoTilingEnabled: () => autoTilingEnabled,
    })
  }, [registerTileState, autoTilingEnabled])

  // Sync layers from meta to store
  useEffect(() => {
    if (meta?.layers) {
      setLayers(meta.layers)
    }
  }, [meta?.layers, setLayers])

  // Handle AI Quick Action
  const handleAIAction = useCallback(
    async (prompt: string, layerId?: string) => {
      if (!user?.uid || !meta) return

      await executeAICommand(prompt, {
        canvasId,
        userId: user.uid,
        tilemapMeta: meta,
        viewport: {
          x: -viewport.x / viewport.scale,
          y: -viewport.y / viewport.scale,
          width: containerWidth / viewport.scale,
          height: containerHeight / viewport.scale,
          zoom: viewport.scale,
        },
        assetContext: getAssetAIContext({ tileSize: meta.tileSize }),
      })
    },
    [user, meta, canvasId, viewport, containerWidth, containerHeight, executeAICommand, getAssetAIContext]
  )

  const togglePanLock = useCallback(() => {
    setIsPanLocked(prev => {
      const next = !prev
      if (!next) {
        setLastPanPosition(null)
      }
      return next
    })
    setIsPainting(false)
  }, [setLastPanPosition, setIsPainting, setIsPanLocked])

  const handleAdvancedExecute = useCallback(async () => {
    const prompt = advancedPrompt.trim()
    if (!prompt || !meta) return

    await handleAIAction(prompt)
    setAdvancedPrompt('')
  }, [advancedPrompt, handleAIAction, meta, setAdvancedPrompt])

  const advancedExamples = useMemo(
    () => [
      'Generate a 40x40 cave network with branching tunnels',
      'Add ruined pillars near the spawn area',
      'Carve a river from left to right with two bridges',
    ],
    []
  )

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

  // Layer management handlers
  const handleLayerUpdate = useCallback(async (layerId: string, updates: Partial<TileLayerMeta>) => {
    await updateLayerInFirebase(canvasId, layerId, updates)
  }, [canvasId])

  const handleToggleLayerPanel = useCallback(() => {
    togglePanel()
  }, [togglePanel])

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
    const workingTiles = new Map(tiles)

    if (tileMode === 'stamp') {
      // Collect changes for all tiles in brush
      const changes: Array<{x: number, y: number, oldTile: TileData | undefined, newTile: TileData}> = []

      // Paint all tiles in the brush area
      affectedTiles.forEach(({x, y}) => {
        const key = coordToKey(x, y)
        const oldTile = workingTiles.get(key)

        // Calculate variant if this tile type has sprite assets
        let variant: number | undefined
        if (tilesetRegistry.hasSpriteSync(selectedPalette.type)) {
          if (autoTilingEnabled) {
            // Auto-tiling: calculate based on neighbors
            variant = calculateTileVariant(x, y, workingTiles, selectedPalette.type)
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
        workingTiles.set(key, newTile)

        // Only update tiles immediately during stroke (for visual feedback)
        if (isStrokePainting) {
          setTile(x, y, newTile)
        }
      })
      
      // Collect neighbor variant updates if auto-tiling is enabled
      const neighborUpdates: Array<{x: number, y: number, oldTile: TileData, newTile: TileData}> = []
      if (autoTilingEnabled && tilesetRegistry.hasSpriteSync(selectedPalette.type)) {
        affectedTiles.forEach(({x, y}) => {
          const updates = calculateAutoTileUpdates(x, y, workingTiles, selectedPalette.type)
          updates.forEach(update => {
            const neighborKey = coordToKey(update.x, update.y)
            const existingTile = workingTiles.get(neighborKey)
            if (
              existingTile &&
              !affectedTiles.some(t => t.x === update.x && t.y === update.y) &&
              existingTile.variant !== update.variant
            ) {
              const updatedTile = { ...existingTile, variant: update.variant }
              // Only update neighbors, not the tiles we just painted
              neighborUpdates.push({
                x: update.x,
                y: update.y,
                oldTile: existingTile,
                newTile: updatedTile
              })

              // Apply immediately during stroke for visual feedback
              if (isStrokePainting) {
                setTile(update.x, update.y, updatedTile)
              }

              workingTiles.set(neighborKey, updatedTile)
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
        const key = coordToKey(x, y)
        const oldTile = workingTiles.get(key)
        if (oldTile) {
          changes.push({x, y, oldTile})

          // Apply immediately during stroke
          if (isStrokePainting) {
            deleteTile(x, y)
          }

          workingTiles.delete(key)
        }
      })

      // Collect neighbor variant updates if auto-tiling is enabled
      const neighborUpdates: Array<{x: number, y: number, oldTile: TileData, newTile: TileData}> = []
      affectedTiles.forEach(({x, y}) => {
        const oldTile = tiles.get(coordToKey(x, y))
        if (oldTile && autoTilingEnabled && tilesetRegistry.hasSpriteSync(oldTile.type)) {
          const updates = calculateAutoTileUpdates(x, y, workingTiles, null)
          updates.forEach(update => {
            const neighborKey = coordToKey(update.x, update.y)
            const existingTile = workingTiles.get(neighborKey)
            if (existingTile && existingTile.variant !== update.variant) {
              const updatedTile = { ...existingTile, variant: update.variant }
              neighborUpdates.push({
                x: update.x,
                y: update.y,
                oldTile: existingTile,
                newTile: updatedTile
              })

              // Apply immediately during stroke
              if (isStrokePainting) {
                setTile(update.x, update.y, updatedTile)
              }

              workingTiles.set(neighborKey, updatedTile)
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
          onPaletteIndexChange(paletteIndex)
        }
      }
      onTileModeChange('stamp')
    }
  }, [tileMode, selectedPalette, selectedVariant, effectiveColor, autoTilingEnabled, brushSize, getBrushTiles, setTile, setTiles, deleteTile, deleteTiles, getTile, fillTiles, tiles, historyManager, onPaletteIndexChange, onTileModeChange])

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
          onPaletteIndexChange(index)
        }
      }
      
      // B: Stamp/Brush mode
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        onTileModeChange('stamp')
      }
      
      // E: Erase mode
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        onTileModeChange('erase')
      }
      
      // F: Fill mode
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        onTileModeChange('fill')
      }
      
      // I: Pick/Eyedropper mode
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        onTileModeChange('pick')
      }
      
      // G: Toggle grid
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault()
        onGridToggle()
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
  }, [showGrid, isSpacePressed, handleUndo, handleRedo, onPaletteIndexChange, onTileModeChange, onGridToggle])

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

    // If pan mode is active, initialize panning (don't paint)
    if (isPanMode) {
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
  }, [screenToTileCoords, paintTileAt, isPanMode, tileMode])

  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current
    if (!stage) return

    const pointer = stage.getPointerPosition()
    if (!pointer) return

    // If pan mode is active, enable panning (no click required)
    if (isPanMode) {
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
    
    // Update hover tile for preview (don't show hover when pan mode is active)
    setHoverTile({ x: tileX, y: tileY })

    // Continue painting if mouse is down and pan mode is not active
    if (isPainting && tileMode !== 'fill' && tileMode !== 'pick') {
      paintTileAt(tileX, tileY, true) // Stroke painting
    }

    // Update presence cursor
    const canvasX = (pointer.x - viewport.x) / viewport.scale
    const canvasY = (pointer.y - viewport.y) / viewport.scale
    updateCursorPosition(canvasX, canvasY)
  }, [screenToTileCoords, isPainting, tileMode, paintTileAt, viewport, updateCursorPosition, isPanMode, lastPanPosition, setViewport])

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
    <div className="w-full h-full bg-gray-100 overflow-hidden relative">
      <div className="w-full h-full relative" style={{ cursor: lastPanPosition ? 'grabbing' : (isPanMode ? 'grab' : 'default') }}>
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
          // Performance optimizations
          pixelRatio={1} // Use device pixel ratio for smoother rendering
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

          {/* AI Preview Tiles Layer (ghost preview) */}
          {previewTiles && previewTiles.length > 0 && (
            <Layer listening={false} opacity={0.5}>
              {previewTiles.map((preview, idx) => (
                <React.Fragment key={`ai-preview-${idx}`}>
                  {/* Render preview tile using same logic as TileRenderer */}
                </React.Fragment>
              ))}
            </Layer>
          )}

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

      {/* Tile Palette - Overlay on the left */}
      <TilePalette
        palette={DEFAULT_PALETTE}
        selectedIndex={selectedPaletteIndex}
        onSelectIndex={onPaletteIndexChange}
        selectedVariant={selectedVariant}
        onVariantChange={onVariantChange}
        plainColor={plainColor}
        onPlainColorChange={onPlainColorChange}
        autoTilingEnabled={autoTilingEnabled}
        onToggleAutoTiling={onAutoTilingToggle}
        brushSize={brushSize}
        onBrushSizeChange={onBrushSizeChange}
        mode={tileMode}
        onModeChange={onTileModeChange}
        tileCount={tiles.size}
        cursorPosition={hoverTile || undefined}
        showGrid={showGrid}
        onToggleGrid={onGridToggle}
        isPanModeActive={isPanMode}
        onPanModeToggle={togglePanLock}
        isAIQuickActionsVisible={showAIActions}
        onAIQuickActionsToggle={() => {
          setShowAIActions(prev => {
            const next = !prev
            if (next) {
              setShowAdvancedAIPanel(false)
            }
            return next
          })
        }}
        isAdvancedAIOpen={showAdvancedAIPanel}
        onAdvancedAIToggle={() => {
          setShowAdvancedAIPanel(prev => {
            const next = !prev
            if (next) {
              setShowAIActions(false)
            }
            return next
          })
        }}
        quickActionsPreview={quickActionsPreview}
      />

      {/* Status Bar - Fixed at bottom */}
      <TileStatusBar
        cursorPosition={hoverTile || undefined}
        tileCount={tiles.size}
        mode={tileMode}
        tileSize={tileSize}
        zoom={viewport.scale}
        connectionStatus={connectionStatus}
        aiChat={aiChat}
      />

      {/* Layer Management Panel */}
      <LayerPanelTilemap
        canvasId={canvasId}
        onLayerUpdate={handleLayerUpdate}
      />

      {/* AI Quick Actions Panel */}
      {showAIActions && meta && (
        <AIQuickActionsPanel
          tilemapMeta={meta}
          tileCount={tiles.size}
          onActionClick={handleAIAction}
        />
      )}

      {showAdvancedAIPanel && (
        <div
          className="absolute z-40"
          style={{
            left: '72px',
            top: `${topOffset}px`,
            width: '320px',
          }}
        >
          <div className="rounded-xl shadow-2xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/10 backdrop-blur-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <div className="text-white/80 text-[11px] uppercase tracking-wide font-semibold">Advanced AI Commands</div>
              <button
                onClick={() => setShowAdvancedAIPanel(false)}
                className="text-white/60 hover:text-white transition-colors text-sm"
                aria-label="Close advanced AI panel"
              >
                ✕
              </button>
            </div>
            <div className="p-3 space-y-3 text-sm text-white/80">
              <p className="text-xs text-white/60">
                Enter a custom instruction for the AI painter. Commands run inside the current viewport and use your active tile layers.
              </p>
              <textarea
                value={advancedPrompt}
                onChange={(e) => setAdvancedPrompt(e.target.value)}
                className="w-full h-24 rounded-lg border border-white/20 bg-black/30 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                placeholder="Describe the tilemap change you want..."
              />
              <div className="flex flex-wrap gap-2">
                {advancedExamples.map(example => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setAdvancedPrompt(example)}
                    className="px-2 py-1 rounded-lg text-xs bg-white/10 hover:bg-white/20 transition text-white/80"
                  >
                    {example}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAdvancedExecute}
                disabled={!meta || advancedPrompt.trim().length === 0 || isExecuting}
                className="w-full px-3 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 transition text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExecuting ? 'Running…' : 'Run Advanced Command'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Execution Status */}
      {isExecuting && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-blue-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">AI is painting...</span>
          </div>
        </div>
      )}

      {/* AI Error Toast */}
      {aiError && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-lg">
            <span className="text-sm">{aiError}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TilemapCanvas(props: TilemapCanvasProps) {
  return (
    <AIOrchestratorProvider>
      <TilemapCanvasInner {...props} />
    </AIOrchestratorProvider>
  )
}
