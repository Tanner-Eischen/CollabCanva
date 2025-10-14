import { useEffect } from 'react'
import { getShortcutsByCategory, formatShortcut } from '../constants/shortcuts'

interface KeyboardShortcutsProps {
  visible: boolean
  onClose: () => void
}

/**
 * KeyboardShortcuts - Help overlay modal showing all keyboard shortcuts (PR-20)
 * Triggered by pressing "?" key
 */
export function KeyboardShortcuts({ visible, onClose }: KeyboardShortcutsProps) {
  // Close on Escape key
  useEffect(() => {
    if (!visible) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [visible, onClose])

  if (!visible) return null

  const shortcutsByCategory = getShortcutsByCategory()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      {/* Modal */}
      <div className="bg-white rounded-lg shadow-hard max-w-3xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 transition-colors"
          >
            <span className="text-neutral-500 text-xl">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-5rem)] px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-neutral-700 mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={`${shortcut.action}-${index}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-neutral-600">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded text-neutral-700 font-mono text-xs">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
          <p className="text-xs text-neutral-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-neutral-700 font-mono">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>

      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  )
}

