// ============================================================================
// Firebase Configuration
// ----------------------------------------------------------------------------
// Firebase config is loaded from environment variables (VITE_ prefixed).
// Enable in Firebase Console:
//   1. Authentication -> Sign-in method -> Email/Password (Enable).
//   2. Firestore Database -> Create database (production or test mode).
// ============================================================================

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Detect whether Firebase has been configured with real credentials.
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  !!firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID'

let app = null
let auth = null
let db = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { app, auth, db }