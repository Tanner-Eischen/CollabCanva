# CollabCanvas MVP - Testing Checklist

This document provides a comprehensive testing checklist for validating all MVP features.

## Test Environment Setup

- [ ] Application running locally (`npm run dev`)
- [ ] Firebase Realtime Database connected
- [ ] Firebase Authentication working
- [ ] Multiple browser tabs/windows available for multi-user testing

---

## 1. Authentication Tests

### 1.1 Google Sign-In
- [ ] Login page displays on initial load
- [ ] Google Sign-In button is visible and functional
- [ ] Successfully authenticates with Google account
- [ ] Loading spinner shows during authentication
- [ ] Redirects to canvas after successful login
- [ ] User email/name displays in presence bar after login

### 1.2 Session Persistence
- [ ] User stays logged in after page refresh
- [ ] Session persists across browser restarts (if "Remember me")
- [ ] Can sign out successfully
- [ ] Returns to login page after sign out

---

## 2. Canvas Basic Functionality

### 2.1 Canvas Initialization
- [ ] Canvas loads successfully
- [ ] Grid overlay displays (50px spacing)
- [ ] Canvas boundaries are 5000x5000px
- [ ] Initial viewport is centered at (0, 0)
- [ ] No console errors on load

### 2.2 Pan Functionality
- [ ] Can pan canvas by dragging (Select tool active)
- [ ] Pan is smooth and responsive
- [ ] Cannot pan beyond canvas boundaries
- [ ] Hard boundaries enforced at edges
- [ ] Viewport position updates correctly

### 2.3 Zoom Functionality
- [ ] Mouse wheel zooms in/out
- [ ] Zoom centers on mouse cursor position
- [ ] Zoom limits respected (min/max scale)
- [ ] Grid scales correctly with zoom
- [ ] Shapes scale correctly with zoom
- [ ] Zoom is smooth and responsive

---

## 3. Shape Creation

