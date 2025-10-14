import { ref, set, update, remove, onValue, off } from 'firebase/database'
import { db } from './firebase'
import type { CanvasObject } from '../types/firebase'
import type { Shape, ShapeType } from '../types/canvas'

/**
 * Compress shape data for Firebase storage
 * Uses short keys to reduce bandwidth: t, x, y, w, h, txt, f, s, sw
 * Phase 3: Now includes color properties (fill, stroke, strokeWidth)
 */
function compressShape(shape: Shape): CanvasObject {
  // Determine type code (PR-16: Added new shape types)
  let typeCode: 'r' | 'c' | 't' | 'l' | 'pg' | 'st' | 'rr' = 'r'
  switch (shape.type) {
    case 'rectangle': typeCode = 'r'; break
    case 'circle': typeCode = 'c'; break
    case 'text': typeCode = 't'; break
    case 'line': typeCode = 'l'; break
    case 'polygon': typeCode = 'pg'; break
    case 'star': typeCode = 'st'; break
    case 'roundRect': typeCode = 'rr'; break
  }

  const compressed: CanvasObject = {
    t: typeCode,
    x: Math.round(shape.x),
    y: Math.round(shape.y),
    w: Math.round(shape.width),
    h: Math.round(shape.height),
    f: shape.fill, // fill color (RGBA hex)
  }

  // Add text content for text shapes
  if (shape.type === 'text' && shape.text) {
    compressed.txt = shape.text
  }

  // Add rotation if present (backward compatibility)
  if (shape.rotation !== undefined) {
    compressed.rot = Math.round(shape.rotation)
  }

  // Add stroke properties if present
  if (shape.stroke !== undefined) {
    compressed.s = shape.stroke
  }
  if (shape.strokeWidth !== undefined) {
    compressed.sw = Math.round(shape.strokeWidth)
  }

  // PR-16: Add line-specific properties
  if (shape.type === 'line') {
    if (shape.points) {
      compressed.pts = shape.points.map(Math.round)
    }
    if (shape.arrows) {
      compressed.arr = {
        s: shape.arrows.start,
        e: shape.arrows.end,
      }
    }
  }

  // PR-16: Add polygon/star sides
  if ((shape.type === 'polygon' || shape.type === 'star') && shape.sides !== undefined) {
    compressed.sides = shape.sides
  }

  // PR-16: Add rounded rect corner radius
  if (shape.type === 'roundRect' && shape.cornerRadius !== undefined) {
    compressed.cr = Math.round(shape.cornerRadius)
  }

  // PR-17: Add z-index
  if (shape.zIndex !== undefined) {
    compressed.z = shape.zIndex
  }

  return compressed
}

/**
 * Decompress Firebase data to client Shape format
 * Converts short keys back to full property names
 * Phase 3: Includes color properties with defaults for backward compatibility
 */
function decompressShape(id: string, data: CanvasObject): Shape {
  // Determine type from code (PR-16: Added new shape types)
  let type: ShapeType = 'rectangle'
  switch (data.t) {
    case 'r': type = 'rectangle'; break
    case 'c': type = 'circle'; break
    case 't': type = 'text'; break
    case 'l': type = 'line'; break
    case 'pg': type = 'polygon'; break
    case 'st': type = 'star'; break
    case 'rr': type = 'roundRect'; break
  }

  const shape: Shape = {
    id,
    type,
    x: data.x,
    y: data.y,
    width: data.w,
    height: data.h,
    rotation: data.rot ?? 0, // default to 0 if not present (backward compatibility)
    fill: data.f ?? '#3B82F6FF', // default blue if not present (backward compatibility)
  }

  // Add text content for text shapes
  if (data.txt) {
    shape.text = data.txt
  }

  // Add stroke properties if present
  if (data.s) {
    shape.stroke = data.s
  }
  if (data.sw !== undefined) {
    shape.strokeWidth = data.sw
  }

  // PR-16: Add line-specific properties
  if (data.pts) {
    shape.points = data.pts
  }
  if (data.arr) {
    shape.arrows = {
      start: data.arr.s,
      end: data.arr.e,
    }
  }

  // PR-16: Add polygon/star sides
  if (data.sides !== undefined) {
    shape.sides = data.sides
  }

  // PR-16: Add rounded rect corner radius
  if (data.cr !== undefined) {
    shape.cornerRadius = data.cr
  }

  // PR-17: Add z-index (default to current timestamp if not present)
  shape.zIndex = data.z ?? Date.now()

  return shape
}

