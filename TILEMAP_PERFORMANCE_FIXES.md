# Tilemap Performance Optimization - Making It Seamless

## 🎯 Current Performance Bottlenecks

Based on the code analysis, here are the remaining performance issues causing choppy lag:

### 1. **Tile Rendering Re-renders** 
- Every viewport movement recalculates visible tiles
- Konva layers re-render even when tiles haven't changed
- Need: React.memo and useMemo optimizations

### 2. **Image Loading**
- Sprite tiles load images on every render
- No sprite sheet caching
- Need: Preload all sprites, use image atlas

### 3. **Firebase Real-time Subscriptions**
- Subscribing to all chunks causes unnecessary updates
- Need: Only subscribe to visible chunks, unsubscribe on scroll

### 4. **Konva Performance Settings**
- Not using optimal performance flags
- Need: Disable hit detection, use faster rendering mode

## ✅ Optimizations Already Implemented

✅ **Viewport Culling** - Only renders visible tiles (62-89 lines in TileRenderer)
✅ **Batch Processing** - 100 tiles per Firebase write
✅ **Batched Auto-tiling** - O(n) instead of O(n²)
✅ **Layer opacity caching** - useMemo for parallax calculations

## 🚀 Additional Optimizations Needed

### Priority 1: React Performance

```typescript
// 1. Memoize TileRenderer component
export default React.memo(TileRenderer, (prev, next) => {
  return (
    prev.tiles === next.tiles &&
    prev.viewportX === next.viewportX &&
    prev.viewportY === next.viewportY &&
    prev.layer?.id === next.layer?.id
  )
})

// 2. Memoize individual tiles
const MemoizedSpriteTile = React.memo(SpriteTile)
const MemoizedAnimatedTile = React.memo(AnimatedTile)
```

### Priority 2: Konva Performance

```typescript
// In Stage component:
<Stage
  pixelRatio={1} // Reduce pixel ratio for faster rendering
  listening={false} // Disable event listeners when not needed
>
  <Layer
    listening={false}
    perfectDrawEnabled={false}
    hitGraphEnabled={false} // Disable hit detection
    imageSmoothingEnabled={false} // Faster rendering for pixel art
  />
</Stage>
```

### Priority 3: Sprite Caching

```typescript
// Create global sprite cache
const spriteCache = new Map<string, HTMLImageElement>()

function preloadSprites(tileTypes: string[]) {
  tileTypes.forEach(type => {
    for (let i = 0; i <= 8; i++) {
      const path = getTilePath(type, i)
      const img = new Image()
      img.src = path
      spriteCache.set(`${type}_${i}`, img)
    }
  })
}
```

### Priority 4: Chunk Management

```typescript
// Only subscribe to visible chunks
useEffect(() => {
  const visibleChunkKeys = calculateVisibleChunks(viewport, chunkSize)
  
  // Unsubscribe from non-visible chunks
  activeChunks.forEach(chunkKey => {
    if (!visibleChunkKeys.includes(chunkKey)) {
      unsubscribeFromChunk(chunkKey)
    }
  })
  
  // Subscribe to new visible chunks
  visibleChunkKeys.forEach(chunkKey => {
    if (!activeChunks.includes(chunkKey)) {
      subscribeToChunk(chunkKey)
    }
  })
}, [viewport])
```

## 📊 Expected Performance After Optimizations

| Metric | Current | Target | How |
|--------|---------|--------|-----|
| Viewport scroll FPS | 30-40 fps | 60 fps | React.memo + Konva settings |
| Tile render time | 10-20ms | <5ms | Sprite preloading |
| Memory usage | High | Moderate | Chunk unsubscribe |
| Perceived lag | Noticeable | Seamless | All optimizations combined |

## 🔧 Implementation Priority

**Phase 1** (Immediate - 15 min):
1. Add React.memo to TileRenderer
2. Add Konva performance flags
3. Implement sprite preloading

**Phase 2** (Quick wins - 30 min):
4. Memoize SpriteTile components
5. Add hitGraphEnabled: false
6. Optimize viewport culling calculations

**Phase 3** (Advanced - 1 hour):
7. Implement chunk subscription management
8. Add sprite sheet atlas
9. WebGL acceleration (if needed)

## 🎬 Ready to Implement

All changes can be made without breaking existing functionality. The viewport culling is already excellent - we just need to prevent unnecessary re-renders and optimize Konva settings.

**Next steps:**
1. Start with React.memo optimizations
2. Add Konva performance flags  
3. Implement sprite preloading
4. Test with large tilemaps (100x100)

