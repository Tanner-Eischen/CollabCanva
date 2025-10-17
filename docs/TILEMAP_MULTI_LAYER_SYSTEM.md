# 🧱 Complete Multi-Layer Tilemap System

## Overview

A comprehensive multi-layer tilemap system with professional layer management UI, enabling game developers to create rich, depth-filled worlds with parallax scrolling, z-ordering, and intuitive visual controls.

---

## 🎯 System Components

### PRD 1: Multi-Layer Backend
**Status:** ✅ Implemented

Core multi-layer tilemap architecture with Firebase integration.

**Key Features:**
- Multiple logical layers (ground, props, collision, decals, etc.)
- Z-ordering for layer rendering control
- Parallax scrolling configuration per layer
- Layer visibility and opacity controls
- Backward compatibility with single-layer tilemaps
- Firebase structure: `tilemaps/{canvasId}/layers/{layerId}/chunks/...`

**Documentation:** [Multi-Layer Tilemap System](./features/MULTI_LAYER_TILEMAP.md)

### PRD 2: Layer Management UI
**Status:** ✅ Implemented

Professional Figma-style layer management interface.

**Key Features:**
- Animated slide-in layer panel
- Visual layer controls (eye, lock, reorder icons)
- Active layer selection with dropdown
- Keyboard shortcuts (L to toggle panel)
- Real-time Firebase sync
- Tooltips and smooth transitions

**Documentation:** [Layer Management UI](./features/LAYER_MANAGEMENT_UI.md)

---

## 📁 File Structure

### Core Types
```
src/types/
  ├── tileLayer.ts          # Layer metadata types
  └── tilemap.ts            # Extended tilemap types (v2)
```

### Data & Presets
```
src/data/
  └── defaultLayers.ts      # Layer presets (basic, standard, full, platform)
```

### Services
```
src/services/tilemap/
  └── tilemapSync.ts        # Firebase CRUD with multi-layer support
```

### Components
```
src/components/tilemap/
  ├── TilemapLayer.tsx         # Multi-layer renderer with parallax
  ├── TileRenderer.tsx         # Per-layer tile renderer
  ├── TilemapCanvas.tsx        # Main canvas (integrated)
  └── LayerPanelTilemap.tsx    # Layer management panel

src/components/toolbar/
  └── TilemapToolbar.tsx       # Toolbar with layer dropdown
```

### State Management
```
src/hooks/
  └── useLayerManagement.ts # React Context for layer state
```

### Styling
```
src/index.css               # Layer panel animations & custom scrollbar
```

---

## 🚀 Quick Start

### 1. Initialize Tilemap with Layers

```typescript
import { initializeTilemap, updateLayers } from '@/services/tilemap/tilemapSync'
import { STANDARD_LAYERS } from '@/data/defaultLayers'
import { DEFAULT_TILEMAP_META } from '@/types/tilemap'

// Create new tilemap with standard layer preset
const meta = {
  ...DEFAULT_TILEMAP_META,
  layers: STANDARD_LAYERS,
}

await initializeTilemap(canvasId, meta)
```

### 2. Add Layer Panel to UI

```tsx
import LayerPanelTilemap from '@/components/tilemap/LayerPanelTilemap'
import { updateLayer } from '@/services/tilemap/tilemapSync'

function TilemapEditor({ canvasId }: { canvasId: string }) {
  const handleLayerUpdate = async (layerId: string, updates: Partial<TileLayerMeta>) => {
    await updateLayer(canvasId, layerId, updates)
  }

  return (
    <>
      {/* Your tilemap canvas */}
      <TilemapCanvas {...props} />
      
      {/* Layer management panel */}
      <LayerPanelTilemap
        canvasId={canvasId}
        onLayerUpdate={handleLayerUpdate}
      />
    </>
  )
}
```

### 3. Use Layer Context in Components

```typescript
import { useLayerContext, useActiveLayer } from '@/hooks/useLayerManagement'

function MyComponent() {
  // Get active layer
  const activeLayer = useActiveLayer()
  
  // Get all layers
  const { layers, setActiveLayer, togglePanel } = useLayerContext()
  
  return (
    <div>
      <p>Active: {activeLayer?.name}</p>
      <button onClick={() => setActiveLayer('ground')}>
        Select Ground Layer
      </button>
      <button onClick={togglePanel}>
        Toggle Panel (or press L)
      </button>
    </div>
  )
}
```

---

## 🎨 Layer Presets

### Basic Preset
```typescript
import { BASIC_LAYERS } from '@/data/defaultLayers'
// Layers: Ground, Props
```

### Standard Preset (Recommended)
```typescript
import { STANDARD_LAYERS } from '@/data/defaultLayers'
// Layers: Ground, Decals, Props, Collision (hidden)
```

