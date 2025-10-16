# PR-31: Game Dev Tools (Phase 3)

## Overview
**Duration:** 3-4 days  
**Priority:** P1 - Platform Differentiation  
**Dependencies:** PR-28, PR-29, PR-30  
**Enables:** Phase 4 (AI Game-Aware), Professional game development workflow

## Objective
Transform the canvas into a game development platform by adding: sprite animation editor, custom tileset import/auto-slicing, sprite sheet management, asset library, and export to popular game engines (Godot, Unity, Phaser). Makes the platform compelling for indie game developers.

---

## Technical Specifications

### Features Overview
1. **Sprite Animation:** Frame-by-frame animation with timeline
2. **Custom Tilesets:** Import PNG sprite sheets, auto-detect tiles, configure auto-tiling
3. **Asset Library:** Browse/search uploaded assets, organize in folders
4. **Export Targets:** Godot (.tscn), Unity (.prefab), Phaser (JSON), Generic (JSON+PNG)
5. **Physics Preview:** Visualize collision boxes, test basic physics

### Data Model Extensions
```
assets/
  {userId}/
    {assetId}/
      - name: string
      - type: "spritesheet" | "tileset" | "audio" | "font"
      - url: string (Firebase Storage)
      - metadata: {
          width: number
          height: number
          tileSize?: number
          frameCount?: number
          animations?: Array<Animation>
        }
      - uploadedAt: timestamp
      - tags: string[]

animations/
  {canvasId}/
    {animationId}/
      - name: string
      - spriteSheetId: string
      - frames: Array<{
          x: number
          y: number
          duration: number (ms)
        }>
      - loop: boolean
      - fps: number
```

---

## Detailed Task List

### **Task Group 1: Asset Upload & Storage (Day 1 Morning)**

#### Task 1.1: Create Asset Upload Service
**File:** `src/services/assetUpload.ts` (NEW)
- [ ] Implement `uploadAsset(file, userId, metadata)`:
  - Validate file type (PNG, JPG only for now)
  - Validate file size (max 10MB)
  - Generate unique asset ID
  - Upload to Firebase Storage: `assets/{userId}/{assetId}`
  - Create metadata document in Firestore
  - Return asset object
- [ ] Implement `deleteAsset(assetId, userId)`:
  - Check ownership
  - Delete from Storage
  - Delete from Firestore
  - Clean up references in canvases
- [ ] Add upload progress tracking
- [ ] Add error handling (network, storage quota)

#### Task 1.2: Create Asset Library Store
**File:** `src/stores/assetStore.ts` (NEW)
- [ ] Create Zustand store with state:
  - `assets: Map<string, Asset>`
  - `selectedAsset: string | null`
  - `uploadProgress: Map<string, number>`
  - `filter: { type?, tags? }`
- [ ] Add actions:
  - `addAsset(asset)`
  - `removeAsset(assetId)`
  - `selectAsset(assetId)`
  - `setFilter(filter)`
  - `updateUploadProgress(id, percent)`
- [ ] Add selectors:
  - `getFilteredAssets()`
  - `getAssetsByType(type)`
  - `searchAssets(query)`

#### Task 1.3: Create Asset Upload UI
**File:** `src/components/assets/AssetUploadModal.tsx` (NEW)
- [ ] Create modal with drag-and-drop zone
- [ ] Accept: Image files only (.png, .jpg)
- [ ] Show preview thumbnail before upload
- [ ] Input fields: Name, Tags
- [ ] Auto-detect metadata:
  - Image dimensions
  - For sprite sheets: Suggest grid size
- [ ] Upload button with progress bar
- [ ] Show upload errors inline
- [ ] Close on successful upload

---

### **Task Group 2: Asset Library UI (Day 1 Afternoon)**

#### Task 2.1: Create Asset Library Panel
**File:** `src/components/assets/AssetLibrary.tsx` (NEW)
- [ ] Create left sidebar panel (collapsible)
- [ ] Tabs: "My Assets", "Kenney.nl", "Search"
- [ ] Grid view: Thumbnails with asset names
- [ ] List view: Detailed info (size, date, type)
- [ ] Filter dropdown: By type, by tag
- [ ] Search bar with debounced search
- [ ] "Upload Asset" button (opens modal)
- [ ] Empty state: "No assets yet, upload one!"

