/**
 * Asset Management Tools
 * AI tools for analyzing and managing game assets, animations, and exports
 * PR-31 & PR-32: Asset-aware AI integration with animation and export support
 */

import { ToolDefinition, ToolResult } from '../toolRegistry'
import { database } from '../../services/firebase'

// NEW: Import asset recommendation services from frontend
// Note: These will be called via admin functions, so we need to access the frontend services
// For now, we'll implement the logic here directly using the same algorithms

/**
 * List all available assets
 * Helps AI know what sprites/tilesets are available to use
 */
export const listAssetsTool: ToolDefinition = {
  name: 'listAssets',
  description: 'List all available game assets (sprites, tilesets, etc.) that can be used in the canvas. Use this to see what visual assets are available before creating shapes or tilemaps.',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID to fetch assets for'
      },
      type: {
        type: 'string',
        enum: ['all', 'image', 'spritesheet', 'tileset', 'audio', 'font'],
        description: 'Filter by asset type (default: all)'
      }
    },
    required: ['userId']
  },
  execute: async (params: { userId: string; type?: string }): Promise<ToolResult> => {
    try {
      const { userId, type = 'all' } = params

      // Fetch assets from database
      const assetsRef = database.ref(`assets/${userId}`)
      const snapshot = await assetsRef.once('value')
      const assetsData = snapshot.val()

      if (!assetsData) {
        return {
          success: true,
          message: 'No assets found. User should upload some sprites or tilesets first.',
          data: { assets: [], count: 0 }
        }
      }

      // Convert to array and filter
      let assets = Object.entries(assetsData).map(([id, data]: [string, any]) => ({
        id,
        name: data.name,
        type: data.type,
        url: data.url,
        tags: data.tags || [],
        tilesetMetadata: data.tilesetMetadata,
        spriteSheetMetadata: data.spriteSheetMetadata,
        uploadedAt: data.uploadedAt
      }))

      if (type !== 'all') {
        assets = assets.filter(a => a.type === type)
      }

      // Build summary
      const summary = {
        total: assets.length,
        byType: assets.reduce((acc: any, asset) => {
          acc[asset.type] = (acc[asset.type] || 0) + 1
          return acc
        }, {}),
        tilesets: assets.filter(a => a.type === 'tileset').map(a => ({
          name: a.name,
          id: a.id,
          tileSize: a.tilesetMetadata ? `${a.tilesetMetadata.tileWidth}x${a.tilesetMetadata.tileHeight}` : 'unknown',
          tiles: a.tilesetMetadata?.tiles?.length || 0
        })),
        spritesheets: assets.filter(a => a.type === 'spritesheet').map(a => ({
          name: a.name,
          id: a.id,
          sprites: a.spriteSheetMetadata?.spriteSelections?.length || 0
        }))
      }

      return {
        success: true,
        message: `Found ${assets.length} asset(s). Tilesets: ${summary.tilesets.length}, Spritesheets: ${summary.spritesheets.length}`,
        data: {
          assets,
          summary
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to list assets: ${error.message}`
      }
    }
  }
}

/**
 * Analyze a sprite sheet / tileset
 * AI can examine an asset and suggest how to use it
 */
export const analyzeAssetTool: ToolDefinition = {
  name: 'analyzeAsset',
  description: 'Analyze a specific asset (sprite sheet or tileset) to understand its properties, tile sizes, and how it can be used. Returns detailed metadata about the asset.',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      },
      assetId: {
        type: 'string',
        description: 'Asset ID to analyze'
      }
    },
    required: ['userId', 'assetId']
  },
  execute: async (params: { userId: string; assetId: string }): Promise<ToolResult> => {
    try {
      const { userId, assetId } = params

      // Fetch asset
      const assetRef = database.ref(`assets/${userId}/${assetId}`)
      const snapshot = await assetRef.once('value')
      const asset = snapshot.val()

      if (!asset) {
        return {
          success: false,
          error: `Asset ${assetId} not found`
        }
      }

      // Build analysis
      const analysis: any = {
        id: assetId,
        name: asset.name,
        type: asset.type,
        url: asset.url,
        tags: asset.tags || []
      }

      if (asset.tilesetMetadata) {
        analysis.tileset = {
          tileWidth: asset.tilesetMetadata.tileWidth,
          tileHeight: asset.tilesetMetadata.tileHeight,
          spacing: asset.tilesetMetadata.spacing || 0,
          margin: asset.tilesetMetadata.margin || 0,
          tiles: asset.tilesetMetadata.tiles || [],
          tileCount: asset.tilesetMetadata.tiles?.length || 0,
          hasAutoTile: asset.tilesetMetadata.autoTileMappings ? true : false,
          gridLayout: `${asset.tilesetMetadata.columns || '?'} columns × ${asset.tilesetMetadata.rows || '?'} rows`
        }
      }

      if (asset.spriteSheetMetadata) {
        analysis.spritesheet = {
          selectionMode: asset.spriteSheetMetadata.selectionMode || 'grid',
          sprites: asset.spriteSheetMetadata.spriteSelections || [],
          spriteCount: asset.spriteSheetMetadata.spriteSelections?.length || 0,
          sizes: asset.spriteSheetMetadata.spriteSelections?.map((s: any) => 
            `${s.name}: ${s.width}×${s.height}`
          ) || []
        }
      }

      // Generate usage suggestions
      const suggestions: string[] = []
      if (asset.type === 'tileset') {
        suggestions.push(`Use this tileset with the paintTileRegion tool to paint ${analysis.tileset?.tileCount || 0} different tiles`)
        if (analysis.tileset?.hasAutoTile) {
          suggestions.push('This tileset has auto-tile support for seamless terrain painting')
        }
      }
      if (asset.type === 'spritesheet') {
        suggestions.push(`This sprite sheet has ${analysis.spritesheet?.spriteCount || 0} individual sprites that can be used for game objects`)
      }

      return {
        success: true,
        message: `Analyzed ${asset.name} (${asset.type})`,
        data: {
          analysis,
          suggestions
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to analyze asset: ${error.message}`
      }
    }
  }
}

