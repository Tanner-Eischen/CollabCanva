# AI Canvas Agent - Command Reference

## Overview

The AI Canvas Agent is a **game development co-pilot** that understands game design patterns and provides context-aware assistance. It uses natural language processing to manipulate the canvas, generate procedural content, analyze performance, and guide your game development workflow.

## Current Status

✅ **Fully Functional:**
- Basic shape commands (create, delete, modify)
- Transform operations (move, resize, rotate)
- Layout and alignment
- Tilemap painting and procedural generation
- Canvas queries

⚠️ **Requires Foundation Fixes (Coming Soon):**
- Smart Suggestions (built but not wired up)
- Game Type Detection integration
- Performance optimization commands
- Animation assistance
- Export guidance

## How to Use

### Desktop/Tablet
1. Type directly in the **AI chat input** at the bottom status bar
2. Press Enter or click Send
3. The AI executes and confirms success
4. Click the expand button to view full chat history

### Mobile
1. Tap the 🤖 button in the bottom status bar
2. Type your command in the popup modal
3. Tap Send
4. View responses in floating toast messages or full chat

## Command Categories

### 🎨 Shape Commands

#### Create Shapes
Create new shapes on the canvas.

**Examples:**
- "Create a red circle at (200, 200)"
- "Add a blue rectangle at position 300, 150 with size 200x100"
- "Make a yellow star at (400, 400)"
- "Create a text shape that says 'Hello World' at (100, 100)"

**Supported Shape Types:**
- rectangle, circle, ellipse
- star, polygon
- line, path
- text, rounded-rect

#### Delete Shapes
Remove shapes from the canvas.

**Examples:**
- "Delete the selected shapes"
- "Remove all circles"
- "Delete shape with ID shape-123"

#### Modify Shapes
Change properties of existing shapes.

**Examples:**
- "Change the color of selected shapes to green"
- "Make the selected shape 50% transparent"
- "Set the stroke width to 5"
- "Change the text to 'Updated Text'"

---

### 🔄 Transform Commands

#### Move Shapes
Reposition shapes on the canvas.

**Examples:**
- "Move selected shapes to (500, 500)"
- "Move all shapes right by 100 pixels"
- "Shift the selected shape down by 50"

#### Resize Shapes
Change the dimensions of shapes.

**Examples:**
- "Resize selected shape to 300x200"
- "Make the circle 150 pixels wide"
- "Scale selected shapes to 200x200 maintaining aspect ratio"

#### Rotate Shapes
Rotate shapes by an angle.

**Examples:**
- "Rotate selected shapes by 45 degrees"
- "Set rotation to 90 degrees"
- "Rotate the rectangle clockwise by 30 degrees"

---

### 📐 Layout Commands

#### Arrange Shapes
Organize shapes in grids, rows, or columns.

**Examples:**
- "Arrange selected shapes in a grid"
- "Arrange all shapes in a row with 20px spacing"
- "Layout shapes in a 3-column grid starting at (100, 100)"
- "Arrange shapes in a column"

#### Distribute Shapes
Space shapes evenly.

**Examples:**
- "Distribute selected shapes horizontally"
- "Space shapes evenly vertically"
- "Distribute all shapes with equal spacing"

#### Align Shapes
Align shapes to common edges or centers.

**Examples:**
- "Align selected shapes to the left"
- "Align all shapes to the top"
- "Center shapes horizontally"
- "Align shapes to the right edge"

**Alignment Options:**
- left, right, top, bottom
- center-horizontal, center-vertical

---

### 🗺️ Tilemap Commands

> ℹ️ **Registry-aware auto-tiling:** The agent queries the shared tileset registry before painting. If a requested tileset is un
available it automatically falls back to builtin variants, so commands remain safe even while custom tilesets are syncing.

#### Paint Tiles
Paint rectangular regions with tiles.

**Examples:**
- "Paint grass tiles from (0,0) to (10,10)"
- "Fill rows 5-15, columns 5-15 with water tiles"
- "Paint a stone path from (10,10) to (20,10)"

**Tile Types:**
- grass, dirt, water, stone, flower

#### Erase Tiles
Remove tiles from regions.

**Examples:**
- "Erase tiles from (5,5) to (10,10)"
- "Clear the tiles in rows 0-20, columns 0-20"

