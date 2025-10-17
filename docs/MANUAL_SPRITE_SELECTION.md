# Manual Sprite Selection Guide

## Overview

The Manual Sprite Selection tool allows you to extract sprites from irregular sprite sheets where tiles don't follow a uniform grid pattern. This is perfect for sprite collections like trees, rocks, logs, and other game assets with varying sizes.

## When to Use Manual Selection

### ✅ Use Manual Selection For:
- **Sprite collections** with mixed sizes (trees, rocks, items)
- **Texture atlases** without metadata
- **Hand-packed sprite sheets**
- Assets where auto-detection has **low confidence** (<50%)

### ❌ Use Auto-Detection For:
- **Uniform tilesets** (RPG Maker, Kenney.nl tiles)
- Regular **grid-based** sprite sheets
- Any asset with **consistent tile size and spacing**

## How It Works

### Step 1: Upload Asset
1. Click "Upload Asset" in the Asset Library
2. Select "Sprite Sheet" as the type
3. Choose your irregular sprite sheet file

### Step 2: Choose Mode
The upload modal will automatically detect if your sheet is regular or irregular:
- **High confidence (>70%)**: Auto-select "Auto-Detect Grid" tab
- **Low confidence (<50%)**: Auto-select "Manual Selection" tab

You can switch between tabs at any time:
- **Basic Info**: Name, tags, metadata
- **Auto-Detect Grid**: For uniform grids (shows confidence %)
- **Manual Selection**: For irregular sprites

### Step 3: Draw Sprite Bounds
In Manual Selection mode:

1. **Draw Rectangles**
   - Click and drag on the canvas to draw a rectangle around each sprite
   - The rectangle defines the sprite's bounds

2. **Name Sprites**
   - Each sprite gets a default name ("Sprite 1", "Sprite 2", etc.)
   - Click the name in the sidebar to rename it
   - Use descriptive names: "tree_large", "rock_small", etc.

3. **Zoom & Navigate**
   - Use **mouse wheel** to zoom in/out
   - Use **zoom buttons** (+/-) in the toolbar
   - Click **Reset** to restore original view

4. **Select & Edit**
   - Click a rectangle on the canvas to select it
   - Click a sprite in the sidebar to select it
   - Selected sprites are highlighted in blue

5. **Delete Sprites**
   - Click the **X button** next to a sprite in the sidebar
   - Or select and press Delete (if implemented)

### Step 4: Upload
1. Ensure you've selected all desired sprites
2. Give the asset a name in the "Basic Info" tab
3. Add tags for organization (optional)
4. Click "Upload Asset"

## Features

### Visual Feedback
- **Green rectangles**: Unselected sprites
- **Blue rectangles**: Selected sprite
- **Red dashed rectangle**: Currently drawing
- **Sprite names** above each rectangle
- **Dimensions** below each rectangle (e.g., "64×80")

### Sprite List Sidebar
- Shows all defined sprites
- Click to select
- Inline name editing
- Shows position and size
- Delete button for each sprite
- Highlights selected sprite

### Toolbar Controls
- **Zoom In/Out**: Adjust view scale (25%-500%)
- **Reset**: Return to 100% zoom, center view
- **Clear All**: Remove all sprite selections (with confirmation)
- **Sprite counter**: Shows number of defined sprites

### Export JSON
- Click "Export JSON" button in sidebar
- Downloads `sprites.json` with sprite definitions
- TexturePacker-compatible format (future)

## Usage Examples

### Example 1: Trees Sprite Sheet
```
Sheet contains:
- Large tree (64×80)
- Medium tree (48×60)
- Small tree (32×40)
- Flowers (8×8 each)

Steps:
1. Draw rectangle around large tree
2. Name it "tree_large"
3. Draw rectangle around medium tree
4. Name it "tree_medium"
5. Draw rectangle around small tree
6. Name it "tree_small"
7. Draw small rectangles around each flower
8. Name them "flower_1", "flower_2", etc.
9. Upload with tags: "nature", "trees", "flora"
```

