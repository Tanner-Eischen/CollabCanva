# CollabCanvas - Phase 2 & 3 Task List

## Phase 2: Core Editing Power

---

## PR-11: Multi-Select & Bulk Operations

**Commit Message:** `feat: implement multi-select with shift-click and drag-to-select box`

**Goal:** Enable selecting multiple objects for bulk operations

### Subtasks

#### 11.1 Update Canvas Types for Multi-Select
- [x] **Task Complete**

**Files Created:**
- `src/types/selection.ts` (interfaces: SelectionState, SelectionBox)

**Files Modified:**
- `src/types/canvas.ts` (add SelectionBox interface)

#### 11.2 Create Selection Box Component
- [x] **Task Complete**

**Files Created:**
- `src/components/SelectionBox.tsx` (Konva Rect for drag-to-select visual indicator)

**Requirements:**
- Dashed border rectangle
- Semi-transparent fill
- Shows during mouse drag
- Calculates intersection with shapes

#### 11.3 Update Canvas Hook for Multi-Select
- [x] **Task Complete**

**Files Modified:**
- `src/hooks/useCanvas.ts` (add selectedIds array, toggleSelection, selectMultiple, clearSelection)

**New functions:**
- `toggleSelection(id: string)` - Add/remove from selection with shift-click
- `selectMultiple(ids: string[])` - Set multiple selected objects
- `clearSelection()` - Clear all selections
- `selectAll()` - Select all objects on canvas
- `getSelectedShapes()` - Return array of selected shape objects

#### 11.4 Update Canvas Component with Drag-to-Select
- [x] **Task Complete**

**Files Modified:**
- `src/components/Canvas.tsx` (add mousedown/mousemove/mouseup handlers for selection box)

**Requirements:**
- Click empty space + drag → draw selection box
- On mouse up → calculate which shapes intersect box
- Shift+click shape → add/remove from selection
- Click shape without shift → single select (clear others)
- Cmd/Ctrl+A → select all
- Escape → clear selection

#### 11.5 Update Shape Components for Multi-Select
- [x] **Task Complete**

**Files Modified:**
- `src/components/Rectangle.tsx` (support multi-select highlighting)
- `src/components/Circle.tsx` (support multi-select highlighting)
- `src/components/TextShape.tsx` (support multi-select highlighting)

**Requirements:**
- Show selection indicator when in selectedIds array
- Different visual for multi-select (e.g., blue outline for all selected)

#### 11.6 Implement Bulk Move
- [x] **Task Complete**

**Files Modified:**
- `src/hooks/useCanvas.ts` (add bulkMove function)
- `src/components/Canvas.tsx` (handle dragging multiple shapes)

**Requirements:**
- Dragging any selected shape → moves all selected shapes together
- Maintain relative positions
- Sync all moves to Firebase on drag end

#### 11.7 Implement Bulk Delete
- [x] **Task Complete**

**Files Modified:**
- `src/hooks/useCanvas.ts` (add bulkDelete function)
- `src/components/Canvas.tsx` (handle Delete key with multiple selected)
- `src/components/Toolbar.tsx` (delete button works with multiple selected)

**Requirements:**
- Delete key → delete all selected shapes
- Toolbar delete button → delete all selected shapes
- Clear selection after deletion
- Sync all deletions to Firebase

#### 11.8 Update Firebase Sync for Multi-Select
- [x] **Task Complete**

**Files Modified:**
- `src/services/canvasSync.ts` (add syncBulkDelete, syncBulkMove)

**New functions:**
- `syncBulkDelete(objectIds: string[])` - Delete multiple objects
- `syncBulkMove(updates: Record<string, {x: number, y: number}>)` - Move multiple objects

#### 11.9 Unit Tests for Multi-Select Logic
- [x] **Task Complete**

**Files Created:**
- `tests/unit/hooks/useCanvas-multiselect.test.ts`

**Tests to verify:**
- `toggleSelection()` adds ID to array if not present
- `toggleSelection()` removes ID from array if present
- `selectMultiple()` replaces entire selection array
- `clearSelection()` empties selection array
- `selectAll()` selects all shape IDs
- `bulkMove()` updates positions for all selected shapes
- `bulkDelete()` removes all selected shapes
- Selection persists after operations

#### 11.10 Integration Tests for Multi-Select UI
- [x] **Task Complete**

**Files Created:**
- `tests/integration/multiSelect.test.tsx`

**Tests to verify:**
- Shift+click adds shape to selection
- Shift+click on selected shape removes it
- Click without shift clears other selections
- Drag-to-select box appears on canvas
- Shapes within box get selected on mouse up
- Cmd/Ctrl+A selects all shapes
- Escape clears selection
- Delete key removes all selected shapes
- Dragging one selected shape moves all selected shapes

