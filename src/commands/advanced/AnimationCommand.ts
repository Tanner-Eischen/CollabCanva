/**
 * Animation Commands for Undo/Redo System
 * PR-31: Animation Integration
 */

import { ref, set, remove, update } from 'firebase/database'
import { db } from '../../services/firebase'
import type { Shape } from '../../types/canvas'

/**
 * Command: Create Animated Sprite
 * Adds an animated sprite to the canvas
 */
export class CreateAnimatedSpriteCommand {
  private canvasId: string
  private shape: Shape
  private executed: boolean = false

  constructor(canvasId: string, shape: Shape) {
    this.canvasId = canvasId
    this.shape = shape
  }

  async execute(): Promise<void> {
    if (this.executed) return
    
    const shapeRef = ref(db, `canvases/${this.canvasId}/objects/${this.shape.id}`)
    await set(shapeRef, this.shape)
    this.executed = true
  }

  async undo(): Promise<void> {
    if (!this.executed) return
    
    const shapeRef = ref(db, `canvases/${this.canvasId}/objects/${this.shape.id}`)
    await remove(shapeRef)
    this.executed = false
  }

  getDescription(): string {
    return `Create animated sprite "${this.shape.animationId}"`
  }
}

/**
 * Command: Update Animation Playback
 * Changes animation playback state (playing/paused, current frame)
 */
export class UpdateAnimationCommand {
  private canvasId: string
  private shapeId: string
  private oldState: {
    currentFrame?: number
    isPlaying?: boolean
  }
  private newState: {
    currentFrame?: number
    isPlaying?: boolean
  }
  private executed: boolean = false

  constructor(
    canvasId: string,
    shapeId: string,
    oldState: { currentFrame?: number; isPlaying?: boolean },
    newState: { currentFrame?: number; isPlaying?: boolean }
  ) {
    this.canvasId = canvasId
    this.shapeId = shapeId
    this.oldState = oldState
    this.newState = newState
  }

  async execute(): Promise<void> {
    if (this.executed) return
    
    const shapeRef = ref(db, `canvases/${this.canvasId}/objects/${this.shapeId}`)
    await update(shapeRef, this.newState)
    this.executed = true
  }

  async undo(): Promise<void> {
    if (!this.executed) return
    
    const shapeRef = ref(db, `canvases/${this.canvasId}/objects/${this.shapeId}`)
    await update(shapeRef, this.oldState)
    this.executed = false
  }

  getDescription(): string {
    if (this.newState.isPlaying !== undefined) {
      return this.newState.isPlaying ? 'Play animation' : 'Pause animation'
    }
    if (this.newState.currentFrame !== undefined) {
      return `Set animation frame to ${this.newState.currentFrame}`
    }
    return 'Update animation'
  }
}

/**
 * Command: Update Animated Sprite Properties
 * Changes sprite properties like flip, opacity, animation reference
 */
export class UpdateAnimatedSpriteCommand {
  private canvasId: string
  private shapeId: string
  private oldProps: Partial<Shape>
  private newProps: Partial<Shape>
  private executed: boolean = false

  constructor(
    canvasId: string,
    shapeId: string,
    oldProps: Partial<Shape>,
    newProps: Partial<Shape>
  ) {
    this.canvasId = canvasId
    this.shapeId = shapeId
    this.oldProps = oldProps
    this.newProps = newProps
  }

  async execute(): Promise<void> {
    if (this.executed) return
    
    const shapeRef = ref(db, `canvases/${this.canvasId}/objects/${this.shapeId}`)
    await update(shapeRef, this.newProps)
    this.executed = true
  }

  async undo(): Promise<void> {
    if (!this.executed) return
    
    const shapeRef = ref(db, `canvases/${this.canvasId}/objects/${this.shapeId}`)
    await update(shapeRef, this.oldProps)
    this.executed = false
  }

  getDescription(): string {
    const changes: string[] = []
    
    if (this.newProps.flipX !== this.oldProps.flipX) {
      changes.push('flip X')
    }
    if (this.newProps.flipY !== this.oldProps.flipY) {
      changes.push('flip Y')
    }
    if (this.newProps.opacity !== this.oldProps.opacity) {
      changes.push('opacity')
    }
    if (this.newProps.animationId !== this.oldProps.animationId) {
      changes.push('animation')
    }
    
    return changes.length > 0 
      ? `Update sprite: ${changes.join(', ')}` 
      : 'Update sprite properties'
  }
}

/**
 * Command: Delete Animated Sprite
 * Removes an animated sprite from the canvas
 */
export class DeleteAnimatedSpriteCommand {
  private canvasId: string
  private shape: Shape
  private executed: boolean = false

  constructor(canvasId: string, shape: Shape) {
    this.canvasId = canvasId
    this.shape = shape
  }

  async execute(): Promise<void> {
    if (this.executed) return
    
    const shapeRef = ref(db, `canvases/${this.canvasId}/objects/${this.shape.id}`)
    await remove(shapeRef)
    this.executed = true
  }

  async undo(): Promise<void> {
    if (!this.executed) return
    
    const shapeRef = ref(db, `canvases/${this.canvasId}/objects/${this.shape.id}`)
    await set(shapeRef, this.shape)
    this.executed = false
  }

  getDescription(): string {
    return `Delete animated sprite "${this.shape.animationId}"`
  }
}

/**
 * Command: Change Animation
 * Switches an animated sprite to a different animation
 */
export class ChangeAnimationCommand {
  private canvasId: string
  private shapeId: string
  private oldAnimationId: string
  private newAnimationId: string
  private executed: boolean = false

  constructor(
    canvasId: string,
    shapeId: string,
    oldAnimationId: string,
    newAnimationId: string
  ) {
    this.canvasId = canvasId
    this.shapeId = shapeId
    this.oldAnimationId = oldAnimationId
    this.newAnimationId = newAnimationId
  }

  async execute(): Promise<void> {
    if (this.executed) return
    
    const shapeRef = ref(db, `canvases/${this.canvasId}/objects/${this.shapeId}`)
    await update(shapeRef, {
      animationId: this.newAnimationId,
      currentFrame: 0, // Reset to first frame
      isPlaying: true // Start playing new animation
    })
    this.executed = true
  }

  async undo(): Promise<void> {
    if (!this.executed) return
    
    const shapeRef = ref(db, `canvases/${this.canvasId}/objects/${this.shapeId}`)
    await update(shapeRef, {
      animationId: this.oldAnimationId,
      currentFrame: 0,
      isPlaying: true
    })
    this.executed = false
  }

  getDescription(): string {
    return `Change animation to "${this.newAnimationId}"`
  }
}

