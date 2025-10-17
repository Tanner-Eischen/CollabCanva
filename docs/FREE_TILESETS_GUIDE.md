# Free Tileset Import Guide

## 🎮 Recommended Free Tilesets

### **For Platformer Games** 🏃

#### 1. Kenney - Platformer Art Complete Pack
- **License**: CC0 (Public Domain)
- **Tile Size**: Multiple (16x16, 32x32, 64x64)
- **Download**: https://kenney.nl/assets/platformer-art-complete-pack
- **File Name**: `platformer_complete_pack.zip`
- **Contents**: Ground tiles, platforms, backgrounds, props, enemies
- **Naming Convention**: `kenney_plat_[type]_[variant]_[index]`
  - Example: `kenney_plat_ground_grass_00`, `kenney_plat_platform_wood_01`

#### 2. Pixel Adventure 1 & 2 (by Pixel Frog)
- **License**: Free for commercial use
- **Tile Size**: 16x16
- **Download**: https://pixelfrog-assets.itch.io/pixel-adventure-1
- **File Name**: `pixel_adventure.zip`
- **Contents**: Terrain blocks, platforms, traps, items
- **Naming Convention**: `pixelfrog_plat_[type]_[index]`

#### 3. Platformer Pack Redux
- **License**: CC0
- **Tile Size**: 16x16
- **Download**: https://opengameart.org/content/platformer-pack-redux-360-assets
- **File Name**: `platformer_pack_redux.png`
- **Contents**: 360 platform tiles with auto-tiling
- **Naming Convention**: `plat_redux_[type]_[index]`

---

### **For Top-Down Games** 🗺️

#### 1. Dungeon Tileset II (by 0x72)
- **License**: CC0 (Public Domain)
- **Tile Size**: 16x16
- **Download**: https://0x72.itch.io/dungeontileset-ii
- **File Name**: `dungeon_tileset_ii.png`
- **Contents**: Walls, floors, doors, decorations, props
- **Naming Convention**: `0x72_dungeon_[type]_[index]`
  - Example: `0x72_dungeon_wall_stone_00`, `0x72_dungeon_floor_brick_01`

#### 2. Tiny Dungeon (by Kenney)
- **License**: CC0 (Public Domain)
- **Tile Size**: 16x16
- **Download**: https://kenney.nl/assets/tiny-dungeon
- **File Name**: `tiny_dungeon.zip`
- **Contents**: Walls, floors, furniture, characters, items
- **Naming Convention**: `kenney_dungeon_[type]_[index]`

#### 3. Rogue Fantasy Catacombs
- **License**: CC0
- **Tile Size**: 16x16
- **Download**: https://opengameart.org/content/rogue-fantasy-catacombs
- **File Name**: `rogue_catacombs.png`
- **Contents**: Stone walls, floors, doors, props
- **Naming Convention**: `rogue_catacomb_[type]_[index]`

#### 4. Top-Down Dungeon Tileset
- **License**: CC BY 3.0
- **Tile Size**: 16x16
- **Download**: https://opengameart.org/content/top-down-dungeon-tileset
- **File Name**: `topdown_dungeon.png`
- **Contents**: Walls with auto-tiling, floors, decorations
- **Naming Convention**: `topdown_dungeon_[type]_[index]`

---

## 📥 **How to Import**

### **Step 1: Download Tilesets**
1. Visit each download link above
2. Download the tileset files to your computer
3. Extract any `.zip` files
4. Find the main `.png` sprite sheet files

### **Step 2: Import into CollabCanva**

For each tileset:

1. **Open the Asset Library**
   - Click the "Assets" button in the toolbar
   - Click "Upload Asset"

2. **Select Asset Type**
   - Choose "Sprite Sheet" (for irregular tilesets)
   - Choose "Tileset" (for uniform grid tilesets)

3. **Upload the File**
   - Click "Browse Files"
   - Select the `.png` file
   - The system will auto-name based on filename

4. **Configure Grid Detection**
   - For **16x16 tiles**: Set Grid to `16 × 16`, click "Apply"
   - For **32x32 tiles**: Set Grid to `32 × 32`, click "Apply"
   - The system will automatically:
     - Skip empty cells
     - Name sprites as `[filename]_00`, `[filename]_01`, etc.

5. **Add Tags**
   - Platformer tilesets: Add tags like `platformer`, `side-view`, `terrain`
   - Top-down tilesets: Add tags like `top-down`, `dungeon`, `rpg`, `walls`

6. **Upload Asset**
   - Click "Upload Asset"
   - Tileset is now available in your library!

---

## 🏷️ **Naming Convention Summary**

### **Auto-Generated Format**
```
[filename]_[index]
```

### **Examples**

**Platformer:**
```
kenney_plat_ground_00
kenney_plat_ground_01
kenney_plat_platform_00
pixel_adventure_terrain_00
plat_redux_grass_00
```

**Top-Down:**
```
0x72_dungeon_wall_00
0x72_dungeon_floor_00
kenney_dungeon_wall_00
topdown_dungeon_brick_00
```

---

## 📂 **Recommended Directory Structure**

```
public/assets/sheets/
├── platformer/
│   ├── kenney_plat_ground.png
│   ├── kenney_plat_platform.png
│   ├── pixel_adventure_terrain.png
│   └── plat_redux_tiles.png
│
└── topdown/
    ├── 0x72_dungeon_tiles.png
    ├── kenney_dungeon_tiles.png
    ├── topdown_dungeon_walls.png
    └── rogue_catacomb_tiles.png
```

---

## ✅ **Quick Start Checklist**

### Platformer Tilesets
- [ ] Download Kenney Platformer Pack
- [ ] Download Pixel Adventure 1
- [ ] Upload with 16x16 or 32x32 grid
- [ ] Tag with `platformer`, `side-view`
- [ ] Verify auto-naming worked

### Top-Down Tilesets
- [ ] Download 0x72 Dungeon Tileset II
- [ ] Download Kenney Tiny Dungeon
- [ ] Upload with 16x16 grid
- [ ] Tag with `top-down`, `dungeon`
- [ ] Verify auto-naming worked

---

## 🎨 **After Import**

### Test with AI Commands
```
"List my platformer tilesets"
"Find me a dungeon tileset with stone walls"
"Select a grass tileset for my platformer"
"Generate a 50x50 dungeon using my top-down tilesets"
```

### Verify Import
```
"What tilesets do I have?"
"Show me all 16px tilesets"
"List tilesets with dungeon theme"
```

---

## 📝 **License Notes**

- **CC0**: No attribution required, free for any use
- **CC BY 3.0**: Attribution required
- **Free for commercial**: Check specific license terms

Always verify license details before commercial use!

---

## 🔗 **Additional Resources**

- **OpenGameArt.org**: https://opengameart.org
- **Kenney.nl**: https://kenney.nl/assets
- **Itch.io Game Assets**: https://itch.io/game-assets
- **0x72's Assets**: https://0x72.itch.io

---

**Need Help?**
Ask the AI: "Help me import the [tileset name] I just downloaded"