#### Generate Tilemaps (Procedural)
Create sophisticated procedural tilemaps using advanced algorithms.

**Examples:**
- "Generate a 50x50 natural terrain using Perlin noise"
- "Create a 40x40 cave system using cellular automata"
- "Generate a winding river path 30x30"
- "Make a 60x60 island with beaches"
- "Create a platformer level 100x30"
- "Generate a dungeon with rooms and corridors 80x80"

**🔧 Algorithms (All Implemented):**

**1. Perlin Noise** - Natural terrain
- Best for: Outdoor landscapes, height maps, organic terrain
- Parameters:
  - `scale`: Feature size (0.01-1.0, default: 0.1)
  - `octaves`: Detail layers (1-8, default: 4)
  - `persistence`: Amplitude decay (0-1, default: 0.5)
  - `lacunarity`: Frequency multiplier (1-4, default: 2.0)
- Example: `"Generate 50x50 terrain with scale 0.05 and 6 octaves"`

**2. Cellular Automata** - Caves and dungeons
- Best for: Cave systems, organic rooms, dungeon layouts
- Parameters:
  - `initialDensity`: Wall fill ratio (0-1, default: 0.45)
  - `birthLimit`: Neighbors for cell birth (0-8, default: 4)
  - `deathLimit`: Neighbors to survive (0-8, default: 3)
  - `iterations`: Simulation steps (1-20, default: 5)
- Example: `"Create cave 40x40 with 50% initial density and 8 iterations"`

**3. Wave Function Collapse** - Constraint-based
- Best for: Structured levels, tile-perfect patterns, no contradictions
- Parameters:
  - `tileset`: Available tiles with rules
  - `constraints`: Adjacency rules (platform edges, wall corners)
- Example: `"Generate 60x40 platformer using WFC with platform edge rules"`

**4. Random Walk** - Paths and rivers
- Best for: Rivers, roads, organic corridors
- Parameters:
  - `steps`: Path length (10-1000, default: 100)
  - `turnProbability`: Direction change chance (0-1, default: 0.1)
  - `branchProbability`: Split chance (0-0.3, default: 0.05)
  - `width`: Path thickness (1-10, default: 1)
- Example: `"Create a winding river 3 tiles wide with some branches"`

**⚙️ Advanced Options:**
- `seed`: For reproducible generation (any number)
- `autoTile`: Apply auto-tiling rules (default: true)
- `layers`: Generate multiple layers (terrain + decoration)
- `preview`: Generate small sample first (recommended for large maps)

---

### 🔍 Query Commands

#### Get Canvas State
Retrieve information about the canvas.

**Examples:**
- "What shapes are on the canvas?"
- "Show me the canvas state"
- "How many shapes are there?"
- "What's the tilemap size?"
- "Describe what I've built so far"
- "What game type does this look like?"

#### Get Selected Shapes
Get details about selected shapes.

**Examples:**
- "What shapes are selected?"
- "Tell me about the selected shapes"
- "Show selected shape properties"

#### Analyze Scene (⚠️ Foundation Fix Required)
Get intelligent analysis of your game scene.

**Examples:**
- "Analyze the current scene"
- "What game type is this?"
- "What's missing from this level?"
- "Is this level complete?"
- "Estimate the playtime for this level"
- "Are there any unreachable areas?"

**Returns:**
- Game type detection (platformer, top-down, puzzle, shooter)
- Confidence score
- Missing elements
- Suggestions for improvement
- Estimated gameplay time

---

### 🎮 Game Development Commands (PR-32)

#### Game Pattern Generation (⚠️ Foundation Fix Required)
Generate complete game level patterns.

**Examples:**
- "Generate a platformer level with difficulty medium"
- "Create a top-down dungeon room with enemies"
- "Make a puzzle grid 10x10"
- "Generate a boss arena with hazards"

**Pattern Types:**
- **platformer_level**: Platforms, gaps, enemies, collectibles
- **top_down_room**: Walls, entrance, exit, obstacles
- **puzzle_grid**: Regular grid, interactable objects
- **boss_arena**: Open space, hazards, spawn points

**Parameters:**
- `size`: Level dimensions
- `difficulty`: easy, medium, hard
- `theme`: forest, desert, ice, dungeon, etc.

