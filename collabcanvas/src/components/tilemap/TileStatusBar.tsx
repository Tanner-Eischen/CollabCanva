/**
 * TileStatusBar Component
 * Bottom status bar showing tilemap information
 * Displays cursor position, tile count, mode, size, zoom, and connection status
 */

import type { TileMode, ConnectionStatus } from '../../types/tilemap'

interface TileStatusBarProps {
  cursorPosition?: { x: number; y: number }
  tileCount: number
  mode: TileMode
  tileSize: number
  zoom: number
  connectionStatus: ConnectionStatus
}

/**
 * Status bar component for tilemap editor
 * Shows relevant information at the bottom of the canvas
 */
export default function TileStatusBar({
  cursorPosition,
  tileCount,
  mode,
  tileSize,
  zoom,
  connectionStatus,
}: TileStatusBarProps) {
  const connectionIndicators = {
    connected: { icon: '🟢', text: 'Connected', color: 'text-green-400' },
    disconnected: { icon: '🔴', text: 'Disconnected', color: 'text-red-400' },
    reconnecting: { icon: '🟡', text: 'Reconnecting...', color: 'text-yellow-400' },
  }
  
  const modeIcons: Record<TileMode, string> = {
    stamp: '🖌️',
    erase: '🧽',
    fill: '🪣',
    pick: '💧',
  }
  
  const indicator = connectionIndicators[connectionStatus]
  
  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 z-50 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md border-t border-white/10 flex items-center justify-end px-6 gap-6 text-xs text-white/90 font-mono shadow-lg">
      {/* Cursor Position */}
      {cursorPosition && (
        <div className="flex items-center gap-2">
          <span className="text-white/50">Tile:</span>
          <span className="text-white/90 font-semibold">
            X: {cursorPosition.x}, Y: {cursorPosition.y}
          </span>
        </div>
      )}
      
      {/* Separator */}
      {cursorPosition && <div className="h-4 w-px bg-white/20" />}
      
      {/* Tile Count */}
      <div className="flex items-center gap-2">
        <span className="text-white/50">Tiles:</span>
        <span className="text-white/90 font-semibold">{tileCount}</span>
      </div>
      
      {/* Separator */}
      <div className="h-4 w-px bg-white/20" />
      
      {/* Current Mode */}
      <div className="flex items-center gap-2">
        <span className="text-white/50">Mode:</span>
        <span className="text-white/90 font-semibold flex items-center gap-1">
          <span>{modeIcons[mode]}</span>
          <span className="capitalize">{mode}</span>
        </span>
      </div>
      
      {/* Separator */}
      <div className="h-4 w-px bg-white/20" />
      
      {/* Tile Size */}
      <div className="flex items-center gap-2">
        <span className="text-white/50">Tile Size:</span>
        <span className="text-white/90 font-semibold">{tileSize}×{tileSize}px</span>
      </div>
      
      {/* Separator */}
      <div className="h-4 w-px bg-white/20" />
      
      {/* Zoom Level */}
      <div className="flex items-center gap-2">
        <span className="text-white/50">Zoom:</span>
        <span className="text-white/90 font-semibold">{Math.round(zoom * 100)}%</span>
      </div>
      
      {/* Separator */}
      <div className="h-4 w-px bg-white/20" />
      
      {/* Connection Status */}
      <div className={`flex items-center gap-2 ${indicator.color}`}>
        <span>{indicator.icon}</span>
        <span className="font-semibold">{indicator.text}</span>
      </div>
    </div>
  )
}

