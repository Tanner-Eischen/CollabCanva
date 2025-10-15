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
      className="fixed bg-white border border-gray-300 rounded-md py-0.5 z-[9999]"
      style={{
        left: x,
        top: y,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Alignment Operations (PR-18) */}
      {canAlign && onAlign && (
        <>
          <div className="relative">
            <button
              className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 flex items-center justify-between gap-2"
              onMouseEnter={() => setShowAlignSubmenu(true)}
              onMouseLeave={() => setShowAlignSubmenu(false)}
            >
              <span>Align</span>
              <span className="text-neutral-400">›</span>
            </button>
            {showAlignSubmenu && (
              <div
                className="absolute left-full top-0 bg-white border border-gray-300 rounded-md py-0.5 ml-1"
                style={{
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)',
                }}
                onMouseEnter={() => setShowAlignSubmenu(true)}
                onMouseLeave={() => setShowAlignSubmenu(false)}
              >
                <button
                  className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
                  onClick={() => handleMenuAction(() => onAlign('left'))}
                >
                  Left
                </button>
                <button
                  className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
                  onClick={() => handleMenuAction(() => onAlign('center'))}
                >
                  Center
                </button>
                <button
                  className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
                  onClick={() => handleMenuAction(() => onAlign('right'))}
                >
                  Right
                </button>
                <button
                  className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
                  onClick={() => handleMenuAction(() => onAlign('top'))}
                >
                  Top
                </button>
                <button
                  className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
                  onClick={() => handleMenuAction(() => onAlign('middle'))}
                >
                  Middle
                </button>
                <button
                  className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
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
            className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 flex items-center justify-between gap-2"
            onMouseEnter={() => setShowDistributeSubmenu(true)}
            onMouseLeave={() => setShowDistributeSubmenu(false)}
          >
            <span>Distribute</span>
            <span className="text-neutral-400">›</span>
          </button>
          {showDistributeSubmenu && (
            <div
              className="absolute left-full top-0 bg-white border border-gray-300 rounded-md py-0.5 ml-1"
              style={{
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
              onMouseEnter={() => setShowDistributeSubmenu(true)}
              onMouseLeave={() => setShowDistributeSubmenu(false)}
            >
              <button
                className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
                onClick={() => handleMenuAction(onDistributeHorizontally)}
              >
                Horizontally
              </button>
              <button
                className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
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
          className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
          onClick={() => handleMenuAction(onCenterInCanvas)}
        >
          Center in Canvas
        </button>
      )}

      {/* Divider */}
      {(canAlign || canDistribute || (hasSelection && onCenterInCanvas)) && (
        <div className="border-t border-neutral-200" />
      )}

      {/* Z-Index Operations */}
      {hasSelection && (
        <>
          <button
            className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
            onClick={() => handleMenuAction(onBringToFront)}
          >
            Bring to Front
          </button>
          <button
            className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
            onClick={() => handleMenuAction(onBringForward)}
          >
            Bring Forward
          </button>
          <button
            className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
            onClick={() => handleMenuAction(onSendBackward)}
          >
            Send Backward
          </button>
          <button
            className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 whitespace-nowrap"
            onClick={() => handleMenuAction(onSendToBack)}
          >
            Send to Back
          </button>
          <div className="border-t border-neutral-200" />
        </>
      )}

      {/* Clipboard Operations */}
      {canCopy && onCopy && (
        <button
          className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 flex items-center justify-between gap-2"
          onClick={() => handleMenuAction(onCopy)}
        >
          <span>Copy</span>
          <span className="text-neutral-400">⌘C</span>
        </button>
      )}
      {canPaste && onPaste && (
        <button
          className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 flex items-center justify-between gap-2"
          onClick={() => handleMenuAction(onPaste)}
        >
          <span>Paste</span>
          <span className="text-neutral-400">⌘V</span>
        </button>
      )}
      {canCopy && onDuplicate && (
        <button
          className="w-full text-left px-2 py-1 text-xs hover:bg-neutral-100 text-neutral-700 flex items-center justify-between gap-2"
          onClick={() => handleMenuAction(onDuplicate)}
        >
          <span>Duplicate</span>
          <span className="text-neutral-400">⌘D</span>
        </button>
      )}

      {/* Delete Operation */}
      {hasSelection && onDelete && (
        <>
          <div className="border-t border-neutral-200" />
          <button
            className="w-full text-left px-2 py-1 text-xs hover:bg-red-50 text-red-600 flex items-center justify-between gap-2"
            onClick={() => handleMenuAction(onDelete)}
          >
            <span>Delete</span>
            <span className="text-red-400">⌫</span>
          </button>
        </>
      )}
    </div>
  )
}


