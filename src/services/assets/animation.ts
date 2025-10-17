/**
 * Animation Service (PR-31)
 * Manages sprite animations - creation, storage, playback
 */

import { ref as dbRef, set, get, remove, update, push, onValue, off } from 'firebase/database'
import { db } from '../firebase'
import type {
  Animation,
  AnimationFrame,
  AnimationValidation,
  AnimationExport
} from '../../types/animation'
import type { Asset } from '../../types/asset'

/**
 * Generate unique animation ID
 */
function generateAnimationId(): string {
  return `anim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate animation data
 */
export function validateAnimation(
  animation: Partial<Animation>,
  spriteSheet?: Asset
): AnimationValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const issues: Array<{ frameIndex: number; message: string }> = []

  // Check required fields
  if (!animation.name || animation.name.trim().length === 0) {
    errors.push('Animation name is required')
  }

  if (!animation.spriteSheetId) {
    errors.push('Sprite sheet ID is required')
  }

  if (!animation.frames || animation.frames.length === 0) {
    errors.push('Animation must have at least one frame')
  }

  if (animation.fps && (animation.fps < 1 || animation.fps > 60)) {
    errors.push('FPS must be between 1 and 60')
  }

  // Validate frames against sprite sheet bounds
  if (spriteSheet && animation.frames) {
    animation.frames.forEach((frame, index) => {
      if (frame.x < 0 || frame.y < 0) {
        issues.push({
          frameIndex: index,
          message: 'Frame coordinates cannot be negative'
        })
      }

      if (frame.x + frame.width > spriteSheet.metadata.width) {
        issues.push({
          frameIndex: index,
          message: 'Frame extends beyond sprite sheet width'
        })
      }

      if (frame.y + frame.height > spriteSheet.metadata.height) {
        issues.push({
          frameIndex: index,
          message: 'Frame extends beyond sprite sheet height'
        })
      }

      if (frame.duration && frame.duration < 16) {
        warnings.push(`Frame ${index} has very short duration (${frame.duration}ms)`)
      }
    })
  }

  // Warning for very long animations
  if (animation.frames && animation.frames.length > 100) {
    warnings.push('Animation has more than 100 frames, this may impact performance')
  }

  return {
    valid: errors.length === 0 && issues.length === 0,
    errors,
    warnings,
    issues: issues.length > 0 ? issues : undefined
  }
}

/**
 * Create a new animation
 */
export async function createAnimation(
  userId: string,
  data: {
    name: string
    spriteSheetId: string
    frames: AnimationFrame[]
    fps?: number
    loop?: boolean
    canvasId?: string
  }
): Promise<Animation> {
  const animationId = generateAnimationId()
  const now = Date.now()

  const animation: Animation = {
    id: animationId,
    userId,
    canvasId: data.canvasId,
    name: data.name,
    spriteSheetId: data.spriteSheetId,
    frames: data.frames,
    fps: data.fps || 12,
    loop: data.loop !== undefined ? data.loop : true,
    createdAt: now,
    updatedAt: now
  }

  // Validate before saving
  const validation = validateAnimation(animation)
  if (!validation.valid) {
    throw new Error(`Invalid animation: ${validation.errors.join(', ')}`)
  }

  // Save to Firebase
  const path = data.canvasId 
    ? `animations/${data.canvasId}/${animationId}`
    : `animations/${userId}/${animationId}`
  
  const animationRef = dbRef(db, path)
  await set(animationRef, animation)

  return animation
}

/**
 * Update an existing animation
 */
export async function updateAnimation(
  animationId: string,
  userId: string,
  updates: Partial<Pick<Animation, 'name' | 'frames' | 'fps' | 'loop'>>,
  canvasId?: string
): Promise<void> {
  const path = canvasId 
    ? `animations/${canvasId}/${animationId}`
    : `animations/${userId}/${animationId}`
  
  const animationRef = dbRef(db, path)
  
  // Check if exists
  const snapshot = await get(animationRef)
  if (!snapshot.exists()) {
    throw new Error('Animation not found')
  }

  const existingAnimation = snapshot.val() as Animation

  // Validate ownership
  if (existingAnimation.userId !== userId) {
    throw new Error('Permission denied')
  }

  // Merge updates and validate
  const updatedAnimation = { ...existingAnimation, ...updates }
  const validation = validateAnimation(updatedAnimation)
  if (!validation.valid) {
    throw new Error(`Invalid animation: ${validation.errors.join(', ')}`)
  }

  await update(animationRef, {
    ...updates,
    updatedAt: Date.now()
  })
}

/**
 * Delete an animation
 */
export async function deleteAnimation(
  animationId: string,
  userId: string,
  canvasId?: string
): Promise<void> {
  const path = canvasId 
    ? `animations/${canvasId}/${animationId}`
    : `animations/${userId}/${animationId}`
  
  const animationRef = dbRef(db, path)
  
  // Check ownership
  const snapshot = await get(animationRef)
  if (!snapshot.exists()) {
    throw new Error('Animation not found')
  }

  const animation = snapshot.val() as Animation
  if (animation.userId !== userId) {
    throw new Error('Permission denied')
  }

  await remove(animationRef)

  // TODO: Clean up any canvas objects using this animation
}

/**
 * Get animation by ID
 */
export async function getAnimation(
  animationId: string,
  userIdOrCanvasId: string,
  isCanvasId: boolean = false
): Promise<Animation | null> {
  const path = isCanvasId 
    ? `animations/${userIdOrCanvasId}/${animationId}`
    : `animations/${userIdOrCanvasId}/${animationId}`
  
  const animationRef = dbRef(db, path)
  const snapshot = await get(animationRef)
  
  if (!snapshot.exists()) {
    return null
  }

  return snapshot.val() as Animation
}

/**
 * Get all animations for a user
 */
export async function getUserAnimations(userId: string): Promise<Animation[]> {
  const animationsRef = dbRef(db, `animations/${userId}`)
  const snapshot = await get(animationsRef)
  
  if (!snapshot.exists()) {
    return []
  }

  const animationsData = snapshot.val()
  return Object.values(animationsData) as Animation[]
}

/**
 * Get all animations for a canvas
 */
export async function getCanvasAnimations(canvasId: string): Promise<Animation[]> {
  const animationsRef = dbRef(db, `animations/${canvasId}`)
  const snapshot = await get(animationsRef)
  
  if (!snapshot.exists()) {
    return []
  }

  const animationsData = snapshot.val()
  return Object.values(animationsData) as Animation[]
}

/**
 * Subscribe to animation changes
 */
export function subscribeToAnimations(
  userIdOrCanvasId: string,
  callback: (animations: Animation[]) => void,
  isCanvasId: boolean = false
): () => void {
  const path = `animations/${userIdOrCanvasId}`
  const animationsRef = dbRef(db, path)

  const handler = (snapshot: any) => {
    if (!snapshot.exists()) {
      callback([])
      return
    }

    const animationsData = snapshot.val()
    const animations = Object.values(animationsData) as Animation[]
    callback(animations)
  }

  onValue(animationsRef, handler)

  // Return unsubscribe function
  return () => off(animationsRef, 'value', handler)
}

/**
 * Duplicate an animation
 */
export async function duplicateAnimation(
  animationId: string,
  userId: string,
  newName: string,
  canvasId?: string
): Promise<Animation> {
  const path = canvasId 
    ? `animations/${canvasId}/${animationId}`
    : `animations/${userId}/${animationId}`
  
  const animationRef = dbRef(db, path)
  const snapshot = await get(animationRef)
  
  if (!snapshot.exists()) {
    throw new Error('Animation not found')
  }

  const originalAnimation = snapshot.val() as Animation

  // Create new animation with same data
  return createAnimation(userId, {
    name: newName,
    spriteSheetId: originalAnimation.spriteSheetId,
    frames: [...originalAnimation.frames],
    fps: originalAnimation.fps,
    loop: originalAnimation.loop,
    canvasId: canvasId
  })
}

/**
 * Export animation to game engine format
 */
export function exportAnimation(
  animation: Animation,
  spriteSheetUrl: string,
  format: 'godot' | 'unity' | 'phaser' | 'generic' = 'generic'
): AnimationExport {
  const baseExport: AnimationExport = {
    name: animation.name,
    spriteSheet: spriteSheetUrl,
    frames: animation.frames.map(f => ({
      x: f.x,
      y: f.y,
      w: f.width,
      h: f.height
    })),
    frameRate: animation.fps,
    loop: animation.loop
  }

  // Format-specific adjustments can be added here
  // For now, all formats use the same structure

  return baseExport
}

/**
 * Auto-generate animation from sprite sheet grid
 * Slices sprite sheet into frames based on grid dimensions
 */
export function autoGenerateFrames(
  spriteSheetWidth: number,
  spriteSheetHeight: number,
  frameWidth: number,
  frameHeight: number,
  options: {
    spacing?: number
    margin?: number
    maxFrames?: number
  } = {}
): AnimationFrame[] {
  const spacing = options.spacing || 0
  const margin = options.margin || 0
  const frames: AnimationFrame[] = []

  let y = margin
  while (y + frameHeight <= spriteSheetHeight) {
    let x = margin
    while (x + frameWidth <= spriteSheetWidth) {
      frames.push({
        x,
        y,
        width: frameWidth,
        height: frameHeight
      })

      if (options.maxFrames && frames.length >= options.maxFrames) {
        return frames
      }

      x += frameWidth + spacing
    }
    y += frameHeight + spacing
  }

  return frames
}

/**
 * Calculate animation duration in milliseconds
 */
export function calculateAnimationDuration(animation: Animation): number {
  const frameDuration = 1000 / animation.fps
  
  return animation.frames.reduce((total, frame) => {
    return total + (frame.duration || frameDuration)
  }, 0)
}

/**
 * Get frame at specific time
 */
export function getFrameAtTime(animation: Animation, timeMs: number): number {
  const frameDuration = 1000 / animation.fps
  let elapsed = 0
  
  for (let i = 0; i < animation.frames.length; i++) {
    const duration = animation.frames[i].duration || frameDuration
    elapsed += duration
    
    if (elapsed > timeMs) {
      return i
    }
  }

  // If looping, wrap around
  if (animation.loop) {
    const totalDuration = calculateAnimationDuration(animation)
    const wrappedTime = timeMs % totalDuration
    return getFrameAtTime(animation, wrappedTime)
  }

  // Return last frame if not looping
  return animation.frames.length - 1
}

