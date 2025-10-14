import { useState } from 'react'
import { logOut } from '../services/auth'
import type { Presence } from '../types/firebase'
import { ZoomControls } from './ZoomControls'
import { Tooltip } from './Tooltip'

interface PresenceBarProps {
  currentUser: {
    displayName: string | null
    email: string | null
  }
  otherUsers: Map<string, Presence>
  // PR-20: Zoom controls
  scale?: number
  onZoomIn?: () => void
  onZoomOut?: () => void
  onZoomReset?: () => void
  onZoomFit?: () => void
  // PR-22: Canvas info
  canvasName?: string
  onCanvasNameChange?: (name: string) => void
  lastEdited?: string
  onBack?: () => void
}

/**
 * PresenceBar - Professional Figma-style header (PR-20)
 * 64px height, white background, with back button, canvas name, zoom controls, and user presence
 */
export default function PresenceBar({ 
  currentUser, 
  otherUsers,
  scale = 1,
  onZoomIn = () => {},
  onZoomOut = () => {},
  onZoomReset = () => {},
  onZoomFit = () => {},
  canvasName = 'Untitled',
  onCanvasNameChange,
  lastEdited = 'Just now',
  onBack,
}: PresenceBarProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(canvasName)

  const handleLogout = async () => {
    try {
      await logOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleNameClick = () => {
    if (onCanvasNameChange) {
      setIsEditingName(true)
      setEditedName(canvasName)
    }
  }

  const handleNameSubmit = () => {
    if (onCanvasNameChange && editedName.trim()) {
      onCanvasNameChange(editedName.trim())
    }
    setIsEditingName(false)
  }

  const handleNameCancel = () => {
    setEditedName(canvasName)
    setIsEditingName(false)
  }

  // Combine current user with other users for display
  const allUsers = [
    {
      name: currentUser.displayName || currentUser.email || 'You',
      color: '#3B82F6', // Blue for current user
      isSelf: true,
    },
    ...Array.from(otherUsers.values()).map((presence) => ({
      name: presence.n,
      color: presence.cl,
      isSelf: false,
    })),
  ]

  return (
    <div className="fixed top-0 left-0 right-0 h-header bg-white border-b border-neutral-200 shadow-soft z-50 flex items-center justify-between px-4">
      {/* Left Section: Back button, canvas name, last edited */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onBack && (
          <Tooltip content="Back to dashboard" side="bottom">
            <button
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 transition-colors"
            >
              <span className="text-neutral-700">←</span>
            </button>
          </Tooltip>
        )}
        
        <div className="flex flex-col min-w-0">
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit()
                if (e.key === 'Escape') handleNameCancel()
              }}
              onBlur={handleNameSubmit}
              autoFocus
              className="text-sm font-semibold text-neutral-900 bg-neutral-100 px-2 py-1 rounded border-2 border-primary-500 focus:outline-none"
              style={{ width: Math.max(120, editedName.length * 8) + 'px' }}
            />
          ) : (
            <button
              onClick={handleNameClick}
              className="text-sm font-semibold text-neutral-900 hover:text-primary-600 transition-colors text-left truncate"
              disabled={!onCanvasNameChange}
            >
              {canvasName}
            </button>
          )}
          <span className="text-xs text-neutral-500">{lastEdited}</span>
        </div>
      </div>

      {/* Center Section: Zoom Controls */}
      <div className="flex items-center">
        <ZoomControls
          scale={scale}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
          onZoomFit={onZoomFit}
        />
      </div>

      {/* Right Section: Online users, Share button, Logout */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        {/* User avatars */}
        <div className="flex items-center -space-x-2">
          {allUsers.slice(0, 5).map((user, index) => (
            <Tooltip key={index} content={user.name + (user.isSelf ? ' (You)' : '')} side="bottom">
              <div
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold shadow-medium"
                style={{ 
                  backgroundColor: user.color,
                  zIndex: allUsers.length - index 
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            </Tooltip>
          ))}
          {allUsers.length > 5 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-neutral-200 flex items-center justify-center text-neutral-700 text-xs font-semibold shadow-medium">
              +{allUsers.length - 5}
            </div>
          )}
        </div>

        {/* Share Button - placeholder for PR-23 */}
        <button className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          Share
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

