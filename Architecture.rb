%%{init: {'theme':'base'}}%%
%% CollabCanvas MVP Architecture
%% Updated: Reflects simplified MVP scope
%% Key Decisions:
%%   - NO resize (fixed 100x100 shapes)
%%   - NO color property (all blue #3B82F6)
%%   - Selection state in presence (not shape objects)
%%   - Text: inline creation, no post-edit
%%   - Delete: keyboard + toolbar button
%%   - UI: Top header + left toolbar
%%   - Canvas: 5000x5000 with line grid

graph TB
    subgraph "Client Browser"
        subgraph "React Application"
            Main[main.tsx Entry Point]
            App[App.tsx Root Component]
            
            subgraph "Pages"
                CanvasPage[CanvasPage.tsx Main Page]
            end
            
            subgraph "Components"
                Canvas[Canvas.tsx Konva Stage + Grid]
                Toolbar[Toolbar.tsx Left Vertical Toolbar]
                Rectangle[Rectangle.tsx Fixed 100x100 Blue]
                Circle[Circle.tsx Fixed 100x100 Blue]
                TextShape[TextShape.tsx Auto-size Blue]
                Cursor[Cursor.tsx Arrow + Name Label]
                PresenceBar[PresenceBar.tsx Top Header Bar]
                Login[Login.tsx Auth UI + Spinner]
                ProtectedRoute[ProtectedRoute.tsx Auth Guard]
                ErrorBoundary[ErrorBoundary.tsx]
            end
            
            subgraph "Hooks"
                useAuth[useAuth.ts Auth State]
                useCanvas[useCanvas.ts Shape State + Selection Sync]
                usePresence[usePresence.ts Cursor + Selection State 20Hz]
            end
            
            subgraph "Services"
                FirebaseConfig[firebase.ts Config]
                AuthService[auth.ts Sign In/Up/Out]
                CanvasSync[canvasSync.ts Create/Move/Delete Sync]
            end
            
            subgraph "Types"
                CanvasTypes[canvas.ts Shape Interfaces]
                FirebaseTypes[firebase.ts Data Interfaces]
            end
            
            subgraph "Utils"
                Performance[performance.ts FPS Monitor]
            end
        end
        
        subgraph "Libraries"
            Konva[Konva.js Canvas Rendering]
            Lodash[lodash-es Throttle]
        end
    end
    
    subgraph "Firebase Backend"
        subgraph "Firebase Services"
            FirebaseAuth[Firebase Authentication Email Password]
            RealtimeDB[Firebase Realtime Database]
            Hosting[Firebase Hosting]
        end
        
        subgraph "Database Structure"
            CanvasData[canvas/objects/{id} t x y w h txt NO COLOR]
            PresenceData[presence/{userId} n cl c sel Cursor + Selection]
        end
        
        subgraph "Security"
            SecurityRules[Security Rules Auth Required]
        end
    end
    
    subgraph "Testing"
        Vitest[Vitest Test Runner]
        TestingLib[Testing Library Component Tests]
        Mocks[Firebase Mocks]
    end
    
    Main --> ErrorBoundary
    ErrorBoundary --> App
    App --> ProtectedRoute
    ProtectedRoute --> Login
    ProtectedRoute --> CanvasPage
    
    CanvasPage --> PresenceBar
    CanvasPage --> Toolbar
    CanvasPage --> Canvas
    Canvas --> Rectangle
    Canvas --> Circle
    Canvas --> TextShape
    Canvas --> Cursor
    Toolbar -.->|tool selection| Canvas
    
    Canvas --> useAuth
    Canvas --> useCanvas
    Canvas --> usePresence
    PresenceBar --> useAuth
    PresenceBar --> usePresence
    Login --> useAuth
    ProtectedRoute --> useAuth
    Toolbar -.->|delete action| useCanvas
    
    useAuth --> FirebaseConfig
    useAuth --> AuthService
    useCanvas --> CanvasSync
    usePresence --> FirebaseConfig
    usePresence --> Lodash
    
    AuthService --> FirebaseAuth
    CanvasSync --> RealtimeDB
    
    useCanvas -.->|uses| CanvasTypes
    Canvas -.->|uses| CanvasTypes
    CanvasSync -.->|uses| FirebaseTypes
    usePresence -.->|uses| FirebaseTypes
    
    Canvas --> Konva
    usePresence --> Lodash
    
    FirebaseConfig -->|WebSocket| RealtimeDB
    FirebaseConfig -->|HTTPS| FirebaseAuth
    RealtimeDB --> CanvasData
    RealtimeDB --> PresenceData
    SecurityRules -.->|protects| CanvasData
    SecurityRules -.->|protects| PresenceData
    
    CanvasSync -->|Write Create/Move/Delete NO COLOR| CanvasData
    CanvasData -->|Subscribe onValue| CanvasSync
    usePresence -->|Write Cursor 20Hz + Selection State| PresenceData
    PresenceData -->|Subscribe onValue All Users| usePresence
    
    Vitest -.->|runs| Mocks
    TestingLib -.->|tests| Components
    Mocks -.->|mocks| FirebaseConfig
    
    Hosting -.->|serves| Main
    
    classDef firebase fill:#FFA000,stroke:#FF6F00,stroke-width:2px,color:#000
    classDef component fill:#61DAFB,stroke:#0088CC,stroke-width:2px,color:#000
    classDef hook fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff
    classDef service fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#000
    classDef library fill:#757575,stroke:#424242,stroke-width:2px,color:#fff
    classDef test fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#000
    
    class FirebaseAuth,RealtimeDB,Hosting,CanvasData,PresenceData,SecurityRules firebase
    class Canvas,Toolbar,Rectangle,Circle,TextShape,Cursor,PresenceBar,Login,ProtectedRoute,ErrorBoundary,CanvasPage component
    class useAuth,useCanvas,usePresence hook
    class FirebaseConfig,AuthService,CanvasSync service
    class Konva,Lodash library
    class Vitest,TestingLib,Mocks test

%% DATA MODEL (Simplified MVP)
%% 
%% canvas/objects/{objectId}:
%%   t: 'r' | 'c' | 't'  (rectangle, circle, text)
%%   x: number           (position x)
%%   y: number           (position y)
%%   w: 100              (width - FIXED for rect/circle)
%%   h: 100              (height - FIXED for rect/circle)
%%   txt?: string        (text content, text objects only)
%%   NOTE: NO color property - all shapes blue #3B82F6
%%
%% presence/{userId}:
%%   n: string           (user name)
%%   cl: string          (user color for cursor/selection)
%%   c: [number, number] (cursor position [x, y])
%%   sel: string | null  (selected object ID)
%%
%% OPERATIONS:
%%   - Create: Rectangle/Circle (click) or Text (inline type)
%%   - Move: Drag shape (sync position on drag end)
%%   - Select: Click shape (sync selection to presence)
%%   - Delete: Delete key OR toolbar button (sync deletion)
%%   - NO RESIZE in MVP