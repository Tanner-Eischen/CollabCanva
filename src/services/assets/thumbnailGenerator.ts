/**
 * Thumbnail Generator Service
 * 
 * Creates context-aware thumbnails for different asset types:
 * - Tilesets: show grid of tiles
 * - Sprite sheets: show frame layout
 * - Props: show evenly spaced samples
 */

import type { TilesetMetadata, SpriteSheetMetadata } from '../../types/asset'

export interface ThumbnailOptions {
  maxSize?: number // default: 200
  quality?: number // JPEG quality 0-1, default: 0.9
  format?: 'png' | 'jpeg' | 'webp' // default: 'png'
  addBadges?: boolean // add overlay badges for tile count, etc.
}

export interface ThumbnailResult {
  thumbnail: string // data URL
  preview?: string // larger preview (400x400)
  icon?: string // small icon (64x64)
}

/**
 * Generate thumbnails for an image file
 */
export async function generateThumbnails(
  file: File,
  assetType: 'tileset' | 'spritesheet' | 'image',
  metadata?: TilesetMetadata | SpriteSheetMetadata,
  options: ThumbnailOptions = {}
): Promise<ThumbnailResult> {
  const {
    maxSize = 200,
    quality = 0.9,
    format = 'png',
    addBadges = true
  } = options

  // Load image
  const img = await loadImage(file)

  // Generate based on asset type
  let thumbnail: string
  let preview: string
  let icon: string

  if (assetType === 'tileset' && metadata && 'tileWidth' in metadata) {
    // Tileset: show grid of tiles
    thumbnail = await generateTilesetThumbnail(img, metadata, maxSize, format, quality, addBadges)
    preview = await generateTilesetThumbnail(img, metadata, 400, format, quality, false)
    icon = await generateTilesetThumbnail(img, metadata, 64, format, quality, false)
  } else if (assetType === 'spritesheet' && metadata && 'frameWidth' in metadata) {
    // Sprite sheet: show frame layout
    thumbnail = await generateSpriteSheetThumbnail(img, metadata, maxSize, format, quality, addBadges)
    preview = await generateSpriteSheetThumbnail(img, metadata, 400, format, quality, false)
    icon = await generateSpriteSheetThumbnail(img, metadata, 64, format, quality, false)
  } else {
    // Generic image: simple resize
    thumbnail = await generateSimpleThumbnail(img, maxSize, format, quality)
    preview = await generateSimpleThumbnail(img, 400, format, quality)
    icon = await generateSimpleThumbnail(img, 64, format, quality)
  }

  return {
    thumbnail,
    preview,
    icon
  }
}

/**
 * Generate tileset thumbnail showing grid of tiles
 */
async function generateTilesetThumbnail(
  img: HTMLImageElement,
  metadata: TilesetMetadata,
  maxSize: number,
  format: string,
  quality: number,
  addBadges: boolean
): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  const { tileWidth, tileHeight, columns, rows, spacing = 0, margin = 0 } = metadata

  // Determine how many tiles to show (4x4 grid max)
  const displayColumns = Math.min(columns, 4)
  const displayRows = Math.min(rows, 4)

  // Calculate canvas size
  const gridWidth = displayColumns * tileWidth
  const gridHeight = displayRows * tileHeight
  const scale = Math.min(maxSize / gridWidth, maxSize / gridHeight)

  canvas.width = gridWidth * scale
  canvas.height = gridHeight * scale

  // Use nearest-neighbor for pixel art
  ctx.imageSmoothingEnabled = false

  // Draw grid of tiles
  for (let row = 0; row < displayRows; row++) {
    for (let col = 0; col < displayColumns; col++) {
      // Calculate source position (with spacing/margin)
      const srcX = margin + col * (tileWidth + spacing)
      const srcY = margin + row * (tileHeight + spacing)

      // Calculate destination position
      const destX = col * tileWidth * scale
      const destY = row * tileHeight * scale

      // Draw tile
      ctx.drawImage(
        img,
        srcX, srcY, tileWidth, tileHeight,
        destX, destY, tileWidth * scale, tileHeight * scale
      )
    }
  }

  // Add badges
  if (addBadges) {
    // Tile count badge
    const tileCount = metadata.tileCount
    drawBadge(ctx, canvas.width - 10, 10, `${tileCount}`, '#3b82f6')

    // Auto-tile indicator
    if (metadata.features?.autotile) {
      drawIcon(ctx, 10, 10, '🔲', 20)
    }
  }

  return canvasToDataURL(canvas, format, quality)
}

/**
 * Generate sprite sheet thumbnail showing frame layout
 */
