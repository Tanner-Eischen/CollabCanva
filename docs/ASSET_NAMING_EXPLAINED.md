# 🏷️ Asset Naming System Explained

## ✨ **NEW: Semantic Naming Enabled!**

As of October 17, 2025, the system now **automatically applies semantic naming** based on detected properties!

## How It Works Now

The asset analyzer uses a **semantic naming system**:

### **Automatic Semantic Naming** (Based on Detection)

When you upload a tileset or sprite sheet, the analyzer:
1. **Detects** tile types and patterns (grass, dirt, corners, edges, etc.)
2. **Renames sprites** to include semantic names
3. **Stores metadata** for AI consumption

**Before upload:**
```
nature_tiles_00
nature_tiles_01
nature_tiles_02
...
```

**After analysis (automatic):**
```
nature_tiles_grass_center
nature_tiles_grass_edge_n
nature_tiles_grass_edge_e
nature_tiles_grass_corner_ne
nature_tiles_dirt_center
nature_tiles_dirt_edge_n
...
```

### **Fallback for Undetected Tiles**
If the analyzer can't identify a tile, it keeps the index:
```
nature_tiles_00  ← Couldn't detect what this is
nature_tiles_grass_center
nature_tiles_02  ← Also undetected
nature_tiles_dirt_edge_n
```

---

## How the AI Uses This

When the AI wants to place a specific tile:

```typescript
// 1. User says: "Paint some grass center tiles"
// 2. AI calls selectTileset → gets the tileset with namedTiles
// 3. AI looks up: namedTiles["grass.center"] → returns 0
// 4. AI places sprite: nature_tiles_grass_center (which is tile index 0)
```

The AI uses the **namedTiles metadata mapping**, and now the sprite names are **human-readable** too!

---

## Why This Design?

### ✅ **Pros of Semantic Naming:**

1. **Human-readable** - `nature_tiles_grass_center` tells you exactly what it is
2. **Easy browsing** - You can search for "grass" or "center" in asset lists
3. **Better debugging** - Console logs show `nature_tiles_grass_center` instead of `nature_tiles_00`
4. **Self-documenting** - No need to check metadata to understand tile purpose
5. **AI-friendly** - The AI still uses metadata for precise lookups
6. **Reliable fallback** - Undetected tiles keep numeric names

### ⚠️ **Trade-offs:**

1. **Name length** - Semantic names can be longer than index-based names
2. **Depends on detection** - Quality depends on how well the analyzer works
3. **Mixed naming** - Some tiles may have semantic names, others numeric

---

## Current Behavior Examples

### **Kenney Tileset (Auto-Detected)**

**Upload:** `kenney_topdown_grass.png` (16 tiles, blob16 format)

**Sprite Names (after analysis):**
```
kenney_topdown_grass_grass_isolated
kenney_topdown_grass_grass_n
kenney_topdown_grass_grass_e
kenney_topdown_grass_grass_ne
kenney_topdown_grass_grass_s
kenney_topdown_grass_grass_ns
...
kenney_topdown_grass_grass_nesw
```

**Named Tiles Metadata:**
```javascript
{
  "0": "grass.isolated",
  "1": "grass.n",
  "2": "grass.e",
  "3": "grass.ne",
  "4": "grass.s",
  "5": "grass.ns",
  ...
  "15": "grass.nesw"
}
```

**AI Usage:**
```javascript
// AI wants to place a fully connected grass tile
// Looks up: namedTiles["grass.nesw"] → 15
// Places: kenney_topdown_grass_grass_nesw
```

**Console Output During Upload:**
```
🏷️ Applying semantic names to 16 sprites...
  kenney_topdown_grass_00 → kenney_topdown_grass_grass_isolated
  kenney_topdown_grass_01 → kenney_topdown_grass_grass_n
  kenney_topdown_grass_02 → kenney_topdown_grass_grass_e
  ...
✅ Renamed 16/16 sprites with semantic names
```