#### Decoration Layer (⚠️ Foundation Fix Required)
Add intelligent decorations to existing terrain.

**Examples:**
- "Add trees to the grass areas"
- "Place rocks near mountains"
- "Add flowers to open areas"
- "Decorate the level with grass tufts"

**Options:**
- `density`: sparse, medium, dense
- `decorationType`: trees, rocks, flowers, grass-tufts

---

### 🎨 Asset & Animation Commands ✅

#### Smart Tileset Selection
Let the AI find the perfect tileset for your needs using intelligent discovery.

**Examples:**
- "Find me a forest tileset with grass and trees"
- "I need a 32px dungeon tileset with auto-tiling"
- "Show me tilesets with water tiles"
- "Find an animated tileset for my background layer"
- "Select a ground layer tileset with stone materials"

**How It Works:**
The AI queries your asset library based on:
- **Tile size**: Must match your map (16, 32, 48, 64px)
- **Theme**: Visual style (forest, dungeon, desert, cave, city)
- **Materials**: Required elements (grass, water, stone, wood, sand)
- **Features**: Auto-tiling, animation, props, decals
- **Layer**: Which layer it's for (ground, props, fx, background)

**AI Response:**
```
✓ Selected "Fantasy Forest Pack" (32px)
  Materials: grass, dirt, flowers, trees
  Features: auto-tiling, props
  Named tiles: "grass.center", "tree.small", "flower.red"
  3 alternatives available
```

#### Browse Tileset Library
See what assets you have in your library with smart filtering.

**Examples:**
- "What tilesets do I have?"
- "List my 32px tilesets"
- "Show me all forest-themed assets"
- "Do I have any tilesets with auto-tiling?"
- "Find tilesets with grass materials"

**Filters:**
- By tile size: "32px tilesets"
- By theme: "forest tilesets", "dungeon assets"
- By feature: "auto-tile enabled", "animated tilesets"
- By layer: "prop tilesets", "ground layers"
- By materials: "water tilesets", "stone assets"

**AI Response:**
```
Found 5 tilesets:
1. "Fantasy Forest" - 32px, themes: [forest, nature], auto-tiling
2. "Dungeon Pack" - 32px, themes: [dungeon, cave], auto-tiling, props
3. "Desert Tiles" - 32px, themes: [desert, sand]
4. "Water Set" - 32px, themes: [water, liquid], animated
5. "Stone Walls" - 32px, themes: [dungeon, castle], props

Summary: 5 total, tile sizes: [32px], 3 with auto-tiling, 1 animated
```

#### Upload and Use
Upload tilesets and the AI can use them immediately.

**Workflow:**
1. Upload tileset PNG to asset panel
2. Add theme tags (forest, dungeon, etc.)
3. Add material tags (grass, water, stone, etc.)
4. System auto-detects tile grid and patterns
5. AI can now discover and use it

**Auto-Detection:**
- ✅ Tile size (16, 32, 48, 64px)
- ✅ Grid layout (spacing, margins)
- ✅ Auto-tile patterns (blob16, blob47, wang)
- ✅ Props and decorations (isolated sprites)
- ✅ Decals (semi-transparent overlays)
- ✅ Animation frames (sequential tiles)
- ✅ Named tile index generation

**Example Conversation:**
```
User: "Paint a forest scene"

AI: [Searches assets] → Finds "Fantasy Forest Pack"
    [Selects ground tiles automatically]
    [Uses namedTiles["grass.center"] for painting]
    [Places trees as props using namedTiles["tree.small"]]
    [Adds flowers as decorations]
    ✓ Complete!
```

#### Animation Intelligence
Get help with animations.

**Examples:**
- "Create a walk cycle animation for this sprite"
- "What FPS should this animation use?"
- "Analyze these animation frames"
- "Is this animation complete?"

**Features:**
- Frame detection and layout analysis
- FPS recommendations (walk: 12fps, idle: 6fps, attack: 24fps)
- Missing frame detection
- Animation type recognition

---

### ⚡ Performance & Optimization (⚠️ Foundation Fix Required)

#### Analyze Performance
Get performance insights and optimization suggestions.

**Examples:**
- "Analyze canvas performance"
- "Why is the canvas running slow?"
- "Show performance report"
- "What bottlenecks exist?"