#### Task 2.2: Create Asset Card Component
**File:** `src/components/assets/AssetCard.tsx` (NEW)
- [ ] Display thumbnail (cropped to square)
- [ ] Show asset name (truncated)
- [ ] Show type badge (Sprite, Tileset, etc.)
- [ ] Hover actions:
  - "Use as Tile Palette"
  - "Create Animation"
  - "Delete" (with confirmation)
- [ ] Click to select
- [ ] Selected state (highlight border)

#### Task 2.3: Create Asset Detail Panel
**File:** `src/components/assets/AssetDetailPanel.tsx` (NEW)
- [ ] Show when asset selected
- [ ] Display full-size preview
- [ ] Show metadata:
  - Dimensions
  - File size
  - Upload date
  - Tags (editable)
- [ ] Actions:
  - "Download Original"
  - "Replace File"
  - "Configure as Tileset"
  - "Delete"
- [ ] If tileset: Show auto-tile configuration

---

### **Task Group 3: Custom Tileset Import (Day 1 Evening)**

#### Task 3.1: Create Tileset Slicer
**File:** `src/utils/tilesetSlicer.ts` (NEW)
- [ ] Implement `autoDetectTileSize(imageData)`:
  - Analyze image for grid patterns
  - Detect common sizes (8, 16, 32, 64)
  - Check for separator lines
  - Return suggested tile size
- [ ] Implement `sliceTileset(image, tileSize)`:
  - Calculate grid dimensions
  - Extract each tile as separate ImageData
  - Return array of tile objects with coordinates
- [ ] Implement `detectAutoTileVariants(tiles)`:
  - Use image similarity to group related tiles
  - Suggest which tiles form auto-tile sets
  - Return suggested mappings

#### Task 3.2: Create Tileset Configuration UI
**File:** `src/components/assets/TilesetConfigurator.tsx` (NEW)
- [ ] Show after asset upload (if image is grid-like)
- [ ] Display image with overlay grid
- [ ] Input: Tile size (with auto-detect suggestion)
- [ ] Input: Spacing between tiles (default: 0)
- [ ] Input: Margin around grid (default: 0)
- [ ] Visual: Highlight each detected tile
- [ ] Preview: Show first 16 tiles
- [ ] Button: "Configure Auto-Tiling" (opens advanced panel)
- [ ] Button: "Save as Tileset"

#### Task 3.3: Create Auto-Tile Mapper
**File:** `src/components/assets/AutoTileMapper.tsx` (NEW)
- [ ] Display all tiles from sprite sheet
- [ ] For each tile, input: Bitmask value (0-15)
- [ ] Visual helper: Show neighbor diagram for each bitmask
- [ ] Preset buttons:
  - "Standard 16-tile set" (maps 0-15 sequentially)
  - "Blob tileset" (different mapping)
  - "Corner-based" (alternative layout)
- [ ] Preview: Show sample auto-tiled region
- [ ] Save mapping to asset metadata

---

### **Task Group 4: Sprite Animation Editor (Day 2 Morning)**

#### Task 4.1: Create Animation Data Model
**File:** `src/types/animation.ts` (NEW)
- [ ] Define `Animation` interface:
  - `id: string`
  - `name: string`
  - `spriteSheetId: string`
  - `frames: Frame[]`
  - `fps: number`
  - `loop: boolean`
- [ ] Define `Frame` interface:
  - `x: number` (crop x)
  - `y: number` (crop y)
  - `width: number`
  - `height: number`
  - `duration: number` (optional, overrides fps)
- [ ] Export types

#### Task 4.2: Create Animation Service
**File:** `src/services/animation.ts` (NEW)
- [ ] Implement `createAnimation(canvasId, data)`:
  - Validate sprite sheet exists
  - Validate frames
  - Save to Firebase
  - Return animation ID
- [ ] Implement `updateAnimation(animationId, changes)`
- [ ] Implement `deleteAnimation(animationId)`
- [ ] Implement `subscribeToAnimations(canvasId, callback)`
- [ ] Add frame validation (within sprite sheet bounds)

#### Task 4.3: Create Animation Timeline Component
**File:** `src/components/animation/AnimationTimeline.tsx` (NEW)
- [ ] Display horizontal timeline with frame thumbnails
- [ ] Draggable frame order (reorder frames)
- [ ] Click frame to select
- [ ] Selected frame highlighted
- [ ] Show frame duration bars (visual length)
- [ ] Playhead indicator (current frame during playback)
- [ ] Controls:
  - Play/Pause button
  - Loop toggle
  - FPS slider (1-60 fps)
  - Add frame button
  - Delete frame button
