import { useState, useCallback } from 'react'
import Canvas from '../components/Canvas'
import PresenceBar from '../components/PresenceBar'
import Toolbar from '../components/Toolbar'
import { useAuth } from '../hooks/useAuth'
import { usePresence } from '../hooks/usePresence'
import type { ToolType } from '../types/canvas'

const CANVAS_ID = import.meta.env.VITE_CANVAS_ID || 'default-canvas'

/**
 * Canvas Page - Main page component for the collaborative canvas
 * Includes PresenceBar at top, Toolbar on left, and Canvas in center
 */
export default function CanvasPage() {
  const [selectedTool, setSelectedTool] = useState<ToolType>('select')
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)

  const { user } = useAuth()
  
  // Only initialize presence when user is authenticated
  const { otherUsers } = usePresence({
    userId: user?.uid || '',
    userName: user?.displayName || user?.email || 'Anonymous',
    canvasId: CANVAS_ID,
  })

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

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      {/* Top Header - Presence Bar */}
      <PresenceBar
        currentUser={{
          displayName: user?.displayName || null,
          email: user?.email || null,
        }}
        otherUsers={otherUsers}
      />

      {/* Main Content Area - Toolbar + Canvas */}
      <div className="flex-1 mt-14 flex">
        {/* Left Toolbar */}
        <Toolbar
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
          hasSelection={selectedShapeId !== null}
          onDelete={handleDelete}
        />

        {/* Canvas - offset by toolbar width (80px = w-20) */}
        <div className="flex-1 ml-20">
          <Canvas
            selectedTool={selectedTool}
            onShapeSelect={handleShapeSelect}
            deleteTriggered={deleteTriggered}
          />
        </div>
      </div>
    </div>
  )
}