**Returns:**
- Current FPS and render time
- Performance score (0-100) and rating
- Bottleneck identification
- Memory usage estimate
- Draw call count

#### Auto-Optimize
Apply automatic optimizations.

**Examples:**
- "Optimize the canvas"
- "Improve performance"
- "Apply aggressive optimizations"
- "Enable viewport culling"

**Optimizations Applied:**
- Viewport culling for off-screen objects
- Static object caching
- Firebase write batching
- Animation complexity reduction
- Color palette optimization

**Returns:**
- Changes made
- Performance delta (before/after FPS)

#### Estimate Export Size
Check export file size before exporting.

**Examples:**
- "How large will the export be?"
- "Estimate export file size"
- "Will this export work in Godot?"

---

### 📤 Export Guidance (⚠️ Foundation Fix Required)

#### Export Recommendations
Get intelligent export suggestions.

**Examples:**
- "What should I export this as?"
- "Recommend the best export format"
- "Is this ready to export?"
- "Check export compatibility for Unity"

**Features:**
- Analyzes canvas content
- Recommends best target engine (Godot, Unity, Generic)
- Checks feature compatibility
- Identifies manual steps needed
- Validates export readiness

#### Export Readiness Check
Validate before exporting.

**Examples:**
- "Is my canvas ready to export?"
- "Check export readiness"
- "What's missing before export?"

**Checklist Returns:**
- ✓ All assets exist
- ✗ Some animations missing frames
- ✓ Tilemap is valid
- ⚠ Canvas is large, export will be slow

---

## Tips & Best Practices

### 1. Be Specific with Details
✅ "Create a red circle at (200, 200) with radius 50"  
❌ "Make a shape"

✅ "Generate a 50x50 Perlin noise terrain with scale 0.08"  
❌ "Make a map"

### 2. Use Coordinates (When Known)
✅ "Move shapes to (300, 400)"  
❌ "Move shapes over there"

**But AI understands relative commands too:**
- "Move selected shapes to the center of the canvas" ✅
- "Place a circle near the selected rectangle" ✅

### 3. Specify Selection Clearly
✅ "Delete selected shapes"  
✅ "Change color of all circles to blue"  
❌ "Delete them" (ambiguous)

### 4. Use Multi-Turn Planning
The AI can plan complex operations:

**Example conversation:**
```
User: "I want to create a platformer level"
AI: "I'll create a platformer level. Let me plan:
     1. Generate terrain using Perlin noise
     2. Add platform layers
     3. Place enemies
     4. Add collectibles
     Should I proceed?"
User: "Yes, but make it medium difficulty"
AI: "Generating medium difficulty platformer..."
```

### 5. Let AI Ask Clarifying Questions
Don't over-specify. The AI will ask if needed:
```
User: "Create a terrain"
AI: "What theme? Forest, desert, or ice?"
User: "Forest"
AI: "Generating forest terrain..."
```

### 6. Use Smart Suggestions (⚠️ Foundation Fix Required)
Click the **Quick Action chips** above the chat input:
- 💡 Contextually generated based on canvas state
- 🌍 "Generate terrain" (when canvas empty)
- 🎨 "Add decorations" (when tilemap exists)
- ⚡ "Optimize performance" (when many objects)

### 7. Experiment with Procedural Parameters

**Perlin Noise (Terrain):**
- **Scale 0.03-0.05**: Large continents, ocean
- **Scale 0.08-0.12**: Rolling hills, varied terrain
- **Scale 0.15-0.25**: Bumpy, highly varied
- **Octaves 4-6**: Good detail balance
- **Octaves 1-2**: Simple, smooth

**Cellular Automata (Caves):**
- **Initial Density 0.40**: Open caves, large rooms
- **Initial Density 0.50**: Dense, narrow passages
- **Iterations 3-5**: Smooth, organic
- **Iterations 10+**: Very smooth, rounded

**Random Walk (Paths):**
- **Turn Probability 0.05**: Mostly straight
- **Turn Probability 0.20**: Winding, natural
- **Branch Probability 0.0**: Single path
- **Branch Probability 0.1**: River delta

