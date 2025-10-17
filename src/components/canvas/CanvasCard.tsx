/**
 * CanvasCard Component (PR-22)
 * Individual canvas card in dashboard with thumbnail, name, and actions
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CanvasMetadata } from '../../services/canvas/canvasManager'
import { Tooltip } from '../ui/Tooltip'

interface CanvasCardProps {
  canvas: CanvasMetadata
  onDelete: (canvasId: string) => void
  onDuplicate: (canvasId: string) => void
  onRename: (canvasId: string, newName: string) => void
}

/**
 * Format relative time (e.g., "2 mins ago")
 */
function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  
  return new Date(timestamp).toLocaleDateString()
}

/**
 * Canvas card component for dashboard grid
 */
export function CanvasCard({ canvas, onDelete, onDuplicate, onRename }: CanvasCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(canvas.name)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const handleCardClick = () => {
    if (!isEditing) {
      navigate(`/canvas/${canvas.id}`)
    }
  }

  const handleNameDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditedName(canvas.name)
  }

  const handleNameSubmit = () => {
    if (editedName.trim() && editedName !== canvas.name) {
      onRename(canvas.id, editedName.trim())
    }
    setIsEditing(false)
  }

  const handleNameCancel = () => {
    setEditedName(canvas.name)
    setIsEditing(false)
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete "${canvas.name}"? This cannot be undone.`)) {
      onDelete(canvas.id)
    }
    setShowMenu(false)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDuplicate(canvas.id)
    setShowMenu(false)
  }

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    setIsEditing(true)
  }

  return (
    <div
      className="group bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 hover:shadow-medium transition-all duration-150 cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <div className="relative w-full h-[180px] bg-neutral-100 overflow-hidden">
        {canvas.thumbnail ? (
          <img
            src={canvas.thumbnail}
            alt={canvas.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-neutral-400 text-4xl">📄</span>
          </div>
        )}

        {/* Menu button (shows on hover) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip content="More options" side="left">
            <button
              onClick={handleMenuClick}
              className="w-8 h-8 bg-white rounded-lg shadow-medium flex items-center justify-center hover:bg-neutral-50 transition-colors"
            >
              <span className="text-neutral-600">•••</span>
            </button>
          </Tooltip>

          {/* Dropdown menu */}
          {showMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 top-10 bg-white border border-neutral-200 rounded-lg shadow-hard py-1 z-10 min-w-[140px]"
            >
              <button
                onClick={handleRename}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
              >
                Rename
              </button>
              <button
                onClick={handleDuplicate}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
              >
                Duplicate
              </button>
              <div className="border-t border-neutral-200 my-1" />
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas info */}
      <div className="p-4">
        {isEditing ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSubmit()
              if (e.key === 'Escape') handleNameCancel()
            }}
            onBlur={handleNameSubmit}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="w-full text-sm font-semibold text-neutral-900 bg-neutral-100 px-2 py-1 rounded border-2 border-primary-500 focus:outline-none"
          />
        ) : (
          <h3
            onDoubleClick={handleNameDoubleClick}
            className="text-sm font-semibold text-neutral-900 truncate mb-1"
          >
            {canvas.name}
          </h3>
        )}
        <p className="text-xs text-neutral-500">
          Edited {getRelativeTime(canvas.updatedAt)}
        </p>
      </div>
    </div>
  )
}


