/**
 * QuickActionsPopup - Tiny popup with quick object actions
 * Appears next to selected shape for layer/object operations
 */

import { useEffect, useRef } from 'react'

interface QuickActionsPopupProps {
  screenX: number
  screenY: number
  selectedCount: number
  canGroup: boolean
  onBringToFront: () => void
  onSendToBack: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onGroup: () => void
  onUngroup: () => void
  onDuplicate: () => void
  onDelete: () => void
  onClose: () => void
}

export function QuickActionsPopup({
  screenX,
  screenY,
  selectedCount,
  canGroup,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onGroup,
  onUngroup,
  onDuplicate,
  onDelete,
  onClose,
}: QuickActionsPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div
      ref={popupRef}
      className="fixed bg-white rounded-md shadow-2xl border border-gray-300 z-50 py-0.5"
      style={{
        left: Math.min(screenX + 10, window.innerWidth - 150),
        top: Math.min(screenY - 10, window.innerHeight - 300),
      }}
    >
      {/* Layer Order */}
      <button
        onClick={() => handleAction(onBringToFront)}
        className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 flex items-center gap-1.5"
      >
        <span className="text-xs">⬆️</span>
        Bring to Front
      </button>
      <button
        onClick={() => handleAction(onBringForward)}
        className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 flex items-center gap-1.5"
      >
        <span className="text-xs">↑</span>
        Bring Forward
      </button>
      <button
        onClick={() => handleAction(onSendBackward)}
        className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 flex items-center gap-1.5"
      >
        <span className="text-xs">↓</span>
        Send Backward
      </button>
      <button
        onClick={() => handleAction(onSendToBack)}
        className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 flex items-center gap-1.5"
      >
        <span className="text-xs">⬇️</span>
        Send to Back
      </button>

      <div className="border-t border-gray-200" />

      {/* Group Operations */}
      {selectedCount >= 2 && (
        <>
          {canGroup && (
            <button
              onClick={() => handleAction(onGroup)}
              className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 flex items-center gap-1.5"
            >
              <span className="text-xs">📦</span>
              Group
            </button>
          )}
          <button
            onClick={() => handleAction(onUngroup)}
            className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 flex items-center gap-1.5"
          >
            <span className="text-xs">📂</span>
            Ungroup
          </button>
          <div className="border-t border-gray-200" />
        </>
      )}

      {/* Actions */}
      <button
        onClick={() => handleAction(onDuplicate)}
        className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 flex items-center gap-1.5"
      >
        <span className="text-xs">📋</span>
        Duplicate
      </button>
      <button
        onClick={() => handleAction(onDelete)}
        className="w-full text-left px-2 py-1 text-xs hover:bg-red-50 text-red-600 flex items-center gap-1.5"
      >
        <span className="text-xs">🗑️</span>
        Delete
      </button>
    </div>
  )
}


