# 🚀 Animated Tiles & FX - Quick Start Guide

Get animated tiles and environmental effects running in 5 minutes.

---

## ⚡ Quick Setup

### 1. Add ParticleOverlay to TilemapCanvas

```tsx
// src/components/tilemap/TilemapCanvas.tsx

import { ParticleOverlay } from './ParticleOverlay'
import { RAIN_PRESET, FIREFLIES_PRESET } from '../../data/fxPresets'

function TilemapCanvas({ canvasId }: TilemapCanvasProps) {
  const [fxEnabled, setFxEnabled] = useState(false)
  const [selectedFX, setSelectedFX] = useState(RAIN_PRESET)
  
  return (
    <Stage width={width} height={height}>
      {/* Existing tilemap layers */}
      <TilemapLayer
        tiles={tiles}
        meta={meta}
        tileSize={meta.tileSize}
        viewportX={viewportX}
        viewportY={viewportY}
        viewportWidth={stageWidth}
        viewportHeight={stageHeight}
      />
      
      {/* ADD THIS: Environmental FX Layer (rendered above all tile layers) */}
      <ParticleOverlay
        preset={selectedFX}
        enabled={fxEnabled}
        opacity={0.7}
        viewportWidth={stageWidth}
        viewportHeight={stageHeight}
        viewportX={viewportX}
        viewportY={viewportY}
      />
    </Stage>
  )
}
```

### 2. Add FX Controls to Toolbar

```tsx
// src/components/toolbar/TilemapToolbar.tsx

import { FX_PRESETS } from '../../data/fxPresets'

function TilemapToolbar() {
  return (
    <div className="toolbar">
      {/* Existing tools */}
      
      {/* ADD THIS: FX Selector */}
      <div className="tool-section">
        <label className="text-xs text-white/70">Environmental FX</label>
        <select
          value={selectedFX.id}
          onChange={(e) => {
            const preset = FX_PRESETS.find(p => p.id === e.target.value)
            if (preset) setSelectedFX(preset)
          }}
          className="w-full px-2 py-1 text-xs rounded bg-white/10"
        >
          <option value="">None</option>
          {FX_PRESETS.map(preset => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        
        <button
          onClick={() => setFxEnabled(!fxEnabled)}
          className={`px-2 py-1 rounded ${fxEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
        >
          {fxEnabled ? '🌧️ FX On' : '⚪ FX Off'}
        </button>
      </div>
    </div>
  )
}
```

### 3. Create Animated Water Tiles

```tsx
// Example: Creating and painting animated water tiles

import { createAnimation } from '../../services/assets/animation'
import { setTile } from '../../services/tilemap/tilemapSync'

async function createWaterAnimation(userId: string, spriteSheetId: string) {
  // Create 4-frame water animation
  const animation = await createAnimation(userId, {
    name: 'Water Flow',
    spriteSheetId: spriteSheetId,
    frames: [
      { x: 0, y: 0, width: 32, height: 32 },
      { x: 32, y: 0, width: 32, height: 32 },
      { x: 64, y: 0, width: 32, height: 32 },
      { x: 96, y: 0, width: 32, height: 32 },
    ],
    fps: 8,
    loop: true,
  })
  
  return animation.id
}

async function paintAnimatedTile(
  canvasId: string,
  x: number,
  y: number,
  animationId: string,
  userId: string
) {
  await setTile(
    canvasId,
    x,
    y,
    {
      type: 'water',
      color: '#3b82f6',
      animationId: animationId, // ← This makes it animated!
    },
    userId
  )
}
```

### 4. Add Animation Preview to Inspector

```tsx
// src/components/panels/TileInspector.tsx

import { TileAnimationPreview } from '../tilemap/TileAnimationPreview'
import { getAnimation } from '../../services/assets/animation'

