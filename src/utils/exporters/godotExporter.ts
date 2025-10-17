/**
 * Godot Engine Exporter
 * Exports canvas to Godot .tscn scene format (text-based scene file)
 * Supports Godot 3.x and 4.x
 */

import type {
  Exporter,
  ExportResult,
  ExportValidation,
  ExportOptions,
  GodotExportOptions,
  ExportFile,
  ExportProgress,
  ExportMetadata
} from '../../types/export'
import {
  fetchCanvasObjects,
  fetchTilemapData,
  fetchReferencedAssets,
  fetchAnimations,
  validateCanvasForExport,
  downloadAsset,
  hexToRgbaNormalized,
  sanitizeName,
  generateObjectName,
  createReadme,
  roundTo
} from './baseExporter'
import type { Shape } from '../../types/canvas'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '../../services/firebase'

export class GodotExporter implements Exporter {
  format: 'godot' = 'godot'
  name = 'Godot Engine'
  description = 'Export to Godot .tscn scene format'

  /**
   * Get default export options
   */
  getDefaultOptions(): GodotExportOptions {
    return {
      format: 'godot',
      targetVersion: '4.x',
      includeAssets: true,
      prettyPrint: true,
      includeDocumentation: true,
      includePhysics: false,
      nodeNamingScheme: 'descriptive',
      pixelsPerUnit: 1,
      includeAutoTiles: true
    }
  }

  /**
   * Get supported features
   */
  getSupportedFeatures(): string[] {
    return [
      'Rectangles → ColorRect/Sprite2D',
      'Circles → Sprite2D with circle texture',
      'Text → Label nodes',
      'Sprites → Sprite2D',
      'Tilemaps → TileMap with auto-tiling',
      'Animations → AnimatedSprite2D',
      'Layers → Node hierarchy',
      'Colors and transformations',
      'Collision shapes (if enabled)'
    ]
  }

  /**
   * Validate canvas before export
   */
  async validate(canvasId: string): Promise<ExportValidation> {
    const baseValidation = await validateCanvasForExport(canvasId)
    
    // Add Godot-specific warnings
    const objects = await fetchCanvasObjects(canvasId)
    const warnings = [...baseValidation.warnings]
    const unsupportedFeatures = [...baseValidation.unsupportedFeatures]

    objects.forEach(obj => {
      if (obj.type === 'path') {
        unsupportedFeatures.push('Freehand paths (will be converted to Line2D)')
      }
      if (obj.type === 'polygon' || obj.type === 'star') {
        unsupportedFeatures.push('Polygons/stars (will be converted to Polygon2D)')
      }
    })

    return {
      ...baseValidation,
      warnings,
      unsupportedFeatures: Array.from(new Set(unsupportedFeatures))
    }
  }

