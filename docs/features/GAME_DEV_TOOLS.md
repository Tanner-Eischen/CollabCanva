# Game Development Tools Guide

**PR-31: Game Development Tools Suite**

CollabCanva now includes a comprehensive suite of game development tools designed to streamline your game asset workflow. This guide explains all the new features and how to use them effectively.

---

## 📋 Table of Contents

1. [Sprite Animation System](#sprite-animation-system)
2. [Asset Library & Organization](#asset-library--organization)
3. [Tileset Management](#tileset-management)
4. [Physics Preview](#physics-preview)
5. [Export System](#export-system)
6. [AI-Powered Features](#ai-powered-features)

---

## 🎬 Sprite Animation System

### Overview
Create frame-by-frame sprite animations directly in CollabCanva. Perfect for character animations, effects, and interactive elements.

### Features

#### Creating Animations
1. **Upload a Sprite Sheet**: Use the Asset Library to upload your sprite sheet image
2. **Define Animation Frames**: Select regions of your sprite sheet to create animation frames
3. **Set Timing**: Configure FPS (frames per second) and loop settings
4. **Place on Canvas**: Add animated sprites to your canvas using the Animation tool

#### Animation Properties
- **Name**: Identify your animation (e.g., "walk_cycle", "jump", "attack")
- **FPS**: Control playback speed (1-60 frames per second, default: 12)
- **Loop**: Whether the animation repeats automatically
- **Frames**: Ordered list of sprite regions to display

#### Using the Animation Tool
1. Click the **Animation Tool** (🎬) in the toolbar (Shortcut: `A`)
2. Select an animation from the dropdown
3. Click on the canvas to place the animated sprite
4. Use the **Properties Panel** to adjust:
   - Play/Pause state
   - Current frame
   - Flip horizontal/vertical
   - Opacity
   - Size and rotation

### Components

**AnimatedSprite**: Canvas component that renders and plays sprite animations
- Automatic frame cycling based on FPS
- Supports all standard transform operations (move, resize, rotate)
- Real-time preview while editing

**Animation Timeline** *(in development)*: Visual editor for fine-tuning animations
- Frame-by-frame editing
- Duration adjustment per frame
- Preview controls (play, pause, step)

---

## 📁 Asset Library & Organization

### Overview
Centralized hub for managing all your game assets including sprites, tilesets, audio, and fonts.

### Features

#### Asset Types Supported
- **Images**: Single sprites, backgrounds, UI elements
- **Sprite Sheets**: Multi-frame character sprites
- **Tilesets**: Tile-based map assets with auto-tiling support
- **Audio** *(coming soon)*: Sound effects and music
- **Fonts** *(coming soon)*: Custom fonts for text rendering

#### Organization Tools

**Folders**
- Create nested folder hierarchies
- Drag and drop assets between folders
- Color-code folders for visual organization
- Custom folder icons

**Tags**
- Add multiple tags to any asset
- Filter by tags
- Auto-suggested tags based on asset type
- Common tags: `character`, `environment`, `ui`, `effect`, etc.

**Search & Filter**
- Full-text search across asset names and tags
- Filter by asset type
- Filter by folder
- Sort by name, date, or size

### Using the Asset Library

1. **Upload Assets**
   - Click the "+" button or drag files into the library
   - Automatic asset type detection
   - Batch upload supported

2. **Organize Assets**
   - Create folders: Right-click → New Folder
   - Move assets: Drag to folder
   - Add tags: Select asset → Add Tags panel

3. **Use Assets**
   - Drag asset onto canvas to place it
   - Click asset to view details
   - Double-click to edit (for tilesets/sprite sheets)

---

## 🎨 Tileset Management

### Overview
Advanced tileset tools for creating pixel-perfect tile-based maps with automatic edge matching.

### Features

#### Tileset Slicer
- **Auto-detect grid**: Automatically identifies tile size and layout
- **Manual selection**: Draw selection boxes for irregular sprite sheets
- **Grid snapping**: Ensures pixel-perfect alignment (8px grid)
- **Visual preview**: See all tiles before importing

#### Auto-Tiling System
- **Edge matching**: Tiles automatically connect at edges
- **Corner handling**: Proper corner tile placement
- **Terrain blending**: Smooth transitions between different tile types
- **Rule-based**: Define custom auto-tiling rules

#### Tile Painter
- **Brush tool**: Paint individual tiles
- **Fill tool**: Fill regions with a tile
- **Eraser**: Remove tiles
- **Multi-tile brushes**: Paint with 2x2, 3x3 stamp patterns

### Tileset Workflow

1. **Import Tileset**
   - Upload tileset image to Asset Library
   - Use Tileset Slicer to define tile regions
   - Name and tag your tileset

2. **Paint Tilemap**
   - Switch to Tilemap mode in canvas
   - Select tileset from palette
   - Use brush to paint tiles
   - Auto-tiling handles edges automatically

3. **Export**
   - Export as image (PNG)
   - Export with tile data (JSON + PNG)
   - Import directly into game engines

---

## ⚙️ Physics Preview

### Overview
Visual physics simulation for prototyping game mechanics. Preview how objects will behave with gravity, collision, and physics properties.

**Note**: This is a simplified preview system. For production games, use your game engine's physics.

### Features

#### Collision Shapes
- **Box**: Rectangular collision boundaries
- **Circle**: Circular collision areas
- **Polygon** *(coming soon)*: Custom collision shapes

**Collision Editor**:
- Visual overlay shows collision bounds in green
- Drag to reposition collision shape
- Resize handles for adjusting size
- Offset from sprite center

#### Physics Properties

**Body Types**:
- **Dynamic**: Affected by gravity and forces (players, projectiles)
- **Static**: Fixed position (platforms, walls)
- **Kinematic**: Controlled movement, not affected by physics (moving platforms)

**Properties**:
- **Mass**: How heavy the object is (0.1 - 10, default: 1)
- **Friction**: Surface grip (0 - 1, default: 0.5)
- **Bounce**: Bounciness/restitution (0 - 1, default: 0.3)
- **Gravity Scale**: How much gravity affects object (0 - 2, default: 1)

#### Presets
Quick-start physics configurations:
- **Player**: Dynamic body with high friction, no bounce
- **Platform**: Static body, moderate friction
- **Projectile**: Light dynamic body, high bounce, reduced gravity

### Using Physics Preview

1. **Enable Physics** for a shape:
   - Select shape on canvas
   - Open Physics Panel
   - Toggle "Enable Physics"

2. **Configure Properties**:
   - Choose body type
   - Adjust sliders for mass, friction, bounce, gravity
   - Or select a preset

3. **Edit Collision Shape**:
   - Click "Edit Collision" to show collision bounds
   - Adjust position and size
   - Collision shape shows as green dashed outline

4. **Test Physics**:
   - Click "Play" in Physics Preview
   - Watch objects fall, bounce, and collide
   - Adjust properties and test again

5. **Export**:
   - Physics properties are included in exports
   - Compatible with Godot and generic JSON formats

---

## 📦 Export System

### Overview
Export your canvas to game-ready formats with assets, data, and import instructions.

### Supported Formats

#### 1. **Godot (.tscn)**
Native Godot scene format

**Includes**:
- Godot scene file (.tscn)
- All referenced assets (PNG, sprite sheets, tilesets)
- Physics properties (RigidBody2D, StaticBody2D)
- Collision shapes (CollisionShape2D)
- Tile maps (TileMap nodes)
- Sprite animations (AnimatedSprite)
- Import instructions (README.txt)

**How to Use**:
1. Open Export modal
2. Select "Godot" format
3. Choose export options
4. Download ZIP file
5. Extract into your Godot project's scenes folder
6. Open .tscn file in Godot

#### 2. **Generic JSON**
Universal format for any game engine

**Includes**:
- scene.json with complete scene description
- All asset files (sprites, tilesets)
- Metadata (layers, z-index, transforms)
- Physics properties
- Animation data
- Import guide (README.txt)

**JSON Structure**:
```json
{
  "version": "1.0",
  "canvas": {
    "width": 800,
    "height": 600
  },
  "objects": [
    {
      "id": "shape-123",
      "type": "rectangle",
      "transform": {
        "x": 100,
        "y": 100,
        "width": 50,
        "height": 50,
        "rotation": 0
      },
      "style": {
        "fill": "#3B82F6FF",
        "stroke": "#000000FF",
        "strokeWidth": 2
      }
    }
  ],
  "animations": [...],
  "physics": {...}
}
```

**How to Use**:
1. Open Export modal
2. Select "Generic JSON" format
3. Download ZIP
4. Parse scene.json in your game engine
5. Load referenced assets
6. Recreate scene from data

### Export Options

- **Include Assets**: Bundle all referenced images/files
- **Pretty Print**: Format JSON for readability (vs minified)
- **Include Documentation**: Add README with import instructions
- **Export Selection Only**: Export only selected objects (not whole canvas)

### Best Practices

1. **Name Everything**: Give meaningful names to shapes, animations, and assets
2. **Use Tags**: Tag assets by category for easier organization in your game
3. **Test Before Export**: Use Physics Preview to verify behavior
4. **Check Asset References**: Ensure all assets are uploaded and referenced correctly
5. **Version Control**: Export regularly and commit to version control

---

## 🤖 AI-Powered Features

### Overview
AI assistant with game development awareness. Get intelligent suggestions and automation for common tasks.

### AI Capabilities

#### Asset Management
- **List Assets**: "What sprites do I have available?"
- **Analyze Assets**: "What's in this sprite sheet?"
- **Suggest Slicing**: "How should I slice this tileset?"
- **Recommend Assets**: "Find me a grass tile"

#### Animation
- **Create Animation**: "Make a walk cycle from this sprite sheet"
  - AI detects frames in sprite sheets
  - Suggests appropriate FPS
  - Sets up looping

#### Export
- **Export Guidance**: "Export this for Godot"
  - Validates scene is export-ready
  - Suggests missing properties
  - Provides format-specific tips

#### Tilemap Generation
- **Generate Terrain**: "Create a grassy field with water on the left"
- **Pattern Detection**: "Analyze this tilemap for patterns"
- **Optimization**: "How can I optimize this scene?"

### Using AI Features

1. **Open AI Chat Panel**: Click the AI button in the top-right
2. **Ask Questions**: Type natural language commands
3. **Review Suggestions**: AI provides detailed explanations
4. **Apply Changes**: AI can directly modify the canvas with your approval

### Example Commands

```
"Create a 100x100 rectangle in the center"
"Make all selected shapes blue"
"Generate a grass tilemap in the top-left"
"Create a walk animation from player_spritesheet.png"
"Export this canvas for Godot with physics"
"What assets do I have tagged with 'character'?"
"Slice my tileset into 16x16 tiles"
```

---

## 🎯 Workflows & Examples

### Workflow 1: Character Animation

1. **Prepare Sprite Sheet**
   - Create sprite sheet with character frames (walk, jump, idle, etc.)
   - Ensure consistent frame sizes
   - Export as PNG

2. **Upload to Asset Library**
   - Drag sprite sheet into Asset Library
   - Tag as "character", "player"
   - Name: "player_spritesheet.png"

3. **Create Animations**
   - Use AI: "Create walk cycle animation from player_spritesheet.png"
   - OR manually define frame regions
   - Set FPS to 12 for smooth animation

4. **Place on Canvas**
   - Select Animation tool (🎬)
   - Choose "walk" animation
   - Click to place
   - Test playback

5. **Add Physics**
   - Select animated sprite
   - Open Physics Panel
   - Apply "Player" preset
   - Test with Physics Preview

6. **Export**
   - Export for Godot
   - AnimatedSprite node will be created
   - Physics body included

### Workflow 2: Tile-Based Level

1. **Import Tileset**
   - Upload tileset image
   - Use Tileset Slicer
   - Define tile size (e.g., 16x16)
   - Name tiles: "grass", "dirt", "water"

2. **Paint Level**
   - Switch to Tilemap mode
   - Select tileset
   - Use brush to paint tiles
   - Auto-tiling handles edges

3. **Add Objects**
   - Switch back to Shape mode
   - Add player sprite
   - Add enemies, items, decorations

4. **Test Physics**
   - Enable physics on player (Dynamic)
   - Enable physics on ground tiles (Static)
   - Test with Physics Preview

5. **Export**
   - Export for your game engine
   - TileMap data included
   - Objects with physics properties

---

## 📚 Tips & Tricks

### Performance

- **Optimize Sprite Sheets**: Use power-of-2 dimensions when possible (256x256, 512x512)
- **Limit Animation FPS**: 12 FPS is often sufficient for pixel art
- **Use Tilesets**: More efficient than individual tile images
- **Atlas Packing**: Group similar assets into atlases

### Organization

- **Naming Convention**: Use descriptive, consistent names
  - Good: `player_walk_right`, `tile_grass_01`
  - Bad: `sprite1`, `image_final_2`
  
- **Folder Structure**:
  ```
  Assets/
    ├── Characters/
    │   ├── Player/
    │   └── Enemies/
    ├── Environment/
    │   ├── Tiles/
    │   └── Backgrounds/
    └── UI/
  ```

- **Tagging Strategy**:
  - Use categories: `character`, `environment`, `ui`, `effect`
  - Use descriptors: `animated`, `static`, `transparent`
  - Use states: `idle`, `walk`, `jump`, `attack`

### Collaboration

- **Real-Time Editing**: Multiple users can edit simultaneously
- **Presence Indicators**: See who's working on what
- **Asset Sharing**: Shared project assets available to all collaborators
- **Export Versioning**: Include version numbers in export filenames

---

## 🐛 Troubleshooting

### Animations Not Playing
- Check FPS is set (>0)
- Verify frames are defined correctly
- Ensure animation is marked as "playing" in properties

### Physics Not Working
- Confirm "Enable Physics" is toggled on
- Check body type is appropriate (Dynamic for moving objects)
- Verify collision shape is defined and visible

### Export Issues
- Ensure all assets are uploaded (check Asset Library)
- Verify no missing references (red warnings in export modal)
- Check file name validity (no special characters)

### Tilemap Problems
- Confirm tileset is sliced correctly
- Check auto-tiling rules for tileset type
- Verify tile dimensions match tileset grid

---

## 🚀 What's Next?

Upcoming features in development:
- [ ] Advanced physics simulation (joints, constraints)
- [ ] Particle system preview
- [ ] Audio waveform editor
- [ ] Animation curves and easing
- [ ] Multi-layer parallax backgrounds
- [ ] Lighting and shadow preview
- [ ] More export formats (Unity, Unreal, Phaser)
- [ ] Asset pack marketplace

---

## 📖 Additional Resources

- **Quick Start Guide**: See `QUICKSTART_AI.md` for AI features
- **Export Guide**: See `EXPORT_FORMATS.md` for detailed format specs
- **Sprint Documentation**: See `PR31_SPRINT1_COMPLETE.md` and `PR31_SPRINT2_COMPLETE.md`

---

**Questions or Issues?**
Open an issue on GitHub or contact the development team.

*Last updated: PR-31 Sprint 2 Complete*

