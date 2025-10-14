import type { ToolType } from '../types/canvas'

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
 * Toolbar - Left vertical toolbar with shape creation tools and delete button
 * Fixed position on left side, 60-80px width
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
    isSeparator?: boolean
  }> = [
    // Basic Shapes
    { type: 'rectangle', icon: '▭', label: 'Rectangle' },
    { type: 'circle', icon: '●', label: 'Circle' },
    { type: 'roundRect', icon: '▢', label: 'Rounded Rectangle' },
    // Advanced Shapes (PR-16)
    { type: 'polygon', icon: '⬡', label: 'Polygon' },
    { type: 'star', icon: '★', label: 'Star' },
    // Line Tool (PR-16)
    { type: 'line', icon: '/', label: 'Line' },
    // Text Tool
    { type: 'text', icon: 'T', label: 'Text' },
  ]

  return (
    <div className="fixed left-0 top-14 bottom-0 w-20 bg-gray-800 shadow-lg z-40 flex flex-col items-center py-4 space-y-2">
      {/* Shape Tools */}
      {tools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => onToolSelect(tool.type)}
          className={`
            w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold
            transition-all duration-200
            ${
              selectedTool === tool.type
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }
          `}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}

      {/* Spacer - pushes action buttons to the bottom */}
      <div className="flex-1" />

      {/* Undo Button (PR-14) */}
      {onUndo && (
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`
            w-14 h-14 rounded-lg flex items-center justify-center text-xl
            transition-all duration-200
            ${
              canUndo
                ? 'bg-gray-700 text-white hover:bg-gray-600 shadow-lg'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
            }
          `}
          title={canUndo ? 'Undo (Ctrl+Z)' : 'Nothing to undo'}
        >
          ↶
        </button>
      )}

      {/* Redo Button (PR-14) */}
      {onRedo && (
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`
            w-14 h-14 rounded-lg flex items-center justify-center text-xl
            transition-all duration-200
            ${
              canRedo
                ? 'bg-gray-700 text-white hover:bg-gray-600 shadow-lg'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
            }
          `}
          title={canRedo ? 'Redo (Ctrl+Shift+Z)' : 'Nothing to redo'}
        >
          ↷
        </button>
      )}

      {/* Delete Button */}
      <button
        onClick={onDelete}
        disabled={!hasSelection}
        className={`
          w-14 h-14 rounded-lg flex items-center justify-center text-xl
          transition-all duration-200
          ${
            hasSelection
              ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
          }
        `}
        title={hasSelection ? 'Delete (Del)' : 'No selection'}
      >
        🗑
      </button>
    </div>
  )
}