function TileInspector({ selectedTile }: { selectedTile: TileData | null }) {
  const [animation, setAnimation] = useState<Animation | null>(null)
  const [spriteSheetUrl, setSpriteSheetUrl] = useState('')
  
  // Load animation if tile has animationId
  useEffect(() => {
    if (selectedTile?.animationId) {
      getAnimation(selectedTile.animationId, userId).then(anim => {
        if (anim) {
          setAnimation(anim)
          // Load sprite sheet URL from asset
          getAssetById(anim.spriteSheetId).then(asset => {
            setSpriteSheetUrl(asset.url)
          })
        }
      })
    }
  }, [selectedTile?.animationId])
  
  return (
    <div className="inspector-panel">
      {/* Existing tile properties */}
      
      {/* ADD THIS: Animation Preview */}
      {selectedTile?.animationId && animation && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">Animation</h4>
          <TileAnimationPreview
            animation={animation}
            spriteSheetUrl={spriteSheetUrl}
            tileSize={64}
            autoPlay={true}
          />
        </div>
      )}
    </div>
  )
}
```

---

## 🎨 Ready-to-Use Examples

### Rainy Day Scene

```tsx
<ParticleOverlay
  preset={RAIN_PRESET}
  enabled={true}
  opacity={0.6}
  {...viewportProps}
/>
```

### Night with Fireflies

```tsx
<ParticleOverlay
  preset={FIREFLIES_PRESET}
  enabled={true}
  opacity={0.8}
  {...viewportProps}
/>
```

### Dusty Desert

```tsx
<ParticleOverlay
  preset={DUST_PRESET}
  enabled={true}
  opacity={0.4}
  {...viewportProps}
/>
```

### Winter Snowfall

```tsx
<ParticleOverlay
  preset={SNOW_PRESET}
  enabled={true}
  opacity={0.7}
  {...viewportProps}
/>
```

---

## 🎯 Common Patterns

### Multiple FX Layers

```tsx
{/* Background fog (low z-index) */}
<ParticleOverlay preset={FOG_PRESET} enabled={true} opacity={0.3} {...viewport} />

{/* Tilemap layers */}
<TilemapLayer {...props} />

{/* Foreground rain (high z-index) */}
<ParticleOverlay preset={RAIN_PRESET} enabled={true} opacity={0.7} {...viewport} />
```

### Dynamic FX Based on Tilemap Area

```tsx
function TilemapCanvas() {
  // Detect if player is in water area
  const isInWater = useMemo(() => {
    const tile = getTileAt(playerX, playerY)
    return tile?.type === 'water'
  }, [playerX, playerY, tiles])
  
  return (
    <Stage>
      <TilemapLayer {...props} />
      
      {/* Show bubbles when in water */}
      {isInWater && (
        <ParticleOverlay
          preset={BUBBLE_PRESET}
          enabled={true}
          opacity={0.8}
          {...viewport}
        />
      )}
    </Stage>
  )
}
```

### Animated Tile Patterns

```typescript
// Paint a river of animated water
async function paintRiver(
  canvasId: string,
  startX: number,
  startY: number,
  length: number,
  waterAnimationId: string,
  userId: string
) {
  for (let i = 0; i < length; i++) {
    await setTile(
      canvasId,
      startX + i,
      startY,
      {
        type: 'water',
        color: '#3b82f6',
        animationId: waterAnimationId,
      },
      userId
    )
  }
}
```

---

## 💡 Pro Tips

### Performance

- **Limit Particle Count**: Reduce `spawnRate` for mobile devices
- **Viewport Culling**: Particles automatically cull outside viewport
- **Layer Opacity**: Use layer opacity instead of particle opacity for better performance

### Visual Quality

- **Additive Blending**: Use `blendMode: 'add'` for glowing effects (fireflies, sparkles)
- **Particle Size**: Larger particles look better at high FPS
- **Wind + Gravity**: Combine for realistic motion

### Animation Timing

- **Match Tile Size**: Animation frame size should match or exceed tile size
- **FPS Sweet Spot**: 8-12 FPS works well for most tile animations
- **Loop Length**: 4-8 frames is ideal for seamless loops

---

## 🐛 Troubleshooting

### "Animated tiles not showing"
✅ Check animation exists in Firebase  
✅ Verify sprite sheet URL is valid  
✅ Ensure frames are within sprite sheet bounds

### "Particles not rendering"
✅ Check `enabled={true}`  
✅ Verify viewport dimensions are > 0  
✅ Check particle spawn rate > 0

### "Performance is slow"
✅ Reduce particle spawn rate  
✅ Reduce particle lifetime  
✅ Check if multiple FX layers are active

---

## 📚 Next Steps

- [Full API Reference](../features/ANIMATED_TILES_AND_FX.md)
- [Animation System](../../types/animation.ts)
- [FX Presets](../../data/fxPresets.ts)
- [Multi-Layer Tilemap](../features/MULTI_LAYER_TILEMAP.md)

---

**That's it!** You now have animated tiles and environmental FX working in your tilemap. 🎉

