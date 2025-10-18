/**
 * Asset Types for Game Development Tools
 * Handles sprite sheets, tilesets, and other game assets
 */

/**
 * Asset type classifications
 */
export type AssetType = 'spritesheet' | 'tileset' | 'image' | 'audio' | 'font'

/**
 * Auto-tiling bitmask values (16 possible combinations)
 * Based on Moore neighborhood (8 surrounding tiles)
 */
export type AutoTileBitmask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15

/**
 * Auto-tile variant mapping
 * Maps bitmask values to tile indices in the sprite sheet
 */
export interface AutoTileMapping {
  [bitmask: number]: number // bitmask -> tile index
}

/**
 * Semantic grouping of tiles derived from named tile metadata
 */
export interface TileSemanticGroup {
  /** Human-friendly label for the group (e.g. "Grass") */
  label: string
  /** Optional description describing how the group should be used */
  description?: string
  /** Auto-tile system this group supports, if applicable */
  autoTileSystem?: 'blob16' | 'blob47' | 'wang' | 'custom'
  /** Related materials for this group (grass, water, etc.) */
  materials?: string[]
  /** Related themes for this group (forest, dungeon, etc.) */
  themes?: string[]
  /** Individual tile variants within this group mapped to tile indices */
  tiles: Record<string, number>
  /** Cached list of tile variant names for quick lookup */
  variants: string[]
  /** Number of tiles that belong to this group */
  tileCount: number
}

/**
 * Tileset-specific metadata
 */
export interface TilesetMetadata {
  // === EXISTING FIELDS ===
  tileWidth: number // width of each tile in pixels
  tileHeight: number // height of each tile in pixels
  spacing?: number // spacing between tiles (default: 0)
  margin?: number // margin around the tileset (default: 0)
  columns: number // number of columns in the grid
  rows: number // number of rows in the grid
  tileCount: number // total number of tiles
  autoTileMapping?: AutoTileMapping // optional auto-tiling configuration

  // === NEW FIELDS (all optional, backward compatible) ===
  
  // Quick access (computed from tileWidth/tileHeight)
  tileSize?: number              // only if tileWidth === tileHeight
  
  // Asset versioning
  version?: number               // default: 1, increment on AI modifications
  
  // Rendering hints
  pixelArt?: boolean             // use nearest-neighbor filtering
  palette?: string[]             // hex colors for palette matching
  
  // Discovery metadata (enables AI selection)
  themes?: string[]              // ["forest", "dungeon", "desert"]
  styles?: string[]              // ["topdown", "platformer", "isometric"]
  materials?: string[]           // ["grass", "water", "stone", "wood"]
  
  // Layer suitability
  layerTypes?: Array<'background' | 'ground' | 'props' | 'fx' | 'decals' | 'collision'>
  
  // Auto-tile system descriptor
  autoTileSystem?: 'blob16' | 'blob47' | 'wang' | 'custom'
  
  // Named tile index (AI-friendly vocabulary)
  namedTiles?: Record<string, number>  // { "grass.center": 0, "tree.small": 45 }

  // Semantic groups derived from named tiles and material/theme metadata
  tileGroups?: Record<string, TileSemanticGroup>

  // Adjacency rules (for complex auto-tile systems)
  adjacencyRules?: {
    system: 'blob16' | 'blob47' | 'wang' | 'custom'
    rulesData?: any              // inline rules
    rulesUrl?: string            // external rules file
  }
  
  // Feature flags
  features?: {
    autotile?: boolean           // supports auto-tiling
    animated?: boolean           // has animation frames
    decals?: boolean            // transparent overlays
    props?: boolean             // standalone objects
  }
  
  // Validation report
  validation?: {
    seamQuality?: 'good' | 'issues' | 'unchecked'
    dimensionCheck: 'pass' | 'fail'
    warnings: string[]
    checkedAt?: number
  }
  
  // Detection confidence (for auto-generated metadata)
  detectionConfidence?: {
    autoTilePattern: number      // 0-1
    namedTiles: number           // 0-1
    overall: number              // 0-1
  }
}

/**
 * Manual sprite selection (for irregular sprite sheets)
 * PR-31: Enhanced for non-uniform sprite collections
 */
export interface SpriteSelection {
  id: string // unique identifier
  name: string // user-defined sprite name
  x: number // x coordinate in source image
  y: number // y coordinate in source image
  width: number // sprite width
  height: number // sprite height
}

/**
 * Sprite sheet-specific metadata
 */
export interface SpriteSheetMetadata {
  // Uniform grid (auto-detected)
  frameWidth?: number // width of each frame
  frameHeight?: number // height of each frame
  frameCount?: number // total number of frames
  columns?: number // number of columns
  rows?: number // number of rows
  spacing?: number // spacing between frames
  margin?: number // margin around the sprite sheet
  
  // Manual selections (for irregular sprites)
  spriteSelections?: SpriteSelection[] // manually defined sprite bounds
  selectionMode?: 'grid' | 'manual' // how sprites were defined
}

/**
 * Base asset metadata (common to all asset types)
 */
