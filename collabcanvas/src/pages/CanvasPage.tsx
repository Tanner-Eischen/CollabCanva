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
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [canvasMetadata, setCanvasMetadata] = useState<CanvasMetadata | null>(null)
  const [viewport, setViewport] = useState({ scale: 1 })
  const stageRef = useRef<Konva.Stage | null>(null)

  const { user } = useAuth()

  // Redirect if no canvas ID
  if (!canvasId) {
    navigate('/')
    return null
  }

  // Canvas, Groups, and Layers hooks (PR-19)
  const { shapes, selectedIds, setSelection } = useCanvas({
    canvasId: canvasId,
    userId: user?.uid || '',
    enableSync: true,
  })

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
      setSelectedShapeId(null)
    }
  }, [])

  // Handle shape selection from canvas
  const handleShapeSelect = useCallback((id: string | null) => {
    setSelectedShapeId(id)
  }, [])

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

  // Zoom handlers (PR-20)
  const handleZoomIn = useCallback(() => {
    setViewport((prev) => ({ scale: Math.min(prev.scale * 1.2, 5) }))
  }, [])

  const handleZoomOut = useCallback(() => {
    setViewport((prev) => ({ scale: Math.max(prev.scale / 1.2, 0.1) }))
  }, [])

  const handleZoomReset = useCallback(() => {
    setViewport({ scale: 1 })
  }, [])

  const handleZoomFit = useCallback(() => {
    // Fit canvas to viewport (simplified - actual implementation would calculate better)
    setViewport({ scale: 0.5 })
  }, [])

  // Back to dashboard (PR-22)
  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

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
    setSelectedShapeId(layerId)
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
        canvasName={canvasMetadata?.name || 'Loading...'}
        onCanvasNameChange={handleCanvasNameChange}
        lastEdited="Just now"
        onBack={handleBack}
      />

      {/* Main Content Area - Toolbar + Canvas + LayerPanel (PR-19/20: proper sizing) */}
      <div className="flex flex-row h-[calc(100vh-64px)]">
        {/* Left Toolbar (PR-20: 48px width, from top 64px) */}
        <Toolbar
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
          hasSelection={selectedShapeId !== null}
          onDelete={handleDelete}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undoFn || undefined}
          onRedo={redoFn || undefined}
        />

        {/* Canvas Container (PR-19: calc(100vw - 48px - 256px) width, calc(100vh - 64px) height) */}
        <div className="flex-1 w-[calc(100vw-48px-256px)] h-full">
          <Canvas
            selectedTool={selectedTool}
            onShapeSelect={handleShapeSelect}
            deleteTriggered={deleteTriggered}
            onUndoRedoChange={handleUndoRedoChange}
            canvasId={canvasId}
          />
        </div>

        {/* Right Layer Panel (PR-19: 256px width, from top 64px) */}
        <LayerPanel
          shapes={shapes}
          groups={groups}
          selectedIds={selectedIds}
          onSelectLayer={handleSelectLayer}
          onToggleVisibility={toggleVisibility}
          onToggleLock={toggleLock}
          onRenameLayer={handleRenameLayer}
        />
      </div>
    </div>
  )
}

