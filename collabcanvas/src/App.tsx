import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useEffect } from 'react'
import { autoMigrateIfNeeded } from './utils/migrationScript'
import CanvasPage from './pages/CanvasPage'
import DashboardPage from './pages/DashboardPage'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

/**
 * App Component with React Router (PR-22)
 * Main routing configuration for multi-canvas support
 */
function App() {
  const { user } = useAuth()

  // Auto-migrate existing data on first login (PR-22)
  useEffect(() => {
    if (user?.uid) {
      autoMigrateIfNeeded(user.uid)
    }
  }, [user?.uid])

  return (
    <BrowserRouter>
      <Routes>
        {/* Login page */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <Login />
          }
        />

        {/* Dashboard (protected) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Canvas page with dynamic ID (protected) */}
        <Route
          path="/canvas/:canvasId"
          element={
            <ProtectedRoute>
              <CanvasPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