export interface AssetMetadata {
  width: number // image width in pixels
  height: number // image height in pixels
  fileSize: number // file size in bytes
  mimeType: string // e.g., 'image/png'
}

/**
 * Asset document stored in Firebase
 */
export interface Asset {
  id: string // unique asset identifier
  userId: string // owner user ID
  name: string // user-friendly name
  type: AssetType // asset classification
  url: string // Firebase Storage download URL
  thumbnailUrl?: string // optional thumbnail URL (for grid view)
  metadata: AssetMetadata // base metadata
  tilesetMetadata?: TilesetMetadata // only if type === 'tileset'
  spriteSheetMetadata?: SpriteSheetMetadata // only if type === 'spritesheet'
  uploadedAt: number // timestamp (Date.now())
  updatedAt: number // timestamp (Date.now())
  tags: string[] // user-defined tags for organization
  folderId?: string // optional folder organization
}

/**
 * Asset upload progress tracking
 */
export interface AssetUploadProgress {
  assetId: string
  fileName: string
  progress: number // 0-100
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}

/**
 * Aggregated asset statistics exposed to the AI context builder.
 */
export interface AssetLibraryStats {
  totalTilesets: number
  availableTileSizes: number[]
  availableThemes: string[]
  availableMaterials: string[]
  hasAutotileSets: boolean
  hasAnimatedSets: boolean
  hasPropSets: boolean
}

/**
 * Suggestion generated for the AI describing which tileset fits the current canvas.
 */
export interface TilesetSuggestion {
  id: string
  name: string
  reason: string
}

/**
 * Payload that can be attached to AI requests so the backend prompt has access to asset data.
 */
export interface AssetAIContextPayload {
  availableAssets: {
    tilesets: number
    spritesheets: number
    animations: number
  }
  assetStats: AssetLibraryStats
  tilesetSuggestions?: TilesetSuggestion[]
}

/**
 * Asset folder for organization
 */
export interface AssetFolder {
  id: string
  userId: string
  name: string
  parentId?: string // for nested folders
  color?: string // optional folder color
  icon?: string // optional folder icon
  createdAt: number
}

/**
 * Asset filter/search options
 */
export interface AssetFilter {
  type?: AssetType[]
  tags?: string[]
  folderId?: string
  searchQuery?: string
}

/**
 * Tileset slicing result
 */
export interface TileSliceResult {
  tiles: TileSlice[]
  metadata: TilesetMetadata
}

/**
 * Individual tile from a sliced tileset
 */
export interface TileSlice {
  index: number // tile index (0-based)
  x: number // x coordinate in the source image
  y: number // y coordinate in the source image
  width: number // tile width
  height: number // tile height
  imageData?: ImageData // optional extracted tile image data
}

/**
 * Auto-tile detection suggestion
 */
export interface AutoTileSuggestion {
  tileIndices: number[] // indices of tiles that might form an auto-tile set
  confidence: number // 0-1, how confident the detection is
  mapping?: AutoTileMapping // suggested bitmask mapping
}

/**
 * Asset validation result
 */
export interface AssetValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Client-side asset state (for React components)
 */
export interface AssetLibraryState {
  assets: Map<string, Asset>
  folders: Map<string, AssetFolder>
  selectedAssetId: string | null
  filter: AssetFilter
  uploadProgress: Map<string, AssetUploadProgress>
  isLoading: boolean
  error: string | null
}

/**
 * Asset usage tracking (where is this asset used?)
 */
export interface AssetUsage {
  assetId: string
  canvasIds: string[] // canvases using this asset
  usageCount: number // total times used across all canvases
}

/**
 * Lightweight catalog entry for fast asset discovery
 * Stored separately for quick filtering without loading full assets
 */
export interface TilesetCatalogEntry {
  id: string                     // asset ID
  name: string
  userId: string
  
  // Core properties
  tileSize: number               // quick filter by size
  tileWidth: number              // actual dimensions
  tileHeight: number
  tileCount: number
  
  // Discovery filters
  themes: string[]
  styles: string[]
  materials: string[]
  layerTypes: string[]
  
  // Features
  features: {
    autotile?: boolean
    animated?: boolean
    decals?: boolean
    props?: boolean
  }
  
  // Auto-tile info
  autoTileSystem?: string

  // Semantic grouping summary (group names only for quick filtering)
  semanticGroups?: string[]

  // Preview
  thumbnailUrl: string
  
  // Metadata
  version: number
  updatedAt: number
  
  // Detection quality (helps AI choose)
  detectionConfidence?: number   // overall confidence score
}

/**
 * Tileset query for recommendation system
 */
export interface TilesetQuery {
  tileSize?: number              // must match (or null for any)
  tileWidth?: number             // exact width
  tileHeight?: number            // exact height
  layer?: 'background' | 'ground' | 'props' | 'fx' | 'decals' | 'collision'
  theme?: string                 // preferred theme
  themes?: string[]              // any of these themes
  materials?: string[]           // must include these materials
  style?: string                 // preferred style
  requireAutotile?: boolean
  requireAnimated?: boolean
  requireProps?: boolean
  excludeMaterials?: string[]
  searchQuery?: string           // text search
}