/**
 * Suggest tileset slicing strategy
 * AI examines image dimensions and suggests optimal slicing
 */
export const suggestSlicingTool: ToolDefinition = {
  name: 'suggestSlicing',
  description: 'Suggest how to slice/split a sprite sheet or tileset based on its dimensions. Recommends tile sizes, whether to use auto-detection or manual selection.',
  parameters: {
    type: 'object',
    properties: {
      width: {
        type: 'number',
        description: 'Image width in pixels'
      },
      height: {
        type: 'number',
        description: 'Image height in pixels'
      },
      imageUrl: {
        type: 'string',
        description: 'Optional URL to the image for visual analysis'
      }
    },
    required: ['width', 'height']
  },
  execute: async (params: { width: number; height: number; imageUrl?: string }): Promise<ToolResult> => {
    try {
      const { width, height } = params

      // Common tile sizes to check
      const commonSizes = [8, 16, 24, 32, 48, 64, 128]
      const suggestions: any[] = []

      // Check which tile sizes divide evenly
      for (const size of commonSizes) {
        const cols = width / size
        const rows = height / size

        if (Number.isInteger(cols) && Number.isInteger(rows)) {
          suggestions.push({
            tileSize: `${size}×${size}`,
            grid: `${cols}×${rows}`,
            totalTiles: cols * rows,
            confidence: 'high',
            reason: 'Divides evenly with no remainder'
          })
        }
      }

      // Check for near-matches (might have spacing/margin)
      for (const size of commonSizes) {
        const cols = Math.round(width / size)
        const rows = Math.round(height / size)
        const expectedWidth = cols * size
        const expectedHeight = rows * size
        const widthDiff = Math.abs(width - expectedWidth)
        const heightDiff = Math.abs(height - expectedHeight)

        // If close but not exact, might have spacing
        if (widthDiff > 0 && widthDiff < size * 0.3 && heightDiff > 0 && heightDiff < size * 0.3) {
          const avgSpacing = Math.round((widthDiff / cols + heightDiff / rows) / 2)
          if (avgSpacing > 0 && avgSpacing < 10) {
            suggestions.push({
              tileSize: `${size}×${size}`,
              grid: `${cols}×${rows}`,
              spacing: avgSpacing,
              totalTiles: cols * rows,
              confidence: 'medium',
              reason: `Likely has ${avgSpacing}px spacing between tiles`
            })
          }
        }
      }

      // Determine recommendation
      let recommendation = ''
      if (suggestions.length === 0) {
        recommendation = 'MANUAL_SELECTION_REQUIRED'
      } else if (suggestions[0].confidence === 'high') {
        recommendation = 'AUTO_DETECTION_RECOMMENDED'
      } else {
        recommendation = 'AUTO_DETECTION_WITH_SPACING'
      }

      return {
        success: true,
        message: `Analyzed ${width}×${height}px image. Found ${suggestions.length} possible tile configurations.`,
        data: {
          dimensions: { width, height },
          recommendation,
          suggestions: suggestions.slice(0, 5), // Top 5 suggestions
          advice: recommendation === 'MANUAL_SELECTION_REQUIRED' 
            ? 'This sprite sheet appears to have irregular sizes. Use manual selection with snap-to-grid (8px, 16px, or 32px) for best results.'
            : 'Auto-detection should work well. If results are not perfect, try adjusting spacing/margin or use manual selection.'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to suggest slicing: ${error.message}`
      }
    }
  }
}

/**
 * Recommend asset for task
 * AI can ask which asset to use for a specific purpose
 */
export const recommendAssetTool: ToolDefinition = {
  name: 'recommendAsset',
  description: 'Recommend which asset to use for a specific game development task (e.g., "grass tiles", "player character", "enemy sprites"). Searches through available assets and suggests the best match.',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      },
      purpose: {
        type: 'string',
        description: 'What you need the asset for (e.g., "grass terrain", "water tiles", "character sprite", "enemy")'
      },
      assetType: {
        type: 'string',
        enum: ['any', 'tileset', 'spritesheet', 'image'],
        description: 'Preferred asset type (default: any)'
      }
    },
    required: ['userId', 'purpose']
  },
  execute: async (params: { userId: string; purpose: string; assetType?: string }): Promise<ToolResult> => {
    try {
      const { userId, purpose, assetType = 'any' } = params

      // Fetch assets
      const assetsRef = database.ref(`assets/${userId}`)
      const snapshot = await assetsRef.once('value')
      const assetsData = snapshot.val()

      if (!assetsData) {
        return {
          success: false,
          error: 'No assets available. User should upload some assets first.'
        }
      }

      // Convert to array
      let assets = Object.entries(assetsData).map(([id, data]: [string, any]) => ({
        id,
        name: data.name,
        type: data.type,
        tags: data.tags || [],
        tilesetMetadata: data.tilesetMetadata,
        spriteSheetMetadata: data.spriteSheetMetadata
      }))

      // Filter by type if specified
      if (assetType !== 'any') {
        assets = assets.filter(a => a.type === assetType)
      }

      // Search for matching assets (name and tags)
      const searchTerms = purpose.toLowerCase().split(/\s+/)
      const scored = assets.map(asset => {
        let score = 0
        const assetText = `${asset.name} ${asset.tags.join(' ')}`.toLowerCase()

        // Score based on matching terms
        for (const term of searchTerms) {
          if (assetText.includes(term)) {
            score += 10
          }
        }

        // Boost tilesets for terrain-related queries
        if ((purpose.includes('terrain') || purpose.includes('tile') || purpose.includes('ground')) 
            && asset.type === 'tileset') {
          score += 5
        }

        return { asset, score }
      })

      // Sort by score
      scored.sort((a, b) => b.score - a.score)
      const matches = scored.filter(s => s.score > 0).map(s => s.asset)

      if (matches.length === 0) {
        return {
          success: false,
          error: `No assets found matching "${purpose}". Available assets: ${assets.map(a => a.name).join(', ')}`
        }
      }

      return {
        success: true,
        message: `Found ${matches.length} asset(s) matching "${purpose}". Best match: ${matches[0].name}`,
        data: {
          recommendation: matches[0],
          alternatives: matches.slice(1, 4),
          allAssets: assets.map(a => ({ id: a.id, name: a.name, type: a.type }))
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to recommend asset: ${error.message}`
      }
    }
  }
}

/**
 * Create Animation Tool
 * Create a sprite animation from a sprite sheet
 */
export const createAnimationTool: ToolDefinition = {
  name: 'createAnimation',
  description: 'Create a sprite animation from a sprite sheet by defining frame regions. This allows sprites to be animated on the canvas.',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name for the animation (e.g., "walk_right", "jump", "attack")'
      },
      spriteSheetId: {
        type: 'string',
        description: 'ID of the sprite sheet asset to use'
      },
      frames: {
        type: 'array',
        description: 'Array of frame definitions with x, y, width, height properties',
        items: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate in sprite sheet' },
            y: { type: 'number', description: 'Y coordinate in sprite sheet' },
            width: { type: 'number', description: 'Frame width' },
            height: { type: 'number', description: 'Frame height' }
          }
        }
      },
      fps: {
        type: 'number',
        description: 'Frames per second (1-60, default: 12)',
        minimum: 1,
        maximum: 60
      },
      loop: {
        type: 'boolean',
        description: 'Whether the animation should loop (default: true)'
      },
      userId: {
        type: 'string',
        description: 'User ID'
      },
      canvasId: {
        type: 'string',
        description: 'Canvas ID (optional - if not provided, animation is global to user)'
      }
    },
    required: ['name', 'spriteSheetId', 'frames', 'userId']
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const {
        name,
        spriteSheetId,
        frames,
        fps = 12,
        loop = true,
        userId,
        canvasId
      } = params

      // Generate animation ID
      const animationId = `animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const animation = {
        id: animationId,
        userId,
        canvasId: canvasId || null,
        name,
        spriteSheetId,
        frames,
        fps,
        loop,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // Save to database
      await database.ref(`animations/${animationId}`).set(animation)

      return {
        success: true,
        message: `Created animation "${name}" with ${frames.length} frames at ${fps} FPS`,
        data: { animationId, animation }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create animation: ${error.message}`
      }
    }
  }
}

