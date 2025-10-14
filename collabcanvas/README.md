# CollabCanvas

A real-time collaborative design tool (Figma-inspired MVP) built with React, TypeScript, Konva.js, and Firebase Realtime Database.

## 🚀 Live Demo

**Deployed Application:** [https://collabcanvas-realtime.web.app](https://collabcanvas-realtime.web.app)

## ✨ Features

- **Real-time Collaboration**: Multiple users can work on the same canvas simultaneously
- **Shape Creation**: Create rectangles and circles (fixed 100x100px, blue color)
- **Text Objects**: Add text elements to the canvas
- **Pan & Zoom**: Navigate the canvas with mouse drag (pan) and scroll wheel (zoom)
- **Live Cursors**: See other users' cursor positions in real-time (20Hz updates)
- **Selection Sync**: View which objects other users have selected
- **User Presence**: See who's online with their email/name in the presence bar
- **Firebase Authentication**: Secure email/password authentication
- **Hard Boundaries**: 5000x5000px canvas with enforced boundaries
- **Grid Background**: 50px spacing grid for visual reference
- **Error Handling**: Error boundaries to prevent app crashes
- **Performance Monitoring**: Built-in FPS and performance tracking utilities

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Canvas Rendering**: Konva.js + React Konva
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Auth (Email/Password)
- **Hosting**: Firebase Hosting
- **Testing**: Vitest + Testing Library
- **Build Tool**: Vite 7
- **Type Checking**: TypeScript 5.9

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project credentials

## 🔧 Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tanner-Eischen/CollabCanva.git
   cd collabcanvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a `.env.local` file in the root directory with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_DATABASE_URL=your_database_url
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_CANVAS_ID=default-canvas
   ```

4. **Set up Firebase Database Rules**
   
   Deploy the database rules to your Firebase project:
   ```bash
   firebase deploy --only database
   ```

## 🚀 Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🧪 Testing

### Running Tests

```bash
npm test              # Run tests once
npm run test:ui       # Open Vitest UI
npm run test:coverage # Generate coverage report
```

### Test Coverage

Our test suite includes 101 tests across 7 test files with the following coverage:

**Critical Business Logic Coverage:**
- **Services**: 99.06% coverage
  - `auth.ts`: 98.48%
  - `canvasSync.ts`: 99.26%
  - `firebase.ts`: 100%
- **Hooks**:
  - `useCanvas.ts`: 95.52%
- **Components**:
  - `Login.tsx`: 96.15%
  - `ProtectedRoute.tsx`: 100%
  - `Toolbar.tsx`: 100%
- **Utils**:
  - `throttle.ts`: 100%

**Test Files:**
1. `tests/unit/utils/throttle.test.ts` - Cursor throttling at 20Hz
2. `tests/unit/services/auth.test.ts` - Authentication service
3. `tests/unit/services/canvasSync.test.ts` - Data compression & sync
4. `tests/unit/hooks/useCanvas.test.ts` - Shape management logic
5. `tests/integration/authentication.test.tsx` - Auth flow integration
6. `tests/integration/shapeCreation.test.tsx` - Shape creation integration
7. `tests/integration/realTimeSync.test.tsx` - Real-time sync integration

### Manual Testing

See `TESTING.md` for a comprehensive manual testing checklist covering all MVP features.

## 📦 Build

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 🌐 Deployment

Deploy to Firebase Hosting:

```bash
npm run deploy
```

This command will:
1. Build the application for production
2. Deploy to Firebase Hosting

### Manual Deployment

If you prefer to deploy manually:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy --only hosting
   ```

The application will be live at your Firebase Hosting URL.

## 🎯 MVP Scope

### Included Features
- ✅ Real-time shape creation (rectangles, circles)
- ✅ Real-time text objects
- ✅ Cursor position sync (20Hz)
- ✅ Selection state sync
- ✅ Pan and zoom
- ✅ Email/password authentication
- ✅ User presence indicator
- ✅ Delete shapes (keyboard + toolbar)

### Explicitly Excluded
- ❌ Resize functionality
- ❌ Konva Transformers
- ❌ Color picker (all shapes are blue #3B82F6)
- ❌ Text editing after creation
- ❌ Properties panel
- ❌ Multi-select
- ❌ Copy/paste
- ❌ Undo/redo

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CollabCanvas Frontend                   │
│                    (React + TypeScript + Konva)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PresenceBar  │  │   Toolbar    │  │    Canvas    │      │
│  │ (Top Header) │  │  (Left Side) │  │  (Main Area) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│         ┌──────────────────┴──────────────────┐             │
│         │                                      │             │
│    ┌────▼────┐  ┌──────────┐  ┌─────────────┐│             │
│    │useAuth  │  │usePresence│  │ useCanvas   ││             │
│    └────┬────┘  └────┬──────┘  └─────┬───────┘│             │
│         │            │                │        │             │
│    ┌────▼────────────▼────────────────▼───────┐│             │
│    │      Firebase Services Layer             ││             │
│    │  (auth.ts, canvasSync.ts, firebase.ts)  ││             │
│    └────┬──────────────┬──────────────┬───────┘│             │
│         │              │              │        │             │
└─────────┼──────────────┼──────────────┼────────┘             │
          │              │              │                       │
          ▼              ▼              ▼                       │
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

**Core Components:**
- `App.tsx` - Root component with routing
- `ErrorBoundary.tsx` - Global error handling
- `ProtectedRoute.tsx` - Authentication guard
- `CanvasPage.tsx` - Main canvas page layout
- `Canvas.tsx` - Konva canvas with shape rendering
- `Toolbar.tsx` - Shape creation tools
- `PresenceBar.tsx` - Online users display
- `Login.tsx` - Authentication UI

**Shape Components:**
- `Rectangle.tsx` - Rectangle shape renderer
- `Circle.tsx` - Circle shape renderer
- `TextShape.tsx` - Text shape renderer
- `Cursor.tsx` - Remote user cursor renderer

**Hooks:**
- `useAuth.ts` - Authentication state management
- `useCanvas.ts` - Canvas shapes state & Firebase sync
- `usePresence.ts` - User presence & cursor position sync

**Services:**
- `firebase.ts` - Firebase initialization
- `auth.ts` - Authentication operations
- `canvasSync.ts` - Real-time data synchronization

### Data Flow

#### 1. Shape Creation Flow
```
User Click → Canvas.tsx
    ↓
useCanvas.addShape()
    ↓
Local State Update (optimistic)
    ↓
canvasSync.syncCreateShape()
    ↓
Firebase Realtime Database
    ↓
subscribeToCanvas() listener
    ↓
Other Users See Shape (<100ms)
```

#### 2. Cursor Position Flow
```
Mouse Move → Canvas.tsx
    ↓
updateCursorPosition() [throttled 20Hz]
    ↓
usePresence hook
    ↓
Firebase Realtime Database /presence/{userId}
    ↓
Other users' usePresence listener
    ↓
Cursor component renders
```

#### 3. Selection State Flow
```
Shape Click → Canvas.tsx
    ↓
setSelection()
    ↓
updateSelection() in usePresence
    ↓
Firebase /presence/{userId}/sel
    ↓
Other users see colored bounding box
```

### Data Model

#### Canvas Objects (`canvas/objects/{id}`)

Shapes are stored with compressed keys to minimize bandwidth:

```json
{
  "t": "r|c|t",    // type: r=rectangle, c=circle, t=text
  "x": 100,        // x position (rounded to integer)
  "y": 200,        // y position (rounded to integer)
  "w": 100,        // width (100px for shapes, auto for text)
  "h": 100,        // height (100px for shapes, auto for text)
  "txt": "Hello"   // text content (text objects only)
}
```

**Note:** No color property is stored as all shapes are blue (#3B82F6).

#### Presence Data (`presence/{userId}`)

```json
{
  "n": "User Name",      // name (display name or email)
  "cl": "#EF4444",       // color (assigned from palette)
  "c": [100, 200],       // cursor position [x, y]
  "sel": "object-id"     // selected object ID (null if none)
}
```

### Firebase Security Rules

The application uses Firebase Realtime Database with strict security rules:

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

**Key Security Features:**
- **Authentication Required**: All read/write operations require authenticated users
- **User-Scoped Writes**: Users can only write to their own presence path
- **Read Access**: All authenticated users can read canvas and presence data
- **Conflict Resolution**: Last-write-wins for canvas objects

### Performance Optimizations

1. **Cursor Position Throttling**
   - Updates throttled to 20Hz (50ms intervals)
   - Reduces Firebase write operations by 95%
   - Implemented using custom `throttle` utility

2. **Optimistic Updates**
   - Local state updates immediately
   - Firebase sync happens asynchronously
   - Users see instant feedback

3. **Data Compression**
   - Short key names (`t`, `x`, `y` vs `type`, `xPosition`, `yPosition`)
   - Reduces payload size by ~40%
   - Integer rounding for positions

4. **Efficient Listeners**
   - Single listener for all canvas objects
   - Differential updates (only changed properties)
   - Automatic cleanup on unmount

5. **Local Shape Tracking**
   - Prevents duplicate shapes from Firebase callbacks
   - Tracks locally created shapes in ref
   - Avoids rendering same shape twice

## 📊 Performance Benchmarks

### Target Metrics
- **FPS**: 60 FPS (16.67ms frame time)
- **Object Creation Latency**: <100ms
- **Object Update Latency**: <100ms
- **Cursor Update Frequency**: 20Hz (50ms)
- **Concurrent Users**: 5+ users simultaneously

### Measured Performance

**Rendering Performance:**
- Canvas FPS: 60 FPS (tested with 100+ shapes)
- No jank during pan/zoom operations
- Smooth cursor movement

**Network Performance:**
- Object creation sync: ~50-80ms average
- Object position updates: ~30-50ms average
- Cursor position updates: 50ms (20Hz throttled)

**Bundle Size:**
- Main bundle: 884 KB (minified)
- Gzipped: 241 KB
- Initial load: <2 seconds on broadband

### Performance Monitoring

The app includes a built-in performance monitoring utility (`src/utils/performance.ts`):

```typescript
import { FPSMonitor } from './utils/performance'

const monitor = new FPSMonitor()
monitor.start((metrics) => {
  console.log(`FPS: ${metrics.fps}`)
  console.log(`Avg Frame Time: ${metrics.avgFrameTime}ms`)
})
```

## 🔒 Security

### Authentication
- Email/password authentication via Firebase Auth
- Passwords must be minimum 6 characters
- Protected routes redirect to login if unauthenticated
- Session persistence across page refreshes

### Database Security
- All operations require authentication
- Users can only modify their own presence data
- Canvas objects use last-write-wins for conflict resolution
- No sensitive data stored in database

### Best Practices
- Environment variables for Firebase credentials
- `.env.local` gitignored
- HTTPS enforced on Firebase Hosting
- CORS properly configured

## 🐛 Error Handling

### Error Boundary
- Global error boundary catches React errors
- Displays user-friendly error page
- Shows technical details in development mode
- Provides reload and recovery options

### Firebase Error Handling
- Connection loss handled gracefully
- Retry logic for failed operations
- User-friendly error messages
- No uncaught exceptions

### Validation
- Empty text objects prevented
- Canvas boundary enforcement
- Input validation on authentication
- Type safety with TypeScript

## 📁 Project Structure

```
collabcanvas/
├── src/
│   ├── components/           # React components
│   │   ├── Canvas.tsx       # Main canvas component
│   │   ├── Toolbar.tsx      # Tool selection sidebar
│   │   ├── PresenceBar.tsx  # Online users display
│   │   ├── Login.tsx        # Authentication UI
│   │   ├── ErrorBoundary.tsx # Error handling
│   │   ├── ProtectedRoute.tsx # Auth guard
│   │   └── shapes/          # Shape renderers
│   │       ├── Rectangle.tsx
│   │       ├── Circle.tsx
│   │       └── TextShape.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts      # Auth state management
│   │   ├── useCanvas.ts    # Canvas state & sync
│   │   └── usePresence.ts  # User presence & cursors
│   ├── services/            # Firebase services
│   │   ├── firebase.ts     # Firebase init
│   │   ├── auth.ts         # Auth operations
│   │   └── canvasSync.ts   # Real-time sync
│   ├── types/              # TypeScript types
│   │   ├── canvas.ts       # Canvas types
│   │   └── firebase.ts     # Firebase types
│   ├── utils/              # Utility functions
│   │   ├── throttle.ts     # Throttle utility
│   │   ├── performance.ts  # Performance monitoring
│   │   └── testFirebase.ts # Firebase test helper
│   ├── pages/              # Page components
│   │   └── CanvasPage.tsx  # Main canvas page
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── tests/                  # Test files
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── public/                # Static assets
├── .env.local            # Environment variables (gitignored)
├── .env.example          # Environment template
├── firebase.json         # Firebase configuration
├── database.rules.json   # Database security rules
├── vite.config.ts        # Vite configuration
├── vitest.config.ts      # Test configuration
├── tailwind.config.js    # Tailwind configuration
├── TESTING.md            # Manual testing checklist
└── README.md             # This file
```

## 🚦 Development Workflow

### Making Changes

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Build: `npm run build`
6. Test locally: `npm run preview`
7. Commit and push
8. Create pull request

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting configured
- **Testing**: >95% coverage on critical paths
- **Type Safety**: No `any` types (except necessary Firebase types)

## 🤝 Contributing

This is an MVP project built as a 24-hour sprint. Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

Built by Tanner Eischen as a 24-hour MVP sprint project demonstrating:
- Real-time collaboration
- Firebase integration
- React best practices
- TypeScript usage
- Test-driven development
- Clean architecture

## 🙏 Acknowledgments

- React Team for React 19
- Konva.js for canvas rendering
- Firebase for backend infrastructure
- Tailwind CSS for styling
- Vitest for testing framework

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check `TESTING.md` for troubleshooting

---

**Built with ❤️ using React, TypeScript, and Firebase**