### Full Preset (Maximum Depth)
```typescript
import { FULL_LAYERS } from '@/data/defaultLayers'
// Layers: Far Background (0.3x), Background (0.5x), Ground, 
//         Decals, Props, Collision, Foreground (1.5x)
```

### Platform Preset
```typescript
import { PLATFORM_LAYERS } from '@/data/defaultLayers'
// Layers: Background (0.5x), Ground, Props, Foreground (1.5x)
```

---

## 🎯 Common Workflows

### Workflow 1: Create Platformer with Parallax

```typescript
// 1. Initialize with platform preset
await initializeTilemap(canvasId, {
  ...DEFAULT_TILEMAP_META,
  layers: PLATFORM_LAYERS,
})

// 2. Paint ground tiles on "Ground" layer (z: 0)
setActiveLayer('ground')
await setTile(canvasId, x, y, groundTile, userId, 16, 'ground')

// 3. Add decorative props on "Props" layer (z: 10)
setActiveLayer('props')
await setTile(canvasId, x, y, propTile, userId, 16, 'props')

// 4. Parallax layers automatically render with depth effect!
```

### Workflow 2: Toggle Layer Visibility

```typescript
// Hide collision layer during gameplay
await updateLayer(canvasId, 'collision', { visible: false })

// Show collision layer during level editing
await updateLayer(canvasId, 'collision', { visible: true, opacity: 0.5 })
```

### Workflow 3: Reorder Layers

```typescript
// Move props layer above ground
await updateLayer(canvasId, 'props', { z: 15 })

// Create new mid-layer between ground and props
const midLayer: TileLayerMeta = {
  id: 'mid-detail',
  name: 'Mid Detail',
  z: 12,
  visible: true,
  opacity: 1,
}
await addLayer(canvasId, midLayer)
```

### Workflow 4: Custom Parallax Background

```typescript
const skyLayer: TileLayerMeta = {
  id: 'sky',
  name: 'Sky',
  z: -50,
  visible: true,
  parallax: { x: 0.1, y: 0.1 },  // Moves very slowly
  opacity: 0.8,
  description: 'Distant sky background',
}

await addLayer(canvasId, skyLayer)
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| `L` | Toggle layer panel | Show/hide layer management panel |
| `B` | Paint tool | Switch to paint/stamp mode |
| `E` | Erase tool | Switch to erase mode |
| `F` | Fill tool | Switch to fill mode |
| `I` | Eyedropper | Switch to pick mode |
| `G` | Toggle grid | Show/hide tile grid overlay |
| `A` | Auto-tiling | Toggle auto-tiling |
| `Ctrl+Z` | Undo | Undo last tile operation |
| `Ctrl+Shift+Z` | Redo | Redo tile operation |
| `Space + Drag` | Pan | Pan viewport |
| `Scroll` | Zoom | Zoom in/out |

---

## 🔧 API Quick Reference

### Layer Management

```typescript
// Get layers
const layers = getLayersOrDefault(meta)

// Add layer
await addLayer(canvasId, newLayer)

// Update layer
await updateLayer(canvasId, layerId, { visible: false })

// Remove layer
await removeLayer(canvasId, layerId, true) // true = delete tiles

// Clear layer tiles
await clearLayerTiles(canvasId, layerId)
```

### Tile Operations (Layer-Aware)

```typescript
// Set tile on specific layer
await setTile(canvasId, x, y, tile, userId, 16, 'ground')

// Set multiple tiles on layer
await setTiles(canvasId, tiles, userId, 16, 'props')

// Delete tile from layer
await deleteTile(canvasId, x, y, 16, 'ground')

// Subscribe to layer chunks
const unsubscribes = subscribeToAllLayers(
  canvasId,
  layers,
  chunkKeys,
  {
    onTile: (layerId, x, y, tile) => {
      console.log(`Tile on ${layerId}`)
    },
  },
  16
)
```

### Layer Context

```typescript
// Hooks
const activeLayer = useActiveLayer()
const visibleLayers = useVisibleLayers()
const allLayers = useSortedLayers()

