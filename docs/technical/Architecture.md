graph TB
    subgraph "Client Browser"
        subgraph "React Application"
            Main[main.tsx Entry Point]
            App[App.tsx Root Component]
            
            subgraph "Pages"
                CanvasPage[CanvasPage.tsx Main Page + Alignment Toolbar]
            end
            
            subgraph "Components"
                Canvas[Canvas.tsx Konva Stage + Grid + Multi-Select]
                Toolbar[Toolbar.tsx Left Vertical All Shape Tools]
                PropsPanel[PropertiesPanel.tsx Right Sidebar Colors]
                AlignToolbar[AlignmentToolbar.tsx Top Align Buttons]
                ContextMenu[ContextMenu.tsx Right-Click Menu]
                
                Rectangle[Rectangle.tsx Resizable + Colors + Rotation]
                Circle[Circle.tsx Resizable + Colors + Rotation]
                TextShape[TextShape.tsx Resizable + Colors]
                Line[Line.tsx Draggable Endpoints + Arrows]
                Polygon[Polygon.tsx N-Sided + Resizable]
                Star[Star.tsx N-Points + Resizable]
                RoundedRect[RoundedRect.tsx Corner Radius]
                
                SelectionBox[SelectionBox.tsx Drag-to-Select Box]
                ColorPicker[ColorPicker.tsx Fill + Stroke Picker]
                AlignGuides[AlignmentGuides.tsx Smart Snap Lines]
                
                Cursor[Cursor.tsx Arrow + Name Label]
                PresenceBar[PresenceBar.tsx Top Header Bar]
                Toast[Toast.tsx Notification 3s Auto-Dismiss]
                Login[Login.tsx Auth UI + Spinner]
                ProtectedRoute[ProtectedRoute.tsx Auth Guard]
                ErrorBoundary[ErrorBoundary.tsx]
            end
            
            subgraph "Hooks"
                useAuth[useAuth.ts Auth State]
                useCanvas[useCanvas.ts Multi-Select + Transform + Colors + Alignment]
                usePresence[usePresence.ts Cursor + Selection State 20Hz]
            end
            
            subgraph "Services"
                FirebaseConfig[firebase.ts Config]
                AuthService[auth.ts Sign In/Up/Out]
                CanvasSync[canvasSync.ts CRUD + Colors + Z-Index + Transform]
                Clipboard[clipboard.ts Copy/Paste/Duplicate]
                CmdHistory[commandHistory.ts Undo/Redo Stack]
                Alignment[alignment.ts Align + Distribute Calculations]
                ColorStorage[colorStorage.ts Recent Colors]
            end
            
            subgraph "Commands"
                CreateCmd[CreateCommand.ts]
                DeleteCmd[DeleteCommand.ts]
                MoveCmd[MoveCommand.ts]
                TransformCmd[TransformCommand.ts]
                ColorCmd[ColorCommand.ts]
                ZIndexCmd[ZIndexCommand.ts]
                AlignCmd[AlignmentCommand.ts]
                BulkCmd[BulkCommand.ts]
            end
            
            subgraph "Types"
                CanvasTypes[canvas.ts Shape + Transform + Color]
                FirebaseTypes[firebase.ts Data Interfaces]
                SelectionTypes[selection.ts Multi-Select]
                CommandTypes[command.ts Command Interface]
            end
            
            subgraph "Utils"
                Performance[performance.ts FPS Monitor]
            end
        end
        
        subgraph "Libraries"
            Konva[Konva.js Canvas Rendering + Transformers]
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
            CanvasData[canvas/objects t x y w h rot f s sw z]
            PresenceData[presence n cl c sel array]
            DBNote[Colors: RGBA Format #3B82F6FF]
            DBNote2[Z-Index: serverTimestamp]
            DBNote3[Selection: Array Format]
        end
        
        subgraph "Security"
            SecurityRules[Security Rules Auth Required]
        end
    end
    
    subgraph "Testing"
        Vitest[Vitest Test Runner]
        TestingLib[Testing Library Component Tests]
        FirebaseEmulator[Firebase Emulator Suite]
        Mocks[Firebase Mocks]
        UnitTests[22 New Unit Test Files Phase 2 and 3]
        IntegTests[11 New Integration Test Files Phase 2 and 3]
    end
    
    Main --> ErrorBoundary
    ErrorBoundary --> App
    App --> ProtectedRoute
    ProtectedRoute --> Login
    ProtectedRoute --> CanvasPage
    
    CanvasPage --> PresenceBar
    CanvasPage --> Toolbar
    CanvasPage --> AlignToolbar
    CanvasPage --> PropsPanel
    CanvasPage --> Canvas
    CanvasPage --> Toast
    
    Canvas --> Rectangle
    Canvas --> Circle
    Canvas --> TextShape
    Canvas --> Line
    Canvas --> Polygon
    Canvas --> Star
    Canvas --> RoundedRect
    Canvas --> SelectionBox
    Canvas --> Cursor
    Canvas --> ContextMenu
    Canvas --> AlignGuides
    
    PropsPanel --> ColorPicker
    Toolbar -.->|tool selection| Canvas
    ContextMenu -.->|operations| useCanvas
    AlignToolbar -.->|alignment| useCanvas
    
    Canvas --> useAuth
    Canvas --> useCanvas
    Canvas --> usePresence
    PresenceBar --> useAuth
    PresenceBar --> usePresence
    Login --> useAuth
    ProtectedRoute --> useAuth
    PropsPanel --> useCanvas
    
    useAuth --> FirebaseConfig
    useAuth --> AuthService
    useCanvas --> CanvasSync
    useCanvas --> Clipboard
    useCanvas --> CmdHistory
    useCanvas --> Alignment
    usePresence --> FirebaseConfig
    usePresence --> Lodash
    
    CmdHistory --> CreateCmd
    CmdHistory --> DeleteCmd
    CmdHistory --> MoveCmd
    CmdHistory --> TransformCmd
    CmdHistory --> ColorCmd
    CmdHistory --> ZIndexCmd
    CmdHistory --> AlignCmd
    CmdHistory --> BulkCmd
    
    CreateCmd --> CanvasSync
    DeleteCmd --> CanvasSync
    MoveCmd --> CanvasSync
    TransformCmd --> CanvasSync
    ColorCmd --> CanvasSync
    ZIndexCmd --> CanvasSync
    AlignCmd --> CanvasSync
    BulkCmd --> CanvasSync
    
    AuthService --> FirebaseAuth
    CanvasSync --> RealtimeDB
    ColorStorage --> ColorPicker
    
    useCanvas -.->|uses| CanvasTypes
    useCanvas -.->|uses| SelectionTypes
    Canvas -.->|uses| CanvasTypes
    CanvasSync -.->|uses| FirebaseTypes
    usePresence -.->|uses| FirebaseTypes
    CmdHistory -.->|uses| CommandTypes
    
    Canvas --> Konva
    Rectangle --> Konva
    Circle --> Konva
    TextShape --> Konva
    Line --> Konva
    Polygon --> Konva
    Star --> Konva
    RoundedRect --> Konva
    usePresence --> Lodash
    
    FirebaseConfig -->|WebSocket| RealtimeDB
    FirebaseConfig -->|HTTPS| FirebaseAuth
    RealtimeDB --> CanvasData
    RealtimeDB --> PresenceData
    SecurityRules -.->|protects| CanvasData
    SecurityRules -.->|protects| PresenceData
    
    CanvasSync -->|Write CRUD + Colors + Transform + Z-Index| CanvasData
    CanvasData -->|Subscribe onValue| CanvasSync
    usePresence -->|Write Cursor 20Hz + Multi-Selection Array| PresenceData
    CmdHistory -.->|toast on conflict| Toast
    PresenceData -->|Subscribe onValue All Users| usePresence
    
    Vitest -.->|runs| UnitTests
    Vitest -.->|runs| IntegTests
    TestingLib -.->|tests| Components
    FirebaseEmulator -.->|emulates| RealtimeDB
    FirebaseEmulator -.->|integration tests| IntegTests
    Mocks -.->|mocks| FirebaseConfig
    UnitTests -.->|validates| Hooks
    UnitTests -.->|validates| Services
    UnitTests -.->|validates| Commands
    IntegTests -.->|validates| Components
    
    Hosting -.->|serves| Main
    
    classDef firebase fill:#FFA000,stroke:#FF6F00,stroke-width:2px,color:#000
    classDef component fill:#61DAFB,stroke:#0088CC,stroke-width:2px,color:#000
    classDef hook fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff
    classDef service fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#000
    classDef command fill:#E91E63,stroke:#C2185B,stroke-width:2px,color:#fff
    classDef library fill:#757575,stroke:#424242,stroke-width:2px,color:#fff
    classDef test fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#000
    
    class FirebaseAuth,RealtimeDB,Hosting,CanvasData,PresenceData,SecurityRules,DBNote,DBNote2,DBNote3 firebase
    class Canvas,Toolbar,Rectangle,Circle,TextShape,Line,Polygon,Star,RoundedRect,SelectionBox,ColorPicker,AlignGuides,Cursor,PresenceBar,Toast,Login,ProtectedRoute,ErrorBoundary,CanvasPage,PropsPanel,AlignToolbar,ContextMenu component
    class useAuth,useCanvas,usePresence hook
    class FirebaseConfig,AuthService,CanvasSync,Clipboard,CmdHistory,Alignment,ColorStorage service
    class CreateCmd,DeleteCmd,MoveCmd,TransformCmd,ColorCmd,ZIndexCmd,AlignCmd,BulkCmd command
    class Konva,Lodash library
    class Vitest,TestingLib,FirebaseEmulator,Mocks,UnitTests,IntegTests test