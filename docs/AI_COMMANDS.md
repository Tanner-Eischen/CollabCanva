# AI Canvas Agent - Command Reference

## Overview

The AI Canvas Agent allows you to manipulate the canvas using natural language commands. Simply type what you want to do, and the AI will execute the appropriate operations.

## How to Use

1. Click the 🤖 button in the bottom-right corner to open the AI Assistant
2. Type your command in natural language
3. Press Enter or click "Send"
4. The AI will execute the operation and confirm success

## Command Categories

### 🎨 Shape Commands

#### Create Shapes
Create new shapes on the canvas.

**Examples:**
- "Create a red circle at (200, 200)"
- "Add a blue rectangle at position 300, 150 with size 200x100"
- "Make a yellow star at (400, 400)"
- "Create a text shape that says 'Hello World' at (100, 100)"

**Supported Shape Types:**
- rectangle, circle, ellipse
- star, polygon
- line, path
- text, rounded-rect

#### Delete Shapes
Remove shapes from the canvas.

**Examples:**
- "Delete the selected shapes"
- "Remove all circles"
- "Delete shape with ID shape-123"

#### Modify Shapes
Change properties of existing shapes.

**Examples:**
- "Change the color of selected shapes to green"
- "Make the selected shape 50% transparent"
- "Set the stroke width to 5"
- "Change the text to 'Updated Text'"

---

### 🔄 Transform Commands

#### Move Shapes
Reposition shapes on the canvas.

**Examples:**
- "Move selected shapes to (500, 500)"
- "Move all shapes right by 100 pixels"
- "Shift the selected shape down by 50"

#### Resize Shapes
Change the dimensions of shapes.

**Examples:**
- "Resize selected shape to 300x200"
- "Make the circle 150 pixels wide"
- "Scale selected shapes to 200x200 maintaining aspect ratio"

#### Rotate Shapes
Rotate shapes by an angle.

**Examples:**
- "Rotate selected shapes by 45 degrees"
- "Set rotation to 90 degrees"
- "Rotate the rectangle clockwise by 30 degrees"

---

### 📐 Layout Commands

#### Arrange Shapes
Organize shapes in grids, rows, or columns.

**Examples:**
- "Arrange selected shapes in a grid"
- "Arrange all shapes in a row with 20px spacing"
- "Layout shapes in a 3-column grid starting at (100, 100)"
- "Arrange shapes in a column"

#### Distribute Shapes
Space shapes evenly.

**Examples:**
- "Distribute selected shapes horizontally"
- "Space shapes evenly vertically"
- "Distribute all shapes with equal spacing"

#### Align Shapes
Align shapes to common edges or centers.

**Examples:**
- "Align selected shapes to the left"
- "Align all shapes to the top"
- "Center shapes horizontally"
- "Align shapes to the right edge"

**Alignment Options:**
- left, right, top, bottom
- center-horizontal, center-vertical

---

### 🗺️ Tilemap Commands

#### Paint Tiles
Paint rectangular regions with tiles.

**Examples:**
- "Paint grass tiles from (0,0) to (10,10)"
- "Fill rows 5-15, columns 5-15 with water tiles"
- "Paint a stone path from (10,10) to (20,10)"

**Tile Types:**
- grass, dirt, water, stone, flower

#### Erase Tiles
Remove tiles from regions.

**Examples:**
- "Erase tiles from (5,5) to (10,10)"
- "Clear the tiles in rows 0-20, columns 0-20"

#### Generate Tilemaps
Create procedural tilemaps using algorithms.

**Examples:**
- "Generate a 50x50 noise terrain tilemap"
- "Create a 40x40 cave tilemap"
- "Generate a 30x30 path tilemap with 2-tile wide paths"
- "Make a 60x60 island tilemap"

**Algorithms:**
- **noise**: Natural terrain using Simplex Noise (good for outdoor landscapes)
- **caves**: Organic cave structures using Cellular Automata
- **paths**: Winding paths using Random Walk algorithm
- **island**: Island surrounded by water

