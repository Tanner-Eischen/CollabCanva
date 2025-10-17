# 🧭 Layer Management & Toolbar UI

## Overview

Professional Figma-style layer management interface for the multi-layer tilemap system. Provides intuitive controls for visibility, locking, z-ordering, and layer selection with smooth animations and keyboard shortcuts.

---

## ✨ Features

### 🎨 Visual Design

1. **Figma-Style Panel**
   - Slide-in animation from right
   - Semi-transparent backdrop with blur effect
   - Custom scrollbar (subtle, appears on hover)
   - Layer color indicators based on z-index

2. **Layer Item Controls**
   - 👁️ Visibility toggle (eye icon)
   - 🔒 Lock/unlock toggle (lock icon)
   - ▲▼ Z-order controls (move up/down)
   - Color-coded layer indicators
   - Parallax badge for layers with parallax effects

3. **Active Layer Indication**
   - Blue highlight for selected layer
   - Border glow effect
   - Displayed in toolbar dropdown

4. **Smooth Animations**
   - Panel slide-in/out (250ms cubic-bezier)
   - Layer selection transitions
   - Hover effects on controls
   - Custom scrollbar fade-in

---

## 🏗️ Architecture

### Components

#### `LayerPanelTilemap.tsx`
Main layer management panel component.

**Props:**
```typescript
interface LayerPanelTilemapProps {
  canvasId: string
  onLayerUpdate: (layerId: string, updates: Partial<TileLayerMeta>) => Promise<void>
  onLayerReorder?: (layerId: string, newZ: number) => Promise<void>
  onAddLayer?: () => void
  onDeleteLayer?: (layerId: string) => void
}
```

**Features:**
- Collapsible panel (button shows when closed)
- Layer list with reverse z-order (top to bottom = high z to low z)
- Per-layer controls (visibility, lock, reorder)
- Add layer button in header
- Active layer indicator in footer

#### `TilemapToolbar.tsx` (Updated)
Toolbar with active layer dropdown.

**New Props:**
```typescript
{
  layers?: TileLayerMeta[]
  activeLayerId?: string | null
  onLayerChange?: (layerId: string) => void
  onToggleLayerPanel?: () => void
}
```

**Features:**
- Active layer dropdown (filtered to visible/unlocked layers)
- Layer panel toggle button (📋 icon)
- Integrated with existing tools

#### `LayerItem` Component
Individual layer list item with controls.

**Features:**
- Layer name and z-index display
- Parallax indicator badge
- Opacity percentage
- Hover state shows reorder controls
- Click to select as active layer

---

## 🗄️ State Management

### React Context Hook (`useLayerManagement.ts`)

**State:**
```typescript
{
  activeLayerId: string | null        // Currently selected layer
  isPanelOpen: boolean                // Panel visibility
  layers: TileLayerMeta[]             // All layers (synced from Firebase)
}
```

**Actions:**
```typescript
{
  setActiveLayer: (layerId: string) => void
  togglePanel: () => void
  setPanel: (open: boolean) => void
  setLayers: (layers: TileLayerMeta[]) => void
  updateLayer: (layerId: string, updates: Partial<TileLayerMeta>) => void
  reorderLayer: (layerId: string, newZ: number) => void
  getActiveLayer: () => TileLayerMeta | null
  getLayerById: (layerId: string) => TileLayerMeta | null
}
```

**Usage:**
```typescript
// Wrap your app with LayerProvider
import { LayerProvider } from '@/hooks/useLayerManagement'

<LayerProvider>
  <TilemapCanvas />
</LayerProvider>
```

**Custom Hooks:**
```typescript
// Get layer context (must be used within LayerProvider)
useLayerContext(): LayerContextState

// Get active layer with type safety
useActiveLayer(): TileLayerMeta | null

// Get visible layers sorted by z-index
useVisibleLayers(): TileLayerMeta[]

// Get all layers sorted by z-index
useSortedLayers(): TileLayerMeta[]
```

---

## 🎨 Styling

### CSS Animations (`index.css`)

#### Slide-In Animation
```css
@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.animate-slide-in-right {
  animation: slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
```

#### Custom Scrollbar
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

#### Backdrop Blur
```css
.layer-panel-blur {
  backdrop-filter: blur(12px) saturate(180%);
}
```

---

## 🔧 Integration

### TilemapCanvas Integration

**Imports:**
```typescript
import { useLayerContext, LayerProvider } from '../../hooks/useLayerManagement'
import { updateLayer as updateLayerInFirebase } from '../../services/tilemap/tilemapSync'
import LayerPanelTilemap from './LayerPanelTilemap'
```

