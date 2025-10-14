# CollabCanvas MVP - Task List

## Overview
This task list breaks down the MVP into discrete project requirements, each with specific subtasks. Complete all subtasks within a requirement before committing to GitHub.

**Note:** Tests are included for critical functionality to validate that code generation is correct.

---

## Complete Project File Structure

```
collabcanvas/
├── .env.example
├── .env.local (gitignored)
├── .gitignore
├── .firebaserc
├── firebase.json
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── README.md
├── TESTING.md
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── Canvas.tsx
│   │   ├── Toolbar.tsx
│   │   ├── Rectangle.tsx
│   │   ├── Circle.tsx
│   │   ├── TextShape.tsx
│   │   ├── Cursor.tsx
│   │   ├── PresenceBar.tsx
│   │   ├── Login.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ErrorBoundary.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCanvas.ts
│   │   └── usePresence.ts
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── auth.ts
│   │   └── canvasSync.ts
│   ├── types/
│   │   ├── canvas.ts
│   │   └── firebase.ts
│   ├── utils/
│   │   ├── testFirebase.ts
│   │   └── performance.ts
│   └── pages/
│       └── CanvasPage.tsx
└── tests/
    ├── setup.ts
    ├── mocks/
    │   └── firebase.ts
    ├── unit/
    │   ├── hooks/
    │   │   └── useCanvas.test.ts
    │   ├── services/
    │   │   ├── auth.test.ts
    │   │   └── canvasSync.test.ts
    │   └── utils/
    │       └── throttle.test.ts
    └── integration/
        ├── authentication.test.tsx
        └── shapeCreation.test.tsx
```

---

## PR-1: Project Setup & Configuration

**Commit Message:** `feat: initialize project with React, TypeScript, and dependencies`

### Subtasks

#### 1.1 Initialize React + TypeScript Project
**Commands:**
```bash
npm create vite@latest collabcanvas -- --template react-ts
cd collabcanvas
npm install
```

**Files Created:**
- `package.json`
- `tsconfig.json`
- `tsconfig.node.json`
- `vite.config.ts`
- `index.html`
- `.gitignore`
- `README.md`
- `src/main.tsx`
- `src/App.tsx`
- `src/App.css`
- `src/vite-env.d.ts`

#### 1.2 Install Core Dependencies
**Commands:**
```bash
npm install react-konva konva
npm install firebase
npm install lodash-es
npm install uuid
npm install -D @types/lodash-es @types/uuid
```

**Files Modified:**
- `package.json` (dependencies added)

#### 1.3 Install Testing Dependencies
**Commands:**
```bash
npm install -D vitest @vitest/ui
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom
```

**Files Created:**
- `vitest.config.ts` (Vitest configuration)
- `tests/setup.ts` (test setup file)

**Files Modified:**
- `package.json` (add test scripts: "test", "test:ui", "test:coverage")

#### 1.4 Install and Configure Tailwind CSS
**Commands:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Files Created:**
- `tailwind.config.js`
- `postcss.config.js`

**Files Modified:**
- `src/index.css` (add Tailwind directives)

#### 1.5 Create Project Directory Structure
**Commands:**
```bash
mkdir -p src/components src/hooks src/services src/types src/utils src/pages
mkdir -p tests/unit/hooks tests/unit/services tests/unit/utils tests/integration tests/mocks
```

**Directories Created:**
- `src/components/`
- `src/hooks/`
- `src/services/`
- `src/types/`
- `src/utils/`
- `src/pages/`
- `tests/unit/hooks/`
- `tests/unit/services/`
- `tests/unit/utils/`
- `tests/integration/`
- `tests/mocks/`

#### 1.6 Set Up Environment Variables
**Files Created:**
- `.env.example` (template with Firebase config variables)
- `.env.local` (actual credentials, gitignored)

**Files Modified:**
- `.gitignore` (add `.env.local`)

#### 1.7 Update .gitignore
**Files Modified:**
- `.gitignore` (add Firebase-specific ignores: `.firebase/`, `.firebaserc`, `firebase-debug.log`)

#### 1.8 Create Firebase Mock
**Files Created:**
- `tests/mocks/firebase.ts` (mock Firebase functions for testing)

---

