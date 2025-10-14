import { ref, set, onValue, remove } from 'firebase/database'
import { db } from '../services/firebase'

/**
 * Test Firebase Realtime Database connection
 * Writes a test value and verifies it can be read back
 */
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    const testRef = ref(db, 'test/connection')
    const testValue = {
      timestamp: Date.now(),
      message: 'Firebase connection test',
    }

    console.log('🔍 Testing Firebase connection...')

    // Write test data
    await set(testRef, testValue)
    console.log('✅ Successfully wrote test data to Firebase')

    // Read test data back
    return new Promise((resolve) => {
      onValue(
        testRef,
        (snapshot) => {
          const data = snapshot.val()
          if (data && data.timestamp === testValue.timestamp) {
            console.log('✅ Successfully read test data from Firebase')
            console.log('🎉 Firebase connection working!')
            
            // Clean up test data
            remove(testRef)
            resolve(true)
          } else {
            console.error('❌ Test data mismatch')
            resolve(false)
          }
        },
        (error) => {
          console.error('❌ Error reading from Firebase:', error)
          resolve(false)
        },
        { onlyOnce: true }
      )
    })
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error)
    return false
  }
}

/**
 * Check if Firebase is configured correctly
 */
export function checkFirebaseConfig(): boolean {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_DATABASE_URL',
    'VITE_FIREBASE_PROJECT_ID',
  ]

  const missing = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName]
  )

  if (missing.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missing)
    return false
  }

  console.log('✅ Firebase environment variables configured')
  return true
}

