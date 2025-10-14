// ColorCommand - Undo/Redo for color changes (PR-15)

import type { Command } from '../types/command'

/**
 * Color data for a shape
 */
interface ColorData {
  fill: string
  stroke?: string
  strokeWidth?: number
}

/**
 * Command for changing shape colors
 * Undo: Restore old colors
 * Redo: Apply new colors
 */
export class ColorCommand implements Command {
  readonly type = 'color' as const
  
  private shapeId: string
  private oldColors: ColorData
  private newColors: ColorData
  private updateShapeInState: (id: string, updates: Partial<ColorData>) => void
  private syncUpdate: (id: string, updates: Partial<ColorData>) => Promise<void>

  constructor(
    shapeId: string,
    oldColors: ColorData,
    newColors: ColorData,
    updateShapeInState: (id: string, updates: Partial<ColorData>) => void,
    syncUpdate: (id: string, updates: Partial<ColorData>) => Promise<void>
  ) {
    this.shapeId = shapeId
    this.oldColors = oldColors
    this.newColors = newColors
    this.updateShapeInState = updateShapeInState
    this.syncUpdate = syncUpdate
  }

  execute(): void {
    // Apply new colors to local state
    this.updateShapeInState(this.shapeId, this.newColors)
    
    // Sync to Firebase
    this.syncUpdate(this.shapeId, this.newColors).catch((error) => {
      console.error('Failed to sync color change:', error)
    })
  }

  undo(): void {
    // Restore old colors in local state
    this.updateShapeInState(this.shapeId, this.oldColors)
    
    // Sync to Firebase
    this.syncUpdate(this.shapeId, this.oldColors).catch((error) => {
      console.error('Failed to sync color change in undo:', error)
    })
  }

  redo(): void {
    // Re-apply new colors in local state
    this.updateShapeInState(this.shapeId, this.newColors)
    
    // Sync to Firebase
    this.syncUpdate(this.shapeId, this.newColors).catch((error) => {
      console.error('Failed to sync color change in redo:', error)
    })
  }
}

