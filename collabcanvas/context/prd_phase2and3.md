CollabCanvas - Phase 2 & 3 Product Requirements
Phase 2: Core Editing Power (Week 1-2)
Goal: Make it feel like a real design tool
Why start here: These are the features users expect immediately after basic creation. Without these, the tool feels toy-like.

PR-11: Multi-select & Bulk Operations
User Story:

As a designer, I want to select multiple objects at once so that I can move, edit, or delete them together, saving time when working with groups of related elements.

Features:

Shift+click to add/remove from selection
Drag-to-select box (marquee selection)
Select all (Ctrl/Cmd+A)
Bulk move, bulk delete

Why first: Foundation for all other operations. Everything else builds on this.
Acceptance Criteria:

 Shift+clicking shapes adds them to current selection
 Dragging on empty canvas creates selection box
 All shapes within selection box are selected on mouse release
 Selected shapes can be moved together while maintaining relative positions
 Delete key removes all selected shapes
 Selection state is visible to all collaborators


PR-12: Transform & Resize
User Story:

As a designer, I want to resize and rotate shapes after creating them so that I can adjust my designs without recreating objects from scratch.

Features:

Resize with corner handles
Maintain aspect ratio (Shift+drag)
Rotate with rotation handle
Multi-select rotation around group center (Figma-style)

Why second: Natural next step after multi-select. Users create, then want to adjust.
Acceptance Criteria:

 Selected shapes show transform handles (corners + rotation)
 Dragging corner handles resizes shape
 Shift+dragging corner maintains aspect ratio
 Dragging rotation handle rotates shape around center
 Multi-select shows single transformer around bounding box
 Transform changes sync to all users in real-time


PR-13: Copy/Paste & Duplicate
User Story:

As a designer, I want to duplicate objects quickly so that I can create repeated elements and patterns without manually recreating each instance.

Features:

Copy (Ctrl/Cmd+C)
Paste (Ctrl/Cmd+V) - offset from original
Duplicate (Ctrl/Cmd+D) - small offset
In-memory clipboard only (no native clipboard integration)

Why third: Dramatically speeds up workflow once resize works.
Acceptance Criteria:

 Ctrl/Cmd+C copies selected shapes to clipboard
 Ctrl/Cmd+V pastes shapes with 20px offset
 Ctrl/Cmd+D duplicates shapes with 20px offset
 Pasted/duplicated shapes preserve all properties (size, color, rotation)
 Pasted shapes are automatically selected
 Multi-select copy/paste works correctly


PR-14: Undo/Redo
User Story:

As a designer, I want to undo and redo my actions so that I can experiment freely without fear of losing my work or making irreversible mistakes.

Features:

Command history stack (last 50 actions)
Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z
Synced per-user (not global)
Toast notification when undo fails due to multi-user conflicts

Why fourth: Users expect this after copy/paste. Critical for confidence.
Acceptance Criteria:

 Ctrl/Cmd+Z undoes last action
 Ctrl/Cmd+Shift+Z redoes undone action
 Undo/redo works for create, delete, move, transform, color changes
 History limited to 50 actions (oldest removed automatically)
 Each user has independent undo/redo stack
 Undo/redo buttons show enabled/disabled state


Phase 3: Visual Polish (Week 3)
Goal: Make designs look professional
Why next: With editing locked down, users need visual control.

PR-15: Color System
User Story:

As a designer, I want to choose custom colors for my shapes so that I can create visually distinct designs that match my brand or aesthetic preferences.

Features:

Color picker (fill color for shapes)
Stroke color (outline)
Stroke width control
Recently used colors palette
RGBA format for colors (includes opacity)

Why first in phase 3: Biggest visual impact. Currently everything is blue.
Acceptance Criteria:

 Properties panel appears when shape is selected
 Fill color picker changes shape fill color
 Stroke color picker adds outline to shape
 Stroke width slider adjusts outline thickness (0-20px)
 Recently used colors show last 5 colors picked
 Multi-select allows batch color updates
 Color changes sync to all users in real-time


PR-16: Advanced Shapes
User Story:

As a designer, I want access to more shape types beyond rectangles and circles so that I can create more complex and expressive designs without leaving the tool.

Features:

Line tool (with arrow options)
Polygon tool (auto-cache when >6 sides)
Star tool (auto-cache when >6 points)
Rounded rectangle

