### Issue: Cursors not syncing
**Check:**
1. Firebase security rules allow writes to `presence/${userId}`
2. Throttle function is imported correctly from lodash-es
3. User is authenticated before writing to Firebase
4. Firebase Realtime Database is enabled (not Firestore)

### Issue: Objects not appearing for other users
**Check:**
1. Object writes are going to correct path: `canvas/objects/${id}`
2. Other clients are listening with `onValue` listener
3. Firebase security rules allow reads/writes to `canvas`
4. Network tab shows Firebase requests succeeding

### Issue: Poor performance / low FPS
**Check:**
1. Too many objects on canvas (>500)
2. Not using Konva layers/caching
3. Re-rendering entire canvas on every update
4. Not rounding cursor positions (causing sub-pixel renders)

### Issue: Firebase quota exceeded
**Check:**
1. Cursor updates are throttled to 20 Hz (not faster)
2. Using compressed data format (arrays, short keys)
3. Firebase console → Usage tab to see actual bandwidth
4. Consider upgrading to Blaze plan (~$1-5 for MVP period)# CollabCanvas MVP - Product Requirements Document

## Project Overview

CollabCanvas is a real-time collaborative design tool that enables multiple users to simultaneously create, edit, and manipulate visual elements on a shared canvas. This MVP focuses on establishing robust multiplayer infrastructure with basic shape manipulation capabilities.

**Timeline:** 24 hours to MVP checkpoint  
**Primary Success Metric:** Bulletproof real-time synchronization between 2+ concurrent users

**MVP Scope:**
- Single hardcoded canvas (all authenticated users share one workspace)
- Basic shape operations: create, move, delete (resize removed for simplicity)
- Real-time multiplayer sync with selection awareness
- Simple authentication (email/password)
- Fixed blue color for all shapes (no color picker needed)
- AI features, multi-canvas support, and advanced editing deferred to post-MVP

### Key Design Decisions

**Why single shared canvas?**  
Simplifies MVP to focus on real-time sync infrastructure. Multi-canvas requires routing, project management UI, and access control—all post-MVP concerns.

**Why no resize/rotation/advanced transforms?**  
Keeps shape manipulation as simple as possible. Move + delete covers core layout workflow. Resize and rotation add complexity to conflict resolution and UI implementation—deferring to post-MVP saves hours.

**Why fixed blue color?**  
Eliminates need for color picker UI. Reduces decisions users make during creation. Can add color customization post-MVP without affecting sync architecture.

**Why no text editing after creation?**  
Text editing requires cursor position sync within text objects, significantly increasing complexity. Create-once text is sufficient for MVP.

**Why last-write-wins conflict resolution?**  
Operational Transform (OT) or CRDTs would take days to implement correctly. LWW is acceptable for MVP with <10 concurrent users.

**Why Firebase over custom WebSocket server?**  
Firebase provides real-time sync, auth, hosting, and persistence in one service. Building custom backend would consume half the 24-hour timeline.

---

## User Stories

### Designer/Creator (Primary User)
- As a designer, I want to create basic shapes (rectangles, circles, text) on a canvas so I can start building visual designs
- As a designer, I want to move and position objects freely so I can arrange my design layout
- As a designer, I want to delete objects I no longer need so I can keep my canvas clean
- As a designer, I want to pan and zoom the canvas so I can navigate large workspaces comfortably
- As a designer, I want to see other users' cursors in real-time so I know where my teammates are working
- As a designer, I want to see what objects other users have selected so I know what they're editing
- As a designer, I want to see changes made by others instantly so we can collaborate without conflicts

### Collaborator (Secondary User)
- As a collaborator, I want to join an existing canvas session so I can contribute to the design
- As a collaborator, I want to see who else is currently online so I know who I'm working with
- As a collaborator, I want my edits to sync immediately so others see my contributions in real-time

### Authenticated User
- As a user, I want to sign in with my account so my identity is associated with my edits
- As a user, I want my cursor to show my name so others know it's me

---

## Core Features (MVP)

### 1. Canvas System
**Must Have:**
- 5000x5000px canvas with hard boundaries (feels pseudo-infinite)
- Smooth pan functionality (click-drag or spacebar-drag)
- Zoom in/out (mouse wheel, with min 25% and max 400%)
- Line grid overlay for spatial awareness
- 60 FPS rendering performance
- Empty canvas on first load (no tutorial/example shapes)