---

### **Generic Tileset (Partially Detected)**

**Upload:** `random_tiles.png` (24 tiles, unknown pattern but some recognizable materials)

**Sprite Names (after analysis):**
```
random_tiles_grass_center  ← Detected as grass
random_tiles_dirt_center   ← Detected as dirt
random_tiles_02            ← Couldn't identify
random_tiles_water_center  ← Detected as water
random_tiles_04            ← Couldn't identify
...
random_tiles_23            ← Couldn't identify
```

**Console Output During Upload:**
```
🏷️ Applying semantic names to 24 sprites...
  random_tiles_00 → random_tiles_grass_center
  random_tiles_01 → random_tiles_dirt_center
  random_tiles_03 → random_tiles_water_center
  ...
✅ Renamed 8/24 sprites with semantic names
```

**Result:** The system applies semantic names where it can, but keeps numeric names as a fallback for unrecognized tiles.

---

## How to Check What the AI Sees

### **1. Check the Console Log After Upload**

Look for:
```
✅ Tileset analysis complete: {
  themes: ['forest'],
  materials: ['grass', 'dirt'],
  autoTileSystem: 'blob16',
  namedTileCount: 16,
  confidence: 0.85
}
```

- `namedTileCount: 16` → Analyzer detected and named 16 tiles
- `namedTileCount: 0` → No detection, using basic numbering

### **2. Ask the AI**

```
"What assets do I have?"
"Analyze my nature tiles asset"
"What tiles are in my grass tileset?"
```

The AI will show you the **namedTiles** mapping.

### **3. Check Firebase Database**

Navigate to:
```
/assets/{userId}/{assetId}/tilesetMetadata/namedTiles
```

You'll see the full mapping.

---

## Detection Confidence

The analyzer assigns confidence scores:

```javascript
detectionConfidence: {
  autoTilePattern: 0.9,  // 90% confident it's blob16
  namedTiles: 0.85,      // 85% confident in tile naming
  overall: 0.875         // Overall confidence
}
```

**High confidence (> 0.7):**
- Kenney tilesets → Usually 0.9+
- Well-structured grids → 0.7-0.9

**Low confidence (< 0.5):**
- Irregular sprite sheets → 0.1-0.3
- Mixed assets → 0.2-0.4

When confidence is low, the system uses **basic numbering** as a fallback.

---

## Should You Rename Sprites Semantically?

### **Current System Works Best When:**
- ✅ Using AI for tile placement (it uses metadata, not names)
- ✅ Uploading many different tilesets (no name collisions)
- ✅ Working with unknown/irregular sprite sheets (always has valid names)

### **Semantic Naming Would Help When:**
- 🔧 Manually browsing sprites in a list
- 🔧 Debugging tile placement issues
- 🔧 Working with a small, well-known tileset collection
- 🔧 Teaching others how the tileset is structured

---

## ✅ Semantic Naming is Now Active

**The system automatically applies semantic naming** with these benefits:

1. ✅ **Human-readable names** - Easy to understand what each sprite is
2. ✅ **Better debugging** - Console logs are more informative
3. ✅ **Searchable** - Find sprites by typing "grass", "corner", etc.
4. ✅ **Reliable fallback** - Undetected tiles keep numeric names
5. ✅ **Zero configuration** - Works automatically on upload

**How to See It in Action:**

1. Upload a tileset or sprite sheet
2. Watch the console during upload
3. Look for the renaming log:
   ```
   🏷️ Applying semantic names to 16 sprites...
     filename_00 → filename_grass_center
     filename_01 → filename_grass_edge_n
     ...
   ✅ Renamed 16/16 sprites with semantic names
   ```
4. Your sprites now have meaningful names!

---

**Updated:** October 17, 2025  
**Related:** [Asset Pipeline Synopsis](./ASSET_PIPELINE_SYNOPSIS.md)

