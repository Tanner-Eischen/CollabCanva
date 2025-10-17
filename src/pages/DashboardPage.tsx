/**
 * DashboardPage Component (PR-22)
 * Main dashboard showing grid of user's canvases
 */

import { useAuth } from '../hooks/useAuth'
import { useCanvasList } from '../hooks/useCanvasList'
import { CanvasCard } from '../components/canvas/CanvasCard'
import { SkeletonCard } from '../components/ui/Skeleton'
import { logOut } from '../services/auth'

/**
 * Dashboard page with canvas grid
 */
export default function DashboardPage() {
  const { user } = useAuth()
  const {
    canvases,
    loading,
    error,
    createCanvas,
    deleteCanvas,
    duplicateCanvas,
    updateCanvasName,
  } = useCanvasList(user?.uid || '')

  const handleLogout = async () => {
    try {
      await logOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleCreateCanvas = async () => {
    const name = prompt('Canvas name:', 'Untitled Canvas')
    if (name && name.trim()) {
      try {
        await createCanvas(name.trim())
      } catch (err) {
        alert('Failed to create canvas')
      }
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 shadow-soft z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-neutral-900">CollabCanvas</h1>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* User info */}
            <div className="text-sm text-neutral-600">
              {user?.displayName || user?.email}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content - pt-20 (80px) to account for 64px header + extra spacing */}
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Public Board - Large Featured Tile */}
          <div className="mb-12">
            <a href="/canvas/public-board" className="group block">
              <div className="relative bg-gradient-to-br from-slate-600 to-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] min-h-[240px]">
                {/* Dot pattern overlay */}
                <div className="absolute inset-0 bg-white/10 rounded-2xl" style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}></div>
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Public Collaboration Board</h2>
                        <p className="text-slate-200 text-sm">Join the community canvas - collaborate in real-time with everyone</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-sm px-4 py-2 rounded-full">
                      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-emerald-100 text-sm font-medium">Live Now</span>
                    </div>
                  </div>
                  
                  <p className="text-white/90 text-base mb-6 flex-1 max-w-3xl">
                    A shared creative space where anyone can draw, design, and collaborate together. 
                    Perfect for brainstorming, art projects, or just having fun with others.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <span className="text-white/80 text-sm flex items-center gap-2">
                        <span className="text-lg">👥</span> 
                        <span className="font-medium">12 active users</span>
                      </span>
                      <span className="text-white/80 text-sm flex items-center gap-2">
                        <span className="text-lg">🎨</span> 
                        <span className="font-medium">Open to all</span>
                      </span>
                    </div>
                    <span className="text-white text-lg font-semibold group-hover:translate-x-2 transition-transform flex items-center gap-2">
                      Join Public Board →
                    </span>
                  </div>
                </div>
              </div>
            </a>
          </div>

          {/* Personal Canvases Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Your Private Canvases
            </h2>
            <p className="text-neutral-600">
              Create and manage your personal design projects
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Canvas grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : canvases.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16">
              <div className="mb-4">
                <span className="text-6xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                No canvases yet
              </h3>
              <p className="text-neutral-600 mb-6">
                Create your first canvas to get started
              </p>
              <button
                onClick={handleCreateCanvas}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                Create New Canvas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Create new canvas card */}
              <button
                key="create-new"
                onClick={handleCreateCanvas}
                className="h-[260px] bg-white rounded-lg border-2 border-dashed border-neutral-300 hover:border-primary-500 hover:bg-primary-50 transition-all duration-150 flex flex-col items-center justify-center gap-3"
              >
                <span className="text-4xl text-neutral-400">+</span>
                <span className="text-sm font-medium text-neutral-600">
                  Create New Canvas
                </span>
              </button>

              {/* Canvas cards */}
              {canvases.map((canvas) => (
                <CanvasCard
                  key={canvas.id}
                  canvas={canvas}
                  onDelete={deleteCanvas}
                  onDuplicate={duplicateCanvas}
                  onRename={updateCanvasName}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