Why second: Expands creative options now that colors work.
Acceptance Criteria:

 Line tool creates lines by clicking and dragging
 Line tool supports start/end arrow options
 Polygon tool creates shapes with 3-12 sides
 Star tool creates stars with 3-12 points
 Rounded rectangle has adjustable corner radius (0-50px)
 All new shapes support fill, stroke, and transform
 Toolbar reorganized to accommodate new shape buttons


PR-17: Z-Index Control
User Story:

As a designer, I want to control which shapes appear in front of or behind others so that I can create layered designs with proper visual hierarchy.

Features:

Bring to front / send to back
Bring forward / send backward
Right-click context menu

Why third: Needed once you have multiple colored/overlapping objects.
Acceptance Criteria:

 Right-click on shape shows context menu
 "Bring to Front" moves shape to topmost layer
 "Send to Back" moves shape to bottommost layer
 "Bring Forward" moves shape up one layer
 "Send Backward" moves shape down one layer
 Keyboard shortcuts work (Cmd+], Cmd+[, etc.)
 Z-index changes sync to all users in real-time
 Overlapping shapes render in correct order


PR-18: Alignment & Distribution
User Story:

As a designer, I want to align and distribute multiple objects precisely so that I can create clean, organized layouts without manually positioning each element.

Features:

Align left/center/right
Align top/middle/bottom
Distribute horizontally/vertically
Align to canvas center

Why last in phase 3: Polish feature, powerful but not critical.
Acceptance Criteria:

 Alignment toolbar appears when 2+ shapes selected
 Align left moves all shapes to leftmost edge
 Align center centers shapes horizontally
 Align top moves all shapes to topmost edge
 Align middle centers shapes vertically
 Distribute horizontally creates equal spacing between shapes
 Distribute vertically creates equal spacing between shapes
 "Center in Canvas" moves selection to viewport center
 Distribute requires 3+ shapes (button disabled otherwise)
 Smart guides show alignment hints during drag
 Alignment changes sync to all users in real-time


Success Metrics
Phase 2 Completion

 Users can efficiently work with 10+ shapes simultaneously
 Multi-select operations complete without lag (<100ms)
 Undo/redo stack handles 50 actions smoothly
 90% of users discover and use keyboard shortcuts
 Copy/paste accuracy: 100% property preservation

Phase 3 Completion

 Average shapes per canvas increases by 200% (more complex designs)
 Color picker usage: 80%+ of created shapes use custom colors
 Advanced shapes usage: 30%+ of designs include polygon/star/line
 Z-index operations: 50%+ of users with 5+ shapes use layering
 Alignment tools: 60%+ of multi-select operations include alignment

Overall Performance (Maintained)

 60 FPS with 100+ mixed shapes
 <100ms sync latency for all operations
 <50ms cursor sync latency
 Support 5+ concurrent users without degradation
 <15 MB/hour bandwidth for 5 active users

 Test Summary
Unit Tests (22 new test files)
Phase 3:

tests/unit/hooks/useCanvas-multiselect.test.ts - Multi-select logic
tests/unit/hooks/useCanvas-transform.test.ts - Transform logic
tests/unit/services/clipboard.test.ts - Copy/paste logic
tests/unit/services/commandHistory.test.ts - Command history manager
tests/unit/commands/CreateCommand.test.ts - Create command
tests/unit/commands/DeleteCommand.test.ts - Delete command
tests/unit/commands/MoveCommand.test.ts - Move command

Phase 3:
8. tests/unit/hooks/useCanvas-colors.test.ts - Color update logic
9. tests/unit/hooks/useCanvas-advancedShapes.test.ts - Advanced shape creation
10. tests/unit/hooks/useCanvas-zindex.test.ts - Z-index manipulation
11. tests/unit/services/alignment.test.ts - Alignment calculations
Integration Tests (11 new test files)
Phase 2:

tests/integration/multiSelect.test.tsx - Multi-select UI flow
tests/integration/transform.test.tsx - Transform UI flow
tests/integration/copyPaste.test.tsx - Copy/paste UI flow
tests/integration/undoRedo.test.tsx - Undo/redo UI flow

Phase 2:
5. tests/integration/colorPicker.test.tsx - Color picker UI flow
6. tests/integration/advancedShapes.test.tsx - Advanced shape tools
7. tests/integration/zindex.test.tsx - Z-index and context menu
8. tests/integration/alignment.test.tsx - Alignment tools

