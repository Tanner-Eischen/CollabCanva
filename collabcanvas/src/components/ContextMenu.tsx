// ContextMenu Component - Right-click menu for shapes (PR-17)

import { useEffect, useRef } from 'react'

interface ContextMenuProps {
  x: number
  y: number
  visible: boolean
  onClose: () => void
  hasSelection: boolean
  canCopy: boolean
  canPaste: boolean
  onBringToFront: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onSendToBack: () => void
  onCopy?: () => void
  onPaste?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}

/**
 * Context menu component that appears on right-click
 * Provides z-index operations and clipboard operations
 */
export function ContextMenu({
  x,
  y,
  visible,
  onClose,
  hasSelection,
  canCopy,
  canPaste,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    if (!visible) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Add slight delay to prevent immediate close from the right-click that opened it
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, onClose])

  // Close menu on Escape key
  useEffect(() => {
    if (!visible) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [visible, onClose])

  if (!visible) return null

  const handleMenuAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-300 rounded-md shadow-lg py-1 z-50 min-w-[180px]"
      style={{
        left: x,
        top: y,
      }}
    >
      {/* Z-Index Operations */}
      {hasSelection && (
        <>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
            onClick={() => handleMenuAction(onBringToFront)}
          >
            Bring to Front
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
            onClick={() => handleMenuAction(onBringForward)}
          >
            Bring Forward
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
            onClick={() => handleMenuAction(onSendBackward)}
          >
            Send Backward
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
            onClick={() => handleMenuAction(onSendToBack)}
          >
            Send to Back
          </button>
          <div className="border-t border-gray-200 my-1" />
        </>
      )}

      {/* Clipboard Operations */}
      {canCopy && onCopy && (
        <button
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
          onClick={() => handleMenuAction(onCopy)}
        >
          Copy
          <span className="float-right text-gray-400 text-xs ml-4">⌘C</span>
        </button>
      )}
      {canPaste && onPaste && (
        <button
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
          onClick={() => handleMenuAction(onPaste)}
        >
          Paste
          <span className="float-right text-gray-400 text-xs ml-4">⌘V</span>
        </button>
      )}
      {canCopy && onDuplicate && (
        <button
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
          onClick={() => handleMenuAction(onDuplicate)}
        >
          Duplicate
          <span className="float-right text-gray-400 text-xs ml-4">⌘D</span>
        </button>
      )}

      {/* Delete Operation */}
      {hasSelection && onDelete && (
        <>
          <div className="border-t border-gray-200 my-1" />
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600"
            onClick={() => handleMenuAction(onDelete)}
          >
            Delete
            <span className="float-right text-red-400 text-xs ml-4">⌫</span>
          </button>
        </>
      )}
    </div>
  )
}