- [ ] Timeline scrubbing (click to jump to frame)

#### Task 4.4: Create Frame Selector Component
**File:** `src/components/animation/FrameSelector.tsx` (NEW)
- [ ] Display sprite sheet with grid overlay
- [ ] Click to select frame region
- [ ] Drag to define custom frame bounds
- [ ] Show selected frame with highlight
- [ ] Input fields: x, y, width, height
- [ ] Quick presets for common frame sizes (16x16, 32x32, etc.)
- [ ] "Add to Timeline" button
- [ ] Preview: Show animation with selected frames

#### Task 4.5: Create Animation Preview Component
**File:** `src/components/animation/AnimationPreview.tsx` (NEW)
- [ ] Render animation in loop
- [ ] Use requestAnimationFrame for smooth playback
- [ ] Respect fps setting
- [ ] Show current frame number
- [ ] Size controls (1x, 2x, 4x zoom)
- [ ] Background options (transparent, checkerboard, color)
- [ ] Play/pause on click

---

### **Task Group 5: Animation Integration (Day 2 Afternoon)**

#### Task 5.1: Create Animated Sprite Component
**File:** `src/components/canvas/AnimatedSprite.tsx` (NEW)
- [ ] Accept props: `animationId`, `x`, `y`, `scale`, `playing`
- [ ] Load animation data from store
- [ ] Load sprite sheet image
- [ ] Implement frame cycling:
  - Track current frame index
  - Update based on fps and deltaTime
  - Loop if enabled
- [ ] Render current frame using Konva Image with crop
- [ ] Add play/pause control
- [ ] Add frame change callback

#### Task 5.2: Add Animation Tool to Toolbar
**File:** `src/components/toolbar/Toolbar.tsx` (EDIT)
- [ ] Add "Animation" tool button
- [ ] Keyboard shortcut: A
- [ ] When active:
  - Click canvas to place animated sprite
  - Opens animation selector modal
  - Places sprite at click position
- [ ] Show animation library in modal

#### Task 5.3: Create Animation Object Type
**File:** `src/types/canvasObject.ts` (EDIT)
- [ ] Add `AnimatedSprite` to object type union
- [ ] Define properties:
  - `animationId: string`
  - `playing: boolean`
  - `currentFrame: number`
  - `scale: number`
- [ ] Add to serialization/deserialization
- [ ] Add to selection/transform logic

#### Task 5.4: Add Animation Commands
**File:** `src/commands/AnimationCommands.ts` (NEW)
- [ ] Create `CreateAnimatedSpriteCommand`
- [ ] Create `UpdateAnimationCommand` (change playing state, frame)
- [ ] Create `DeleteAnimatedSpriteCommand`
- [ ] Integrate with undo/redo system

---

### **Task Group 6: Export System (Day 3 Morning)**

#### Task 6.1: Create Export Utilities
**File:** `src/utils/exporters/baseExporter.ts` (NEW)
- [ ] Define `Exporter` interface:
  - `export(canvas, options): Promise<ExportResult>`
  - `validate(canvas): ValidationResult`
  - `getSupportedFeatures(): string[]`
- [ ] Create `ExportResult` type:
  - `files: Array<{ name, content, mimeType }>`
  - `warnings: string[]`
  - `instructions: string` (how to use in target engine)

#### Task 6.2: Create Godot Exporter
**File:** `src/utils/exporters/godotExporter.ts` (NEW)
- [ ] Implement Godot .tscn format export:
  - Convert shapes to Node2D objects
  - Convert tilemap to TileMap node
  - Export sprite sheets as external resources
  - Create autotile configuration
  - Generate collision shapes (if physics enabled)
- [ ] Include: Scene file (.tscn), assets folder, README
- [ ] Generate Godot 4.x compatible format
- [ ] Add metadata: Node names, groups, layers

#### Task 6.3: Create Unity Exporter
**File:** `src/utils/exporters/unityExporter.ts` (NEW)
- [ ] Implement Unity prefab export:
  - Convert shapes to GameObject with SpriteRenderer
  - Convert tilemap to Tilemap component
  - Export sprite sheets with sprite slicing metadata
  - Create materials for each sprite
  - Generate collision shapes (BoxCollider2D, etc.)
