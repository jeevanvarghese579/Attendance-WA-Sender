import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/config'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthContextProvider')
  return ctx
}

const DEMO_USER_KEY = 'absenteeManager:demoUser'

export function AuthContextProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDemoMode] = useState(!isFirebaseConfigured)

  // Persist a demo user in localStorage so demo sessions survive reloads.
  useEffect(() => {
    if (!isDemoMode) return
    try {
      const raw = localStorage.getItem(DEMO_USER_KEY)
      if (raw) {
        const u = JSON.parse(raw)
        setCurrentUser(u)
        setProfile({ email: u.email, role: 'teacher' })
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }, [isDemoMode])

  // Real Firebase auth subscription.
  useEffect(() => {
    if (isDemoMode || !auth) return
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        await ensureUserDoc(user)
        try {
          const snap = await getDoc(doc(db, 'users', user.uid))
          setProfile(snap.exists() ? snap.data() : { email: user.email, role: 'teacher' })
        } catch {
          setProfile({ email: user.email, role: 'teacher' })
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [isDemoMode])

  async function ensureUserDoc(user) {
    const ref = doc(db, 'users', user.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        email: user.email,
        role: 'teacher',
        createdAt: serverTimestamp(),
      })
    }
  }

  async function login(email, password) {
    if (isDemoMode) {
      // Demo mode auth — accept any non-empty email & password >= 4 chars.
      const cleanEmail = String(email || '').trim().toLowerCase()
      if (!cleanEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
        throw new Error('Enter a valid email address')
      }
      if (String(password || '').length < 4) {
        throw new Error('Password must be at least 4 characters')
      }
      const demoUser = { uid: `demo_${btoa(cleanEmail).replace(/=/g, '')}`, email: cleanEmail }
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser))
      setCurrentUser(demoUser)
      setProfile({ email: cleanEmail, role: 'teacher' })
      return demoUser
    }
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function signup(email, password) {
    if (isDemoMode) {
      return login(email, password)
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await ensureUserDoc(cred.user)
    return cred
  }

  function logout() {
    if (isDemoMode) {
      localStorage.removeItem(DEMO_USER_KEY)
      setCurrentUser(null)
      setProfile(null)
      return Promise.resolve()
    }
    return signOut(auth)
  }

  function resetPassword(email) {
    if (isDemoMode) {
      // Simulate success in demo mode.
      return Promise.resolve({ demo: true })
    }
    return sendPasswordResetEmail(auth, email)
  }

  const value = {
    currentUser,
    profile,
    loading,
    isDemoMode,
    isFirebaseConfigured,
    login,
    signup,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
