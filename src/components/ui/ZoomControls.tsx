import { Tooltip } from '../ui/Tooltip'

interface ZoomControlsProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onZoomFit: () => void
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
 * ZoomControls - Professional zoom controls for canvas (PR-20)
 * Shows current zoom percentage with +/- buttons and fit-to-screen
 */
export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  collabTheme,
}: ZoomControlsProps) {
  const percentage = Math.round(scale * 100)

  return (
    <div className={`flex items-center gap-0.5 rounded px-1 h-7 ${
      collabTheme ? 'bg-white/60' : 'bg-neutral-100'
    }`}>
      {/* Zoom Out */}
      <Tooltip content="Zoom out" side="bottom">
        <button
          onClick={onZoomOut}
          className={`w-6 h-5 flex items-center justify-center rounded text-xs transition-colors ${
            collabTheme ? 'hover:bg-white/80 text-gray-900' : 'hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          <span>−</span>
        </button>
      </Tooltip>

      {/* Percentage Display - click to reset to 100% */}
      <Tooltip content="Reset zoom to 100%" side="bottom">
        <button
          onClick={onZoomReset}
          className={`min-w-[40px] h-5 px-1.5 flex items-center justify-center rounded transition-colors ${
            collabTheme ? 'hover:bg-white/80' : 'hover:bg-neutral-200'
          }`}
        >
          <span className={`text-[9px] font-medium ${
            collabTheme ? 'text-gray-900' : 'text-neutral-700'
          }`}>
            {percentage}%
          </span>
        </button>
      </Tooltip>

      {/* Zoom In */}
      <Tooltip content="Zoom in" side="bottom">
        <button
          onClick={onZoomIn}
          className={`w-6 h-5 flex items-center justify-center rounded text-xs transition-colors ${
            collabTheme ? 'hover:bg-white/80 text-gray-900' : 'hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          <span>+</span>
        </button>
      </Tooltip>

      {/* Divider */}
      <div className={`w-px h-3 mx-0.5 ${
        collabTheme ? 'bg-gray-400' : 'bg-neutral-300'
      }`} />

      {/* Fit to Screen */}
      <Tooltip content="Fit to screen" side="bottom">
        <button
          onClick={onZoomFit}
          className={`w-6 h-5 flex items-center justify-center rounded text-xs transition-colors ${
            collabTheme ? 'hover:bg-white/80 text-gray-900' : 'hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          <span className="text-xs">⊡</span>
        </button>
      </Tooltip>
    </div>
  )
}