---

## PR-12: Transform & Resize

**Commit Message:** `feat: add resize handles and rotation for shapes`

**Goal:** Enable resizing and rotating objects with interactive handles

### Subtasks

#### 12.1 Add Transformer to Shape Components
- [x] **Task Complete**

**Files Modified:**
- `src/components/Rectangle.tsx` (add Konva Transformer for resize/rotate)
- `src/components/Circle.tsx` (add Konva Transformer for resize/rotate)
- `src/components/TextShape.tsx` (add Konva Transformer for resize only)

**Requirements:**
- Show transformer handles when selected
- Corner handles for resize
- Top handle for rotation
- Shift+drag corner → maintain aspect ratio
- Text: no rotation, auto-height based on width

#### 12.2 Update Canvas Types for Transform
- [x] **Task Complete**

**Files Modified:**
- `src/types/canvas.ts` (add rotation property to Shape interface)

**New properties:**
- `rotation?: number` (degrees, 0-360)

#### 12.3 Handle Transform Events
- [x] **Task Complete**

**Files Modified:**
- `src/components/Rectangle.tsx` (onTransformEnd → update w, h, rotation)
- `src/components/Circle.tsx` (onTransformEnd → update w, h, rotation)
- `src/components/TextShape.tsx` (onTransformEnd → update w only)

**Requirements:**
- Capture final transform values on transform end
- Update local state immediately
- Sync to Firebase

#### 12.4 Update Canvas Hook for Transform
- [x] **Task Complete**

**Files Modified:**
- `src/hooks/useCanvas.ts` (updateShape supports rotation, w, h changes)

**Requirements:**
- `updateShape()` accepts rotation, width, height
- Validate dimensions (min 10px, max 5000px)

#### 12.5 Update Firebase Sync for Transform
- [x] **Task Complete**

**Files Modified:**
- `src/services/canvasSync.ts` (sync rotation, width, height)

**Data structure changes:**
```javascript
canvas/objects/{id}: {
  t: "r",
  x: 100,
  y: 100,
  w: 150,  // now variable
  h: 200,  // now variable
  rot: 45  // new property (optional, degrees, default 0)
}
```

**Migration:**
- Code defaults: `shape.rot ?? 0`
- Migration script to add default values to existing shapes

#### 12.6 Multi-Select Transform
- [x] **Task Complete**

**Files Modified:**
- `src/components/Canvas.tsx` (show single transformer for multi-select)

**Requirements:**
- When multiple shapes selected → show one transformer around bounding box
- Transform all selected shapes proportionally
- Rotation around group center (Figma-style)
- Maintain relative positions and sizes
- Sync all transforms to Firebase

#### 12.7 Unit Tests for Transform Logic
- [x] **Task Complete**

**Files Created:**
- `tests/unit/hooks/useCanvas-transform.test.ts`

**Tests to verify:**
- `updateShape()` accepts width, height, rotation
- Width/height validation (min 10, max 5000)
- Rotation stored as degrees (0-360)
- Multi-select transform updates all selected shapes proportionally

#### 12.8 Integration Tests for Transform UI
- [x] **Task Complete**

**Files Created:**
- `tests/integration/transform.test.tsx`

**Tests to verify:**
- Transformer handles appear when shape selected
- Dragging corner resizes shape
- Shift+drag corner maintains aspect ratio
- Dragging rotation handle rotates shape
- Transform updates sync to other users
- Multi-select shows single transformer
- Transforming multi-select affects all shapes

---

## PR-13: Copy/Paste & Duplicate

**Commit Message:** `feat: implement copy, paste, and duplicate operations`

**Goal:** Enable duplicating objects with keyboard shortcuts

### Subtasks

#### 13.1 Create Clipboard Service
- [x] **Task Complete**

**Files Created:**
- `src/services/clipboard.ts` (copyShapes, pasteShapes functions)

**Functions:**
- `copyShapes(shapes: Shape[])` - Copy to in-memory clipboard
- `pasteShapes()` - Return copied shapes with new IDs and offset positions
- `duplicateShapes(shapes: Shape[])` - Duplicate with small offset

**Requirements:**
- Store clipboard data in memory ONLY (no native clipboard integration)
- Generate new UUIDs for pasted shapes
- Offset pasted shapes by (20px, 20px) from original
- Preserve all properties (size, color, rotation, text)

#### 13.2 Update Canvas Hook with Copy/Paste/Duplicate
- [x] **Task Complete**

**Files Modified:**
- `src/hooks/useCanvas.ts` (add copy, paste, duplicate functions)

