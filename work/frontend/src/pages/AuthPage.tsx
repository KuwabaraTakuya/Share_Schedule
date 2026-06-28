import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/auth.store'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function AuthPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleEmailAuth = async () => {
    if (!email || !password) return
    setIsLoading(true)
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName)
      } else {
        await signInWithEmail(email, password)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-app-accent text-3xl">
              📅
            </div>
          </div>
          <h1 className="text-2xl font-bold text-app-text-primary">
            ShareSchedule
          </h1>
          <p className="mt-1 text-sm text-app-text-muted">
            スケジュールを共有してみんなで予定を立てよう
          </p>
        </div>

        {/* フォーム */}
        <div className="rounded-lg border border-app-border bg-app-surface p-6">
          <h2 className="mb-6 text-center text-lg font-semibold text-app-text-primary">
            {mode === 'signin' ? 'ログイン' : 'アカウントを作成'}
          </h2>

          {/* Google ログイン */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded border border-app-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleでログイン
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-app-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-app-surface px-2 text-app-text-muted">または</span>
            </div>
          </div>

          {/* メール/パスワード */}
          <div className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="表示名"
                className="w-full rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              className="w-full rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
              placeholder="パスワード"
              className="w-full rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none"
            />
            <Button
              onClick={handleEmailAuth}
              isLoading={isLoading}
              fullWidth
              disabled={!email || !password}
            >
              {mode === 'signin' ? 'ログイン' : 'アカウントを作成'}
            </Button>
          </div>

          <p className="mt-4 text-center text-sm text-app-text-muted">
            {mode === 'signin' ? 'アカウントをお持ちでないですか？' : 'すでにアカウントをお持ちですか？'}
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="ml-1 text-app-accent hover:underline"
            >
              {mode === 'signin' ? 'アカウントを作成' : 'ログイン'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
