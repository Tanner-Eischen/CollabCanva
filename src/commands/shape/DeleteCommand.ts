// DeleteCommand - Undo/Redo for shape deletion (PR-14)

import type { Command } from '../../types/command'
import type { Shape } from '../../types/canvas'

/**
 * Command for deleting shapes
 * Undo: Recreate the deleted shape with same ID and properties
 * Redo: Delete the shape again
 */
export class DeleteCommand implements Command {
  readonly type = 'delete' as const
  
  private shape: Shape
  private addShapeToState: (shape: Shape) => void
  private removeShapeFromState: (id: string) => void
  private syncCreate: (shape: Shape) => Promise<void>
  private syncDelete: (id: string) => Promise<void>

  constructor(
    shape: Shape,
    addShapeToState: (shape: Shape) => void,
    removeShapeFromState: (id: string) => void,
    syncCreate: (shape: Shape) => Promise<void>,
    syncDelete: (id: string) => Promise<void>
  ) {
    this.shape = shape
    this.addShapeToState = addShapeToState
    this.removeShapeFromState = removeShapeFromState
    this.syncCreate = syncCreate
    this.syncDelete = syncDelete
  }

  execute(): void {
    // Remove shape from local state
    this.removeShapeFromState(this.shape.id)
    
    // Sync deletion to Firebase
    this.syncDelete(this.shape.id).catch((error) => {
      console.error('Failed to sync shape deletion:', error)
    })
  }

  undo(): void {
    // Recreate shape with same ID and properties
    this.addShapeToState(this.shape)
    
    // Sync creation to Firebase
    this.syncCreate(this.shape).catch((error) => {
      console.error('Failed to sync shape recreation in undo:', error)
    })
  }

  redo(): void {
    // Delete shape again
    this.removeShapeFromState(this.shape.id)
    
    // Sync deletion to Firebase
    this.syncDelete(this.shape.id).catch((error) => {
      console.error('Failed to sync shape deletion in redo:', error)
    })
  }
}