Updated File Structure
collabcanvas/
├── src/
│   ├── components/
│   │   ├── Canvas.tsx (MODIFIED - multi-select, transform, alignment)
│   │   ├── Toolbar.tsx (MODIFIED - new shape buttons, alignment)
│   │   ├── Rectangle.tsx (MODIFIED - transform, colors)
│   │   ├── Circle.tsx (MODIFIED - transform, colors)
│   │   ├── TextShape.tsx (MODIFIED - transform, colors)
│   │   ├── SelectionBox.tsx (NEW - drag-to-select)
│   │   ├── ColorPicker.tsx (NEW - color selection)
│   │   ├── PropertiesPanel.tsx (NEW - shape properties)
│   │   ├── ContextMenu.tsx (NEW - right-click menu)
│   │   ├── AlignmentToolbar.tsx (NEW - alignment buttons)
│   │   ├── AlignmentGuides.tsx (NEW - visual guides)
│   │   ├── Line.tsx (NEW - line shape)
│   │   ├── Polygon.tsx (NEW - polygon shape)
│   │   ├── Star.tsx (NEW - star shape)
│   │   └── RoundedRect.tsx (NEW - rounded rectangle)
│   ├── hooks/
│   │   └── useCanvas.ts (MODIFIED - multi-select, transform, colors, alignment)
│   ├── services/
│   │   ├── canvasSync.ts (MODIFIED - colors, z-index, new shapes)
│   │   ├── clipboard.ts (NEW - copy/paste)
│   │   ├── commandHistory.ts (NEW - undo/redo)
│   │   ├── colorStorage.ts (NEW - recent colors)
│   │   └── alignment.ts (NEW - alignment calculations)
│   ├── commands/
│   │   ├── CreateCommand.ts (NEW)
│   │   ├── DeleteCommand.ts (NEW)
│   │   ├── MoveCommand.ts (NEW)
│   │   ├── TransformCommand.ts (NEW)
│   │   ├── BulkCommand.ts (NEW)
│   │   ├── ColorCommand.ts (NEW)
│   │   ├── ZIndexCommand.ts (NEW)
│   │   └── AlignmentCommand.ts (NEW)
│   └── types/
│       ├── canvas.ts (MODIFIED - new shape properties)
│       ├── selection.ts (NEW - selection types)
│       └── command.ts (NEW - command types)
└── tests/
    ├── unit/
    │   ├── hooks/
    │   │   ├── useCanvas-multiselect.test.ts (NEW)
    │   │   ├── useCanvas-transform.test.ts (NEW)
    │   │   ├── useCanvas-colors.test.ts (NEW)
    │   │   ├── useCanvas-advancedShapes.test.ts (NEW)
    │   │   └── useCanvas-zindex.test.ts (NEW)
    │   ├── services/
    │   │   ├── clipboard.test.ts (NEW)
    │   │   ├── commandHistory.test.ts (NEW)
    │   │   └── alignment.test.ts (NEW)
    │   └── commands/
    │       ├── CreateCommand.test.ts (NEW)
    │       ├── DeleteCommand.test.ts (NEW)
    │       └── MoveCommand.test.ts (NEW)
    └── integration/
        ├── multiSelect.test.tsx (NEW)
        ├── transform.test.tsx (NEW)
        ├── copyPaste.test.tsx (NEW)
        ├── undoRedo.test.tsx (NEW)
        ├── colorPicker.test.tsx (NEW)
        ├── advancedShapes.test.tsx (NEW)
        ├── zindex.test.tsx (NEW)
        └── alignment.test.tsx (NEW)

Firebase Data Structure Changes
Updated Shape Object
javascriptcanvas/objects/{objectId}: {
  // Core
  t: "r",              // type: r=rect, c=circle, t=text, l=line, pg=polygon, st=star, rr=roundRect
  x: 100,              // x position
  y: 100,              // y position
  
  // Dimensions
  w: 150,              // width (variable now)
  h: 200,              // height (variable now)
  rot: 45,             // rotation in degrees (NEW)
  
  // Colors
  f: "#3B82F6",        // fill color (NEW)
  s: "#000000",        // stroke color (NEW, optional)
  sw: 2,               // stroke width (NEW, optional)
  
  // Z-index
  z: 1697234567890,    // z-index for layering (NEW, Firebase serverTimestamp)
  
  // Shape-specific
  txt: "Hello",        // text content (text only)
  pts: [x1,y1,x2,y2],  // line points (line only)
  arr: {s:true,e:false}, // arrows (line only)
  sides: 5,            // polygon sides (polygon only)
  cr: 10               // corner radius (roundRect only)
}
Presence (updated for multi-select)
javascriptpresence/{userId}: {
  n: "John Doe",
  cl: "#FF5733",
  c: [450, 320],
  sel: ["obj-123", "obj-456"]  // array for multi-select, null for none, single-item array for one
}

