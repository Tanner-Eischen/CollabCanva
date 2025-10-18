# Phase 3: Client Integration Roadmap
## AI Tilemap Semantic Names - Implementation Guide

**Status:** Ready to Start  
**Previous Work:** Phase 1 & 2 ✅ Complete  
**Timeline:** ~3-4 days  

---

## Phase 3 Overview

Connect UI to pass tileset metadata to AI, enabling semantic tile name resolution in the client layer.

---

## Task 3.1: Update AI Command Hook ⏳

**File:** `src/hooks/useAIOrchestrator.tsx`

### Current State
The hook sends AI commands but doesn't include tileset metadata.

### Required Changes

```typescript
/**
 * Enhanced: Include tileset metadata in AI context
 */
const executeAICommand = useCallback(
  async (
    message: string,
    context: {
      canvasId: string;
      userId: string;
      tilemapMeta: TilemapMeta;
      viewport: any;
      // NEW: Add tileset context
      activeTilesetId?: string;
      activeTilesetMetadata?: any;
    }
  ) => Promise<AIResponse>,
  [/* deps */]
);
```

### Implementation Steps

1. **Import tile resolution utilities**
   ```typescript
   import { TileResolutionContext } from '../services/ai/tileResolution'
   ```

2. **Get tileset ID from tilemap state**
   ```typescript
   const tilemapState = useTilemap(); // Existing hook
   const activeTilesetId = tilemapState.activeTilesetId
   ```

3. **Load tileset metadata when available**
   ```typescript
   if (activeTilesetId) {
     const asset = await getAsset(activeTilesetId, userId)
     if (asset?.tilesetMetadata) {
       // Use in AI request
     }
   }
   ```

4. **Build AIRequest with currentAssets**
   ```typescript
   const request: AIRequest = {
     message,
     context: {
       canvasId,
       userId,
       selectedShapes: [],
       viewport,
       mode: 'tilemap',
       tilemapMeta,
       currentAssets: {
         activeTileset: asset?.tilesetMetadata ? {
           id: activeTilesetId,
           name: asset.name,
           namedTiles: asset.tilesetMetadata.namedTiles || {},
           tileGroups: asset.tilesetMetadata.tileGroups,
           autoTileSystem: asset.tilesetMetadata.autoTileSystem,
           materials: asset.tilesetMetadata.materials,
           themes: asset.tilesetMetadata.themes,
         } : undefined,
         availableTilesets: userTilesets.map(t => ({
           id: t.id,
           name: t.name,
           tileSize: t.tilesetMetadata?.tileSize || 32
         }))
       }
     }
   };
   ```

5. **Send enhanced request**
   ```typescript
   return sendAICommand(request)
   ```

### Testing Checklist
- [ ] Hook compiles without errors
- [ ] Types match AIRequest
- [ ] Tileset metadata loads correctly
- [ ] Request includes currentAssets
- [ ] Backward compatible (works without tileset)

---

## Task 3.2: Add Tileset State Management ⏳

**Files:** 
- `src/hooks/useTilemap.ts` or create `src/hooks/useTilesetState.ts`

### Required State

```typescript
interface TilesetState {
  // Active tileset for current canvas
  activeTilesetId: string | null;
  activeTilesetMetadata: TilesetMetadata | null;
  
  // Cached tilesets
  loadedTilesets: Map<string, TilesetMetadata>;
  
  // Loading state
  loading: boolean;
  error: string | null;
}

interface TilesetActions {
  // Set active tileset
  setActiveTileset: (
    tilesetId: string, 
    metadata: TilesetMetadata
  ) => void;
  
  // Load tileset
  loadTileset: (tilesetId: string) => Promise<TilesetMetadata>;
  
  // Unload tileset
  unloadTileset: (tilesetId: string) => void;
  
  // Clear cache
  clearCache: () => void;
  
  // Get material variations
  getMaterials: () => string[];
}
```

### Implementation Approach

