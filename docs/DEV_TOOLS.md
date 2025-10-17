# 🛠️ Developer Tools

**Available in development mode only**

---

## 🗑️ Clear Assets Tool

### Purpose
Safely delete all assets for the currently logged-in user from:
- Firebase Database (`/assets/{userId}`)
- Asset Catalog (`/assetCatalog/{userId}`)
- Firebase Storage (`assets/{userId}/`)

### Usage

#### **Step 1: Open Browser Console**
1. Open your app in the browser (`http://localhost:5176`)
2. Log in to your account
3. Open browser DevTools (F12)
4. Go to the Console tab

#### **Step 2: Preview (Dry Run)**
```javascript
// See what would be deleted WITHOUT actually deleting
window.clearAssets()

// Output:
// 📊 Found 10 assets to delete
// 🔍 DRY RUN - Would delete:
//   - forest_tiles (tileset)
//   - dungeon_walls (tileset)
//   - player_sprite (spritesheet)
//   ...
```

#### **Step 3: Actually Delete**
```javascript
// PERMANENTLY DELETE all assets (asks for confirmation)
window.clearAssets(false)

// You'll see a confirmation dialog:
// ⚠️ WARNING ⚠️
// This will permanently delete ALL assets for:
// your-email@example.com
//
// This action CANNOT be undone!
//
// Are you absolutely sure?
```

#### **Step 4: Confirmation**
- Click **OK** to proceed with deletion
- Click **Cancel** to abort

### Output

```
👤 Current user: user@example.com (abc123xyz)
🗑️ Clearing assets for user: abc123xyz
📊 Found 10 assets to delete
🗄️ Deleting from database...
  ✓ Deleted forest_tiles
  ✓ Deleted dungeon_walls
  ✓ Deleted player_sprite
  ...
☁️ Deleting from storage...
📦 Found 20 files in storage
  ✓ Deleted asset_001.png
  ✓ Deleted asset_001_thumb.png
  ...
✅ Asset cleanup complete!
📊 Summary:
  - Database assets deleted: 10
  - Catalog entries deleted: 10
  - Storage files deleted: 20
```

---

## ⚠️ Important Notes

### **Safety Features**
- ✅ Only works in development mode (`DEV` environment)
- ✅ Dry run by default (preview before delete)
- ✅ Requires explicit confirmation for actual deletion
- ✅ Only deletes assets for the logged-in user
- ✅ Graceful error handling (continues even if some files fail)

### **When to Use**
- 🔄 Testing asset upload pipeline
- 🧪 Resetting test environment
- 🗑️ Cleaning up old/broken assets
- 🎨 Starting fresh with new tilesets

### **What Gets Deleted**
- ✅ Asset metadata in Firebase Database
- ✅ Catalog entries for fast lookup
- ✅ Original image files in Storage
- ✅ Thumbnail images in Storage

### **What Does NOT Get Deleted**
- ❌ Canvas documents (your actual projects)
- ❌ User profile data
- ❌ Other users' assets
- ❌ Shared/public assets

---

## 🔧 Programmatic Usage

You can also use the cleanup function in your own scripts:

```typescript
import { clearCurrentUserAssets, clearUserAssets } from './scripts/clearAssets'

// Clear for current logged-in user (with confirmation)
const result = await clearCurrentUserAssets(false)

// Clear for specific user (bypasses confirmation - be careful!)
const result = await clearUserAssets('user-id-here', false)

// Check results
console.log(`Deleted ${result.assetsDeleted} assets`)
if (result.errors.length > 0) {
  console.error('Errors:', result.errors)
}
```

---

## 📝 Example Workflow

### **Testing New Tilesets**

```javascript
// 1. Upload some test tilesets via UI
//    (upload forest_tiles.png, dungeon_walls.png)

// 2. Test AI asset discovery
//    "List my tilesets"
//    "Find me forest tiles"

// 3. Preview what you uploaded
window.clearAssets()  // Dry run

// 4. Clear everything to test again
window.clearAssets(false)  // Confirm deletion

// 5. Upload refined tilesets with better naming
//    (upload kenney_forest_tiles.png with proper metadata)

// 6. Verify AI can find them
//    "List my tilesets" // Should show new assets
```

---

## 🚨 Troubleshooting

### **"No user is currently logged in"**
→ Log in to your account first, then run the command

### **"clearAssets is not defined"**
→ Make sure you're in development mode (`npm run dev`)
→ Check browser console for "Dev tools loaded!" message
→ Try refreshing the page

### **Some files failed to delete**
→ Check the errors array in the result
→ Files may be in use or have permission issues
→ Storage files can be manually deleted in Firebase Console

### **Need to delete assets for a different user?**
→ Log out, log in as that user, then run `clearAssets(false)`
→ Or use programmatic approach with their user ID

---

## 🔒 Production Safety

This tool is **automatically disabled in production** (`import.meta.env.DEV` check).

The function will not be available in the production build, so users cannot accidentally delete their assets.

---

**File Location**: `src/scripts/clearAssets.ts`  
**Loaded in**: `src/main.tsx` (dev mode only)

