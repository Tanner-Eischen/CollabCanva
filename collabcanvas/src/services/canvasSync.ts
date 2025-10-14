import { ref, set, update, remove, onValue, off } from 'firebase/database'
import { db } from './firebase'
import type { CanvasObject } from '../types/firebase'
import type { Shape } from '../types/canvas'

/**
 * Compress shape data for Firebase storage
 * Uses short keys to reduce bandwidth: t, x, y, w, h, txt
 * NO color property stored (all shapes are blue #3B82F6)
 */
function compressShape(shape: Shape): CanvasObject {
  const compressed: CanvasObject = {
    t: shape.type === 'rectangle' ? 'r' : shape.type === 'circle' ? 'c' : 't',
    x: Math.round(shape.x),
    y: Math.round(shape.y),
    w: Math.round(shape.width),
    h: Math.round(shape.height),
  }

  // Add text content for text shapes
  if (shape.type === 'text' && shape.text) {
    compressed.txt = shape.text
  }

  return compressed
}

/**
 * Decompress Firebase data to client Shape format
 * Converts short keys back to full property names
 */
function decompressShape(id: string, data: CanvasObject): Shape {
  const shape: Shape = {
    id,
    type: data.t === 'r' ? 'rectangle' : data.t === 'c' ? 'circle' : 'text',
    x: data.x,
    y: data.y,
    width: data.w,
    height: data.h,
  }

  // Add text content for text shapes
  if (data.txt) {
    shape.text = data.txt
  }

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
 * Only sends changed properties (position for MVP)
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
    // Note: width, height, and type should not change in MVP
    
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
 * Sync selection state to presence
 * Selection is stored per-user in presence/${userId}/sel
 */
export async function syncSelection(
  userId: string,
  selectedId: string | null
): Promise<void> {
  try {
    const selectionRef = ref(db, `presence/${userId}/sel`)
    await set(selectionRef, selectedId)
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
        if (
          prevData.x !== shapeData.x ||
          prevData.y !== shapeData.y
        ) {
          if (callbacks.onUpdate) {
            const updates: Partial<Shape> = {}
            if (prevData.x !== shapeData.x) updates.x = shapeData.x
            if (prevData.y !== shapeData.y) updates.y = shapeData.y
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