**Option A: Extend useTilemap**
```typescript
// In src/hooks/useTilemap.ts
export function useTilemap() {
  const [activeTilesetId, setActiveTilesetId] = useState<string | null>(null);
  const [activeTilesetMetadata, setActiveTilesetMetadata] = useState<TilesetMetadata | null>(null);
  const [loadedTilesets, setLoadedTilesets] = useState<Map<string, TilesetMetadata>>(new Map());
  
  const setActiveTileset = useCallback((id: string, meta: TilesetMetadata) => {
    setActiveTilesetId(id);
    setActiveTilesetMetadata(meta);
    setLoadedTilesets(prev => new Map(prev).set(id, meta));
  }, []);
  
  // ... other methods
  
  return {
    activeTilesetId,
    activeTilesetMetadata,
    loadedTilesets,
    setActiveTileset,
    // ... other methods
  };
}
```

**Option B: Create Zustand store** (if Zustand already used)
```typescript
// src/store/tilesetStore.ts
import { create } from 'zustand';

interface TilesetStore {
  activeTilesetId: string | null;
  activeTilesetMetadata: TilesetMetadata | null;
  loadedTilesets: Map<string, TilesetMetadata>;
  setActiveTileset: (id: string, meta: TilesetMetadata) => void;
  // ...
}

export const useTilesetStore = create<TilesetStore>((set) => ({
  activeTilesetId: null,
  activeTilesetMetadata: null,
  loadedTilesets: new Map(),
  setActiveTileset: (id, meta) => set(state => ({
    activeTilesetId: id,
    activeTilesetMetadata: meta,
    loadedTilesets: new Map(state.loadedTilesets).set(id, meta)
  })),
  // ...
}));
```

### Testing Checklist
- [ ] State initializes correctly
- [ ] Set tileset updates all fields
- [ ] Cache works properly
- [ ] Unload removes from cache
- [ ] Clear cache empties map

---

## Task 3.3: Update Tilemap Canvas Component ⏳

**File:** `src/components/canvas/TilemapCanvas.tsx` or equivalent

### When Tileset is Selected

```typescript
const handleTilesetSelect = async (tilesetId: string) => {
  try {
    setLoading(true);
    
    // 1. Load asset metadata
    const asset = await getAsset(tilesetId, userId);
    if (!asset?.tilesetMetadata) {
      throw new Error('Invalid tileset');
    }
    
    // 2. Update local state
    tilemapStore.setActiveTileset(tilesetId, asset.tilesetMetadata);
    
    // 3. Persist to Firebase (optional but recommended)
    await updateCanvasMetadata(canvasId, {
      tilemapMeta: {
        ...existingMeta,
        activeTilesetId: tilesetId,
        activeTilesetName: asset.name
      }
    });
    
    // 4. Show feedback
    toast.success(`Selected ${asset.name} tileset`);
    
  } catch (error) {
    toast.error('Failed to select tileset');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### When AI Command is Sent

```typescript
const handleAICommand = async (message: string) => {
  try {
    // Use enhanced hook that includes tileset metadata
    const response = await executeAICommand(message, {
      canvasId,
      userId,
      tilemapMeta,
      viewport,
      activeTilesetId: tilemapStore.activeTilesetId,
      activeTilesetMetadata: tilemapStore.activeTilesetMetadata,
    });
    
    if (!response.success) {
      toast.error(response.error || 'AI command failed');
      return;
    }
    
    // Execute returned actions
    const actions = parseAIResponseToActions(
      response.toolResults,
      tilemapMeta
    );
    
    for (const action of actions) {
      const executor = createAILayerExecutor(canvasId, userId);
      
      // NEW: Set tile context for resolution!
      if (tilemapStore.activeTilesetMetadata?.namedTiles) {
        executor.setTileContext({
          namedTiles: tilemapStore.activeTilesetMetadata.namedTiles,
          autoTileSystem: tilemapStore.activeTilesetMetadata.autoTileSystem,
        });
      }
      
      const result = await executor.execute(action);
      if (!result.success) {
        toast.error(`Action failed: ${result.error}`);
        break;
      }
    }
    
    toast.success('AI command executed');
    
  } catch (error) {
    toast.error('Failed to execute AI command');
    console.error(error);
  }
};
```

### On Component Mount

```typescript
useEffect(() => {
  // Load active tileset if canvas has one
  if (canvasData?.tilemapMeta?.activeTilesetId) {
    loadAndSetTileset(canvasData.tilemapMeta.activeTilesetId);
  }
}, [canvasData?.tilemapMeta?.activeTilesetId]);