**New functions:**
- `copySelected()` - Copy selected shapes to clipboard
- `paste()` - Paste from clipboard, create new shapes
- `duplicateSelected()` - Duplicate selected shapes with small offset

#### 13.3 Add Keyboard Shortcuts
- [x] **Task Complete**

**Files Modified:**
- `src/components/Canvas.tsx` (add keyboard event listeners)

**Shortcuts:**
- Cmd/Ctrl+C → copy selected
- Cmd/Ctrl+V → paste
- Cmd/Ctrl+D → duplicate selected

#### 13.4 Update Firebase Sync for Batch Create
- [x] **Task Complete**

**Files Modified:**
- `src/services/canvasSync.ts` (add syncBatchCreate)

**New function:**
- `syncBatchCreate(shapes: Shape[])` - Create multiple shapes at once

**Requirements:**
- Efficient batch write to Firebase
- Broadcast all creates to other users

#### 13.5 Visual Feedback for Copy/Paste
- [x] **Task Complete**

**Files Modified:**
- `src/components/Canvas.tsx` (flash selection indicator on paste)

**Requirements:**
- Brief visual feedback when paste occurs (optional)
- Auto-select newly pasted shapes

#### 13.6 Unit Tests for Clipboard Logic
- [x] **Task Complete**

**Files Created:**
- `tests/unit/services/clipboard.test.ts`

**Tests to verify:**
- `copyShapes()` stores shape data in memory
- `pasteShapes()` returns shapes with new UUIDs
- `pasteShapes()` offsets positions by (20, 20)
- `duplicateShapes()` creates copies with small offset
- All shape properties preserved (size, rotation, color, text)

#### 13.7 Integration Tests for Copy/Paste UI
- [x] **Task Complete**

**Files Created:**
- `tests/integration/copyPaste.test.tsx`

**Tests to verify:**
- Cmd/Ctrl+C copies selected shapes
- Cmd/Ctrl+V pastes shapes with offset
- Cmd/Ctrl+D duplicates shapes
- Pasted shapes have new IDs
- Pasted shapes are auto-selected
- Copy/paste works with multi-select
- Properties preserved after paste (size, rotation, text)

---

## PR-14: Undo/Redo

**Commit Message:** `feat: implement undo/redo with command history`

**Goal:** Enable undoing and redoing actions with keyboard shortcuts

### Subtasks

#### 14.1 Create Command History System
- [x] **Task Complete**

**Files Created:**
- `src/services/commandHistory.ts` (Command interface, HistoryManager class)
- `src/types/command.ts` (Command types: CreateCommand, DeleteCommand, MoveCommand, TransformCommand)

**Command interface:**
```typescript
interface Command {
  type: 'create' | 'delete' | 'move' | 'transform' | 'bulk';
  execute(): void;
  undo(): void;
  redo(): void;
}
```

**HistoryManager:**
- Maintains two stacks: undoStack (max 50), redoStack
- `executeCommand(command)` - Run and add to undoStack
- `undo()` - Pop from undoStack, execute undo(), push to redoStack
- `redo()` - Pop from redoStack, execute redo(), push to undoStack
- `clear()` - Clear both stacks

#### 14.2 Implement Command Classes
- [x] **Task Complete**

**Files Created:**
- `src/commands/CreateCommand.ts` (undo: delete shape, redo: recreate)
- `src/commands/DeleteCommand.ts` (undo: recreate shape, redo: delete)
- `src/commands/MoveCommand.ts` (undo: restore old position, redo: apply new position)
- `src/commands/TransformCommand.ts` (undo: restore old transform, redo: apply new transform)
- `src/commands/BulkCommand.ts` (undo/redo multiple operations)

**Requirements:**
- Each command stores necessary data for undo/redo
- Commands call Firebase sync functions
- Commands update local state

#### 14.3 Integrate Commands with Canvas Hook
- [x] **Task Complete**

**Files Modified:**
- `src/hooks/useCanvas.ts` (use HistoryManager, wrap operations in commands)

**Changes:**
- `addShape()` → creates CreateCommand and executes it
- `deleteShape()` → creates DeleteCommand and executes it
- `updateShape()` → creates MoveCommand or TransformCommand
- `bulkDelete()` → creates BulkCommand with multiple DeleteCommands

**New functions:**
- `undo()` - Call historyManager.undo()
- `redo()` - Call historyManager.redo()
- `canUndo()` - Returns true if undoStack not empty
- `canRedo()` - Returns true if redoStack not empty

#### 14.4 Add Keyboard Shortcuts for Undo/Redo
- [x] **Task Complete**

**Files Modified:**
- `src/components/Canvas.tsx` (add keyboard event listeners)

