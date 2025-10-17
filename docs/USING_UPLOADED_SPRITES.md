# Using Uploaded Sprites Guide

## Testing Report: Rocks Sprite Sheet Upload ✅

**Date**: October 17, 2025  
**Tested Asset**: `Topdown RPG 32x32 - Rocks 1.1.PNG`  
**Result**: Successfully uploaded with 9 sprites detected

---

## Current Capabilities

### ✅ What Works Now

#### 1. **Upload & Organize Sprites**
- Upload sprite sheets with manual or auto sprite selection
- Define individual sprite bounds
- Name sprites descriptively (e.g., "rock_large_1")
- Tag assets for organization (e.g., "rocks", "nature")
- Export sprite selections as JSON

#### 2. **AI Assistant Integration** 🤖
The AI can access and work with your uploaded sprites.

**Available AI Commands:**

```
📋 Browse Assets
"What sprites do I have?"
"List my available assets"
"Show me all nature assets"

🔍 Analyze Specific Assets
"Tell me about my rocks sprite sheet"
"How many sprites are in the Rocks asset?"
"What can I do with the rocks?"

🎯 Get Recommendations
"Which asset should I use for decorating a forest?"
"Recommend a rock sprite for my terrain"
```

**Example Workflow:**
```
You: "What sprites do I have?"
AI: *calls listAssets* 
    "You have 2 sprite sheets:
     - Topdown RPG 32x32 - Trees (12 sprites)
     - Topdown RPG 32x32 - Rocks (9 sprites: rock_large_1, Sprite 2...)"

You: "Tell me about my rocks"
AI: *calls analyzeAsset*
    "Your rocks sprite sheet contains 9 individual rock sprites
     with varying sizes (32×32 to 96×64 pixels). 
     Tagged: rocks, nature"
```

#### 3. **Create Animations** 🎬
- Click "Animate" button in Asset Library
- Select multiple sprites to create frame-by-frame animation
- Set FPS, looping, etc.
- AI can create animated sprites on canvas

---

## ⚠️ Current Limitations (Discovered During Testing)

### ❌ What's NOT Yet Implemented

#### **Manual Sprite Placement**
Currently, there is **NO direct UI** for manually placing individual sprites onto the canvas.

**Missing Features:**
- ❌ Drag sprite from Asset Library to canvas
- ❌ Click sprite then click canvas to place
- ❌ Sprite "stamp" tool
- ❌ Browse sprites in a picker/palette

**Workarounds:**
1. **Use AI Assistant** to place sprites:
   ```
   "Place a large rock at (400, 300)"
   "Add some rock sprites scattered around the center"
   ```

2. **Create Animation** (even for static objects):
   - Click "Animate" button
   - Select ONE sprite frame
   - AI places it as an animatedSprite with 1 frame
   - ⚠️ This is a workaround, not ideal

---

## How to Use Sprites (Current Methods)

### Method 1: AI Assistant (Primary) ✅

**Step 1: Ask AI what you have**
```
User: "What rock sprites do I have?"
AI: Shows list of available sprites
```

**Step 2: Ask AI to place them**
```
User: "Place rock_large_1 at the center of the screen"
AI: Creates shape/image at specified location
```

**Step 3: Let AI help with layout**
```
User: "Scatter 10 random rocks across the bottom third"
AI: Places multiple rock sprites randomly
```

### Method 2: Create Animation (Workaround) ⚠️

For placing **static sprites manually**:

1. Open Asset Library
2. Click on your sprite sheet
3. Click "Animate" button
4. Select the ONE sprite you want to place
5. Set frames to just that one sprite
6. Name it (e.g., "rock_static_1")
7. Click "Create Animation"
8. Now AI can place this "animation" (which is really just 1 static sprite)

**Why this is a workaround:**
- Animations are for... animation
- Using them for static sprites is awkward
- Creates unnecessary overhead
- Not intuitive UX

---

## 🎯 Recommended Enhancement

### **Add Manual Sprite Placement Tool**

**Option A: Sprite Palette**
```
┌─────────────────────────┐
│  Sprite Palette         │
│  [Rocks Sprite Sheet]   │
│  ┌───┬───┬───┬───┐     │
│  │🪨│🪨│🪨│🪨│     │
│  └───┴───┴───┴───┘     │
│  Click to select,       │
│  then click canvas      │
└─────────────────────────┘
```

