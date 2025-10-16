# CollabCanvas

A professional real-time collaborative design tool built with React, TypeScript, Konva.js, and Firebase Realtime Database. Features both vector shape editing and tilemap creation modes with seamless real-time collaboration.

## 🚀 Live Demo

**Deployed Application:** [https://collabcanvas-realtime.web.app](https://collabcanvas-realtime.web.app)

## ✨ Features

### 🎨 Shape Canvas Mode
- **Professional Toolbar**: Figma-style left sidebar with all essential drawing tools
- **Shape Creation**: Rectangles, circles, rounded rectangles, polygons, stars, lines, and text
- **Freehand Drawing**: Pencil and pen tools with smooth path rendering
- **Advanced Selection**: Multi-select with drag-to-select, shift-click, and visual selection boxes
- **Layer Management**: Right panel with drag-to-reorder, visibility/lock toggles, and grouping
- **Transform Tools**: Resize, rotate, and transform shapes with precision
- **Design Panel**: Color picker with recent colors, stroke settings, and text formatting
- **Alignment Tools**: Align, distribute, and center multiple selected shapes
- **Z-Index Control**: Bring to front, send to back, forward, and backward
- **Copy/Paste/Duplicate**: Full clipboard support for shapes
- **Undo/Redo**: Comprehensive command history with full state management
- **Status Bar**: Real-time metrics showing shape count, selection, zoom, and connection status

### 🗺️ Tilemap Mode
- **Tile Palette**: Expandable left panel with multiple tile types (grass, dirt, water, stone, flower)
- **Brush Tools**: Stamp, erase, fill, and pick modes
- **Brush Sizes**: 1x1, 2x2, and 3x3 tile brushes
- **Auto-tiling**: Intelligent tile placement with 9-variant system
- **Grid Toggle**: Show/hide grid overlay
- **Color Override**: Apply custom colors to tiles
- **Undo/Redo**: Full tilemap editing history
- **Export Options**: Export as JSON or PNG
- **Status Bar**: Cursor position, tile count, mode, zoom, and connection status

### 🤝 Real-Time Collaboration
- **Live Cursors**: See collaborators' cursors with smooth 30Hz updates
- **Selection Sync**: View what others have selected in real-time
- **User Presence**: See who's online with color-coded avatars
- **Conflict Resolution**: Automatic conflict handling with Last-Write-Wins strategy
- **Optimistic Updates**: Zero-latency feel for local actions
- **Performance Optimized**: Supports 50+ concurrent users per canvas

### 🎯 Core Features
- **Firebase Authentication**: Secure email/password login
- **Canvas Navigation**: Pan with hand tool or Space+drag, zoom with mouse wheel
- **Keyboard Shortcuts**: Full keyboard support for all major actions
- **Grid Snapping**: 8px grid for precise alignment
- **Context Menu**: Right-click for quick actions
- **Quick Actions**: Floating toolbar when shapes are selected
- **Export Canvas**: Download as JSON or PNG

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript 5.9, Vite 7
- **Canvas Rendering**: Konva.js + React Konva
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Auth (Email/Password)
- **Hosting**: Firebase Hosting
- **Testing**: Vitest + Testing Library (101 tests, 99%+ coverage)
- **Performance**: Throttled updates, optimistic UI, conflict resolution

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Realtime Database and Authentication enabled

## 🔧 Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tanner-Eischen/CollabCanva.git
   cd CollabCanva
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_DATABASE_URL=your_database_url
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Set up Firebase Database Rules**
   
   Deploy the database rules:
   ```bash
   firebase deploy --only database
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open `http://localhost:5173`

## 🚀 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run deploy       # Build and deploy to Firebase
npm test             # Run test suite
npm run test:ui      # Open Vitest UI
npm run test:coverage # Generate coverage report
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🧪 Testing

### Test Coverage

Our test suite includes **101 tests** with **99%+ coverage**:

- **Services**: 99.06% coverage
- **Hooks**: 95.52% coverage  
- **Components**: 96%+ coverage
- **Utils**: 100% coverage

**Key Test Files:**
1. Authentication service and flow
2. Canvas sync and data compression
3. Shape management and hooks
4. Real-time synchronization
5. Cursor throttling (30Hz)

See `TESTING.md` for comprehensive manual testing checklist.

## 🌐 Deployment

### Automated Deployment

```bash
npm run deploy
```

This will:
1. Build the application
2. Deploy to Firebase Hosting
3. Update your live site

### Manual Deployment

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting

# Deploy database rules
firebase deploy --only database
```

## 🎯 Key Features Breakdown

### Shape Tools
- **Select Tool (V)**: Click to select, drag to move, shift-click for multi-select
- **Hand Tool (H)**: Pan the canvas, or use Space+drag
- **Rectangle (R)**: Click to create rectangles
- **Circle (O)**: Click to create circles
- **Line (L)**: Click twice to create lines
- **Pencil (P)**: Freehand drawing with smooth paths
- **Pen (N)**: Freehand drawing with curved paths
- **Text (T)**: Click to add text, double-click to edit
- **Advanced Shapes**: Polygons, stars, rounded rectangles

### Keyboard Shortcuts
- **V**: Select tool
- **H**: Hand tool
- **R**: Rectangle
- **O**: Circle
- **L**: Line
- **P**: Pencil
- **N**: Pen
- **T**: Text
- **Space**: Temporary hand tool (pan)
- **Delete/Backspace**: Delete selected
- **Cmd/Ctrl + C**: Copy
- **Cmd/Ctrl + V**: Paste
- **Cmd/Ctrl + D**: Duplicate
- **Cmd/Ctrl + Z**: Undo
- **Cmd/Ctrl + Shift + Z**: Redo
- **Cmd/Ctrl + A**: Select all
- **Escape**: Clear selection

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CollabCanvas Application                  │
│                  (React + TypeScript + Konva)                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PresenceBar (Top 48px)                  │   │
│  │  Title | Zoom | Mode Toggle | Export | Users        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌────┬──────────────────────────────────────────┬──────┐   │
│  │Tool│                                          │Layer │   │
│  │bar │         Canvas (Main Area)              │Panel │   │
│  │    │    - Shape/Tilemap Rendering            │      │   │
│  │48px│    - Real-time Collaboration            │256px │   │
│  │    │    - Konva Stage                        │      │   │
│  └────┴──────────────────────────────────────────┴──────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Status Bar (Bottom 40px)                  │   │
│  │  Shapes | Selected | Zoom | Connection              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Backend                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Firebase   │  │   Realtime   │  │   Firebase   │      │
│  │ Authentication│  │   Database   │  │   Hosting    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Structure

**Core Pages:**
- `CanvasPage.tsx` - Main canvas page (landing page)

**Canvas Components:**
- `Canvas.tsx` - Mode switcher between shape and tilemap
- `ShapeCanvas.tsx` - Vector shape editing canvas
- `TilemapCanvas.tsx` - Tilemap editing canvas

**UI Components:**
- `PresenceBar.tsx` - Top header with users and controls
- `Toolbar.tsx` - Left sidebar with tools (shape mode)
- `LayerPanel.tsx` - Right sidebar with layers and design
- `TilePalette.tsx` - Left sidebar for tilemap (tilemap mode)
- `ShapeStatusBar.tsx` - Bottom status bar (shape mode)
- `TileStatusBar.tsx` - Bottom status bar (tilemap mode)

**Hooks:**
- `useAuth.ts` - Authentication state
- `useCanvas.ts` - Shape management and sync
- `usePresence.ts` - User presence and cursors
- `useGroups.ts` - Shape grouping
- `useLayers.ts` - Layer management
- `useSpriteCache.ts` - Tilemap sprite caching

**Services:**
- `firebase.ts` - Firebase initialization
- `auth.ts` - Authentication operations
- `canvasSync.ts` - Real-time synchronization
- `conflictResolution.ts` - Concurrent edit handling
- `commandHistory.ts` - Undo/redo system

## 📊 Performance

### Optimizations Implemented

1. **Cursor Updates**: 30Hz (33ms) throttled updates for smooth movement
2. **Shape Sync**: Throttled and batched for efficiency
3. **Data Compression**: 60% smaller payloads using short keys
4. **Optimistic Updates**: Zero-latency local changes
5. **Conflict Resolution**: Last-Write-Wins with timestamps
6. **Lazy Loading**: On-demand sprite loading for tilemaps

### Performance Metrics

- **Cursor Latency**: < 50ms perceived
- **Shape Updates**: < 150ms remote sync
- **Network Usage**: ~600 bytes/sec per user
- **Capacity**: 50+ concurrent users per canvas

See `PERFORMANCE_OPTIMIZATIONS.md` for detailed performance documentation.

## 🔒 Security

- **Authentication**: Firebase Auth with email/password
- **Database Rules**: Read/write access control per canvas
- **CORS**: Configured for Firebase domains only
- **Rate Limiting**: Built-in Firebase rate limits
- **Data Validation**: Client and server-side validation

## 🐛 Known Issues & Limitations

- Canvas size: 5000x5000px (performance optimized)
- Max concurrent users: ~50 per canvas
- Text editing: Basic formatting only
- Tilemap: Fixed 32x32px tile size
- Image uploads: Not yet supported

## 🗺️ Roadmap

### Planned Features
- [ ] Image upload and rendering
- [ ] More shape types (arrows, callouts)
- [ ] Comments and annotations
- [ ] Version history
- [ ] Team workspaces
- [ ] Custom tile creation
- [ ] Animation timeline

### Performance Improvements
- [ ] WebRTC for P2P cursor sync
- [ ] Canvas chunking for large canvases
- [ ] Differential sync
- [ ] Read replicas for viewers

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm test` and `npm run lint`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👏 Acknowledgments

- Built with React, Konva.js, and Firebase
- Inspired by Figma's collaborative design tools
- Tilemap system inspired by Tiled Map Editor

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: tanner.eischen@example.com

---

**Built with ❤️ using React, TypeScript, and Firebase**
