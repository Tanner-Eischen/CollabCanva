# 🧱 Multi-Layer Tilemap System

## Overview

The multi-layer tilemap system enables rich, depth-filled game worlds with parallax scrolling, z-ordering, and independent layer visibility controls. This feature is fully backward compatible with existing single-layer tilemaps.

## ✨ Features

### 🎯 Core Capabilities

1. **Multiple Logical Layers**
   - Ground, Props, Collision, Decals, Background, Foreground
   - Each layer has independent tile data
   - Customizable layer names and descriptions

2. **Z-Ordering**
   - Layers render in order of their `z` value (ascending)
   - Background layers use negative z-values
   - Foreground layers use positive z-values

3. **Parallax Scrolling**
   - Configurable X and Y parallax factors per layer
   - Creates depth effect through differential movement
   - `parallax < 1`: Slower movement (background effect)
   - `parallax > 1`: Faster movement (foreground effect)

4. **Visibility & Opacity**
   - Toggle layer visibility on/off
   - Per-layer opacity control (0-1)
   - Locked layers prevent accidental editing

5. **Backward Compatibility**
   - Existing tilemaps automatically use legacy ground layer
   - No migration required for old data
   - Seamless upgrade path to multi-layer

---

## 🏗️ Architecture

### Type Definitions

#### `TileLayerMeta`
```typescript
interface TileLayerMeta {
  id: string;           // Unique layer identifier
  name: string;         // Human-readable name
  z: number;            // Z-index for rendering order
  visible: boolean;     // Layer visibility toggle
  parallax?: {          // Optional parallax configuration
    x: number;          // Horizontal parallax factor
    y: number;          // Vertical parallax factor
  };
  opacity?: number;     // Layer opacity (0-1, default: 1)
  description?: string; // Optional documentation
  locked?: boolean;     // Prevent editing (default: false)
}
```

#### `TilemapMeta` (Extended)
```typescript
interface TilemapMeta {
  tileSize: number;
  width: number;
  height: number;
  chunkSize: number;
  palette: PaletteColor[];
  version: number;      // Version 2 for multi-layer support
  layers?: TileLayerMeta[]; // Layer configuration
}
```

### Firebase Structure

#### New Multi-Layer Structure
```
tilemaps/
  {canvasId}/
    meta/
      layers/             ← Array of TileLayerMeta
    layers/
      {layerId}/          ← Layer-specific tiles
        chunks/
          {chunkKey}/
            tiles/
              {tileKey}   ← Tile data
```

#### Legacy Structure (Still Supported)
```
tilemaps/
  {canvasId}/
    meta/
    chunks/               ← Legacy tiles (no layer ID)
      {chunkKey}/
        tiles/
          {tileKey}
```

---

## 🎨 Layer Presets

### Default Presets

#### **Basic** (Simple Games)
- Ground (z: 0)
- Props (z: 10)

#### **Standard** (Most Games)
- Ground (z: 0)
- Decals (z: 5)
- Props (z: 10)
- Collision (z: 20, hidden)

#### **Full** (Rich Visuals)
- Far Background (z: -20, parallax: 0.3x)
- Background (z: -10, parallax: 0.5x)
- Ground (z: 0)
- Decals (z: 5)
- Props (z: 10)
- Collision (z: 20, hidden)
- Foreground (z: 30, parallax: 1.5x)

#### **Platform** (Platformer Games)
- Background (z: -10, parallax: 0.5x)
- Ground (z: 0)
- Props (z: 10)
- Foreground (z: 30, parallax: 1.5x)

---

## 🔧 API Reference

### Layer Management

#### Get Layers
```typescript
import { getLayersOrDefault } from '@/services/tilemap/tilemapSync';

const layers = getLayersOrDefault(meta);
// Returns layers from meta, or legacy ground layer if none exist
```

#### Add Layer
```typescript
import { addLayer } from '@/services/tilemap/tilemapSync';
import type { TileLayerMeta } from '@/types/tileLayer';

const newLayer: TileLayerMeta = {
  id: 'props',
  name: 'Props',
  z: 10,
  visible: true,
  opacity: 1,
};

await addLayer(canvasId, newLayer);
```

#### Update Layer
```typescript
import { updateLayer } from '@/services/tilemap/tilemapSync';

await updateLayer(canvasId, 'props', {
  visible: false,  // Hide layer
  opacity: 0.5,    // Make semi-transparent
});
```

