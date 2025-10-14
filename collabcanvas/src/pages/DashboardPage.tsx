/**
 * DashboardPage Component (PR-22)
 * Main dashboard showing grid of user's canvases
 */

import { useAuth } from '../hooks/useAuth'
import { useCanvasList } from '../hooks/useCanvasList'
import { CanvasCard } from '../components/CanvasCard'
import { SkeletonCard, LoadingSpinner } from '../components/Skeleton'
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
      <header className="fixed top-0 left-0 right-0 h-header bg-white border-b border-neutral-200 shadow-soft z-50">
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

      {/* Main content */}
      <main className="pt-header">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Your Canvases
            </h2>
            <p className="text-neutral-600">
              Create and manage your collaborative design canvases
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

