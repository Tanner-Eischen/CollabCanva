// ZIndexCommand - Undo/Redo for z-index changes (PR-17)

import type { Command } from '../types/command'

/**
 * Command for changing z-index of shapes
 * Undo: Restore old z-index values
 * Redo: Apply new z-index values
 */
export class ZIndexCommand implements Command {
  readonly type = 'zindex' as const
  
  private shapeIds: string[]
  private oldZIndices: Map<string, number>
  private newZIndices: Map<string, number>
  private updateShape: (id: string, updates: { zIndex: number }) => void
  private syncZIndex: (id: string, zIndex: number) => Promise<void>

  constructor(
    shapeIds: string[],
    oldZIndices: Map<string, number>,
    newZIndices: Map<string, number>,
    updateShape: (id: string, updates: { zIndex: number }) => void,
    syncZIndex: (id: string, zIndex: number) => Promise<void>
  ) {
    this.shapeIds = shapeIds
    this.oldZIndices = oldZIndices
    this.newZIndices = newZIndices
    this.updateShape = updateShape
    this.syncZIndex = syncZIndex
  }

  execute(): void {
    // Apply new z-indices
    this.shapeIds.forEach((id) => {
      const newZIndex = this.newZIndices.get(id)
      if (newZIndex !== undefined) {
        this.updateShape(id, { zIndex: newZIndex })
        this.syncZIndex(id, newZIndex).catch((error) => {
          console.error('Failed to sync z-index change:', error)
        })
      }
    })
  }

  undo(): void {
    // Restore old z-indices
    this.shapeIds.forEach((id) => {
      const oldZIndex = this.oldZIndices.get(id)
      if (oldZIndex !== undefined) {
        this.updateShape(id, { zIndex: oldZIndex })
        this.syncZIndex(id, oldZIndex).catch((error) => {
          console.error('Failed to sync z-index change in undo:', error)
        })
      }
    })
  }

  redo(): void {
    // Re-apply new z-indices
    this.execute()
  }
}


