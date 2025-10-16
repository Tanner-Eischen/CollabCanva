# PR-30: AI Canvas Agent (MVP - Functional Implementation)

## Overview
**Duration:** 3-4 days  
**Priority:** P0 - Core AI Feature  
**Dependencies:** PR-28 (Tilemap MVP), PR-29 (Auto-Tiling)  
**Enables:** Phase 3 (Game Dev Tools), Phase 4 (AI Game-Aware)
**Architecture:** Server-side API calls via Firebase Functions  
**AI Provider:** OpenAI (GPT-4 with function calling)

## Objective
Implement AI-powered canvas manipulation through natural language commands. User types requests like "create a red circle" or "arrange these shapes in a grid" and OpenAI executes canvas operations via structured function calls. Tilemap operations use batch updates and integrate with auto-tiling.

**Focus:** Base AI agent functionality (shapes, tilemaps, layouts)  
**Deferred:** Sprite animation, UI/UX generation, advanced game tools (PR-31/32)

---

## Technical Specifications

### AI Tool Architecture (OpenAI Function Calling)
```typescript
// Tools are OpenAI functions the model can call
interface CanvasTool {
  name: string
  description: string
  parameters: {
    type: "object"
    properties: Record<string, any>
    required: string[]
  }
  execute: (params: any, context: CanvasContext) => Promise<ToolResult>
}

// Context provided to every tool
interface CanvasContext {
  canvasId: string
  userId: string
  selectedShapes: string[]
  viewport: { x: number, y: number, width: number, height: number, zoom: number }
  tilemapMeta?: TilemapMeta
  mode: 'shapes' | 'tilemap'
}

// Server-side request flow:
// Client → Firebase Function → OpenAI API → Execute Tools → Return Results → Client
```

### Tool Categories (MVP Focus)
1. **Shape Tools:** `createShape`, `deleteShapes`, `modifyShape`
2. **Transform Tools:** `moveShapes`, `resizeShape`, `rotateShapes`
3. **Layout Tools:** `arrangeShapes`, `alignShapes`, `distributeShapes`
4. **Tilemap Tools:** `generateTilemap`, `paintTileRegion`, `eraseTileRegion`
5. **Query Tools:** `getCanvasState`, `getSelectedShapes`

**Deferred to PR-31/32:**
- Grouping tools (use existing manual grouping)
- Sprite animation tools
- UI component generation
- Advanced game-specific tools

### AI Prompt Strategy (OpenAI)
- **System Prompt:** Defines GPT as canvas assistant, lists available functions
- **User Message:** Natural language request
- **Function Calls:** GPT calls appropriate functions with parameters
- **Function Results:** Returned to GPT for response formatting
- **Assistant Response:** GPT confirms action or asks clarifying questions

---

## Detailed Task List

### **Task Group 1: Server-Side AI Infrastructure (Day 1 Morning)**

#### Task 1.1: Create Firebase Function for AI Proxy
**File:** `functions/src/ai-proxy.ts` (NEW)
- [ ] Set up Firebase Functions project (if not exists)
- [ ] Install dependencies: `firebase-functions`, `openai`
- [ ] Implement `aiCanvasCommand` HTTPS callable function:
  - Validates user authentication
  - Rate limiting: 10 requests/minute per user (using Firebase Realtime DB counter)
  - Calls OpenAI API with system prompt + user message + functions
  - Includes canvas context from request
  - Handles function call responses
  - Returns assistant message + function results
- [ ] Add environment config for OpenAI API key
- [ ] Implement retry logic with exponential backoff (max 3 retries)
- [ ] Add comprehensive error handling
- [ ] Log requests for debugging (Firebase Logger)

