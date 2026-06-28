import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarDaysIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useCommunityStore } from '../../store/community.store'
import { useChannelStore } from '../../store/channel.store'
import { useAuthStore } from '../../store/auth.store'
import { createChannel } from '../../api/channels'
import AvailabilityBadge from './AvailabilityBadge'
import Avatar from '../common/Avatar'
import Button from '../common/Button'
import type { DayAvailability, CalendarEvent, Channel } from '../../types'
import toast from 'react-hot-toast'

interface DayDetailPanelProps {
  date: string
  communityId: string
  availability?: DayAvailability
  events: CalendarEvent[]
  dateChannels: Channel[]
  onClose: () => void
}

export default function DayDetailPanel({
  date,
  communityId,
  availability,
  events,
  dateChannels,
  onClose,
}: DayDetailPanelProps) {
  const navigate = useNavigate()
  const { members } = useCommunityStore()
  const { addChannel } = useChannelStore()
  const { user } = useAuthStore()
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)

  const communityMembers = members[communityId] || []

  const parsedDate = parseISO(date)
  const dateLabel = format(parsedDate, 'M月d日（eee）', { locale: ja })

  const handleCreateDateChannel = async () => {
    setIsCreatingChannel(true)
    try {
      const channelName = format(parsedDate, 'yyyy-MM-dd')
      const channel = await createChannel(communityId, {
        name: channelName,
        type: 'date',
        date,
      })
      addChannel(channel)
      toast.success(`${dateLabel}のチャンネルを作成しました`)
      navigate(`/c/${communityId}/ch/${channel.id}`)
      onClose()
    } catch {
      toast.error('チャンネルの作成に失敗しました')
    } finally {
      setIsCreatingChannel(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-app-border">
        <div>
          <h3 className="font-semibold text-app-text-primary">{dateLabel}</h3>
          {availability && (
            <div className="mt-1">
              <AvailabilityBadge availability={availability} />
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-app-text-muted hover:text-app-text-primary"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 日付チャンネル */}
        <div>
          <h4 className="text-xs font-medium text-app-text-muted uppercase tracking-wide mb-2">
            チャンネル
          </h4>
          {dateChannels.length > 0 ? (
            <div className="space-y-1">
              {dateChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    navigate(`/c/${communityId}/ch/${channel.id}`)
                    onClose()
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-app-text-muted hover:bg-app-surface-hover hover:text-app-text-primary"
                >
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>{dateLabel}について話す</span>
                </button>
              ))}
            </div>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCreateDateChannel}
              isLoading={isCreatingChannel}
              fullWidth
            >
              <PlusIcon className="h-4 w-4" />
              {dateLabel}のチャンネルを作成
            </Button>
          )}
        </div>

        {/* メンバーの予定 */}
        <div>
          <h4 className="text-xs font-medium text-app-text-muted uppercase tracking-wide mb-2">
            予定
          </h4>
          {events.length === 0 ? (
            <p className="text-sm text-app-text-muted">
              共有された予定はありません
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => {
                const member = communityMembers.find(
                  (m) => m.userId === event.userId,
                )
                const isOwn = event.userId === user?.id
                const displayName = isOwn
                  ? 'あなた'
                  : member?.displayName || '不明'

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-2 rounded border border-app-border p-2"
                  >
                    <Avatar
                      userId={event.userId}
                      displayName={displayName}
                      size="xs"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-app-text-primary truncate">
                          {event.title}
                        </span>
                      </div>
                      <p className="text-xs text-app-text-muted">
                        {event.isAllDay
                          ? '終日'
                          : `${format(parseISO(event.startTime), 'HH:mm')} - ${format(parseISO(event.endTime), 'HH:mm')}`}
                      </p>
                      {!isOwn && (
                        <p className="text-xs text-app-text-muted">{displayName}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