async function generateSpriteSheetThumbnail(
  img: HTMLImageElement,
  metadata: SpriteSheetMetadata,
  maxSize: number,
  format: string,
  quality: number,
  addBadges: boolean
): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  // Show first 16 frames in a grid
  const frameWidth = metadata.frameWidth || img.width
  const frameHeight = metadata.frameHeight || img.height
  const columns = metadata.columns || 1
  const framesToShow = Math.min(metadata.frameCount || 1, 16)

  // Calculate grid layout (up to 4x4)
  const gridCols = Math.min(Math.ceil(Math.sqrt(framesToShow)), 4)
  const gridRows = Math.ceil(framesToShow / gridCols)

  // Calculate canvas size
  const gridWidth = gridCols * frameWidth
  const gridHeight = gridRows * frameHeight
  const scale = Math.min(maxSize / gridWidth, maxSize / gridHeight)

  canvas.width = gridWidth * scale
  canvas.height = gridHeight * scale

  ctx.imageSmoothingEnabled = false

  // Draw frames
  for (let i = 0; i < framesToShow; i++) {
    const gridCol = i % gridCols
    const gridRow = Math.floor(i / gridCols)

    // Calculate source position in sprite sheet
    const srcCol = i % columns
    const srcRow = Math.floor(i / columns)
    const srcX = srcCol * (frameWidth + (metadata.spacing || 0)) + (metadata.margin || 0)
    const srcY = srcRow * (frameHeight + (metadata.spacing || 0)) + (metadata.margin || 0)

    // Calculate destination position
    const destX = gridCol * frameWidth * scale
    const destY = gridRow * frameHeight * scale

    // Draw frame
    ctx.drawImage(
      img,
      srcX, srcY, frameWidth, frameHeight,
      destX, destY, frameWidth * scale, frameHeight * scale
    )
  }

  // Add badges
  if (addBadges && metadata.frameCount) {
    drawBadge(ctx, canvas.width - 10, 10, `${metadata.frameCount}f`, '#10b981')
  }

  return canvasToDataURL(canvas, format, quality)
}

/**
 * Generate simple thumbnail (resize and crop)
 */
async function generateSimpleThumbnail(
  img: HTMLImageElement,
  maxSize: number,
  format: string,
  quality: number
): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  // Calculate dimensions maintaining aspect ratio
  const scale = Math.min(maxSize / img.width, maxSize / img.height)
  canvas.width = img.width * scale
  canvas.height = img.height * scale

  // Draw image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  return canvasToDataURL(canvas, format, quality)
}

/**
 * Draw a badge with text
 */
function drawBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  bgColor: string
) {
  const padding = 4
  const fontSize = 12

  // Set font
  ctx.font = `bold ${fontSize}px sans-serif`
  const textWidth = ctx.measureText(text).width

  // Draw background
  const badgeWidth = textWidth + padding * 2
  const badgeHeight = fontSize + padding * 2

  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.roundRect(x - badgeWidth, y, badgeWidth, badgeHeight, 4)
  ctx.fill()

  // Draw text
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x - badgeWidth / 2, y + badgeHeight / 2)
}

/**
 * Draw an emoji icon
 */
function drawIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  emoji: string,
  size: number
) {
  ctx.font = `${size}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  
  // Add shadow for better visibility
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 2
  ctx.fillText(emoji, x, y)
  ctx.shadowColor = 'transparent'
}

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Convert canvas to data URL
 */
function canvasToDataURL(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): string {
  if (format === 'png') {
    return canvas.toDataURL('image/png')
  } else if (format === 'jpeg') {
    return canvas.toDataURL('image/jpeg', quality)
  } else if (format === 'webp') {
    return canvas.toDataURL('image/webp', quality)
  } else {
    return canvas.toDataURL('image/png')
  }
}

/**
 * Generate thumbnail from data URL
 * (for existing uploaded images)
 */
export async function generateThumbnailFromUrl(
  imageUrl: string,
  assetType: 'tileset' | 'spritesheet' | 'image',
  metadata?: TilesetMetadata | SpriteSheetMetadata,
  options: ThumbnailOptions = {}
): Promise<ThumbnailResult> {
  // Load image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = imageUrl
  })

  // Generate thumbnails
  const {
    maxSize = 200,
    quality = 0.9,
    format = 'png',
    addBadges = true
  } = options

  let thumbnail: string
  let preview: string
  let icon: string

  if (assetType === 'tileset' && metadata && 'tileWidth' in metadata) {
    thumbnail = await generateTilesetThumbnail(img, metadata, maxSize, format, quality, addBadges)
    preview = await generateTilesetThumbnail(img, metadata, 400, format, quality, false)
    icon = await generateTilesetThumbnail(img, metadata, 64, format, quality, false)
  } else if (assetType === 'spritesheet' && metadata && 'frameWidth' in metadata) {
    thumbnail = await generateSpriteSheetThumbnail(img, metadata, maxSize, format, quality, addBadges)
    preview = await generateSpriteSheetThumbnail(img, metadata, 400, format, quality, false)
    icon = await generateSpriteSheetThumbnail(img, metadata, 64, format, quality, false)
  } else {
    thumbnail = await generateSimpleThumbnail(img, maxSize, format, quality)
    preview = await generateSimpleThumbnail(img, 400, format, quality)
    icon = await generateSimpleThumbnail(img, 64, format, quality)
  }

  return {
    thumbnail,
    preview,
    icon
  }
}