#### Remove Layer
```typescript
import { removeLayer } from '@/services/tilemap/tilemapSync';

// Remove layer metadata only
await removeLayer(canvasId, 'props', false);

// Remove layer and all its tiles
await removeLayer(canvasId, 'props', true);
```

### Tile Operations

#### Set Tile (Multi-Layer)
```typescript
import { setTile } from '@/services/tilemap/tilemapSync';

await setTile(
  canvasId,
  x,
  y,
  tile,
  userId,
  chunkSize,
  'ground'  // Layer ID
);
```

#### Set Tile (Legacy - Backward Compatible)
```typescript
// Omit layerId for legacy behavior
await setTile(canvasId, x, y, tile, userId, chunkSize);
```

#### Subscribe to All Layers
```typescript
import { subscribeToAllLayers } from '@/services/tilemap/tilemapSync';

const unsubscribes = subscribeToAllLayers(
  canvasId,
  layers,
  chunkKeys,
  {
    onTile: (layerId, x, y, tile) => {
      console.log(`Tile updated on layer ${layerId} at ${x},${y}`);
    },
    onRemove: (layerId, x, y) => {
      console.log(`Tile removed from layer ${layerId} at ${x},${y}`);
    },
  },
  chunkSize
);

// Cleanup
unsubscribes.forEach((chunkUnsubs) => {
  chunkUnsubs.forEach((unsub) => unsub());
});
```

---

## 🎯 Parallax Math

The parallax effect is achieved by offsetting layers based on the viewport position:

```typescript
// Parallax factor meanings:
// 0.0  = No movement (fixed to screen)
// 0.5  = Half speed (far background)
// 1.0  = Normal speed (no parallax)
// 1.5  = 1.5x speed (close foreground)

function applyParallax(viewportPos: number, factor: number): number {
  return viewportPos * factor;
}

// Example with 0.5x parallax (background):
// Viewport at x=1000
// Background renders at x=500 (moves half as fast)

// Example with 1.5x parallax (foreground):
// Viewport at x=1000  
// Foreground renders at x=1500 (moves faster)
```

---

## 📋 Usage Examples

### Example 1: Create Platformer with Parallax

```typescript
import { initializeTilemap, updateLayers } from '@/services/tilemap/tilemapSync';
import { PLATFORM_LAYERS } from '@/data/defaultLayers';
import { DEFAULT_TILEMAP_META } from '@/types/tilemap';

// Initialize tilemap with platform preset
const meta = {
  ...DEFAULT_TILEMAP_META,
  layers: PLATFORM_LAYERS,
};

await initializeTilemap(canvasId, meta);

// Layers created:
// - Background (z: -10, parallax: 0.5x)
// - Ground (z: 0, normal)
// - Props (z: 10, normal)
// - Foreground (z: 30, parallax: 1.5x)
```

### Example 2: Custom Layer Setup

```typescript
const customLayers: TileLayerMeta[] = [
  {
    id: 'sky',
    name: 'Sky',
    z: -50,
    visible: true,
    parallax: { x: 0.1, y: 0.1 },
    opacity: 0.8,
    description: 'Distant sky background',
  },
  {
    id: 'ground',
    name: 'Ground',
    z: 0,
    visible: true,
    opacity: 1,
  },
  {
    id: 'overlay',
    name: 'Overlay',
    z: 100,
    visible: true,
    parallax: { x: 2.0, y: 2.0 },
    opacity: 0.6,
    description: 'Close-up overlay effects',
  },
];

await updateLayers(canvasId, customLayers);
```

### Example 3: Toggle Layer Visibility

```typescript
import { updateLayer } from '@/services/tilemap/tilemapSync';

// Hide collision layer during gameplay
await updateLayer(canvasId, 'collision', { visible: false });

// Show collision layer during editing
await updateLayer(canvasId, 'collision', { visible: true, opacity: 0.5 });
```

### Example 4: Dynamic Weather Layer

```typescript
// Add a weather effects layer
const weatherLayer: TileLayerMeta = {
  id: 'weather',
  name: 'Weather Effects',
  z: 50,
  visible: true,
  parallax: { x: 1.2, y: 1.2 },
  opacity: 0.7,
  description: 'Rain, snow, fog effects',
};

await addLayer(canvasId, weatherLayer);

// Later: toggle weather
await updateLayer(canvasId, 'weather', { visible: false });
```

---

## 🔄 Migration Guide

### Automatic Migration

Existing single-layer tilemaps automatically work with the new system:

1. **Legacy tilemaps** (without `layers` in meta)
   - Auto-create a legacy ground layer (z: 0)
   - All existing tiles render on this layer
   - No data migration required