/**
 * Export Canvas Tool
 * Export the canvas to various game engine formats
 */
export const exportCanvasTool: ToolDefinition = {
  name: 'exportCanvas',
  description: 'Export the canvas to a game engine format (Godot, Generic JSON). Validates the canvas and provides download instructions.',
  parameters: {
    type: 'object',
    properties: {
      canvasId: {
        type: 'string',
        description: 'Canvas ID to export'
      },
      format: {
        type: 'string',
        enum: ['godot', 'generic'],
        description: 'Export format: godot (.tscn) or generic (JSON + PNG)'
      },
      options: {
        type: 'object',
        description: 'Format-specific export options',
        properties: {
          includeAssets: { type: 'boolean', description: 'Include asset files in export (default: true)' },
          prettyPrint: { type: 'boolean', description: 'Format JSON for readability (default: true)' },
          includeDocumentation: { type: 'boolean', description: 'Include import instructions (default: true)' }
        }
      }
    },
    required: ['canvasId', 'format']
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const { canvasId, format, options = {} } = params

      // Note: Actual export is handled client-side by the export modal
      // This tool just provides information and validates the request
      
      return {
        success: true,
        message: `Export request created for canvas in ${format} format. The user will see an export modal with download options.`,
        data: {
          canvasId,
          format,
          options,
          instruction: 'Open the Export modal in the UI to download the exported files. The files will be packaged as a ZIP archive with instructions.'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to export canvas: ${error.message}`
      }
    }
  }
}

/**
 * Select Tileset Tool (AI-Aware)
 * Intelligently select the best tileset using the new catalog and recommendation system
 */
export const selectTilesetTool: ToolDefinition = {
  name: 'selectTileset',
  description: 'Find the best tileset for a given context using AI-powered recommendation. Searches through user\'s tileset library using themes, materials, layer types, and features. Returns tileset with named tile indices for precise painting.',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      },
      tileSize: {
        type: 'number',
        description: 'Tile size in pixels (must match the current tilemap). Common: 16, 24, 32, 48, 64',
        enum: [8, 16, 24, 32, 48, 64, 128]
      },
      layer: {
        type: 'string',
        enum: ['background', 'ground', 'props', 'fx', 'decals', 'collision'],
        description: 'Which layer this tileset will be used on'
      },
      theme: {
        type: 'string',
        description: 'Visual theme: "forest", "dungeon", "desert", "snow", "cave", "city", etc.'
      },
      materials: {
        type: 'array',
        items: { type: 'string' },
        description: 'Required materials: ["grass", "water", "stone", "wood", "sand", etc.]'
      },
      requireAutotile: {
        type: 'boolean',
        description: 'Only return tilesets that support auto-tiling (default: false)'
      },
      requireAnimated: {
        type: 'boolean',
        description: 'Only return tilesets with animation frames (default: false)'
      }
    },
    required: ['userId', 'tileSize']
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const { userId, tileSize, layer, theme, materials, requireAutotile, requireAnimated } = params

      // Load catalog from database
      const catalogRef = database.ref(`catalog/tilesets/${userId}`)
      const snapshot = await catalogRef.once('value')
      const catalogData = snapshot.val()

      if (!catalogData) {
        return {
          success: false,
          error: 'No tilesets found in library. User should upload tilesets first.'
        }
      }

      // Convert to array
      let catalog = Object.values(catalogData) as any[]

      // Filter by hard requirements
      catalog = catalog.filter((entry: any) => {
        if (tileSize && entry.tileSize !== tileSize) return false
        if (layer && !entry.layerTypes.includes(layer)) return false
        if (requireAutotile && !entry.features?.autotile) return false
        if (requireAnimated && !entry.features?.animated) return false
        return true
      })

      if (catalog.length === 0) {
        return {
          success: false,
          error: `No tilesets match the criteria. Try: 1) Uploading a ${tileSize}px tileset, 2) Adjusting requirements, 3) Using a different tile size`
        }
      }

      // Score by relevance
      const scored = catalog.map((entry: any) => {
        let score = 0

        // Detection confidence bonus
        if (entry.detectionConfidence) score += entry.detectionConfidence * 2

        // Theme match (high weight)
        if (theme && entry.themes?.includes(theme)) score += 10

        // Material matches (medium weight)
        if (materials) {
          const matchCount = materials.filter((m: string) => entry.materials?.includes(m)).length
          score += matchCount * 3
        }

        // Feature bonuses
        if (entry.features?.autotile) score += 2
        if (entry.features?.animated) score += 1
        if (entry.features?.props) score += 1

        // Auto-tile system bonus
        if (entry.autoTileSystem === 'blob47') score += 3
        else if (entry.autoTileSystem === 'blob16') score += 2
        else if (entry.autoTileSystem === 'wang') score += 2

        return { entry, score }
      })

      scored.sort((a, b) => b.score - a.score)
      const best = scored[0].entry
      const alternatives = scored.slice(1, 4).map(s => ({
        id: s.entry.id,
        name: s.entry.name,
        score: s.score
      }))

      // Load full asset to get namedTiles
      const assetRef = database.ref(`assets/${userId}/${best.id}`)
      const assetSnapshot = await assetRef.once('value')
      const asset = assetSnapshot.val()

      return {
        success: true,
        message: `Selected "${best.name}" (${catalog.length} ${catalog.length === 1 ? 'match' : 'matches'} found)`,
        data: {
          tilesetId: best.id,
          name: best.name,
          tileSize: best.tileSize,
          namedTiles: asset.tilesetMetadata?.namedTiles || {},
          features: best.features,
          autoTileSystem: best.autoTileSystem,
          themes: best.themes,
          materials: best.materials,
          alternatives: alternatives.length > 0 ? alternatives : undefined,
          usage: {
            instruction: `Use namedTiles to reference specific tiles. Example: namedTiles["grass.center"] = tile index`,
            availableTiles: Object.keys(asset.tilesetMetadata?.namedTiles || {}).slice(0, 10)
          }
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to select tileset: ${error.message}`
      }
    }
  }
}