/**
 * Sync shape creation to Firebase
 */
export async function syncCreateShape(
  canvasId: string,
  shapeId: string,
  shape: Shape
): Promise<void> {
  try {
    const shapeRef = ref(db, `canvas/${canvasId}/objects/${shapeId}`)
    const compressed = compressShape(shape)
    await set(shapeRef, compressed)
  } catch (error) {
    console.error('Failed to sync create shape:', error)
    throw error
  }
}

/**
 * Sync shape updates to Firebase
 * Supports position, dimensions, rotation, and color updates (Phase 3)
 */
export async function syncUpdateShape(
  canvasId: string,
  shapeId: string,
  updates: Partial<Shape>
): Promise<void> {
  try {
    const shapeRef = ref(db, `canvas/${canvasId}/objects/${shapeId}`)
    
    // Build update object with compressed keys
    const compressed: Partial<CanvasObject> = {}
    
    if (updates.x !== undefined) {
      compressed.x = Math.round(updates.x)
    }
    if (updates.y !== undefined) {
      compressed.y = Math.round(updates.y)
    }
    if (updates.width !== undefined) {
      compressed.w = Math.round(updates.width)
    }
    if (updates.height !== undefined) {
      compressed.h = Math.round(updates.height)
    }
    if (updates.rotation !== undefined) {
      compressed.rot = Math.round(updates.rotation)
    }
    // Phase 3: Color properties
    if (updates.fill !== undefined) {
      compressed.f = updates.fill
    }
    if (updates.stroke !== undefined) {
      compressed.s = updates.stroke
    }
    if (updates.strokeWidth !== undefined) {
      compressed.sw = Math.round(updates.strokeWidth)
    }
    // PR-17: Z-index
    if (updates.zIndex !== undefined) {
      compressed.z = updates.zIndex
    }
    
    await update(shapeRef, compressed)
  } catch (error) {
    console.error('Failed to sync update shape:', error)
    throw error
  }
}

/**
 * Sync shape deletion to Firebase
 */
export async function syncDeleteShape(
  canvasId: string,
  shapeId: string
): Promise<void> {
  try {
    const shapeRef = ref(db, `canvas/${canvasId}/objects/${shapeId}`)
    await remove(shapeRef)
  } catch (error) {
    console.error('Failed to sync delete shape:', error)
    throw error
  }
}

/**
 * Sync bulk move operation to Firebase
 * Updates multiple shapes' positions at once
 */
export async function syncBulkMove(
  canvasId: string,
  updates: Record<string, { x: number; y: number }>
): Promise<void> {
  try {
    // Build a flat update object for Firebase
    const firebaseUpdates: Record<string, number> = {}
    
    Object.entries(updates).forEach(([shapeId, position]) => {
      firebaseUpdates[`canvas/${canvasId}/objects/${shapeId}/x`] = Math.round(position.x)
      firebaseUpdates[`canvas/${canvasId}/objects/${shapeId}/y`] = Math.round(position.y)
    })
    
    // Perform atomic multi-path update
    const dbRef = ref(db)
    await update(dbRef, firebaseUpdates)
  } catch (error) {
    console.error('Failed to sync bulk move:', error)
    throw error
  }
}

/**
 * Sync bulk delete operation to Firebase
 * Deletes multiple shapes at once
 */
export async function syncBulkDelete(
  canvasId: string,
  shapeIds: string[]
): Promise<void> {
  try {
    // Build a flat update object with null values (deletes in Firebase)
    const firebaseUpdates: Record<string, null> = {}
    
    shapeIds.forEach((shapeId) => {
      firebaseUpdates[`canvas/${canvasId}/objects/${shapeId}`] = null
    })
    
    // Perform atomic multi-path delete
    const dbRef = ref(db)
    await update(dbRef, firebaseUpdates)
  } catch (error) {
    console.error('Failed to sync bulk delete:', error)
    throw error
  }
}

/**
 * Sync batch create operation to Firebase (PR-13)
 * Creates multiple shapes at once for paste/duplicate operations
 */