2. **Upgrading to multi-layer**
   ```typescript
   import { getMeta, updateLayers } from '@/services/tilemap/tilemapSync';
   import { STANDARD_LAYERS } from '@/data/defaultLayers';
   
   const meta = await getMeta(canvasId);
   
   if (!meta?.layers) {
     // Upgrade to multi-layer with standard preset
     await updateLayers(canvasId, STANDARD_LAYERS);
   }
   ```

---

## 🎨 Rendering Pipeline

### Layer Rendering Order

1. **Parse Metadata**: Extract layers from `TilemapMeta`
2. **Sort by Z**: Layers render in ascending z-order
3. **Apply Parallax**: Each layer offset by parallax factor
4. **Viewport Culling**: Only visible tiles rendered per layer
5. **Opacity**: Apply per-layer opacity
6. **Grid Overlay**: Render on top of all layers

### Performance Considerations

- **Chunk Loading**: Only visible chunks loaded per layer
- **Viewport Culling**: Tiles outside viewport not rendered
- **Layer Caching**: Konva layers cache automatically
- **Parallel Subscriptions**: All layers subscribe simultaneously

---

## 🐛 Debugging

### Check Layer Configuration

```typescript
import { getMeta, getLayersOrDefault } from '@/services/tilemap/tilemapSync';

const meta = await getMeta(canvasId);
const layers = getLayersOrDefault(meta);

console.log('Layers:', layers);
layers.forEach(layer => {
  console.log(`- ${layer.name} (z: ${layer.z}, visible: ${layer.visible})`);
});
```

### Verify Tile Storage

```typescript
import { getChunkTiles } from '@/services/tilemap/tilemapSync';

// Check tiles on specific layer
const tiles = await getChunkTiles(canvasId, 0, 0, 16, 'ground');
console.log(`Ground layer has ${tiles.size} tiles in chunk 0,0`);

// Check legacy tiles
const legacyTiles = await getChunkTiles(canvasId, 0, 0, 16);
console.log(`Legacy storage has ${legacyTiles.size} tiles`);
```

### Layer Visibility Issues

```typescript
import { getVisibleLayers } from '@/types/tileLayer';

const visibleLayers = getVisibleLayers(layers);
console.log(`${visibleLayers.length} of ${layers.length} layers visible`);
```

---

## 📚 Related Files

### Type Definitions
- `src/types/tileLayer.ts` - Layer metadata types
- `src/types/tilemap.ts` - Tilemap types (extended with layers)

### Data & Defaults
- `src/data/defaultLayers.ts` - Layer presets and defaults

### Services
- `src/services/tilemap/tilemapSync.ts` - Firebase CRUD with layer support

### Components
- `src/components/tilemap/TilemapLayer.tsx` - Multi-layer orchestrator
- `src/components/tilemap/TileRenderer.tsx` - Layer rendering with parallax

---

## 🎯 Best Practices

1. **Z-Index Spacing**: Use increments of 10 for z-values to allow insertion of layers between existing ones

2. **Parallax Moderation**: Subtle parallax (0.5x - 1.5x) works best; extreme values can be disorienting

3. **Layer Naming**: Use descriptive names and descriptions for team collaboration

4. **Visibility Management**: Hide collision/debug layers during gameplay, show during editing

5. **Opacity for Debug**: Use semi-transparent collision layers (0.3-0.5) for visualization

6. **Layer Locking**: Lock completed layers to prevent accidental edits

---

## 🚀 Future Enhancements

Potential additions to the multi-layer system:

- [ ] Layer blending modes (multiply, overlay, etc.)
- [ ] Per-layer filters (blur, glow, color adjustments)
- [ ] Layer groups for organization
- [ ] Animation timelines per layer
- [ ] Layer-specific tile palette restrictions
- [ ] Isometric layer support with elevation
- [ ] Layer import/export
- [ ] Layer duplication and merging tools

---

## 📝 Version History

### Version 2 (Current)
- ✅ Multi-layer support with z-ordering
- ✅ Parallax scrolling per layer
- ✅ Layer visibility and opacity controls
- ✅ Backward compatibility with v1 tilemaps
- ✅ Layer CRUD operations
- ✅ Multi-layer Firebase structure

### Version 1 (Legacy)
- Single layer tilemap
- Basic chunk-based storage
- No parallax support

---

**Created:** 2025-10-17  
**Status:** ✅ Production Ready  
**Backward Compatible:** Yes

