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
  // UX: Snap control
  snapToGrid?: boolean
  onSnapToggle?: () => void
  // Tilemap mode toggle
  isTilemapMode?: boolean
  onToggleTilemapMode?: () => void
  // Tilemap export functions
  onExportTilemapJSON?: () => void
  onExportTilemapPNG?: () => void
  // Theme prop (always grey theme now)
  collabTheme?: {
    primary: string
    secondary: string
    gradient: string
    displayName: string
    softBg: string
    softBorder: string
  } | null
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
  snapToGrid = false,
  onSnapToggle,
  isTilemapMode = false,
  onToggleTilemapMode,
  onExportTilemapJSON,
  onExportTilemapPNG,
  collabTheme = {
    primary: '#475569',
    secondary: '#374151',
    gradient: 'from-slate-600 to-gray-700',
    displayName: '',
    softBg: 'rgba(71, 85, 105, 0.3)',
    softBorder: 'rgba(71, 85, 105, 0.4)'
  },
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
    <div 
      className="fixed top-0 left-0 right-0 h-16 shadow-lg z-50 flex items-center justify-between px-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom right, #475569, #374151)'
      }}
    >
      {/* Dot pattern overlay */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      ></div>

      {/* Content wrapper */}
      <div className="relative z-10 w-full flex items-center justify-between gap-4">
      {/* Left Section: Back button, canvas name, last edited */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onBack && (
              <button
                type="button"
                onClick={onBack}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              collabTheme 
                ? 'hover:bg-white/20 text-white' 
                : 'hover:bg-neutral-100 text-neutral-700'
            }`}
            title="Back to dashboard"
          >
            <span className="text-xl">←</span>
          </button>
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
              className={`text-sm font-semibold px-2 py-1 rounded border-2 focus:outline-none ${
                collabTheme
                  ? 'bg-white/80 text-gray-900 placeholder-gray-600 border-white/60'
                  : 'text-neutral-900 bg-neutral-100 border-primary-500'
              }`}
              style={{ width: Math.max(120, editedName.length * 8) + 'px' }}
            />
          ) : (
            <button
              onClick={handleNameClick}
              className={`text-sm font-semibold transition-colors text-left truncate ${
                collabTheme
                  ? 'text-white hover:text-white/90'
                  : 'text-neutral-900 hover:text-primary-600'
              }`}
              disabled={!onCanvasNameChange}
            >
              {canvasName}
            </button>
          )}
          <span className={`text-xs ${collabTheme ? 'text-white/80' : 'text-neutral-500'}`}>
            {lastEdited}
          </span>
        </div>
      </div>

      {/* Center Section: Zoom Controls & Tilemap Toggle */}
      <div className="flex items-center gap-3">
        <ZoomControls
          scale={scale}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
          onZoomFit={onZoomFit}
          collabTheme={collabTheme}
        />
        
        {/* Tilemap Mode Toggle */}
        {onToggleTilemapMode && (
          <button
            onClick={onToggleTilemapMode}
            className={`px-3 py-1.5 rounded-md font-medium text-sm transition-all ${
              isTilemapMode
                ? 'bg-white/30 text-white hover:bg-white/40 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isTilemapMode ? 'Switch to Shape Mode' : 'Switch to Tilemap Mode'}
          >
            {isTilemapMode ? '🎨 Shapes' : '🎮 Tilemap'}
          </button>
        )}
        
        {/* Tilemap Export Buttons (only show in tilemap mode) */}
        {isTilemapMode && onExportTilemapJSON && (
          <div className="flex items-center gap-2">
            <button
              onClick={onExportTilemapJSON}
              className="px-3 py-1.5 rounded-md font-medium text-sm transition-all bg-white/20 text-white hover:bg-white/30 shadow-sm"
              title="Export Tilemap as JSON"
            >
              📥 JSON
            </button>
            {onExportTilemapPNG && (
              <button
                onClick={onExportTilemapPNG}
                className="px-3 py-1.5 rounded-md font-medium text-sm transition-all bg-white/20 text-white hover:bg-white/30 shadow-sm"
                title="Export Tilemap as PNG"
              >
                📥 PNG
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Section: Snap button, Online users, Share button, Logout */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        {/* Snap to Grid Button */}
        {onSnapToggle && (
          <button
            onClick={onSnapToggle}
            className={`px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${
              snapToGrid
                ? collabTheme
                  ? 'bg-white/80 text-gray-900 shadow-sm'
                  : 'bg-blue-500 text-white shadow-sm'
                : collabTheme
                  ? 'bg-white/60 hover:bg-white/70 text-gray-900'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
            title={snapToGrid ? 'Snap to Grid: ON (20px)' : 'Snap to Grid: OFF'}
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 8h4M4 12h4M4 16h4M12 8h4M12 12h4M12 16h4" 
                />
              </svg>
              <span>{snapToGrid ? 'Snap' : 'Snap'}</span>
            </div>
          </button>
        )}
        
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
        <button className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          collabTheme
            ? 'bg-white/80 hover:bg-white/90 text-gray-900 shadow-sm'
            : 'bg-primary-600 hover:bg-primary-700 text-white'
        }`}>
          Share
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            collabTheme
              ? 'bg-white/60 hover:bg-white/70 text-gray-900'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          Logout
        </button>
      </div>
      </div>
    </div>
  )
}

