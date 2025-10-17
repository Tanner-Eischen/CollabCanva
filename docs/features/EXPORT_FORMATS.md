# Export Formats Reference

**PR-31: Export System Documentation**

Complete reference for all supported export formats, file structures, and integration guides.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Godot Format (.tscn)](#godot-format-tscn)
3. [Generic JSON Format](#generic-json-format)
4. [Integration Guides](#integration-guides)
5. [File Structure](#file-structure)

---

## 🎯 Overview

CollabCanva exports scenes to game-ready formats with all assets, data, and documentation included. Exports are packaged as ZIP archives for easy distribution.

### Supported Formats

| Format | Extension | Best For | Features |
|--------|-----------|----------|----------|
| **Godot** | `.tscn` | Godot Engine 3.x/4.x | Native scene format, physics, tilemaps, animations |
| **Generic JSON** | `.json` + `.png` | Any game engine | Universal format, easy parsing, complete data |

### What's Included in Every Export

- ✅ All canvas objects (shapes, sprites, tilemaps)
- ✅ Transform data (position, rotation, scale)
- ✅ Visual properties (colors, opacity, layers)
- ✅ Referenced asset files (PNG, sprite sheets)
- ✅ Animation data
- ✅ Physics properties
- ✅ Import instructions (README.txt)

---

## 🎮 Godot Format (.tscn)

### Overview

Native Godot scene format compatible with both Godot 3.x and 4.x. Exports scenes as `.tscn` (text-based scene) files with all referenced assets.

### File Structure

```
export_MyCanvas_godot_20241017.zip
├── README.txt                 # Import instructions
├── scene.tscn                 # Main scene file
├── assets/                    # Asset folder
│   ├── sprites/
│   │   ├── player.png
│   │   └── enemy.png
│   ├── tilesets/
│   │   └── terrain.png
│   └── backgrounds/
│       └── sky.png
```

### Scene Structure (.tscn)

Godot scenes are hierarchical. CollabCanva exports follow this structure:

```
[gd_scene]
├── Node2D (root)
    ├── Sprite2D (for images/sprites)
    ├── AnimatedSprite2D (for animations)
    ├── TileMap (for tilemaps)
    ├── RigidBody2D (for dynamic physics objects)
    │   └── CollisionShape2D
    └── StaticBody2D (for static physics objects)
        └── CollisionShape2D
```

### Example .tscn File

```gdscript
[gd_scene load_steps=3 format=3]

[ext_resource type="Texture2D" path="res://assets/sprites/player.png" id="1"]

[sub_resource type="RectangleShape2D" id="1"]
size = Vector2(50, 50)

[node name="Canvas" type="Node2D"]

[node name="Player" type="RigidBody2D" parent="."]
position = Vector2(100, 100)
mass = 1.0
physics_material_override = null

[node name="Sprite" type="Sprite2D" parent="Player"]
texture = ExtResource(1)

[node name="CollisionShape" type="CollisionShape2D" parent="Player"]
shape = SubResource(1)

[node name="Ground" type="StaticBody2D" parent="."]
position = Vector2(400, 500)

[node name="Polygon" type="CollisionPolygon2D" parent="Ground"]
polygon = PoolVector2Array(0, 0, 800, 0, 800, 100, 0, 100)
```

### Property Mappings

#### Transform
| CollabCanva | Godot |
|-------------|-------|
| `x, y` | `position = Vector2(x, y)` |
| `rotation` (degrees) | `rotation = radians(rotation)` |
| `width, height` | `scale = Vector2(width/original, height/original)` |

#### Visual
| CollabCanva | Godot |
|-------------|-------|
| `fill` (color) | `modulate = Color(r, g, b, a)` |
| `opacity` | `modulate.a` |
| `zIndex` | `z_index = zIndex` |

#### Physics
| CollabCanva | Godot Body Type |
|-------------|-----------------|
| `dynamic` | `RigidBody2D` |
| `static` | `StaticBody2D` |
| `kinematic` | `CharacterBody2D` |

| Property | Godot Property |
|----------|----------------|
| `mass` | `mass` |
| `friction` | `physics_material_override.friction` |
| `bounce` | `physics_material_override.bounce` |
| `gravityScale` | `gravity_scale` |

### Importing into Godot

1. **Extract ZIP** to your Godot project folder (e.g., `res://scenes/`)

2. **Open Scene** in Godot:
   - File → Open Scene
   - Navigate to extracted `.tscn` file
   - Scene loads with all nodes and assets

3. **Verify Assets**:
   - Check FileSystem panel for `assets/` folder
   - Reimport if textures appear blank (right-click → Reimport)

4. **Test Scene**:
   - Click Play Scene (F6)
   - Physics objects should move/collide correctly
   - Animations should play

5. **Customize**:
   - Add scripts to nodes
   - Configure collision layers/masks
   - Set up signals and connections
   - Add game logic

### Godot Version Compatibility

- **Godot 3.x**: Fully supported
- **Godot 4.x**: Supported (minor syntax differences auto-converted)
- **Godot 2.x**: Not officially supported (may work with manual conversion)

### Known Limitations

- Custom shaders not exported (add manually)
- Particle systems not included (yet)
- No support for 3D (Node2D only)
- Camera settings not exported (add Camera2D manually)

---

## 📄 Generic JSON Format

### Overview

Universal, engine-agnostic format that works with any game framework. Exports canvas as structured JSON with all referenced assets.

### File Structure

```
export_MyCanvas_generic_20241017.zip
├── README.txt                 # Import instructions
├── scene.json                 # Complete scene data
├── assets/                    # Asset folder
│   ├── sprites/
│   │   ├── player.png
│   │   └── enemy.png
│   ├── tilesets/
│   │   └── terrain.png
│   └── backgrounds/
│       └── sky.png
```

### JSON Schema

Complete schema for `scene.json`:

```json
{
  "version": "1.0",
  "metadata": {
    "exportedAt": 1697558400000,
    "canvasId": "canvas-abc123",
    "canvasName": "My Game Level",
    "exportFormat": "generic",
    "appVersion": "0.5.0"
  },
  "canvas": {
    "width": 800,
    "height": 600,
    "backgroundColor": "#1E293BFF"
  },
  "assets": [
    {
      "id": "asset-123",
      "name": "player",
      "type": "image",
      "path": "assets/sprites/player.png",
      "width": 32,
      "height": 32
    }
  ],
  "objects": [
    {
      "id": "shape-001",
      "name": "Player",
      "type": "rectangle",
      "transform": {
        "x": 100,
        "y": 100,
        "width": 50,
        "height": 50,
        "rotation": 0,
        "scaleX": 1,
        "scaleY": 1
      },
      "style": {
        "fill": "#3B82F6FF",
        "stroke": "#000000FF",
        "strokeWidth": 2,
        "opacity": 1
      },
      "layer": {
        "zIndex": 10,
        "layerName": "Characters"
      },
      "physics": {
        "enabled": true,
        "bodyType": "dynamic",
        "mass": 1,
        "friction": 0.5,
        "bounce": 0.3,
        "gravityScale": 1,
        "collision": {
          "type": "box",
          "offsetX": 0,
          "offsetY": 0,
          "width": 50,
          "height": 50
        }
      }
    }
  ],
  "animations": [
    {
      "id": "anim-001",
      "name": "player_walk",
      "spriteSheetId": "asset-123",
      "frames": [
        { "x": 0, "y": 0, "width": 32, "height": 32, "duration": 100 },
        { "x": 32, "y": 0, "width": 32, "height": 32, "duration": 100 },
        { "x": 64, "y": 0, "width": 32, "height": 32, "duration": 100 }
      ],
      "fps": 10,
      "loop": true
    }
  ],
  "tilemaps": [
    {
      "id": "tilemap-001",
      "name": "Ground",
      "tilesetId": "asset-456",
      "tileWidth": 16,
      "tileHeight": 16,
      "mapWidth": 50,
      "mapHeight": 30,
      "tiles": [
        [1, 1, 1, 2, 3],
        [1, 1, 2, 3, 3],
        [1, 2, 3, 3, 3]
      ]
    }
  ]
}
```

### Data Types

#### Object Types
- `rectangle`: Rectangular shape
- `circle`: Circular shape
- `text`: Text element
- `line`: Line segment
- `polygon`: Multi-point polygon
- `star`: Star shape
- `path`: Freehand path
- `animatedSprite`: Animated sprite instance
- `tilemap`: Tile-based map

#### Color Format
All colors use RGBA hex format: `#RRGGBBAA`
- Example: `#3B82F6FF` = blue (R=59, G=130, B=246, A=255)
- Alpha: `FF` = fully opaque, `00` = fully transparent

#### Physics Body Types
- `dynamic`: Affected by gravity and forces
- `static`: Fixed position, cannot move
- `kinematic`: Moves with code, not physics

### Parsing Examples

#### JavaScript/TypeScript

```typescript
async function loadScene(zipFile: File) {
  // 1. Extract ZIP
  const zip = await JSZip.loadAsync(zipFile)
  
  // 2. Parse scene.json
  const sceneData = await zip.file('scene.json').async('text')
  const scene = JSON.parse(sceneData)
  
  // 3. Load assets
  const assets = {}
  for (const asset of scene.assets) {
    const imageBlob = await zip.file(asset.path).async('blob')
    const imageUrl = URL.createObjectURL(imageBlob)
    assets[asset.id] = {
      ...asset,
      image: await loadImage(imageUrl)
    }
  }
  
  // 4. Create game objects
  for (const obj of scene.objects) {
    createGameObject(obj, assets)
  }
}

function createGameObject(data: any, assets: any) {
  switch (data.type) {
    case 'rectangle':
      return createRectangle(data)
    case 'animatedSprite':
      return createAnimatedSprite(data, assets[data.spriteSheetId])
    // ... etc
  }
}
```

#### Python (Pygame)

```python
import json
import zipfile
from pathlib import Path

def load_scene(zip_path):
    # Extract ZIP
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall('temp_scene')
    
    # Load scene data
    with open('temp_scene/scene.json') as f:
        scene = json.load(f)
    
    # Load assets
    assets = {}
    for asset in scene['assets']:
        image_path = Path('temp_scene') / asset['path']
        assets[asset['id']] = pygame.image.load(str(image_path))
    
    # Create objects
    objects = []
    for obj in scene['objects']:
        objects.append(create_game_object(obj, assets))
    
    return scene, assets, objects

def create_game_object(data, assets):
    if data['type'] == 'rectangle':
        return pygame.Rect(
            data['transform']['x'],
            data['transform']['y'],
            data['transform']['width'],
            data['transform']['height']
        )
    # ... etc
```

#### C# (Unity)

```csharp
using System.IO;
using System.IO.Compression;
using UnityEngine;
using Newtonsoft.Json;

public class SceneLoader : MonoBehaviour
{
    public void LoadScene(string zipPath)
    {
        // Extract ZIP
        string extractPath = Path.Combine(Application.dataPath, "ImportedScene");
        ZipFile.ExtractToDirectory(zipPath, extractPath);
        
        // Load scene JSON
        string jsonPath = Path.Combine(extractPath, "scene.json");
        string jsonText = File.ReadAllText(jsonPath);
        SceneData scene = JsonConvert.DeserializeObject<SceneData>(jsonText);
        
        // Load assets
        foreach (var asset in scene.assets)
        {
            string assetPath = Path.Combine(extractPath, asset.path);
            Texture2D texture = LoadTexture(assetPath);
            // Store in dictionary or resources
        }
        
        // Create GameObjects
        foreach (var obj in scene.objects)
        {
            CreateGameObject(obj);
        }
    }
    
    GameObject CreateGameObject(SceneObject data)
    {
        GameObject go = new GameObject(data.name);
        go.transform.position = new Vector3(data.transform.x, data.transform.y, 0);
        go.transform.rotation = Quaternion.Euler(0, 0, data.transform.rotation);
        
        if (data.physics != null && data.physics.enabled)
        {
            Rigidbody2D rb = go.AddComponent<Rigidbody2D>();
            rb.mass = data.physics.mass;
            rb.gravityScale = data.physics.gravityScale;
            // ... etc
        }
        
        return go;
    }
}
```

---

## 🔧 Integration Guides

### Unity Integration

1. **Import ZIP**: Extract to `Assets/ImportedScenes/`

2. **Parse JSON**:
   ```csharp
   // Use Newtonsoft.Json or Unity's JsonUtility
   string json = File.ReadAllText("scene.json");
   SceneData scene = JsonConvert.DeserializeObject<SceneData>(json);
   ```

3. **Create GameObjects**:
   - Convert coordinates (Unity uses center-origin, CollabCanva uses top-left)
   - Apply transforms: `transform.position`, `transform.rotation`, `transform.localScale`
   - Add components: `SpriteRenderer`, `Rigidbody2D`, `BoxCollider2D`

4. **Load Sprites**:
   ```csharp
   Texture2D texture = LoadTexture(assetPath);
   Sprite sprite = Sprite.Create(texture, rect, pivot);
   spriteRenderer.sprite = sprite;
   ```

5. **Physics Setup**:
   - Dynamic → `Rigidbody2D` with `RigidbodyType2D.Dynamic`
   - Static → `Rigidbody2D` with `RigidbodyType2D.Static`
   - Kinematic → `Rigidbody2D` with `RigidbodyType2D.Kinematic`

### Phaser Integration

1. **Load Scene in Preload**:
   ```javascript
   class GameScene extends Phaser.Scene {
       preload() {
           this.load.json('sceneData', 'scene.json');
           // Load assets
           this.load.image('player', 'assets/sprites/player.png');
       }
       
       create() {
           const scene = this.cache.json.get('sceneData');
           this.buildScene(scene);
       }
       
       buildScene(data) {
           data.objects.forEach(obj => {
               if (obj.type === 'rectangle') {
                   const rect = this.add.rectangle(
                       obj.transform.x,
                       obj.transform.y,
                       obj.transform.width,
                       obj.transform.height,
                       Phaser.Display.Color.HexStringToColor(obj.style.fill).color
                   );
                   
                   if (obj.physics && obj.physics.enabled) {
                       this.physics.add.existing(rect);
                       rect.body.setMass(obj.physics.mass);
                   }
               }
           });
       }
   }
   ```

### LÖVE (Lua) Integration

```lua
-- Load JSON library
local json = require("json")

function love.load()
    -- Load scene
    local file = love.filesystem.read("scene.json")
    local scene = json.decode(file)
    
    -- Create objects
    objects = {}
    for _, obj in ipairs(scene.objects) do
        table.insert(objects, createObject(obj))
    end
end

function createObject(data)
    local obj = {
        x = data.transform.x,
        y = data.transform.y,
        width = data.transform.width,
        height = data.transform.height,
        rotation = math.rad(data.transform.rotation),
        color = hexToRGB(data.style.fill)
    }
    
    if data.physics and data.physics.enabled then
        obj.physics = data.physics
        obj.vx = 0
        obj.vy = 0
    end
    
    return obj
end

function love.update(dt)
    -- Update physics
    for _, obj in ipairs(objects) do
        if obj.physics then
            obj.vy = obj.vy + (gravity * obj.physics.gravityScale * dt)
            obj.x = obj.x + (obj.vx * dt)
            obj.y = obj.y + (obj.vy * dt)
        end
    end
end
```

---

## 📦 File Structure Details

### Asset Organization

Assets are organized by type for easy navigation:

```
assets/
├── sprites/           # Individual sprites
├── sprite_sheets/     # Multi-frame sprite sheets
├── tilesets/          # Tile-based map assets
├── backgrounds/       # Background images
├── ui/                # UI elements
├── audio/             # Sound effects and music (coming soon)
└── fonts/             # Custom fonts (coming soon)
```

### README.txt Template

Every export includes a README with format-specific instructions:

```
================================
  CollabCanva Export
  Format: [Godot/Generic JSON]
  Canvas: [Canvas Name]
  Exported: [Date/Time]
================================

CONTENTS:
---------
- scene.[tscn/json] : Main scene file
- assets/           : All referenced assets
- README.txt        : This file

IMPORT INSTRUCTIONS:
--------------------
[Format-specific instructions here]

COMPATIBILITY:
--------------
[Version requirements]

TROUBLESHOOTING:
----------------
[Common issues and solutions]

---
Generated by CollabCanva v0.5.0
https://github.com/yourusername/collabcanva
```

---

## 🎯 Best Practices

### Naming Conventions

- **Assets**: Use descriptive names (`player_idle.png`, `terrain_grass_01.png`)
- **Objects**: Name all objects meaningfully (`Player`, `Ground`, `Enemy_01`)
- **Layers**: Organize with clear layer names (`Background`, `Environment`, `Characters`, `UI`)

### Optimization

- **Texture Atlases**: Group related sprites into atlases
- **Power-of-2**: Use power-of-2 texture dimensions when possible (256, 512, 1024)
- **Compression**: Use PNG-8 for pixel art, PNG-24 for detailed graphics
- **Trim Transparency**: Remove excess transparent pixels

### Version Control

- **Export Regularly**: Create versioned exports (`level_1_v1`, `level_1_v2`)
- **Include Metadata**: Use descriptive canvas names and tags
- **Document Changes**: Note major changes in export commit messages

---

## 🚧 Limitations & Roadmap

### Current Limitations

- No 3D support (2D only)
- No custom shaders
- No particle system export
- No audio export
- Limited animation curves (linear only)

### Planned Features

- [ ] Unity .prefab export
- [ ] Phaser JSON export
- [ ] Unreal Engine JSON
- [ ] Particle system data
- [ ] Audio track export
- [ ] Animation curves (ease-in/out, bezier)
- [ ] Custom shader preservation
- [ ] Multi-scene export

---

## 📚 Additional Resources

- **Godot Documentation**: https://docs.godotengine.org/
- **JSON Schema Validator**: https://www.jsonschemavalidator.net/
- **Game Dev Tools Guide**: See `GAME_DEV_TOOLS.md`

---

**Questions or Issues?**
Open an issue on GitHub or contact the development team.

*Last updated: PR-31 Sprint 2 Complete*

