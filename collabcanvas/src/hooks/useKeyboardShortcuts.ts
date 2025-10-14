import { useEffect } from 'react'

interface KeyboardShortcutHandlers {
  [action: string]: () => void
}

/**
 * useKeyboardShortcuts - Global keyboard event handler (PR-20)
 * Manages keyboard shortcuts for tools, editing, and navigation
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const key = e.key.toUpperCase()
      const ctrl = e.metaKey || e.ctrlKey
      const shift = e.shiftKey
      const alt = e.altKey

      // Tools (no modifiers)
      if (!ctrl && !shift && !alt) {
        if (key === 'V' && handlers.selectTool) {
          e.preventDefault()
          handlers.selectTool()
        } else if (key === 'H' && handlers.handTool) {
          e.preventDefault()
          handlers.handTool()
        } else if (key === 'R' && handlers.rectangleTool) {
          e.preventDefault()
          handlers.rectangleTool()
        } else if (key === 'O' && handlers.circleTool) {
          e.preventDefault()
          handlers.circleTool()
        } else if (key === 'T' && handlers.textTool) {
          e.preventDefault()
          handlers.textTool()
        } else if (key === 'L' && handlers.lineTool) {
          e.preventDefault()
          handlers.lineTool()
        } else if (key === 'P' && handlers.pencilTool) {
          e.preventDefault()
          handlers.pencilTool()
        } else if (key === 'N' && handlers.penTool) {
          e.preventDefault()
          handlers.penTool()
        } else if (key === '?' && handlers.showShortcuts) {
          e.preventDefault()
          handlers.showShortcuts()
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          if (handlers.delete) {
            e.preventDefault()
            handlers.delete()
          }
        } else if (e.key === 'Escape' && handlers.clearSelection) {
          e.preventDefault()
          handlers.clearSelection()
        }
      }

      // Edit (Ctrl/Cmd + key)
      if (ctrl && !shift && !alt) {
        if (key === 'C' && handlers.copy) {
          e.preventDefault()
          handlers.copy()
        } else if (key === 'V' && handlers.paste) {
          e.preventDefault()
          handlers.paste()
        } else if (key === 'D' && handlers.duplicate) {
          e.preventDefault()
          handlers.duplicate()
        } else if (key === 'A' && handlers.selectAll) {
          e.preventDefault()
          handlers.selectAll()
        } else if (key === 'Z' && handlers.undo) {
          e.preventDefault()
          handlers.undo()
        } else if (key === 'E' && handlers.export) {
          e.preventDefault()
          handlers.export()
        } else if (key === 'G' && handlers.group) {
          e.preventDefault()
          handlers.group()
        } else if (key === ']' && handlers.bringForward) {
          e.preventDefault()
          handlers.bringForward()
        } else if (key === '[' && handlers.sendBackward) {
          e.preventDefault()
          handlers.sendBackward()
        }
      }

      // Edit with Shift (Ctrl/Cmd + Shift + key)
      if (ctrl && shift && !alt) {
        if (key === 'Z' && handlers.redo) {
          e.preventDefault()
          handlers.redo()
        } else if (key === 'G' && handlers.ungroup) {
          e.preventDefault()
          handlers.ungroup()
        } else if (key === ']' && handlers.bringToFront) {
          e.preventDefault()
          handlers.bringToFront()
        } else if (key === '[' && handlers.sendToBack) {
          e.preventDefault()
          handlers.sendToBack()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Handle Space key release for temporary hand tool
      if (e.key === ' ' && handlers.tempHandToolRelease) {
        e.preventDefault()
        handlers.tempHandToolRelease()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [handlers])
}

