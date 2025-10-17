# 🎯 Grid Spacing & Margin Guide

## Overview

Many tilesets include **spacing** (gaps between tiles) and **margin** (border around the entire grid) to prevent texture bleeding during rendering. This guide shows you how to configure these settings.

---

## 📐 Understanding Spacing vs Margin

### **Spacing**
The gap **between tiles** in the grid.

```
┌────┬─┬────┬─┬────┐
│ T1 │ │ T2 │ │ T3 │  ← 1px spacing between each tile
└────┴─┴────┴─┴────┘
       ↑
     spacing
```

### **Margin**
The empty border **around the entire tileset**.

```
  ←margin→
  ┌───────────────────┐
  │ ┌────┬────┬────┐ │
↑ │ │ T1 │ T2 │ T3 │ │ ↑
  │ └────┴────┴────┘ │
  └───────────────────┘
```

---

## 🚀 Quick Setup

### **Your Case: 16×16 tiles with 1px spacing**

1. Open **Assets** → **Upload Asset**
2. Select **Sprite Sheet** type
3. Upload your image
4. In the grid controls, set:
   - **Grid**: `16 × 16`
   - **Spacing**: `1`
   - **Margin**: `0` (unless your tileset has a border)
5. Click **Apply**

**Formula Applied:**
```
X position = margin + (col × (tileSize + spacing))
Y position = margin + (row × (tileSize + spacing))

Example for tile at (2, 3):
X = 0 + (2 × (16 + 1)) = 0 + 34 = 34px
Y = 0 + (3 × (16 + 1)) = 0 + 51 = 51px
```

---

## 📊 Common Configurations

### **No Spacing (Packed)**
Most common for pixel art.
```
Grid: 16 × 16
Spacing: 0
Margin: 0
```

### **1px Spacing (Prevent Bleeding)**
Standard for many tilesets to avoid texture bleeding.
```
Grid: 16 × 16
Spacing: 1
Margin: 0
```

### **2px Spacing + 1px Margin**
Some high-quality tilesets.
```
Grid: 32 × 32
Spacing: 2
Margin: 1
```

### **Kenney Tilesets (Typical)**
Often packed with no spacing.
```
Grid: 16 × 16  (or 32 × 32)
Spacing: 0
Margin: 0
```

### **RPG Maker Tilesets**
Often have spacing.
```
Grid: 32 × 32
Spacing: 2
Margin: 0
```

---

## 🔍 How to Detect Your Tileset's Settings

### **Method 1: Visual Inspection**

1. Open your tileset in an image editor
2. Zoom in 400-800%
3. Look for gaps between tiles:
   - **No visible gaps** → Spacing = 0
   - **Thin line between tiles** → Count pixels (usually 1-2px)
4. Check edges for border:
   - **Tiles touch edges** → Margin = 0
   - **Border around tileset** → Measure in pixels

### **Method 2: Math Check**

If your tileset has consistent dimensions:

```
Total Width = margin + (cols × tileSize) + ((cols - 1) × spacing) + margin
Total Width = 2×margin + (cols × tileSize) + ((cols - 1) × spacing)

Example:
- Image: 273px wide
- Tiles: 16×16
- Expected columns: 16

Test spacing = 1:
Width = 2×0 + (16 × 16) + ((16-1) × 1)
Width = 0 + 256 + 15 = 271px ❌ (close but not exact)

Test spacing = 1, margin = 1:
Width = 2×1 + (16 × 16) + ((16-1) × 1)
Width = 2 + 256 + 15 = 273px ✅ Perfect!
```

### **Method 3: Trial and Error in App**

1. Upload your image
2. Start with: Grid = 16×16, Spacing = 0, Margin = 0
3. Click Apply
4. Look at the preview:
   - If tiles are slightly offset → Increase spacing by 1
   - If tiles are way off → Check margin
5. Adjust and retry until tiles align perfectly

---

## 🎨 Example: Processing Your 16×16 Tileset

### **Given**
- Tile size: 16×16px
- Spacing: 1px between tiles
- No margin

### **Configuration**
```
Grid: 16 × 16
Spacing: 1
Margin: 0
```

### **Result**
```
Tile Grid Positions:
┌────────────────────────────────┐
│ [0,0]  [17,0]  [34,0]  [51,0] │
│ 16×16  16×16   16×16   16×16  │
│                                │
│ [0,17] [17,17] [34,17] [51,17]│
│ 16×16  16×16   16×16   16×16  │
└────────────────────────────────┘

Formula:
Row 0, Col 0: X = 0 + (0 × 17) = 0
Row 0, Col 1: X = 0 + (1 × 17) = 17
Row 1, Col 0: Y = 0 + (1 × 17) = 17
```

---

## 🚨 Troubleshooting

### **Tiles are slightly offset (cutting edges)**
→ You probably have spacing but set it to 0
→ Try Spacing = 1 or 2

### **Tiles are too far apart (gaps in preview)**
→ Your spacing is too high
→ Reduce spacing by 1

### **First tile is correct, but rest drift off**
→ You have spacing but didn't configure it
→ Set Spacing to 1 or 2

### **All tiles are shifted right/down slightly**
→ You have a margin
→ Set Margin to 1 or 2

### **Only some rows/columns work**
→ Your tileset might be irregular
→ Use manual sprite selection instead

---

## 💡 Pro Tips

### **For Pixel-Perfect Slicing:**
1. Always zoom in and check the first few tiles
2. Inspect the last row/column too (spacing errors accumulate)
3. Empty tiles will be auto-skipped (even with spacing)

### **For Auto-Naming:**
- The filename becomes the base name
- Rename your file before uploading: `dungeon_tiles.png`
- Result: `dungeon_tiles_00`, `dungeon_tiles_01`, etc.

### **For Multiple Sections:**
1. Use **Region** mode
2. Draw a region around a specific section
3. Apply different spacing/grid settings per region
4. Repeat for other sections

---

## 📚 Related Documentation

- [Asset Upload Guide](./ASSET_UPLOAD_GUIDE.md)
- [Manual Sprite Selection](./MANUAL_SPRITE_SELECTION.md)
- [Auto-Naming System](./AUTO_NAMING.md)

---

## 🎯 Your Specific Case Summary

**For your 16×16 tiles with 1px spacing:**

```javascript
// Settings:
Grid: 16 × 16
Spacing: 1
Margin: 0

// This will correctly extract tiles at positions:
// (0,0), (17,0), (34,0), (51,0), ...
// (0,17), (17,17), (34,17), (51,17), ...
```

The system will:
✅ Skip empty cells automatically
✅ Auto-name tiles using your filename
✅ Apply proper spacing between tiles
✅ Save metadata for AI discovery

---

**Updated:** October 17, 2025  
**Feature Added:** Grid Spacing & Margin Support

