# 🔬 Analyzer Diagnostics Guide

## Overview

The asset analyzer now includes comprehensive logging to show exactly what's being detected, why patterns might not be recognized, and what names are being applied.

---

## 📊 Console Output During Upload

### **Phase 1: Grid Detection**
```
🎯 Manual Grid Detection: Created 1438 sprites, skipped 62 empty cells (50x30 grid, 16×16 tiles, spacing: 1px, margin: 0px)
```

### **Phase 2: Sprite Sheet Analysis Start**
```
🔍 Starting sprite sheet analysis...
📐 Analyzing as 50x30 grid with 16x16px tiles
```

### **Phase 3: Pattern Analysis**
```
🔍 Running pattern analysis...
🔬 [ANALYZER] Starting tileset analysis...
🔬 [ANALYZER] Base metadata: {tileWidth: 16, tileHeight: 16, columns: 50, rows: 30, spacing: 1, margin: 0}
🔬 [ANALYZER] Slicing tileset image...
🔬 [ANALYZER] Sliced 1500 tiles
```

### **Phase 4: Pattern Detection Results**
```
🔬 [ANALYZER] Detecting patterns...
🔬 [ANALYZER] Blob16 confidence: 0.234 {confidence: 0.234, namedTiles: {...}}
🔬 [ANALYZER] Blob47 confidence: 0.187 {confidence: 0.187, namedTiles: {...}}
🔬 [ANALYZER] Wang confidence: 0.112 {confidence: 0.112, namedTiles: {...}}
🔬 [ANALYZER] Best pattern: blob16 (confidence: 0.234)
```

**This tells you:**
- Which pattern had the highest confidence
- Why it might not have been applied (if confidence < 0.6)

### **Phase 5: Feature Detection**
```
🔬 [ANALYZER] Detected 12 props
🔬 [ANALYZER] Detected 5 decals
```

### **Phase 6: Named Tiles Decision**
```
🔬 [ANALYZER] ⚠️ Confidence too low (0.234 < 0.6) - skipping auto-tile names
🔬 [ANALYZER] Total named tiles: 17
🔬 [ANALYZER] Sample named tiles: [['prop.0', 0], ['prop.1', 5], ['decal.0', 23], ...]
```

**OR if confidence is high:**
```
🔬 [ANALYZER] Adding auto-tile names (confidence > 0.6)
🔬 [ANALYZER] Auto-tile named tiles: {grass.center: 0, grass.edge_n: 1, ...}
🔬 [ANALYZER] Total named tiles: 47
🔬 [ANALYZER] Sample named tiles: [['grass.center', 0], ['grass.edge_n', 1], ...]
```

### **Phase 7: Analysis Complete**
```
🔬 [ANALYZER] ✅ Analysis complete. Result: {
  autoTileSystem: 'blob16',
  namedTiles: {...},
  features: {autotile: true, props: true, decals: true, animated: false},
  detectionConfidence: {autoTilePattern: 0.85, namedTiles: 0.7, overall: 0.775},
  warnings: []
}
✅ Pattern analysis complete: {...}
```

### **Phase 8: Theme/Material Analysis**
```
🎨 Running theme/material analysis...
✅ Theme analysis complete: {
  themes: ['forest', 'platformer'],
  materials: ['grass', 'dirt', 'stone'],
  ...
}
```

### **Phase 9: Semantic Naming**
```
✅ Sprite sheet analysis complete: {
  themes: ['forest'],
  materials: ['grass', 'dirt'],
  autoTileSystem: 'blob16',
  namedTileCount: 47,
  confidence: 0.775
}

🏷️ Found 47 named tiles, applying to 1438 sprites...
🏷️ Applying semantic names to 1438 sprites...
📋 Available semantic names: {0: 'grass_center', 1: 'grass_edge_n', ...}
📝 Sample renames (first 20):
  tileset_00 → tileset_grass_center
  tileset_01 → tileset_grass_edge_n
  tileset_02 → tileset_grass_edge_e
  ...
  ... and 1418 more
✅ Renamed 47/1438 sprites with semantic names
```

### **Phase 10: Final Summary**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Asset Upload Complete!
📦 Asset: kenney_platformer_tiles
🏷️  Type: spritesheet
🎨 Sprites: 1438 total
   └─ 47 with semantic names
   └─ 1391 with numeric names
