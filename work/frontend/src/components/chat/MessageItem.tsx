import { useState } from 'react'
import {
  PencilIcon,
  TrashIcon,
  FaceSmileIcon,
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/auth.store'
import { editMessage, deleteMessage, addReaction, removeReaction } from '../../api/messages'
import Avatar from '../common/Avatar'
import LocationMessage from '../map/LocationMessage'
import { formatMessageTime, formatFileSize, isImageFile, renderMarkdown, cn } from '../../utils'
import type { Message } from '../../types'
import toast from 'react-hot-toast'
import ReactionPicker from './ReactionPicker'

// src/utils/index.ts からの再エクスポートの代わりに直接インポート
import { formatMessageTime as fmtTime } from '../../utils/date'
import { formatFileSize as fmtSize, isImageFile as isImg, isDangerousFile, cn as cnUtil } from '../../utils/format'
import { renderMarkdown as renderMd } from '../../utils/markdown'

interface MessageItemProps {
  message: Message
  showAvatar: boolean
  displayName: string
  avatarUrl?: string
}

export default function MessageItem({
  message,
  showAvatar,
  displayName,
  avatarUrl,
}: MessageItemProps) {
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isHovered, setIsHovered] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  const isOwn = user?.id === message.userId
  const isDeleted = !!message.deletedAt

  const handleEdit = async () => {
    if (editContent.trim() === message.content) {
      setIsEditing(false)
      return
    }
    try {
      await editMessage(message.id, editContent.trim())
      setIsEditing(false)
    } catch {
      toast.error('メッセージの編集に失敗しました')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMessage(message.id)
    } catch {
      toast.error('メッセージの削除に失敗しました')
    }
  }

  const handleReaction = async (emoji: string) => {
    const hasReacted = (message.reactions[emoji] || []).includes(user?.id || '')
    try {
      if (hasReacted) {
        await removeReaction(message.id, emoji)
      } else {
        await addReaction(message.id, emoji)
      }
    } catch {
      toast.error('リアクションに失敗しました')
    }
    setShowReactionPicker(false)
  }

  if (isDeleted) {
    return (
      <div className="px-4 py-1">
        <span className="text-sm italic text-app-text-muted">
          このメッセージは削除されました
        </span>
      </div>
    )
  }

  return (
    <div
      className={cnUtil(
        'group relative flex gap-4 px-4 py-1 hover:bg-app-surface-hover',
        showAvatar && 'mt-4',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setShowReactionPicker(false)
      }}
    >
      {/* アバター */}
      <div className="w-10 flex-shrink-0">
        {showAvatar ? (
          <Avatar
            userId={message.userId}
            displayName={displayName}
            avatarUrl={avatarUrl}
            size="md"
          />
        ) : null}
      </div>

      {/* コンテンツ */}
      <div className="min-w-0 flex-1">
        {showAvatar && (
          <div className="mb-1 flex items-baseline gap-2">
            <span className="font-medium text-app-text-primary">{displayName}</span>
            <span className="text-xs text-app-text-muted">
              {fmtTime(message.createdAt)}
            </span>
            {message.editedAt && (
              <span className="text-xs text-app-text-muted">(編集済み)</span>
            )}
          </div>
        )}

        {/* メッセージ本文 */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleEdit()
                }
                if (e.key === 'Escape') setIsEditing(false)
              }}
              className="w-full rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary focus:border-app-accent focus:outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 text-xs">
              <button onClick={handleEdit} className="text-app-accent hover:underline">
                保存
              </button>
              <button onClick={() => setIsEditing(false)} className="text-app-text-muted hover:underline">
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.type === 'location' && message.location ? (
              <LocationMessage location={message.location} />
            ) : (
              <div
                className="prose prose-sm max-w-none text-app-text-primary"
                dangerouslySetInnerHTML={{
                  __html: renderMd(message.content),
                }}
              />
            )}
          </>
        )}

        {/* 添付ファイル */}
        {message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, i) => (
              <div key={i}>
                {isImg(attachment.mimeType) ? (
                  <div className="relative">
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="max-h-80 max-w-sm rounded object-contain"
                    />
                    {!attachment.isSafe && (
                      <div className="absolute inset-0 flex items-center justify-center rounded bg-black/60">
                        <div className="flex items-center gap-2 text-app-warning">
                          <ExclamationTriangleIcon className="h-5 w-5" />
                          <span className="text-sm">安全でない可能性があります</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cnUtil(
                      'flex items-center gap-3 rounded border p-3 transition-colors',
                      attachment.isSafe
                        ? 'border-app-border hover:bg-app-surface-hover'
                        : 'border-app-warning bg-app-warning/10',
                    )}
                  >
                    <DocumentIcon className="h-8 w-8 text-app-text-muted" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-app-text-primary">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-app-text-muted">
                        {fmtSize(attachment.size)}
                      </p>
                    </div>
                    {!attachment.isSafe && (
                      <ExclamationTriangleIcon className="h-5 w-5 text-app-warning flex-shrink-0" />
                    )}
                    <ArrowDownTrayIcon className="h-4 w-4 text-app-text-muted flex-shrink-0" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* リアクション */}
        {Object.keys(message.reactions).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(message.reactions).map(([emoji, userIds]) => {
              if (userIds.length === 0) return null
              const hasReacted = userIds.includes(user?.id || '')
              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={cnUtil(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-sm transition-colors',
                    hasReacted
                      ? 'bg-app-accent/20 border border-app-accent text-app-accent'
                      : 'bg-app-surface-hover border border-app-border text-app-text-muted hover:border-app-accent',
                  )}
                >
                  <span>{emoji}</span>
                  <span>{userIds.length}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* アクションメニュー（ホバー時） */}
      {isHovered && !isEditing && (
        <div className="absolute right-4 top-0 flex -translate-y-1/2 items-center gap-1 rounded border border-app-border bg-app-surface px-1 py-0.5 shadow-lg">
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="rounded p-1 text-app-text-muted hover:text-app-text-primary"
            title="リアクション"
          >
            <FaceSmileIcon className="h-4 w-4" />
          </button>
          {isOwn && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="rounded p-1 text-app-text-muted hover:text-app-text-primary"
                title="編集"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="rounded p-1 text-app-text-muted hover:text-app-danger"
                title="削除"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* リアクションピッカー */}
      {showReactionPicker && (
        <div className="absolute right-4 top-8 z-10">
          <ReactionPicker onSelect={handleReaction} />
        </div>
      )}
    </div>
  )
}