### 3.1 Rectangle Creation
- [ ] Select rectangle tool from toolbar
- [ ] Click on canvas to create rectangle
- [ ] Rectangle appears at click position
- [ ] Rectangle is 100x100px
- [ ] Rectangle is blue (#3B82F6)
- [ ] Can create multiple rectangles
- [ ] Rectangle syncs to Firebase immediately
- [ ] Other users see new rectangle within 100ms

### 3.2 Circle Creation
- [ ] Select circle tool from toolbar
- [ ] Click on canvas to create circle
- [ ] Circle appears at click position
- [ ] Circle is 100x100px (diameter)
- [ ] Circle is blue (#3B82F6)
- [ ] Can create multiple circles
- [ ] Circle syncs to Firebase immediately
- [ ] Other users see new circle within 100ms

### 3.3 Text Creation
- [ ] Select text tool from toolbar
- [ ] Click on canvas to open text input
- [ ] Text input appears at click position
- [ ] Can type text into input
- [ ] Press Enter to create text object
- [ ] Press Escape to cancel text creation
- [ ] Click outside input to cancel
- [ ] Empty text objects are prevented (validation)
- [ ] Text appears with correct content
- [ ] Text object syncs to Firebase immediately
- [ ] Other users see new text within 100ms
- [ ] Text cannot be edited after creation (MVP constraint)

---

## 4. Shape Manipulation

### 4.1 Shape Selection
- [ ] Select tool allows clicking shapes
- [ ] Clicking shape selects it
- [ ] Selected shape shows blue bounding box
- [ ] Only one shape can be selected at a time
- [ ] Clicking canvas background deselects
- [ ] Selection state syncs to Firebase
- [ ] Other users see selection as colored bounding box

### 4.2 Shape Dragging
- [ ] Can drag selected shape
- [ ] Drag is smooth and responsive
- [ ] Shape position updates in real-time
- [ ] Position syncs to Firebase during drag
- [ ] Other users see drag movement within 100ms
- [ ] Cannot drag shape outside canvas boundaries
- [ ] Shape snaps back if dragged beyond boundaries

### 4.3 Shape Deletion
- [ ] Select shape and press Delete key
- [ ] Select shape and press Backspace key
- [ ] Select shape and click Delete button in toolbar
- [ ] Shape is removed from canvas
- [ ] Deletion syncs to Firebase immediately
- [ ] Other users see deletion within 100ms
- [ ] Delete button is disabled when no selection
- [ ] Delete button is enabled when shape is selected

---

## 5. Real-Time Collaboration

### 5.1 Cursor Synchronization
- [ ] Open app in two browser tabs/windows
- [ ] Login with different accounts in each
- [ ] See other user's cursor position
- [ ] Cursor updates at ~20Hz (50ms intervals)
- [ ] Cursor "jumps" to position (no interpolation)
- [ ] Cursor shows user name label
- [ ] Cursor shows user color
- [ ] Cursor color is consistent per user
- [ ] Cursor disappears when user leaves

### 5.2 Object Synchronization
- [ ] Create object in tab 1
- [ ] Object appears in tab 2 within 100ms
- [ ] Move object in tab 1
- [ ] Movement reflects in tab 2 in real-time
- [ ] Delete object in tab 1
- [ ] Deletion reflects in tab 2 within 100ms
- [ ] No duplicate objects appear
- [ ] No ghost objects remain after deletion

### 5.3 Selection Synchronization
- [ ] Select shape in tab 1
- [ ] Selection bounding box appears in tab 2
- [ ] Bounding box uses user's unique color
- [ ] Multiple users can have different selections
- [ ] Deselection syncs to other users
- [ ] Selection indicator disappears when user leaves

### 5.4 Presence Management
- [ ] User appears in presence bar when joining
- [ ] User name/email displays correctly
- [ ] User count is accurate
- [ ] User disappears from presence bar when leaving
- [ ] User status updates in real-time
- [ ] No duplicate users in presence bar

---

## 6. UI/UX Tests

### 6.1 Toolbar
- [ ] Toolbar displays on left side
- [ ] All tool buttons are visible
- [ ] Tool buttons have icons
- [ ] Select tool button
- [ ] Rectangle tool button
- [ ] Circle tool button
- [ ] Text tool button
- [ ] Delete button (only enabled with selection)
- [ ] Selected tool is highlighted
- [ ] Tool selection changes cursor/behavior

### 6.2 Presence Bar
- [ ] Presence bar displays at top
- [ ] Shows current user
- [ ] Shows other online users
- [ ] User count is accurate
- [ ] Email/name displays for each user
- [ ] Layout is clean and readable

### 6.3 Loading States
- [ ] Loading spinner during initial authentication
- [ ] Loading spinner is full-screen
- [ ] Loading message displays
- [ ] Loading state clears after auth completes
- [ ] No flash of unauthenticated content

### 6.4 Responsive Layout
- [ ] Top header is fixed position
- [ ] Left toolbar is fixed position
- [ ] Canvas fills remaining space
- [ ] Layout works at various window sizes
- [ ] No scrollbars on main window
- [ ] Components don't overlap

---

## 7. Error Handling

### 7.1 Network Errors
- [ ] App handles Firebase connection loss gracefully
- [ ] Error boundary catches React errors
- [ ] Error messages are user-friendly
- [ ] Can recover from temporary network issues
- [ ] No uncaught exceptions in console

### 7.2 Authentication Errors
- [ ] Failed login shows error message
- [ ] Expired session redirects to login
- [ ] Auth errors don't crash app
- [ ] Can retry authentication after failure

### 7.3 Validation Errors
- [ ] Empty text objects prevented with clear feedback
- [ ] Invalid operations show helpful messages
- [ ] Validation doesn't crash app

---

## 8. Performance Tests

### 8.1 Rendering Performance
- [ ] Canvas renders smoothly at 60 FPS
- [ ] No jank during pan/zoom
- [ ] No lag during shape creation
- [ ] Multiple shapes (100+) render smoothly
- [ ] Cursor movement is smooth

### 8.2 Network Performance
- [ ] Object creation syncs < 100ms
- [ ] Object updates sync < 100ms
- [ ] Object deletion syncs < 100ms
- [ ] Cursor updates at ~20Hz
- [ ] No excessive Firebase read/writes
- [ ] Bandwidth usage is reasonable

### 8.3 Memory Performance
- [ ] No memory leaks after extended use
- [ ] Memory usage stable with many objects
- [ ] No memory leaks when users join/leave
- [ ] Cleanup on component unmount

---

## 9. Browser Compatibility

### 9.1 Chrome
- [ ] All features work in Chrome
- [ ] UI renders correctly
- [ ] No console errors

### 9.2 Firefox
- [ ] All features work in Firefox
- [ ] UI renders correctly
- [ ] No console errors

### 9.3 Safari
- [ ] All features work in Safari
- [ ] UI renders correctly
- [ ] No console errors

### 9.4 Edge
- [ ] All features work in Edge
- [ ] UI renders correctly
- [ ] No console errors

---

## 10. Data Integrity

### 10.1 Firebase Data Model
- [ ] Canvas objects stored correctly
- [ ] Compressed format used (t, x, y, w, h, txt)
- [ ] No color property stored (all shapes blue)
- [ ] Presence data stored correctly
- [ ] Presence structure: {n, cl, c, sel}
- [ ] Data cleanup on user disconnect

### 10.2 Conflict Resolution
- [ ] Last-write-wins works correctly
- [ ] No data corruption with concurrent edits
- [ ] Shapes don't "jump" unexpectedly
- [ ] Selection conflicts handled gracefully

---

## 11. Security Tests

### 11.1 Authentication Required
- [ ] Cannot access canvas without login
- [ ] Protected routes redirect to login
- [ ] Firebase rules enforce authentication

### 11.2 Firebase Security Rules
- [ ] Cannot read canvas without auth
- [ ] Cannot write canvas without auth
- [ ] Cannot read presence without auth
- [ ] Can only write to own presence path
- [ ] Rules validated with `firebase deploy --only database`

---

## 12. MVP Constraints Validation

### 12.1 Explicitly Excluded Features
- [ ] ❌ No resize functionality (verified absent)
- [ ] ❌ No Konva Transformers (verified absent)
- [ ] ❌ No color picker (verified absent - all blue)
- [ ] ❌ No text editing after creation (verified absent)
- [ ] ❌ No properties panel (verified absent)
- [ ] ❌ No multi-select (verified absent)
- [ ] ❌ No copy/paste (verified absent)
- [ ] ❌ No undo/redo (verified absent)

### 12.2 Fixed Constraints
- [ ] All shapes are 100x100px (verified)
- [ ] All shapes are blue #3B82F6 (verified)
- [ ] Canvas is 5000x5000px (verified)
- [ ] Grid spacing is 50px (verified)
- [ ] Cursor sync is 20Hz (verified)
- [ ] Cursor uses jump positioning, no interpolation (verified)
- [ ] Single shared canvas for all users (verified)

---

## Test Results Summary

**Test Date:** _______________

**Tester:** _______________

**Environment:**
- Node Version: _______________
- Browser(s): _______________
- Firebase Project: collabcanvas-realtime

**Overall Results:**
- Total Tests: _______________
- Passed: _______________
- Failed: _______________
- Blocked: _______________

**Critical Bugs Found:**
1. _______________
2. _______________
3. _______________

**Non-Critical Issues:**
1. _______________
2. _______________
3. _______________

**Performance Metrics:**
- Average FPS: _______________
- Object Creation Latency: _______________
- Object Update Latency: _______________
- Cursor Update Frequency: _______________

**Notes:**
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________

**Sign-off:**
- [ ] All critical features tested
- [ ] All critical bugs fixed
- [ ] Performance targets met
- [ ] Ready for production deployment

