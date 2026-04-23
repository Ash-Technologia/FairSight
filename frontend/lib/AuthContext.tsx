'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { auth } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from 'firebase/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email?: string, password?: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  logOut: () => Promise<void>
  showAuthModal: boolean
  setShowAuthModal: (v: boolean) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  logOut: async () => {},
  showAuthModal: false,
  setShowAuthModal: () => {},
})

const MOCK_USER = {
  uid: 'demo-executive-1',
  displayName: 'Demo Executive',
  email: 'demo@fairsight.ai',
  photoURL: 'https://ui-avatars.com/api/?name=Demo+Exec&background=0d9488&color=fff&bold=true',
} as User

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsubscribe = auth.onAuthStateChanged((u: User | null) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signIn = async (email?: string, password?: string) => {
    // Demo mode (no credentials provided or no Firebase)
    if (!email || !password || !auth) {
      setUser(MOCK_USER)
      setShowAuthModal(false)
      return
    }
    try {
      await signInWithEmailAndPassword(auth, email, password)
      setShowAuthModal(false)
    } catch (err: any) {
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/network-request-failed') {
        // Firebase not configured for this domain — fall back to demo
        setUser(MOCK_USER)
        setShowAuthModal(false)
      } else {
        throw err
      }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    if (!auth) {
      setUser({ ...MOCK_USER, displayName: name, email } as User)
      setShowAuthModal(false)
      return
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      setUser({ ...cred.user, displayName: name })
      setShowAuthModal(false)
    } catch (err: any) {
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/network-request-failed') {
        setUser({ ...MOCK_USER, displayName: name, email } as User)
        setShowAuthModal(false)
      } else {
        throw err
      }
    }
  }

  const logOut = async () => {
    if (auth) await signOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logOut, showAuthModal, setShowAuthModal }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