**Wrap with Provider:**
```typescript
// In Canvas.tsx or parent component
<LayerProvider>
  <TilemapCanvas {...props} />
</LayerProvider>
```

**State Management:**
```typescript
// Layer management hooks (inside LayerProvider)
const { setLayers, activeLayerId, setActiveLayer, togglePanel } = useLayerContext()

// Sync layers from Firebase meta to store
useEffect(() => {
  if (meta?.layers) {
    setLayers(meta.layers)
  }
}, [meta?.layers, setLayers])
```

**Handlers:**
```typescript
// Update layer in Firebase
const handleLayerUpdate = useCallback(async (layerId: string, updates: Partial<TileLayerMeta>) => {
  await updateLayerInFirebase(canvasId, layerId, updates)
}, [canvasId])

// Toggle panel visibility
const handleToggleLayerPanel = useCallback(() => {
  togglePanel()
}, [togglePanel])
```

**Render:**
```tsx
<LayerPanelTilemap
  canvasId={canvasId}
  onLayerUpdate={handleLayerUpdate}
/>
```

---

## 🎯 User Interactions

### Layer Selection

**Click Layer Item:**
- Sets as active layer
- Highlights with blue background
- Updates toolbar dropdown
- All tile operations apply to this layer

**Keyboard Shortcut:**
- `L` - Toggle layer panel visibility

### Visibility Toggle

**Click Eye Icon (👁️):**
- Toggles layer visibility
- Hidden layers show ghost eye icon (👁️‍🗨️)
- Hidden layers not included in renders
- Does not affect active layer status

### Lock Toggle

**Click Lock Icon (🔒):**
- Toggles layer lock state
- Locked layers show amber lock icon
- Locked layers cannot be edited
- Locked layers excluded from toolbar dropdown

### Z-Order Management

**Move Up (▲):**
- Increases z-index by 1
- Moves layer up in visual stack
- Only visible when layer is hovered or active
- Disabled for topmost layer

**Move Down (▼):**
- Decreases z-index by 1
- Moves layer down in visual stack
- Only visible when layer is hovered or active
- Disabled for bottommost layer

### Panel Controls

**Collapse Panel:**
- Click ✕ in header
- Panel slides out to right
- Floating button (📋) appears in top-right
- Click button to reopen panel

**Add Layer:**
- Click ➕ in header (if handler provided)
- Opens layer creation dialog
- New layer added to top of stack

---

## 🎨 Visual Indicators

### Layer Color Coding

Layers are color-coded by z-index range:

```typescript
// Background layers (z < 0)
gradient: #3b82f6 → #1e40af (blue gradient)

// Ground/standard layers (0 ≤ z ≤ 10)
gradient: #10b981 → #047857 (green gradient)

// Foreground layers (z > 10)
gradient: #f59e0b → #b45309 (amber gradient)
```

### Parallax Badge

Layers with parallax effects show badge:
```
✨ 0.5x  (for 0.5x parallax factor)
```

### Opacity Display

Layers with opacity < 100% show percentage:
```
z: 10 • 50%  (for 50% opacity)
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `L` | Toggle layer panel | Global (tilemap mode) |
| `Click` | Select layer as active | Layer item |
| `Click eye icon` | Toggle visibility | Layer item |
| `Click lock icon` | Toggle lock | Layer item |

---

## 📋 Usage Examples

### Example 1: Basic Layer Selection

```typescript
// User workflow:
1. Open layer panel (click 📋 or press L)
2. Click on "Background" layer
3. Active layer updates in toolbar dropdown
4. All tile painting now applies to Background layer
```

### Example 2: Hide Collision Layer

```typescript
// User workflow:
1. Find "Collision" layer in panel
2. Click eye icon (👁️)
3. Layer becomes invisible in viewport
4. Ghost eye icon (👁️‍🗨️) shows hidden state
5. Click again to show layer
```

### Example 3: Reorder Layers

```typescript
// User workflow:
1. Hover over "Props" layer
2. Move controls (▲▼) appear
3. Click ▲ to move up in z-order
4. Layer z-index increases by 1
5. Visual rendering order updates immediately
```

### Example 4: Lock Layer

```typescript
// User workflow:
1. Click lock icon on "Ground" layer
2. Lock icon turns amber
3. Layer no longer appears in toolbar dropdown
4. Cannot edit tiles on locked layer
5. Click again to unlock
```

---

## 🔌 API Reference

### LayerPanelTilemap Component

**Required Props:**
- `canvasId: string` - Canvas identifier for Firebase operations
- `onLayerUpdate: (layerId, updates) => Promise<void>` - Handler for layer property updates

**Optional Props:**
- `onLayerReorder: (layerId, newZ) => Promise<void>` - Handler for z-index changes
- `onAddLayer: () => void` - Handler for add layer button
- `onDeleteLayer: (layerId) => void` - Handler for layer deletion

**Example:**
```tsx
<LayerPanelTilemap
  canvasId="canvas-123"
  onLayerUpdate={async (layerId, updates) => {
    await updateLayer(canvasId, layerId, updates)
  }}
  onLayerReorder={async (layerId, newZ) => {
    await updateLayer(canvasId, layerId, { z: newZ })
  }}
  onAddLayer={() => {
    // Open add layer dialog
  }}