**Technical Considerations:**
- Use canvas virtualization to only render visible objects
- Implement transform matrix for efficient pan/zoom operations
- Enforce boundary limits on pan (cannot scroll beyond 5000x5000)

### 2. Shape Creation & Manipulation

**Must Have:**

**Shape Types & Properties:**
- Three shape types: Rectangle, Circle, Text
- Fixed dimensions: 100x100px for all shapes (rectangles and circles)
- Fixed color: Blue (#3B82F6) for all shapes
- Position: (x, y) coordinates determined by click location
- Text: Click on canvas and type directly (create-once, no editing after)

**Interactions:**
- Click to select shape (single selection only)
- Drag to move selected shape
- Delete selected shape via:
  - Delete key (keyboard)
  - Delete button in toolbar
- Visual selection indicators:
  - Selected by current user: blue bounding box
  - Selected by another user: show their user color bounding box
- Selection state syncs to all users in real-time

**UI Layout:**
- Left vertical toolbar with shape creation buttons:
  - Rectangle button
  - Circle button  
  - Text button
  - Delete button (active only when shape selected)
- Top header bar showing online users list

**Validation:**
- Prevent empty text objects (require at least 1 character)
- Text objects auto-size to content width (not fixed 100px width)

**Out of Scope (Post-MVP):**
- Resize (removed to simplify MVP)
- Multi-select (shift+click)
- Text editing after creation
- Copy/paste
- Undo/redo
- Rotation
- Color picker or customization
- Advanced properties (stroke, opacity, gradients)
- Z-index manipulation (bring to front/back)

### 3. Real-Time Collaboration
**Must Have:**
- WebSocket connection for live updates (Firebase Realtime Database)
- Multiplayer cursor display:
  - Arrow pointer with user name label
  - Jump to new position (no interpolation for MVP)
  - Each user gets unique color
- Presence system showing online users in top header bar
- Selection state sync (show which user has which object selected)
- Sub-100ms object sync latency
- Sub-50ms cursor position sync
- Conflict resolution (last-write-wins)
- State persistence across disconnects

**Technical Requirements:**
- Broadcast object create/update/delete events to all clients
- Broadcast selection changes (when user selects/deselects object)
- Throttle cursor position updates to 20 Hz (50ms intervals)
- Handle reconnection gracefully with loading spinner
- Persist canvas state to database (auto-save)
- Use compressed data format for bandwidth efficiency
- All authenticated users can read/write shared canvas

### 4. User Authentication
**Must Have:**
- Simple sign-up/login flow
- User identification (name/email)
- Session management
- Authenticated user association with canvas edits

### 5. Deployment
**Must Have:**
- Publicly accessible URL
- Support for 5+ concurrent users
- Stable performance under load

---

## Out of Scope (Post-MVP)

To maintain focus on core multiplayer functionality, the following features are **explicitly excluded** from the MVP:

### Editing Features
- Text editing after creation (text objects are create-once)
- Multi-select (shift+click to select multiple objects)
- Copy/paste/duplicate objects
- Undo/redo functionality
- Shape rotation
- Grouping/ungrouping objects
- Alignment and distribution tools
- Object locking

### Advanced Shape Properties
- Stroke color and width
- Opacity/transparency
- Gradients and patterns
- Drop shadows and effects
- Z-index manipulation (bring to front/send to back)
- Border radius for rectangles

### Canvas Management
- Multiple canvas/project creation
- Canvas templates
- Canvas naming and metadata
- Canvas list/dashboard view
- Canvas sharing links
- Canvas duplication

### Export & Import
- Export to PNG/SVG/PDF
- Import images or SVG files
- Save as file (JSON export)
- Version history

### Collaboration Features
- Comments and annotations
- Voice/video chat
- In-app notifications
- User permissions (view-only, edit)
- Canvas ownership model

### AI Features
- AI-powered design suggestions
- Auto-layout
- Smart resize
- Image generation
- Color palette generation
- *All AI functionality deferred to future phases*

### Performance & Scale
- Handling 1000+ objects
- Canvas archiving
- Lazy loading for large canvases

---

## UI/UX Specifications

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  Top Header Bar: [User1] [User2] [User3] (Online)      │
├────┬────────────────────────────────────────────────────┤
│ T  │                                                     │
│ o  │                                                     │
│ o  │          Canvas Area (5000x5000)                   │
│ l  │          - Line grid background                    │
│ b  │          - Shapes render here                      │
│ a  │          - Multiplayer cursors                     │
│ r  │          - Selection indicators                    │
│    │                                                     │
│ [▭]│                                                     │
│ [●]│                                                     │
│ [T]│                                                     │
│ [🗑]│                                                     │
└────┴────────────────────────────────────────────────────┘
```

### Component Details

**Top Header Bar:**
- Fixed position at top
- Background: Dark/neutral color
- Contents: User chips/avatars showing online users
- Each user chip shows: name + colored indicator (matches their cursor color)

**Left Toolbar:**
- Fixed position on left side
- Vertical layout
- Width: ~60-80px
- Buttons (top to bottom):
  1. Rectangle button (icon: ▭)
  2. Circle button (icon: ●)
  3. Text button (icon: T)
  4. Spacer
  5. Delete button (icon: 🗑, disabled when no selection)
- Active state: highlight selected tool
- Hover states for better UX

**Canvas:**
- Background: White or light gray
- Line grid: Subtle gray lines, 50px spacing
- Boundaries: Hard stop at 5000x5000 (cannot pan beyond)
- Center initial view at (0, 0)

**Shapes:**
- All shapes: Blue fill (#3B82F6)
- Rectangles/Circles: 100x100px
- Text: Auto-sized to content

**Selection Indicators:**
- Bounding box around selected shape
- Color: User's assigned color (NOT blue)
- Line width: 2-3px
- Dashed or solid line (your choice)
- If multiple users select same shape: show multiple colored boxes

**Multiplayer Cursors:**
- SVG arrow pointer
- Color: User's assigned color
- Label below/beside arrow showing user name
- Background pill for name label (for readability)
- Update position on jump (no smooth animation for MVP)

**Text Input (during creation):**
- Editable text field appears at click location on canvas
- Konva built-in text editing or HTML input overlay
- On Enter or click away: finalize and create object
- On Escape: cancel creation

**Loading States:**
- Full-screen spinner during authentication
- Canvas spinner during initial object load from Firebase
- Small spinner in header during connection issues

**Color Palette (for users):**
- Assign from predefined set: `['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F38181', '#AA96DA']`
- Deterministic based on userId (consistent colors per user)

---

## Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Canvas Library:** Konva.js with react-konva
- **Styling:** Tailwind CSS
- **State Management:** React hooks + Firebase listeners
- **Utilities:** lodash-es (for throttle)

### Backend
- **Database:** Firebase Realtime Database
- **Authentication:** Firebase Authentication (email/password)
- **Hosting:** Firebase Hosting

---

## Real-Time Sync Specifications

### Cursor Sync: 20 Hz with Compressed Format
```javascript
// Throttle to 20 Hz (every 50ms)
const syncCursor = throttle((x, y) => {
  firebase.ref(`presence/${userId}/c`).set([
    Math.round(x),
    Math.round(y)
  ]);
}, 50);
```

**Performance:**
- Update frequency: 20 Hz (50ms intervals)
- Data format: Compressed array `[x, y]`
- Target latency: <50ms
- Bandwidth: ~400 bytes/second/user

### Object Sync: Immediate
```javascript
// No throttling - sync immediately on user action
function updateObject(objectId, updates) {
  firebase.ref(`canvas/objects/${objectId}`).update(updates);
}

function deleteObject(objectId) {
  firebase.ref(`canvas/objects/${objectId}`).remove();
}
```

**Performance:**
- Update frequency: On-demand (user actions: create, move, delete)
- Data format: Compressed object properties
- Target latency: <100ms
- Bandwidth: Minimal (infrequent updates)

### Data Structure (Compressed)
```javascript
// Presence data
presence/{userId}: {
  n: "John Doe",      // name
  cl: "#FF5733",      // color (for cursor and selection indicators)
  c: [450, 320],      // cursor position [x, y]
  sel: "obj-123"      // currently selected object ID (null if none)
}

// Canvas objects
canvas/objects/{objectId}: {
  t: "r",             // type: "r"=rectangle, "c"=circle, "t"=text
  x: 100,             // x position
  y: 100,             // y position
  w: 100,             // width (fixed 100 for rectangles/circles, auto for text)
  h: 100,             // height (fixed 100 for rectangles/circles, auto for text)
  txt: "Hello"        // text content (text objects only)
}
```

**Notes:**
- Color removed from objects (all shapes are blue #3B82F6)
- Selection state (`sel`) stored in presence for real-time sync
- Text width/height auto-calculated based on content, stored for sync

### Bandwidth Estimates

**5 concurrent users for 1 hour:**
- Cursor updates (20 Hz): ~7.2 MB
- Object updates (avg 2/min create/move/delete): ~0.8 MB
- Selection changes (avg 10/min): ~0.2 MB
- Total: ~8.2 MB/hour

**Free tier capacity:**
- 10 GB download/month
- Supports ~1,220 hours of 5-user collaboration
- More than sufficient for MVP development and testing

---

## Canvas Rendering: Konva.js

### Key Features Used
- Stage and Layer for canvas hierarchy
- Shape primitives (Rect, Circle, Text)
- Transformer for selection indicators
- Built-in drag and drop
- Event handling (click, drag, etc.)

---

## Technical Architecture

### Component Structure
```
src/
├── components/
│   ├── Canvas.tsx          # Main canvas component
│   ├── Toolbar.tsx         # Shape creation tools
│   ├── PresenceBar.tsx     # Online users list
│   ├── Cursor.tsx          # Multiplayer cursor
│   └── Auth.tsx            # Login/signup
├── hooks/
│   ├── useCanvas.ts        # Canvas state management
│   ├── usePresence.ts      # Presence/cursor sync
│   └── useAuth.ts          # Firebase auth
├── services/
│   ├── firebase.ts         # Firebase config
│   └── sync.ts             # Real-time sync logic
└── types/
    └── canvas.ts           # TypeScript types
```

### Data Flow

**Object Creation (Rectangle/Circle):**
1. User clicks shape button in toolbar
2. User clicks on canvas at desired position
3. Generate unique ID (UUID)
4. Create shape with fixed 100x100px dimensions, blue color
5. Render shape immediately (optimistic update)
6. Write to Firebase: `canvas/objects/${id}`
7. Firebase broadcasts to other clients
8. Other clients render the new shape

**Text Creation:**
1. User clicks text button in toolbar
2. User clicks on canvas at desired position
3. Show text input cursor at click location
4. User types text (minimum 1 character required)
5. On Enter or click away → finalize text object
6. Generate unique ID (UUID)
7. Calculate text width/height based on content
8. Write to Firebase with text content and dimensions
9. Firebase broadcasts to other clients
10. Other clients render the text

**Object Movement:**
1. User drags shape → update local position
2. On drag end → write final position to Firebase
3. Firebase broadcasts to other clients
4. Other clients update shape position

**Object Selection:**
1. User clicks shape → select locally
2. Write selection to Firebase: `presence/${userId}/sel`
3. Firebase broadcasts to other clients
4. Other clients show selection indicator with user's color

**Object Deletion:**
1. User presses Delete key or clicks delete button
2. Remove object locally (optimistic update)
3. Call Firebase remove() on object path
4. Firebase broadcasts deletion to other clients
5. Other clients remove shape from canvas

**Cursor Sync:**
1. User moves mouse → throttled update (20 Hz)
2. Write position to Firebase: `presence/${userId}/c`
3. Firebase broadcasts to other clients
4. Other clients render cursor at new position

### Conflict Resolution

**Strategy:** Last-write-wins (acceptable for MVP)

- Objects identified by unique UUIDs
- All updates timestamped
- Firebase handles write ordering
- No complex operational transformation needed

**Edge Cases:**
- Two users create shapes simultaneously → both appear (different IDs)
- Two users move same shape → last write wins
- Two users edit same shape → last write wins
- User disconnects mid-edit → state persists in Firebase
- User deletes shape while another user is editing it → deletion wins

---

## Success Criteria (MVP Checkpoint)

### Must Pass:
- [ ] Two users in different browsers can see each other's cursors moving in real-time
- [ ] User A creates a shape, User B sees it appear instantly (<100ms)
- [ ] User A moves a shape, User B sees it move in real-time
- [ ] User A selects a shape, User B sees selection indicator in User A's color
- [ ] User A deletes a shape, it disappears for User B instantly
- [ ] Refreshing the page preserves all canvas objects
- [ ] 60 FPS maintained during pan/zoom with 10+ objects
- [ ] Users must authenticate to access canvas
- [ ] Online users list displays correctly in top header bar
- [ ] App is deployed and accessible via public URL
- [ ] Text creation works: click and type on canvas
- [ ] Empty text objects are prevented (validation)

### Performance Benchmarks:
- Object sync latency: <100ms
- Cursor sync latency: <50ms
- Canvas FPS: 60 during interactions
- Support 5+ concurrent users without degradation
- Bandwidth usage: <10 MB/hour for 5 users

---

## Build Order (Prioritized)

### Phase 1: Foundation & Basic Auth
1. Create React + TypeScript project with Vite
2. Install dependencies (Konva, Firebase, Tailwind)
3. Initialize Firebase project (Realtime Database + Auth)
4. Set up basic project structure
5. Implement basic Firebase Authentication (email/password)
6. Create login/signup UI (simple, no styling polish yet)
7. Protect canvas route (redirect to login if not authenticated)
8. Create basic canvas with Konva (pan/zoom)

**Deliverable:** Authenticated users can access a canvas that pans and zooms

### Phase 2: Cursor Sync (Critical Path)
1. Connect authenticated user to Firebase presence
2. Implement cursor position tracking on mousemove
3. Write cursor data to Firebase presence with 20 Hz throttle
4. Listen for other users' cursor data
5. Render multiplayer cursors with user name labels
6. Add cursor color generation per user

**Deliverable:** Two authenticated users in different browsers see each other's cursors in real-time

### Phase 3: Object Sync (Core Feature)
1. Create left vertical toolbar with shape buttons (rectangle, circle, text, delete)
2. Implement rectangle/circle creation: click button → click canvas → shape appears
3. Implement text creation: click button → click canvas → type inline → Enter to finish
4. Validate text input (prevent empty text, minimum 1 character)
5. Add drag functionality for shapes (move)
6. Add delete functionality (Delete key AND toolbar button)
7. Implement object selection (click to select, single selection only)
8. Write new objects to Firebase (create with fixed blue color, 100x100 dimensions)
9. Listen for remote object changes (create, update, delete)
10. Render remote objects on local canvas
11. Sync object updates (move) to Firebase
12. Sync selection state to Firebase (`presence/${userId}/sel`)
13. Render selection indicators for all users (colored bounding boxes)
14. Sync object deletion to Firebase

**Deliverable:** Shapes can be created, moved, selected, and deleted by any user with instant sync. Selection state visible to all users.

### Phase 4: Presence & UI Polish
1. Build online users list in top header bar (user chips/avatars)
2. Implement `.onDisconnect()` cleanup for presence
3. Style presence indicators with user colors
4. Polish authentication UI (proper forms, validation)
5. Add loading spinners for:
   - Initial canvas load
   - Authentication
   - Firebase connection states
6. Improve toolbar styling (left vertical bar with clear icons/labels)
7. Add line grid overlay to canvas (subtle background grid)
8. Style selection indicators (colored bounding boxes per user)
9. Polish cursor rendering (arrow SVG with name label)

**Deliverable:** Polished UI with top header (online users), left toolbar, loading states, and clean visual design

### Phase 5: Deploy & Test
1. Set up Firebase Hosting
2. Configure environment variables
3. Build and deploy application
4. Test with 5+ concurrent users
5. Profile performance (FPS, latency)
6. Fix critical bugs
7. Add basic error handling

**Deliverable:** Publicly accessible URL

---

## Testing Strategy

### Manual Testing Checklist

**Multiplayer Sync:**
- [ ] Open app in 2+ browser windows (both authenticated)
- [ ] Create rectangle in window A → appears in window B within 100ms
- [ ] Create circle in window A → appears in window B within 100ms
- [ ] Create text in window A (click and type) → appears in window B
- [ ] Move shape in window A → moves in window B in real-time
- [ ] Select shape in window A → window B shows User A's selection indicator
- [ ] Delete shape in window A (Delete key) → disappears in window B instantly
- [ ] Delete shape in window A (toolbar button) → disappears in window B instantly
- [ ] Move cursor in window A → cursor jumps to new position in window B
- [ ] Refresh window B → all shapes persist

**Conflict Scenarios:**
- [ ] Both users create shapes simultaneously → both appear
- [ ] Both users move different shapes → both move correctly
- [ ] Both users move same shape → last edit wins (no crash)
- [ ] Both users select same shape → both see each other's selection indicators
- [ ] User A deletes shape while User B is moving it → deletion wins (no crash)
- [ ] User A deletes shape while User B has it selected → shape disappears, selection cleared

**Disconnect/Reconnect:**
- [ ] User A creates shapes → User A closes tab → User B still sees shapes
- [ ] User A reconnects → sees all existing shapes
- [ ] User A's cursor disappears from User B when disconnected

**Performance:**
- [ ] Create 50+ shapes → maintain 60 FPS
- [ ] Pan and zoom with 100+ shapes → smooth performance
- [ ] 5 users moving cursors simultaneously → no lag

**Validation & Error Handling:**
- [ ] Cannot create empty text object (must have at least 1 character)
- [ ] Loading spinner shows during initial canvas load
- [ ] Loading spinner shows during authentication
- [ ] Delete button disabled when no shape is selected

**Authentication:**
- [ ] Cannot access canvas without login
- [ ] Login persists across page refresh
- [ ] Each user's cursor shows correct name
- [ ] Online users list shows all connected users in top header bar

---

## Risk Mitigation

### High Risk: Multiplayer sync doesn't work
**Mitigation:** Build cursor sync FIRST before any other features. This validates the entire real-time infrastructure.

### Medium Risk: Canvas performance issues
**Mitigation:** 
- Use Konva's built-in caching
- Profile with React DevTools early
- Limit initial testing to <100 objects

### Medium Risk: Firebase rate limits during testing
**Mitigation:**
- 20 Hz throttling + compressed format
- Monitor bandwidth in Firebase console

### Low Risk: Running out of time
**Mitigation:**
- Follow build order strictly (no feature jumping)
- Skip styling if running behind
- Deploy early and often

---

## Deployment Checklist

### Firebase Setup
- [ ] Create Firebase project
- [ ] Enable Realtime Database
- [ ] Set up security rules (see below)
- [ ] Enable Authentication (Email/Password provider)
- [ ] Enable Firebase Hosting
- [ ] Install Firebase CLI: `npm install -g firebase-tools`

### Security Rules (Realtime Database)
```json
{
  "rules": {
    "canvas": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "presence": {
      ".read": "auth != null",
      "$userId": {
        ".write": "$userId === auth.uid"
      }
    }
  }
}
```

**Note:** These rules allow any authenticated user to read/write the entire canvas. This is appropriate for MVP with a single shared canvas. Post-MVP, implement per-canvas access control with ownership/permissions.

### Build & Deploy
```bash
# Build React app
npm run build

# Initialize Firebase hosting
firebase init hosting

# Deploy
firebase deploy
```

### Environment Variables
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_CANVAS_ID=default-canvas
```

**Note:** `VITE_CANVAS_ID` is hardcoded to a single value for MVP. All users share one canvas workspace. Post-MVP, implement dynamic canvas creation with unique IDs per project.

---

## Success Metrics

### Primary Metrics (Must Achieve)
- **Sync Latency:** <100ms for objects, <50ms for cursors
- **Frame Rate:** 60 FPS during all interactions
- **Concurrent Users:** 5+ without degradation
- **Uptime:** Deployed app accessible 24/7
- **Auth Success:** 100% of users can log in and access canvas

---

## Resources & References

### Documentation
- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [Konva.js Documentation](https://konvajs.org/docs/)
- [React-Konva Examples](https://konvajs.org/docs/react/)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)

---

## Appendix A: Code Snippets

### Firebase Initialization
```typescript
// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
```

### Cursor Sync Hook
```typescript
// src/hooks/usePresence.ts
import { useEffect } from 'react';
import { ref, set, onValue, onDisconnect } from 'firebase/database';
import { db } from '../services/firebase';
import { throttle } from 'lodash-es';

export function usePresence(userId: string, userName: string) {
  useEffect(() => {
    const presenceRef = ref(db, `presence/${userId}`);
    
    // Set initial presence
    set(presenceRef, {
      n: userName,
      cl: generateColor(userId),
    });
    
    // Clean up on disconnect
    onDisconnect(presenceRef).remove();
    
    return () => {
      set(presenceRef, null);
    };
  }, [userId, userName]);
  
  // Throttled cursor sync at 20 Hz
  const syncCursor = throttle((x: number, y: number) => {
    const cursorRef = ref(db, `presence/${userId}/c`);
    set(cursorRef, [Math.round(x), Math.round(y)]);
  }, 50);
  
  return { syncCursor };
}

function generateColor(userId: string): string {
  // Generate consistent color from userId
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
  const index = userId.charCodeAt(0) % colors.length;
  return colors[index];
}
```

### Object Sync
```typescript
// src/hooks/useCanvas.ts
import { ref, set, update, remove, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { v4 as uuidv4 } from 'uuid';

export function useCanvas(canvasId: string, userId: string) {
  // Create rectangle or circle (fixed 100x100, blue)
  const createShape = (type: 'r' | 'c', x: number, y: number) => {
    const id = uuidv4();
    const shapeRef = ref(db, `canvas/${canvasId}/objects/${id}`);
    
    set(shapeRef, {
      t: type,
      x: Math.round(x),
      y: Math.round(y),
      w: 100,
      h: 100,
    });
    
    return id;
  };
  
  // Create text object (auto-size based on content)
  const createText = (text: string, x: number, y: number, width: number, height: number) => {
    if (text.trim().length === 0) return null; // Validation
    
    const id = uuidv4();
    const textRef = ref(db, `canvas/${canvasId}/objects/${id}`);
    
    set(textRef, {
      t: 't',
      x: Math.round(x),
      y: Math.round(y),
      w: width,
      h: height,
      txt: text,
    });
    
    return id;
  };
  
  const updateShape = (id: string, updates: any) => {
    const shapeRef = ref(db, `canvas/${canvasId}/objects/${id}`);
    update(shapeRef, updates);
  };
  
  const deleteShape = (id: string) => {
    const shapeRef = ref(db, `canvas/${canvasId}/objects/${id}`);
    remove(shapeRef);
  };
  
  const setSelection = (objectId: string | null) => {
    const selectionRef = ref(db, `presence/${userId}/sel`);
    set(selectionRef, objectId);
  };
  
  return { createShape, createText, updateShape, deleteShape, setSelection };
}
```

---

## Appendix B: MVP Scope Summary

### ✅ What's IN Scope (Must Build)

**Canvas:**
- 5000x5000px with hard boundaries
- Pan (drag) and zoom (mouse wheel)
- Line grid overlay (50px spacing)
- Empty on first load

**Shapes:**
- 3 types: Rectangle (100x100), Circle (100x100), Text (auto-size)
- Fixed blue color (#3B82F6)
- Create: Click toolbar button → click canvas
- Text: Click and type inline, Enter to finish
- Move: Drag selected shape
- Delete: Delete key OR toolbar button
- Select: Click to select (single selection only)

**Real-Time Sync:**
- Cursor positions (20 Hz, jump to position)
- Object create/move/delete
- Selection state (who has what selected)
- All synced <100ms

**UI:**
- Top header: Online users list
- Left toolbar: Rectangle, Circle, Text, Delete buttons
- Canvas: Shapes, cursors, selection indicators, grid

**Auth:**
- Email/password login
- Required to access canvas
- All authenticated users can edit

**Validation:**
- No empty text objects (min 1 character)
- Delete button disabled when nothing selected

**Loading States:**
- Spinners for auth, canvas load, connection issues

---

### ❌ What's OUT of Scope (Explicitly Deferred)

**NOT building for MVP:**
- Resize, rotation, or transform tools
- Color picker or customization
- Text editing after creation
- Multi-select, copy/paste, undo/redo
- Properties panel or object settings
- Multiple canvases/projects
- Export (PNG/SVG/PDF)
- Comments, annotations, or chat
- User permissions or access control
- Canvas ownership model
- Version history
- **All AI features**

---

## Appendix C: Troubleshooting Guide

### Issue: Cursors not syncing
**Check:**
1. Firebase security rules allow writes to `presence/${userId}`
2. Throttle function is imported correctly from lodash-es
3. User is authenticated before writing to Firebase
4. Firebase Realtime Database is enabled (not Firestore)

### Issue: Objects not appearing for other users
**Check:**
1. Object writes are going to correct path: `canvas/objects/${id}`
2. Other clients are listening with `onValue` listener
3. Firebase security rules allow reads/writes to `canvas`
4. Network tab shows Firebase requests succeeding

### Issue: Poor performance / low FPS
**Check:**
1. Too many objects on canvas (>500)
2. Not using Konva layers/caching
3. Re-rendering entire canvas on every update
4. Not rounding cursor positions (causing sub-pixel renders)

### Issue: Firebase quota exceeded
**Check:**
1. Cursor updates are throttled to 20 Hz (not faster)
2. Using compressed data format (arrays, short keys)
3. Firebase console → Usage tab to see actual bandwidth
4. Consider upgrading to Blaze plan (~$1-5 for MVP period)