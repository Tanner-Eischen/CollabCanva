import { useState, useEffect } from 'react'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { auth } from '../services/firebase'
import { User } from '../types/firebase'

interface UseAuthReturn {
  user: User | null
  loading: boolean
}

/**
 * Hook to manage Firebase authentication state
 * Returns current user and loading state
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          // Map Firebase user to our User type
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          })
        } else {
          setUser(null)
        }
        setLoading(false)
      },
      (error) => {
        console.error('Auth state change error:', error)
        setUser(null)
        setLoading(false)
      }
    )

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  return { user, loading }
}