**Environment Variables (functions/.env):**
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
```

#### Task 1.2: Create Client-Side AI Service
**File:** `src/services/ai.ts` (NEW)
- [ ] Implement `sendCanvasCommand(message, context)`:
  - Calls Firebase Function via `httpsCallable`
  - Formats context from current canvas state
  - Returns assistant response + tool results
- [ ] Handle API errors gracefully with user-friendly messages
- [ ] Add loading state management
- [ ] Add request timeout (30 seconds)

#### Task 1.3: Create Tool Registry (Server-Side)
**File:** `functions/src/ai/toolRegistry.ts` (NEW)
- [ ] Define `ToolDefinition` interface (OpenAI function format)
- [ ] Create `ToolRegistry` class:
  - `register(tool: ToolDefinition)`
  - `get(name: string): ToolDefinition`
  - `list(): ToolDefinition[]`
  - `toOpenAIFunctions(): OpenAIFunctionFormat[]` (converts to API format)
- [ ] Implement parameter validation using JSON schema
- [ ] Add tool execution wrapper (error handling, timing, logging)

#### Task 1.4: Create AI Context Builder (Server-Side)
**File:** `functions/src/ai/contextBuilder.ts` (NEW)
- [ ] Implement `buildSystemPrompt(context)`:
  - Describe canvas capabilities (shapes, tilemaps, layouts)
  - List available functions (automatically from registry)
  - Include current canvas state summary (shape count, mode, selection)
  - Add constraints: 
    - "Confirm before deleting >10 shapes"
    - "Max 100 shapes per command"
    - "Max 10,000 tiles per command"
  - Keep concise (~500 tokens)
- [ ] Implement context compression:
  - If >50 shapes: summarize by type (e.g., "20 rectangles, 15 circles")
  - Include full details only for selected shapes
  - Limit total context to 2000 tokens

---

### **Task Group 2: Shape Tools (Day 1 Late Morning/Afternoon)**

#### Task 2.1: Create Shape Tools (Server-Side)
**File:** `functions/src/ai/tools/shapeTools.ts` (NEW)
- [ ] Implement `createShape` function:
  - Parameters: `type` (rectangle|circle|ellipse|roundRect|polygon|star), `x`, `y`, `width`, `height`, `fill`, `stroke`, `rotation?`
  - Validates parameters (bounds check, color format)
  - Writes to Firebase: `canvases/{canvasId}/objects/{shapeId}`
  - Returns: `{ success: true, shapeId, message: "Created red circle at (100, 200)" }`
  
- [ ] Implement `deleteShapes` function:
  - Parameters: `shapeIds` (array of strings)
  - Validation: Requires confirmation if >10 shapes
  - Batch delete from Firebase
  - Returns: `{ success: true, deletedCount: 5, message: "Deleted 5 shapes" }`
  
- [ ] Implement `modifyShape` function:
  - Parameters: `shapeId`, `changes` (object with fill?, stroke?, width?, height?, rotation?)
  - Validates shape exists and changes are valid
  - Updates in Firebase
  - Returns: `{ success: true, message: "Modified shape properties" }`

#### Task 2.2: Create Transform Tools (Server-Side)
**File:** `functions/src/ai/tools/transformTools.ts` (NEW)
- [ ] Implement `moveShapes` function:
  - Parameters: `shapeIds` (array), `deltaX`, `deltaY` (relative) OR `toX`, `toY` (absolute for single shape)
  - Batch update positions in Firebase
  - Returns: `{ success: true, message: "Moved 5 shapes by (50, 100)" }`
  
- [ ] Implement `resizeShape` function:
  - Parameters: `shapeId`, `width`, `height`
  - Validates minimum size (>10px)
  - Updates dimensions in Firebase
  - Returns: `{ success: true, message: "Resized shape to 200x150" }`
  
- [ ] Implement `rotateShapes` function:
  - Parameters: `shapeIds` (array), `angle` (degrees)
  - Batch update rotations
  - Returns: `{ success: true, message: "Rotated 3 shapes by 45 degrees" }`

#### Task 2.3: Create Layout Tools (Server-Side)
**File:** `functions/src/ai/tools/layoutTools.ts` (NEW)
- [ ] Implement `arrangeShapes` function:
  - Parameters: `shapeIds` (array), `arrangement` (grid|row|column|circle), `spacing?`, `columns?` (for grid)
  - **Grid:** Arranges in N columns with spacing
  - **Row:** Horizontal line with spacing
  - **Column:** Vertical line with spacing
  - **Circle:** Arranges in circle with specified radius
  - Calculates all new positions
  - Batch update all shapes in single Firebase write
  - Returns: `{ success: true, message: "Arranged 12 shapes in 4x3 grid" }`
  
- [ ] Implement `distributeShapes` function:
  - Parameters: `shapeIds` (array), `direction` (horizontal|vertical)
  - Evenly spaces shapes between leftmost/rightmost (or top/bottom)
  - Batch update positions
  - Returns: `{ success: true, message: "Distributed 8 shapes horizontally" }`
  
- [ ] Implement `alignShapes` function:
  - Parameters: `shapeIds` (array), `alignment` (left|center|right|top|middle|bottom)
  - Aligns all shapes to common edge
  - Batch update positions
  - Returns: `{ success: true, message: "Aligned 6 shapes to left edge" }`

---

### **Task Group 3: Query Tools (Day 1 Late Afternoon)**

#### Task 3.1: Create Query Tools (Server-Side)
**File:** `functions/src/ai/tools/queryTools.ts` (NEW)
- [ ] Implement `getCanvasState` function:
  - Parameters: None
  - Fetches from Firebase: canvas metadata, all shapes (summary if >50)
  - Returns: `{ 
      mode: 'shapes'|'tilemap',
      shapeCount: 25,
      shapes: [{id, type, x, y, width, height, fill}],
      selectedShapes: ['id1', 'id2'],
      viewport: {x, y, width, height, zoom}
    }`
  
- [ ] Implement `getSelectedShapes` function:
  - Parameters: None
  - Returns full details of currently selected shapes
  - Returns: `{ shapes: [/* full shape objects */] }`

**Note:** Grouping tools deferred to PR-31 (use existing manual grouping for now)

---

### **Task Group 4: Tilemap Tools with Batch Operations (Day 2 Morning)**

#### Task 4.1: Create Batch Tilemap Service
**File:** `functions/src/services/tilemapBatch.ts` (NEW)
- [ ] Implement `batchSetTiles(canvasId, tiles[])`:
  - Takes array of {x, y, type, color?}
  - Groups tiles by chunk for efficient writes
  - Calculates auto-tile variants for each tile
  - Single Firebase update with all chunks
  - Returns: `{ tilesSet: count, chunksUpdated: count }`
  
- [ ] Implement `batchEraseTiles(canvasId, coordinates[])`:
  - Takes array of {x, y}
  - Groups by chunk
  - Removes tiles and recalculates neighbor variants
  - Single Firebase update
  - Returns: `{ tilesErased: count }`

#### Task 4.2: Create Tilemap Tools (Server-Side)
**File:** `functions/src/ai/tools/tilemapTools.ts` (NEW)
- [ ] Implement `paintTileRegion` function:
  - Parameters: `startX`, `startY`, `width`, `height`, `tileType`
  - Generates array of {x, y, type} for rectangular region
  - Calls `batchSetTiles()` for efficient update
  - Auto-tiling applied automatically
  - Returns: `{ success: true, tilesPainted: count, message: "Painted 100 grass tiles" }`
  
- [ ] Implement `eraseTileRegion` function:
  - Parameters: `startX`, `startY`, `width`, `height`
  - Generates coordinate array for region
  - Calls `batchEraseTiles()`
  - Returns: `{ success: true, tilesErased: count }`

#### Task 4.3: Create Tilemap Generation Algorithms
**File:** `functions/src/ai/tilemapGenerators.ts` (NEW)

Install: `npm install simplex-noise` in functions directory

- [ ] Implement `generateNoiseTerrain(params)`:
  ```typescript
  interface NoiseTerrainParams {
    width: number       // Tiles wide (max 100)
    height: number      // Tiles high (max 100)
    scale: number       // Noise scale (10-50, default 20)
    waterLevel: number  // 0-1, default 0.3 (30% water)
    sandLevel: number   // 0-1, default 0.45 (beaches)
    seed?: number       // Random seed for reproducibility
  }
  
  // Algorithm:
  // 1. Use simplex noise to generate height map
  // 2. Map noise values to tile types:
  //    < waterLevel → water
  //    < sandLevel  → dirt (sand/beach)
  //    >= sandLevel → grass
  // 3. Optional: Add flowers randomly on grass (5% chance)
  // 4. Return array of tiles
  ```
  
- [ ] Implement `generateCellularCaves(params)`:
  ```typescript
  interface CellularParams {
    width: number
    height: number
    fillProbability: number  // 0-1, default 0.45
    iterations: number       // 1-10, default 4
    birthLimit: number       // 3-5, default 4
    deathLimit: number       // 2-4, default 3
  }
  
  // Algorithm (Cellular Automata):
  // 1. Initialize grid with random fill
  // 2. For each iteration:
  //    - Count neighbors for each cell
  //    - Birth rule: if dead and neighbors >= birthLimit → alive
  //    - Death rule: if alive and neighbors < deathLimit → dead
  // 3. Alive cells = stone, dead = empty
  // 4. Add grass border around caves
  ```
  
- [ ] Implement `generateRandomWalk(params)`:
  ```typescript
  interface RandomWalkParams {
    startX: number
    startY: number
    steps: number           // 100-5000, default 500
    tileType: TileType
    turnProbability: number // 0-1, default 0.3
    maxTurns: number        // 1-8, default 4
  }
  
  // Algorithm:
  // 1. Start at (startX, startY)
  // 2. Choose random direction
  // 3. Walk N steps in that direction
  // 4. Randomly turn (based on probability)
  // 5. Paint tiles along path
  // 6. Great for rivers, roads, paths
  ```

#### Task 4.4: Implement generateTilemap Function
**File:** `functions/src/ai/tools/tilemapTools.ts` (EDIT)
- [ ] Implement `generateTilemap` function:
  - Parameters: `algorithm` (noise|cellular|randomWalk), algorithm-specific params
  - Calls appropriate generator function
  - Validates params (max 10,000 tiles)
  - Generates tile array
  - Calls `batchSetTiles()` for efficient Firebase write
  - Auto-tiling applied automatically
  - Returns: `{ 
      success: true, 
      tilesGenerated: count,
      algorithm: 'noise',
      message: "Generated 2500-tile terrain with water, sand, and grass"
    }`

---

### **Task Group 5: AI Chat Interface (Day 2 Afternoon)**

#### Task 5.1: Create AI Chat Panel
**File:** `src/components/ai/AIChatPanel.tsx` (NEW)
- [ ] Create collapsible bottom panel
- [ ] Input field with "Ask Claude..." placeholder
- [ ] Send button (or Enter to submit)
- [ ] Message history display:
  - User messages (right-aligned)
  - Assistant messages (left-aligned)
  - Tool execution indicators ("Creating shapes...")
  - Timestamps
- [ ] Auto-scroll to latest message
- [ ] Clear history button

#### Task 5.2: Create Message Components
**File:** `src/components/ai/MessageBubble.tsx` (NEW)
- [ ] Create `UserMessage` component (text only)
- [ ] Create `AssistantMessage` component:
  - Supports markdown formatting
  - Renders tool execution results
  - Shows loading state during API call
- [ ] Create `ToolExecutionCard` component:
  - Shows tool name + parameters
  - Shows result summary
  - Expandable for full details
  - Visual indicator (✓ success, ✗ error)

#### Task 5.3: Create AI Chat Hook
**File:** `src/hooks/useAIChat.ts` (NEW)
- [ ] Manage message state (array of messages)
- [ ] Implement `sendMessage(text)`:
  - Add user message to history
  - Build canvas context (canvasId, selectedShapes, viewport, mode)
  - Call Firebase Function via `httpsCallable('aiCanvasCommand')`
  - Add assistant response to history
  - Handle errors gracefully
- [ ] Implement `clearHistory()`
- [ ] Persist history to localStorage (max 20 messages for MVP)
- [ ] Add loading state
- [ ] Show toast notifications for tool execution results

---

### **Task Group 6: Tool Execution Engine (Day 3 Morning)**

#### Task 6.1: Create Tool Executor (Server-Side)
**File:** `functions/src/ai/toolExecutor.ts` (NEW)
- [ ] Implement `executeTool(name, params, context)`:
  - Lookup tool in registry
  - Validate parameters using JSON schema
  - Execute tool function with Firebase Admin SDK
  - Catch and format errors
  - Return: `{ success: boolean, data?: any, error?: string, duration: number }`
  
- [ ] Implement `executeToolChain(functionCalls, context)`:
  - Execute multiple function calls from OpenAI sequentially
  - Each tool gets fresh context (if needed)
  - Continue on error with error message returned to OpenAI
  - Return array of all results
  
- [ ] Add execution logging (Cloud Functions Logger)

#### Task 6.2: Undo/Redo Integration (Deferred to Polish Phase)
**Note:** For MVP, AI commands work but aren't added to undo/redo stack.  
Users can manually undo with Ctrl+Z, but it won't undo AI operations.  
Add `AICommand` class in future PR for full undo/redo support.

---

### **Task Group 7: Integration & UX (Day 3 Afternoon)**

#### Task 7.1: Add AI Toggle to Canvas
**File:** `src/components/canvas/Canvas.tsx` (EDIT)
- [ ] Add "AI Assistant" button to toolbar
- [ ] Toggle shows/hides AI chat panel
- [ ] Keyboard shortcut: `Cmd/Ctrl + K`
- [ ] Panel slides up from bottom (animated)
- [ ] Remembers open/closed state (localStorage)

#### Task 7.2: Add Example Commands (Simple)
**File:** `src/components/ai/AIChatPanel.tsx` (EDIT)
- [ ] Show 3-5 example commands as buttons when panel opens:
  - "Create 5 red circles"
  - "Arrange selected shapes in a grid"
  - "Generate a small terrain tilemap"
  - "Align shapes to the left"
- [ ] Click button to auto-fill and send
- [ ] Hide examples after first message

**Note:** AI Suggestions and Visual Feedback deferred to polish phase (PR-31)

---

### **Task Group 8: Error Handling & Safety (Day 3 Late Afternoon)**

#### Task 8.1: Add Tool Validation (Server-Side)
**File:** `functions/src/ai/validation.ts` (NEW)
- [ ] Implement parameter validators:
  - Check required fields present
  - Validate types (number, string, array)
  - Validate ranges:
    - x/y within canvas bounds (0-5000)
    - Colors are valid hex codes
    - Tile types are valid (grass|dirt|water|stone|flower)
  - Validate shape IDs exist in Firebase
- [ ] Return formatted error messages
- [ ] Examples: 
  - "x must be between 0 and 5000"
  - "Invalid tile type 'graas', did you mean 'grass'?"

#### Task 8.2: Add Safety Constraints (Server-Side)
**File:** `functions/src/ai/safety.ts` (NEW)
- [ ] Implement constraint checks:
  - Max shapes per command: 100
  - Max tiles per command: 10,000
  - Prevent infinite loops: timeout after 25 seconds
  - Rate limiting: 10 requests/minute per user (tracked in Firebase)
- [ ] Return warnings (don't block):
  - "Creating 50 shapes, this may take a moment"
  - "Generating 5000 tiles, please wait..."
- [ ] Hard limits with clear errors:
  - "Cannot create more than 100 shapes at once"
  - "Cannot generate more than 10,000 tiles"

#### Task 8.3: Add Error Recovery
**File:** `src/hooks/useAIChat.ts` (EDIT)
- [ ] Handle Firebase Function errors:
  - Network failures → "Connection lost, please try again"
  - Rate limits → "Too many requests, wait 60 seconds"
  - OpenAI errors → "AI service unavailable, try again shortly"
  - Tool execution errors → Show specific error from function
- [ ] Show user-friendly error messages in chat
- [ ] Add retry button for failed requests
- [ ] Log errors to console for debugging

---

### **Task Group 9: Testing & Documentation (Day 4)**

#### Task 9.1: Manual Testing Checklist
**Priority:** Test core functionality manually first
- [ ] Test: "create a red circle" → circle appears
- [ ] Test: "create 5 blue rectangles" → 5 rectangles appear
- [ ] Test: "move selected shapes right 100 pixels"
- [ ] Test: "arrange selected shapes in a grid"
- [ ] Test: "align shapes to the left"
- [ ] Test: "generate a small terrain tilemap 20x20"
- [ ] Test: "paint grass tiles in a 5x5 area at 0,0"
- [ ] Test: Error handling → invalid command shows error
- [ ] Test: Rate limiting → too many requests blocked
- [ ] Test: Both shape mode and tilemap mode

#### Task 9.2: Unit Tests (Basic Coverage)
**Firebase Functions:**
- [ ] Test tool parameter validation
- [ ] Test rate limiting logic
- [ ] Test tool execution (mock Firebase)

**Client:**
- [ ] Test useAIChat hook (mock Firebase Function)
- [ ] Test message history management

#### Task 9.3: Documentation (MVP Level)
**File:** `docs/AI_COMMANDS.md` (NEW)
- [ ] List all available tools with examples:
  - **Shape Tools:** createShape, deleteShapes, modifyShape
  - **Transform:** moveShapes, resizeShape, rotateShapes
  - **Layout:** arrangeShapes, alignShapes, distributeShapes
  - **Tilemap:** paintTileRegion, eraseTileRegion, generateTilemap
  - **Query:** getCanvasState, getSelectedShapes
- [ ] Provide 15-20 example commands
- [ ] Include tilemap generation examples with parameters
- [ ] Document rate limits and constraints

**Note:** Comprehensive E2E tests deferred to PR-31

---

## Acceptance Criteria

### Functionality (MVP)
- [ ] User can send natural language commands via AI panel
- [ ] OpenAI correctly interprets and executes commands via function calling
- [ ] All 13 core tools work correctly:
  - 3 shape tools (create, delete, modify)
  - 3 transform tools (move, resize, rotate)
  - 3 layout tools (arrange, align, distribute)
  - 3 tilemap tools (paintRegion, eraseRegion, generate)
  - 2 query tools (getCanvasState, getSelectedShapes)
- [ ] Tilemap generation uses batch operations (efficient)
- [ ] Tilemap tools integrate with auto-tiling system
- [ ] Error messages are clear and actionable

### User Experience (MVP)
- [ ] AI panel accessible via button/keyboard shortcut
- [ ] Responses appear within 3-8 seconds
- [ ] Example commands help users get started
- [ ] Loading indicator shows during AI processing
- [ ] Toast notifications confirm actions

### Safety & Reliability
- [ ] API key secured on server-side (Firebase Functions)
- [ ] Invalid commands return helpful error messages
- [ ] Rate limiting prevents abuse (10 req/min)
- [ ] Tool execution has timeout (25s)
- [ ] Batch operations prevent UI freezing
- [ ] Max constraints enforced (100 shapes, 10K tiles)

### Code Quality
- [ ] Firebase Functions properly structured
- [ ] Tools use consistent return format
- [ ] Parameter validation for all tools
- [ ] Error handling throughout stack
- [ ] Code documented with JSDoc comments

---

## Files Summary

### New Server-Side Files (Firebase Functions) - 11 files
1. `functions/src/ai-proxy.ts` - Main AI endpoint
2. `functions/src/ai/toolRegistry.ts` - Tool registration system
3. `functions/src/ai/contextBuilder.ts` - System prompt builder
4. `functions/src/ai/validation.ts` - Parameter validation
5. `functions/src/ai/safety.ts` - Rate limiting & constraints
6. `functions/src/ai/toolExecutor.ts` - Tool execution engine
7. `functions/src/ai/tools/shapeTools.ts` - Shape manipulation tools
8. `functions/src/ai/tools/transformTools.ts` - Transform tools
9. `functions/src/ai/tools/layoutTools.ts` - Layout/arrangement tools
10. `functions/src/ai/tools/queryTools.ts` - Canvas state queries
11. `functions/src/ai/tools/tilemapTools.ts` - Tilemap tools
12. `functions/src/ai/tilemapGenerators.ts` - Terrain generation algorithms
13. `functions/src/services/tilemapBatch.ts` - Batch tilemap operations

### New Client-Side Files - 5 files
1. `src/services/ai.ts` - Client AI service (calls Firebase Function)
2. `src/components/ai/AIChatPanel.tsx` - Chat UI
3. `src/components/ai/MessageBubble.tsx` - Message components
4. `src/hooks/useAIChat.ts` - Chat state management

### New Documentation - 1 file
1. `docs/AI_COMMANDS.md` - Tool documentation & examples

### Edited Files (2)
1. `src/pages/CanvasPage.tsx` - Add AI panel toggle
2. `src/components/Toolbar.tsx` - Add AI button

### Dependencies to Add
**Functions:**
```bash
cd functions
npm install openai simplex-noise
```

---

## Environment Variables

**Firebase Functions** (`functions/.env`):
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.2
```

