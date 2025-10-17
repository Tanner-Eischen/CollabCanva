# 🌀 Animated Tiles & Environmental FX System

**Version:** 3.0  
**Status:** ✅ Production Ready  
**Created:** 2025-10-17

## 📋 Overview

This system enables **animated tiles** (water, torches, lava) and **environmental particle effects** (rain, dust, fireflies) in tilemaps. It seamlessly integrates with the existing animation system and multi-layer tilemap architecture.

### Key Features

- 🎬 **Animated Tiles**: Tile-based sprite animations using existing Animation system
- 🌧️ **Environmental FX**: Real-time particle systems for ambient effects
- 🎨 **Preview Panel**: Frame-by-frame animation scrubbing in inspector
- 🔌 **Plug-and-Play**: Works with existing tilemap and layer systems
- ⚡ **Performance**: Efficient rendering with viewport culling and caching

---

## 🏗️ Architecture

### 1. Animated Tiles

#### Flow
```
TileData { animationId } → AnimatedTile → Animation Service → Sprite Sheet → Konva
```

#### Components

**`AnimatedTile.tsx`**
- Renders individual animated tiles
- Follows `AnimatedSprite` pattern (frame cycling, requestAnimationFrame)
- Loads animation data from Firebase
- Falls back to colored rectangle on error

**`TileRenderer.tsx`** (Updated)
- Detects `tile.animationId` and renders `AnimatedTile`
- Maintains backward compatibility with static tiles
- Supports preview rendering with animations

**Data Flow**
```typescript
TileData {
  type: 'water',
  color: '#3b82f6',
  animationId: 'anim-water-flow-123' // ← New field
}
```

### 2. Environmental FX

#### Flow
```
FXPreset → ParticleOverlay → Particle Simulation → Konva Layer
```

#### Components

**`ParticleOverlay.tsx`**
- Renders particle systems as Konva Layer
- Physics simulation (gravity, wind, velocity)
- Particle spawning, lifecycle, and culling
- Supports multiple particle shapes (circle, line)

**`fxPresets.ts`**
- Pre-configured FX presets (rain, snow, dust, fireflies, leaves, sparkles, fog)
- Customizable particle appearance and behavior
- Additive blending for glow effects

**FX Presets**
```typescript
RAIN_PRESET: {
  spawnRate: 50,
  velocity: { y: 300-500 },
  gravity: 200,
  particleShape: 'line'
}

FIREFLIES_PRESET: {
  spawnRate: 5,
  blendMode: 'add', // Glow effect
  gravity: 0,
  particleShape: 'circle'
}
```

### 3. Animation Preview

**`TileAnimationPreview.tsx`**
- Live preview of animated tiles
- Frame scrubbing slider
- Play/pause controls
- Frame-by-frame inspection
- Shows FPS, frame count, and duration

---

## 📦 API Reference

### Animated Tiles

#### `AnimatedTile` Component

```tsx
<AnimatedTile
  x={64}
  y={128}
  tileSize={32}
  animationId="anim-water-flow"
  color="#3b82f6" // Fallback color
  opacity={1}
  isPlaying={true}
/>
```

**Props**
| Prop | Type | Description |
|------|------|-------------|
| `x` | `number` | World X position (pixels) |
| `y` | `number` | World Y position (pixels) |
| `tileSize` | `number` | Rendered tile size |
| `animationId` | `string` | Animation ID from Firebase |
| `color` | `string` | Fallback color if animation fails |
| `opacity` | `number` | Tile opacity (0-1) |
| `isPlaying` | `boolean` | Whether animation should play |

#### `TileData` Extension

```typescript
interface TileData {
  type: string
  color: string
  variant?: number
  animationId?: string // ← New optional field
  metadata?: Record<string, any>
}
```

### Environmental FX

#### `ParticleOverlay` Component

```tsx
<ParticleOverlay
  preset={RAIN_PRESET}
  enabled={true}
  opacity={0.8}
  viewportWidth={1920}
  viewportHeight={1080}
  viewportX={0}
  viewportY={0}
/>
```

**Props**
| Prop | Type | Description |
|------|------|-------------|
| `preset` | `FXPreset` | FX preset configuration |
| `enabled` | `boolean` | Enable/disable FX layer |
| `opacity` | `number` | Overall layer opacity |
| `viewportWidth` | `number` | Viewport width for culling |
| `viewportHeight` | `number` | Viewport height for culling |
| `viewportX` | `number` | Camera X position |
| `viewportY` | `number` | Camera Y position |