// Context actions
const { setActiveLayer, togglePanel, setLayers } = useLayerContext()
```

---

## 🎨 Visual Design System

### Color Coding

- **Background Layers** (z < 0): Blue gradient (#3b82f6 → #1e40af)
- **Ground Layers** (0 ≤ z ≤ 10): Green gradient (#10b981 → #047857)
- **Foreground Layers** (z > 10): Amber gradient (#f59e0b → #b45309)

### Animations

- **Panel Slide-In:** 250ms cubic-bezier(0.16, 1, 0.3, 1)
- **Layer Selection:** Smooth blue background fade
- **Hover Effects:** 200ms ease transitions
- **Custom Scrollbar:** Fade-in on hover

### Icons

- 👁️ Visible layer
- 👁️‍🗨️ Hidden layer
- 🔓 Unlocked layer
- 🔒 Locked layer
- ▲ Move layer up
- ▼ Move layer down
- ✨ Parallax indicator
- 📋 Layer panel toggle
- ➕ Add layer

---

## 🧪 Testing Guide

### Unit Tests

```typescript
describe('Layer Management', () => {
  test('should add new layer', async () => {
    await addLayer(canvasId, testLayer)
    const meta = await getMeta(canvasId)
    expect(meta.layers).toContainEqual(testLayer)
  })
  
  test('should update layer visibility', async () => {
    await updateLayer(canvasId, 'ground', { visible: false })
    const meta = await getMeta(canvasId)
    const layer = meta.layers?.find(l => l.id === 'ground')
    expect(layer?.visible).toBe(false)
  })
  
  test('should reorder layers by z-index', async () => {
    const layers = [
      { id: 'a', z: 0 },
      { id: 'b', z: 10 },
      { id: 'c', z: -10 },
    ]
    const sorted = sortLayersByZ(layers)
    expect(sorted.map(l => l.id)).toEqual(['c', 'a', 'b'])
  })
})
```

### Integration Tests

```typescript
describe('Layer Panel UI', () => {
  test('should toggle panel visibility', () => {
    const { togglePanel } = useLayerStore.getState()
    expect(useLayerStore.getState().isPanelOpen).toBe(true)
    togglePanel()
    expect(useLayerStore.getState().isPanelOpen).toBe(false)
  })
  
  test('should select active layer', () => {
    const { setActiveLayer, getActiveLayer } = useLayerStore.getState()
    setActiveLayer('ground')
    const active = getActiveLayer()
    expect(active?.id).toBe('ground')
  })
})
```

---

## 📊 Performance Considerations

### Optimizations

1. **Viewport Culling:** Only visible tiles rendered per layer
2. **Chunk Loading:** Only loaded chunks in viewport
3. **Layer Caching:** Konva layer auto-caching
4. **Parallel Loading:** All layers load simultaneously
5. **Memoization:** Layer calculations memoized in React

### Best Practices

- Keep layer count ≤ 7 for optimal performance
- Use viewport culling for large tilemaps
- Enable auto-caching on Konva layers
- Batch tile updates when possible
- Minimize parallax factor differences

---

## 🐛 Troubleshooting

### Issue: Layers not rendering

**Solution:**
```typescript
// Check if layers are in meta
console.log('Meta layers:', meta?.layers)

// Check if layers are in store
const layers = useLayerStore(state => state.layers)
console.log('Store layers:', layers)

// Force sync
setLayers(meta?.layers || [])
```

### Issue: Parallax not working

**Solution:**
```typescript
// Verify parallax config
const layer = layers.find(l => l.id === 'background')
console.log('Parallax:', layer?.parallax) // Should be { x: 0.5, y: 0.5 }

// Check viewport updates
console.log('Viewport:', viewport)
```

### Issue: Layer panel not showing

**Solution:**
```typescript
// Check panel state
const isPanelOpen = useLayerStore(state => state.isPanelOpen)
console.log('Panel open:', isPanelOpen)

// Force open
useLayerStore.getState().setPanel(true)
```

---

## 🚀 Deployment Checklist

- [ ] All layer presets defined
- [ ] Firebase security rules updated for `/layers` path
- [ ] Layer store initialized in app entry
- [ ] Layer panel integrated in tilemap editor
- [ ] Toolbar updated with layer dropdown
- [ ] Keyboard shortcuts documented
- [ ] Default layers set in tilemap initialization
- [ ] Migration path tested for legacy tilemaps
- [ ] Performance tested with 5+ layers
- [ ] Cross-browser compatibility verified

---

## 📚 Additional Resources

### Documentation
- [Multi-Layer Backend](./features/MULTI_LAYER_TILEMAP.md)
- [Layer Management UI](./features/LAYER_MANAGEMENT_UI.md)
- [AI Commands](./AI_COMMANDS.md)

### Code References
- `src/types/tileLayer.ts` - Layer type definitions
- `src/data/defaultLayers.ts` - Layer presets
- `src/hooks/useLayerManagement.ts` - State management (React Context)
- `src/components/tilemap/LayerPanelTilemap.tsx` - UI component
- `src/services/tilemap/tilemapSync.ts` - Firebase operations

---

**System Version:** 2.0  
**Created:** 2025-10-17  
**Status:** ✅ Production Ready  
**Backward Compatible:** Yes

**Dependencies:**
- `react` >= 18.0.0
- `react-konva` >= 18.0.0
- `firebase` >= 10.0.0
- `tailwindcss` >= 3.0.0