- [ ] Include: Prefab file, sprites folder, materials folder, README
- [ ] Generate Unity 2021+ compatible format

#### Task 6.4: Create Phaser Exporter
**File:** `src/utils/exporters/phaserExporter.ts` (NEW)
- [ ] Implement Phaser JSON export:
  - Export as scene configuration object
  - Convert shapes to sprites/graphics
  - Convert tilemap to Tilemap JSON
  - Include atlas configuration for sprite sheets
  - Export animations as Phaser animation config
- [ ] Include: Scene JSON, assets folder, loading example
- [ ] Generate Phaser 3.x compatible format

#### Task 6.5: Create Generic JSON Exporter
**File:** `src/utils/exporters/genericExporter.ts` (NEW)
- [ ] Export canvas as engine-agnostic JSON:
  - All objects with transforms
  - Tilemap data (2D array)
  - Sprite sheets with frame definitions
  - Animations with frame sequences
  - Collision shapes
- [ ] Include schema documentation
- [ ] Add PNG export for each layer
- [ ] Provide usage examples

---

### **Task Group 7: Export UI (Day 3 Afternoon)**

#### Task 7.1: Create Export Modal
**File:** `src/components/export/ExportModal.tsx` (NEW)
- [ ] Show export target buttons:
  - Godot logo + "Export to Godot"
  - Unity logo + "Export to Unity"
  - Phaser logo + "Export to Phaser"
  - Generic icon + "Export JSON + PNG"
- [ ] Each button shows supported features
- [ ] Click opens target-specific configuration

#### Task 7.2: Create Export Configuration Panels
**File:** `src/components/export/ExportConfigPanel.tsx` (NEW)
- [ ] Godot options:
  - Target version (3.x, 4.x)
  - Include physics
  - Node naming scheme
- [ ] Unity options:
  - Target version
  - Pixel per unit
  - Include colliders
  - Material settings
- [ ] Phaser options:
  - Physics engine (Arcade, Matter)
  - Include loaders
  - Minify JSON
- [ ] Generic options:
  - Pretty print JSON
  - Include documentation
  - Export resolution

#### Task 7.3: Create Export Progress UI
**File:** `src/components/export/ExportProgress.tsx` (NEW)
- [ ] Show progress bar during export
- [ ] Display current step:
  - "Collecting assets..."
  - "Converting tilemap..."
  - "Generating files..."
  - "Creating archive..."
- [ ] Show warnings (features not supported, etc.)
- [ ] Success screen:
  - Download button (ZIP file)
  - Instructions for import
  - Link to target engine docs
- [ ] Error handling (show errors, retry button)

---

### **Task Group 8: Physics Preview (Day 3 Evening - Day 4 Morning)**

#### Task 8.1: Create Collision Shape Editor
**File:** `src/components/physics/CollisionEditor.tsx` (NEW)
- [ ] For each shape, add "Edit Collision" button
- [ ] Display collision box overlay (green outline)
- [ ] Drag handles to resize collision box
- [ ] Options:
  - Box (rectangle)
  - Circle
  - Polygon (custom points)
  - Auto-fit to sprite bounds
- [ ] Show collision offset (x, y)
- [ ] Save to shape metadata

#### Task 8.2: Create Physics Properties Panel
**File:** `src/components/physics/PhysicsPanel.tsx` (NEW)
- [ ] Show for selected shape
- [ ] Input fields:
  - Body type (static, dynamic, kinematic)
  - Mass
  - Friction
  - Bounce (restitution)
  - Gravity scale
- [ ] Toggle: "Enable Physics"
- [ ] Preset buttons: "Player", "Platform", "Projectile"

#### Task 8.3: Create Physics Preview Mode
**File:** `src/components/canvas/PhysicsPreview.tsx` (NEW)
- [ ] Add "Preview Physics" button to toolbar
- [ ] When enabled:
  - Initialize lightweight physics engine (matter.js)
  - Apply physics to all objects with collision
  - Simulate gravity
  - Show debug visualization (collision boxes)
  - Allow scrubbing timeline
- [ ] Pause/play simulation
- [ ] Reset to initial state
- [ ] Note: Preview only, not saved to canvas

---

### **Task Group 9: Asset Organization (Day 4 Afternoon)**

#### Task 9.1: Create Folder System
**File:** `src/services/assetFolders.ts` (NEW)
- [ ] Implement `createFolder(userId, name, parentId)`:
  - Create folder document
  - Support nested folders
  - Return folder ID