#### `FXPreset` Type

```typescript
interface FXPreset {
  id: string
  name: string
  type: FXPresetType
  
  // Appearance
  particleColor: string
  particleSize: { min: number; max: number }
  particleOpacity: { min: number; max: number }
  particleShape: 'circle' | 'line'
  
  // Behavior
  spawnRate: number // Particles per second
  lifetime: { min: number; max: number } // Seconds
  velocity: { x: { min; max }; y: { min; max } }
  gravity: number
  wind: number
  
  // Rendering
  blendMode?: 'normal' | 'add' | 'multiply' | 'screen'
  layerZ?: number
}
```

### Animation Preview

#### `TileAnimationPreview` Component

```tsx
<TileAnimationPreview
  animation={animationData}
  spriteSheetUrl="/assets/water-anim.png"
  tileSize={64}
  autoPlay={true}
  onClose={() => setShowPreview(false)}
/>
```

---

## 🚀 Usage Examples

### 1. Create Animated Water Tiles

```typescript
import { createAnimation } from '../../services/assets/animation'
import { setTile } from '../../services/tilemap/tilemapSync'

// 1. Create water animation (4 frames)
const waterAnimation = await createAnimation(userId, {
  name: 'Water Flow',
  spriteSheetId: 'spritesheet-water',
  frames: [
    { x: 0, y: 0, width: 32, height: 32 },
    { x: 32, y: 0, width: 32, height: 32 },
    { x: 64, y: 0, width: 32, height: 32 },
    { x: 96, y: 0, width: 32, height: 32 },
  ],
  fps: 8,
  loop: true,
})

// 2. Paint animated tile
await setTile(
  canvasId,
  10, // x
  5,  // y
  {
    type: 'water',
    color: '#3b82f6',
    animationId: waterAnimation.id, // ← Link animation
  },
  userId
)
```

### 2. Add Rain Effect

```tsx
import { ParticleOverlay } from '../tilemap/ParticleOverlay'
import { RAIN_PRESET } from '../../data/fxPresets'

function TilemapCanvas() {
  const [showRain, setShowRain] = useState(true)
  
  return (
    <Stage>
      {/* Tilemap layers */}
      <TilemapLayer {...props} />
      
      {/* Environmental FX (rendered above tilemap) */}
      <ParticleOverlay
        preset={RAIN_PRESET}
        enabled={showRain}
        opacity={0.7}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        viewportX={viewportX}
        viewportY={viewportY}
      />
    </Stage>
  )
}
```

### 3. Custom FX Preset

```typescript
import { createCustomFXPreset, DUST_PRESET } from '../../data/fxPresets'

// Create custom preset based on dust
const customFX = createCustomFXPreset(DUST_PRESET, {
  name: 'Purple Magic Dust',
  particleColor: '#9333ea',
  particleSize: { min: 2, max: 4 },
  blendMode: 'add',
  gravity: -20, // Float upward
})
```

### 4. Animation Inspector Preview

```tsx
import { TileAnimationPreview } from '../tilemap/TileAnimationPreview'

function TileInspector({ tile }: { tile: TileData }) {
  const [animation, setAnimation] = useState<Animation | null>(null)
  
  useEffect(() => {
    if (tile.animationId) {
      // Load animation data
      getAnimation(tile.animationId).then(setAnimation)
    }
  }, [tile.animationId])
  
  if (!tile.animationId) return null
  
  return (
    <TileAnimationPreview
      animation={animation}
      spriteSheetUrl={spriteSheetUrl}
      tileSize={64}
      autoPlay={true}
    />
  )
}
```

---

## 🎮 Available FX Presets

| Preset | Description | Visual |
|--------|-------------|--------|
| **Rain** | Vertical rainfall with wind | Blue lines falling downward |
| **Snow** | Gentle snowfall | White circles floating down |
| **Dust** | Ambient dust particles | Faint gold circles drifting |
| **Fireflies** | Glowing fireflies | Yellow circles with glow |
| **Leaves** | Falling autumn leaves | Orange circles swaying |
| **Sparkles** | Magical sparkles | White circles floating up |
| **Fog** | Low-lying fog | Large translucent circles |

---

## ⚡ Performance Optimizations

