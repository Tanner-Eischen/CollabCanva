/**
 * Generic JSON Exporter
 * Engine-agnostic export format with complete canvas data
 * Most important exporter - works with any game engine
 */

import type {
  Exporter,
  ExportResult,
  ExportValidation,
  ExportOptions,
  GenericExportOptions,
  ExportFile,
  ExportProgress,
  GenericCanvasExport,
  GenericLayer,
  GenericObject,
  GenericTilemap,
  GenericTilemapLayer,
  GenericTileset,
  GenericAsset,
  GenericAnimation,
  GenericAnimationFrame,
  ExportMetadata
} from '../../types/export'
import {
  fetchCanvasObjects,
  fetchTilemapData,
  fetchReferencedAssets,
  fetchAnimations,
  validateCanvasForExport,
  downloadAsset,
  blobToDataURL,
  createReadme,
  createSchemaFile,
  convertCoordinates,
  roundTo
} from './baseExporter'
import type { Shape } from '../../types/canvas'
import { DEFAULT_CANVAS_CONFIG } from '../../types/canvas'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '../../services/firebase'

export class GenericExporter implements Exporter {
  format: 'generic' = 'generic'
  name = 'Generic JSON'
  description = 'Engine-agnostic JSON export with complete canvas data'

  /**
   * Get default export options
   */
  getDefaultOptions(): GenericExportOptions {
    return {
      format: 'generic',
      includeAssets: true,
      prettyPrint: true,
      includeDocumentation: true,
      includeSchema: true,
      exportPNGLayers: false,
      exportResolution: 1,
      coordinateSystem: 'top-left'
    }
  }

  /**
   * Get supported features
   */
  getSupportedFeatures(): string[] {
    return [
      'All shape types',
      'Tilemaps with auto-tiling',
      'Sprite animations',
      'Layers and z-ordering',
      'Color and stroke properties',
      'Transformations (rotation, scale)',
      'Custom properties',
      'Asset embedding (data URLs)',
      'JSON schema documentation'
    ]
  }

  /**
   * Validate canvas before export
   */
  async validate(canvasId: string): Promise<ExportValidation> {
    return await validateCanvasForExport(canvasId)
  }

  /**
   * Export canvas to generic JSON format
   */
  async export(
    canvasId: string,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    const opts = options as GenericExportOptions
    const files: ExportFile[] = []
    const warnings: string[] = []

    try {
      // Stage 1: Validating
      onProgress?.({
        stage: 'validating',
        progress: 10,
        message: 'Validating canvas data...',
        warnings: [],
        errors: []
      })

      const validation = await this.validate(canvasId)
      warnings.push(...validation.warnings)

      if (!validation.valid) {
        return {
          success: false,
          files: [],
          warnings,
          instructions: '',
          metadata: {} as ExportMetadata
        }
      }

      // Stage 2: Collecting data
      onProgress?.({
        stage: 'collecting',
        progress: 30,
        message: 'Collecting canvas objects and assets...',
        warnings,
        errors: []
      })

      const [canvasDoc, objects, tilemapData, animations] = await Promise.all([
        getDoc(doc(firestore, 'canvases', canvasId)),
        fetchCanvasObjects(canvasId),
        fetchTilemapData(canvasId),
        fetchAnimations(canvasId)
      ])

      if (!canvasDoc.exists()) {
        throw new Error('Canvas not found')
      }

      const canvasData = canvasDoc.data()
      const userId = canvasData.ownerId || canvasData.userId

      // Fetch referenced assets
      const assetsMap = await fetchReferencedAssets(objects, userId)

      // Stage 3: Converting
      onProgress?.({
        stage: 'converting',
        progress: 50,
        message: 'Converting to generic format...',
        warnings,
        errors: []
      })

      // Build generic export structure
      const genericExport = await this.buildGenericExport(
        canvasId,
        canvasData,
        objects,
        tilemapData,
        assetsMap,
        animations,
        opts
      )

      // Stage 4: Packaging
      onProgress?.({
        stage: 'packaging',
        progress: 70,
        message: 'Creating export files...',
        warnings,
        errors: []
      })

      // Create main JSON file
      const jsonContent = opts.prettyPrint
        ? JSON.stringify(genericExport, null, 2)
        : JSON.stringify(genericExport)

      files.push({
        name: 'canvas.json',
        content: jsonContent,
        mimeType: 'application/json'
      })

      // Include JSON schema
      if (opts.includeSchema) {
        const schema = this.generateJSONSchema()
        files.push(createSchemaFile(schema))
      }

      // Include documentation
      if (opts.includeDocumentation) {
        const readme = createReadme('Generic JSON', this.generateInstructions())
        files.push(readme)
      }

      // Include assets folder with embedded images
      if (opts.includeAssets && assetsMap.size > 0) {
        onProgress?.({
          stage: 'packaging',
          progress: 80,
          message: 'Embedding asset images...',
          warnings,
          errors: []
        })

        for (const [assetId, asset] of assetsMap) {
          try {
            const blob = await downloadAsset(asset)
            const dataUrl = await blobToDataURL(blob)
            
            // Update asset URL in export to use data URL
            const assetInExport = genericExport.assets.find(a => a.id === assetId)
            if (assetInExport) {
              assetInExport.url = dataUrl
            }
          } catch (error) {
            warnings.push(`Failed to embed asset: ${asset.name}`)
          }
        }
      }

      // Export PNG layers if requested
      if (opts.exportPNGLayers) {
        warnings.push('PNG layer export not yet implemented')
      }

      // Complete
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Export complete!',
        warnings,
        errors: []
      })