**Parameters:**
- `width`, `height`: Tilemap dimensions (1-500)
- `scale`: Noise scale for terrain (default: 0.1)
- `fillProbability`: Wall density for caves (default: 0.45)
- `pathWidth`: Width of paths (default: 1)

---

### 🔍 Query Commands

#### Get Canvas State
Retrieve information about the canvas.

**Examples:**
- "What shapes are on the canvas?"
- "Show me the canvas state"
- "How many shapes are there?"
- "What's the tilemap size?"

#### Get Selected Shapes
Get details about selected shapes.

**Examples:**
- "What shapes are selected?"
- "Tell me about the selected shapes"
- "Show selected shape properties"

---

## Tips & Best Practices

### 1. Be Specific
✅ "Create a red circle at (200, 200) with radius 50"  
❌ "Make a shape"

### 2. Use Coordinates
✅ "Move shapes to (300, 400)"  
❌ "Move shapes over there"

### 3. Specify Selection
✅ "Delete selected shapes"  
✅ "Change color of all circles to blue"  
❌ "Delete them" (ambiguous)

### 4. Batch Operations
For efficiency, combine operations:
- "Create 5 circles in a row from (100, 100) to (500, 100)" ✅
- Instead of creating one circle at a time ❌

### 5. Use Natural Language
The AI understands conversational commands:
- "Can you move the selected shapes to the right by 100 pixels?"
- "Please create a red rectangle at position 200, 300"

### 6. Tilemap Generation
For procedural tilemaps, experiment with parameters:
- **Small scale** (0.05): More variation, islands/regions
- **Large scale** (0.2): Smoother, larger features
- **Cave fill** (0.3-0.5): Adjust wall/floor ratio

---

## Limitations

### Safety Constraints
- **Max shapes per command**: 100
- **Max tiles per command**: 10,000
- **Canvas bounds**: 0-5000 pixels
- **Tilemap max size**: 500x500 tiles
- **Rate limit**: 10 requests per minute

### Confirmation Required
Operations that delete more than 10 shapes require confirmation:
```
"Delete 50 shapes" → "Are you sure? Add confirm=true"
```

---

## Error Handling

### Common Errors

**"Rate limit exceeded"**
- Wait 60 seconds before sending another command
- Combine multiple operations into one command

**"Canvas bounds exceeded"**
- Coordinates must be between 0-5000
- AI will clamp to safe bounds automatically

**"Too many shapes"**
- Canvas limit: 1000 shapes total
- Consider deleting unused shapes

**"Invalid tile type"**
- Use only: grass, dirt, water, stone, flower
- Check spelling and case

---

## Examples by Use Case

### Game Level Design
```
1. "Generate a 50x50 noise terrain tilemap"
2. "Paint a stone path from (10,10) to (40,40)"
3. "Add water tiles around rows 0-5, columns 0-50"
```

### UI Mockup
```
1. "Create 3 rectangles in a row at (100,100) with 20px spacing"
2. "Align all rectangles to the top"
3. "Make the rectangles blue, green, and red"
```

### Data Visualization
```
1. "Create 10 circles in a grid"
2. "Arrange them in a 5x2 grid starting at (200,200)"
3. "Resize all circles to match data values"
```

---

## Keyboard Shortcuts

While using the AI Assistant:
- **Enter**: Send message
- **Shift+Enter**: New line in message
- **Escape**: Close AI panel

---

## Future Capabilities (Coming Soon)

- Group operations ("Group selected shapes")
- Animation commands ("Animate shape from A to B")
- Sprite management ("Create sprite from tileset")
- Complex queries ("Find all red shapes larger than 100px")
- Undo/Redo integration ("Undo last 3 AI operations")

---

## Need Help?

If the AI doesn't understand your command:
1. Try rephrasing in simpler terms
2. Break complex operations into steps
3. Use the example commands as templates
4. Check the console for detailed error messages

For bugs or feature requests, please file an issue on GitHub.

