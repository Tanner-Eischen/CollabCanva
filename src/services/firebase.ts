import { initializeApp } from 'firebase/app'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const db = getDatabase(app)
export const firestore = getFirestore(app)
export const auth = getAuth(app)
export const functions = getFunctions(app)
export const storage = getStorage(app)

// Connect to emulators in development
// Uncomment to use local emulators (requires Java and firebase init emulators)
/*
if (import.meta.env.DEV) {
  // Check if emulator is already connected (prevents double connection on HMR)
  if (!(db as any)._repoInternal?.repoInfo_.secure) {
    connectDatabaseEmulator(db, 'localhost', 9000)
  }
  
  if (!(auth as any).config.emulator) {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  }
  
  // Connect Functions to local emulator
  if (!(functions as any)._customDomain) {
    connectFunctionsEmulator(functions, 'localhost', 5001)
  }
  
  // Connect Storage to local emulator
  if (!(storage as any)._host) {
    connectStorageEmulator(storage, 'localhost', 9199)
  }
}
*/

export default app

