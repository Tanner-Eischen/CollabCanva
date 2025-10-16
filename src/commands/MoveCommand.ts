// MoveCommand - Undo/Redo for shape movement (PR-14)

import type { Command } from '../types/command'

/**
 * Position data for a shape
 */
interface Position {
  x: number
  y: number
}

/**
 * Command for moving shapes
 * Undo: Restore old position
 * Redo: Apply new position
 */
export class MoveCommand implements Command {
  readonly type = 'move' as const
  
  private shapeId: string
  private oldPosition: Position
  private newPosition: Position
  private updateShapeInState: (id: string, updates: Partial<{ x: number; y: number }>) => void
  private syncUpdate: (id: string, updates: Partial<{ x: number; y: number }>) => Promise<void>

  constructor(
    shapeId: string,
    oldPosition: Position,
    newPosition: Position,
    updateShapeInState: (id: string, updates: Partial<{ x: number; y: number }>) => void,
    syncUpdate: (id: string, updates: Partial<{ x: number; y: number }>) => Promise<void>
  ) {
    this.shapeId = shapeId
    this.oldPosition = oldPosition
    this.newPosition = newPosition
    this.updateShapeInState = updateShapeInState
    this.syncUpdate = syncUpdate
  }

  execute(): void {
    // Apply new position to local state
    this.updateShapeInState(this.shapeId, {
      x: this.newPosition.x,
      y: this.newPosition.y,
    })
    
    // Sync to Firebase
    this.syncUpdate(this.shapeId, {
      x: this.newPosition.x,
      y: this.newPosition.y,
    }).catch((error) => {
      console.error('Failed to sync shape move:', error)
    })
  }

  undo(): void {
    // Restore old position in local state
    this.updateShapeInState(this.shapeId, {
      x: this.oldPosition.x,
      y: this.oldPosition.y,
    })
    
    // Sync to Firebase
    this.syncUpdate(this.shapeId, {
      x: this.oldPosition.x,
      y: this.oldPosition.y,
    }).catch((error) => {
      console.error('Failed to sync shape move in undo:', error)
    })
  }

  redo(): void {
    // Re-apply new position in local state
    this.updateShapeInState(this.shapeId, {
      x: this.newPosition.x,
      y: this.newPosition.y,
    })
    
    // Sync to Firebase
    this.syncUpdate(this.shapeId, {
      x: this.newPosition.x,
      y: this.newPosition.y,
    }).catch((error) => {
      console.error('Failed to sync shape move in redo:', error)
    })
  }
}

