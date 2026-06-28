import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  HashtagIcon,
  CalendarDaysIcon,
  PlusIcon,
  SpeakerXMarkIcon,
  VolumeUpIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useChannelStore } from '../../store/channel.store'
import { useAuthStore } from '../../store/auth.store'
import { useCommunityStore } from '../../store/community.store'
import { createChannel, deleteChannel } from '../../api/channels'
import Modal from '../common/Modal'
import Button from '../common/Button'
import ConfirmDialog from '../common/ConfirmDialog'
import type { Channel, NotificationMode } from '../../types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

function SortableChannelItem({
  channel,
  isActive,
  notificationMode,
  unreadCount,
  onClick,
  onDelete,
  onToggleNotification,
  canManage,
}: {
  channel: Channel
  isActive: boolean
  notificationMode: NotificationMode
  unreadCount: number
  onClick: () => void
  onDelete: () => void
  onToggleNotification: () => void
  canManage: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: channel.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const channelName =
    channel.type === 'date' && channel.date
      ? format(new Date(channel.date), 'M月d日（eee）', { locale: ja })
      : channel.name

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between rounded px-2 py-1 cursor-pointer transition-colors ${
        isActive
          ? 'bg-app-surface-hover text-app-text-primary'
          : 'text-app-text-muted hover:bg-app-surface-hover hover:text-app-text-primary'
      }`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {channel.type === 'date' ? (
          <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
        ) : (
          <HashtagIcon className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="truncate text-sm">{channelName}</span>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        {notificationMode === 'muted' && (
          <SpeakerXMarkIcon className="h-3.5 w-3.5" />
        )}
        {unreadCount > 0 && notificationMode !== 'muted' && (
          <span className="rounded-full bg-app-danger px-1.5 py-0.5 text-xs text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {canManage && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="rounded p-0.5 hover:text-app-danger"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

interface ChannelListProps {
  communityId: string
  channels: Channel[]
}

export default function ChannelList({ communityId, channels }: ChannelListProps) {
  const navigate = useNavigate()
  const { channelId } = useParams()
  const { user } = useAuthStore()
  const { members } = useCommunityStore()
  const { channelNotifications, unreadCounts, addChannel, removeChannel, setChannelNotification } =
    useChannelStore()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const communityMembers = members[communityId] || []
  const currentMember = communityMembers.find((m) => m.userId === user?.id)
  const canManage =
    currentMember?.role === 'owner' || currentMember?.role === 'admin'

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return
    setIsCreating(true)
    try {
      const channel = await createChannel(communityId, {
        name: newChannelName.trim(),
        type: 'text',
      })
      addChannel(channel)
      toast.success(`#${channel.name} を作成しました`)
      setIsCreateModalOpen(false)
      setNewChannelName('')
      navigate(`/c/${communityId}/ch/${channel.id}`)
    } catch {
      toast.error('チャンネルの作成に失敗しました')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteChannel = async () => {
    if (!deleteTargetId) return
    setIsDeleting(true)
    try {
      await deleteChannel(deleteTargetId)
      removeChannel(deleteTargetId, communityId)
      toast.success('チャンネルを削除しました')
      if (channelId === deleteTargetId) {
        navigate(`/c/${communityId}`)
      }
    } catch {
      toast.error('チャンネルの削除に失敗しました')
    } finally {
      setIsDeleting(false)
      setDeleteTargetId(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* コミュニティ名 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-app-border">
        <span className="font-semibold text-app-text-primary text-sm truncate">
          {communityMembers.length > 0
            ? 'チャンネル'
            : 'チャンネル'}
        </span>
        {canManage && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-app-text-muted hover:text-app-text-primary"
            title="チャンネルを作成"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* チャンネル一覧 */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {channels.map((channel) => (
          <SortableChannelItem
            key={channel.id}
            channel={channel}
            isActive={channel.id === channelId}
            notificationMode={channelNotifications[channel.id] || 'all'}
            unreadCount={unreadCounts[channel.id] || 0}
            onClick={() => navigate(`/c/${communityId}/ch/${channel.id}`)}
            onDelete={() => setDeleteTargetId(channel.id)}
            onToggleNotification={() => {
              const current = channelNotifications[channel.id] || 'all'
              const next: NotificationMode = current === 'muted' ? 'all' : 'muted'
              setChannelNotification(channel.id, next)
            }}
            canManage={canManage}
          />
        ))}
      </div>

      {/* チャンネル作成モーダル */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="チャンネルを作成"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-app-text-muted">
              チャンネル名
            </label>
            <div className="flex items-center gap-2 rounded bg-app-bg px-3 py-2 border border-app-border focus-within:border-app-accent">
              <HashtagIcon className="h-4 w-4 text-app-text-muted" />
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
                placeholder="チャンネル名"
                className="flex-1 bg-transparent text-app-text-primary placeholder-app-text-muted focus:outline-none"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleCreateChannel}
              isLoading={isCreating}
              disabled={!newChannelName.trim()}
            >
              作成
            </Button>
          </div>
        </div>
      </Modal>

      {/* 削除確認 */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteChannel}
        title="チャンネルを削除"
        message="このチャンネルとすべてのメッセージが削除されます。この操作は元に戻せません。"
        confirmLabel="削除"
        isDangerous
        isLoading={isDeleting}
      />
    </div>
  )
}
