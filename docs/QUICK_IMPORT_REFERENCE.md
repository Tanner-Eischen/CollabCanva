# Quick Tileset Import Reference Card

## 🚀 **3-Step Import Process**

### **Step 1: Download**
Visit these sites and download tilesets:
- **Kenney.nl** → https://kenney.nl/assets
- **0x72 Itch.io** → https://0x72.itch.io
- **OpenGameArt** → https://opengameart.org

### **Step 2: Upload**
1. Click **Assets** button → **Upload Asset**
2. Choose **"Sprite Sheet"** type
3. Click **Browse Files** → Select your `.png` file
4. The filename becomes the base name (auto-removes extension)

### **Step 3: Configure**
1. Set grid size:
   - **16x16** for most retro/dungeon tiles
   - **32x32** for modern platformer tiles
2. Click **Apply**
3. System auto-names: `filename_00`, `filename_01`, `filename_02`...
4. Add tags (platformer/top-down/dungeon/etc.)
5. Click **Upload Asset**

---

## ⚡ **Super Quick Reference**

| Game Type | Tile Size | Grid Setting | Tags |
|-----------|-----------|--------------|------|
| **Platformer** | 16x16 or 32x32 | `16 × 16` or `32 × 32` | `platformer`, `side-view`, `terrain` |
| **Top-Down** | 16x16 | `16 × 16` | `top-down`, `dungeon`, `rpg` |

---

## 📋 **Best Free Tilesets** (Direct Links)

### Platformer
| Name | Link | Tile Size |
|------|------|-----------|
| Kenney Platformer Pack | https://kenney.nl/assets/platformer-art-complete-pack | Multiple |
| Pixel Adventure 1 | https://pixelfrog-assets.itch.io/pixel-adventure-1 | 16x16 |

### Top-Down
| Name | Link | Tile Size |
|------|------|-----------|
| Dungeon Tileset II | https://0x72.itch.io/dungeontileset-ii | 16x16 |
| Kenney Tiny Dungeon | https://kenney.nl/assets/tiny-dungeon | 16x16 |

---

## 🎯 **File Naming Best Practices**

**Before uploading**, rename your files:

### Good Names:
✅ `kenney_plat_ground_grass.png` → Auto-generates: `kenney_plat_ground_grass_00`, `kenney_plat_ground_grass_01`...
✅ `0x72_dungeon_walls.png` → Auto-generates: `0x72_dungeon_walls_00`, `0x72_dungeon_walls_01`...
✅ `topdown_forest_tiles.png` → Auto-generates: `topdown_forest_tiles_00`, `topdown_forest_tiles_01`...

### Bad Names:
❌ `tileset.png` (too generic)
❌ `download (1).png` (not descriptive)
❌ `Untitled-1.png` (meaningless)

---

## 🔍 **After Import - Test Commands**

Ask the AI:
```
"List my platformer tilesets"
"Show me all 16px tilesets"
"Find a dungeon tileset with stone walls"
"What tilesets do I have?"
```

---

## 💡 **Pro Tips**

1. **Download first, rename, then upload** - easier to organize
2. **Use consistent prefixes** - `kenney_`, `0x72_`, `pixelfrog_`
3. **Group by game type** - keeps library organized
4. **Add multiple tags** - easier to find later
5. **Check grid size** - most important setting!

---

## 🐛 **Troubleshooting**

| Problem | Solution |
|---------|----------|
| "Browse Files" not working | Make sure you selected a type first |
| Wrong sprite names | Rename file before uploading |
| Too many/few sprites detected | Check grid size (16x16 vs 32x32) |
| Empty sprites detected | System now skips them automatically! |

---

## 📁 **Directory Structure**

Save downloaded files here:
```
public/assets/sheets/
├── platformer/
│   ├── kenney_plat_ground.png
│   └── pixel_adventure_terrain.png
└── topdown/
    ├── 0x72_dungeon_tiles.png
    └── kenney_dungeon_tiles.png
```

---

**Full Guide**: See `docs/FREE_TILESETS_GUIDE.md`

