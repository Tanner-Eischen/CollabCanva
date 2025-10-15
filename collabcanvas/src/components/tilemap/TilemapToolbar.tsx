import { ToolButton } from '../ToolButton'
import type { TileMode } from '../../types/tilemap'

interface TilemapToolbarProps {
  mode: TileMode
  onModeChange: (mode: TileMode) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  autoTilingEnabled: boolean
  onToggleAutoTiling: () => void
  showGrid: boolean
  onToggleGrid: () => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
}

/**
 * TilemapToolbar - Matches the main canvas Toolbar styling exactly
 * 48px width, fixed position, with tooltips
 */
export default function TilemapToolbar({
  mode,
  onModeChange,
  brushSize,
  onBrushSizeChange,
  autoTilingEnabled,
  onToggleAutoTiling,
  showGrid,
  onToggleGrid,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: TilemapToolbarProps) {
  const modes: Array<{
    mode: TileMode
    icon: string
    iconPath?: string
    label: string
    shortcut: string
  }> = [
    { mode: 'stamp', iconPath: '/assets/paint-brush-32.ico', icon: '✎', label: 'Paint', shortcut: 'B' },
    { mode: 'erase', iconPath: '/assets/eraser-32.ico', icon: '⌫', label: 'Erase', shortcut: 'E' },
    { mode: 'fill', icon: '▰', label: 'Fill', shortcut: 'F' },
    { mode: 'pick', iconPath: '/assets/eyedropper-32.ico', icon: '▼', label: 'Eyedropper', shortcut: 'I' },
  ]

  return (
    <div 
      className="w-12 h-[calc(100%-16px)] my-2 ml-2 rounded-lg shadow-lg flex flex-col items-center py-3 gap-1 relative overflow-hidden"
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
      
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center gap-1">
        {/* Mode Buttons */}
        {modes.map((modeOption, index) => (
          <div key={modeOption.mode}>
            <ToolButton
              icon={modeOption.icon}
              iconPath={modeOption.iconPath}
              label={modeOption.label}
              shortcut={modeOption.shortcut}
              active={mode === modeOption.mode}
              onClick={() => onModeChange(modeOption.mode)}
              themed={true}
            />
            
            {/* Separator after eyedropper */}
            {index === 3 && (
              <div className="w-9 h-px my-1 bg-white/20" />
            )}
          </div>
        ))}

        {/* Grid Toggle */}
        <ToolButton
          icon="#"
          label="Grid"
          shortcut="G"
          active={showGrid}
          onClick={onToggleGrid}
          themed={true}
        />

        {/* Auto-Tiling Toggle */}
        <ToolButton
          icon="⚡"
          label="Auto-Tile"
          shortcut="A"
          active={autoTilingEnabled}
          onClick={onToggleAutoTiling}
          themed={true}
        />

        {/* Spacer - pushes action buttons to the bottom */}
        <div className="flex-1" />

        {/* Action Buttons */}
        {onUndo && (
          <ToolButton
            icon="↶"
            label="Undo"
            shortcut="Ctrl+Z"
            disabled={!canUndo}
            onClick={onUndo}
            themed={true}
          />
        )}

        {onRedo && (
          <ToolButton
            icon="↷"
            label="Redo"
            shortcut="Ctrl+Shift+Z"
            disabled={!canRedo}
            onClick={onRedo}
            themed={true}
          />
        )}
      </div>
    </div>
  )
}