📝 Sample sprite names:
   - kenney_platformer_tiles_grass_center
   - kenney_platformer_tiles_grass_edge_n
   - kenney_platformer_tiles_dirt_corner_ne
   - kenney_platformer_tiles_stone_center
   - kenney_platformer_tiles_prop_0
   - kenney_platformer_tiles_567
   - kenney_platformer_tiles_568
   ... and 1428 more
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚠️ Common Scenarios

### **Scenario 1: Pattern Not Recognized (Low Confidence)**

**Console Output:**
```
🔬 [ANALYZER] Blob16 confidence: 0.234
🔬 [ANALYZER] Blob47 confidence: 0.187
🔬 [ANALYZER] Wang confidence: 0.112
🔬 [ANALYZER] Best pattern: blob16 (confidence: 0.234)
🔬 [ANALYZER] ⚠️ Confidence too low (0.234 < 0.6) - skipping auto-tile names
🔬 [ANALYZER] Total named tiles: 0
⚠️ No named tiles detected by analyzer - sprites will keep numeric names
   This is normal for irregular sprite sheets or unrecognized patterns
```

**What This Means:**
- The tileset doesn't match standard auto-tile patterns (blob16, blob47, wang)
- This is **normal** for:
  - Mixed tilesets (multiple themes/materials)
  - Irregular sprite sheets
  - Custom tile arrangements
  - Non-standard auto-tile systems
- Sprites will use numeric names: `filename_00`, `filename_01`, etc.

### **Scenario 2: Partial Detection (Some Semantic Names)**

**Console Output:**
```
🔬 [ANALYZER] Best pattern: blob16 (confidence: 0.234)
🔬 [ANALYZER] ⚠️ Confidence too low (0.234 < 0.6) - skipping auto-tile names
🔬 [ANALYZER] Detected 12 props
🔬 [ANALYZER] Detected 5 decals
🔬 [ANALYZER] Total named tiles: 17
✅ Renamed 17/1438 sprites with semantic names
```

**What This Means:**
- Auto-tile pattern not recognized, BUT
- Individual props and decals were detected
- Result: Mixed naming
  - Props: `filename_prop_0`, `filename_prop_1`, etc.
  - Decals: `filename_decal_0`, `filename_decal_1`, etc.
  - Everything else: `filename_00`, `filename_01`, etc.

### **Scenario 3: Full Detection (Many Semantic Names)**

**Console Output:**
```
🔬 [ANALYZER] Best pattern: blob16 (confidence: 0.892)
🔬 [ANALYZER] Adding auto-tile names (confidence > 0.6)
🔬 [ANALYZER] Auto-tile named tiles: {grass.center: 0, grass.edge_n: 1, ...}
🔬 [ANALYZER] Detected 3 props
🔬 [ANALYZER] Total named tiles: 47
✅ Renamed 1438/1438 sprites with semantic names
```

**What This Means:**
- **High confidence** (> 0.6) in pattern detection
- Auto-tile names applied: `grass_center`, `grass_edge_n`, etc.
- Props also named: `prop_0`, `prop_1`, etc.
- Result: Most/all sprites have semantic names!

### **Scenario 4: Analysis Failed**

**Console Output:**
```
❌ Sprite sheet analysis failed, keeping original names: Error: ...
```

**What This Means:**
- Something went wrong during analysis (network, memory, etc.)
- Sprites keep their original auto-generated names
- Upload still succeeds, just without semantic naming

---

## 🎯 Understanding Confidence Scores

### **Confidence Threshold: 0.6 (60%)**

The analyzer uses a **0.6 threshold** to decide whether to apply auto-tile names:

| Confidence | Meaning | Action |
|------------|---------|--------|
| **0.9 - 1.0** | Perfect match | Apply names (very confident) |
| **0.7 - 0.9** | Strong match | Apply names (confident) |
| **0.6 - 0.7** | Good match | Apply names (somewhat confident) |
| **0.4 - 0.6** | Weak match | **Don't apply** (too uncertain) |
| **0.0 - 0.4** | No match | **Don't apply** (not recognized) |

### **Why 0.6?**

- **Too low (e.g., 0.3):** Would apply wrong names to tiles, causing confusion
- **Too high (e.g., 0.8):** Would skip many valid patterns, missing opportunities
- **0.6 is balanced:** Catches most standard patterns while avoiding false positives