### Animated Tiles
- ✅ **Sprite Caching**: Shared sprite sheets via `useSpriteCache`
- ✅ **Animation Reuse**: Same animation shared across all tiles
- ✅ **Viewport Culling**: Only visible tiles are rendered
- ✅ **RAF Management**: Single requestAnimationFrame per tile

### Particle FX
- ✅ **Particle Culling**: Particles outside viewport are removed
- ✅ **Batch Spawning**: Multiple particles per frame
- ✅ **Efficient Physics**: Simple velocity + gravity simulation
- ✅ **No Listening**: Konva layers don't capture events

### Rendering
```typescript
<Layer
  listening={false}          // ← No event capturing
  perfectDrawEnabled={false} // ← Faster rendering
  opacity={layerOpacity}
>
  {particles.map(/* ... */)}
</Layer>
```

---

## 🐛 Debugging

### Animated Tiles Not Showing

```typescript
// 1. Check if animation exists
const anim = await getAnimation(tile.animationId, userId)
console.log('Animation:', anim)

// 2. Check sprite sheet URL
const asset = await getAssetById(anim.spriteSheetId)
console.log('Sprite Sheet URL:', asset.url)

// 3. Check frame data
console.log('Frames:', anim.frames)
```

### Particles Not Rendering

```typescript
// Check if ParticleOverlay is enabled
<ParticleOverlay enabled={true} {...props} />

// Check viewport dimensions
console.log('Viewport:', { viewportWidth, viewportHeight, viewportX, viewportY })

// Check particle count
useEffect(() => {
  console.log('Active particles:', particles.length)
}, [particles])
```

### Performance Issues

```typescript
// Reduce particle spawn rate
const optimizedPreset = {
  ...RAIN_PRESET,
  spawnRate: 20, // Down from 50
}

// Reduce particle lifetime
const optimizedPreset = {
  ...RAIN_PRESET,
  lifetime: { min: 0.5, max: 1 }, // Shorter life
}
```

---

## 🧪 Testing Checklist

- [ ] Animated tiles render correctly
- [ ] Animation loops smoothly
- [ ] Preview panel shows all frames
- [ ] Frame scrubber works
- [ ] Rain FX appears and moves correctly
- [ ] Fireflies glow with additive blending
- [ ] Particles cull outside viewport
- [ ] FX opacity slider works
- [ ] Multiple FX layers don't conflict
- [ ] Performance is acceptable (60 FPS)

---

## 🔮 Future Enhancements

### Animated Tiles
- [ ] **Per-Tile Playback Control**: Pause/play individual tiles
- [ ] **Animation Triggers**: Start animation on player proximity
- [ ] **Tileset Auto-Animation**: Auto-detect animated tiles in tilesets
- [ ] **Frame Offsets**: Stagger animations for variety

### Environmental FX
- [ ] **Wind Zones**: Directional wind affects particles
- [ ] **Collision**: Particles bounce off tiles
- [ ] **Trail Effects**: Leave trails for sparkles/fireflies
- [ ] **3D Depth**: Parallax FX layers (background fog, foreground rain)
- [ ] **Weather System**: Day/night cycle with automatic FX

### Inspector
- [ ] **Animation Editor**: Edit frames directly in preview
- [ ] **FX Builder**: Visual editor for custom FX presets
- [ ] **Performance Profiler**: Show particle count and FPS

---

## 📚 Related Documentation

- [Animation System](../types/animation.ts)
- [Multi-Layer Tilemap System](./MULTI_LAYER_TILEMAP.md)
- [Asset Management](../services/assets/)
- [Tilemap Sync](../services/tilemap/tilemapSync.ts)

---

## 🎯 Integration Summary

**New Components:**
- `src/components/canvas/AnimatedTile.tsx`
- `src/components/tilemap/TileAnimationPreview.tsx`
- `src/components/tilemap/ParticleOverlay.tsx`

**New Types:**
- `src/types/fx.ts`

**New Data:**
- `src/data/fxPresets.ts`

**Modified:**
- `src/types/tilemap.ts` (added `animationId` to `TileData`)
- `src/services/tilemap/tilemapSync.ts` (compress/decompress `animationId`)
- `src/components/tilemap/TileRenderer.tsx` (render `AnimatedTile`)

**Backward Compatible:** ✅ Yes - `animationId` is optional

---

*Built with ❤️ using the existing animation system and Konva rendering pipeline.*

