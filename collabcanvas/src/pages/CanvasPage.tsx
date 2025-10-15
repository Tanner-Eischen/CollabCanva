import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Canvas from '../components/Canvas'
import PresenceBar from '../components/PresenceBar'
import Toolbar from '../components/Toolbar'
import { LayerPanel } from '../components/LayerPanel'
import { useAuth } from '../hooks/useAuth'
import { usePresence } from '../hooks/usePresence'
import { useCanvas } from '../hooks/useCanvas'
import { useGroups } from '../hooks/useGroups'
import { useLayers } from '../hooks/useLayers'
import { getCanvas, updateCanvas, generateThumbnail } from '../services/canvasManager'
import type { ToolType } from '../types/canvas'
import type { CanvasMetadata } from '../services/canvasManager'
import type Konva from 'konva'

/**
 * Canvas Page - Main page component for the collaborative canvas (PR-22: Dynamic canvas ID)
 * Includes PresenceBar at top, Toolbar on left, and Canvas in center
 */
export default function CanvasPage() {
  const { canvasId } = useParams<{ canvasId: string }>()
  const navigate = useNavigate()
  const [selectedTool, setSelectedTool] = useState<ToolType>('select')
  const [canvasMetadata, setCanvasMetadata] = useState<CanvasMetadata | null>(null)
  const [viewport, setViewport] = useState({ scale: 1 })
  const stageRef = useRef<Konva.Stage | null>(null)
  
  // UX: Snap control
  const [snapToGrid, setSnapToGrid] = useState(false)
  
  // NEW: Tilemap mode toggle
  const [isTilemapMode, setIsTilemapMode] = useState(false)
  
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

  // Redirect if no canvas ID
  if (!canvasId) {
    navigate('/')
    return null
  }

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
        if (!canvas) {
          alert('Canvas not found')
          navigate('/')
          return
        }
        setCanvasMetadata(canvas)
      } catch (error) {
        console.error('Error loading canvas:', error)
        navigate('/')
      }
    }

    loadCanvas()
  }, [canvasId, user?.uid, navigate])
  
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
      setCanUndo(canUndo)
      setCanRedo(canRedo)
      setUndoFn(() => undo)
      setRedoFn(() => redo)
    },
    []
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

  // Back to dashboard (PR-22)
  const handleBack = () => {
    navigate('/', { replace: true })
    
    // Fallback with slight delay
    setTimeout(() => {
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }, 100)
  }
  
  // Get display name for canvas
  const getDisplayName = () => {
    if (canvasId === 'public-board') {
      return '🌍 Public Collaboration Board'
    }
    return canvasMetadata?.name || 'Loading...'
  }

  // Update canvas name (PR-22)
  const handleCanvasNameChange = useCallback(
    async (newName: string) => {
      if (!user?.uid || !canvasId || !newName.trim()) return

      try {
        await updateCanvas(canvasId, user.uid, { name: newName.trim() })
        setCanvasMetadata((prev) => (prev ? { ...prev, name: newName.trim() } : null))
      } catch (error) {
        console.error('Error updating canvas name:', error)
      }
    },
    [canvasId, user?.uid]
  )

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
      {/* Top Header - Presence Bar (PR-20: 64px height, z-index 50) */}
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
        canvasName={getDisplayName()}
        onCanvasNameChange={canvasId === 'public-board' ? undefined : handleCanvasNameChange}
        lastEdited="Just now"
        onBack={handleBack}
        snapToGrid={snapToGrid}
        onSnapToggle={() => setSnapToGrid(!snapToGrid)}
        isTilemapMode={isTilemapMode}
        onToggleTilemapMode={() => setIsTilemapMode(!isTilemapMode)}
        onExportTilemapJSON={handleExportJSON}
        onExportTilemapPNG={handleExportPNG}
      />

      {/* Main Content Area - Toolbar + Canvas + LayerPanel (PR-19/20: proper sizing) */}
      <div className="flex flex-row h-[calc(100vh-64px)]">
        {/* Left Toolbar (PR-20: 48px width, from top 64px) - Hidden in tilemap mode */}
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
            onZoomChange={(scale) => setViewport({ scale })}
            onZoomControlsReady={handleZoomControlsReady}
            snapToGrid={snapToGrid}
            onColorSamplingReady={handleColorSamplingReady}
            isTilemapMode={isTilemapMode}
            onExportFunctionsReady={handleExportFunctionsReady}
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
          />
        )}
      </div>
    </div>
  )
}