### 8. Request Modifications
AI remembers context:
```
User: "Generate a 50x50 terrain"
AI: *generates terrain*
User: "Make it more varied"
AI: *regenerates with higher octaves*
User: "Add a river through the middle"
AI: *adds river using Random Walk*
```

### 9. Let AI Find Assets ✨ NEW

Don't specify exact tileset IDs—let the AI discover the best match:

**Good:**
```
User: "Paint a forest background"
AI: [Searches library] → Finds "Fantasy Forest Pack"
    [Auto-selects appropriate tiles]
    ✓ Done!
```

**Also Good:**
```
User: "I need water tiles with auto-tiling"
AI: [Filters for: water + autotile]
    → Found 2 matches, using "Water Set Complete"
```

**Not Necessary:**
```
User: "Use tileset ID abc123 to paint grass" ❌
Better: "Paint some grass" ✓
```

The AI will:
- Match by theme and materials
- Consider tile size compatibility
- Prefer auto-tile enabled sets
- Use named tiles for precision

---

## Limitations

### Safety Constraints
- **Max shapes per command**: 100
- **Max tiles per command**: 10,000
- **Canvas bounds**: 0-5000 pixels
- **Tilemap max size**: 500x500 tiles
- **Rate limit**: 10 requests per minute

### Confirmation Required
Operations that delete more than 10 shapes require confirmation:
```
"Delete 50 shapes" → "Are you sure? Add confirm=true"
```

---

## Error Handling

### Common Errors

**"Rate limit exceeded"**
- Wait 60 seconds before sending another command
- Combine multiple operations into one command

**"Canvas bounds exceeded"**
- Coordinates must be between 0-5000
- AI will clamp to safe bounds automatically

**"Too many shapes"**
- Canvas limit: 1000 shapes total
- Consider deleting unused shapes

**"Invalid tile type"**
- Use only: grass, dirt, water, stone, flower
- Check spelling and case

---

## Examples by Use Case

### 🎮 Platformer Level Design
```
1. "Generate a 100x30 platformer level with medium difficulty"
2. "Add platforms at varying heights"
3. "Place some enemies on the platforms"
4. "Add coins throughout the level"
5. "Analyze the level and tell me what's missing"
```

**Alternative (Manual):**
```
1. "Generate 100x30 Perlin noise terrain with scale 0.1"
2. "Add a stone platform layer from (20,15) to (80,15)"
3. "Create 5 red circles (enemies) on the platforms"
4. "Create 10 yellow stars (coins) scattered around"
```

### 🏰 Top-Down Dungeon
```
1. "Generate a 60x60 cave dungeon using cellular automata"
2. "Add doors between the rooms"
3. "Place some NPCs or enemies in the dungeon"
4. "Add decorations to make it more interesting"
5. "Check if all rooms are connected"
```

### 🌍 Open World Terrain
```
1. "Generate 80x80 terrain with scale 0.05 and 6 octaves"
2. "Add a winding river 3 tiles wide"
3. "Add trees to grass areas with medium density"
4. "Place rocks near the mountains"
5. "Add flowers in open areas"
```

### 🧩 Puzzle Grid
```
1. "Create a 10x10 puzzle grid"
2. "Arrange 25 circles in a 5x5 grid at (200,200)"
3. "Make them different colors: red, blue, green, yellow"
4. "Add target areas for matching colors"
```

### 🎯 Performance Optimization Workflow
```
1. "Analyze canvas performance"
2. "What bottlenecks exist?"
3. "Optimize the canvas"
4. "Show performance report again"
```

### 📤 Export Preparation
```
1. "Is my canvas ready to export?"
2. "What's the best export format for this?"
3. "Check export compatibility for Godot"
4. "Estimate the export file size"
5. "Export to Godot 4 format"
```

### 🎨 UI Mockup (Non-Game)
```
1. "Create 3 rounded rectangles in a row at (100,100) with 20px spacing"
2. "Make them 200x100 each"
3. "Align all rectangles to the top"
4. "Make them blue, green, and red"
5. "Add text labels saying 'Button 1', 'Button 2', 'Button 3'"
```

---

## Keyboard Shortcuts

### AI Assistant
- **Enter**: Send message
- **Shift+Enter**: New line in message (not currently supported)
- **Escape**: Close AI popup (mobile) or hide history (desktop)

