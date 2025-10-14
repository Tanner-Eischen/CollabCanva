import Canvas from '../components/Canvas'
import PresenceBar from '../components/PresenceBar'
import { useAuth } from '../hooks/useAuth'
import { usePresence } from '../hooks/usePresence'

const CANVAS_ID = import.meta.env.VITE_CANVAS_ID || 'default-canvas'

/**
 * Canvas Page - Main page component for the collaborative canvas
 * Includes PresenceBar at top and Canvas below
 * Toolbar will be added in PR-6
 */
export default function CanvasPage() {
  const { user } = useAuth()
  const { otherUsers } = usePresence({
    userId: user?.uid || 'anonymous',
    userName: user?.displayName || user?.email || 'Anonymous',
    canvasId: CANVAS_ID,
  })

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

      {/* Main Canvas Area - offset by header height (56px = h-14) */}
      <div className="flex-1 mt-14">
        <Canvas />
      </div>

      {/* Toolbar will be added on left in PR-6 */}
    </div>
  )
}