/>
```

### Layer Context Hooks

**useLayerContext:**
```typescript
const { 
  activeLayerId, 
  setActiveLayer, 
  isPanelOpen, 
  togglePanel,
  layers,
  setLayers 
} = useLayerContext()
// Returns: LayerContextState
// Must be used within LayerProvider
```

**useActiveLayer:**
```typescript
const activeLayer = useActiveLayer()
// Returns: TileLayerMeta | null
```

**useVisibleLayers:**
```typescript
const visibleLayers = useVisibleLayers()
// Returns: TileLayerMeta[] (sorted by z-index, only visible)
```

**useSortedLayers:**
```typescript
const allLayers = useSortedLayers()
// Returns: TileLayerMeta[] (sorted by z-index, including hidden)
```

**Example Usage:**
```typescript
// Inside a component wrapped by LayerProvider
const { setActiveLayer, togglePanel } = useLayerContext()

setActiveLayer('ground')
togglePanel()
```

---

## 🧪 Testing Checklist

- [ ] Panel opens/closes smoothly with animation
- [ ] Layer selection updates active layer in store
- [ ] Visibility toggle hides/shows layer in viewport
- [ ] Lock toggle prevents layer editing
- [ ] Move up/down reorders layers correctly
- [ ] Layer color indicators match z-index ranges
- [ ] Parallax badge shows for parallax layers
- [ ] Opacity display shows for layers < 100%
- [ ] Toolbar dropdown updates with active layer
- [ ] Toolbar dropdown filters hidden/locked layers
- [ ] Keyboard shortcut (L) toggles panel
- [ ] Custom scrollbar appears on hover
- [ ] Panel state persists across sessions
- [ ] Firebase updates propagate to all clients
- [ ] Locked layers excluded from editing

---

## 🐛 Debugging Tips

### Panel Not Showing

```typescript
// Check context state
const { isPanelOpen, setPanel } = useLayerContext()
console.log('Panel open:', isPanelOpen)

// Force open
setPanel(true)
```

### Layers Not Loading

```typescript
// Check if layers synced from meta
const { layers } = useLayerContext()
console.log('Loaded layers:', layers)

// Check Firebase meta
console.log('Meta layers:', meta?.layers)
```

### Active Layer Not Updating

```typescript
// Check active layer ID
const { activeLayerId, getActiveLayer } = useLayerContext()
const activeLayer = getActiveLayer()
console.log('Active layer ID:', activeLayerId)
console.log('Active layer object:', activeLayer)
```

### Z-Order Not Updating

```typescript
// Check if reorder handler provided
if (!onLayerReorder) {
  console.warn('Layer reordering not available (no handler provided)')
}

// Check Firebase update
await updateLayer(canvasId, layerId, { z: newZ })
console.log('Updated layer z-index to:', newZ)
```

---

## 🚀 Future Enhancements

Potential additions to the layer management UI:

- [ ] Drag-and-drop layer reordering
- [ ] Layer groups/folders
- [ ] Layer search/filter
- [ ] Layer duplication
- [ ] Layer merge
- [ ] Layer effects preview
- [ ] Layer blending modes UI
- [ ] Bulk layer operations (show all, hide all, lock all)
- [ ] Layer context menu (right-click)
- [ ] Layer rename inline editing
- [ ] Layer description tooltips
- [ ] Undo/redo for layer operations
- [ ] Layer animation timeline
- [ ] Layer presets/templates

---

## 📚 Related Documentation

- [Multi-Layer Tilemap System](./MULTI_LAYER_TILEMAP.md) - Backend architecture
- [PRD 1: Multi-Layer System](../../pr32_ai_game_aware.md) - Original requirements
- [PRD 2: Layer Management UI](../../pr32_ai_game_aware.md) - UI requirements

---

**Created:** 2025-10-17  
**Status:** ✅ Production Ready  
**Dependencies:**
- `react` - State management (Context API)
- `react-konva` - Canvas rendering
- `tailwindcss` - Styling
- Multi-Layer Tilemap System (PRD 1)