### Example 2: Rock Collection
```
Sheet contains:
- Large boulders (64×48 each)
- Medium rocks (32×24 each)
- Small pebbles (16×12 each)

Steps:
1. Draw rectangle around each boulder
2. Name: "boulder_1", "boulder_2", etc.
3. Draw rectangles around medium rocks
4. Name: "rock_1", "rock_2", etc.
5. Draw rectangles around pebbles
6. Name: "pebble_1", "pebble_2", etc.
7. Upload with tags: "rocks", "terrain", "stone"
```

## Exported JSON Format

```json
{
  "frames": [
    {
      "id": "sprite_1234567890",
      "name": "tree_large",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 80
    },
    {
      "id": "sprite_1234567891",
      "name": "rock_small",
      "x": 70,
      "y": 0,
      "width": 32,
      "height": 24
    }
  ]
}
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Zoom In | Mouse Wheel Up |
| Zoom Out | Mouse Wheel Down |
| Draw Rectangle | Click + Drag |
| Select Sprite | Click |
| Pan View | (Future: Middle Mouse Drag) |

## Tips & Best Practices

### Drawing Sprites
- ✅ **Draw tight bounds**: Include only the sprite, not extra whitespace
- ✅ **Check edges**: Zoom in to ensure you captured the entire sprite
- ✅ **Name descriptively**: Use clear names like "tree_oak_large"
- ❌ **Don't overlap**: Keep rectangles separate

### Organizing Sprites
- Group similar sprites with naming conventions:
  - `tree_oak_small`, `tree_oak_medium`, `tree_oak_large`
  - `rock_gray_1`, `rock_gray_2`, `rock_brown_1`
- Use tags for broader categories: "trees", "rocks", "items"
- Consider creating multiple uploads for very different sprite types

### Performance
- **Large sheets** (>4096×4096): May slow down editor
- **Many sprites** (>100): Consider splitting into multiple uploads
- **Zoom in** for precision on small sprites

## Comparison: Auto-Detect vs Manual

| Feature | Auto-Detect | Manual Selection |
|---------|-------------|------------------|
| **Best For** | Uniform grids | Irregular sprites |
| **Speed** | Instant | Requires manual work |
| **Accuracy** | 95%+ on grids | 100% (you control it) |
| **Effort** | None | Draw each sprite |
| **Flexibility** | Limited | Complete control |
| **Sprite Naming** | Generic | Custom names |

## Troubleshooting

### Problem: Can't see sprites clearly
**Solution**: Use the zoom controls (+/-) to zoom in

### Problem: Drew rectangle wrong
**Solution**: Click the X next to the sprite in the sidebar to delete it, then redraw

### Problem: Sprite list is too long
**Solution**: Name sprites descriptively so you can find them easily

### Problem: Upload button disabled
**Solution**: 
- Check you've selected at least one sprite
- Ensure asset has a name in "Basic Info" tab

### Problem: Canvas won't zoom
**Solution**: Make sure your mouse is over the canvas area

## Future Enhancements

### Coming Soon
- [ ] Keyboard shortcuts (Delete, Ctrl+Z undo)
- [ ] Duplicate sprite selection
- [ ] Snap to grid
- [ ] Auto-name sprites by position
- [ ] Bulk operations (select multiple, move, delete)
- [ ] TexturePacker JSON import
- [ ] Crop sprite automatically (remove transparent pixels)

### Under Consideration
- [ ] AI-assisted sprite detection
- [ ] Color-based sprite separation
- [ ] Animation frame linking
- [ ] Sprite sheet packing/optimization

## Technical Details

### Coordinates
- **Origin**: Top-left (0, 0)
- **X-axis**: Left to right
- **Y-axis**: Top to bottom
- All coordinates in pixels

### Metadata Storage
Sprite selections are stored in Firebase with the asset:
```typescript
{
  spriteSheetMetadata: {
    selectionMode: 'manual',
    spriteSelections: [
      { id: '...', name: '...', x: 0, y: 0, width: 64, height: 80 }
    ]
  }
}
```

### Canvas Technology
- Built with **Konva.js** (React wrapper)
- Hardware-accelerated rendering
- Supports touch devices
- Responsive to container size

## See Also

- [Auto-Detection Guide](./AUTO_DETECTION.md)
- [Asset Library Documentation](./ASSET_LIBRARY.md)
- [Tileset Configuration](./TILESET_CONFIG.md)

---

**Need help?** Open an issue on GitHub or check the in-app help.