### Performance Profiler (⚠️ Foundation Fix Required)
- **Shift+P**: Toggle performance stats overlay
  - Shows FPS, render time, object count
  - Updates in real-time

---

## Multi-Turn Conversations

The AI maintains conversation context and can engage in planning:

### Example 1: Iterative Refinement
```
User: "Create a terrain"
AI: "What size and theme?"
User: "50x50 forest"
AI: *generates forest terrain*
User: "Make it more hilly"
AI: *adjusts noise scale*
User: "Perfect, now add some trees"
AI: *adds decoration layer*
```

### Example 2: Complex Planning
```
User: "Help me build a complete platformer level"
AI: "I'll guide you through creating a platformer level.
     Step 1: Let's generate the base terrain.
     What size? Typical is 100x30 for a single screen."
User: "100x30 sounds good"
AI: "Generating 100x30 platformer terrain...
     Done! Next, should I add platform layers?"
User: "Yes, add 3 platform layers"
AI: *adds platforms*
     "Great! Now we need enemies. How difficult?"
User: "Medium"
AI: *places enemies*
     "Level complete! Would you like me to analyze it?"
```

### Example 3: Problem Solving
```
User: "My canvas is running slow"
AI: "Let me analyze performance..."
    *runs analysis*
    "Found 3 issues:
     1. High object count (850 shapes)
     2. Many unique colors (prevents batching)
     3. No viewport culling
     Should I apply optimizations?"
User: "Yes"
AI: *applies optimizations*
    "Performance improved from 35 FPS to 58 FPS!"
```

---

## Feature Status & Roadmap

### ✅ Available Now (Fully Tested)
- Shape creation, modification, deletion
- Transform operations (move, resize, rotate)
- Layout and alignment commands
- Tilemap painting (manual)
- Procedural generation (all 4 algorithms)
- Canvas queries
- Basic conversation
- **Smart Tileset Selection** ✨ NEW
- **Tileset Library Browsing** ✨ NEW
- **Auto-Detection of Tileset Features** ✨ NEW
- **Named Tile Indexing** ✨ NEW
- **AI Context Enrichment with Asset Stats** ✨ NEW

### 🟡 Available But Needs Foundation Fixes
These features are **implemented but not wired up**:
- **Smart Suggestions** - Built, needs connection to UI
- **Game Type Detection** - Service exists, not in AI context
- **Performance Profiler** - Built, needs render loop integration
- **Animation Intelligence** - Requires animation system fixes
- **Performance Optimization** - Analysis works, auto-optimize not tested
- **Export Guidance** - Requires export pipeline validation

### 🔜 Coming in PR-32 (Post-Foundation Fixes)
- Multi-layer tilemap generation
- Advanced pattern recognition
- Scene understanding and completeness detection
- AI usage learning (personalized suggestions)
- Template-based generation
- Community pattern library

### 🔮 Future (Beyond PR-32)
- Scripting support ("Add behavior: move left to right")
- Physics-aware generation
- Sound integration ("Add sound triggers")
- Multiplayer testing preview
- Version control ("Create a variant")
- AI training on user's past projects

---

## Troubleshooting

### AI Doesn't Understand Command
1. **Rephrase in simpler terms**: "Create circle" instead of "Make a round thing"
2. **Break into steps**: "Generate terrain" then "Add decorations" instead of "Create complete level"
3. **Use examples as templates**: Copy format from examples above
4. **Let AI ask questions**: Say "Create a level" and AI will clarify details

### Smart Suggestions Not Appearing
⚠️ **Status:** Requires Foundation Fix Phase 1
- Smart suggestions are built but not connected
- Expected fix: 1-2 days
- Workaround: Use example commands directly

### Performance Commands Not Working
⚠️ **Status:** Requires Foundation Fix Phase 1
- Performance profiler exists but not recording data
- Expected fix: 1-2 days
- Workaround: Manually check FPS in DevTools

### "Rate Limit Exceeded" Error
- **Limit:** 10 requests per minute
- **Solution:** Wait 60 seconds
- **Prevention:** Combine operations into single commands
- **Note:** Complex procedural generation counts as 1 request

### Generation Takes Too Long
For large tilemaps (>100x100):
1. Use `preview` mode first: "Generate preview of 200x200 terrain"
2. Consider smaller sizes: 50x50 for testing
3. Check console for progress
4. Large generations may take 5-10 seconds