      return {
        success: true,
        files,
        warnings,
        instructions: this.generateInstructions(),
        metadata: {
          format: 'generic',
          exportedAt: Date.now(),
          canvasId,
          canvasName: canvasData.name || 'Untitled Canvas',
          version: '1.0.0',
          objectCount: objects.length,
          hasAnimations: animations.size > 0,
          hasTilemap: !!tilemapData,
          exportOptions: opts
        }
      }
    } catch (error) {
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        warnings,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })

      return {
        success: false,
        files: [],
        warnings,
        instructions: '',
        metadata: {} as ExportMetadata
      }
    }
  }

  /**
   * Build generic export structure
   */
  private async buildGenericExport(
    canvasId: string,
    canvasData: any,
    objects: Shape[],
    tilemapData: any[] | null,
    assetsMap: Map<string, any>,
    animations: Map<string, any>,
    options: GenericExportOptions
  ): Promise<GenericCanvasExport> {
    const canvasWidth = DEFAULT_CANVAS_CONFIG.width
    const canvasHeight = DEFAULT_CANVAS_CONFIG.height

    // Group objects by z-index into layers
    const layers = this.groupObjectsIntoLayers(objects, canvasWidth, canvasHeight, options)

    // Convert tilemap if exists
    const tilemap = tilemapData ? this.convertTilemap(tilemapData, assetsMap) : undefined

    // Convert assets
    const assets = this.convertAssets(assetsMap)

    // Convert animations
    const exportAnimations = this.convertAnimations(animations)

    return {
      version: '1.0.0',
      metadata: {
        canvasId,
        canvasName: canvasData.name || 'Untitled Canvas',
        width: canvasWidth,
        height: canvasHeight,
        exportedAt: new Date().toISOString(),
        exportedBy: canvasData.ownerId || canvasData.userId || 'unknown',
        coordinateSystem: options.coordinateSystem
      },
      layers,
      tilemap,
      assets,
      animations: exportAnimations
    }
  }

  /**
   * Group objects into layers by z-index
   */
  private groupObjectsIntoLayers(
    objects: Shape[],
    canvasWidth: number,
    canvasHeight: number,
    options: GenericExportOptions
  ): GenericLayer[] {
    // Sort objects by z-index
    const sortedObjects = [...objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))

    // Group into layers (every 1000 z-index units = 1 layer)
    const layerMap = new Map<number, Shape[]>()
    
    sortedObjects.forEach(obj => {
      const layerIndex = Math.floor((obj.zIndex || 0) / 1000)
      if (!layerMap.has(layerIndex)) {
        layerMap.set(layerIndex, [])
      }
      layerMap.get(layerIndex)!.push(obj)
    })

    // Convert to generic layers
    const layers: GenericLayer[] = []
    
    layerMap.forEach((layerObjects, layerIndex) => {
      layers.push({
        id: `layer_${layerIndex}`,
        name: `Layer ${layerIndex}`,
        zIndex: layerIndex,
        visible: true,
        opacity: 1,
        objects: layerObjects.map(obj => this.convertObject(obj, canvasWidth, canvasHeight, options))
      })
    })

    return layers
  }

  /**
   * Convert shape to generic object
   */
  private convertObject(
    shape: Shape,
    canvasWidth: number,
    canvasHeight: number,
    options: GenericExportOptions
  ): GenericObject {
    const { x, y } = convertCoordinates(
      shape.x,
      shape.y,
      canvasWidth,
      canvasHeight,
      options.coordinateSystem
    )

    const obj: GenericObject = {
      id: shape.id,
      type: shape.type,
      x: roundTo(x),
      y: roundTo(y),
      width: roundTo(shape.width),
      height: roundTo(shape.height),
      rotation: roundTo(shape.rotation || 0)
    }

    // Add colors
    if (shape.fill) obj.fill = shape.fill
    if (shape.stroke) obj.stroke = shape.stroke
    if (shape.strokeWidth) obj.strokeWidth = shape.strokeWidth

    // Add text properties
    if (shape.type === 'text') {
      obj.text = shape.text
      obj.fontFamily = shape.fontFamily
      obj.fontSize = shape.fontSize
      obj.fontWeight = shape.fontWeight
      obj.fontStyle = shape.fontStyle
      obj.textAlign = shape.textAlign
      obj.textDecoration = shape.textDecoration
    }

    // Add sprite properties
    if (shape.type === 'animatedSprite') {
      obj.spriteSheetId = shape.spriteSheetId
      obj.animationId = shape.animationId
      obj.flipX = shape.flipX
      obj.flipY = shape.flipY
    }

    // Add path properties
    if (shape.type === 'path' || shape.type === 'line' || shape.type === 'polygon') {
      obj.points = shape.points
      obj.closed = shape.closed
    }

    // Add shape-specific properties
    if (shape.type === 'star') {
      obj.sides = shape.sides
    }
    if (shape.type === 'roundRect') {
      obj.cornerRadius = shape.cornerRadius
    }

    return obj
  }

  /**
   * Convert tilemap data
   */
  private convertTilemap(tilemapData: any[], assetsMap: Map<string, any>): GenericTilemap | undefined {
    if (!tilemapData || tilemapData.length === 0) return undefined

    // Find tilemap bounds
    let maxX = 0, maxY = 0
    const tileSize = 32 // Default, should come from tilemap metadata

    tilemapData.forEach(tile => {
      const coords = tile.id.split('_').map(Number)
      maxX = Math.max(maxX, coords[0])
      maxY = Math.max(maxY, coords[1])
    })

    // Create 2D array
    const data: (number | null)[][] = Array(maxY + 1).fill(null).map(() => Array(maxX + 1).fill(null))

    tilemapData.forEach(tile => {
      const coords = tile.id.split('_').map(Number)
      data[coords[1]][coords[0]] = tile.tileIndex || 0
    })

    // Convert tilesets
    const tilesets = this.convertTilesets(assetsMap)

    return {
      width: maxX + 1,
      height: maxY + 1,
      tileWidth: tileSize,
      tileHeight: tileSize,
      layers: [{
        id: 'tilemap_layer_0',
        name: 'Tilemap Layer',
        data,
        visible: true,
        opacity: 1
      }],
      tilesets
    }
  }

  /**
   * Convert tilesets
   */
  private convertTilesets(assetsMap: Map<string, any>): GenericTileset[] {
    const tilesets: GenericTileset[] = []

    assetsMap.forEach((asset, id) => {
      if (asset.type === 'tileset' && asset.tilesetMetadata) {
        tilesets.push({
          id,
          name: asset.name,
          imageUrl: asset.url,
          tileWidth: asset.tilesetMetadata.tileWidth,
          tileHeight: asset.tilesetMetadata.tileHeight,
          tileCount: asset.tilesetMetadata.tileCount,
          columns: asset.tilesetMetadata.columns,
          spacing: asset.tilesetMetadata.spacing || 0,
          margin: asset.tilesetMetadata.margin || 0,
          autoTileMapping: asset.tilesetMetadata.autoTileMapping
        })
      }
    })

    return tilesets
  }

  /**
   * Convert assets
   */
  private convertAssets(assetsMap: Map<string, any>): GenericAsset[] {
    const assets: GenericAsset[] = []

    assetsMap.forEach((asset, id) => {
      assets.push({
        id,
        name: asset.name,
        type: asset.type,
        url: asset.url, // Will be replaced with data URL if includeAssets is true
        width: asset.metadata.width,
        height: asset.metadata.height,
        metadata: asset.spriteSheetMetadata || asset.tilesetMetadata
      })
    })

    return assets
  }

  /**
   * Convert animations
   */
  private convertAnimations(animations: Map<string, any>): GenericAnimation[] {
    const result: GenericAnimation[] = []

    animations.forEach((anim, id) => {
      result.push({
        id,
        name: anim.name,
        spriteSheetId: anim.spriteSheetId,
        fps: anim.fps || 12,
        loop: anim.loop !== false,
        frames: anim.frames.map((f: any) => ({
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          duration: f.duration
        }))
      })
    })

    return result
  }

  /**
   * Generate JSON schema
   */
  private generateJSONSchema(): object {
    return {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "CollabCanva Generic Export Format",
      "version": "1.0.0",
      "description": "Engine-agnostic canvas export format",
      "type": "object",
      "properties": {
        "version": { "type": "string" },
        "metadata": { "type": "object" },
        "layers": { "type": "array" },
        "tilemap": { "type": "object" },
        "assets": { "type": "array" },
        "animations": { "type": "array" }
      },
      "required": ["version", "metadata", "layers", "assets"]
    }
  }

  /**
   * Generate import instructions
   */
  private generateInstructions(): string {
    return `## Generic JSON Export - Import Instructions

This export contains a complete, engine-agnostic representation of your canvas.

### File Structure
- \`canvas.json\` - Main canvas data
- \`schema.json\` - JSON schema definition
- \`README.md\` - This file

### Format Overview
The JSON file contains:
- **Metadata**: Canvas dimensions, export info
- **Layers**: Objects organized by z-index
- **Objects**: All shapes, sprites, text with complete properties
- **Tilemap**: 2D tile data (if present)
- **Assets**: Referenced images as data URLs or paths
- **Animations**: Frame-by-frame animation definitions

### Coordinate System
By default, coordinates use **top-left origin** (0,0 = top-left corner).
You can configure this to use center origin during export.

### Importing into Game Engines

#### **Godot**
1. Parse the JSON in a GDScript
2. Create Node2D/Sprite2D for each object
3. Use TileMap for tilemap data
4. Load textures from data URLs or external files

#### **Unity**
1. Use JsonUtility or Newtonsoft.Json to parse
2. Create GameObjects with SpriteRenderer for each object
3. Use Tilemap component for tilemap data
4. Convert data URLs to Texture2D

#### **Phaser**
1. Load JSON in scene \`preload()\`
2. Create sprites in \`create()\`
3. Use Phaser.Tilemaps for tilemap data
4. Load images from data URLs

#### **Custom Engine**
This format is designed to be self-documenting and easy to parse.
All measurements are in pixels, colors are in RGBA hex format.

### Color Format
Colors are represented as RGBA hex strings:
- \`#FF0000FF\` = Red, fully opaque
- \`#00FF0080\` = Green, 50% transparent

### Asset Embedding
Assets can be embedded as data URLs (base64) or external file paths.
Data URLs allow single-file exports but increase file size.

### Need Help?
Visit https://collabcanva.dev/docs/export for more examples and tutorials.
`
  }
}

// Export singleton instance
export const genericExporter = new GenericExporter()

