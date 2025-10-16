/**
 * ShapeStatusBar Component
 * Bottom status bar showing shape canvas information
 * Displays shape count, selection info, zoom, and connection status
 */

interface ShapeStatusBarProps {
  shapeCount: number
  selectedCount: number
  zoom: number
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
}

/**
 * Status bar component for shape editor
 * Shows relevant information at the bottom of the canvas
 */
export default function ShapeStatusBar({
  shapeCount,
  selectedCount,
  zoom,
  connectionStatus,
}: ShapeStatusBarProps) {
  const connectionIndicators = {
    connected: { icon: '🟢', text: 'Connected', color: 'text-green-400' },
    disconnected: { icon: '🔴', text: 'Disconnected', color: 'text-red-400' },
    reconnecting: { icon: '🟡', text: 'Reconnecting...', color: 'text-yellow-400' },
  }
  
  const indicator = connectionIndicators[connectionStatus]
  
  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 z-50 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md border-t border-white/10 flex items-center justify-end px-6 gap-6 text-xs text-white/90 font-mono shadow-lg">
      {/* Shape Count */}
      <div className="flex items-center gap-2">
        <span className="text-white/50">Shapes:</span>
        <span className="text-white/90 font-semibold">{shapeCount}</span>
      </div>
      
      {/* Separator */}
      <div className="h-4 w-px bg-white/20" />
      
      {/* Selection Info */}
      <div className="flex items-center gap-2">
        <span className="text-white/50">Selected:</span>
        <span className="text-white/90 font-semibold">{selectedCount}</span>
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