  /**
   * Export canvas to Godot format
   */
  async export(
    canvasId: string,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    const opts = options as GodotExportOptions
    const files: ExportFile[] = []
    const warnings: string[] = []

    try {
      // Stage 1: Validating
      onProgress?.({
        stage: 'validating',
        progress: 10,
        message: 'Validating canvas for Godot export...',
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
        message: 'Collecting scene data...',
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
      const canvasName = sanitizeName(canvasData.name || 'Scene')

      // Fetch assets
      const assetsMap = await fetchReferencedAssets(objects, userId)

      // Stage 3: Converting
      onProgress?.({
        stage: 'converting',
        progress: 50,
        message: 'Converting to Godot scene...',
        warnings,
        errors: []
      })

      // Generate .tscn file
      const tscnContent = this.generateTSCN(
        canvasName,
        objects,
        tilemapData,
        assetsMap,
        animations,
        opts
      )

      files.push({
        name: `${canvasName}.tscn`,
        content: tscnContent,
        mimeType: 'text/plain'
      })

      // Stage 4: Packaging
      onProgress?.({
        stage: 'packaging',
        progress: 70,
        message: 'Packaging assets...',
        warnings,
        errors: []
      })

      // Export assets to separate files
      if (opts.includeAssets && assetsMap.size > 0) {
        for (const [assetId, asset] of assetsMap) {
          try {
            const blob = await downloadAsset(asset)
            const fileName = sanitizeName(asset.name) + '.png'
            
            files.push({
              name: fileName,
              content: blob,
              mimeType: 'image/png',
              path: 'assets'
            })
          } catch (error) {
            warnings.push(`Failed to export asset: ${asset.name}`)
          }
        }
      }

      // Include documentation
      if (opts.includeDocumentation) {
        const readme = createReadme('Godot', this.generateInstructions(opts))
        files.push(readme)
      }

      // Complete
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Godot export complete!',
        warnings,
        errors: []
      })

      return {
        success: true,
        files,
        warnings,
        instructions: this.generateInstructions(opts),
        metadata: {
          format: 'godot',
          exportedAt: Date.now(),
          canvasId,
          canvasName: canvasData.name || 'Untitled Canvas',
          version: opts.targetVersion,
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
   * Generate .tscn file content
   */
  private generateTSCN(
    sceneName: string,
    objects: Shape[],
    tilemapData: any[] | null,
    assetsMap: Map<string, any>,
    animations: Map<string, any>,
    options: GodotExportOptions
  ): string {
    const lines: string[] = []
    const version = options.targetVersion === '4.x' ? 4 : 3

    // Header
    lines.push(`[gd_scene load_steps=2 format=${version}]`)
    lines.push('')

    // Root node
    lines.push(`[node name="${sceneName}" type="Node2D"]`)
    lines.push('')

    // Sort objects by z-index
    const sortedObjects = [...objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))

    // Add objects as child nodes
    sortedObjects.forEach((obj, index) => {
      const nodeDef = this.createNode(obj, index, options)
      lines.push(...nodeDef)
      lines.push('')
    })

    // Add tilemap if exists
    if (tilemapData && tilemapData.length > 0) {
      const tilemapDef = this.createTileMapNode(tilemapData, assetsMap, options)
      lines.push(...tilemapDef)
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * Create Godot node definition from shape
   */
  private createNode(shape: Shape, index: number, options: GodotExportOptions): string[] {
    const lines: string[] = []
    const nodeName = this.generateNodeName(shape, index, options)
    const pos = this.convertPosition(shape.x, shape.y, options)
    const scale = options.pixelsPerUnit !== 1 ? options.pixelsPerUnit : 1

    switch (shape.type) {
      case 'rectangle':
        // Use ColorRect for solid rectangles
        lines.push(`[node name="${nodeName}" type="ColorRect" parent="."]`)
        lines.push(`position = Vector2(${pos.x}, ${pos.y})`)
        lines.push(`size = Vector2(${roundTo(shape.width * scale)}, ${roundTo(shape.height * scale)})`)
        
        if (shape.rotation) {
          lines.push(`rotation = ${roundTo((shape.rotation * Math.PI) / 180, 4)}`)
        }
        
        if (shape.fill) {
          const [r, g, b, a] = hexToRgbaNormalized(shape.fill)
          lines.push(`color = Color(${roundTo(r, 3)}, ${roundTo(g, 3)}, ${roundTo(b, 3)}, ${roundTo(a, 3)})`)
        }
        break

      case 'circle':
        // Create as Sprite2D with circle texture (user needs to provide texture)
        lines.push(`[node name="${nodeName}" type="Sprite2D" parent="."]`)
        lines.push(`position = Vector2(${pos.x}, ${pos.y})`)
        lines.push(`scale = Vector2(${roundTo(shape.width / 100 * scale, 3)}, ${roundTo(shape.height / 100 * scale, 3)})`)
        
        if (shape.rotation) {
          lines.push(`rotation = ${roundTo((shape.rotation * Math.PI) / 180, 4)}`)
        }
        
        // Note: User needs to assign texture manually
        lines.push(`# TODO: Assign circle texture`)
        
        if (shape.fill) {
          const [r, g, b, a] = hexToRgbaNormalized(shape.fill)
          lines.push(`modulate = Color(${roundTo(r, 3)}, ${roundTo(g, 3)}, ${roundTo(b, 3)}, ${roundTo(a, 3)})`)
        }
        break

      case 'text':
        lines.push(`[node name="${nodeName}" type="Label" parent="."]`)
        lines.push(`position = Vector2(${pos.x}, ${pos.y})`)
        lines.push(`text = "${(shape.text || '').replace(/"/g, '\\"')}"`)
        
        if (shape.fontSize) {
          // Note: Godot 4.x uses theme overrides differently
          lines.push(`# Font size: ${shape.fontSize}px (configure in theme)`)
        }
        
        if (shape.fill) {
          const [r, g, b, a] = hexToRgbaNormalized(shape.fill)
          lines.push(`modulate = Color(${roundTo(r, 3)}, ${roundTo(g, 3)}, ${roundTo(b, 3)}, ${roundTo(a, 3)})`)
        }
        break

      case 'animatedSprite':
        lines.push(`[node name="${nodeName}" type="AnimatedSprite2D" parent="."]`)
        lines.push(`position = Vector2(${pos.x}, ${pos.y})`)
        lines.push(`scale = Vector2(${roundTo(scale, 3)}, ${roundTo(scale, 3)})`)
        
        if (shape.rotation) {
          lines.push(`rotation = ${roundTo((shape.rotation * Math.PI) / 180, 4)}`)
        }
        
        if (shape.flipX) lines.push(`flip_h = true`)
        if (shape.flipY) lines.push(`flip_v = true`)
        
        lines.push(`# TODO: Configure SpriteFrames resource for animation`)
        break

      case 'line':
        lines.push(`[node name="${nodeName}" type="Line2D" parent="."]`)
        if (shape.points && shape.points.length >= 4) {
          const points = []
          for (let i = 0; i < shape.points.length; i += 2) {
            points.push(`Vector2(${roundTo(shape.points[i])}, ${roundTo(shape.points[i + 1])})`)
          }
          lines.push(`points = PackedVector2Array([${points.join(', ')}])`)
        }
        
        if (shape.stroke) {
          const [r, g, b, a] = hexToRgbaNormalized(shape.stroke)
          lines.push(`default_color = Color(${roundTo(r, 3)}, ${roundTo(g, 3)}, ${roundTo(b, 3)}, ${roundTo(a, 3)})`)
        }
        
        if (shape.strokeWidth) {
          lines.push(`width = ${shape.strokeWidth}`)
        }
        break

      case 'polygon':
      case 'star':
        lines.push(`[node name="${nodeName}" type="Polygon2D" parent="."]`)
        lines.push(`position = Vector2(${pos.x}, ${pos.y})`)
        
        if (shape.points && shape.points.length >= 6) {
          const points = []
          for (let i = 0; i < shape.points.length; i += 2) {
            points.push(`Vector2(${roundTo(shape.points[i])}, ${roundTo(shape.points[i + 1])})`)
          }
          lines.push(`polygon = PackedVector2Array([${points.join(', ')}])`)
        }
        
        if (shape.fill) {
          const [r, g, b, a] = hexToRgbaNormalized(shape.fill)
          lines.push(`color = Color(${roundTo(r, 3)}, ${roundTo(g, 3)}, ${roundTo(b, 3)}, ${roundTo(a, 3)})`)
        }
        break

      default:
        // Fallback to Node2D
        lines.push(`[node name="${nodeName}" type="Node2D" parent="."]`)
        lines.push(`position = Vector2(${pos.x}, ${pos.y})`)
        lines.push(`# Unsupported shape type: ${shape.type}`)
    }

    // Add collision shape if physics enabled
    if (options.includePhysics) {
      lines.push('')
      lines.push(`[node name="CollisionShape2D" type="CollisionShape2D" parent="${nodeName}"]`)
      lines.push(`# TODO: Configure collision shape`)
    }

    return lines
  }

  /**
   * Create TileMap node
   */
  private createTileMapNode(
    tilemapData: any[],
    assetsMap: Map<string, any>,
    options: GodotExportOptions
  ): string[] {
    const lines: string[] = []
    
    lines.push(`[node name="TileMap" type="TileMap" parent="."]`)
    lines.push(`tile_set = null  # TODO: Create TileSet resource`)
    lines.push(`format = 2`)
    
    // Add tile data
    lines.push('')
    lines.push(`# Tile data:`)
    tilemapData.forEach(tile => {
      const coords = tile.id.split('_')
      lines.push(`# Tile at (${coords[0]}, ${coords[1]}): index ${tile.tileIndex || 0}`)
    })
    
    lines.push('')
    lines.push(`# Note: Import tileset assets and configure TileSet resource manually`)
    lines.push(`# See README for instructions`)

    return lines
  }

  /**
   * Generate node name
   */
  private generateNodeName(shape: Shape, index: number, options: GodotExportOptions): string {
    if (options.nodeNamingScheme === 'simple') {
      return generateObjectName(shape, index)
    }
    
    // Descriptive names
    const type = shape.type.charAt(0).toUpperCase() + shape.type.slice(1)
    if (shape.type === 'text' && shape.text) {
      return sanitizeName(`${type}_${shape.text.substring(0, 20)}`)
    }
    return sanitizeName(`${type}_${index}`)
  }

  /**
   * Convert position (Godot uses center of objects, CollabCanva uses top-left)
   */
  private convertPosition(x: number, y: number, options: GodotExportOptions): { x: number; y: number } {
    const scale = options.pixelsPerUnit
    return {
      x: roundTo(x * scale),
      y: roundTo(y * scale)
    }
  }

  /**
   * Generate import instructions
   */
  private generateInstructions(options: GodotExportOptions): string {
    return `## Godot ${options.targetVersion} Export - Import Instructions

Your canvas has been exported to Godot scene format.

### Files Included
- \`Scene.tscn\` - Main scene file
- \`assets/\` - Sprite and tileset images
- \`README.md\` - This file

### Import Steps

1. **Create Godot Project**
   - Open Godot ${options.targetVersion}
   - Create new project or open existing

2. **Copy Files**
   - Copy all exported files into your project folder
   - Place assets in \`res://assets/\` directory

3. **Open Scene**
   - In Godot FileSystem dock, double-click the .tscn file
   - Scene will open in 2D editor

4. **Configure Textures**
   - Circles and sprites need textures assigned
   - Select node → Inspector → Texture property → Load texture
   - Assign appropriate image from assets folder

5. **Configure TileMap (if present)**
   - Create TileSet resource: Scene → New TileSet
   - Add tileset image from assets folder
   - Configure tile regions and auto-tiling
   - Assign TileSet to TileMap node
   - Paint tiles using TileMap editor

6. **Configure Animations (if present)**
   - Select AnimatedSprite2D nodes
   - Create SpriteFrames resource
   - Add frames from sprite sheet
   - Configure animation speed

### Coordinate System
- Objects are positioned in pixels
- Origin is top-left corner (Godot default for 2D)
- Scaling factor: ${options.pixelsPerUnit}x

### Physics (if enabled)
- CollisionShape2D nodes added to objects
- Configure shape type (Rectangle, Circle, Capsule)
- Add StaticBody2D, RigidBody2D, or Area2D as needed

### Next Steps
- Add scripts for game logic
- Configure collision layers and masks
- Set up camera and viewport
- Add lighting and effects

### Troubleshooting
- **Missing textures**: Assign textures manually in Inspector
- **TileMap not showing**: Create and configure TileSet resource
- **Objects wrong size**: Adjust pixel-per-unit scale in export options

### Resources
- Godot 2D Documentation: https://docs.godotengine.org/en/stable/tutorials/2d/
- TileMap Tutorial: https://docs.godotengine.org/en/stable/tutorials/2d/using_tilemaps.html

Enjoy building your game in Godot! 🎮
`
  }
}

// Export singleton instance
export const godotExporter = new GodotExporter()

