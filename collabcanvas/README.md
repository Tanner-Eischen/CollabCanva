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
- **Firebase Authentication**: Secure Google Sign-In
- **Hard Boundaries**: 5000x5000px canvas with enforced boundaries
- **Grid Background**: 50px spacing grid for visual reference

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Canvas Rendering**: Konva.js + React Konva
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Auth (Google Sign-In)
- **Hosting**: Firebase Hosting
- **Testing**: Vitest + Testing Library

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project credentials

## 🔧 Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
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

Run tests:

```bash
npm test           # Run tests once
npm run test:ui    # Open Vitest UI
npm run test:coverage  # Generate coverage report
```

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
- ✅ Google authentication
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

### Data Model

**Canvas Objects** (`canvas/objects/{id}`):
```json
{
  "t": "r|c|t",    // type: rectangle, circle, text
  "x": 100,        // x position
  "y": 200,        // y position
  "w": 100,        // width
  "h": 100,        // height
  "txt": "text"    // text content (text objects only)
}
```

**Presence Data** (`presence/{userId}`):
```json
{
  "n": "User Name",      // name
  "cl": "#3B82F6",       // color
  "c": [100, 200],       // cursor position [x, y]
  "sel": "object-id"     // selected object ID
}
```

### Security Rules

- Authentication required for all read/write operations
- Users can only write to their own presence path
- Last-write-wins conflict resolution

## 📝 License

MIT

## 👨‍💻 Author

Built as a 24-hour MVP sprint project.
