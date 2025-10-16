// AlignmentCommand - Undo/Redo for alignment operations (PR-18)

import type { Command } from '../types/command'

/**
 * Command for alignment and distribution operations
 * Undo: Restore old positions
 * Redo: Apply new positions
 */
export class AlignmentCommand implements Command {
  readonly type = 'alignment' as const
  
  private shapeIds: string[]
  private oldPositions: Map<string, { x: number; y: number }>
  private newPositions: Map<string, { x: number; y: number }>
  private updateShape: (id: string, updates: { x: number; y: number }) => void
  private syncPosition: (id: string, x: number, y: number) => Promise<void>

  constructor(
    shapeIds: string[],
    oldPositions: Map<string, { x: number; y: number }>,
    newPositions: Map<string, { x: number; y: number }>,
    updateShape: (id: string, updates: { x: number; y: number }) => void,
    syncPosition: (id: string, x: number, y: number) => Promise<void>
  ) {
    this.shapeIds = shapeIds
    this.oldPositions = oldPositions
    this.newPositions = newPositions
    this.updateShape = updateShape
    this.syncPosition = syncPosition
  }

  execute(): void {
    // Apply new positions
    this.shapeIds.forEach((id) => {
      const newPos = this.newPositions.get(id)
      if (newPos) {
        this.updateShape(id, newPos)
        this.syncPosition(id, newPos.x, newPos.y).catch((error) => {
          console.error('Failed to sync alignment position:', error)
        })
      }
    })
  }

  undo(): void {
    // Restore old positions
    this.shapeIds.forEach((id) => {
      const oldPos = this.oldPositions.get(id)
      if (oldPos) {
        this.updateShape(id, oldPos)
        this.syncPosition(id, oldPos.x, oldPos.y).catch((error) => {
          console.error('Failed to sync alignment position in undo:', error)
        })
      }
    })
  }

  redo(): void {
    // Re-apply new positions
    this.execute()
  }
}


