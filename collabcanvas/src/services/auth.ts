import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  UserCredential,
} from 'firebase/auth'
import { auth } from './firebase'
import { User } from '../types/firebase'

/**
 * Sign up a new user with email, password, and display name
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  try {
    // Create user with email and password
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

    // Update user profile with display name
    await updateProfile(userCredential.user, {
      displayName,
    })

    // Return user object
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName,
    }
  } catch (error: any) {
    // Handle specific Firebase auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already in use')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address')
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters')
    } else {
      throw new Error('Failed to create account: ' + error.message)
    }
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )

    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
    }
  } catch (error: any) {
    // Handle specific Firebase auth errors
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email')
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address')
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled')
    } else {
      throw new Error('Failed to sign in: ' + error.message)
    }
  }
}

/**
 * Log out the current user
 */
export async function logOut(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error: any) {
    throw new Error('Failed to log out: ' + error.message)
  }
}