export async function syncBatchCreate(
  canvasId: string,
  shapes: Shape[]
): Promise<void> {
  try {
    // Build a flat update object for all shapes
    const firebaseUpdates: Record<string, CanvasObject> = {}
    
    shapes.forEach((shape) => {
      const compressed = compressShape(shape)
      firebaseUpdates[`canvas/${canvasId}/objects/${shape.id}`] = compressed
    })
    
    // Perform atomic multi-path create
    const dbRef = ref(db)
    await update(dbRef, firebaseUpdates)
  } catch (error) {
    console.error('Failed to sync batch create:', error)
    throw error
  }
}

/**
 * Sync z-index change to Firebase (PR-17)
 * Updates z-index for a single shape
 */
export async function syncZIndex(
  canvasId: string,
  shapeId: string,
  zIndex: number
): Promise<void> {
  try {
    const zIndexRef = ref(db, `canvas/${canvasId}/objects/${shapeId}/z`)
    await set(zIndexRef, zIndex)
  } catch (error) {
    console.error('Failed to sync z-index:', error)
    throw error
  }
}

/**
 * Sync selection state to presence
 * Selection is stored per-user in presence/${userId}/sel as an array
 */
export async function syncSelection(
  userId: string,
  selectedIds: string[] | null
): Promise<void> {
  try {
    const selectionRef = ref(db, `presence/${userId}/sel`)
    await set(selectionRef, selectedIds)
  } catch (error) {
    console.error('Failed to sync selection:', error)
    throw error
  }
}

/**
 * Subscribe to canvas object changes
 * Calls onCreate, onUpdate, onDelete callbacks for respective operations
 */
export function subscribeToCanvas(
  canvasId: string,
  callbacks: {
    onCreate?: (shape: Shape) => void
    onUpdate?: (shapeId: string, updates: Partial<Shape>) => void
    onDelete?: (shapeId: string) => void
  }
): () => void {
  const objectsRef = ref(db, `canvas/${canvasId}/objects`)
  
  // Track previous state to detect changes
  let previousShapes = new Map<string, CanvasObject>()

  const handleValue = (snapshot: any) => {
    const data = snapshot.val() as { [key: string]: CanvasObject } | null
    const currentShapes = new Map<string, CanvasObject>()

    if (data) {
      Object.entries(data).forEach(([id, shapeData]) => {
        currentShapes.set(id, shapeData)
      })
    }

    // Detect creates and updates
    currentShapes.forEach((shapeData, id) => {
      if (!previousShapes.has(id)) {
        // New shape created
        if (callbacks.onCreate) {
          const shape = decompressShape(id, shapeData)
          callbacks.onCreate(shape)
        }
      } else {
        // Check if shape was updated
        const prevData = previousShapes.get(id)!
        const hasChanges =
          prevData.x !== shapeData.x ||
          prevData.y !== shapeData.y ||
          prevData.w !== shapeData.w ||
          prevData.h !== shapeData.h ||
          prevData.rot !== shapeData.rot ||
          prevData.f !== shapeData.f ||
          prevData.s !== shapeData.s ||
          prevData.sw !== shapeData.sw ||
          prevData.z !== shapeData.z
        
        if (hasChanges) {
          if (callbacks.onUpdate) {
            const updates: Partial<Shape> = {}
            if (prevData.x !== shapeData.x) updates.x = shapeData.x
            if (prevData.y !== shapeData.y) updates.y = shapeData.y
            if (prevData.w !== shapeData.w) updates.width = shapeData.w
            if (prevData.h !== shapeData.h) updates.height = shapeData.h
            if (prevData.rot !== shapeData.rot) updates.rotation = shapeData.rot ?? 0
            // Phase 3: Color changes
            if (prevData.f !== shapeData.f) updates.fill = shapeData.f
            if (prevData.s !== shapeData.s) updates.stroke = shapeData.s
            if (prevData.sw !== shapeData.sw) updates.strokeWidth = shapeData.sw
            // Phase 3 PR-17: Z-index changes
            if (prevData.z !== shapeData.z) updates.zIndex = shapeData.z ?? Date.now()
            callbacks.onUpdate(id, updates)
          }
        }
      }
    })

    // Detect deletes
    previousShapes.forEach((_, id) => {
      if (!currentShapes.has(id)) {
        // Shape was deleted
        if (callbacks.onDelete) {
          callbacks.onDelete(id)
        }
      }
    })

    previousShapes = currentShapes
  }

  onValue(objectsRef, handleValue)

  // Return unsubscribe function
  return () => {
    off(objectsRef, 'value', handleValue)
  }
}