Performance Considerations
Maintaining 60 FPS with New Features
Multi-select:

Use Set for selectedIds (O(1) lookup)
Batch render selected shapes
Debounce selection box updates during drag

Transform:

Only update on transform end (not during drag)
Cache transformed shapes
Use Konva's built-in caching for complex shapes

Color System:

Throttle color picker updates (50ms)
Batch color updates for multi-select
Use CSS color values (avoid conversion overhead)

Advanced Shapes:

Lazy load shape components (React.lazy)
Auto-cache polygons with >6 sides using Konva.cache()
Auto-cache stars with >6 points using Konva.cache()
Limit polygon/star sides to 12 max

Z-index:

Sort shapes once on data change (not on every render)
Use stable sort to avoid unnecessary re-renders
Index shapes by z-index for faster lookups

Alignment:

Calculate alignment once, batch updates
Use requestAnimationFrame for visual guides
Throttle snap-to-align checks (100ms)

Undo/Redo:

Limit history to 50 commands
Store diffs, not full state snapshots
Clear history on canvas switch


Keyboard Shortcuts Reference (Streamlined - Essential Only)

Core Actions:

Delete/Backspace - Delete selected
Escape - Clear selection

Phase 2: Core Editing

Shift+Click - Add/remove from selection
Cmd/Ctrl+A - Select all
Cmd/Ctrl+C - Copy
Cmd/Ctrl+V - Paste
Cmd/Ctrl+D - Duplicate
Cmd/Ctrl+Z - Undo
Cmd/Ctrl+Shift+Z - Redo

Phase 3: Use UI Controls

Note: Z-index and alignment operations accessible via context menu and toolbar buttons only (no keyboard shortcuts to avoid conflicts and maintain simplicity)


Notes & Best Practices
Development Order

Build vertically - Complete each PR fully before starting next
Test continuously - Run unit tests after each subtask
Sync early, sync often - Test multi-user sync after each feature
Profile performance - Check FPS after adding render-heavy features

Git Workflow

One PR per feature (PR-11, PR-12, etc.)
Squash commits before merging
Tag releases after each phase (v1.1.0, v1.2.0)

Testing Strategy

Unit tests: Logic and state management
Integration tests: UI flows and user interactions using Firebase Emulator Suite
Manual testing: Multi-user sync and performance

Firebase Considerations

Batch writes for multi-select operations
Use transactions for z-index changes (prevent race conditions)
Monitor bandwidth (color changes are larger payloads)
Consider upgrading to Blaze plan for production

User Experience

Provide visual feedback (highlights, animations)
Make undo/redo obvious (toolbar buttons + shortcuts)
Use tooltips for essential actions
Toast notifications for multi-user conflict warnings

Deferred to Phase 4:

Loading states & skeleton loaders
Keyboard shortcuts help modal
Shape locking feature


Migration Notes
Upgrading from MVP to Phase 2

Strategy: Dual approach for safety and cleanliness

Code Defaults (immediate safety):
typescript// In shape rendering code
const rotation = shape.rot ?? 0;
const zIndex = shape.z ?? Date.now();


Migration Script (data cleanup):

Run one-time script to add default rot: 0 to existing shapes
Add default z: serverTimestamp() to existing shapes
No breaking changes (backward compatible)

User data:

No user data migration needed
Recent colors start empty

Upgrading from Phase 2 to Phase 3

Code Defaults:
typescript// In shape rendering code
const fill = shape.f ?? '#3B82F6FF';
const stroke = shape.s ?? null;
const strokeWidth = shape.sw ?? 0;


Migration Script:

Add default f: "#3B82F6FF" to existing shapes (RGBA format)
Remove hardcoded blue color from components
Optional: batch update to add default stroke/strokeWidth

Component changes:

Properties panel requires layout adjustment
Toolbar reorganization for new shapes