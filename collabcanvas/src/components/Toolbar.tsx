import type { ToolType } from '../types/canvas'
import { ToolButton } from './ToolButton'

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
    label: string
    shortcut?: string
  }> = [
    // Selection Tool
    { type: 'select', icon: '⌖', label: 'Select', shortcut: 'V' },
    
    // Basic Shapes
    { type: 'rectangle', icon: '▭', label: 'Rectangle', shortcut: 'R' },
    { type: 'circle', icon: '●', label: 'Circle', shortcut: 'O' },
    { type: 'roundRect', icon: '▢', label: 'Rounded Rectangle' },
    
    // Advanced Shapes
    { type: 'polygon', icon: '⬡', label: 'Polygon' },
    { type: 'star', icon: '★', label: 'Star' },
    { type: 'line', icon: '/', label: 'Line', shortcut: 'L' },
    
    // Text Tool
    { type: 'text', icon: 'T', label: 'Text', shortcut: 'T' },
  ]

  return (
    <div className="fixed left-0 top-header bottom-0 w-toolbar bg-white border-r border-neutral-200 shadow-soft z-40 flex flex-col items-center py-3 gap-1">
      {/* Tool Buttons */}
      {tools.map((tool, index) => (
        <div key={tool.type}>
          <ToolButton
            icon={tool.icon}
            label={tool.label}
            shortcut={tool.shortcut}
            active={selectedTool === tool.type}
            onClick={() => onToolSelect(tool.type)}
          />
          
          {/* Separator after select tool and after shapes */}
          {(index === 0 || index === 6) && (
            <div className="w-9 h-px bg-neutral-200 my-1" />
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
        />
      )}

      {onRedo && (
        <ToolButton
          icon="↷"
          label="Redo"
          shortcut="Ctrl+Shift+Z"
          disabled={!canRedo}
          onClick={onRedo}
        />
      )}

      {/* Separator before delete */}
      <div className="w-9 h-px bg-neutral-200 my-1" />

      {/* Delete Button */}
      <ToolButton
        icon="🗑"
        label="Delete"
        shortcut="Del"
        disabled={!hasSelection}
        onClick={onDelete}
      />
    </div>
  )
}