**Shortcuts:**
- Cmd/Ctrl+Z → undo
- Cmd/Ctrl+Shift+Z → redo

#### 14.5 Add Undo/Redo Buttons to UI 
- [x] **Task Complete**

**Files Modified:**
- `src/components/Toolbar.tsx` (add undo/redo buttons at top)

**Requirements:**
- Undo button (disabled if can't undo)
- Redo button (disabled if can't redo)
- Show keyboard shortcuts on hover

#### 14.6 Handle Multi-User Conflicts
- [x] **Task Complete**

**Files Created:**
- `src/components/Toast.tsx` (toast notification component)

**Files Modified:**
- `src/services/commandHistory.ts` (per-user history, not global)

**Requirements:**
- Each user has their own undo/redo stacks
- Undo only affects current user's actions
- If another user deletes an object that's in your undo stack, show toast: "Cannot undo - object was deleted by another user"
- Toast auto-dismisses after 3 seconds

#### 14.7 Clear History on Certain Actions
- [x] **Task Complete**

**Files Modified:**
- `src/hooks/useCanvas.ts` (clear history on page refresh or major state changes)

**Requirements:**
- Clear redo stack when new command executed
- Limit undo stack to 50 commands (remove oldest)

#### 14.8 Unit Tests for Command History
- [x] **Task Complete**

**Files Created:**
- `tests/unit/services/commandHistory.test.ts`
- `tests/unit/commands/CreateCommand.test.ts`
- `tests/unit/commands/DeleteCommand.test.ts`
- `tests/unit/commands/MoveCommand.test.ts`

**Tests to verify:**
- `executeCommand()` adds to undoStack and clears redoStack
- `undo()` moves command from undoStack to redoStack
- `redo()` moves command from redoStack to undoStack
- `undo()` calls command.undo()
- `redo()` calls command.redo()
- Stack limit enforced (max 50 in undoStack)
- CreateCommand undo deletes shape
- DeleteCommand undo recreates shape with same ID and properties
- MoveCommand undo restores old position

#### 14.9 Integration Tests for Undo/Redo UI
- [x] **Task Complete**

**Files Created:**
- `tests/integration/undoRedo.test.tsx`

**Tests to verify:**
- Create shape → Cmd/Ctrl+Z → shape deleted
- Create shape → undo → redo → shape reappears
- Delete shape → undo → shape restored with same properties
- Move shape → undo → shape returns to old position
- Transform shape → undo → shape returns to old size/rotation
- Undo button disabled when nothing to undo
- Redo button disabled when nothing to redo
- Multiple undos work in sequence

---

## Phase 3: Visual Polish

---

## PR-15: Color System

**Commit Message:** `feat: add color picker for fill and stroke`

**Goal:** Enable customizing shape colors with fill and stroke

### Subtasks

#### 15.1 Update Canvas Types for Colors
- [x] **Task Complete**

**Files Modified:**
- `src/types/canvas.ts` (add fill, stroke, strokeWidth to Shape interface)

**New properties:**
```typescript
interface Shape {
  // ... existing
  fill: string;           // hex color (default: #3B82F6)
  stroke?: string;        // hex color (optional, default: none)
  strokeWidth?: number;   // pixels (default: 0)
}
```

#### 15.2 Create Color Picker Component
- [x] **Task Complete**

**Files Created:**
- `src/components/ColorPicker.tsx` (color picker UI with presets and custom input)

**Requirements:**
- Preset color swatches (10-15 common colors)
- Hex input field with RGBA support
- "Recently used" section (last 5 colors)
- Separate pickers for fill and stroke
- Opacity slider (0-100%) - stored as RGBA format (#3B82F6FF)

#### 15.3 Create Properties Panel Component
- [x] **Task Complete**

**Files Created:**
- `src/components/PropertiesPanel.tsx` (right sidebar panel for selected shape properties)

**Contents:**
- Fill color picker
- Stroke color picker
- Stroke width slider (0-20px)
- Display only when shape(s) selected
- Show "Multiple" when multi-select with different values

#### 15.4 Update Shape Components to Use Colors
- [x] **Task Complete**

**Files Modified:**
- `src/components/Rectangle.tsx` (use fill, stroke, strokeWidth props)
- `src/components/Circle.tsx` (use fill, stroke, strokeWidth props)
- `src/components/TextShape.tsx` (use fill for text color)

**Requirements:**
- Render with fill color from shape data
- Render stroke if strokeWidth > 0
- Text uses fill as text color (no stroke for text)

#### 15.5 Update Canvas Hook for Color Changes
- [x] **Task Complete**

**Files Modified:**
- `src/hooks/useCanvas.ts` (add updateColors function)

**New functions:**
- `updateColors(ids: string[], fill?: string, stroke?: string, strokeWidth?: number)` - Update colors for selected shapes
- `getRecentColors()` - Return recently used colors array
- `addRecentColor(color: string)` - Add to recent colors (max 5)

#### 15.6 Update Firebase Sync for Colors
- [x] **Task Complete**

**Files Modified:**
- `src/services/canvasSync.ts` (include fill, stroke, strokeWidth in synced data)

**Data structure changes:**
```javascript
canvas/objects/{id}: {
  t: "r",
  x: 100,
  y: 100,
  w: 150,
  h: 200,
  f: "#3B82F6FF",    // fill color (RGBA format)
  s: "#000000FF",    // stroke color (optional, RGBA)
  sw: 2              // stroke width (optional)
}
```

**Migration:**
- Code defaults: `shape.f ?? '#3B82F6FF'`, `shape.s ?? null`, `shape.sw ?? 0`
- Migration script to add RGBA values to existing shapes

#### 15.7 Add Color Change to Command History
- [x] **Task Complete**

**Files Created:**
- `src/commands/ColorCommand.ts` (undo/redo color changes)

**Requirements:**
- Store old colors (fill, stroke, strokeWidth)
- Restore old colors on undo
- Apply new colors on redo

#### 15.8 Handle Multi-Select Color Changes
- [x] **Task Complete**

**Files Modified:**
- `src/components/PropertiesPanel.tsx` (batch update colors for all selected)

**Requirements:**
- Changing fill → updates all selected shapes
- Show "Multiple" if selected shapes have different colors
- Clicking "Multiple" shows color picker for batch update

#### 15.9 Recent Colors Persistence
- [x] **Task Complete**

**Files Created:**
- `src/services/colorStorage.ts` (localStorage for recent colors)

**Requirements:**
- Save recent colors to localStorage
- Load on app start
- Max 5 colors in recent list

#### 15.10 Unit Tests for Color System
- [ ] **Task Complete**

**Files Created:**
- `tests/unit/hooks/useCanvas-colors.test.ts`

**Tests to verify:**
- `updateColors()` updates fill/stroke/strokeWidth
- Recent colors list maintains max 5
- Recent colors stored in correct order (most recent first)
- Multi-select color update affects all selected shapes
- ColorCommand undo restores old colors

#### 15.11 Integration Tests for Color Picker UI
- [ ] **Task Complete**

**Files Created:**
- `tests/integration/colorPicker.test.tsx`

**Tests to verify:**
- Properties panel appears when shape selected
- Clicking fill color opens color picker
- Selecting preset color updates shape
- Typing hex color updates shape
- Stroke width slider changes stroke thickness
- Recent colors list updates after color selection
- Multi-select shows "Multiple" for different colors
- Color changes sync to other users

---

## PR-16: Advanced Shapes

**Commit Message:** `feat: add line, polygon, star, and rounded rectangle tools`

**Goal:** Expand shape library with more creative options

### Subtasks

#### 16.1 Update Canvas Types for New Shapes
- [ ] **Task Complete**

**Files Modified:**
- `src/types/canvas.ts` (add new shape types)

**New shape types:**
- `line` - Two points with optional arrows
- `polygon` - N-sided polygon (pentagon, hexagon, etc.)
- `star` - N-pointed star
- `roundRect` - Rectangle with border radius

**New properties:**
```typescript
interface Shape {
  // ... existing
  // For lines:
  points?: number[];      // [x1, y1, x2, y2]
  arrows?: {
    start?: boolean;
    end?: boolean;
  };
  
  // For polygon/star:
  sides?: number;         // number of sides/points
  
  // For roundRect:
  cornerRadius?: number;  // pixels
}
```

#### 16.2 Create Line Component
- [ ] **Task Complete**

**Files Created:**
- `src/components/Line.tsx` (Konva Line with drag endpoints and arrow options)

**Requirements:**
- Two draggable endpoints
- Optional start arrow
- Optional end arrow
- Supports stroke color and width
- Transform handles on endpoints

#### 16.3 Create Polygon Component
- [ ] **Task Complete**

**Files Created:**
- `src/components/Polygon.tsx` (Konva RegularPolygon)

**Requirements:**
- Default: pentagon (5 sides)
- Configurable sides (3-12)
- Auto-cache when >6 sides using Konva.cache()
- Supports fill, stroke
- Resizable and rotatable

#### 16.4 Create Star Component
- [ ] **Task Complete**

**Files Created:**
- `src/components/Star.tsx` (Konva Star)

**Requirements:**
- Default: 5 points
- Configurable points (3-12)
- Auto-cache when >6 points using Konva.cache()
- Supports fill, stroke
- Resizable and rotatable

#### 16.5 Create Rounded Rectangle Component
- [ ] **Task Complete**

**Files Created:**
- `src/components/RoundedRect.tsx` (Konva Rect with cornerRadius)

**Requirements:**
- Default: 10px corner radius
- Configurable corner radius (0-50px)
- Supports fill, stroke
- Resizable and rotatable

#### 16.6 Add New Shape Buttons to Toolbar
- [ ] **Task Complete**

**Files Modified:**
- `src/components/Toolbar.tsx` (add buttons for line, polygon, star, roundRect)

**Layout:**
- Reorganize toolbar into sections:
  - Basic shapes: Rectangle, Circle, RoundRect
  - Advanced: Polygon, Star
  - Line tool
  - Text tool
  - Delete button

#### 16.7 Update Canvas Hook for New Shapes
- [ ] **Task Complete**

**Files Modified:**
- `src/hooks/useCanvas.ts` (add creation functions for new shapes)

**New functions:**
- `createLine(x1, y1, x2, y2)` - Create line with endpoints
- `createPolygon(x, y, sides)` - Create polygon with N sides
- `createStar(x, y, points)` - Create star with N points
- `createRoundedRect(x, y, cornerRadius)` - Create rounded rectangle

#### 16.8 Update Canvas Component for New Tools
- [ ] **Task Complete**

**Files Modified:**
- `src/components/Canvas.tsx` (handle creation modes for new shapes)

**Requirements:**
- Line: Click and drag to set start/end points
- Polygon/Star: Click to place (default size)
- RoundedRect: Click to place (default size)

#### 16.9 Update Properties Panel for New Shapes
- [ ] **Task Complete**

**Files Modified:**
- `src/components/PropertiesPanel.tsx` (show shape-specific properties)

**New controls:**
- Line: Arrow checkboxes (start/end)
- Polygon: Sides slider (3-12)
- Star: Points slider (3-12)
- RoundedRect: Corner radius slider (0-50)

#### 16.10 Update Firebase Sync for New Shapes
- [ ] **Task Complete**

**Files Modified:**
- `src/services/canvasSync.ts` (sync new shape data)

**Data structure:**
```javascript
// Line
{ t: "l", pts: [x1, y1, x2, y2], arr: { s: true, e: false } }

// Polygon
{ t: "pg", x, y, w, h, sides: 5 }

// Star
{ t: "st", x, y, w, h, pts: 5 }

// Rounded rect
{ t: "rr", x, y, w, h, cr: 10 }
```

#### 16.11 Unit Tests for New Shapes
- [ ] **Task Complete**

**Files Created:**
- `tests/unit/hooks/useCanvas-advancedShapes.test.ts`

**Tests to verify:**
- `createLine()` creates line with correct endpoints
- `createPolygon()` validates sides (3-12)
- `createStar()` validates points (3-12)
- `createRoundedRect()` validates corner radius (0-50)
- All new shapes have default fill/stroke

#### 16.12 Integration Tests for New Shape Tools
- [ ] **Task Complete**

**Files Created:**
- `tests/integration/advancedShapes.test.tsx`

**Tests to verify:**
- Line tool: click and drag creates line
- Polygon tool creates pentagon by default
- Star tool creates 5-point star by default
- RoundedRect tool creates rectangle with rounded corners
- Properties panel shows shape-specific controls
- Adjusting sides/points/radius updates shape
- New shapes sync to other users

---

## PR-17: Z-Index Control

**Commit Message:** `feat: add layer ordering with bring to front and send to back`

**Goal:** Enable controlling stack order of overlapping shapes

### Subtasks

#### 17.1 Update Canvas Types for Z-Index
- [ ] **Task Complete**

**Files Modified:**
- `src/types/canvas.ts` (add zIndex property to Shape)

**New property:**
```typescript
interface Shape {
  // ... existing
  zIndex: number;  // higher = on top, default: creation timestamp
}
```

#### 17.2 Update Canvas Hook for Z-Index Operations
- [ ] **Task Complete**

**Files Modified:**
- `src/hooks/useCanvas.ts` (add z-index manipulation functions)

**New functions:**
- `bringToFront(ids: string[])` - Set zIndex to max+1
- `sendToBack(ids: string[])` - Set zIndex to min-1
- `bringForward(ids: string[])` - Increment zIndex by 1
- `sendBackward(ids: string[])` - Decrement zIndex by 1
- `sortShapesByZIndex()` - Return shapes sorted by zIndex

#### 17.3 Update Canvas Component to Render by Z-Index
- [ ] **Task Complete**

**Files Modified:**
- `src/components/Canvas.tsx` (sort shapes by zIndex before rendering)

**Requirements:**
- Render shapes in zIndex order (lowest first)
- Higher zIndex shapes appear on top

#### 17.4 Create Context Menu Component
- [ ] **Task Complete**

**Files Created:**
- `src/components/ContextMenu.tsx` (right-click menu)

**Menu items:**
- Bring to Front
- Bring Forward
- Send Backward
- Send to Back
- ---
- Copy
- Paste
- Duplicate
- Delete

#### 17.5 Add Context Menu to Canvas
- [ ] **Task Complete**

**Files Modified:**
- `src/components/Canvas.tsx` (handle right-click on shapes)

**Requirements:**
- Right-click shape → show context menu
- Position menu at mouse cursor
- Click outside → close menu
- Context menu actions call appropriate functions

#### 17.6 Keyboard Shortcuts Removed for Simplicity
- [x] **Task Complete** (DECISION: No keyboard shortcuts)

**Decision:**
- NO keyboard shortcuts for z-index to reduce conflicts and maintain simplicity
- Z-index accessible via context menu only
- Keeps total shortcuts to essential 9 commands

#### 17.7 Add Z-Index Commands to History
- [ ] **Task Complete**

**Files Created:**
- `src/commands/ZIndexCommand.ts` (undo/redo z-index changes)

**Requirements:**
- Store old zIndex values
- Restore on undo
- Re-apply on redo

#### 17.8 Update Firebase Sync for Z-Index
- [ ] **Task Complete**

**Files Modified:**
- `src/services/canvasSync.ts` (sync zIndex changes)

**Data structure:**
```javascript
canvas/objects/{id}: {
  // ... existing
  z: 1697234567890  // zIndex value (Firebase serverTimestamp)
}
```

**Migration:**
- Code defaults: `shape.z ?? Date.now()`
- Migration script to add serverTimestamp to existing shapes

#### 17.9 Handle Multi-Select Z-Index
- [ ] **Task Complete**

**Files Modified:**
- `src/hooks/useCanvas.ts` (batch z-index changes)

**Requirements:**
- Bring to front → set all selected to max+1, max+2, max+3, etc. (maintain relative order)
- Send to back → set all selected to min-1, min-2, min-3, etc. (maintain relative order)

#### 17.10 Unit Tests for Z-Index Logic
- [ ] **Task Complete**

**Files Created:**
- `tests/unit/hooks/useCanvas-zindex.test.ts`

**Tests to verify:**
- `bringToFront()` sets zIndex to max+1
- `sendToBack()` sets zIndex to min-1
- `bringForward()` increments zIndex
- `sendBackward()` decrements zIndex
- Multi-select maintains relative order
- `sortShapesByZIndex()` returns correctly ordered array

#### 17.11 Integration Tests for Z-Index UI
- [ ] **Task Complete**

**Files Created:**
- `tests/integration/zindex.test.tsx`

**Tests to verify:**
- Right-click shows context menu
- Context menu "Bring to Front" brings shape to top
- Context menu "Send to Back" sends shape to bottom
- Keyboard shortcuts work (Cmd+], Cmd+[)
- Z-index changes sync to other users
- Overlapping shapes render in correct order

---

## PR-18: Alignment & Distribution

**Commit Message:** `feat: add alignment and distribution tools`

**Goal:** Enable precise alignment of multiple objects

### Subtasks

#### 18.1 Create Alignment Service
- [ ] **Task Complete**

**Files Created:**
- `src/services/alignment.ts` (alignment calculation functions)

**Functions:**
- `alignLeft(shapes)` - Align to leftmost edge
- `alignCenter(shapes)` - Align to horizontal center
- `alignRight(shapes)` - Align to rightmost edge
- `alignTop(shapes)` - Align to topmost edge
- `alignMiddle(shapes)` - Align to vertical center
- `alignBottom(shapes)` - Align to bottommost edge
- `distributeHorizontally(shapes)` - Even horizontal spacing
- `distributeVertically(shapes)` - Even vertical spacing
- `centerInCanvas(shapes, canvasWidth, canvasHeight)` - Center in viewport

#### 18.2 Update Canvas Hook for Alignment
- [ ] **Task Complete**

**Files Modified:**
- `src/hooks/useCanvas.ts` (add alignment wrapper functions)

**New functions:**
- `alignSelected(type: AlignmentType)` - Align selected shapes
- `distributeSelected(direction: 'horizontal' | 'vertical')` - Distribute selected shapes

**Requirements:**
- Calculate new positions based on alignment type
- Update all selected shapes
- Create BulkCommand for undo/redo

#### 18.3 Create Alignment Toolbar Component
- [ ] **Task Complete**

**Files Created:**
- `src/components/AlignmentToolbar.tsx` (alignment button group)

**Buttons (with icons):**
- Align Left |◀
- Align Center |●|
- Align Right ▶|
- Align Top ⬆|
- Align Middle —●—
- Align Bottom |⬇
- ---
- Distribute Horizontally ←●●●→
- Distribute Vertically ↑●●●↓
- ---
- Center in Canvas ⊕

**Requirements:**
- Show only when 2+ shapes selected
- Disable distribute buttons when <3 shapes selected
- Visual feedback on hover

#### 18.4 Add Alignment Toolbar to Canvas Page
- [ ] **Task Complete**

**Files Modified:**
- `src/pages/CanvasPage.tsx` (add alignment toolbar above canvas)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Top Header: Users List                         │
├────┬────────────────────────────────────────────┤
│ T  │  [Alignment Toolbar - conditional]         │
│ o  ├────────────────────────────────────────────┤
│ l  │                                            │
│ b  │  Canvas Area                               │
│ a  │                                            │
│ r  │                                            │
└────┴────────────────────────────────────────────┘
```

#### 18.5 Keyboard Shortcuts Removed for Simplicity
- [x] **Task Complete** (DECISION: No keyboard shortcuts)

**Decision:**
- NO keyboard shortcuts for alignment to reduce conflicts and maintain simplicity
- Alignment accessible via toolbar and context menu only
- Keeps total shortcuts to essential 9 commands

#### 18.6 Add Alignment to Context Menu
- [ ] **Task Complete**

**Files Modified:**
- `src/components/ContextMenu.tsx` (add alignment submenu)

**Menu structure:**
```
Align >
  - Left
  - Center
  - Right
  - Top
  - Middle
  - Bottom
Distribute >
  - Horizontally
  - Vertically
---
Center in Canvas
---
Bring to Front
...
```

#### 18.7 Add Alignment Commands to History
- [ ] **Task Complete**

**Files Created:**
- `src/commands/AlignmentCommand.ts` (undo/redo alignment)

**Requirements:**
- Store old positions for all affected shapes
- Restore old positions on undo
- Re-apply alignment on redo
- Handle multi-shape operations

#### 18.8 Visual Guides During Alignment
- [ ] **Task Complete**

**Files Created:**
- `src/components/AlignmentGuides.tsx` (temporary visual guides)

**Requirements:**
- Show dashed lines during alignment preview (optional)
- Flash alignment line briefly after alignment (optional)
- Red line = horizontal alignment
- Blue line = vertical alignment

#### 18.9 Smart Guides (Snap to Align)
- [ ] **Task Complete**

**Files Modified:**
- `src/components/Canvas.tsx` (add snap-to-align during drag)

**Requirements:**
- While dragging shape, show guide lines when edges align with other shapes
- Snap to alignment (within 5px tolerance)
- Show temporary guide line
- Works for left/center/right/top/middle/bottom edges

#### 18.10 Unit Tests for Alignment Logic
- [ ] **Task Complete**

**Files Created:**
- `tests/unit/services/alignment.test.ts`

**Tests to verify:**
- `alignLeft()` moves all shapes to leftmost x
- `alignCenter()` aligns to average center x
- `alignRight()` moves all shapes to rightmost x + width
- `alignTop()` moves all shapes to topmost y
- `alignMiddle()` aligns to average center y
- `alignBottom()` moves all shapes to bottommost y + height
- `distributeHorizontally()` creates equal spacing
- `distributeVertically()` creates equal spacing
- `centerInCanvas()` centers selection in viewport

#### 18.11 Integration Tests for Alignment UI
- [ ] **Task Complete**

**Files Created:**
- `tests/integration/alignment.test.tsx`

**Tests to verify:**
- Alignment toolbar appears when 2+ shapes selected
- Alignment toolbar hidden when <2 shapes selected
- Align left button moves shapes to left edge
- Align center button centers shapes horizontally
- Distribute horizontally creates equal spacing
- Distribute requires 3+ shapes (button disabled with 2)
- Center in canvas moves shapes to viewport center
- Alignment changes sync to other users
- Undo restores pre-alignment positions
- Keyboard shortcuts trigger alignments
- `src/components/AlignmentToolbar.tsx` (alignment button group)

**Buttons (with icons):**
- Align Left |◀
- Align Center |●|
- Align Right ▶|
- Align Top ⬆|
- Align Middle —●—
- Align Bottom |⬇
- ---
- Distribute Horizontally ←●●●→
- Distribute Vertically ↑●●●↓
- ---
- Center in Canvas ⊕

**Requirements:**
- Show only when 2+ shapes selected
- Disable distribute buttons when <3 shapes selected
- Visual feedback on hover
