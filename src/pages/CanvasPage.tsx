import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Canvas from '../components/canvas/Canvas'
import PresenceBar from '../components/PresenceBar'
import Toolbar from '../components/toolbar/Toolbar'
import { LayerPanel } from '../components/panels/LayerPanel'
import ShapeStatusBar from '../components/canvas/ShapeStatusBar'
import { AIChatPanel } from '../components/panels/AIChatPanel'
import { AssetLibrary } from '../components/assets/AssetLibrary'
import ExportModal from '../components/export/ExportModal'
import { useAuth } from '../hooks/useAuth'
import { usePresence } from '../hooks/usePresence'
import { useCanvas } from '../hooks/useCanvas'
import { useGroups } from '../hooks/useGroups'
import { useLayers } from '../hooks/useLayers'
import { getCanvas, updateCanvas, generateThumbnail } from '../services/canvas/canvasManager'
import { isAIEnabled } from '../services/ai/ai'
import type { ToolType } from '../types/canvas'
import type { CanvasMetadata } from '../services/canvas/canvasManager'
import type Konva from 'konva'

/**
 * Canvas Page - Main page component for the collaborative canvas (PR-22: Dynamic canvas ID)
 * Includes PresenceBar at top, Toolbar on left, and Canvas in center
 */
export default function CanvasPage() {
  const { canvasId: routeCanvasId } = useParams<{ canvasId: string }>()
  const [selectedTool, setSelectedTool] = useState<ToolType>('select')
  const [canvasMetadata, setCanvasMetadata] = useState<CanvasMetadata | null>(null)
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 })
  const stageRef = useRef<Konva.Stage | null>(null)
  
  // Use 'public-board' as default if no canvasId in route
  const canvasId = routeCanvasId || 'public-board'
  
  // Tilemap mode toggle
  const [isTilemapMode, setIsTilemapMode] = useState(false)
  
  // AI Assistant state
  const [showAIChat, setShowAIChat] = useState(false)
  
  // Asset Library state
  const [showAssetLibrary, setShowAssetLibrary] = useState(false)
  
  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false)
  
  // Tilemap state
  const [tileMode, setTileMode] = useState<'stamp' | 'erase' | 'fill' | 'pick'>('stamp')
  const [brushSize, setBrushSize] = useState(1)
  const [autoTilingEnabled, setAutoTilingEnabled] = useState(true) // Default to ON for better UX
  const [showTileGrid, setShowTileGrid] = useState(true)
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<number | undefined>(undefined)
  const [plainColor, setPlainColor] = useState('#ffffff')
  const [tilemapCanUndo, setTilemapCanUndo] = useState(false)
  const [tilemapCanRedo, setTilemapCanRedo] = useState(false)
  const [tilemapUndoFn, setTilemapUndoFn] = useState<(() => void) | null>(null)
  const [tilemapRedoFn, setTilemapRedoFn] = useState<(() => void) | null>(null)
  
  // Zoom control functions (will be set by Canvas component)
  const zoomControlsRef = useRef<{
    zoomIn: () => void
    zoomOut: () => void
    zoomReset: () => void
    zoomFit: () => void
  } | null>(null)

  // Tilemap export functions (will be set by Canvas component)
  const exportFunctionsRef = useRef<{
    exportJSON: () => void
    exportPNG: () => void
  } | null>(null)

  const { user } = useAuth()

  // Canvas, Groups, and Layers hooks (PR-19)
  const { shapes, selectedIds, setSelection, updateColors, updateShape, getRecentColors, deleteShape } = useCanvas({
    canvasId: canvasId,
    userId: user?.uid || '',
    enableSync: true,
  })
  
  // Color sampling callback (passed from Canvas)
  const [enableColorSampling, setEnableColorSampling] = useState<((callback: (color: string) => void) => void) | null>(null)
  
  // Wrap setEnableColorSampling to avoid setState during render
  const handleColorSamplingReady = useCallback((fn: (callback: (color: string) => void) => void) => {
    // Defer setState to next tick to avoid "setState during render" error
    setTimeout(() => {
      setEnableColorSampling(() => fn)
    }, 0)
  }, [])

  const { groups } = useGroups({
    canvasId: canvasId,
    userId: user?.uid || '',
    enableSync: true,
  })

  const { toggleVisibility, toggleLock } = useLayers({
    canvasId: canvasId,
    enableSync: true,
  })
  
  
  // Load canvas metadata
  useEffect(() => {
    if (!user?.uid || !canvasId) return

    const loadCanvas = async () => {
      try {
        // Check if this is a collab space (public shared canvas)
        // Load canvas from database
        const canvas = await getCanvas(canvasId, user.uid)
        if (canvas) {
          setCanvasMetadata(canvas)
        }
        // If canvas not found, it will be created automatically by useCanvas hook
      } catch (error) {
        console.error('Error loading canvas:', error)
      }
    }

    loadCanvas()
  }, [canvasId, user?.uid])
  
  // Only initialize presence when user is authenticated
  const { otherUsers } = usePresence({
    userId: user?.uid || '',
    userName: user?.displayName || user?.email || 'Anonymous',
    canvasId: canvasId,
  })

  // Auto-save thumbnail every 30 seconds (PR-22)
  useEffect(() => {
    if (!user?.uid || !canvasId || !stageRef.current) return

    const interval = setInterval(() => {
      const thumbnail = generateThumbnail(stageRef.current)
      if (thumbnail) {
        updateCanvas(canvasId, user.uid, { thumbnail }).catch(console.error)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [canvasId, user?.uid])

  // Handle tool selection
  const handleToolSelect = useCallback((tool: ToolType) => {
    setSelectedTool(tool)
    // Clear selection when switching to non-select tool
    if (tool !== 'select' && tool !== 'delete') {
      setSelection(null)
    }
  }, [setSelection])

  // Handle shape selection from canvas - use setSelection from useCanvas hook
  const handleShapeSelect = useCallback((id: string | null) => {
    setSelection(id)
  }, [setSelection])

  // Trigger delete from toolbar
  const [deleteTriggered, setDeleteTriggered] = useState(0)

  // Handle delete action from toolbar
  const handleDelete = useCallback(() => {
    // Increment to trigger delete in Canvas
    setDeleteTriggered((prev) => prev + 1)
  }, [])

  // PR-14: Undo/Redo state from Canvas
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [undoFn, setUndoFn] = useState<(() => void) | null>(null)
  const [redoFn, setRedoFn] = useState<(() => void) | null>(null)

  // Handle undo/redo state changes from Canvas
  const handleUndoRedoChange = useCallback(
    (canUndo: boolean, canRedo: boolean, undo: () => void, redo: () => void) => {
      if (isTilemapMode) {
        setTilemapCanUndo(canUndo)
        setTilemapCanRedo(canRedo)
        setTilemapUndoFn(() => undo)
        setTilemapRedoFn(() => redo)
      } else {
        setCanUndo(canUndo)
        setCanRedo(canRedo)
        setUndoFn(() => undo)
        setRedoFn(() => redo)
      }
    },
    [isTilemapMode]
  )

  // Zoom handlers (PR-20) - now delegated to Canvas component
  const handleZoomIn = useCallback(() => {
    zoomControlsRef.current?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    zoomControlsRef.current?.zoomOut()
  }, [])

  const handleZoomReset = useCallback(() => {
    zoomControlsRef.current?.zoomReset()
  }, [])

  const handleZoomFit = useCallback(() => {
    zoomControlsRef.current?.zoomFit()
  }, [])
  
  // Handle zoom controls ready from Canvas
  const handleZoomControlsReady = useCallback((zoomIn: () => void, zoomOut: () => void, zoomReset: () => void, zoomFit: () => void) => {
    zoomControlsRef.current = { zoomIn, zoomOut, zoomReset, zoomFit }
  }, [])

  // Handle export functions ready from Canvas
  const handleExportFunctionsReady = useCallback((exportJSON: () => void, exportPNG: () => void) => {
    exportFunctionsRef.current = { exportJSON, exportPNG }
  }, [])

  // Export handlers to pass to PresenceBar
  const handleExportJSON = useCallback(() => {
    exportFunctionsRef.current?.exportJSON()
  }, [])

  const handleExportPNG = useCallback(() => {
    exportFunctionsRef.current?.exportPNG()
  }, [])

  // Handle new export system (opens Export Modal)
  const handleExport = useCallback((format: 'json' | 'png' | 'svg' | 'tilemap' | 'godot' | 'unity') => {
    // For new formats (godot, unity) or when user wants advanced options, open the export modal
    if (format === 'godot' || format === 'unity') {
      setShowExportModal(true)
    } else if (format === 'json') {
      // Legacy: use existing JSON export
      handleExportJSON()
    } else if (format === 'png') {
      // Legacy: use existing PNG export
      handleExportPNG()
    } else {
      // For other formats, open export modal
      setShowExportModal(true)
    }
  }, [handleExportJSON, handleExportPNG])

  // Layer panel handlers (PR-19)
  const handleSelectLayer = useCallback((layerId: string) => {
    setSelection(layerId)
  }, [setSelection])

  const handleRenameLayer = useCallback((layerId: string, newName: string) => {
    // For shapes, we don't store custom names in this MVP
    // For groups, this would update the group name via Firebase
    console.log(`Rename layer ${layerId} to ${newName}`)
  }, [])

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col bg-neutral-50">
      {/* Top Header - Presence Bar (48px height, z-index 50) */}
      <PresenceBar
        currentUser={{
          displayName: user?.displayName || null,
          email: user?.email || null,
        }}
        otherUsers={otherUsers}
        scale={viewport.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onZoomFit={handleZoomFit}
        isTilemapMode={isTilemapMode}
        onToggleTilemapMode={() => setIsTilemapMode(!isTilemapMode)}
        onToggleAssetLibrary={() => setShowAssetLibrary(!showAssetLibrary)}
        onExport={handleExport}
        onExportJSON={handleExportJSON}
        onExportPNG={handleExportPNG}
      />

      {/* Main Content Area - Toolbar + Canvas + LayerPanel */}
      <div className="flex flex-row h-[calc(100vh-88px)] relative">
        {/* Left Toolbar - Only shown in shape mode */}
        {!isTilemapMode && (
          <Toolbar
            selectedTool={selectedTool}
            onToolSelect={handleToolSelect}
            hasSelection={selectedIds.size > 0}
            onDelete={handleDelete}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undoFn || undefined}
            onRedo={redoFn || undefined}
          />
        )}

        {/* Canvas Container - Flexible width, adjusts when layer panel is minimized */}
        <div className="flex-1 h-full overflow-hidden">
          <Canvas
            selectedTool={selectedTool}
            onShapeSelect={handleShapeSelect}
            deleteTriggered={deleteTriggered}
            onUndoRedoChange={handleUndoRedoChange}
            canvasId={canvasId}
            onViewportChange={(vp) => setViewport({ x: vp.x, y: vp.y, scale: vp.scale })}
            onZoomChange={(scale) => setViewport(prev => ({ ...prev, scale }))}
            onZoomControlsReady={handleZoomControlsReady}
            onColorSamplingReady={handleColorSamplingReady}
            isTilemapMode={isTilemapMode}
            onExportFunctionsReady={handleExportFunctionsReady}
            tileMode={tileMode}
            onTileModeChange={setTileMode}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            autoTilingEnabled={autoTilingEnabled}
            onAutoTilingToggle={() => {
              setAutoTilingEnabled(!autoTilingEnabled)
              if (!autoTilingEnabled) {
                setSelectedVariant(undefined)
              }
            }}
            showTileGrid={showTileGrid}
            onTileGridToggle={() => setShowTileGrid(!showTileGrid)}
            selectedPaletteIndex={selectedPaletteIndex}
            onPaletteIndexChange={setSelectedPaletteIndex}
            selectedVariant={selectedVariant}
            onVariantChange={setSelectedVariant}
            plainColor={plainColor}
            onPlainColorChange={setPlainColor}
            aiChat={
              isAIEnabled() && user ? (
                <AIChatPanel
                  canvasId={canvasId}
                  userId={user.uid}
                  selectedShapes={Array.from(selectedIds)}
                  viewport={{
                    x: viewport.x,
                    y: viewport.y,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    zoom: viewport.scale,
                  }}
                  mode={isTilemapMode ? 'tilemap' : 'shapes'}
                  onClose={() => {/* AI always visible in status bar */}}
                />
              ) : null
            }
          />
        </div>

        {/* Right Layer Panel (PR-19: 256px width, from top 64px) - Hidden in tilemap mode */}
        {!isTilemapMode && (
          <LayerPanel
            shapes={shapes}
            groups={groups}
            selectedIds={selectedIds}
            onSelectLayer={handleSelectLayer}
            onToggleVisibility={toggleVisibility}
            onToggleLock={toggleLock}
            onRenameLayer={handleRenameLayer}
            onDelete={deleteShape}
            onUpdateColors={(fill, stroke, strokeWidth) => updateColors(fill, stroke, strokeWidth)}
            onUpdateShapeProps={(id, updates) => updateShape(id, updates)}
            recentColors={getRecentColors()}
            onRequestColorSample={enableColorSampling || undefined}
            collabTheme={{
              primary: '#475569',
              secondary: '#374151',
              gradient: 'from-slate-600 to-gray-700',
              displayName: 'CollabCanvas',
              softBg: 'rgba(71, 85, 105, 0.3)',
              softBorder: 'rgba(71, 85, 105, 0.4)'
            }}
          />
        )}

      </div>

      {/* Status Bar with inline AI Chat - Fixed at bottom */}
      {!isTilemapMode && (
        <ShapeStatusBar
          shapeCount={shapes.length}
          selectedCount={selectedIds.size}
          zoom={viewport.scale}
          connectionStatus="connected"
          aiChat={
            isAIEnabled() && user ? (
              <AIChatPanel
                canvasId={canvasId}
                userId={user.uid}
                selectedShapes={Array.from(selectedIds)}
                viewport={{
                  x: viewport.x,
                  y: viewport.y,
                  width: window.innerWidth,
                  height: window.innerHeight,
                  zoom: viewport.scale,
                }}
                mode="shapes"
                onClose={() => {/* AI always visible in status bar */}}
              />
            ) : null
          }
        />
      )}

      {/* Asset Library Panel - Slides in from left */}
      {showAssetLibrary && user?.uid && (
        <div className="fixed left-0 top-12 bottom-0 w-80 z-40 shadow-2xl">
          <AssetLibrary 
            userId={user.uid}
            onClose={() => setShowAssetLibrary(false)}
            onSelectAsset={(assetId) => {
              console.log('Selected asset:', assetId)
              // TODO: Handle asset selection (add to canvas, open animation creator, etc.)
            }}
          />
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        canvasId={canvasId}
        canvasName={canvasMetadata?.name || 'Untitled Canvas'}
      />
    </div>
  )
}

