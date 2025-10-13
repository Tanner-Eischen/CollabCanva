import { vi } from 'vitest'

// Mock Firebase App
export const mockFirebaseApp = {
  name: '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false,
}

// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}

// Mock Firebase Database Reference
export const mockDatabaseRef = vi.fn(() => ({
  set: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve()),
  push: vi.fn(() => ({
    key: 'mock-key-123',
    set: vi.fn(() => Promise.resolve()),
  })),
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(() => Promise.resolve({ val: () => null })),
  onDisconnect: vi.fn(() => ({
    remove: vi.fn(() => Promise.resolve()),
    set: vi.fn(() => Promise.resolve()),
  })),
}))

// Mock Firebase Database
export const mockDatabase = {
  ref: mockDatabaseRef,
  goOffline: vi.fn(),
  goOnline: vi.fn(),
}

// Mock Firebase functions
export const initializeApp = vi.fn(() => mockFirebaseApp)
export const getAuth = vi.fn(() => mockAuth)
export const getDatabase = vi.fn(() => mockDatabase)

// Mock auth functions
export const signInWithEmailAndPassword = vi.fn(() => 
  Promise.resolve({
    user: {
      uid: 'mock-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  })
)

export const createUserWithEmailAndPassword = vi.fn(() =>
  Promise.resolve({
    user: {
      uid: 'mock-user-id',
      email: 'test@example.com',
      displayName: null,
    },
  })
)

export const signOut = vi.fn(() => Promise.resolve())

export const updateProfile = vi.fn(() => Promise.resolve())

export const onAuthStateChanged = vi.fn((auth, callback) => {
  // Immediately call callback with mock user or null
  callback(mockAuth.currentUser)
  // Return unsubscribe function
  return vi.fn()
})

// Mock database functions
export const ref = mockDatabaseRef

export const set = vi.fn(() => Promise.resolve())

export const update = vi.fn(() => Promise.resolve())

export const remove = vi.fn(() => Promise.resolve())

export const onValue = vi.fn((ref, callback) => {
  // Immediately call callback with mock snapshot
  callback({
    val: () => null,
    exists: () => false,
  })
  // Return unsubscribe function
  return vi.fn()
})

export const onDisconnect = vi.fn(() => ({
  remove: vi.fn(() => Promise.resolve()),
  set: vi.fn(() => Promise.resolve()),
}))

// Reset all mocks - useful between tests
export const resetAllMocks = () => {
  vi.clearAllMocks()
  mockAuth.currentUser = null
}

// Set mock authenticated user
export const setMockAuthUser = (user: any) => {
  mockAuth.currentUser = user
}

// Mock Firestore (if needed later)
export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}

