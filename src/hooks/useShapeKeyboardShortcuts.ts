import { useEffect } from 'react'
import type { Group as GroupType } from '../types/group'

interface UseShapeKeyboardShortcutsProps {
  selectedIds: Set<string>
  groups: GroupType[]
  canUndo: boolean
  canRedo: boolean
  isColorSamplingMode: boolean
  bulkDelete: () => void
  clearSelection: () => void
  selectAll: () => void
  copySelected: () => void
  paste: () => void
  duplicateSelected: () => void
  undo: () => void
  redo: () => void
  createGroup: (shapeIds: string[]) => Promise<string | null>
  ungroup: (groupId: string) => Promise<void>
  cancelColorSampling: () => void
}

/**
 * Custom hook for managing keyboard shortcuts in shape canvas
 * Handles:
 * - Delete/Backspace: Delete selected shapes
 * - Escape: Cancel color sampling or clear selection
 * - Cmd/Ctrl+A: Select all
 * - Cmd/Ctrl+C: Copy
 * - Cmd/Ctrl+V: Paste
 * - Cmd/Ctrl+D: Duplicate
 * - Cmd/Ctrl+Z: Undo
 * - Cmd/Ctrl+Shift+Z: Redo
 * - Cmd/Ctrl+G: Group
 * - Cmd/Ctrl+Shift+G: Ungroup
 */
export function useShapeKeyboardShortcuts({
  selectedIds,
  groups,
  canUndo,
  canRedo,
  isColorSamplingMode,
  bulkDelete,
  clearSelection,
  selectAll,
  copySelected,
  paste,
  duplicateSelected,
  undo,
  redo,
  createGroup,
  ungroup,
  cancelColorSampling,
}: UseShapeKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete/Backspace - delete selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        e.preventDefault()
        bulkDelete()
      }
      
      // Escape - cancel color sampling or clear selection
      if (e.key === 'Escape') {
        e.preventDefault()
        if (isColorSamplingMode) {
          cancelColorSampling()
        } else {
          clearSelection()
        }
      }
      
      // Cmd/Ctrl+A - select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        selectAll()
      }
      
      // Cmd/Ctrl+C - copy selected shapes
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedIds.size > 0) {
        e.preventDefault()
        copySelected()
      }
      
      // Cmd/Ctrl+V - paste shapes
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault()
        paste()
      }
      
      // Cmd/Ctrl+D - duplicate selected shapes
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedIds.size > 0) {
        e.preventDefault()
        duplicateSelected()
      }
      
      // Cmd/Ctrl+Z - undo
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z' && canUndo) {
        e.preventDefault()
        undo()
      }
      
      // Cmd/Ctrl+Shift+Z - redo
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z' && canRedo) {
        e.preventDefault()
        redo()
      }
      
      // Cmd/Ctrl+G - create group from selected shapes
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'g' && selectedIds.size >= 2) {
        e.preventDefault()
        const shapeIds = Array.from(selectedIds)
        createGroup(shapeIds).then((groupId) => {
          if (groupId) {
            clearSelection()
          }
        })
      }
      
      // Cmd/Ctrl+Shift+G - ungroup selected group
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'g' && selectedIds.size === 1) {
        e.preventDefault()
        const selectedArray = Array.from(selectedIds)
        const selectedId = selectedArray[0]
        const group = groups.find((g) => g.id === selectedId)
        if (group) {
          ungroup(selectedId).then(() => {
            clearSelection()
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedIds,
    groups,
    canUndo,
    canRedo,
    isColorSamplingMode,
    bulkDelete,
    clearSelection,
    selectAll,
    copySelected,
    paste,
    duplicateSelected,
    undo,
    redo,
    createGroup,
    ungroup,
    cancelColorSampling,
  ])
}

