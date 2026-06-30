import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserGroupIcon, LinkIcon } from '@heroicons/react/24/outline'
import { createCommunity, joinCommunity } from '../api/communities'
import { useCommunityStore } from '../store/community.store'
import toast from 'react-hot-toast'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { addCommunity } = useCommunityStore()
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [communityName, setCommunityName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async () => {
    if (!communityName.trim()) return
    setIsLoading(true)
    try {
      const community = await createCommunity({ name: communityName.trim() })
      addCommunity(community)
      toast.success(`${community.name} を作成しました`)
      navigate(`/c/${community.id}`)
    } catch {
      toast.error('コミュニティの作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) return
    setIsLoading(true)
    try {
      const community = await joinCommunity(inviteCode.trim())
      addCommunity(community)
      toast.success(`${community.name} に参加しました`)
      navigate(`/c/${community.id}`)
    } catch {
      toast.error('招待コードが無効です')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-app-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">📅</div>
          <h1 className="text-2xl font-bold text-app-text-primary">ShareSchedule へようこそ</h1>
          <p className="mt-2 text-app-text-muted">
            グループを作成するか、招待コードで参加しましょう
          </p>
        </div>

        {mode === 'select' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('create')}
              className="flex flex-col items-center gap-3 rounded-xl border border-app-border bg-app-surface p-6 hover:border-app-accent hover:bg-app-surface-hover transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-accent/20">
                <UserGroupIcon className="h-6 w-6 text-app-accent" />
              </div>
              <div>
                <p className="font-semibold text-app-text-primary">作成する</p>
                <p className="text-xs text-app-text-muted">新しいグループ</p>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="flex flex-col items-center gap-3 rounded-xl border border-app-border bg-app-surface p-6 hover:border-app-accent hover:bg-app-surface-hover transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-success/20">
                <LinkIcon className="h-6 w-6 text-app-success" />
              </div>
              <div>
                <p className="font-semibold text-app-text-primary">参加する</p>
                <p className="text-xs text-app-text-muted">招待コードで</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="rounded-xl border border-app-border bg-app-surface p-6 space-y-4">
            <h2 className="font-semibold text-app-text-primary">グループを作成</h2>
            <input
              type="text"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="グループ名（例: 友達グループ）"
              className="w-full rounded-lg border border-app-border bg-app-bg px-4 py-3 text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setMode('select')}
                className="flex-1 rounded-lg border border-app-border py-2.5 text-sm text-app-text-muted hover:bg-app-surface-hover"
              >
                戻る
              </button>
              <button
                onClick={handleCreate}
                disabled={!communityName.trim() || isLoading}
                className="flex-1 rounded-lg bg-app-accent py-2.5 text-sm font-medium text-white hover:bg-app-accent-hover disabled:opacity-50"
              >
                {isLoading ? '作成中...' : '作成'}
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="rounded-xl border border-app-border bg-app-surface p-6 space-y-4">
            <h2 className="font-semibold text-app-text-primary">招待コードで参加</h2>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="招待コードを入力"
              className="w-full rounded-lg border border-app-border bg-app-bg px-4 py-3 text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none font-mono tracking-wider"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setMode('select')}
                className="flex-1 rounded-lg border border-app-border py-2.5 text-sm text-app-text-muted hover:bg-app-surface-hover"
              >
                戻る
              </button>
              <button
                onClick={handleJoin}
                disabled={!inviteCode.trim() || isLoading}
                className="flex-1 rounded-lg bg-app-success py-2.5 text-sm font-medium text-white hover:bg-app-success/80 disabled:opacity-50"
              >
                {isLoading ? '参加中...' : '参加'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
