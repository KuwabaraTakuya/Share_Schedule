import { useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useAuthStore } from '../store/auth.store'
import { verifyAndRegister } from '../api/auth'
import toast from 'react-hot-toast'

export function useAuthListener() {
  const { setUser, setFirebaseUser, setIdToken, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser)
        try {
          const idToken = await firebaseUser.getIdToken()
          setIdToken(idToken)
          const user = await verifyAndRegister(idToken)
          setUser(user)
        } catch (err) {
          console.error('Auth verification failed:', err)
          toast.error('認証に失敗しました')
        }
      } else {
        setFirebaseUser(null)
        setIdToken(null)
        setUser(null)
      }
      setLoading(false)
    })

    // トークンの自動更新（55分ごと）
    const tokenRefreshInterval = setInterval(async () => {
      const currentUser = auth.currentUser
      if (currentUser) {
        const idToken = await currentUser.getIdToken(true)
        setIdToken(idToken)
      }
    }, 55 * 60 * 1000)

    return () => {
      unsubscribe()
      clearInterval(tokenRefreshInterval)
    }
  }, [setUser, setFirebaseUser, setIdToken, setLoading])
}

export function useAuth() {
  const { user, firebaseUser, isLoading, signOut } = useAuthStore()

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Google sign in failed:', err)
      toast.error('Googleログインに失敗しました')
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      console.error('Email sign in failed:', err)
      toast.error('ログインに失敗しました。メールアドレスとパスワードを確認してください。')
      throw err
    }
  }

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      )
      // updateProfile でdisplayNameを設定
      const { updateProfile } = await import('firebase/auth')
      await updateProfile(fbUser, { displayName })
    } catch (err) {
      console.error('Email sign up failed:', err)
      toast.error('アカウント作成に失敗しました')
      throw err
    }
  }

  return {
    user,
    firebaseUser,
    isLoading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }
}
