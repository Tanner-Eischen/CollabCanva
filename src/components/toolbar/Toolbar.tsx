import type { ToolType } from '../../types/canvas'
import { ToolButton } from '../toolbar/ToolButton'

interface ToolbarProps {
  selectedTool: ToolType
  onToolSelect: (tool: ToolType) => void
  hasSelection: boolean
  onDelete: () => void
  // PR-14: Undo/Redo
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
}

/**
 * Toolbar - Professional Figma-style left vertical toolbar (PR-20)
 * 48px width, fixed position, with tooltips
 */
export default function Toolbar({
  selectedTool,
  onToolSelect,
  hasSelection,
  onDelete,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: ToolbarProps) {
  const tools: Array<{
    type: ToolType
    icon: string
    iconPath?: string
    label: string
    shortcut?: string
  }> = [
    // Selection & Navigation Tools
    { type: 'select', icon: '➤', label: 'Select', shortcut: 'V' },
    { type: 'hand', icon: '✥', label: 'Hand', shortcut: 'H' },
    
    // Basic Shapes
    { type: 'rectangle', icon: '▭', label: 'Rectangle', shortcut: 'R' },
    { type: 'circle', icon: '●', label: 'Circle', shortcut: 'O' },
    { type: 'roundRect', icon: '▢', label: 'Rounded Rectangle' },
    
    // Advanced Shapes
    { type: 'polygon', icon: '⬡', label: 'Polygon' },
    { type: 'star', icon: '★', label: 'Star' },
    { type: 'line', icon: '/', label: 'Line', shortcut: 'L' },
    
    // Drawing Tools
    { type: 'pencil', iconPath: '/assets/paint-brush-32.png', icon: '✎', label: 'Pencil', shortcut: 'P' },
    { type: 'pen', icon: '✒', label: 'Pen', shortcut: 'N' },
    
    // Text Tool
    { type: 'text', icon: 'T', label: 'Text', shortcut: 'T' },
    
    // Animation Tool (PR-31)
    { type: 'animation', icon: '🎬', label: 'Animation', shortcut: 'A' },
  ]

  return (
    <div 
      className="w-12 h-[calc(100%-48
      px)] my-2 ml-2 rounded-lg shadow-lg flex flex-col items-center relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md"
    >
      {/* Dot pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      ></div>
      
      {/* Scrollable Content */}
      <div className="relative z-10 w-full flex flex-col items-center gap-1 py-3 overflow-y-auto overflow-x-hidden toolbar-scrollable">
      {/* Tool Buttons */}
      {tools.map((tool, index) => (
        <div key={tool.type}>
          <ToolButton
            icon={tool.icon}
            iconPath={tool.iconPath}
            label={tool.label}
            shortcut={tool.shortcut}
            active={selectedTool === tool.type}
            onClick={() => onToolSelect(tool.type)}
            themed={true}
          />
          
          {/* Separators between tool groups */}
          {(index === 1 || index === 7 || index === 9 || index === 11) && (
            <div className="w-9 h-px my-1 bg-white/20" />
          )}
        </div>
      ))}

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

      {/* Separator before delete */}
      <div className="w-9 h-px my-1 bg-white/20" />

      {/* Delete Button */}
      <ToolButton
        icon="🗑"
        label="Delete"
        shortcut="Del"
        disabled={!hasSelection}
        onClick={onDelete}
        themed={true}
      />
      </div>
    </div>
  )
}