**Client** (`.env.local` - if needed):
```bash
# No OpenAI key on client! All calls go through Firebase Functions
VITE_AI_ENABLED=true
```

---

## Risk Mitigation

### Risk: API Costs
**Mitigation:** 
- Rate limiting (10 req/min per user)
- Token limits (2000 max per request)
- Server-side API key (no client abuse)
- Monitor usage in Firebase Console

### Risk: Slow Response Times
**Mitigation:**
- Loading indicators in UI
- Batch operations for tilemaps (1 Firebase write vs 1000)
- Optimized context size (compress canvas state)
- Timeout after 25 seconds

### Risk: Incorrect Tool Execution
**Mitigation:**
- Parameter validation on server
- Clear error messages
- Toast notifications for results
- Hard limits (100 shapes, 10K tiles max)

### Risk: Security
**Mitigation:**
- API key on server only (Firebase Functions)
- Firebase Auth required for all requests
- No arbitrary code execution
- Strict parameter validation
- Rate limiting per authenticated user

---

## Next Steps After PR-30

### Polish & Enhancements (Optional - PR-30.5)
- Add streaming responses (show AI "typing")
- Add undo/redo integration (AICommand class)
- Add visual feedback (highlight modified shapes)
- Add contextual suggestions
- Add AI onboarding