async function loadAndSetTileset(tilesetId: string) {
  try {
    const asset = await getAsset(tilesetId, userId);
    if (asset?.tilesetMetadata) {
      tilemapStore.setActiveTileset(tilesetId, asset.tilesetMetadata);
    }
  } catch (error) {
    console.warn('Failed to load active tileset:', error);
  }
}
```

### Testing Checklist
- [ ] Tileset selection works
- [ ] Canvas metadata updates
- [ ] AI commands include tileset context
- [ ] Tile context is set on executor
- [ ] Semantic names are resolved
- [ ] Paintings execute successfully

---

## Integration Verification

### End-to-End Test Scenario

1. **Setup**
   - [ ] Create canvas with tilemap
   - [ ] Upload grass tileset with named tiles
   - [ ] Select tileset in UI

2. **Execution**
   - [ ] Send AI command: "Paint grass in center"
   - [ ] Monitor that "grass" is resolved to "grass.center"
   - [ ] Verify grass tile appears on canvas

3. **Verification**
   - [ ] AI command returns success
   - [ ] Tiles are painted correctly
   - [ ] Canvas updates visually
   - [ ] No errors in console

---

## Data Flow Diagram

```
User Action: Select Tileset
        ↓
Load Asset from Firebase
        ↓
Extract Metadata
        ↓
Update TilesetState
  (activeTilesetId, metadata, cache)
        ↓
Update Canvas Metadata in Firebase
        ↓
Show Success Toast

User Action: Send AI Command
        ↓
executeAICommand Hook
        ↓
Build AIRequest with:
  - currentAssets.activeTileset
  - currentAssets.availableTilesets
        ↓
Send to Firebase Function
        ↓
Function returns ToolResults
        ↓
Parse to AILayerActions
        ↓
Create Executor
        ↓
Set TileContext on Executor
        ↓
Execute Action (resolves names → indices)
        ↓
Return Success
        ↓
Update Canvas
```

---

## Success Metrics for Phase 3

- ✅ Tileset metadata flows through UI layer
- ✅ AIRequest includes currentAssets context
- ✅ Executor receives tile context
- ✅ Semantic names resolve correctly
- ✅ Backward compatibility maintained
- ✅ User can select tileset visually
- ✅ AI commands use semantic names
- ✅ Error messages are helpful

---

## Troubleshooting Guide

### Issue: Tileset metadata not loading
**Solution:**
- Check Firebase permissions on assets/{userId}/{tilesetId}
- Verify tilesetMetadata field exists in asset
- Check console for network errors

### Issue: Semantic names not resolving
**Solution:**
- Verify namedTiles exists in metadata
- Check that tile context is set on executor
- Log context to verify structure

### Issue: Commands still use numeric indices
**Solution:**
- Check AIRequest includes currentAssets
- Verify Firebase function receives it
- Check resolve logic in paintTileRegionTool

### Issue: Type errors in TypeScript
**Solution:**
- Ensure TileResolutionContext imported
- Check TilesetMetadata type definitions
- Verify all interfaces aligned

---

## Dependencies

- ✅ Phase 1 infrastructure (tileResolution service)
- ✅ Phase 2 Firebase functions (paintTileRegionTool)
- Existing: `useTilemap`, `getAsset`, Firebase integration

---

## Estimated Timeline

- **Task 3.1** (Hook): 1-2 hours
- **Task 3.2** (State): 1-2 hours  
- **Task 3.3** (Component): 2-3 hours
- **Testing & Debug**: 1-2 hours

**Total: ~5-9 hours of development**

---

## Next Phase

After Phase 3 completion, proceed to:
- **Phase 4**: Asset Enhancement (sprite sheet analysis, manual naming)
- **Phase 6**: Monitoring (analytics, error reporting)

