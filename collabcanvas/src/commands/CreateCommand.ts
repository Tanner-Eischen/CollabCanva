// CreateCommand - Undo/Redo for shape creation (PR-14)

import type { Command } from '../types/command'
import type { Shape } from '../types/canvas'

/**
 * Command for creating shapes
 * Undo: Delete the created shape
 * Redo: Recreate the shape
 */
export class CreateCommand implements Command {
  readonly type = 'create' as const
  
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
    // Add shape to local state
    this.addShapeToState(this.shape)
    
    // Sync to Firebase
    this.syncCreate(this.shape).catch((error) => {
      console.error('Failed to sync shape creation:', error)
    })
  }

  undo(): void {
    // Remove shape from local state
    this.removeShapeFromState(this.shape.id)
    
    // Sync deletion to Firebase
    this.syncDelete(this.shape.id).catch((error) => {
      console.error('Failed to sync shape deletion in undo:', error)
    })
  }

  redo(): void {
    // Re-add shape to local state
    this.addShapeToState(this.shape)
    
    // Sync creation to Firebase
    this.syncCreate(this.shape).catch((error) => {
      console.error('Failed to sync shape creation in redo:', error)
    })
  }
}

