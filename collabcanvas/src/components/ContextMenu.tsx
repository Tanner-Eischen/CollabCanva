// ContextMenu Component - Right-click menu for shapes (PR-17, PR-18)

import { useEffect, useRef, useState } from 'react'
import type { AlignmentType } from '../services/alignment'

interface ContextMenuProps {
  x: number
  y: number
  visible: boolean
  onClose: () => void
  hasSelection: boolean
  canCopy: boolean
  canPaste: boolean
  selectedCount: number
  onBringToFront: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onSendToBack: () => void
  onCopy?: () => void
  onPaste?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  // PR-18: Alignment operations
  onAlign?: (type: AlignmentType) => void
  onDistributeHorizontally?: () => void
  onDistributeVertically?: () => void
  onCenterInCanvas?: () => void
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
  selectedCount,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onAlign,
  onDistributeHorizontally,
  onDistributeVertically,
  onCenterInCanvas,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [showAlignSubmenu, setShowAlignSubmenu] = useState(false)
  const [showDistributeSubmenu, setShowDistributeSubmenu] = useState(false)

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

  const canAlign = selectedCount >= 2
  const canDistribute = selectedCount >= 3

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-neutral-200 rounded-lg shadow-hard py-1 z-50 min-w-[192px]"
      style={{
        left: x,
        top: y,
      }}
    >
      {/* Alignment Operations (PR-18) */}
      {canAlign && onAlign && (
        <>
          <div className="relative">
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700 flex items-center justify-between"
              onMouseEnter={() => setShowAlignSubmenu(true)}
              onMouseLeave={() => setShowAlignSubmenu(false)}
            >
              <span>Align</span>
              <span className="text-neutral-400">›</span>
            </button>
            {showAlignSubmenu && (
              <div
                className="absolute left-full top-0 bg-white border border-neutral-200 rounded-lg shadow-hard py-1 ml-1 min-w-[140px]"
                onMouseEnter={() => setShowAlignSubmenu(true)}
                onMouseLeave={() => setShowAlignSubmenu(false)}
              >
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
                  onClick={() => handleMenuAction(() => onAlign('left'))}
                >
                  Left
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
                  onClick={() => handleMenuAction(() => onAlign('center'))}
                >
                  Center
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
                  onClick={() => handleMenuAction(() => onAlign('right'))}
                >
                  Right
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
                  onClick={() => handleMenuAction(() => onAlign('top'))}
                >
                  Top
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
                  onClick={() => handleMenuAction(() => onAlign('middle'))}
                >
                  Middle
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
                  onClick={() => handleMenuAction(() => onAlign('bottom'))}
                >
                  Bottom
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Distribution Operations (PR-18) */}
      {canDistribute && onDistributeHorizontally && onDistributeVertically && (
        <div className="relative">
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700 flex items-center justify-between"
            onMouseEnter={() => setShowDistributeSubmenu(true)}
            onMouseLeave={() => setShowDistributeSubmenu(false)}
          >
            <span>Distribute</span>
            <span className="text-neutral-400">›</span>
          </button>
          {showDistributeSubmenu && (
            <div
              className="absolute left-full top-0 bg-white border border-neutral-200 rounded-lg shadow-hard py-1 ml-1 min-w-[140px]"
              onMouseEnter={() => setShowDistributeSubmenu(true)}
              onMouseLeave={() => setShowDistributeSubmenu(false)}
            >
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
                onClick={() => handleMenuAction(onDistributeHorizontally)}
              >
                Horizontally
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
                onClick={() => handleMenuAction(onDistributeVertically)}
              >
                Vertically
              </button>
            </div>
          )}
        </div>
      )}

      {/* Center in Canvas (PR-18) */}
      {hasSelection && onCenterInCanvas && (
        <button
          className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
          onClick={() => handleMenuAction(onCenterInCanvas)}
        >
          Center in Canvas
        </button>
      )}

      {/* Divider */}
      {(canAlign || canDistribute || (hasSelection && onCenterInCanvas)) && (
        <div className="border-t border-neutral-200 my-1" />
      )}

      {/* Z-Index Operations */}
      {hasSelection && (
        <>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
            onClick={() => handleMenuAction(onBringToFront)}
          >
            Bring to Front
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
            onClick={() => handleMenuAction(onBringForward)}
          >
            Bring Forward
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
            onClick={() => handleMenuAction(onSendBackward)}
          >
            Send Backward
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
            onClick={() => handleMenuAction(onSendToBack)}
          >
            Send to Back
          </button>
          <div className="border-t border-neutral-200 my-1" />
        </>
      )}

      {/* Clipboard Operations */}
      {canCopy && onCopy && (
        <button
          className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
          onClick={() => handleMenuAction(onCopy)}
        >
          Copy
          <span className="float-right text-neutral-400 text-xs ml-4">⌘C</span>
        </button>
      )}
      {canPaste && onPaste && (
        <button
          className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
          onClick={() => handleMenuAction(onPaste)}
        >
          Paste
          <span className="float-right text-neutral-400 text-xs ml-4">⌘V</span>
        </button>
      )}
      {canCopy && onDuplicate && (
        <button
          className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 text-neutral-700"
          onClick={() => handleMenuAction(onDuplicate)}
        >
          Duplicate
          <span className="float-right text-neutral-400 text-xs ml-4">⌘D</span>
        </button>
      )}

      {/* Delete Operation */}
      {hasSelection && onDelete && (
        <>
          <div className="border-t border-neutral-200 my-1" />
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


