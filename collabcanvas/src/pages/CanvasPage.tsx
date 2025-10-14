import Canvas from '../components/Canvas'

/**
 * Canvas Page - Main page component for the collaborative canvas
 * This wraps the Canvas component and will later include:
 * - PresenceBar (top header with online users)
 * - Toolbar (left vertical toolbar)
 */
export default function CanvasPage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      {/* Canvas takes full screen for now */}
      {/* In PR-5, PresenceBar will be added at top */}
      {/* In PR-6, Toolbar will be added on left */}
      <Canvas />
    </div>
  )
}

