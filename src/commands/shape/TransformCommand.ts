// TransformCommand - Undo/Redo for shape transformation (PR-14)

import type { Command } from '../../types/command'

/**
 * Transform data for a shape (size and rotation)
 */
interface Transform {
  width: number
  height: number
  rotation?: number
}

/**
 * Command for transforming shapes (resize, rotate)
 * Undo: Restore old transform
 * Redo: Apply new transform
 */
export class TransformCommand implements Command {
  readonly type = 'transform' as const
  
  private shapeId: string
  private oldTransform: Transform
  private newTransform: Transform
  private updateShapeInState: (id: string, updates: Partial<Transform>) => void
  private syncUpdate: (id: string, updates: Partial<Transform>) => Promise<void>

  constructor(
    shapeId: string,
    oldTransform: Transform,
    newTransform: Transform,
    updateShapeInState: (id: string, updates: Partial<Transform>) => void,
    syncUpdate: (id: string, updates: Partial<Transform>) => Promise<void>
  ) {
    this.shapeId = shapeId
    this.oldTransform = oldTransform
    this.newTransform = newTransform
    this.updateShapeInState = updateShapeInState
    this.syncUpdate = syncUpdate
  }

  execute(): void {
    // Apply new transform to local state
    this.updateShapeInState(this.shapeId, {
      width: this.newTransform.width,
      height: this.newTransform.height,
      rotation: this.newTransform.rotation,
    })
    
    // Sync to Firebase
    this.syncUpdate(this.shapeId, {
      width: this.newTransform.width,
      height: this.newTransform.height,
      rotation: this.newTransform.rotation,
    }).catch((error) => {
      console.error('Failed to sync shape transform:', error)
    })
  }

  undo(): void {
    // Restore old transform in local state
    this.updateShapeInState(this.shapeId, {
      width: this.oldTransform.width,
      height: this.oldTransform.height,
      rotation: this.oldTransform.rotation,
    })
    
    // Sync to Firebase
    this.syncUpdate(this.shapeId, {
      width: this.oldTransform.width,
      height: this.oldTransform.height,
      rotation: this.oldTransform.rotation,
    }).catch((error) => {
      console.error('Failed to sync shape transform in undo:', error)
    })
  }

  redo(): void {
    // Re-apply new transform in local state
    this.updateShapeInState(this.shapeId, {
      width: this.newTransform.width,
      height: this.newTransform.height,
      rotation: this.newTransform.rotation,
    })
    
    // Sync to Firebase
    this.syncUpdate(this.shapeId, {
      width: this.newTransform.width,
      height: this.newTransform.height,
      rotation: this.newTransform.rotation,
    }).catch((error) => {
      console.error('Failed to sync shape transform in redo:', error)
    })
  }
}

