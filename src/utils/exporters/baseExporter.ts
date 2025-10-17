/**
 * Base Exporter Utilities
 * Common functions used by all exporters
 */

import type { Shape } from '../../types/canvas'
import type { Asset } from '../../types/asset'
import type { Animation } from '../../types/animation'
import type { ExportFile, ExportValidation } from '../../types/export'
import { firestore, storage } from '../../services/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { ref, getBlob } from 'firebase/storage'

/**
 * Fetch all objects from a canvas
 */
export async function fetchCanvasObjects(canvasId: string): Promise<Shape[]> {
  const objectsRef = collection(firestore, 'canvases', canvasId, 'objects')
  const snapshot = await getDocs(objectsRef)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Shape[]
}

/**
 * Fetch tilemap data from a canvas
 */
export async function fetchTilemapData(canvasId: string) {
  try {
    const tilesRef = collection(firestore, 'tilemaps', canvasId, 'tiles')
    const snapshot = await getDocs(tilesRef)
    
    if (snapshot.empty) {
      return null
    }

    const tiles: any[] = []
    snapshot.forEach(doc => {
      tiles.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return tiles
  } catch (error) {
    console.warn('No tilemap data found:', error)
    return null
  }
}

/**
 * Fetch assets referenced by canvas objects
 */
export async function fetchReferencedAssets(
  objects: Shape[],
  userId: string
): Promise<Map<string, Asset>> {
  const assetIds = new Set<string>()
  
  // Collect asset IDs from objects
  objects.forEach(obj => {
    if (obj.spriteSheetId) assetIds.add(obj.spriteSheetId)
    if (obj.animationId) {
      // We'll need to fetch animations to get their sprite sheet IDs
    }
  })

  const assets = new Map<string, Asset>()

  // Fetch each asset
  for (const assetId of assetIds) {
    try {
      const assetsRef = collection(firestore, 'assets')
      const q = query(assetsRef, where('userId', '==', userId), where('id', '==', assetId))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const assetData = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as Asset
        assets.set(assetId, assetData)
      }
    } catch (error) {
      console.warn(`Failed to fetch asset ${assetId}:`, error)
    }
  }

  return assets
}

/**
 * Fetch animations from canvas
 */
export async function fetchAnimations(canvasId: string): Promise<Map<string, Animation>> {
  try {
    const animationsRef = collection(firestore, 'animations', canvasId, 'items')
    const snapshot = await getDocs(animationsRef)
    
    const animations = new Map<string, Animation>()
    snapshot.forEach(doc => {
      animations.set(doc.id, {
        id: doc.id,
        ...doc.data()
      } as Animation)
    })

    return animations
  } catch (error) {
    console.warn('Failed to fetch animations:', error)
    return new Map()
  }
}

/**
 * Download asset as blob
 */
export async function downloadAsset(asset: Asset): Promise<Blob> {
  try {
    const assetRef = ref(storage, asset.url)
    const blob = await getBlob(assetRef)
    return blob
  } catch (error) {
    console.error('Failed to download asset:', error)
    throw new Error(`Failed to download asset: ${asset.name}`)
  }
}

/**
 * Convert blob to data URL
 */
export async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Create a ZIP file from export files
 */
export async function createZipFromFiles(files: ExportFile[]): Promise<Blob> {
  // Dynamically import JSZip (we'll need to install this)
  const JSZip = (await import('jszip')).default
  
  const zip = new JSZip()
  
  for (const file of files) {
    const path = file.path ? `${file.path}/${file.name}` : file.name
    
    if (typeof file.content === 'string') {
      zip.file(path, file.content)
    } else {
      zip.file(path, file.content)
    }
  }

  return await zip.generateAsync({ type: 'blob' })
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Validate canvas has required data
 */
export async function validateCanvasForExport(canvasId: string): Promise<ExportValidation> {
  const errors: string[] = []
  const warnings: string[] = []
  const unsupportedFeatures: string[] = []

  try {
    // Check if canvas exists
    const objects = await fetchCanvasObjects(canvasId)
    
    if (objects.length === 0) {
      warnings.push('Canvas is empty - no objects to export')
    }

    // Check for unsupported features
    objects.forEach(obj => {
      if (obj.type === 'path') {
        unsupportedFeatures.push('Freehand paths (will be exported as generic objects)')
      }
      if (obj.type === 'roundRect') {
        unsupportedFeatures.push('Rounded rectangles (may appear as regular rectangles in some engines)')
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      unsupportedFeatures: Array.from(new Set(unsupportedFeatures))
    }
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown error during validation'],
      warnings,
      unsupportedFeatures
    }
  }
}

/**
 * Convert RGBA hex to RGB array [0-255, 0-255, 0-255]
 */
export function hexToRgb(hex: string): [number, number, number] {
  // Remove # if present
  hex = hex.replace(/^#/, '')
  
  // Parse hex (can be RRGGBB or RRGGBBAA)
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return [r, g, b]
}

/**
 * Convert RGBA hex to normalized RGBA [0-1, 0-1, 0-1, 0-1]
 */
export function hexToRgbaNormalized(hex: string): [number, number, number, number] {
  // Remove # if present
  hex = hex.replace(/^#/, '')
  
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1.0
  
  return [r, g, b, a]
}

/**
 * Sanitize name for use as identifier (remove special characters)
 */
export function sanitizeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^[0-9]/, '_$&') // Don't start with number
    .replace(/_+/g, '_') // Remove duplicate underscores
    .substring(0, 64) // Limit length
}

/**
 * Generate unique object name
 */
export function generateObjectName(shape: Shape, index: number): string {
  const baseName = shape.type.charAt(0).toUpperCase() + shape.type.slice(1)
  return `${baseName}_${index}`
}

/**
 * Create README file with import instructions
 */
export function createReadme(format: string, instructions: string): ExportFile {
  return {
    name: 'README.md',
    content: `# Canvas Export - ${format}\n\n${instructions}\n\nExported at: ${new Date().toISOString()}\n`,
    mimeType: 'text/markdown'
  }
}

/**
 * Create JSON schema file
 */
export function createSchemaFile(schema: object): ExportFile {
  return {
    name: 'schema.json',
    content: JSON.stringify(schema, null, 2),
    mimeType: 'application/json'
  }
}

/**
 * Convert canvas coordinate system
 * CollabCanva uses top-left origin, some engines use center origin
 */
export function convertCoordinates(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  targetSystem: 'top-left' | 'center'
): { x: number; y: number } {
  if (targetSystem === 'center') {
    return {
      x: x - canvasWidth / 2,
      y: y - canvasHeight / 2
    }
  }
  return { x, y }
}

/**
 * Round number to N decimal places
 */
export function roundTo(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals)
  return Math.round(value * multiplier) / multiplier
}