**Option B: Drag-and-Drop**
```
Asset Library → Canvas
1. Open Asset Library
2. Expand sprite sheet
3. Drag individual sprite
4. Drop onto canvas
```

**Option C: Stamp Tool**
```
Toolbar: [🎨 Sprite Stamp]
1. Click sprite stamp tool
2. Opens sprite picker
3. Select sprite
4. Click canvas to "stamp" it
```

---

## Asset Types & Use Cases

| Type | Organization | Placement | Animation | Best For |
|------|-------------|-----------|-----------|----------|
| **Single Image** | 1 sprite | AI only* | Optional | Props, icons |
| **Sprite Sheet** | Multiple sprites | AI only* | Optional | Collections (rocks, trees) |
| **Tileset** | Grid of tiles | Paint tool ✅ | Rarely | Terrain, backgrounds |

*Manual placement not yet implemented

---

## Testing Summary

### ✅ Tested & Working
- [x] Upload sprite sheet with auto-detection
- [x] Manual sprite selection with rectangle drawing
- [x] Zoom controls (25%-500%)
- [x] Sprite naming and organization
- [x] Tags for asset categorization
- [x] Export sprite selections to JSON
- [x] AI can list available assets
- [x] AI can analyze specific assets
- [x] AI can recommend assets for purposes

### ⚠️ Workarounds Available
- [x] Place sprites via AI commands (works well)
- [x] Create 1-frame "animations" for static sprites (awkward)

### ❌ Not Yet Implemented
- [ ] Manual drag-and-drop sprite placement
- [ ] Sprite stamp tool
- [ ] Sprite palette/picker UI
- [ ] Click-to-place workflow
- [ ] Right-click on sprite → "Add to Canvas"

---

## Example Workflow (Current Best Practice)

### Scenario: "I want to add decorative rocks to my scene"

**Step 1: Check what you have**
```
Open AI Assistant
You: "What rock sprites do I have?"
AI: Lists your 9 rock sprites with names/sizes
```

**Step 2: Ask AI to place them**
```
You: "Place 5 random rocks scattered in the center area"
AI: Places rock sprites at various positions
```

**Step 3: Refine manually**
```
- Use select tool to move individual rocks
- Resize if needed
- Rotate for variation
- Duplicate (Ctrl+D) for more copies
```

**Step 4: Organize layers**
```
- Rocks go on "Props" layer
- Move behind/in front of other objects as needed
```

---

## API Reference for Developers

### AI Tools for Assets

```typescript
// List all assets
listAssets(userId: string): Promise<Asset[]>

// Analyze specific asset
analyzeAsset(
  userId: string, 
  assetId: string
): Promise<AssetAnalysis>

// Recommend asset for purpose
recommendAsset(
  userId: string, 
  purpose: string,
  assetType?: 'tileset' | 'spritesheet' | 'image'
): Promise<AssetRecommendation>

// Suggest sprite sheet slicing
suggestSlicing(
  width: number,
  height: number,
  imageUrl?: string
): Promise<SlicingSuggestion>
```

### Sprite Sheet Metadata

```typescript
interface SpriteSheetMetadata {
  selectionMode: 'auto' | 'manual';
  spriteSelections?: SpriteSelection[];
  gridDetection?: {
    tileWidth: number;
    tileHeight: number;
    columns: number;
    rows: number;
    spacing?: number;
    margin?: number;
    confidence: number;
  };
}

interface SpriteSelection {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
```

---

## Conclusion

**What You Can Do Today:**
- ✅ Upload and organize sprite sheets beautifully
- ✅ Use AI to intelligently place sprites
- ✅ Create animations from sprites
- ✅ Ask AI for asset recommendations

**What Needs Implementation:**
- ⚠️ Manual drag-and-drop placement UI
- ⚠️ Sprite palette/picker
- ⚠️ Direct click-to-place workflow

**Recommendation:**
For now, **embrace the AI workflow** - it's actually quite powerful! The AI can:
- Understand your intent ("scatter rocks around")
- Place sprites intelligently
- Handle bulk operations easily
- Learn your preferences over time

The missing manual placement UI is worth adding, but the AI-first approach is already very functional.

