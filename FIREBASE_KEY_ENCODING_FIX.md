# Firebase Key Encoding Fix

## ✅ Problems Solved

### Problem 1: Invalid Keys
**Error**: `set failed: value argument contains an invalid key (tile.0) in property 'assets.asset-xxx.tilesetMetadata.namedTiles'`

**Root Cause**: Firebase Realtime Database doesn't allow certain characters in object keys:
- `.` (period) 
- `#` (hash)
- `$` (dollar)
- `/` (slash)
- `[` `]` (brackets)

Our semantic tile naming system uses periods extensively:
- `"grass.center"` → tile index
- `"water.corner_ne"` → tile index  
- `"tile.0"` → tile index

### Problem 2: Undefined Values
**Error**: `set failed: value argument contains undefined in property 'assets.asset-xxx.tilesetMetadata.tileGroups.tile.autoTileSystem'`

**Root Cause**: Firebase Realtime Database doesn't allow `undefined` values in objects.

Optional fields in our TypeScript interfaces (like `autoTileSystem?: string`) can be `undefined`, which Firebase rejects when trying to save.

---

## 🔧 Solution Implemented

### 1. **Firebase Key Encoder Utility** (`src/utils/firebaseKeyEncoder.ts`)

Created encoding/decoding functions that:
- Convert `.` to `__DOT__`
- Convert `#` to `__HASH__`
- Convert `$` to `__DOLLAR__`
- Convert `/` to `__SLASH__`
- Convert `[` to `__LBRACKET__`
- Convert `]` to `__RBRACKET__`
- **Remove all `undefined` values recursively** (Firebase doesn't allow them)

**Key Functions:**
```typescript
encodeAssetForFirebase(asset)   // Encodes metadata keys and removes undefined values before saving
decodeAssetFromFirebase(asset)  // Decodes metadata keys after reading
removeUndefinedValues(obj)      // Internal: recursively removes undefined values
```

**Important**: 
- Only encodes **nested metadata keys** (like `namedTiles`, `tileGroups`), NOT root Asset properties (like `type`, `id`, `name`)
- Removes all `undefined` values from the entire asset before saving to Firebase

---

### 2. **Updated Asset Functions** (`src/services/assets/assetUpload.ts`)

Modified all asset save/load functions:

#### **When Saving:**
- `uploadAsset()` - Encodes before saving to Firebase
- `updateAssetMetadata()` - Encodes updates
- `replaceAssetFile()` - Encodes updated asset

#### **When Loading:**
- `getAsset()` - Decodes after reading from Firebase
- `getUserAssets()` - Decodes each asset in the list

---

## 📝 Example Transformation

**Original (in app memory):**
```javascript
{
  tilesetMetadata: {
    namedTiles: {
      "grass.center": 0,
      "grass.corner_ne": 1,
      "water.edge_n": 15
    },
    tileGroups: {
      "grass": {
        tiles: {
          "center": 0,
          "corner_ne": 1
        }
      }
    }
  }
}
```

**Encoded (in Firebase):**
```javascript
{
  tilesetMetadata: {
    namedTiles: {
      "grass__DOT__center": 0,
      "grass__DOT__corner_ne": 1,
      "water__DOT__edge_n": 15
    },
    tileGroups: {
      "grass": {
        tiles: {
          "center": 0,
          "corner_ne": 1
        }
      }
    }
  }
}
```

**Decoded (when loaded back):**
```javascript
{
  tilesetMetadata: {
    namedTiles: {
      "grass.center": 0,      // ✅ Restored!
      "grass.corner_ne": 1,
      "water.edge_n": 15
    }
  }
}
```

---

## ✅ Testing

### **Test Upload:**
1. Upload a tileset with semantic names (e.g., Kenney tileset)
2. Check that it saves without Firebase errors
3. Verify AI commands can use semantic names ("paint grass.center")

### **Test Load:**
1. Reload the page
2. Check that asset library loads correctly
3. Verify tileset metadata has correct semantic names
4. Test AI suggestions use correct tile names

---

## 🎯 Files Modified

1. **Created**: `src/utils/firebaseKeyEncoder.ts` (new utility)
2. **Updated**: `src/services/assets/assetUpload.ts` (6 functions)
3. **Updated**: `database.rules.json` (added `.indexOn` for userId)
4. **Updated**: `storage.rules` (public read/write access)

---

## 🚀 Next Steps

1. **Test asset uploads** - Should work without Firebase key errors
2. **Test AI commands** - AI can use semantic names like "grass.center"
3. **Monitor for errors** - Check console for any encoding/decoding issues

---

## 📌 Important Notes

- **Backward Compatible**: Old assets (if any) will decode gracefully
- **Transparent**: App code uses original keys (`grass.center`), encoding is internal
- **Safe**: Only affects metadata keys, not root Asset properties
- **Automatic**: Encoding/decoding happens automatically in save/load functions

---

## 🔍 Debugging

If you see encoding issues:

1. **Check console** for `encodeAssetForFirebase` / `decodeAssetFromFirebase` calls
2. **Check Firebase console** - keys should have `__DOT__` instead of `.`
3. **Check app state** - keys should have `.` (not `__DOT__`)

If keys show up wrong in the app, the decoding isn't working. If Firebase rejects the save, the encoding isn't working.

