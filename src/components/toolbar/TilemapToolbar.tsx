import type { TileMode } from '../../types/tilemap'
import type { TileLayerMeta } from '../../types/tileLayer'
import { ToolButton } from './ToolButton'
import { Tooltip } from '../ui/Tooltip'

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
  // Layer management
  layers?: TileLayerMeta[]
  activeLayerId?: string | null
  onLayerChange?: (layerId: string) => void
  onToggleLayerPanel?: () => void
}

/**
 * TilemapToolbar - Professional Figma-style vertical toolbar for tilemap mode
 * Uses the same ToolButton components as the main canvas toolbar
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
  layers = [],
  activeLayerId = null,
  onLayerChange,
  onToggleLayerPanel,
}: TilemapToolbarProps) {
  const tools: Array<{
    mode: TileMode
    icon?: string
    iconPath?: string
    label: string
    shortcut?: string
  }> = [
    { mode: 'stamp', iconPath: '/assets/paint-brush-32.png', icon: '🖌', label: 'Paint', shortcut: 'B' },
    { mode: 'erase', iconPath: '/assets/eraser-32.png', icon: '🧹', label: 'Erase', shortcut: 'E' },
    { mode: 'fill', iconPath: '/assets/paint-bucket-32.png', icon: '🪣', label: 'Fill', shortcut: 'F' },
    { mode: 'pick', iconPath: '/assets/eyedropper-32.png', icon: '💧', label: 'Eyedropper', shortcut: 'I' },
  ]

  return (
    <div 
      className="w-12 h-[calc(100%-16px)] my-2 ml-2 rounded-lg shadow-lg flex flex-col items-center py-3 gap-1 relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md"
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
        {/* Tilemap Mode Tools */}
        {tools.map((tool) => (
          <ToolButton
            key={tool.mode}
            icon={tool.icon}
            iconPath={tool.iconPath}
            label={tool.label}
            shortcut={tool.shortcut}
            active={mode === tool.mode}
            onClick={() => onModeChange(tool.mode)}
            themed={true}
          />
        ))}

        {/* Separator */}
        <div className="w-9 h-px my-1 bg-white/20" />

        {/* Brush Size Control */}
        <div className="flex flex-col items-center gap-1 w-full px-1.5">
          <div className="text-white/70 text-[8px] text-center font-mono">{brushSize}×{brushSize}</div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={brushSize}
            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
            className="w-full cursor-pointer brush-slider"
            title={`Brush Size: ${brushSize}×${brushSize}`}
            style={{
              height: '4px',
              background: `linear-gradient(to right, white 0%, white ${((brushSize - 1) / 4) * 100}%, rgba(255,255,255,0.2) ${((brushSize - 1) / 4) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>

        {/* Separator */}
        <div className="w-9 h-px my-1 bg-white/20" />

        {/* Active Layer Selector */}
        {layers.length > 0 && onLayerChange && (
          <div className="w-full px-1.5 mb-2">
            <Tooltip content="Active Layer" side="right">
              <select
                value={activeLayerId || ''}
                onChange={(e) => onLayerChange(e.target.value)}
                className="
                  w-full px-2 py-1 text-[10px] rounded
                  bg-white/10 text-white border border-white/20
                  hover:bg-white/20 transition-all cursor-pointer
                  focus:outline-none focus:ring-1 focus:ring-blue-400
                "
                title="Select Active Layer"
              >
                {layers
                  .filter(l => l.visible && !l.locked)
                  .sort((a, b) => b.z - a.z) // Sort by z descending (top to bottom)
                  .map(layer => (
                    <option key={layer.id} value={layer.id} className="bg-slate-800">
                      {layer.name} (z:{layer.z})
                    </option>
                  ))}
              </select>
            </Tooltip>
          </div>
        )}

        {/* Layer Panel Toggle */}
        {onToggleLayerPanel && (
          <ToolButton
            icon="📋"
            label="Layer Panel"
            shortcut="L"
            onClick={onToggleLayerPanel}
            themed={true}
          />
        )}

        {/* Separator */}
        <div className="w-9 h-px my-1 bg-white/20" />

        {/* Grid Toggle */}
        <ToolButton
          icon="#"
          label="Toggle Grid"
          shortcut="G"
          active={showGrid}
          onClick={onToggleGrid}
          themed={true}
        />

        {/* Auto-Tiling Toggle */}
        <ToolButton
          icon="⚡"
          label="Auto-Tiling"
          shortcut="A"
          active={autoTilingEnabled}
          onClick={onToggleAutoTiling}
          themed={true}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Undo/Redo */}
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