- [ ] Implement `moveAsset(assetId, folderId)`
- [ ] Implement `deleteFolder(folderId)` (moves contents to root)
- [ ] Add folder metadata (name, color, icon)

#### Task 9.2: Update Asset Library with Folders
**File:** `src/components/assets/AssetLibrary.tsx` (EDIT)
- [ ] Show folder tree in sidebar
- [ ] Click folder to view contents
- [ ] Breadcrumb navigation
- [ ] Drag assets between folders
- [ ] Context menu:
  - "New Folder"
  - "Rename Folder"
  - "Delete Folder"
  - "Move to..."
- [ ] Show asset count per folder

#### Task 9.3: Create Tag Management
**File:** `src/components/assets/TagManager.tsx` (NEW)
- [ ] Display all tags used in user's assets
- [ ] Click tag to filter library
- [ ] Add new tag to selected assets
- [ ] Remove tag from selected assets
- [ ] Rename tag (updates all assets)
- [ ] Tag colors (user-defined)
- [ ] Suggest tags based on asset type

---

### **Task Group 10: AI Tool Extensions**

#### Task 10.1: Add Animation Tool to AI
**File:** `src/ai/tools/animationTools.ts` (NEW)
- [ ] Implement `createAnimation` tool:
  - Parameters: `name`, `spriteSheetId`, `frameCount`, `fps`
  - Auto-slice sprite sheet into frames
  - Create animation
  - Return animation ID
- [ ] Implement `placeAnimatedSprite` tool:
  - Parameters: `animationId`, `x`, `y`, `playing`
  - Place on canvas
  - Return sprite object ID

#### Task 10.2: Add Export Tool to AI
**File:** `src/ai/tools/exportTools.ts` (NEW)
- [ ] Implement `exportCanvas` tool:
  - Parameters: `target` (godot|unity|phaser|generic), `options`
  - Validate canvas is exportable
  - Generate export
  - Return download link or show export modal
- [ ] Add instructions to response

#### Task 10.3: Update AI System Prompt
**File:** `src/ai/contextBuilder.ts` (EDIT)
- [ ] Add asset library to context:
  - Available sprite sheets
  - Available animations
  - Asset counts
- [ ] Add physics capabilities to description
- [ ] Add export capabilities to description
- [ ] Update example commands

---

### **Task Group 11: Testing & Polish**

#### Task 11.1: Unit Tests
**Files to test:**
- [ ] `tilesetSlicer.ts` - all slicing functions
- [ ] `assetUpload.ts` - upload validation
- [ ] All exporters - format validation
- [ ] `animation.ts` service - CRUD operations

#### Task 11.2: Integration Tests
- [ ] Test: Upload sprite sheet → configure as tileset → use in canvas
- [ ] Test: Create animation → place on canvas → verify playback
- [ ] Test: Export to Godot → verify file structure
- [ ] Test: AI command "create animation" → verify animation created
- [ ] Test: Physics preview → verify collision detection

#### Task 11.3: Export Validation Tests
- [ ] Test: Export Godot → import in Godot 4.x → verify scene loads
- [ ] Test: Export Unity → import in Unity 2021+ → verify prefab works
- [ ] Test: Export Phaser → load in Phaser 3.x → verify scene renders
- [ ] Test: Export JSON → validate schema

#### Task 11.4: Performance Tests
- [ ] Benchmark: Large sprite sheet slicing (1024x1024)
- [ ] Benchmark: Animation playback (60fps with 100 sprites)
- [ ] Benchmark: Export generation time (canvas with 1000 objects)

#### Task 11.5: Documentation
**File:** `docs/GAME_DEV_TOOLS.md` (NEW)
- [ ] Document asset upload workflow
- [ ] Document custom tileset creation
- [ ] Document animation system
- [ ] Document export process for each engine
- [ ] Include video tutorials or GIFs
- [ ] Add troubleshooting section

**File:** `docs/EXPORT_FORMATS.md` (NEW)
- [ ] Document each export format
- [ ] Show example output files
- [ ] Document import steps for each engine
- [ ] List supported/unsupported features per engine
- [ ] Include compatibility matrix

---

## Acceptance Criteria

### Asset Management
- [ ] User can upload PNG sprite sheets
- [ ] User can organize assets in folders
- [ ] User can tag and search assets
- [ ] Custom tilesets auto-slice correctly
- [ ] Auto-tile configuration saves properly

