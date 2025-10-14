/**
 * Keyboard Shortcuts Definitions (PR-20)
 * Comprehensive keyboard shortcut mapping for CollabCanvas
 */

export interface KeyboardShortcut {
  key: string
  modifiers?: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
  }
  description: string
  action: string
  category: string
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Tools
  {
    key: 'V',
    description: 'Select tool',
    action: 'selectTool',
    category: 'Tools',
  },
  {
    key: 'H',
    description: 'Hand tool (pan)',
    action: 'handTool',
    category: 'Tools',
  },
  {
    key: 'R',
    description: 'Rectangle',
    action: 'rectangleTool',
    category: 'Tools',
  },
  {
    key: 'O',
    description: 'Circle',
    action: 'circleTool',
    category: 'Tools',
  },
  {
    key: 'T',
    description: 'Text',
    action: 'textTool',
    category: 'Tools',
  },
  {
    key: 'L',
    description: 'Line',
    action: 'lineTool',
    category: 'Tools',
  },
  {
    key: 'P',
    description: 'Pencil (freehand)',
    action: 'pencilTool',
    category: 'Tools',
  },
  {
    key: 'N',
    description: 'Pen (smooth)',
    action: 'penTool',
    category: 'Tools',
  },
  {
    key: 'Space',
    description: 'Temporary hand tool',
    action: 'tempHandTool',
    category: 'Tools',
  },

  // Edit
  {
    key: 'C',
    modifiers: { ctrl: true },
    description: 'Copy',
    action: 'copy',
    category: 'Edit',
  },
  {
    key: 'V',
    modifiers: { ctrl: true },
    description: 'Paste',
    action: 'paste',
    category: 'Edit',
  },
  {
    key: 'D',
    modifiers: { ctrl: true },
    description: 'Duplicate',
    action: 'duplicate',
    category: 'Edit',
  },
  {
    key: 'A',
    modifiers: { ctrl: true },
    description: 'Select all',
    action: 'selectAll',
    category: 'Edit',
  },
  {
    key: 'Z',
    modifiers: { ctrl: true },
    description: 'Undo',
    action: 'undo',
    category: 'Edit',
  },
  {
    key: 'Z',
    modifiers: { ctrl: true, shift: true },
    description: 'Redo',
    action: 'redo',
    category: 'Edit',
  },
  {
    key: 'Delete',
    description: 'Delete',
    action: 'delete',
    category: 'Edit',
  },
  {
    key: 'Backspace',
    description: 'Delete',
    action: 'delete',
    category: 'Edit',
  },
  {
    key: 'Escape',
    description: 'Clear selection',
    action: 'clearSelection',
    category: 'Edit',
  },

  // Arrange
  {
    key: 'G',
    modifiers: { ctrl: true },
    description: 'Group',
    action: 'group',
    category: 'Arrange',
  },
  {
    key: 'G',
    modifiers: { ctrl: true, shift: true },
    description: 'Ungroup',
    action: 'ungroup',
    category: 'Arrange',
  },
  {
    key: ']',
    modifiers: { ctrl: true },
    description: 'Bring forward',
    action: 'bringForward',
    category: 'Arrange',
  },
  {
    key: '[',
    modifiers: { ctrl: true },
    description: 'Send backward',
    action: 'sendBackward',
    category: 'Arrange',
  },
  {
    key: ']',
    modifiers: { ctrl: true, shift: true },
    description: 'Bring to front',
    action: 'bringToFront',
    category: 'Arrange',
  },
  {
    key: '[',
    modifiers: { ctrl: true, shift: true },
    description: 'Send to back',
    action: 'sendToBack',
    category: 'Arrange',
  },

  // View
  {
    key: 'E',
    modifiers: { ctrl: true },
    description: 'Export',
    action: 'export',
    category: 'View',
  },
  {
    key: '?',
    description: 'Show keyboard shortcuts',
    action: 'showShortcuts',
    category: 'View',
  },
]

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []
  
  if (shortcut.modifiers?.ctrl) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
  }
  if (shortcut.modifiers?.shift) {
    parts.push('Shift')
  }
  if (shortcut.modifiers?.alt) {
    parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt')
  }
  
  parts.push(shortcut.key)
  
  return parts.join(' + ')
}

/**
 * Group shortcuts by category
 */
export function getShortcutsByCategory(): Record<string, KeyboardShortcut[]> {
  const grouped: Record<string, KeyboardShortcut[]> = {}
  
  KEYBOARD_SHORTCUTS.forEach(shortcut => {
    if (!grouped[shortcut.category]) {
      grouped[shortcut.category] = []
    }
    grouped[shortcut.category].push(shortcut)
  })
  
  return grouped
}

