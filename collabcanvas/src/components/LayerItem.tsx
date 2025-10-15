/**
 * LayerItem Component (PR-19)
 * Individual layer row in the layer panel with visibility toggle, lock, and name
 */

import { useState } from 'react'
import type { Layer } from '../types/layer'

interface LayerItemProps {
  layer: Layer
  isSelected: boolean
  level: number
  onSelect: (id: string) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onRename: (id: string, newName: string) => void
  onDelete?: (id: string) => void
  children?: React.ReactNode
  isExpanded?: boolean
  onToggleExpand?: () => void
  themed?: boolean
}

/**
 * LayerItem component for displaying a single layer in the layer panel
 * Supports nesting for groups, visibility/lock toggles, and inline renaming
 */
export function LayerItem({
  layer,
  isSelected,
  level,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onDelete,
  children,
  isExpanded = true,
  onToggleExpand,
  themed = false,
}: LayerItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(layer.name)

  const handleDoubleClick = () => {
    setIsEditing(true)
    setEditName(layer.name)
  }

  const handleRename = () => {
    if (editName.trim() && editName !== layer.name) {
      onRename(layer.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditName(layer.name)
    }
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'rectangle':
        return '▭'
      case 'circle':
        return '○'
      case 'text':
        return 'T'
      case 'line':
        return '—'
      case 'path':
        return '✎' // Pencil/pen freehand path
      case 'polygon':
        return '⬟'
      case 'star':
        return '★'
      case 'roundRect':
        return '▢'
      case 'group':
        return '◫'
      default:
        return '□'
    }
  }

  return (
    <div className={themed ? 'px-2 py-0.5' : ''}>
      <div
        className={`flex items-center px-2 py-1.5 cursor-pointer rounded-md transition-colors ${
          themed 
            ? isSelected 
              ? 'bg-white/50 border-l-4 border-white shadow-md' 
              : 'bg-white/15 hover:bg-white/25'
            : isSelected 
              ? 'bg-blue-100 border-l-4 border-blue-600 shadow-sm' 
              : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onSelect(layer.id)}
      >
        {/* Expand/collapse for groups */}
        {layer.type === 'group' && onToggleExpand && (
          <button
            className={`mr-1 rounded p-0.5 ${
              themed ? 'hover:bg-white/30 text-white' : 'hover:bg-gray-200'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
          >
            {isExpanded ? (
              <span className="text-xs">▼</span>
            ) : (
              <span className="text-xs">▶</span>
            )}
          </button>
        )}

        {/* Icon for shape type */}
        <span className={`mr-2 text-xs font-mono ${
          themed ? 'text-white/80' : 'text-gray-600'
        }`}>
          {getIconForType(layer.type)}
        </span>

        {/* Layer name - editable on double-click */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleRename}
            className={`flex-1 px-1 py-0 text-sm rounded focus:outline-none ${
              themed 
                ? 'bg-white/80 text-gray-900 border border-white/60'
                : 'border border-blue-500'
            }`}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`flex-1 text-sm ${
              themed
                ? layer.visible ? 'text-white' : 'text-white/40'
                : layer.visible ? 'text-gray-900' : 'text-gray-400'
            }`}
            onDoubleClick={handleDoubleClick}
          >
            {layer.name}
          </span>
        )}

        {/* Buttons container - fixed width for alignment */}
        <div className="flex items-center gap-0 ml-auto">
          {/* Lock toggle */}
          <button
            className={`w-7 h-7 flex items-center justify-center rounded ${
              themed ? 'hover:bg-white/30' : 'hover:bg-gray-200'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleLock(layer.id)
            }}
          >
            {layer.locked ? (
              <span className="text-sm text-red-500">🔒</span>
            ) : (
              <span className={`text-sm ${themed ? 'text-white/60' : 'text-gray-400'}`}>🔓</span>
            )}
          </button>

          {/* Visibility toggle */}
          <button
            className={`w-7 h-7 flex items-center justify-center rounded ${
              themed ? 'hover:bg-white/30' : 'hover:bg-gray-200'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleVisibility(layer.id)
            }}
          >
            {layer.visible ? (
              <span className={`text-sm ${themed ? 'text-white/80' : 'text-gray-600'}`}>👁️</span>
            ) : (
              <span className={`text-sm ${themed ? 'text-white/40' : 'text-gray-400'}`}>👁️‍🗨️</span>
            )}
          </button>

          {/* Delete button */}
          {onDelete && (
            <button
              className={`w-7 h-7 flex items-center justify-center rounded ${
                themed ? 'hover:bg-red-500/30 text-red-400' : 'hover:bg-red-100 text-red-600'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(layer.id)
              }}
              title="Delete layer"
            >
              <span className="text-sm">🗑️</span>
            </button>
          )}
        </div>
      </div>

      {/* Children (nested layers for groups) */}
      {layer.type === 'group' && isExpanded && children && (
        <div>{children}</div>
      )}
    </div>
  )
}