---

## 🧪 Testing Your Tileset

### **What to Look For:**

1. **Sliced Tile Count**
   ```
   🔬 [ANALYZER] Sliced 1500 tiles
   ```
   Should match your expected grid size (columns × rows)

2. **Pattern Confidence**
   ```
   🔬 [ANALYZER] Best pattern: blob16 (confidence: 0.XXX)
   ```
   - **> 0.6:** Auto-tile names will be applied ✅
   - **< 0.6:** Only props/decals named, rest numeric ⚠️

3. **Named Tiles Count**
   ```
   🔬 [ANALYZER] Total named tiles: 47
   ```
   - **> 0:** Some semantic naming succeeded ✅
   - **= 0:** No patterns recognized, all numeric ⚠️

4. **Sample Names**
   ```
   📝 Sample sprite names:
     - tileset_grass_center  ← Semantic ✅
     - tileset_567           ← Numeric ⚠️
   ```

---

## 🔧 Troubleshooting

### **Problem: All sprites are numeric (no semantic names)**

**Check for:**
```
🔬 [ANALYZER] ⚠️ Confidence too low (0.XXX < 0.6)
```

**Possible Causes:**
1. **Tileset is not a standard auto-tile pattern**
   - Solution: This is normal for custom tilesets. Numeric names are fine!
2. **Spacing/margin is incorrect**
   - Solution: Double-check your spacing and margin settings
3. **Tile size is wrong**
   - Solution: Verify your tile dimensions (16×16, 32×32, etc.)

### **Problem: Only some sprites have semantic names**

**Check for:**
```
🔬 [ANALYZER] Detected 12 props
✅ Renamed 12/1438 sprites with semantic names
```

**Explanation:**
- This is **normal** for mixed tilesets
- Auto-tile patterns not detected, but individual features (props, decals) were
- Result: Partial semantic naming

### **Problem: Analyzer never runs**

**Check for:**
```
🔍 Starting sprite sheet analysis...
```

**If you DON'T see this:**
1. **Asset type might not be 'spritesheet'**
   - Check: Make sure you selected "Sprite Sheet" in the upload modal
2. **No sprite selections**
   - Check: Grid detection must run first and create sprites
3. **Analysis disabled**
   - Check: Analysis runs by default unless explicitly disabled

---

## 📝 What Gets Saved to Database

Even if semantic naming doesn't apply, the analyzer **still saves valuable metadata**:

```javascript
{
  type: 'spritesheet',
  spriteSheetMetadata: {
    spriteSelections: [
      {id: '...', name: 'tileset_grass_center', x: 0, y: 0, width: 16, height: 16},
      {id: '...', name: 'tileset_567', x: 17, y: 0, width: 16, height: 16},
      ...
    ]
  },
  // For tilesets, additional metadata:
  tilesetMetadata: {
    themes: ['forest'],
    materials: ['grass', 'dirt'],
    autoTileSystem: 'blob16',
    namedTiles: {
      'grass.center': 0,
      'grass.edge_n': 1,
      ...
    },
    detectionConfidence: {
      autoTilePattern: 0.85,
      namedTiles: 0.7,
      overall: 0.775
    }
  }
}
```

**The AI uses:**
- `namedTiles` mapping for precise tile placement
- `themes` and `materials` for asset discovery
- `autoTileSystem` for smart tile painting

**You see:**
- `spriteSelections[].name` for sprite names

---

## 🎓 Summary

**Good News:**
- ✅ You now have **complete visibility** into what the analyzer is doing
- ✅ You can see **why** patterns were/weren't detected
- ✅ You can see **exactly what names** were applied

**Normal Behavior:**
- ⚠️ Low confidence (< 0.6) is **common** for custom tilesets
- ⚠️ Numeric names are **fine** - the AI uses metadata, not sprite names
- ⚠️ Partial detection is **normal** for mixed tilesets

**When to Worry:**
- ❌ Analyzer never runs (no logs at all)
- ❌ Wrong tile count (sliced tiles ≠ expected)
- ❌ Analysis crashes (error messages)

---

**Updated:** October 17, 2025  
**Related:** [Asset Pipeline Synopsis](./ASSET_PIPELINE_SYNOPSIS.md) | [Asset Naming Explained](./ASSET_NAMING_EXPLAINED.md)