### Animation
- [ ] User can create frame-by-frame animations
- [ ] Animations play smoothly at target fps
- [ ] Timeline is intuitive and responsive
- [ ] Animated sprites integrate with canvas
- [ ] Undo/redo works for animation edits

### Export
- [ ] Godot export creates valid .tscn files
- [ ] Unity export creates valid prefabs
- [ ] Phaser export creates valid JSON
- [ ] Generic export includes all data
- [ ] Exported files import successfully in target engines

### Physics
- [ ] Collision shapes render correctly
- [ ] Physics preview simulates realistically
- [ ] Collision editor is intuitive
- [ ] Physics properties save properly

### Code Quality
- [ ] All exporters follow same interface
- [ ] Asset upload handles errors gracefully
- [ ] Animation system is performant (60fps)
- [ ] Export process is fast (<5s for typical canvas)

---

## Files Summary

### New Files (35+)
**Services:**
1. `src/services/assetUpload.ts`
2. `src/services/animation.ts`
3. `src/services/assetFolders.ts`

**Stores:**
4. `src/stores/assetStore.ts`

**Types:**
5. `src/types/animation.ts`
6. `src/types/export.ts`

**Utils:**
7. `src/utils/tilesetSlicer.ts`
8. `src/utils/exporters/baseExporter.ts`
9. `src/utils/exporters/godotExporter.ts`
10. `src/utils/exporters/unityExporter.ts`
11. `src/utils/exporters/phaserExporter.ts`
12. `src/utils/exporters/genericExporter.ts`

**Components - Assets:**
13. `src/components/assets/AssetUploadModal.tsx`
14. `src/components/assets/AssetLibrary.tsx`
15. `src/components/assets/AssetCard.tsx`
16. `src/components/assets/AssetDetailPanel.tsx`
17. `src/components/assets/TilesetConfigurator.tsx`
18. `src/components/assets/AutoTileMapper.tsx`
19. `src/components/assets/TagManager.tsx`

**Components - Animation:**
20. `src/components/animation/AnimationTimeline.tsx`
21. `src/components/animation/FrameSelector.tsx`
22. `src/components/animation/AnimationPreview.tsx`
23. `src/components/canvas/AnimatedSprite.tsx`

**Components - Export:**
24. `src/components/export/ExportModal.tsx`
25. `src/components/export/ExportConfigPanel.tsx`
26. `src/components/export/ExportProgress.tsx`

**Components - Physics:**
27. `src/components/physics/CollisionEditor.tsx`
28. `src/components/physics/PhysicsPanel.tsx`
29. `src/components/canvas/PhysicsPreview.tsx`

**Commands:**
30. `src/commands/AnimationCommands.ts`

**AI Tools:**
31. `src/ai/tools/animationTools.ts`
32. `src/ai/tools/exportTools.ts`

**Documentation:**
33. `docs/GAME_DEV_TOOLS.md`
34. `docs/EXPORT_FORMATS.md`

### Edited Files (5)
1. `src/components/toolbar/Toolbar.tsx`
2. `src/types/canvasObject.ts`
3. `src/ai/contextBuilder.ts`
4. `src/components/assets/AssetLibrary.tsx`
5. `src/components/canvas/Canvas.tsx`

---

## Third-Party Dependencies

Add to `package.json`:
```json
{
  "dependencies": {
    "jszip": "^3.10.1",          // For ZIP export
    "matter-js": "^0.19.0",      // For physics preview
    "pngjs": "^7.0.0"            // For PNG manipulation
  }
}
```

---

## Risk Mitigation

### Risk: Export Format Incompatibility
**Mitigation:** Test exports in actual engines (Godot, Unity, Phaser), provide clear documentation, include version compatibility warnings

### Risk: Large Asset Files
**Mitigation:** Implement file size limits (10MB per asset), optimize sprite sheets on upload, use progressive loading

### Risk: Complex Animation Performance
**Mitigation:** Limit simultaneous animations (50 max), use sprite sheet atlasing, implement LOD for distant sprites

### Risk: Physics Simulation Accuracy
**Mitigation:** Label as "preview only", provide disclaimers, link to actual game engine physics for production

---

## Next Steps After PR-31
→ **Phase 4:** AI Game-Aware (Enhanced AI with game-specific knowledge, better procedural generation)