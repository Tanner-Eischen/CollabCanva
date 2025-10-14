import { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import Login from './Login'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * ProtectedRoute - Wrapper component that requires authentication
 * Shows Login component if user is not authenticated
 * Shows loading state while checking auth
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />
  }

  // User is authenticated, show protected content
  return <>{children}</>
}

