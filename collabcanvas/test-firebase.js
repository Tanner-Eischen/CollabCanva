// Simple Firebase connection test script
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, remove } from 'firebase/database'

// Load environment variables
const firebaseConfig = {
  apiKey: 'AIzaSyDyw9pXYbkP7YZaOBrM25EwlZe9wATM1sE',
  authDomain: 'collabcanvas-realtime.firebaseapp.com',
  databaseURL: 'https://collabcanvas-realtime-default-rtdb.firebaseio.com',
  projectId: 'collabcanvas-realtime',
}

async function testConnection() {
  try {
    console.log('🔍 Testing Firebase connection...')
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    const db = getDatabase(app)
    
    console.log('✅ Firebase initialized')
    
    // Test write
    const testRef = ref(db, 'test/connection')
    const testData = {
      timestamp: Date.now(),
      message: 'Connection test from Node.js',
    }
    
    await set(testRef, testData)
    console.log('✅ Successfully wrote test data')
    
    // Test read
    const snapshot = await get(testRef)
    if (snapshot.exists()) {
      console.log('✅ Successfully read test data:', snapshot.val())
    } else {
      console.log('❌ No data found')
    }
    
    // Cleanup
    await remove(testRef)
    console.log('✅ Cleaned up test data')
    
    console.log('🎉 Firebase connection test PASSED!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Firebase connection test FAILED:', error.message)
    process.exit(1)
  }
}

testConnection()

