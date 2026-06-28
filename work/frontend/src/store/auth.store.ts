import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User as FirebaseUser } from 'firebase/auth'
import { signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '../firebase'
import type { User } from '../types'

interface AuthStore {
  user: User | null
  firebaseUser: FirebaseUser | null
  idToken: string | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setFirebaseUser: (user: FirebaseUser | null) => void
  setIdToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      firebaseUser: null,
      idToken: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setIdToken: (idToken) => set({ idToken }),
      setLoading: (isLoading) => set({ isLoading }),
      signOut: async () => {
        await firebaseSignOut(auth)
        set({ user: null, firebaseUser: null, idToken: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