### Future PRs
→ **PR-31:** Game Dev Tools (sprite animation, custom tilesets, physics preview)  
→ **PR-32:** AI Game-Aware (enhanced AI with game-specific knowledge, multi-turn conversations)

---

## Implementation Notes

### Server-Side Architecture Benefits
1. **Security:** API key never exposed to client
2. **Cost Control:** Enforce rate limits reliably
3. **Flexibility:** Easy to switch AI providers
4. **Monitoring:** Track usage in Firebase Console
5. **Scalability:** Functions auto-scale with demand

### Batch Operations Performance
- **Before:** 1000 individual Firebase writes = 5-10 seconds, UI freeze
- **After:** 1 batched Firebase write = <500ms, no UI freeze
- Critical for tilemap generation

### OpenAI vs Anthropic
- OpenAI function calling is well-documented and reliable
- GPT-4 Turbo is fast (2-5 second responses)
- Cheaper than Claude Opus
- Easy to add Claude support later if desired

---

## Timeline Estimate (Revised)

**Day 1:** Server infrastructure + shape tools (6-8 hours)  
**Day 2:** Transform + layout tools + tilemap batch ops (6-8 hours)  
**Day 3:** Tilemap generation algorithms + client UI (6-8 hours)  
**Day 4:** Testing + error handling + documentation (4-6 hours)

**Total:** 3-4 full days for functional MVP

---

**Status:** Ready for implementation  
**Last Updated:** 2025-01-16