## PR-2: Firebase Configuration

**Commit Message:** `feat: configure Firebase Realtime Database and Authentication`

### Subtasks

#### 2.1 Create Firebase Project
**External Setup (Firebase Console):**
1. Create new Firebase project: "collabcanvas"
2. Enable Firebase Realtime Database
3. Enable Firebase Authentication (Email/Password provider)
4. Copy Firebase config credentials

#### 2.2 Configure Firebase in Application
**Files Created:**
- `src/services/firebase.ts` (Firebase initialization, export db and auth)
- `src/types/firebase.ts` (TypeScript interfaces: CanvasObject, Presence, User)

#### 2.3 Set Up Firebase Security Rules
**External Setup (Firebase Console):**
- Navigate to Realtime Database → Rules tab
- Set up rules for `canvas` and `presence` paths with auth requirements

#### 2.4 Test Firebase Connection
**Files Created:**
- `src/utils/testFirebase.ts` (helper function to test connection)

---

## PR-3: Basic Canvas with Pan/Zoom

**Commit Message:** `feat: implement basic canvas with pan and zoom functionality`

### Subtasks

#### 3.1 Create TypeScript Types for Canvas
**Files Created:**
- `src/types/canvas.ts` (interfaces: Position, ViewportTransform, Shape)

#### 3.2 Create Canvas Component
**Files Created:**
- `src/components/Canvas.tsx` (Konva Stage with pan/zoom, wheel handler, drag handler)

#### 3.3 Create Canvas Page
**Files Created:**
- `src/pages/CanvasPage.tsx` (wrapper for Canvas component)

#### 3.4 Update App Component
**Files Modified:**
- `src/App.tsx` (import and render CanvasPage)

#### 3.5 Add Line Grid Background (Required)
**Files Modified:**
- `src/components/Canvas.tsx` (add line grid overlay with 50px spacing for visual reference)

**Requirements:**
- Subtle gray lines
- 50px spacing
- Should render behind all shapes
- Hard boundaries at 5000x5000px (cannot pan beyond)

---

## PR-4: Cursor Sync (Multiplayer Cursors)

**Commit Message:** `feat: implement real-time cursor synchronization`

### Subtasks

#### 4.1 Create Presence Hook
**Files Created:**
- `src/hooks/usePresence.ts` (hook for cursor sync with 20 Hz throttle, presence management, color generation, selection state)

**Requirements:**
- Throttle cursor updates to 20 Hz (50ms intervals)
- Store cursor position, user name, user color, and selected object ID
- Jump to new cursor position (no interpolation/animation)
- Generate consistent color per user from predefined palette
- Clean up presence on disconnect (onDisconnect)

#### 4.2 Unit Tests for Throttle Function
**Files Created:**
- `tests/unit/utils/throttle.test.ts` (verify throttle works at 20 Hz / 50ms)

**Tests to verify:**
- Cursor updates are throttled to exactly 50ms intervals
- Rapid calls don't exceed throttle limit
- Throttle releases after idle period

#### 4.3 Create Cursor Component
**Files Created:**
- `src/components/Cursor.tsx` (Konva Group with arrow SVG and Text for cursor + name label)

**Requirements:**
- Arrow pointer shape (not circle)
- User name label below/beside arrow
- Background pill/box for name label (for readability)
- Color matches user's assigned color
- Position jumps to new coordinates (no smooth interpolation)

#### 4.4 Create Auth Hook (Basic)
**Files Created:**
- `src/hooks/useAuth.ts` (hook for Firebase auth state, returns user and loading)

