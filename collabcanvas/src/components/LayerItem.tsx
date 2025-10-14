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
  children?: React.ReactNode
  isExpanded?: boolean
  onToggleExpand?: () => void
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
  children,
  isExpanded = true,
  onToggleExpand,
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
    <div>
      <div
        className={`flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer ${
          isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onSelect(layer.id)}
      >
        {/* Expand/collapse for groups */}
        {layer.type === 'group' && onToggleExpand && (
          <button
            className="mr-1 hover:bg-gray-200 rounded p-0.5"
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
        <span className="mr-2 text-gray-600 text-xs font-mono">
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
            className="flex-1 px-1 py-0 text-sm border border-blue-500 rounded focus:outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`flex-1 text-sm ${
              layer.visible ? 'text-gray-900' : 'text-gray-400'
            }`}
            onDoubleClick={handleDoubleClick}
          >
            {layer.name}
          </span>
        )}

        {/* Lock toggle */}
        <button
          className="ml-2 hover:bg-gray-200 rounded p-1"
          onClick={(e) => {
            e.stopPropagation()
            onToggleLock(layer.id)
          }}
        >
          {layer.locked ? (
            <span className="text-sm text-red-500">🔒</span>
          ) : (
            <span className="text-sm text-gray-400">🔓</span>
          )}
        </button>

        {/* Visibility toggle */}
        <button
          className="ml-1 hover:bg-gray-200 rounded p-1"
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility(layer.id)
          }}
        >
          {layer.visible ? (
            <span className="text-sm text-gray-600">👁️</span>
          ) : (
            <span className="text-sm text-gray-400">👁️‍🗨️</span>
          )}
        </button>
      </div>

      {/* Children (nested layers for groups) */}
      {layer.type === 'group' && isExpanded && children && (
        <div>{children}</div>
      )}
    </div>
  )
}

