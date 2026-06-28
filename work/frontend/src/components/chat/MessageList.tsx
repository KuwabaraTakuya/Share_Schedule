import { useEffect, useRef } from 'react'
import { format, isSameDay, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useMessages } from '../../hooks/useMessages'
import { useCommunityStore } from '../../store/community.store'
import { useChannelStore } from '../../store/channel.store'
import { useAuthStore } from '../../store/auth.store'
import MessageItem from './MessageItem'
import LoadingSpinner from '../common/LoadingSpinner'
import type { Message } from '../../types'

interface MessageListProps {
  channelId: string
  communityId: string
}

export default function MessageList({ channelId, communityId }: MessageListProps) {
  const { messages, isLoading, isLoadingMore, hasMore, loadMore } =
    useMessages(channelId)
  const { members } = useCommunityStore()
  const { clearUnread } = useChannelStore()
  const { user } = useAuthStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const communityMembers = members[communityId] || []

  const getMember = (userId: string) =>
    communityMembers.find((m) => m.userId === userId)

  // 新着メッセージで自動スクロール
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
    clearUnread(channelId)
  }, [messages.length, channelId, clearUnread])

  // 上スクロール時に過去メッセージを読み込む
  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return
    if (container.scrollTop < 100 && hasMore && !isLoadingMore) {
      loadMore()
    }
  }

  const groupedMessages = groupMessages(messages)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto py-4"
    >
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <p className="text-4xl mb-4">💬</p>
          <p className="text-app-text-primary font-semibold mb-1">
            まだメッセージがありません
          </p>
          <p className="text-app-text-muted text-sm">
            最初のメッセージを送信してみましょう！
          </p>
        </div>
      )}

      {groupedMessages.map((group) => (
        <div key={group.date}>
          {/* 日付区切り */}
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="flex-1 h-px bg-app-border" />
            <span className="text-xs text-app-text-muted font-medium">
              {format(parseISO(group.date), 'yyyy年M月d日（eee）', { locale: ja })}
            </span>
            <div className="flex-1 h-px bg-app-border" />
          </div>

          {group.messages.map((message, index) => {
            const prevMessage = index > 0 ? group.messages[index - 1] : null
            const showAvatar =
              !prevMessage ||
              prevMessage.userId !== message.userId ||
              new Date(message.createdAt).getTime() -
                new Date(prevMessage.createdAt).getTime() >
                5 * 60 * 1000

            const member = getMember(message.userId)
            const displayName =
              member?.displayName ||
              (message.userId === user?.id ? user.displayName : '不明なユーザー')

            return (
              <MessageItem
                key={message.id}
                message={message}
                showAvatar={showAvatar}
                displayName={displayName}
                avatarUrl={undefined}
              />
            )
          })}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  )
}

function groupMessages(messages: Message[]): {
  date: string
  messages: Message[]
}[] {
  const groups: { date: string; messages: Message[] }[] = []

  for (const message of messages) {
    const dateStr = message.createdAt.split('T')[0]
    const lastGroup = groups[groups.length - 1]

    if (lastGroup && lastGroup.date === dateStr) {
      lastGroup.messages.push(message)
    } else {
      groups.push({ date: dateStr, messages: [message] })
    }
  }

  return groups
}