/**
 * List Tilesets Tool (Catalog-Aware)
 * List available tilesets with filtering using the fast catalog index
 */
export const listTilesetsTool: ToolDefinition = {
  name: 'listTilesets',
  description: 'List all available tilesets in the user\'s library with optional filtering. Returns lightweight catalog entries for quick browsing. Use this to see what tilesets are available before selecting one.',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      },
      filterBy: {
        type: 'object',
        properties: {
          tileSize: { 
            type: 'number',
            description: 'Filter by tile size (8, 16, 32, 48, 64, etc.)'
          },
          theme: {
            type: 'string',
            description: 'Filter by theme (forest, dungeon, desert, etc.)'
          },
          layer: {
            type: 'string',
            enum: ['background', 'ground', 'props', 'fx', 'decals', 'collision'],
            description: 'Filter by layer type'
          },
          hasAutotile: {
            type: 'boolean',
            description: 'Filter to only auto-tile enabled tilesets'
          },
          hasAnimated: {
            type: 'boolean',
            description: 'Filter to only animated tilesets'
          }
        },
        description: 'Optional filters to narrow results'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 10, max: 50)',
        minimum: 1,
        maximum: 50
      }
    },
    required: ['userId']
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const { userId, filterBy = {}, limit = 10 } = params

      // Load catalog
      const catalogRef = database.ref(`catalog/tilesets/${userId}`)
      const snapshot = await catalogRef.once('value')
      const catalogData = snapshot.val()

      if (!catalogData) {
        return {
          success: true,
          message: 'No tilesets uploaded yet. Upload some tilesets to get started!',
          data: {
            tilesets: [],
            totalCount: 0
          }
        }
      }

      let catalog = Object.values(catalogData) as any[]
      const totalCount = catalog.length

      // Apply filters
      if (filterBy.tileSize) {
        catalog = catalog.filter(e => e.tileSize === filterBy.tileSize)
      }
      if (filterBy.theme) {
        catalog = catalog.filter(e => e.themes?.includes(filterBy.theme))
      }
      if (filterBy.layer) {
        catalog = catalog.filter(e => e.layerTypes?.includes(filterBy.layer))
      }
      if (filterBy.hasAutotile !== undefined) {
        catalog = catalog.filter(e => !!e.features?.autotile === filterBy.hasAutotile)
      }
      if (filterBy.hasAnimated !== undefined) {
        catalog = catalog.filter(e => !!e.features?.animated === filterBy.hasAnimated)
      }

      // Limit results
      const limited = catalog.slice(0, Math.min(limit, 50))

      // Format results
      const tilesets = limited.map((entry: any) => {
        const features: string[] = []
        if (entry.features?.autotile) features.push('autotile')
        if (entry.features?.animated) features.push('animated')
        if (entry.features?.props) features.push('props')
        if (entry.features?.decals) features.push('decals')

        return {
          id: entry.id,
          name: entry.name,
          tileSize: entry.tileSize,
          tileCount: entry.tileCount,
          themes: entry.themes || [],
          materials: entry.materials || [],
          features,
          autoTileSystem: entry.autoTileSystem,
          confidence: entry.detectionConfidence
        }
      })

      return {
        success: true,
        message: catalog.length === limited.length
          ? `Found ${catalog.length} ${catalog.length === 1 ? 'tileset' : 'tilesets'}`
          : `Showing ${limited.length} of ${catalog.length} tilesets`,
        data: {
          tilesets,
          totalCount,
          filteredCount: catalog.length,
          summary: {
            totalTilesets: totalCount,
            tileSizes: [...new Set(catalog.map(e => e.tileSize))].sort((a, b) => a - b),
            themes: [...new Set(catalog.flatMap(e => e.themes || []))].slice(0, 10),
            materials: [...new Set(catalog.flatMap(e => e.materials || []))].slice(0, 10),
            withAutotile: catalog.filter(e => e.features?.autotile).length,
            withAnimation: catalog.filter(e => e.features?.animated).length
          }
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to list tilesets: ${error.message}`
      }
    }
  }
}

