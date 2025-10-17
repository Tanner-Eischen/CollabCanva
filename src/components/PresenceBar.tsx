import { useState, useRef, useEffect } from 'react'
import { logOut } from '../services/auth'
import type { Presence } from '../types/firebase'
import { ZoomControls } from './ui/ZoomControls'
import { Tooltip } from './ui/Tooltip'

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
  // Back button
  onBack?: () => void
  // Tilemap mode toggle
  isTilemapMode?: boolean
  onToggleTilemapMode?: () => void
  // Asset Library toggle
  onToggleAssetLibrary?: () => void
  // Import/Export functions (available for both modes)
  onImport?: (format: 'json' | 'png' | 'tilemap') => void
  onExport?: (format: 'json' | 'png' | 'svg' | 'tilemap' | 'godot' | 'unity') => void
  // Legacy export functions (for backward compatibility)
  onExportJSON?: () => void
  onExportPNG?: () => void
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
  onBack,
  isTilemapMode = false,
  onToggleTilemapMode,
  onToggleAssetLibrary,
  onImport,
  onExport,
  onExportJSON,
  onExportPNG,
  collabTheme = {
    primary: '#475569',
    secondary: '#374151',
    gradient: 'from-slate-600 to-gray-700',
    displayName: '',
    softBg: 'rgba(71, 85, 105, 0.3)',
    softBorder: 'rgba(71, 85, 105, 0.4)'
  },
}: PresenceBarProps) {
  const [showImportMenu, setShowImportMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const importMenuRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    try {
      await logOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
        setShowImportMenu(false)
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      className="fixed top-0 left-0 right-0 h-12 shadow-sm z-50 flex items-center justify-between px-8 relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md"
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
      <div className="relative z-10 w-full flex items-center justify-between gap-6">
      {/* Left Section: Title only */}
      <div className="flex items-center gap-3">
        {onBack && (
              <button
                type="button"
                onClick={onBack}
                className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
              collabTheme 
                ? 'hover:bg-white/20 text-white' 
                : 'hover:bg-neutral-100 text-neutral-700'
            }`}
            title="Back to dashboard"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        <div className="text-[24px] font-bold text-white">
          CollabCanvas
        </div>
      </div>

      {/* Right Section: All controls right-aligned */}
      <div className="flex items-center gap-2">
        <ZoomControls
          scale={scale}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
          onZoomFit={onZoomFit}
          collabTheme={collabTheme}
        />
        
        {/* Separator */}
        <div className="w-px h-4 bg-white/20 mx-1" />
        
        {/* Tilemap Mode Toggle */}
        {onToggleTilemapMode && (
          <button
            onClick={onToggleTilemapMode}
            className={`h-7 px-2.5 rounded font-medium text-[9px] transition-all flex items-center ${
              isTilemapMode
                ? 'bg-white/30 text-white hover:bg-white/40 shadow-sm ring-1 ring-white/20'
                : 'bg-white/15 text-white/90 hover:bg-white/25'
            }`}
            title={isTilemapMode ? 'Switch to Shape Mode' : 'Switch to Tilemap Mode'}
          >
            {isTilemapMode ? 'Shapes' : 'Tilemap'}
          </button>
        )}
        
        {/* Asset Library Toggle */}
        {onToggleAssetLibrary && (
          <button
            onClick={onToggleAssetLibrary}
            className="h-7 px-2.5 rounded font-medium text-[9px] transition-all flex items-center gap-1 bg-white/15 text-white/90 hover:bg-white/25"
            title="Open Asset Library"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Assets
          </button>
        )}
        
        {/* Import/Export Buttons */}
        {(onImport || onExport || onExportJSON) && (
          <>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <div className="flex items-center gap-1.5">
              {/* Import Dropdown */}
              {onImport && (
                <div className="relative" ref={importMenuRef}>
                  <button
                    onClick={() => setShowImportMenu(!showImportMenu)}
                    className="h-7 px-2.5 rounded font-medium text-[9px] transition-all bg-white/15 text-white hover:bg-white/25 flex items-center gap-1"
                  >
                    Import
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showImportMenu && (
                    <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-50">
                      <button
                        onClick={() => {
                          onImport('json')
                          setShowImportMenu(false)
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        JSON
                      </button>
                      <button
                        onClick={() => {
                          onImport('png')
                          setShowImportMenu(false)
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        PNG/Image
                      </button>
                      <button
                        onClick={() => {
                          onImport('tilemap')
                          setShowImportMenu(false)
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Tilemap JSON
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Export Dropdown */}
              {(onExport || onExportJSON) && (
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="h-7 px-2.5 rounded font-medium text-[9px] transition-all bg-white/15 text-white hover:bg-white/25 flex items-center gap-1"
                  >
                    Export
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showExportMenu && (
                    <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-50">
                      <button
                        onClick={() => {
                          if (onExport) onExport('json')
                          else if (onExportJSON) onExportJSON()
                          setShowExportMenu(false)
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        JSON
                      </button>
                      <button
                        onClick={() => {
                          if (onExport) onExport('png')
                          else if (onExportPNG) onExportPNG()
                          setShowExportMenu(false)
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        PNG
                      </button>
                      <button
                        onClick={() => {
                          if (onExport) onExport('svg')
                          setShowExportMenu(false)
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        SVG
                      </button>
                      {isTilemapMode && (
                        <>
                          <div className="my-1 border-t border-gray-200" />
                          <div className="px-3 py-1 text-[8px] text-gray-500 uppercase font-semibold">
                            Game Engines
                          </div>
                          <button
                            onClick={() => {
                              if (onExport) onExport('godot')
                              setShowExportMenu(false)
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Godot (.tscn)
                          </button>
                          <button
                            onClick={() => {
                              if (onExport) onExport('unity')
                              setShowExportMenu(false)
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Unity (.prefab)
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Separator before users */}
        <div className="w-px h-4 bg-white/20 mx-1" />
        
        {/* User avatars */}
        <div className="flex items-center -space-x-1.5">
          {allUsers.slice(0, 5).map((user, index) => (
            <Tooltip key={index} content={user.name + (user.isSelf ? ' (You)' : '')} side="bottom">
              <div
                className="w-7 h-7 rounded-full border border-white flex items-center justify-center text-white text-[10px] font-medium shadow-sm"
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
            <Tooltip content={`${allUsers.length - 5} more users`} side="bottom">
              <div className="w-7 h-7 rounded-full border border-white bg-white/20 flex items-center justify-center text-white text-[10px] font-medium shadow-sm">
                +{allUsers.length - 5}
              </div>
            </Tooltip>
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-4 bg-white/20 mx-1" />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="h-7 px-2.5 text-[9px] font-medium rounded transition-all bg-white/15 text-white hover:bg-white/25 flex items-center"
          title="Sign out"
        >
          Logout
        </button>
      </div>
      </div>
    </div>
  )
}