### "Canvas Bounds Exceeded" Error
- **Limit:** Coordinates must be 0-5000 pixels
- **Solution:** AI will auto-clamp to bounds
- **Tilemap:** Max 500x500 tiles

### Procedural Generation Looks Wrong
**Perlin Noise too chaotic:**
- Increase scale (0.15 → 0.08)
- Reduce octaves (6 → 4)

**Caves too dense:**
- Reduce initial density (0.5 → 0.4)
- Increase iterations (3 → 8)

**Paths too straight:**
- Increase turn probability (0.05 → 0.15)

**Request regeneration:**
- "Regenerate with different parameters"
- "Make it more varied/smooth/organic"

---

## Performance Tips

### For Large Canvases (500+ shapes)
- Use tilemap for terrain (not individual shapes)
- Request "Analyze performance" periodically
- Enable viewport culling: "Optimize canvas"

### For Large Tilemaps (10,000+ tiles)
- Generate in layers: terrain first, decoration later
- Use chunking: "Generate rows 0-50 first"
- Consider smaller tile size
- Test performance before adding more

### For Procedural Generation
- Start small (30x30) to test parameters
- Use `seed` for reproducible results
- Save good parameters for reuse
- Use preview mode for large maps

---

## Advanced Usage

### Using Seeds for Reproducibility
```
"Generate 50x50 terrain with seed 12345"
*Later...*
"Generate 50x50 terrain with seed 12345"
*Produces identical terrain*
```

### Combining Algorithms
```
1. "Generate 80x80 Perlin noise terrain"
2. "Add cave systems using cellular automata in rows 20-60"
3. "Create a river path through the middle"
4. "Add decoration layer with trees"
```

### Layer-Based Generation (⚠️ Foundation Fix Required)
```
1. "Create terrain layer: 100x100 Perlin noise"
2. "Create decoration layer: trees and rocks"
3. "Create object layer: enemies and items"
4. "Show only terrain layer"
```

### Constraint-Based Generation
```
"Generate platformer terrain where:
 - Platforms are jumpable distance apart
 - No isolated unreachable areas
 - Water only at bottom
 - At least 3 platform layers"
```

---

## API Reference (For Developers)

### AI Tool Categories
1. **Shape Tools** - Create, delete, modify shapes
2. **Transform Tools** - Move, resize, rotate, align
3. **Layout Tools** - Grid, row, column arrangements
4. **Tilemap Tools** - Paint, erase, generate
5. **Query Tools** - Get canvas state, selection info
6. **Analysis Tools** - Performance, game type, patterns
7. **Optimization Tools** - Auto-optimize, recommendations
8. **Export Tools** - Format guidance, readiness checks
9. **Meta Tools** - Undo, modify, help

### Tool Success Rate (Target: >90%)
- Shape operations: ~95%
- Transform operations: ~95%
- Layout operations: ~90%
- Tilemap painting: ~95%
- Procedural generation: ~85% (depends on parameters)
- Analysis: ~80% (requires foundation fixes)

---

## Need Help?

### In-App Help
- Type: "Help" or "What can you do?"
- AI will explain current capabilities

### Documentation
- **AI Commands**: This document
- **Foundation Fixes**: `Foundation_fixes.md`
- **PR-32 Roadmap**: `pr32_ai_game_aware.md`
- **Manual Sprite Selection**: `MANUAL_SPRITE_SELECTION.md`

### Issue Reporting
For bugs or feature requests:
1. Check if feature requires foundation fixes (marked ⚠️)
2. Check console for detailed error messages
3. File issue on GitHub with:
   - Command attempted
   - Expected vs actual result
   - Console errors (if any)
   - Canvas state (object count, tilemap size)

### Community
- Share successful procedural generation parameters
- Post example command workflows
- Request new AI capabilities

---

## Changelog

### Latest (Current)
- Added comprehensive procedural generation docs (4 algorithms)
- Added game development command categories
- Added performance and optimization commands
- Added export guidance documentation
- Added multi-turn conversation examples
- Added troubleshooting section
- Marked features requiring foundation fixes

### Previous
- Basic shape, transform, and tilemap commands
- Initial procedural generation (noise, caves, paths)
- Query commands

