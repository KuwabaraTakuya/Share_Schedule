import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PlusIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useCommunityStore } from '../../store/community.store'
import { useChannelStore } from '../../store/channel.store'
import { useAuthStore } from '../../store/auth.store'
import { useChannels } from '../../hooks/useChannels'
import { useUIStore } from '../../store/ui.store'
import { updateChannelPosition } from '../../api/channels'
import { createCommunity, joinCommunity, generateInviteLink } from '../../api/communities'
import ChannelList from '../chat/ChannelList'
import Modal from './Modal'
import Button from './Button'
import Avatar from './Avatar'
import toast from 'react-hot-toast'

function CommunityIcon({
  community,
  isActive,
  onClick,
}: {
  community: { id: string; name: string; iconUrl?: string }
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={community.name}
      className="group relative flex h-12 w-12 items-center justify-center"
    >
      {isActive && (
        <span className="absolute -left-3 h-8 w-1 rounded-r-full bg-white" />
      )}
      <div className={`flex h-12 w-12 items-center justify-center overflow-hidden transition-all duration-150
        ${isActive ? 'rounded-xl bg-app-accent' : 'rounded-2xl bg-app-surface hover:rounded-xl hover:bg-app-accent'}
      `}>
        {community.iconUrl ? (
          <img src={community.iconUrl} alt={community.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-white">{community.name[0]}</span>
        )}
      </div>
    </button>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { communityId } = useParams()
  const { communities, addCommunity } = useCommunityStore()
  const { channels, reorderChannels } = useChannelStore()
  const { user } = useAuthStore()
  const { setSidebarOpen } = useUIStore()
  const { members } = useCommunityStore()

  // モーダル state
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false)
  const [communityMode, setCommunityMode] = useState<'select' | 'create' | 'join'>('select')
  const [newCommunityName, setNewCommunityName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 招待コード表示モーダル
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useChannels(communityId || null)

  const currentChannels = channels[communityId || ''] || []
  const currentCommunity = communities.find((c) => c.id === communityId)
  const communityMembers = members[communityId || ''] || []
  const currentMember = communityMembers.find((m) => m.userId === user?.id)
  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'admin'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !communityId) return
    const oldIndex = currentChannels.findIndex((c) => c.id === active.id)
    const newIndex = currentChannels.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(currentChannels, oldIndex, newIndex).map((ch, i) => ({ ...ch, position: i }))
    reorderChannels(communityId, reordered)
    try {
      await Promise.all(reordered.map((ch) => updateChannelPosition(ch.id, ch.position)))
    } catch {
      toast.error('並び替えに失敗しました')
    }
  }

  const handleSelectCommunity = (id: string) => {
    navigate(`/c/${id}`)
    setSidebarOpen(false)
  }

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) return
    setIsSubmitting(true)
    try {
      const community = await createCommunity({ name: newCommunityName.trim() })
      addCommunity(community)
      toast.success(`${community.name} を作成しました`)
      setIsCommunityModalOpen(false)
      setNewCommunityName('')
      navigate(`/c/${community.id}`)
    } catch {
      toast.error('コミュニティの作成に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoinCommunity = async () => {
    if (!inviteCode.trim()) return
    setIsSubmitting(true)
    try {
      const community = await joinCommunity(inviteCode.trim())
      addCommunity(community)
      toast.success(`${community.name} に参加しました`)
      setIsCommunityModalOpen(false)
      setInviteCode('')
      navigate(`/c/${community.id}`)
    } catch {
      toast.error('招待コードが無効です')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateInvite = async () => {
    if (!communityId) return
    setIsGenerating(true)
    try {
      const result = await generateInviteLink(communityId)
      setGeneratedCode(result.inviteCode)
      setInviteModalOpen(true)
    } catch {
      toast.error('招待コードの生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  const openCommunityModal = (mode: 'select' | 'create' | 'join') => {
    setCommunityMode(mode)
    setIsCommunityModalOpen(true)
  }

  return (
    <div className="flex h-full">
      {/* コミュニティアイコン列 */}
      <div className="flex w-[72px] flex-col items-center gap-2 overflow-y-auto bg-app-bg py-3 flex-shrink-0">
        {communities.map((community) => (
          <CommunityIcon
            key={community.id}
            community={community}
            isActive={community.id === communityId}
            onClick={() => handleSelectCommunity(community.id)}
          />
        ))}
        <div className="my-1 h-px w-8 bg-app-border" />
        {/* 作成ボタン */}
        <button
          onClick={() => openCommunityModal('create')}
          title="グループを作成"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-app-surface text-app-success hover:rounded-xl hover:bg-app-success hover:text-white transition-all duration-150"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
        {/* 参加ボタン */}
        <button
          onClick={() => openCommunityModal('join')}
          title="招待コードで参加"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-app-surface text-app-accent hover:rounded-xl hover:bg-app-accent hover:text-white transition-all duration-150"
        >
          <LinkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* チャンネルパネル */}
      {communityId && currentCommunity ? (
        <div className="flex flex-1 flex-col bg-app-surface overflow-hidden">
          {/* コミュニティ名ヘッダー */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-app-border shadow-sm">
            <span className="font-semibold text-app-text-primary text-sm truncate">
              {currentCommunity.name}
            </span>
            {canManage && (
              <button
                onClick={handleGenerateInvite}
                title="招待コードを生成"
                disabled={isGenerating}
                className="text-app-text-muted hover:text-app-text-primary transition-colors"
              >
                <Cog6ToothIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* カレンダーへのリンク */}
          <button
            onClick={() => { navigate(`/c/${communityId}`); setSidebarOpen(false) }}
            className="flex items-center gap-2 px-3 py-2 mx-2 mt-2 rounded text-sm text-app-text-muted hover:bg-app-surface-hover hover:text-app-text-primary transition-colors"
          >
            <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
            <span>カレンダー</span>
          </button>

          {/* 招待ボタン（メンバー全員） */}
          {canManage && (
            <button
              onClick={handleGenerateInvite}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-2 mx-2 mb-1 rounded text-sm text-app-text-muted hover:bg-app-surface-hover hover:text-app-text-primary transition-colors"
            >
              <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
              <span>招待コードを発行</span>
            </button>
          )}

          <div className="h-px bg-app-border mx-2 mb-1" />

          {/* チャンネル一覧 */}
          <div className="flex-1 overflow-hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={currentChannels.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <ChannelList communityId={communityId} channels={currentChannels} />
              </SortableContext>
            </DndContext>
          </div>

          {/* ユーザーパネル */}
          <div className="border-t border-app-border px-2 py-2 bg-app-bg/50">
            <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-app-surface-hover cursor-pointer">
              <Avatar userId={user?.id || ''} name={user?.displayName || ''} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-app-text-primary truncate">
                  {user?.displayName}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col bg-app-surface items-center justify-center gap-3 text-center px-4">
          <p className="text-app-text-muted text-sm">グループを選択してください</p>
          <button
            onClick={() => openCommunityModal('select')}
            className="text-xs text-app-accent hover:underline"
          >
            + 作成 / 参加
          </button>
        </div>
      )}

      {/* グループ作成・参加モーダル */}
      <Modal
        isOpen={isCommunityModalOpen}
        onClose={() => { setIsCommunityModalOpen(false); setCommunityMode('select') }}
        title={communityMode === 'create' ? 'グループを作成' : communityMode === 'join' ? '招待コードで参加' : 'グループ'}
        size="sm"
      >
        {communityMode === 'select' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCommunityMode('create')}
              className="flex flex-col items-center gap-2 rounded-lg border border-app-border p-4 hover:border-app-accent hover:bg-app-surface-hover transition-colors"
            >
              <PlusIcon className="h-8 w-8 text-app-success" />
              <span className="text-sm font-medium text-app-text-primary">作成する</span>
            </button>
            <button
              onClick={() => setCommunityMode('join')}
              className="flex flex-col items-center gap-2 rounded-lg border border-app-border p-4 hover:border-app-accent hover:bg-app-surface-hover transition-colors"
            >
              <LinkIcon className="h-8 w-8 text-app-accent" />
              <span className="text-sm font-medium text-app-text-primary">参加する</span>
            </button>
          </div>
        )}

        {communityMode === 'create' && (
          <div className="space-y-4">
            <input
              type="text"
              value={newCommunityName}
              onChange={(e) => setNewCommunityName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCommunity()}
              placeholder="グループ名（例: 友達グループ）"
              className="w-full rounded border border-app-border bg-app-bg px-3 py-2 text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setCommunityMode('select')}>戻る</Button>
              <Button onClick={handleCreateCommunity} isLoading={isSubmitting} disabled={!newCommunityName.trim()}>
                作成
              </Button>
            </div>
          </div>
        )}

        {communityMode === 'join' && (
          <div className="space-y-4">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinCommunity()}
              placeholder="招待コードを入力"
              className="w-full rounded border border-app-border bg-app-bg px-3 py-2 text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none font-mono tracking-wider"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setCommunityMode('select')}>戻る</Button>
              <Button onClick={handleJoinCommunity} isLoading={isSubmitting} disabled={!inviteCode.trim()}>
                参加
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 招待コード表示モーダル */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="招待コード"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-app-text-muted">
            このコードを招待したい相手に共有してください。
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-app-border bg-app-bg px-4 py-3">
            <span className="flex-1 font-mono text-xl font-bold tracking-[0.3em] text-app-text-primary text-center">
              {generatedCode}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedCode)
                toast.success('コピーしました')
              }}
              className="text-app-text-muted hover:text-app-accent transition-colors"
              title="コピー"
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-app-text-muted text-center">
            ※ 新しいコードを発行すると古いコードは無効になります
          </p>
          <Button className="w-full" onClick={() => setInviteModalOpen(false)}>
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  )
}