#### 4.5 Update Canvas to Include Cursors
**Files Modified:**
- `src/components/Canvas.tsx` (integrate usePresence, useAuth, add mouse move handler, render other users' cursors)

---

## PR-5: Authentication System

**Commit Message:** `feat: implement user authentication with login/signup`

### Subtasks

#### 5.1 Create Auth Service Functions
**Files Created:**
- `src/services/auth.ts` (functions: signUp, signIn, logOut)

#### 5.2 Unit Tests for Auth Service
**Files Created:**
- `tests/unit/services/auth.test.ts` (test auth functions with mocked Firebase)

**Tests to verify:**
- `signUp()` calls Firebase createUserWithEmailAndPassword correctly
- `signUp()` sets display name via updateProfile
- `signIn()` calls Firebase signInWithEmailAndPassword correctly
- `logOut()` calls Firebase signOut correctly
- All functions handle errors properly
- Return values match expected types

#### 5.3 Create Login Component
**Files Created:**
- `src/components/Login.tsx` (form with email/password, toggle between login/signup)

#### 5.4 Create Protected Route Component
**Files Created:**
- `src/components/ProtectedRoute.tsx` (wrapper that shows Login if not authenticated)

#### 5.5 Integration Tests for Authentication
**Files Created:**
- `tests/integration/authentication.test.tsx` (test complete auth flow)

**Tests to verify:**
- Login form renders with email and password fields
- Toggle button switches between login/signup modes
- Signup mode shows display name field
- Form validation works (required fields, min password length)
- Error messages display correctly
- ProtectedRoute shows login when not authenticated
- ProtectedRoute shows children when authenticated

#### 5.6 Update App to Use Protected Route
**Files Modified:**
- `src/App.tsx` (wrap CanvasPage with ProtectedRoute)

#### 5.7 Create Presence Bar Component (Top Header)
**Files Created:**
- `src/components/PresenceBar.tsx` (top header bar with online users list, logout button)

**Requirements:**
- Fixed position at top of page
- Show user chips/avatars for all online users
- Each chip shows: user name + colored indicator (matches cursor color)
- Dark/neutral background
- Logout button on right side

#### 5.8 Add Presence Bar to Canvas Page
**Files Modified:**
- `src/pages/CanvasPage.tsx` (add PresenceBar at top, layout with Canvas below)
- `src/components/Canvas.tsx` (accept onPresenceUpdate prop)

#### 5.9 Add Loading Spinners
**Files Modified:**
- `src/components/Login.tsx` (add loading spinner during authentication)
- `src/components/Canvas.tsx` (add loading spinner during initial canvas load from Firebase)

---

## PR-6: Shape Creation & Toolbar

**Commit Message:** `feat: add shape creation toolbar with rectangle, circle, text, and delete`

### Subtasks

#### 6.1 Create Toolbar Component (Left Vertical)
**Files Created:**
- `src/components/Toolbar.tsx` (left vertical toolbar with shape and delete buttons)

**Requirements:**
- Fixed position on left side
- Vertical layout, width ~60-80px
- Buttons (top to bottom):
  1. Rectangle button (icon: ▭)
  2. Circle button (icon: ●)
  3. Text button (icon: T)
  4. Spacer
  5. Delete button (icon: 🗑, disabled when no selection)
- Show active state for selected tool
- Hover states for better UX

#### 6.2 Create Shape Components
**Files Created:**
- `src/components/Rectangle.tsx` (Konva Rect with drag and select, NO transformer/resize)
- `src/components/Circle.tsx` (Konva Circle with drag and select, NO transformer/resize)
- `src/components/TextShape.tsx` (Konva Text with drag and select, NO transformer/resize)

**Requirements:**
- All shapes: Fixed blue color (#3B82F6)
- Rectangles/Circles: Fixed 100x100px dimensions
- Text: Auto-sized to content
- Selection indicators: Bounding box in user's color (not blue)
- Show multiple selection indicators if multiple users select same shape
- Draggable
- Click to select

#### 6.3 Create Canvas State Hook
**Files Created:**
- `src/hooks/useCanvas.ts` (hook for shapes state, selectedId, addShape, updateShape, deleteShape, setSelection)

**Requirements:**
- `addShape()` - creates rectangle or circle with fixed 100x100px dimensions
- `addText()` - separate function for text creation with content and auto-calculated dimensions
- All shapes: Fixed blue color (#3B82F6) - NO color property stored
- Selection state synced via presence (not stored in shape object)
- Validate text: prevent empty text objects (min 1 character)

#### 6.4 Unit Tests for Canvas Hook
**Files Created:**
- `tests/unit/hooks/useCanvas.test.ts` (test shape management logic)

**Tests to verify:**
- `addShape('rectangle')` creates shape with w=100, h=100
- `addShape('circle')` creates shape with w=100, h=100 (diameter, not radius)
- `addText()` validates text (rejects empty string)
- `addText()` stores text content and calculated width/height
- No color property stored in shape objects (all are blue)
- Each shape gets unique UUID
- `updateShape()` updates correct shape by id (only position for MVP)
- `deleteShape()` removes shape and clears selection
- `setSelection()` updates presence with selected object ID
- Shapes array updates correctly after operations

#### 6.5 Integration Tests for Shape Creation
**Files Created:**
- `tests/integration/shapeCreation.test.tsx` (test UI and shape creation flow)

**Tests to verify:**
- Toolbar renders on left side with all tool buttons
- Clicking tool button selects that tool
- Selected tool button shows active state
- Canvas click creates rectangle (100x100, blue)
- Canvas click creates circle (100x100, blue)
- Text creation: click shows input field, typing + Enter creates text
- Text validation: empty text is rejected
- Delete button is disabled when no selection
- Delete button is enabled when shape is selected
- Created shapes appear with correct blue color
- Selection indicators show in user's color (not blue)

#### 6.6 Update Canvas Component with Shape Creation
**Files Modified:**
- `src/components/Canvas.tsx` (add useCanvas hook, tool state, click handler for shape creation, render shapes)

**Requirements:**
- Rectangle/Circle: Click canvas → create immediately at click position
- Text: Click canvas → show inline text input → type → Enter to create
- Validate text input (prevent empty text)
- Update selection state in presence when shape is clicked
- Render selection indicators for all users (colored bounding boxes)

#### 6.7 Add Toolbar to Canvas Page
**Files Modified:**
- `src/pages/CanvasPage.tsx` (add Toolbar on left side, Canvas on right with proper layout)

---

## PR-7: Real-Time Object Synchronization

**Commit Message:** `feat: implement real-time object sync and selection state across all users`

### Subtasks

#### 7.1 Create Firebase Sync Service
**Files Created:**
- `src/services/canvasSync.ts` (functions: syncCreateShape, syncUpdateShape, syncDeleteShape, syncSelection, subscribeToCanvas with data compression/decompression)

**Requirements:**
- Compress data for bandwidth efficiency
- NO color property (all shapes are blue #3B82F6)
- Store selection state in presence (not in shape object)
- Sync selection changes to all users

#### 7.2 Unit Tests for Canvas Sync Service
**Files Created:**
- `tests/unit/services/canvasSync.test.ts` (test sync functions and data compression)

**Tests to verify:**
- `syncCreateShape()` compresses data correctly (t, x, y, w, h keys - NO color)
- Rectangle data includes t='r', x, y, w=100, h=100
- Circle data includes t='c', x, y, w=100, h=100 (diameter, not radius)
- Text data includes t='t', x, y, w, h, txt
- NO color property stored (all shapes blue)
- Coordinates are rounded to integers
- `syncUpdateShape()` only sends changed properties (position only for MVP)
- `syncSelection()` writes to presence/${userId}/sel
- `subscribeToCanvas()` decompresses data correctly
- Short keys convert back to full property names
- Type codes convert back to full type names (r→rectangle, c→circle, t→text)

#### 7.3 Update Canvas Hook with Firebase Sync
**Files Modified:**
- `src/hooks/useCanvas.ts` (integrate Firebase sync calls in addShape, updateShape, deleteShape, setSelection; add subscription effect)

**Requirements:**
- Sync object create/move/delete to Firebase
- Sync selection state to presence
- Subscribe to object changes (create, update, delete)
- Subscribe to selection changes from other users
- Handle deleted objects gracefully (clear selection if selected object is deleted)

#### 7.4 Add Delete Functionality (Keyboard + Toolbar)
**Files Modified:**
- `src/components/Canvas.tsx` (add keyboard event listener for Delete/Backspace keys)
- `src/components/Toolbar.tsx` (delete button click handler)

**Requirements:**
- Delete key: Delete selected shape
- Backspace key: Delete selected shape  
- Toolbar delete button: Delete selected shape
- Clear selection after deletion
- Sync deletion to all users
- Disable toolbar delete button when no selection

---

## PR-8: Firebase Hosting Deployment

**Commit Message:** `feat: configure Firebase Hosting and deploy application`

### Subtasks

#### 8.1 Install Firebase CLI
**Commands:**
```bash
npm install -g firebase-tools
firebase login
```

#### 8.2 Initialize Firebase Hosting
**Commands:**
```bash
firebase init hosting
```

**Files Created:**
- `firebase.json`
- `.firebaserc`

#### 8.3 Update Build Scripts
**Files Modified:**
- `package.json` (add deploy script)

#### 8.4 Build and Deploy
**Commands:**
```bash
npm run build
firebase deploy --only hosting
```

#### 8.5 Update README with Deployment Info
**Files Modified:**
- `README.md` (add deployment URL and instructions)

---

## PR-9: Testing & Bug Fixes

**Commit Message:** `test: validate MVP requirements and fix critical bugs`

### Subtasks

#### 9.1 Create Testing Checklist Document
**Files Created:**
- `TESTING.md` (comprehensive checklist for all MVP features)

#### 9.2 Add Error Boundaries
**Files Created:**
- `src/components/ErrorBoundary.tsx` (React error boundary component)

#### 9.3 Wrap App in Error Boundary
**Files Modified:**
- `src/main.tsx` (wrap App with ErrorBoundary)

#### 9.4 Verify Loading States
**Files to Verify:**
- `src/components/Login.tsx` (loading spinner during authentication - should be in PR-5)
- `src/components/Canvas.tsx` (loading spinner during initial canvas load - should be in PR-5)

**Requirements:**
- Full-screen spinner during authentication
- Canvas area spinner during object load from Firebase
- Small spinner in header during connection issues (optional)

#### 9.5 Verify Validations
**Files to Verify:**
- Text creation: Empty text objects are prevented (min 1 character)
- Delete button: Disabled when no shape is selected
- Delete button: Enabled when shape is selected
- Canvas boundaries: Cannot pan beyond 5000x5000px

#### 9.6 Performance Monitoring Setup
**Files Created:**
- `src/utils/performance.ts` (FPS measurement utility)

#### 9.7 Run All Unit and Integration Tests
**Commands:**
```bash
npm run test
npm run test:coverage
```

**Action Items:**
- Verify all tests pass
- Check test coverage is >70% for critical files
- Fix any failing tests
- Document any skipped tests

#### 9.8 Manual Testing Session
**Actions:**
1. Test all items in TESTING.md checklist
2. Document bugs found
3. Fix critical bugs
4. Retest after fixes
5. Update TESTING.md with results

**Critical items to verify:**
- Cursor sync (20 Hz, jump to position)
- Object sync (create, move, delete) <100ms
- Selection state sync (colored bounding boxes for all users)
- Text creation with inline typing and validation
- Delete via keyboard AND toolbar button
- Delete button disabled when no selection
- Loading spinners show properly
- Canvas boundaries (5000x5000 hard limit)
- Line grid overlay (50px spacing)
- Top header with online users
- Left vertical toolbar

---

## PR-10: Documentation & Final Polish

**Commit Message:** `docs: add comprehensive README and architecture documentation`

### Subtasks

#### 10.1 Update README.md
**Files Modified:**
- `README.md` (add complete documentation: features, setup, architecture, deployment, tech stack)

#### 10.2 Add Architecture Diagram
**Files Modified:**
- `README.md` (add data flow and component structure explanations)

#### 10.3 Document Firebase Security Rules
**Files Modified:**
- `README.md` (add security rules configuration)

#### 10.4 Add Performance Benchmarks
**Files Modified:**
- `README.md` (add performance targets and results)

#### 10.5 Document Test Coverage
**Files Modified:**
- `README.md` (add section on running tests and expected coverage)

#### 10.6 Final Code Review
**Actions:**
1. Review all code for consistency
2. Remove console.logs
3. Clean up unused imports
4. Verify all TypeScript types
5. Check for any hardcoded values that should be in config
6. Run final test suite

---

## MVP Completion Checklist

After completing all PRs, verify:

- [ ] All 10 PRs committed to GitHub
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Test coverage >70% on critical files
- [ ] Application deployed and accessible via public URL
- [ ] All items in TESTING.md pass
- [ ] README.md is complete and accurate
- [ ] No critical bugs remain
- [ ] Performance targets met (60 FPS, <100ms sync)
- [ ] 5+ users can collaborate simultaneously
- [ ] Firebase security rules properly configured

**MVP-Specific Verifications:**
- [ ] All shapes are fixed blue color (#3B82F6)
- [ ] Rectangles and circles are fixed 100x100px
- [ ] Text objects auto-size to content
- [ ] Selection state syncs across all users (colored bounding boxes)
- [ ] Empty text objects are prevented (validation)
- [ ] Delete works via keyboard (Delete key) AND toolbar button
- [ ] Delete button disabled when no selection
- [ ] Cursor positions jump (no smooth interpolation)
- [ ] Line grid overlay visible (50px spacing)
- [ ] Canvas has hard 5000x5000 boundaries
- [ ] Top header shows online users
- [ ] Left vertical toolbar with shape buttons
- [ ] Loading spinners for auth and canvas load
- [ ] NO resize functionality (intentionally removed)
- [ ] NO color picker (intentionally removed)
- [ ] NO text editing after creation (intentionally removed)

---

## Test Summary

### Unit Tests (5 test files)
1. **tests/unit/utils/throttle.test.ts** - Validates cursor throttling at 20 Hz
2. **tests/unit/services/auth.test.ts** - Validates auth service functions
3. **tests/unit/hooks/useCanvas.test.ts** - Validates shape management logic
4. **tests/unit/services/canvasSync.test.ts** - Validates data compression/sync

### Integration Tests (2 test files)
1. **tests/integration/authentication.test.tsx** - Validates complete auth flow
2. **tests/integration/shapeCreation.test.tsx** - Validates shape creation UI flow

### Why These Tests?
- **Auth Service**: Critical for security, needs to call Firebase correctly
- **Canvas Hook**: Core state management, validates shape CRUD operations
- **Canvas Sync**: Validates data compression (saves bandwidth), ensures sync works
- **Throttle**: Performance-critical, validates 20 Hz requirement
- **Auth Flow**: Ensures login/signup UI works end-to-end
- **Shape Creation**: Validates toolbar → canvas interaction

---

## Notes

- Each PR should be fully functional and tested before committing
- Run unit tests after implementing each feature
- Run integration tests after completing a full flow
- Commit messages follow conventional commit format
- Test in multiple browsers after each major feature
- Monitor Firebase usage during development
- Keep `.env.local` secure and never commit to git

---

## Key MVP Simplifications (Updated Scope)

These features were **intentionally removed** to simplify the MVP:

### Removed Features
- ❌ **Resize functionality** - All shapes fixed size (100x100px)
- ❌ **Konva Transformers** - No corner handles, no resize/rotate
- ❌ **Color picker** - All shapes are fixed blue (#3B82F6)
- ❌ **Color property in data model** - No 'c' field in Firebase
- ❌ **Text editing after creation** - Text is create-once only
- ❌ **Properties panel** - No UI for editing shape properties

### New/Clarified Requirements
- ✅ **Selection state sync** - Store in presence, show colored bounding boxes
- ✅ **Text creation** - Click and type inline on canvas, Enter to finish
- ✅ **Text validation** - Prevent empty text objects (min 1 character)
- ✅ **Delete options** - Both Delete key AND toolbar button
- ✅ **UI layout** - Top header (users) + left toolbar (tools) + canvas
- ✅ **Line grid** - 50px spacing, required (not optional)
- ✅ **Canvas boundaries** - Hard 5000x5000 limit
- ✅ **Cursor rendering** - Arrow pointer, jump to position (no interpolation)
- ✅ **Loading states** - Spinners for auth and canvas load
- ✅ **Delete button state** - Disabled when no selection

### Data Model Changes
**Before:**
```javascript
canvas/objects/{id}: { t, x, y, w, h, c }
presence/{userId}: { n, cl, c }
```

**After (Simplified):**
```javascript
canvas/objects/{id}: { t, x, y, w, h, txt? }  // NO color
presence/{userId}: { n, cl, c, sel }           // ADDED selection state
```

### Implementation Notes
- Circle dimensions stored as w/h (100x100), not radius
- Text type code is 't' not 'x'
- All shapes render in blue (#3B82F6) - hardcoded in components
- Selection indicators use user's color from presence
- Multiple users can select same shape (show all selection indicators)