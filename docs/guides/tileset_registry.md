# Tileset Registry Guide

The tileset registry centralizes all 3×3 auto-tiling definitions so the editor, AI agent, and renderers share the same data. This document explains how the registry is structured, how to register custom tilesets in Firebase, and the expected asset naming conventions for consistent rendering.

## 3×3 Variant Index Map

Tilesets store their terrain art in a 3×3 grid of variants. Each key from `1` to `9` refers to one of the nine cells:

```
1 2 3
4 5 6
7 8 9
```

When the auto-tiler computes a variant index it always clamps to this range. Missing indices fall back to the builtin neutral color swatch, so providing all nine entries keeps rendering smooth at tile boundaries.

## Registry Responsibilities

- Cache builtin tilesets (`builtin-default`) and user-provided tilesets
- Persist tilesets in Cloud Firestore (`tilesets3x3` collection) with ownership metadata
- Provide `hasSprite`, `getTilePath`, and palette helpers for rendering
- Fall back to builtin tiles when requested tileset data is missing or fails to load

## Adding a Custom Tileset

1. **Prepare the assets**
   - Generate nine tile images for every terrain ID in your tileset.
   - Name files in a predictable pattern, e.g. `grass-1.png … grass-9.png`, to mirror the 3×3 variant index map.
   - Upload assets to Firebase Storage or host them on a CDN. Store the final URLs in the tileset definition.
2. **Create the tileset definition**
   - Build a `Tileset3x3` object that lists every terrain, variant URL, palette color, and metadata you need.
   - Ensure the `tileSize` matches the pixel dimensions of each variant image (16, 32, etc.).
3. **Persist to Firestore**
   - Call `tilesetRegistry.saveTileset(tileset, userId)` after authentication. The helper stores the document in `tilesets3x3/{tileset.id}` with `owner` and `updatedAt` fields.
   - Subsequent calls overwrite the same document, allowing you to ship updated art.
4. **Activate in the editor**
   - Update the canvas metadata (`tilemaps/{canvasId}/meta`) so `activeTilesetId` references your new tileset ID.
   - The registry automatically preloads and caches it the next time the canvas loads.

## Asset Folder Structure

We recommend the following Storage layout to keep variants organized:

```
assets/
  tilesets/
    <tilesetId>/
      <terrainId>/
        1.png
        2.png
        …
        9.png
```

Store the public download URLs in the tileset definition so the registry can fetch them directly. The cleanup script `src/scripts/cleanupTilesets.ts` removes legacy `/assets` entries that previously mixed tilesets with regular sprite assets.

## How Fallback Works

- `tilesetRegistry` always ships with the builtin `builtin-default` definition.
- If a requested tileset fails to load or a terrain is missing, the registry keeps rendering by returning builtin terrain colors and disables sprite usage for that tile.
- Calls to `getActiveTileset` automatically fall back to the builtin when the active ID no longer exists, preventing runtime crashes.

## Performance Tips

- Call `tilesetRegistry.listUserTilesets(userId)` after login to warm the cache and populate the palette selector.
- Use `tilesetRegistry.setActiveTileset(tilesetId)` as soon as a canvas loads so async sprite fetching begins before the player scrolls the map.
- Cache CDN URLs aggressively (long-lived headers) and prefer PNG tiles trimmed to the minimum tile size to minimize bandwidth.
- Run the cleanup script after migrating existing projects so stale legacy tileset assets do not keep downloading in the background.

## Migration Notes

- Run `cleanupLegacyTilesetAssets` (see script header) once per project to strip old `/assets` records with `type: "tileset"`.
- Update Firestore security rules before deploying so only document owners can modify `tilesets3x3` data.
- Tilemaps created before the registry may not have `activeTilesetId`. When you save them the editor automatically fills it with `builtin-default`.
